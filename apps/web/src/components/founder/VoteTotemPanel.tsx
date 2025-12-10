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

import { useState, useEffect, useMemo } from 'react';
import { useAccount, useBalance } from 'wagmi';
import { useQuery } from '@apollo/client';
import { useTranslation } from 'react-i18next';
import type { Hex, Address } from 'viem';
import { formatEther } from 'viem';
import type { FounderForHomePage } from '../../hooks';
import { useProtocolConfig, usePreviewRedeem } from '../../hooks';
import { useVoteCartContext } from '../../hooks/cart/useVoteCart';
import { useProactiveClaimCheck } from '../../hooks';
import { usePositionBothSides } from '../../hooks/blockchain/usePositionFromContract';
import { useWithdraw } from '../../hooks/blockchain/useWithdraw';
import { GET_ATOMS_BY_LABELS } from '../../lib/graphql/queries';
import { PresetButtonsCompact } from '../vote/PresetButtons';
import { SuccessNotification } from '../common/SuccessNotification';
import { ErrorNotification } from '../common/ErrorNotification';
import predicatesData from '../../../../../packages/shared/src/data/predicates.json';
import type { Predicate } from '../../types/predicate';
import type { NewTotemData } from './TotemCreationForm';

/**
 * WithdrawOnlyPanel - Simplified withdraw panel
 *
 * WITHDRAW button should ONLY allow withdrawing TRUST.
 * FOR/AGAINST buttons already handle position changes via the slider.
 * This component shows:
 * 1. Current position (FOR or AGAINST + amount)
 * 2. Slider to choose how much to withdraw (0-100%)
 * 3. Confirm withdraw button
 */
interface WithdrawOnlyPanelProps {
  position: {
    direction: 'for' | 'against';
    shares: bigint;
  };
  termId: Hex;
  onWithdraw: (shares: bigint, percentage: number) => void;
  disabled?: boolean;
}

