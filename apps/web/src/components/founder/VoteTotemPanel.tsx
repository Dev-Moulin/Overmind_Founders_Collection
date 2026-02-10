/**
 * VoteTotemPanel - Right panel for voting action
 *
 * Simplified vote panel focusing on the action:
 * - Selected totem display
 * - Predicate selector
 * - Amount input with presets
 * - FOR/AGAINST toggle
 * - Add to cart or direct vote
 *
 * @see Phase 9 in TODO_Implementation.md
 */

import { useState, useEffect, useMemo, useRef } from 'react';
import { useAccount, useBalance } from 'wagmi';
import { useQuery } from '@apollo/client';
import { useTranslation } from 'react-i18next';
import type { Hex, Address } from 'viem';
import { formatEther } from 'viem';
import { truncateAmount } from '../../utils/formatters';
import type { FounderForHomePage } from '../../hooks';
import {
  useProtocolConfig,
  CURVE_LINEAR,
  CURVE_PROGRESSIVE,
  type CurveId,
  useCurveAvailability,
  usePredicateBlocking,
  useDirectionChange,
  useMinRequired,
  useFormSteps,
  useAddToCart,
  useWithdrawMultiple,
  useCrossPredicateRedeem,
  useAllUserPositions,
  usePositionDisplay,
  useAutoSelectPosition,
} from '../../hooks';
import { useVoteCartContext } from '../../hooks/cart/useVoteCart';
import { useProactiveClaimCheck } from '../../hooks';
import { usePositionBothSides } from '../../hooks/blockchain/vault/usePositionFromContract';
import { useWithdraw } from '../../hooks/blockchain/vault/useWithdraw';
import { useUserVotesForFounder } from '../../hooks/data/useUserVotesForFounder';
import { GET_ATOMS_BY_LABELS } from '../../lib/graphql/queries';
import { PresetButtonsCompact } from '../vote/PresetButtons';
import predicatesData from '../../../../../packages/shared/src/data/predicates.json';
import type { Predicate } from '../../types/predicate';
import type { NewTotemData } from './TotemCreationForm';
import { WithdrawOnlyPanel, type WithdrawRequest } from './VoteTotemPanel/WithdrawOnlyPanel';
import { CrossPredicatePopup, type CrossPredicateRedeemInfo } from './VoteTotemPanel/CrossPredicatePopup';
import {
  DirectionChangeSection,
  PendingRedeemMessage,
  PendingRedeemBothMessage,
  type DirectionChangeInfo as DirectionChangeInfoType,
  type PendingRedeemInfo as PendingRedeemInfoType,
  type PendingRedeemBothInfo as PendingRedeemBothInfoType,
} from './VoteTotemPanel/DirectionChangeAlert';
import { CurveSelector } from './VoteTotemPanel/CurveSelector';
import { NeedsRedeemAlert } from './VoteTotemPanel/NeedsRedeemAlert';
import { TripleHeader } from './VoteTotemPanel/TripleHeader';
import { PredicateSelector } from './VoteTotemPanel/PredicateSelector';
import { DirectionSelector } from './VoteTotemPanel/DirectionSelector';
import { CurrentPositionCard } from './VoteTotemPanel/CurrentPositionCard';
import { VotePreview } from './VoteTotemPanel/VotePreview';
import { ProgressiveInitMessage } from './VoteTotemPanel/ProgressiveInitMessage';

interface VoteTotemPanelProps {
  founder: FounderForHomePage;
  selectedTotemId?: string;
  selectedTotemLabel?: string;
  /** Data for a new totem being created (from TotemCreationForm) */
  newTotemData?: NewTotemData | null;
  onClearSelection?: () => void;
  onOpenCart?: () => void;
  /** Callback when user's position is detected - helps sync curve filter in parent */
  onUserPositionDetected?: (position: { direction: 'for' | 'against'; curveId: CurveId } | null) => void;
  /** Trigger to refetch positions (increment to refetch) */
  refetchTrigger?: number;
  /** Callback to trigger global refetch (center panel, etc.) after withdraw/redeem */
  onRefetch?: () => void;
}