function WithdrawOnlyPanel({
  position,
  termId,
  onWithdraw,
  disabled = false,
}: WithdrawOnlyPanelProps) {
  const { t } = useTranslation();
  const { preview, currentPreview, loading: previewLoading } = usePreviewRedeem();

  // Total position in TRUST (formatted)
  const totalPositionFloat = parseFloat(formatEther(position.shares));
  const formattedTotalPosition = totalPositionFloat.toFixed(4);

  // Slider uses integer scale (x10000) for precision
  const SCALE = 10000;
  const maxInt = Math.round(totalPositionFloat * SCALE);

  // Amount to withdraw (in TRUST as float, then converted to shares)
  const [withdrawAmountInt, setWithdrawAmountInt] = useState(maxInt); // Start at 100%
  const withdrawAmountFloat = withdrawAmountInt / SCALE;
  const formattedWithdrawAmount = withdrawAmountFloat.toFixed(4);

  // Calculate shares to withdraw based on amount (proportional to position)
  const sharesToWithdraw = useMemo(() => {
    if (totalPositionFloat === 0) return 0n;
    // shares = position.shares * (withdrawAmount / totalPosition)
    const ratio = withdrawAmountFloat / totalPositionFloat;
    return BigInt(Math.floor(Number(position.shares) * ratio));
  }, [position.shares, withdrawAmountFloat, totalPositionFloat]);

  // Calculate percentage for display
  const withdrawPercent = totalPositionFloat > 0
    ? Math.round((withdrawAmountFloat / totalPositionFloat) * 100)
    : 0;

  // Preview withdrawal when amount changes
  const handleWithdrawAmountChange = async (newAmountInt: number) => {
    setWithdrawAmountInt(newAmountInt);
    const newAmountFloat = newAmountInt / SCALE;
    if (newAmountFloat > 0 && totalPositionFloat > 0) {
      const ratio = newAmountFloat / totalPositionFloat;
      const shares = BigInt(Math.floor(Number(position.shares) * ratio));
      if (shares > 0n) {
        await preview(termId, shares);
      }
    }
  };

  // Trigger initial preview on mount (100% withdrawal)
  useEffect(() => {
    if (position.shares > 0n) {
      preview(termId, position.shares);
    }
  }, [termId, position.shares]);

  const handleWithdrawSubmit = () => {
    if (sharesToWithdraw > 0n) {
      onWithdraw(sharesToWithdraw, withdrawPercent);
    }
  };

  // Quick presets
  const handlePreset = (percent: number) => {
    const newAmountInt = Math.round((percent / 100) * maxInt);
    handleWithdrawAmountChange(newAmountInt);
  };

  const directionLabel = position.direction === 'for' ? 'FOR' : 'AGAINST';
  const directionColor = position.direction === 'for' ? 'text-green-400' : 'text-red-400';
  const bgColor = position.direction === 'for' ? 'bg-green-500/10 border-green-500/30' : 'bg-red-500/10 border-red-500/30';

  return (
    <div className={`${bgColor} border rounded-lg p-4 space-y-4`}>
      {/* Current Position Display */}
      <div className="text-center">
        <span className="text-xs text-white/50">{t('founderExpanded.currentPosition')}</span>
        <div className="flex items-center justify-center gap-2 mt-1">
          <span className={`text-lg font-bold ${directionColor}`}>{directionLabel}</span>
          <span className="text-lg font-bold text-white">{formattedTotalPosition} TRUST</span>
        </div>
      </div>

      {/* Withdraw Amount Display - Real-time feedback */}
      <div className="bg-black/30 rounded-lg p-3">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-white/70">{t('founderExpanded.withdrawAmount')}</span>
          <span className="text-sm text-orange-300 font-medium">{withdrawPercent}%</span>
        </div>
        <div className="text-center">
          <span className="text-2xl font-bold text-orange-400">{formattedWithdrawAmount}</span>
          <span className="text-lg text-white/50 ml-1">/ {formattedTotalPosition} TRUST</span>
        </div>
      </div>

      {/* Amount Slider */}
      <div className="space-y-2">
        <input
          type="range"
          min={0}
          max={maxInt}
          step={1}
          value={withdrawAmountInt}
          onChange={(e) => handleWithdrawAmountChange(parseInt(e.target.value))}
          className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-orange-500"
        />
        {/* Quick presets */}
        <div className="flex justify-between gap-2">
          <button
            onClick={() => handlePreset(25)}
            className={`flex-1 py-1 text-xs rounded transition-colors ${
              withdrawPercent === 25 ? 'bg-orange-500/30 text-orange-300' : 'bg-white/5 text-white/50 hover:bg-white/10'
            }`}
          >
            25%
          </button>
          <button
            onClick={() => handlePreset(50)}
            className={`flex-1 py-1 text-xs rounded transition-colors ${
              withdrawPercent === 50 ? 'bg-orange-500/30 text-orange-300' : 'bg-white/5 text-white/50 hover:bg-white/10'
            }`}
          >
            50%
          </button>
          <button
            onClick={() => handlePreset(75)}
            className={`flex-1 py-1 text-xs rounded transition-colors ${
              withdrawPercent === 75 ? 'bg-orange-500/30 text-orange-300' : 'bg-white/5 text-white/50 hover:bg-white/10'
            }`}
          >
            75%
          </button>
          <button
            onClick={() => handlePreset(100)}
            className={`flex-1 py-1 text-xs rounded transition-colors ${
              withdrawPercent === 100 ? 'bg-orange-500/30 text-orange-300' : 'bg-white/5 text-white/50 hover:bg-white/10'
            }`}
          >
            MAX
          </button>
        </div>
      </div>

      {/* Preview - What you'll receive */}
      {previewLoading ? (
        <div className="text-sm text-white/50 text-center">{t('common.loading')}</div>
      ) : currentPreview && sharesToWithdraw > 0n ? (
        <div className="bg-black/20 rounded-lg p-3 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-white/70">{t('founderExpanded.youWillReceive')}</span>
            <span className="text-green-400 font-semibold">{currentPreview.netAmountFormatted} TRUST</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-white/50">{t('founderExpanded.exitFee')} ({currentPreview.exitFeePercent})</span>
            <span className="text-red-400">-{currentPreview.exitFeeFormatted} TRUST</span>
          </div>
        </div>
      ) : withdrawAmountInt === 0 ? (
        <div className="text-sm text-white/40 text-center">{t('founderExpanded.selectWithdrawAmount')}</div>
      ) : null}

      {/* Confirm Button */}
      <button
        onClick={handleWithdrawSubmit}
        disabled={disabled || sharesToWithdraw <= 0n}
        className="w-full px-4 py-3 bg-orange-500 text-white rounded-lg font-medium hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {withdrawPercent === 100
          ? t('founderExpanded.withdrawAll')
          : t('founderExpanded.confirmWithdraw')}
      </button>
    </div>
  );
}

interface VoteTotemPanelProps {
  founder: FounderForHomePage;
  selectedTotemId?: string;
  selectedTotemLabel?: string;
  /** Data for a new totem being created (from TotemCreationForm) */
  newTotemData?: NewTotemData | null;
  onClearSelection?: () => void;
  onOpenCart?: () => void;
}

export function VoteTotemPanel({
  founder,
  selectedTotemId,
  selectedTotemLabel,
  newTotemData,
  onClearSelection,
  onOpenCart,
}: VoteTotemPanelProps) {
  const { t } = useTranslation();
  const { isConnected, address } = useAccount();
  const predicates = predicatesData as Predicate[];

  const { config: protocolConfig, loading: configLoading, isDepositValid } = useProtocolConfig();
  const { data: balanceData } = useBalance({ address });

  const {
    itemCount,
    formattedNetCost,
    addItem,
  } = useVoteCartContext();
  // Note: initCart is called by FounderExpandedView which provides the context

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

  // Form state
  const [selectedPredicateId, setSelectedPredicateId] = useState<string>(predicates[0]?.id || '');
  const [voteDirection, setVoteDirection] = useState<'for' | 'against' | 'withdraw'>('for');
  const [trustAmount, setTrustAmount] = useState<string>('');
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const selectedPredicate = useMemo(
    () => predicates.find((p) => p.id === selectedPredicateId),
    [predicates, selectedPredicateId]
  );

  // Get selected predicate with atomId
  const selectedPredicateWithAtom = useMemo(
    () => predicatesWithAtomIds.find((p) => p.id === selectedPredicateId),
    [predicatesWithAtomIds, selectedPredicateId]
  );

  // Check if triple already exists (to get termId/counterTermId)
  const {
    proactiveClaimInfo,
  } = useProactiveClaimCheck({
    founderAtomId: founder.atomId,
    selectedPredicateWithAtom,
    selectedTotemId: selectedTotemId || '',
    totemMode: 'existing', // VoteTotemPanel only handles existing totems
  });

  // Compute if this is a new triple (no proactiveClaimInfo means triple doesn't exist yet)
  const isNewTotem = !proactiveClaimInfo;

  // Check user's position on this triple (FOR and AGAINST sides)
  const {
    forShares,
    againstShares,
    hasAnyPosition,
    positionDirection,
    isLoading: positionLoading,
    refetch: refetchPosition,
  } = usePositionBothSides(
    address as Address | undefined,
    proactiveClaimInfo?.termId as Hex | undefined,
    proactiveClaimInfo?.counterTermId as Hex | undefined
  );

  // Withdraw hook
  const {
    withdraw,
    isLoading: withdrawLoading,
    reset: resetWithdraw,
  } = useWithdraw();

  // Calculate minimum required amount based on creation mode
  // For new totem creation:
  //   - 2 triples minimum: Founder→predicate→Totem + Totem→hasCategory→Category
  //   - 3 triples if new category: + Category→tagCategory→System
  // For existing totem with new triple: 1 triple
  // For existing triple: just minDeposit
  const minRequiredAmount = useMemo(() => {
    if (!protocolConfig) return '0.001';
    const tripleCost = parseFloat(protocolConfig.formattedTripleCost);
    const minDeposit = parseFloat(protocolConfig.formattedMinDeposit);

    // Creating a brand new totem (from creation form)
    if (newTotemData) {
      // 2 triples if existing category, 3 if new category
      const triplesNeeded = newTotemData.isNewCategory ? 3 : 2;
      const total = (tripleCost * triplesNeeded) + minDeposit;
      return total.toFixed(4);
    }

    // Existing totem but new relationship triple
    if (isNewTotem) {
      const total = tripleCost + minDeposit;
      return total.toFixed(4);
    }

    // Existing triple: just minDeposit
    return protocolConfig.formattedMinDeposit;
  }, [protocolConfig, isNewTotem, newTotemData]);

  // Initialize amount with minimum required
  useEffect(() => {
    if (minRequiredAmount && trustAmount === '') {
      setTrustAmount(minRequiredAmount);
    }
  }, [minRequiredAmount]);

  // Update amount if it's below minimum when switching to a new totem
  useEffect(() => {
    if (protocolConfig && trustAmount) {
      const currentAmount = parseFloat(trustAmount);
      const minAmount = parseFloat(minRequiredAmount);
      if (currentAmount < minAmount) {
        setTrustAmount(minRequiredAmount);
      }
    }
  }, [minRequiredAmount, protocolConfig]);

  // Reset amount to minimum when totem changes AND we know if it's new or existing
  // This ensures the correct minimum is used after proactiveClaimCheck completes
  useEffect(() => {
    if (selectedTotemId && minRequiredAmount) {
      const currentAmount = parseFloat(trustAmount || '0');
      const minAmount = parseFloat(minRequiredAmount);
      // Only update if current amount is below minimum
      if (currentAmount < minAmount) {
        setTrustAmount(minRequiredAmount);
      }
    }
  }, [selectedTotemId, selectedPredicateId, minRequiredAmount]);

  // Update amount when creating a new totem (from creation form)
  // This ensures minimum amount covers all triple creation costs
  useEffect(() => {
    if (newTotemData && minRequiredAmount) {
      const currentAmount = parseFloat(trustAmount || '0');
      const minAmount = parseFloat(minRequiredAmount);
      if (currentAmount < minAmount) {
        setTrustAmount(minRequiredAmount);
      }
    }
  }, [newTotemData, minRequiredAmount]);

  // Determine if we're working with a new totem (creation) or existing totem
  const isCreatingNewTotem = !!newTotemData;
  const effectiveTotemName = newTotemData?.name || selectedTotemLabel || '';

  const isFormValid = useMemo(() => {
    // Must have either an existing totem selected OR new totem data
    if (!selectedTotemId && !newTotemData) return false;
    if (!selectedPredicateId) return false;
    if (!trustAmount || parseFloat(trustAmount) <= 0) return false;
    if (!isDepositValid(trustAmount)) return false;
    if (voteDirection === 'withdraw') return true; // Withdraw doesn't need predicate atomId
    if (!selectedPredicateWithAtom?.atomId) return false; // Need predicate atomId for votes
    return true;
  }, [selectedTotemId, newTotemData, selectedPredicateId, trustAmount, isDepositValid, voteDirection, selectedPredicateWithAtom]);

  // Get current user shares based on position direction
  const currentUserShares = positionDirection === 'for' ? forShares : againstShares;

  // Detect if user is trying to vote opposite to their existing position
  const isVotingOpposite = useMemo(() => {
    if (!hasAnyPosition || !positionDirection) return false;
    if (voteDirection === 'withdraw') return false;
    return positionDirection !== voteDirection;
  }, [hasAnyPosition, positionDirection, voteDirection]);

  // Format current position amount for display
  const formattedCurrentPosition = useMemo(() => {
    if (!currentUserShares || currentUserShares === 0n) return '0';
    return parseFloat(formatEther(currentUserShares)).toFixed(4);
  }, [currentUserShares]);

  // Handle withdraw from PositionModifier
  const handleWithdraw = async (shares: bigint, _percentage: number) => {
    if (!proactiveClaimInfo) {
      setError('Position non trouvée');
      setTimeout(() => setError(null), 3000);
      return;
    }

    // Determine which termId to use based on position direction
    const termIdToUse = positionDirection === 'for'
      ? proactiveClaimInfo.termId
      : proactiveClaimInfo.counterTermId;

    console.log('[VoteTotemPanel] Withdraw:', {
      termId: termIdToUse,
      shares: shares.toString(),
      isPositive: positionDirection === 'for',
    });

    const txHash = await withdraw(
      termIdToUse as Hex,
      shares,
      positionDirection === 'for',
      0n // minAssets (slippage protection)
    );

    if (txHash) {
      setSuccess(t('withdraw.success') || 'Retrait effectué !');
      setTimeout(() => setSuccess(null), 3000);
      // Refetch position after successful withdraw
      refetchPosition();
      resetWithdraw();
    }
  };

  // Handle add to cart - Full integration with useVoteCart
  const handleAddToCart = () => {
    console.log('[VoteTotemPanel] ========== ADD TO CART START ==========');
    console.log('[VoteTotemPanel] Form state:', {
      isFormValid,
      selectedTotemId,
      selectedTotemLabel,
      selectedPredicateId,
      selectedPredicateLabel: selectedPredicateWithAtom?.label,
      selectedPredicateAtomId: selectedPredicateWithAtom?.atomId,
      voteDirection,
      trustAmount,
      founderName: founder.name,
      founderAtomId: founder.atomId,
    });
    console.log('[VoteTotemPanel] Proactive claim info:', proactiveClaimInfo);

    if (!isFormValid) {
      console.log('[VoteTotemPanel] Form NOT valid, aborting');
      return;
    }
    if (voteDirection === 'withdraw') {
      // Withdraw not supported in cart mode yet
      setError(t('founderExpanded.withdrawNotInCart') || 'Withdraw non disponible dans le panier');
      setTimeout(() => setError(null), 3000);
      return;
    }

    // For new totem creation, selectedTotemId is undefined - newTotemData is used instead
    const hasTotemSelection = selectedTotemId || newTotemData;
    if (!hasTotemSelection || !selectedPredicateWithAtom?.atomId) {
      console.log('[VoteTotemPanel] Missing data:', {
        selectedTotemId,
        newTotemData,
        predicateAtomId: selectedPredicateWithAtom?.atomId
      });
      setError('Données manquantes pour ajouter au panier');
      setTimeout(() => setError(null), 3000);
      return;
    }

    // Determine if this is a brand new totem (creation mode) or existing totem
    const isCreatingNewTotem = !!newTotemData && !selectedTotemId;
    // For new triples (no proactiveClaimInfo), we need to create termId on-chain
    // For existing triples, we use the existing termId/counterTermId
    const isNewTotem = isCreatingNewTotem || !proactiveClaimInfo;

    // Include current position so cart can detect if withdrawal is needed for opposite-side vote
    // This enables auto-withdraw when switching from FOR to AGAINST (or vice versa)
    const currentPositionForCart = hasAnyPosition && positionDirection
      ? { direction: positionDirection, shares: currentUserShares }
      : undefined;

    // Build cart item differently for new totem creation vs existing totem vote
    const cartItem = isCreatingNewTotem
      ? {
          // New totem creation - totemId will be set after atom creation
          totemId: null,
          totemName: newTotemData.name,
          predicateId: selectedPredicateWithAtom.atomId as Hex,
          termId: null, // Will be set after triple creation
          counterTermId: null, // Will be set after triple creation
          direction: voteDirection as 'for' | 'against',
          amount: trustAmount,
          isNewTotem: true,
          currentPosition: undefined, // No existing position for new totem
          newTotemData: {
            name: newTotemData.name,
            category: newTotemData.category,
            categoryTermId: newTotemData.categoryTermId,
            isNewCategory: newTotemData.isNewCategory,
          },
        }
      : {
          // Existing totem vote
          totemId: selectedTotemId as Hex,
          totemName: selectedTotemLabel || 'Unknown',
          predicateId: selectedPredicateWithAtom.atomId as Hex,
          termId: (proactiveClaimInfo?.termId || selectedTotemId) as Hex,
          counterTermId: (proactiveClaimInfo?.counterTermId || selectedTotemId) as Hex,
          direction: voteDirection as 'for' | 'against',
          amount: trustAmount,
          isNewTotem,
          currentPosition: currentPositionForCart, // Pass position to detect opposite-side withdrawal
        };

    console.log('[VoteTotemPanel] Cart item to add:', cartItem);
    console.log('[VoteTotemPanel] isCreatingNewTotem:', isCreatingNewTotem, 'isNewTotem:', isNewTotem);

    // DEBUG: Vérification que totemId est bien un atom ID et pas un triple ID
    if (!isCreatingNewTotem) {
      console.log('[VoteTotemPanel] 🔍 DEBUG VERIFICATION (existing totem):');
      console.log('  - selectedTotemId (should be ATOM id):', selectedTotemId);
      console.log('  - proactiveClaimInfo?.termId (TRIPLE id):', proactiveClaimInfo?.termId);
      console.log('  - Are they different?', selectedTotemId !== proactiveClaimInfo?.termId ? '✅ YES (correct!)' : '⚠️ NO (might be bug if triple exists)');
    } else {
      console.log('[VoteTotemPanel] 🆕 CREATING NEW TOTEM:', newTotemData);
    }

    try {
      addItem(cartItem);

      console.log('[VoteTotemPanel] Item added to cart successfully!');
      setSuccess(t('founderExpanded.addedToCart') || 'Ajouté au panier !');
      setTimeout(() => setSuccess(null), 3000);

      // Reset amount after adding
      if (protocolConfig?.formattedMinDeposit) {
        setTrustAmount(protocolConfig.formattedMinDeposit);
      }
    } catch (err) {
      console.error('[VoteTotemPanel] Error adding to cart:', err);
      setError('Erreur lors de l\'ajout au panier');
      setTimeout(() => setError(null), 3000);
    }
    console.log('[VoteTotemPanel] ========== ADD TO CART END ==========');
  };

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
      {/* Header with cart button */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-white">Vote Totem</h3>
        {itemCount > 0 && (
          <button
            onClick={onOpenCart}
            className="flex items-center gap-2 px-3 py-1.5 bg-slate-500/20 hover:bg-slate-500/30 rounded-lg transition-colors"
          >
            <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <span className="text-sm text-slate-300">{itemCount}</span>
          </button>
        )}
      </div>

      {/* Notifications */}
      {success && <SuccessNotification message={success} onClose={() => setSuccess(null)} />}
      {error && <ErrorNotification message={error} onClose={() => setError(null)} />}

      {/* Content */}
      <div className="flex-1 overflow-y-auto space-y-4" style={{ overscrollBehavior: 'contain' }}>
        {/* Selected Totem - Existing OR New */}
        <div>
          <label className="block text-xs text-white/60 mb-1">{t('founderExpanded.selectedTotem')}</label>
          {newTotemData ? (
            // New totem from creation form
            <div className="bg-gradient-to-r from-slate-500/20 to-orange-500/10 rounded-lg p-3 border border-orange-500/30">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-white font-medium">{newTotemData.name}</span>
                  <span className="text-orange-400/70 text-xs ml-2">
                    ({t('creation.new') || 'nouveau'})
                  </span>
                </div>
                <button
                  onClick={onClearSelection}
                  className="text-white/60 hover:text-white"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="mt-1 text-xs text-white/50">
                {t('creation.category')}: <span className="text-slate-400">{newTotemData.category}</span>
                {newTotemData.isNewCategory && (
                  <span className="text-orange-400/70 ml-1">({t('creation.new') || 'nouveau'})</span>
                )}
              </div>
            </div>
          ) : selectedTotemLabel ? (
            // Existing totem selected
            <div className="flex items-center justify-between bg-slate-500/20 rounded-lg p-3">
              <span className="text-white font-medium">{selectedTotemLabel}</span>
              <button
                onClick={onClearSelection}
                className="text-white/60 hover:text-white"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ) : (
            // No totem selected
            <div className="bg-white/5 rounded-lg p-3 text-white/40 text-sm text-center">
              {t('founderExpanded.selectTotemFromCenter')}
            </div>
          )}
        </div>

        {/* Predicate Selector */}
        <div>
          <label className="block text-xs text-white/60 mb-1">{t('founderExpanded.relationType')}</label>
          <div className="grid grid-cols-2 gap-2">
            {predicates.slice(0, 2).map((predicate) => (
              <button
                key={predicate.id}
                onClick={() => setSelectedPredicateId(predicate.id)}
                className={`p-2 rounded-lg text-sm transition-colors ${
                  selectedPredicateId === predicate.id
                    ? 'bg-slate-500/30 text-slate-300 ring-1 ring-slate-500/50'
                    : 'bg-white/5 text-white/70 hover:bg-white/10'
                }`}
              >
                {predicate.label}
              </button>
            ))}
          </div>
        </div>

        {/* Vote Direction */}
        <div>
          <label className="block text-xs text-white/60 mb-1">Action</label>
          <div className="flex gap-2">
            <button
              onClick={() => setVoteDirection('for')}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                voteDirection === 'for'
                  ? 'bg-green-500/30 text-green-300 ring-1 ring-green-500/50'
                  : 'bg-white/5 text-white/60 hover:bg-white/10'
              }`}
            >
              FOR
            </button>
            <button
              onClick={() => setVoteDirection('against')}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                voteDirection === 'against'
                  ? 'bg-red-500/30 text-red-300 ring-1 ring-red-500/50'
                  : 'bg-white/5 text-white/60 hover:bg-white/10'
              }`}
            >
              AGAINST
            </button>
            <button
              onClick={() => setVoteDirection('withdraw')}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                voteDirection === 'withdraw'
                  ? 'bg-orange-500/30 text-orange-300 ring-1 ring-orange-500/50'
                  : 'bg-white/5 text-white/60 hover:bg-white/10'
              }`}
            >
              {t('founderExpanded.withdraw')}
            </button>
          </div>
        </div>

        {/* Alert: User is voting opposite to their existing position */}
        {isVotingOpposite && !positionLoading && (
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3 space-y-3">
            <div className="flex items-start gap-2">
              <svg className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <div className="flex-1">
                <p className="text-amber-300 text-sm font-medium">
                  Position existante détectée
                </p>
                <p className="text-white/70 text-xs mt-1">
                  Vous avez <span className="text-amber-300 font-medium">{formattedCurrentPosition} TRUST</span> en{' '}
                  <span className={positionDirection === 'for' ? 'text-green-400' : 'text-red-400'}>
                    {positionDirection?.toUpperCase()}
                  </span>.
                </p>
                <p className="text-white/50 text-xs mt-1">
                  Pour voter {voteDirection.toUpperCase()}, votre position sera automatiquement retirée.
                </p>
              </div>
            </div>

            {/* Amount input with slider for opposite vote */}
            <div className="pt-2 border-t border-amber-500/20">
              <label className="block text-xs text-white/60 mb-2">
                Montant pour votre nouvelle position {voteDirection.toUpperCase()}
              </label>
              {/* Slider - Uses integer scale (x10000) for browser precision */}
              {(() => {
                // Calculate slider bounds
                const minVal = parseFloat(protocolConfig?.formattedMinDeposit || '0.0001');
                // Max = balance + current position (what user can spend after redeem)
                const currentPosValue = parseFloat(formattedCurrentPosition) || 0;
                const balanceVal = parseFloat(balanceData?.formatted || '0');
                const maxVal = Math.max(minVal, balanceVal + currentPosValue * 0.93); // 93% = after ~7% exit fee

                // Convert to integer scale (x10000) for better slider precision
                const SCALE = 10000;
                const minInt = Math.round(minVal * SCALE);
                const maxInt = Math.round(maxVal * SCALE);
                const currentAmount = parseFloat(trustAmount) || minVal;
                const currentInt = Math.min(Math.max(Math.round(currentAmount * SCALE), minInt), maxInt);

                return (
                  <>
                    <input
                      type="range"
                      min={minInt}
                      max={maxInt}
                      step={1}
                      value={currentInt}
                      onChange={(e) => {
                        const intValue = parseInt(e.target.value, 10);
                        setTrustAmount((intValue / SCALE).toFixed(4));
                      }}
                      className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-amber-500"
                    />
                    <div className="flex justify-between text-xs text-white/40 mt-1">
                      <span>{minVal.toFixed(4)}</span>
                      <span>{maxVal.toFixed(4)}</span>
                    </div>
                  </>
                );
              })()}
              {/* Manual input + balance */}
              <div className="flex items-center gap-2 mt-2">
                <input
                  type="text"
                  value={trustAmount}
                  onChange={(e) => setTrustAmount(e.target.value)}
                  placeholder={protocolConfig?.formattedMinDeposit || '0.0001'}
                  className="flex-1 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm placeholder-white/30 focus:outline-none focus:border-amber-500"
                />
                <span className="text-xs text-white/50">TRUST</span>
              </div>
              {balanceData && (
                <p className="text-xs text-white/40 mt-1">
                  Balance: {parseFloat(balanceData.formatted).toFixed(4)} + ~{(parseFloat(formattedCurrentPosition) * 0.93).toFixed(4)} récupérable
                </p>
              )}
            </div>
          </div>
        )}

        {/* Show WITHDRAW-ONLY panel when in withdraw mode AND user has a position */}
        {/* WITHDRAW = only withdraw, no add/switch (FOR/AGAINST buttons already handle position changes) */}
        {voteDirection === 'withdraw' && hasAnyPosition && proactiveClaimInfo && positionDirection ? (
          <WithdrawOnlyPanel
            position={{
              direction: positionDirection,
              shares: currentUserShares,
            }}
            termId={proactiveClaimInfo.termId as Hex}
            onWithdraw={handleWithdraw}
            disabled={withdrawLoading || positionLoading}
          />
        ) : voteDirection === 'withdraw' && !hasAnyPosition && !positionLoading ? (
          /* No position to withdraw */
          <div className="bg-orange-500/10 border border-orange-500/30 rounded-lg p-4 text-center">
            <p className="text-orange-300 text-sm mb-2">
              {t('founderExpanded.noPositionToWithdraw') || 'Vous n\'avez pas de position sur ce totem'}
            </p>
            <p className="text-white/50 text-xs">
              {t('founderExpanded.voteFirstToWithdraw') || 'Votez FOR ou AGAINST d\'abord pour pouvoir retirer'}
            </p>
          </div>
        ) : !isVotingOpposite ? (
          /* Normal vote flow - Amount Input (only when NOT voting opposite) */
          <>
            <div>
              <label className="block text-xs text-white/60 mb-1">
                {t('founderExpanded.amountTrust')}
              </label>
              <input
                type="text"
                value={trustAmount}
                onChange={(e) => setTrustAmount(e.target.value)}
                placeholder={protocolConfig?.formattedMinDeposit || '0.0001'}
                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm placeholder-white/30 focus:outline-none focus:border-slate-500"
              />
              {!configLoading && balanceData && (
                <PresetButtonsCompact
                  onChange={setTrustAmount}
                  minAmount={protocolConfig?.formattedMinDeposit || '0.0001'}
                  maxAmount={balanceData.formatted}
                  className="mt-2"
                />
              )}
            </div>

            {/* Preview */}
            {(selectedTotemLabel || newTotemData) && (
              <div className={`rounded-lg p-3 ${isCreatingNewTotem ? 'bg-orange-500/10 border border-orange-500/20' : 'bg-white/5'}`}>
                <div className="text-xs text-white/60 mb-1">
                  {t('founderExpanded.votePreview')}
                  {isCreatingNewTotem && (
                    <span className="text-orange-400/70 ml-1">({t('creation.new') || 'nouveau'})</span>
                  )}
                </div>
                <p className="text-sm text-white">
                  <span className="text-slate-400">{founder.name}</span>
                  {' '}{selectedPredicate?.label || '...'}{' '}
                  <span className="text-slate-400">{effectiveTotemName}</span>
                </p>
                <p className="text-xs text-white/50 mt-1">
                  {voteDirection === 'for' ? '👍 FOR' : '👎 AGAINST'} - {trustAmount || '0'} TRUST
                </p>
                {isCreatingNewTotem && newTotemData && (
                  <p className="text-xs text-orange-400/60 mt-1">
                    + {t('creation.category')}: {newTotemData.category}
                    {newTotemData.isNewCategory && ` (${t('creation.new') || 'nouveau'})`}
                  </p>
                )}
              </div>
            )}
          </>
        ) : null}
      </div>

      {/* Action Button - only show for FOR/AGAINST, not withdraw (PositionModifier has its own buttons) */}
      {voteDirection !== 'withdraw' && (
        <div className="mt-4 pt-4 border-t border-white/10">
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
          {itemCount > 0 && (
            <p className="text-center text-xs text-white/50 mt-2">
              {itemCount} {t('founderExpanded.votesInCart')} ({formattedNetCost} TRUST)
            </p>
          )}
        </div>
      )}
    </div>
  );
}