export function VoteTotemPanel({
  founder,
  selectedTotemId,
  selectedTotemLabel,
  newTotemData,
  onOpenCart,
  onUserPositionDetected,
  refetchTrigger,
  onRefetch,
}: VoteTotemPanelProps) {
  const { t } = useTranslation();
  const { isConnected, address } = useAccount();
  const predicates = predicatesData as Predicate[];

  const { config: protocolConfig, loading: configLoading, isDepositValid } = useProtocolConfig();
  const { data: balanceData } = useBalance({ address });

  const {
    cart,
    itemCount,
    formattedNetCost,
    addItem,
    totalItemCount, // Total across ALL founders
  } = useVoteCartContext();
  // Note: initCart is called by FounderExpandedView which provides the context

  // ============================================
  // ANIMATION SIMPLIFIÉE
  // ============================================
  //
  // BOUTON PANIER:
  //   - Visible si itemCount > 0 (simple, pas de séquençage compliqué)
  //   - Flash vert quand on ajoute un nouvel item
  //
  // CONTENU:
  //   - Se décale vers le bas quand il y a une popup (success/error)
  //   - Remonte quand la popup disparaît
  // ============================================

  // État: flash vert quand on ajoute un item
  const [cartItemAdded, setCartItemAdded] = useState(false);

  // État: le bouton vient d'apparaître (pour animation d'entrée)
  const [cartButtonJustAppeared, setCartButtonJustAppeared] = useState(false);

  // Référence pour détecter les changements de itemCount
  const prevItemCountRef = useRef(itemCount);
  const prevTotalCountRef = useRef(totalItemCount);

  // Combined count: show button if ANY votes exist (current founder or others)
  const hasAnyVotes = itemCount > 0 || totalItemCount > 0;

  // EFFET: Détecte quand le bouton doit apparaître (itemCount ou totalItemCount passe de 0 à >0)
  useEffect(() => {
    const prevCount = prevItemCountRef.current;
    const prevTotalCount = prevTotalCountRef.current;
    const hadVotes = prevCount > 0 || prevTotalCount > 0;

    if (hasAnyVotes && !hadVotes) {
      // Le panier passe de vide à non-vide → le bouton apparaît avec animation
      setCartButtonJustAppeared(true);
      setCartItemAdded(true); // Flash vert aussi

      // Après 2s, les animations sont finies
      const timer = setTimeout(() => {
        setCartButtonJustAppeared(false);
        setCartItemAdded(false);
      }, 2000);

      prevItemCountRef.current = itemCount;
      prevTotalCountRef.current = totalItemCount;
      return () => clearTimeout(timer);
    }

    // Si itemCount augmente et le bouton existe déjà → juste le flash vert
    if (itemCount > prevCount && hadVotes) {
      setCartItemAdded(true);
      const timer = setTimeout(() => setCartItemAdded(false), 2000);
      prevItemCountRef.current = itemCount;
      prevTotalCountRef.current = totalItemCount;
      return () => clearTimeout(timer);
    }

    prevItemCountRef.current = itemCount;
    prevTotalCountRef.current = totalItemCount;
  }, [itemCount, totalItemCount, hasAnyVotes]);

  // Get user's existing votes for this founder (to detect if totem has votes)
  const { votes: userVotesForFounder } = useUserVotesForFounder(address, founder.name);

  // Fetch predicate atomIds from chain
  const predicateLabels = predicates.map(p => p.label);
  const { data: predicatesAtomData } = useQuery<{ atoms: Array<{ term_id: string; label: string }> }>(
    GET_ATOMS_BY_LABELS,
    {
      variables: { labels: predicateLabels },
      fetchPolicy: 'cache-first',
    }
  );

  // Map predicates with their atomIds
  const predicatesWithAtomIds = useMemo(() => {
    if (!predicatesAtomData?.atoms) return predicates.map(p => ({ ...p, atomId: null, isOnChain: false }));

    const atomIdMap = new Map<string, string>();
    predicatesAtomData.atoms.forEach((atom) => {
      atomIdMap.set(atom.label, atom.term_id);
    });

    return predicates.map(p => ({
      ...p,
      atomId: atomIdMap.get(p.label) || null,
      isOnChain: atomIdMap.has(p.label),
    }));
  }, [predicates, predicatesAtomData]);

  // Form state - Nothing pre-selected to enable pulsation on current step
  const [selectedPredicateId, setSelectedPredicateId] = useState<string>(''); // Empty = not selected
  const [operationMode, setOperationMode] = useState<'deposit' | 'redeem'>('deposit');
  const [voteDirection, setVoteDirection] = useState<'for' | 'against' | 'withdraw' | null>(null); // null = not selected
  const [selectedCurve, setSelectedCurve] = useState<CurveId | null>(null); // null = not selected
  const [trustAmount, setTrustAmount] = useState<string>('');
  const [success, setSuccess] = useState<string | null>(null);
  const [_error, setError] = useState<string | null>(null); // _error non utilisé pour le moment (popup simplifiée)

  // State for Redeem button highlight (triggered when hovering blocked Oppose)
  const [isRedeemHighlighted, setIsRedeemHighlighted] = useState(false);

  // ============================================
  // POPUP "ADDED TO CART" - Simple et efficace
  // ============================================
  // Apparaît à gauche du bouton panier avec translation horizontale
  // - Entrée: slide de droite à gauche (1s) avec rebond
  // - Reste visible 3s
  // - Sortie: slide de gauche à droite (1s) avec rebond inverse
  // ============================================

  // État de la popup: 'entering' | 'visible' | 'exiting' | null
  const [addedToCartState, setAddedToCartState] = useState<'entering' | 'visible' | 'exiting' | null>(null);

  // Key pour forcer le remount et relancer les animations
  const [addedToCartKey, setAddedToCartKey] = useState(0);

  // Timer ref pour pouvoir annuler
  const addedToCartTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Quand success change (item ajouté au panier), afficher la popup
  useEffect(() => {
    if (success) {
      // Annuler le timer précédent si existe
      if (addedToCartTimerRef.current) {
        clearTimeout(addedToCartTimerRef.current);
      }

      // Démarrer la séquence
      setAddedToCartKey(k => k + 1); // Force remount pour relancer l'animation
      setAddedToCartState('entering');

      // Après 1s (fin animation entrée), passer en visible
      const t1 = setTimeout(() => {
        setAddedToCartState('visible');

        // Après 3s d'affichage, commencer la sortie
        const t2 = setTimeout(() => {
          setAddedToCartState('exiting');

          // Après 1s (fin animation sortie), nettoyer
          const t3 = setTimeout(() => {
            setAddedToCartState(null);
            setSuccess(null);
          }, 1000);
          addedToCartTimerRef.current = t3;
        }, 3000);
        addedToCartTimerRef.current = t2;
      }, 1000);
      addedToCartTimerRef.current = t1;
    }
  }, [success]);

  // Pour les erreurs, on les affiche simplement sans animation complexe
  // (on peut améliorer plus tard si besoin)

  // Sync voteDirection with operationMode
  // Note: We intentionally exclude voteDirection from deps to avoid infinite loops
  // This effect only needs to run when operationMode changes
  useEffect(() => {
    if (operationMode === 'redeem') {
      setVoteDirection('withdraw');
    } else {
      // Reset to 'for' when switching back to deposit (only if currently 'withdraw')
      setVoteDirection(prev => prev === 'withdraw' ? 'for' : prev);
    }
  }, [operationMode]);

  // Handle totem change - pre-select predicate if user has existing votes, otherwise reset
  const prevTotemIdRef = useRef<string | undefined>(undefined);
  useEffect(() => {
    // Process when totem changes (including first selection from undefined to a totemId)
    // Skip only if totem hasn't changed at all
    if (prevTotemIdRef.current === selectedTotemId) {
      return; // No change, skip
    }

    // Check if user has existing votes on the newly selected totem
    const existingVote = selectedTotemId
      ? userVotesForFounder.find(v => v.term?.object?.term_id === selectedTotemId)
      : null;

    if (existingVote) {
      // User has a vote on this totem → pre-select the predicate
      // The rest (direction, curve) will be handled by auto-select effects
      const matchingPredicate = predicates.find(p => p.label === existingVote.term?.predicate?.label);
      if (matchingPredicate) {
        setSelectedPredicateId(matchingPredicate.id);
        // Skip to step 3 since we have all info from existing vote
        prevFormStepRef.current = 3;
      }
      // Clear errors/success but keep amount for potential modification
      setError(null);
      setSuccess(null);
    } else if (prevTotemIdRef.current !== undefined) {
      // No existing vote AND not first mount → reset all form fields
      // (On first mount, we don't reset because nothing was selected yet)
      setSelectedPredicateId('');
      setVoteDirection(null);
      setSelectedCurve(null);
      setTrustAmount('');
      setError(null);
      setSuccess(null);
      // Reset step ref for animations (totem selected but predicate not)
      prevFormStepRef.current = 0;
    }

    prevTotemIdRef.current = selectedTotemId;
  }, [selectedTotemId, userVotesForFounder, predicates]);

  const selectedPredicate = useMemo(
    () => predicates.find((p) => p.id === selectedPredicateId),
    [predicates, selectedPredicateId]
  );

  // Get selected predicate with atomId
  const selectedPredicateWithAtom = useMemo(
    () => predicatesWithAtomIds.find((p) => p.id === selectedPredicateId),
    [predicatesWithAtomIds, selectedPredicateId]
  );

  // Get totem info (image, emoji) from user votes if available
  const selectedTotemInfo = useMemo(() => {
    if (!selectedTotemId) return null;
    const vote = userVotesForFounder.find(v => v.term?.object?.term_id === selectedTotemId);
    if (vote?.term?.object) {
      return {
        image: vote.term.object.image,
        emoji: vote.term.object.emoji,
        label: vote.term.object.label,
      };
    }
    return null;
  }, [selectedTotemId, userVotesForFounder]);

  // Check if triple already exists (to get termId/counterTermId)
  const {
    proactiveClaimInfo,
    isLoading: claimCheckLoading,
  } = useProactiveClaimCheck({
    founderAtomId: founder.atomId,
    selectedPredicateWithAtom,
    selectedTotemId: selectedTotemId || '',
    totemMode: 'existing', // VoteTotemPanel only handles existing totems
  });

  // Compute if this is a new triple (no proactiveClaimInfo means triple doesn't exist yet)
  // IMPORTANT: Wait for loading to complete before determining - assume existing during loading
  const isNewTotem = !claimCheckLoading && !proactiveClaimInfo;

  // Check user's position on this triple (FOR and AGAINST sides)
  // Now checks BOTH Linear and Progressive curves
  const {
    forShares,
    againstShares,
    hasAnyPosition,
    positionDirection,
    positionCurveId,
    // Per-curve position flags for INTUITION rules
    hasForPositionLinear,
    hasForPositionProgressive,
    hasAgainstPositionLinear,
    hasAgainstPositionProgressive,
    // Per-curve shares (for position display)
    forSharesLinear,
    forSharesProgressive,
    againstSharesLinear,
    againstSharesProgressive,
    isLoading: positionLoading,
    refetch: refetchPosition,
  } = usePositionBothSides(
    address as Address | undefined,
    proactiveClaimInfo?.termId as Hex | undefined,
    proactiveClaimInfo?.counterTermId as Hex | undefined
  );

  // Form step management (extracted hook)
  // NOTE: Must be called AFTER usePositionBothSides because it needs hasAnyPosition
  const {
    currentFormStep,
    getBlurClass,
    getPulseClass,
    prevFormStepRef,
  } = useFormSteps({
    selectedTotemId,
    newTotemData,
    selectedPredicateId,
    operationMode,
    voteDirection,
    selectedCurve,
    hasAnyPosition,
  });

  // Refetch positions when refetchTrigger changes (after cart validation)
  useEffect(() => {
    if (refetchTrigger && refetchTrigger > 0) {
      console.log('[VoteTotemPanel] Refetching positions due to trigger:', refetchTrigger);
      refetchPosition();
    }
  }, [refetchTrigger, refetchPosition]);

  // INTUITION curve availability rules (extracted hook)
  const curveAvailability = useCurveAvailability({
    voteDirection,
    hasForPositionLinear,
    hasForPositionProgressive,
    hasAgainstPositionLinear,
    hasAgainstPositionProgressive,
    cart,
    selectedTotemId,
  });

  // Withdraw hook
  const {
    withdraw,
    isLoading: withdrawLoading,
    reset: resetWithdraw,
  } = useWithdraw();

  // Auto-select direction and curve based on user's position (extracted hook)
  useAutoSelectPosition({
    positionLoading,
    hasAnyPosition,
    positionDirection,
    positionCurveId,
    voteDirection,
    curveAvailability,
    selectedTotemId,
    setVoteDirection,
    setSelectedCurve,
    setOperationMode,
    onUserPositionDetected,
  });

  // Minimum required amount calculation (extracted hook)
  const { minRequiredExact, minRequiredDisplay } = useMinRequired({
    protocolConfig,
    isNewTotem,
    newTotemData,
  });

  // Calculate if user needs to redeem before voting
  // TRUE only if: user has OPPOSITE position on the SELECTED curve
  // Note: With curveAvailability blocking, this should rarely be true
  // because blocked curves cannot be selected. But we keep this as a safety check.
  const needsRedeemBeforeVote = useMemo(() => {
    if (voteDirection === 'withdraw') return false;

    // Check if we have an OPPOSITE position on the SELECTED curve
    if (voteDirection === 'for') {
      // I want Support - check if I have Oppose on the selected curve
      if (selectedCurve === CURVE_LINEAR && hasAgainstPositionLinear) return true;
      if (selectedCurve === CURVE_PROGRESSIVE && hasAgainstPositionProgressive) return true;
    }

    if (voteDirection === 'against') {
      // I want Oppose - check if I have Support on the selected curve
      if (selectedCurve === CURVE_LINEAR && hasForPositionLinear) return true;
      if (selectedCurve === CURVE_PROGRESSIVE && hasForPositionProgressive) return true;
    }

    return false;
  }, [voteDirection, selectedCurve, hasForPositionLinear, hasForPositionProgressive, hasAgainstPositionLinear, hasAgainstPositionProgressive]);

  // CONSOLIDATED: Single useEffect to manage trustAmount minimum
  // This replaces 4 separate effects that could cause re-render cascades
  // The exact value will be auto-adjusted in useBatchVote when sending to contract
  useEffect(() => {
    if (!minRequiredDisplay) return;

    // Case 1: Initialize empty amount
    if (trustAmount === '') {
      setTrustAmount(minRequiredDisplay);
      return;
    }

    // Case 2: Update if below minimum (covers totem change, new totem creation, etc.)
    const currentAmount = parseFloat(trustAmount || '0');
    const minAmount = parseFloat(minRequiredDisplay);
    if (currentAmount < minAmount) {
      setTrustAmount(minRequiredDisplay);
    }
  }, [minRequiredDisplay, selectedTotemId, selectedPredicateId, newTotemData]);

  // Determine if we're working with a new totem (creation) or existing totem
  const isCreatingNewTotem = !!newTotemData;
  const effectiveTotemName = newTotemData?.name || selectedTotemLabel || '';

  // RÈGLE PROTOCOLE INTUITION: Si tu CRÉES un triple → tu DOIS voter FOR
  // AGAINST n'est possible QUE sur des triples QUI EXISTENT DÉJÀ
  // isNewTotem = triple doesn't exist yet, isCreatingNewTotem = user is creating a brand new totem
  const isOpposeBlockedByProtocol = isNewTotem || isCreatingNewTotem;

  // RÈGLE UX: Si l'utilisateur est le SEUL votant FOR, il ne peut pas voter AGAINST
  // Car voter AGAINST contre soi-même n'a pas de sens. Il peut seulement retirer sa position.
  // On compare SHARES avec SHARES (pas assets)
  // Note: On utilise une marge de 99% car il peut y avoir des frais de protocole qui créent une légère différence
  const userTotalForShares = forSharesLinear + forSharesProgressive;
  const tripleTotalForShares = BigInt(proactiveClaimInfo?.forTotalShares || '0');
  // Si l'utilisateur a >= 99% des shares FOR, on considère qu'il est le seul votant significatif
  const isSoleForVoterRaw = tripleTotalForShares > 0n && userTotalForShares > 0n &&
    (userTotalForShares * 100n / tripleTotalForShares >= 99n);
  // With independent curves: only block Oppose if user has FOR on BOTH curves
  // If user has FOR only on Linear, Oppose Progressive is legitimate (different vault)
  const isSoleForVoter = isSoleForVoterRaw && hasForPositionLinear && hasForPositionProgressive;

  // DEBUG: Log pour vérifier les valeurs (temporaire) - se déclenche quand les données changent
  useEffect(() => {
    if (proactiveClaimInfo?.forTotalShares && userTotalForShares > 0n) {
      const percentage = tripleTotalForShares > 0n
        ? Number(userTotalForShares * 100n / tripleTotalForShares)
        : 0;
      console.log('[VoteTotemPanel] isSoleForVoter check:', {
        userTotalForShares: userTotalForShares.toString(),
        tripleTotalForShares: tripleTotalForShares.toString(),
        percentage: `${percentage}%`,
        isSoleForVoterRaw,
        isSoleForVoter,
        hasForPositionLinear,
        hasForPositionProgressive,
      });
    }
  }, [userTotalForShares, tripleTotalForShares, proactiveClaimInfo?.forTotalShares, isSoleForVoter]);

  const isFormValid = useMemo(() => {
    // Must have either an existing totem selected OR new totem data
    if (!selectedTotemId && !newTotemData) return false;
    if (!selectedPredicateId) return false;
    if (!trustAmount || parseFloat(trustAmount) <= 0) return false;
    if (!isDepositValid(trustAmount)) return false;
    if (voteDirection === 'withdraw') return true; // Withdraw doesn't need predicate atomId
    // For deposit mode, need direction, curve, and predicate atomId
    if (!voteDirection) return false; // Direction must be selected
    if (!selectedCurve) return false; // Curve must be selected
    if (!selectedPredicateWithAtom?.atomId) return false; // Need predicate atomId for votes
    return true;
  }, [selectedTotemId, newTotemData, selectedPredicateId, trustAmount, isDepositValid, voteDirection, selectedCurve, selectedPredicateWithAtom]);

  // Get current user shares based on position direction
  const currentUserShares = positionDirection === 'for' ? forShares : againstShares;

  // Estimate recoverable amount from existing position (for display)
  const estimatedRecoverable = useMemo(() => {
    if (!needsRedeemBeforeVote || !currentUserShares || currentUserShares === 0n) return null;
    if (!protocolConfig) return null;

    const positionValue = parseFloat(formatEther(currentUserShares));
    const exitFeePercent = Number(protocolConfig.exitFee) / Number(protocolConfig.feeDenominator);
    const recoverable = positionValue * (1 - exitFeePercent);
    return {
      gross: truncateAmount(positionValue),
      net: truncateAmount(recoverable),
      feePercent: truncateAmount(exitFeePercent * 100, 1),
    };
  }, [needsRedeemBeforeVote, currentUserShares, protocolConfig]);

  // Format current position amount for display
  const formattedCurrentPosition = useMemo(() => {
    if (!currentUserShares || currentUserShares === 0n) return '0';
    return truncateAmount(formatEther(currentUserShares));
  }, [currentUserShares]);

  // Position display calculations (extracted hook)
  const { selectedCombinationPosition, pendingCartAmount } = usePositionDisplay({
    voteDirection,
    selectedCurve,
    selectedTotemId,
    cart,
    forSharesLinear,
    forSharesProgressive,
    againstSharesLinear,
    againstSharesProgressive,
  });

  // Cross-predicate blocking (extracted hook)
  const {
    votesOnTotemByPredicate,
    isPredicateBlocked,
    getVotesToRedeem,
  } = usePredicateBlocking({
    selectedTotemId,
    userVotesForFounder,
  });

  // State for cross-predicate popup
  const [showCrossPredicatePopup, setShowCrossPredicatePopup] = useState(false);
  const [pendingPredicateId, setPendingPredicateId] = useState<string | null>(null);

  // Get redeem info for pending predicate
  const pendingPredicateLabel = pendingPredicateId
    ? predicates.find(p => p.id === pendingPredicateId)?.label
    : null;
  const crossPredicateRedeemInfo = pendingPredicateLabel
    ? getVotesToRedeem(pendingPredicateLabel)
    : null;

  // Cross-predicate redemption hook (extracted)
  const { isLoading: crossPredicateLoading, redeemAllCrossPredicate } = useCrossPredicateRedeem({
    withdraw,
    refetchPosition,
    setSuccess,
    setError,
    t: t as (key: string, defaultValue?: string | Record<string, unknown>) => string,
  });

  // Multiple withdrawals hook (extracted)
  const { withdrawMultiple } = useWithdrawMultiple({
    withdraw,
    refetchPosition,
    resetWithdraw,
    setSuccess,
    setError,
    t: t as (key: string, defaultValue?: string | Record<string, unknown>) => string,
  });

  // Handle click on blocked predicate (show popup)
  const handleBlockedPredicateClick = (predicateId: string) => {
    setPendingPredicateId(predicateId);
    setShowCrossPredicatePopup(true);
  };

  // Handle redeem all positions with other predicate
  const handleRedeemAllCrossPredicate = () => {
    if (!crossPredicateRedeemInfo) return;
    redeemAllCrossPredicate(crossPredicateRedeemInfo, pendingPredicateId, {
      onSuccess: (predicateId) => {
        if (predicateId) setSelectedPredicateId(predicateId);
        setPendingPredicateId(null);
        onRefetch?.();
      },
      onClose: () => setShowCrossPredicatePopup(false),
    });
  };

  // Direction change flow (extracted hook)
  const {
    directionChangeInfo,
    pendingRedeemInfo,
    pendingRedeemBothInfo,
    pendingRedeemCurve,
    pendingRedeemBoth,
    setPendingRedeemCurve,
    handleDirectionChangeCurveChoice,
    handleBothCurvesAutoSelect,
  } = useDirectionChange({
    curveAvailability,
    voteDirection,
    forSharesLinear,
    forSharesProgressive,
    againstSharesLinear,
    againstSharesProgressive,
  });

  // Add to cart hook (extracted) - must be after useDirectionChange for pendingRedeemInfo
  const { addToCart } = useAddToCart({
    formState: {
      isFormValid,
      selectedTotemId,
      selectedTotemLabel,
      newTotemData,
      selectedPredicateWithAtom,
      voteDirection,
      selectedCurve,
      trustAmount,
    },
    founder: { name: founder.name, atomId: founder.atomId || '' },
    proactiveClaimInfo: proactiveClaimInfo as { termId: string; counterTermId: string } | null,
    positionInfo: {
      hasAnyPosition,
      positionDirection,
      positionCurveId,
      currentUserShares,
    },
    pendingInfo: {
      pendingRedeemInfo,
      pendingRedeemCurve,
    },
    minRequiredDisplay,
    addItem: addItem as (item: unknown) => void,
    setPendingRedeemCurve,
    setTrustAmount,
    setSuccess,
    setError,
    t: t as (key: string, defaultValue?: string | Record<string, unknown>) => string,
  });

  // Handle direction button click
  // Always sets direction - if both curves are blocked, the inline curve choice will appear
  const handleDirectionClick = (direction: 'for' | 'against') => {
    // Reset pending redeem curve when changing direction
    setPendingRedeemCurve(null);
    setSelectedCurve(null);
    setVoteDirection(direction);
  };

  // Handle withdraw from WithdrawOnlyPanel - delegates to extracted hook + global refetch
  const handleWithdrawMultiple = async (requests: WithdrawRequest[]) => {
    await withdrawMultiple(requests);
    onRefetch?.();
  };

  // Build list of all available positions for WithdrawOnlyPanel (extracted hook)
  const { allUserPositions } = useAllUserPositions({
    proactiveClaimInfo: proactiveClaimInfo as { termId: string; counterTermId: string } | null,
    forSharesLinear,
    forSharesProgressive,
    againstSharesLinear,
    againstSharesProgressive,
  });

  // Handle add to cart - delegates to extracted hook
  const handleAddToCart = () => addToCart();

  if (!isConnected) {
    return (
      <div className="glass-card p-4 h-full flex flex-col items-center justify-center">
        <div className="w-16 h-16 rounded-full bg-slate-500/20 flex items-center justify-center mb-4">
          <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
          </svg>
        </div>
        <p className="text-white/60 text-sm text-center">{t('common.connectWalletToVote')}</p>
      </div>
    );
  }

  return (
    <div className="glass-card p-4 h-full flex flex-col overflow-y-auto overflow-x-hidden scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent" style={{ overscrollBehavior: 'contain' }}>
      {/* Header with cart button and "Added to cart" popup */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-white">Vote Totem</h3>

        {/* Container pour le bouton panier + popup "Added to cart"
            - relative: permet le positionnement absolu de la popup
            - La popup est en z-0 (derrière), le bouton en z-10 (devant)
        */}
        {(itemCount > 0 || totalItemCount > 0) && (
          <div className="relative flex items-center">
            {/* Popup "Added to cart" - positionnée en absolu, derrière le bouton (z-0) */}
            <div
              key={addedToCartKey}
              className={`absolute right-0 z-0 px-3 py-1.5 bg-green-500/20 border border-green-500/50 rounded-lg text-green-300 text-sm whitespace-nowrap ${
                addedToCartState === 'exiting' ? 'animate-slide-right' :
                addedToCartState ? 'animate-slide-left' :
                'translate-x-0 opacity-0 pointer-events-none'  /* Caché derrière le bouton */
              }`}
            >
              ✓ Added to cart
            </div>

            {/* Cart button - toujours au-dessus (z-10) */}
            <button
              onClick={onOpenCart}
              className={`relative z-10 flex items-center gap-2 px-3 py-1.5 bg-slate-500/20 hover:bg-slate-500/30 rounded-lg transition-colors ${
                cartItemAdded
                  ? 'animate-cart-item-added'      // Flash vert (prioritaire)
                  : cartButtonJustAppeared
                    ? 'animate-cart-pulse'         // Animation d'entrée
                    : 'animate-cart-stable'        // État stable (juste pulsation)
              }`}
            >
              <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              {/* Show total if there are votes from other founders */}
              <span className="text-sm text-slate-300">
                {totalItemCount > itemCount ? totalItemCount : itemCount}
              </span>
              {/* Badge showing votes from other founders */}
              {totalItemCount > itemCount && (
                <span className="absolute -top-1 -right-1 bg-blue-500 text-white text-[9px] font-bold px-1 rounded-full min-w-[14px] text-center">
                  +{totalItemCount - itemCount}
                </span>
              )}
            </button>
          </div>
        )}
      </div>


      {/* Content */}
      <div
        className="flex-1 overflow-y-auto space-y-4 px-[5px]"
        style={{ overscrollBehavior: 'contain' }}
      >
        {/* Triple Header: Tags/Bulles style */}
        <TripleHeader
          founder={founder}
          selectedPredicate={selectedPredicate}
          selectedPredicateId={selectedPredicateId}
          selectedTotemId={selectedTotemId}
          selectedTotemLabel={selectedTotemLabel}
          newTotemData={newTotemData}
          selectedTotemInfo={selectedTotemInfo}
        />

        {/* Predicate Selector - Step 0 with blur and pulsation */}
        <PredicateSelector
          predicates={predicates}
          selectedPredicateId={selectedPredicateId}
          onPredicateSelect={setSelectedPredicateId}
          onBlockedPredicateClick={handleBlockedPredicateClick}
          isPredicateBlocked={isPredicateBlocked}
          votesOnTotemByPredicate={votesOnTotemByPredicate}
          blurClass={getBlurClass(0, currentFormStep)}
          getPulseClass={getPulseClass}
          isRedeemHighlighted={isRedeemHighlighted}
        />

        {/* Cross-Predicate Popup Modal */}
        {showCrossPredicatePopup && crossPredicateRedeemInfo && crossPredicateRedeemInfo.votes.length > 0 && (
          <CrossPredicatePopup
            redeemInfo={crossPredicateRedeemInfo as CrossPredicateRedeemInfo}
            loading={crossPredicateLoading}
            onClose={() => { setShowCrossPredicatePopup(false); setPendingPredicateId(null); }}
            onRedeemAll={handleRedeemAllCrossPredicate}
          />
        )}

        {/* Deposit/Redeem Switch - Step 1 */}
        {/* Two visual states: current selection (animate-ring-pulse) vs default (ring-slate) */}
        <div className={getBlurClass(1, currentFormStep)}>
          <label className="block text-xs text-white/60 mb-1">Mode</label>
          <div className="flex gap-2">
            {/* Deposit button - dims when Redeem is highlighted */}
            <button
              onClick={() => setOperationMode('deposit')}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${
                operationMode === 'deposit'
                  ? 'bg-slate-500/30 text-slate-200 animate-ring-pulse'
                  : 'bg-white/5 text-white/60 ring-1 ring-slate-500/30 hover:bg-white/10'
              }`}
              style={isRedeemHighlighted ? { opacity: 0.4, transition: 'opacity 200ms' } : { transition: 'opacity 200ms' }}
            >
              Deposit
            </button>
            {/* Redeem button - pulses when highlighted, blur-disabled if no position */}
            <button
              onClick={() => hasAnyPosition && setOperationMode('redeem')}
              disabled={!hasAnyPosition}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${
                isRedeemHighlighted
                  ? 'bg-slate-500/30 text-slate-200 animate-ring-pulse'
                  : operationMode === 'redeem'
                    ? 'bg-slate-500/30 text-slate-200 animate-ring-pulse'
                    : hasAnyPosition
                      ? 'bg-white/5 text-white/60 ring-1 ring-slate-500/30 hover:bg-white/10'
                      : 'bg-white/5 text-white/40 ring-1 ring-slate-500/20 blur-disabled'
              }`}
            >
              Redeem
            </button>
          </div>
        </div>

        {/* Vote Direction - Only show in Deposit mode - Step 1 with pulsation */}
        {operationMode === 'deposit' && (
          <DirectionSelector
            voteDirection={voteDirection}
            onDirectionClick={handleDirectionClick}
            hasAnyPosition={hasAnyPosition}
            positionDirection={positionDirection}
            isOpposeBlockedByProtocol={isOpposeBlockedByProtocol}
            isSoleForVoter={isSoleForVoter}
            blurClass={getBlurClass(1, currentFormStep)}
            getPulseClass={getPulseClass}
            onOpposeBlockedHover={setIsRedeemHighlighted}
            isRedeemHighlighted={isRedeemHighlighted}
          />
        )}

        {/* Direction Change Section - Inline curve choice when curves are blocked */}
        {directionChangeInfo && !pendingRedeemCurve && !pendingRedeemBoth && (
          <DirectionChangeSection
            info={directionChangeInfo as DirectionChangeInfoType}
            onCurveChoice={(curveId) => handleDirectionChangeCurveChoice(curveId, setSelectedCurve)}
            onBothCurvesAutoSelect={() => handleBothCurvesAutoSelect(setSelectedCurve)}
          />
        )}

        {/* Pending Redeem Info Message - Shows AFTER user chose a SINGLE curve */}
        {pendingRedeemInfo && !pendingRedeemBoth && (
          <PendingRedeemMessage info={pendingRedeemInfo as PendingRedeemInfoType} />
        )}

        {/* Pending Redeem BOTH Message - Shows AFTER user confirmed both curves */}
        {pendingRedeemBothInfo && pendingRedeemBoth && (
          <PendingRedeemBothMessage info={pendingRedeemBothInfo as PendingRedeemBothInfoType} />
        )}

        {/* Curve Selector - Only show for FOR/AGAINST, not withdraw */}
        {voteDirection !== 'withdraw' && (
          <>
            <CurveSelector
              curveAvailability={curveAvailability}
              selectedCurve={selectedCurve}
              onCurveSelect={setSelectedCurve}
              pendingRedeemCurve={pendingRedeemCurve}
              hasAnyPosition={hasAnyPosition}
              positionCurveId={positionCurveId}
              blurClass={getBlurClass(2, currentFormStep)}
              getPulseClass={getPulseClass}
              isRedeemHighlighted={isRedeemHighlighted}
            />
            {/* Warning for Oppose + Progressive when vault not initialized (3 transactions) */}
            <ProgressiveInitMessage
              isVisible={voteDirection === 'against' && selectedCurve === CURVE_PROGRESSIVE}
              termId={proactiveClaimInfo?.termId}
              refetchTrigger={refetchTrigger}
            />
          </>
        )}

        {/* Alert: User needs to redeem before voting */}
        {needsRedeemBeforeVote && !positionLoading && voteDirection && voteDirection !== 'withdraw' && selectedCurve && (
          <NeedsRedeemAlert
            formattedCurrentPosition={formattedCurrentPosition}
            positionDirection={positionDirection}
            positionCurveId={positionCurveId}
            estimatedRecoverable={estimatedRecoverable}
            voteDirection={voteDirection}
            selectedCurve={selectedCurve}
            minRequiredExact={minRequiredExact || '0.0001'}
            minRequiredDisplay={minRequiredDisplay || '0.0001'}
            trustAmount={trustAmount}
            onAmountChange={setTrustAmount}
            balanceFormatted={balanceData?.formatted}
          />
        )}

        {/* Show WITHDRAW-ONLY panel when in withdraw mode */}
        {/* WITHDRAW = only withdraw, no add/switch (FOR/AGAINST buttons already handle position changes) */}
        {/* Now shows ALL positions (Support/Oppose x Linear/Progressive) for user to choose */}
        {voteDirection === 'withdraw' && !positionLoading ? (
          <WithdrawOnlyPanel
            positions={allUserPositions}
            onWithdrawMultiple={handleWithdrawMultiple}
            disabled={withdrawLoading || positionLoading}
          />
        ) : !needsRedeemBeforeVote ? (
          /* Normal vote flow - Amount Input (only when NOT needing redeem) */
          <div className={`${getBlurClass(3, currentFormStep)} blur-transition`}>
            {/* Position actuelle - affichage dynamique basé sur direction+curve */}
            {voteDirection && voteDirection !== 'withdraw' && selectedCurve && (
              <CurrentPositionCard
                voteDirection={voteDirection}
                selectedCurve={selectedCurve}
                selectedCombinationPosition={selectedCombinationPosition}
                pendingCartAmount={pendingCartAmount}
                operationMode={operationMode}
              />
            )}
            <div>
              <label className="block text-xs text-white/60 mb-1">
                {t('founderExpanded.amountTrust')}
              </label>
              <input
                type="text"
                value={trustAmount}
                onChange={(e) => setTrustAmount(e.target.value)}
                placeholder={minRequiredDisplay}
                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm placeholder-white/30 focus:outline-none focus:border-slate-500"
              />
              {!configLoading && balanceData && (
                <PresetButtonsCompact
                  onChange={setTrustAmount}
                  minAmount={minRequiredDisplay}
                  maxAmount={balanceData.formatted}
                  className="mt-2"
                />
              )}
            </div>

            {/* Preview */}
            {(selectedTotemLabel || newTotemData) && (
              <VotePreview
                founderName={founder.name}
                predicateLabel={selectedPredicate?.label}
                totemName={effectiveTotemName}
                voteDirection={voteDirection as 'for' | 'against' | null}
                trustAmount={trustAmount}
                isCreatingNewTotem={isCreatingNewTotem}
                newTotemData={newTotemData}
              />
            )}
          </div>
        ) : null}
      </div>

      {/* Action Button - only show for FOR/AGAINST, not withdraw (PositionModifier has its own buttons) */}
      {voteDirection !== 'withdraw' && (
        <div className={`mt-4 pt-4 border-t border-white/10 ${getBlurClass(3, currentFormStep)} blur-transition`}>
          <button
            onClick={handleAddToCart}
            disabled={!isFormValid}
            className={`w-full py-3 rounded-lg font-medium transition-colors ${
              isFormValid
                ? 'bg-slate-600 hover:bg-slate-700 text-white'
                : 'bg-white/10 text-white/40 cursor-not-allowed'
            }`}
          >
            {t('founderExpanded.addToCart')}
          </button>
          {(itemCount > 0 || totalItemCount > 0) && (
            <p className="text-center text-xs text-white/50 mt-2">
              {totalItemCount > itemCount
                ? `${totalItemCount} ${t('founderExpanded.votesInCart')} (${itemCount} ${t('founderExpanded.currentFounder').toLowerCase()})`
                : `${itemCount} ${t('founderExpanded.votesInCart')} (${formattedNetCost} TRUST)`
              }
            </p>
          )}
        </div>
      )}
    </div>
  );
}
