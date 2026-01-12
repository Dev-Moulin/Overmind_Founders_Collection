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
import { useProtocolConfig, usePreviewRedeem, CURVE_LINEAR, CURVE_PROGRESSIVE, type CurveId } from '../../hooks';
import { useVoteCartContext } from '../../hooks/cart/useVoteCart';
import { useProactiveClaimCheck } from '../../hooks';
import { usePositionBothSides } from '../../hooks/blockchain/usePositionFromContract';
import { useWithdraw } from '../../hooks/blockchain/useWithdraw';
import { useUserVotesForFounder } from '../../hooks/data/useUserVotesForFounder';
import { GET_ATOMS_BY_LABELS } from '../../lib/graphql/queries';
import { PresetButtonsCompact } from '../vote/PresetButtons';
import { SuccessNotification } from '../common/SuccessNotification';
import { ErrorNotification } from '../common/ErrorNotification';
import predicatesData from '../../../../../packages/shared/src/data/predicates.json';
import type { Predicate } from '../../types/predicate';
import type { NewTotemData } from './TotemCreationForm';
import { getFounderImageUrl } from '../../utils/founderImage';
import { SUPPORT_COLORS, OPPOSE_COLORS, CURVE_COLORS } from '../../config/colors';

/**
 * WithdrawOnlyPanel - Multi-position withdraw panel
 *
 * WITHDRAW button allows withdrawing TRUST from any position.
 * Now supports multiple positions (Linear/Progressive x Support/Oppose).
 * This component shows:
 * 1. All available positions with Direction + Curve + Amount
 * 2. Position selector to choose which position to withdraw from
 * 3. Slider to choose how much to withdraw (0-100%)
 * 4. Confirm withdraw button
 */

/** Single position info */
interface PositionInfo {
  direction: 'for' | 'against';
  curveId: 1 | 2;
  shares: bigint;
  termId: Hex;
}

/** Info for a single withdrawal to execute */
interface WithdrawRequest {
  termId: Hex;
  shares: bigint;
  curveId: number;
  direction: 'for' | 'against';
  percentage: number;
}

interface WithdrawOnlyPanelProps {
  /** All user positions on this totem */
  positions: PositionInfo[];
  /** Callback when user confirms withdrawal - now accepts multiple positions */
  onWithdrawMultiple: (requests: WithdrawRequest[]) => Promise<void>;
  disabled?: boolean;
}

function WithdrawOnlyPanel({
  positions,
  onWithdrawMultiple,
  disabled = false,
}: WithdrawOnlyPanelProps) {
  const { t } = useTranslation();
  const { preview, currentPreview, loading: previewLoading } = usePreviewRedeem();

  // Filter only positions with shares > 0
  const availablePositions = positions.filter(p => p.shares > 0n);

  // Selected position indices (Set for multi-select with toggle)
  const [selectedIndexes, setSelectedIndexes] = useState<Set<number>>(() => {
    // Auto-select all positions on mount
    return new Set(availablePositions.map((_, i) => i));
  });

  // Get selected positions
  const selectedPositions = availablePositions.filter((_, i) => selectedIndexes.has(i));

  // Toggle selection on click
  const toggleSelection = (index: number) => {
    setSelectedIndexes(prev => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  };

  // Total of all selected positions in TRUST
  const totalSelectedFloat = selectedPositions.reduce(
    (sum, pos) => sum + parseFloat(formatEther(pos.shares)),
    0
  );
  const formattedTotalSelected = truncateAmount(totalSelectedFloat);

  // Withdraw percentage (0-100)
  const [withdrawPercent, setWithdrawPercent] = useState(100);

  // Reset to 100% when selection changes
  useEffect(() => {
    setWithdrawPercent(100);
  }, [selectedIndexes.size]);

  // Calculate amount to withdraw based on percentage
  const withdrawAmountFloat = (totalSelectedFloat * withdrawPercent) / 100;
  const formattedWithdrawAmount = truncateAmount(withdrawAmountFloat);

  // Calculate shares to withdraw for each selected position (proportional)
  const withdrawRequests = useMemo((): WithdrawRequest[] => {
    if (selectedPositions.length === 0 || withdrawPercent === 0) return [];

    return selectedPositions.map(pos => {
      const sharesToWithdraw = BigInt(Math.floor(Number(pos.shares) * withdrawPercent / 100));
      return {
        termId: pos.termId,
        shares: sharesToWithdraw,
        curveId: pos.curveId,
        direction: pos.direction,
        percentage: withdrawPercent,
      };
    }).filter(req => req.shares > 0n);
  }, [selectedPositions, withdrawPercent]);

  // Total shares to withdraw (for display)
  const totalSharesToWithdraw = withdrawRequests.reduce((sum, req) => sum + req.shares, 0n);

  // Handle percentage change from slider
  const handlePercentChange = (newPercent: number) => {
    setWithdrawPercent(Math.max(0, Math.min(100, newPercent)));
  };

  // Preview withdrawal (simplified - just show percentage of total)
  // Use stable dependencies: only trigger when selection or percent actually changes
  const selectedPositionsCount = selectedPositions.length;
  const firstSelectedTermId = selectedPositions[0]?.termId;
  const firstSelectedShares = selectedPositions[0]?.shares;

  useEffect(() => {
    if (selectedPositionsCount === 1 && firstSelectedShares && firstSelectedShares > 0n) {
      const shares = BigInt(Math.floor(Number(firstSelectedShares) * withdrawPercent / 100));
      if (shares > 0n && firstSelectedTermId) {
        preview(firstSelectedTermId, shares);
      }
    }
  }, [selectedPositionsCount, firstSelectedTermId, firstSelectedShares, withdrawPercent, preview]);

  const handleWithdrawSubmit = async () => {
    if (withdrawRequests.length > 0) {
      await onWithdrawMultiple(withdrawRequests);
    }
  };

  // Quick presets
  const handlePreset = (percent: number) => {
    handlePercentChange(percent);
  };

  // Helper to get position label
  const getPositionLabel = (pos: PositionInfo) => {
    const directionLabel = pos.direction === 'for' ? 'Support' : 'Oppose';
    const curveLabel = pos.curveId === 1 ? 'Linear' : 'Progressive';
    const amount = truncateAmount(formatEther(pos.shares));
    return { directionLabel, curveLabel, amount };
  };

  // If no positions available
  if (availablePositions.length === 0) {
    return (
      <div className="bg-orange-500/10 border border-orange-500/30 rounded-lg p-4 text-center">
        <p className="text-orange-300 text-sm mb-2">
          {t('founderExpanded.noPositionToWithdraw') || 'Vous n\'avez pas de position sur ce totem'}
        </p>
      </div>
    );
  }

  // Determine background color based on majority of selected positions
  const hasSupportSelected = selectedPositions.some(p => p.direction === 'for');
  const hasOpposeSelected = selectedPositions.some(p => p.direction === 'against');
  // Use inline styles for Intuition colors
  const getBgStyle = () => {
    if (hasSupportSelected && hasOpposeSelected) {
      return { backgroundColor: `${OPPOSE_COLORS.base}10`, borderColor: `${OPPOSE_COLORS.base}30` }; // Mixed
    }
    if (hasSupportSelected) {
      return { backgroundColor: `${SUPPORT_COLORS.base}10`, borderColor: `${SUPPORT_COLORS.base}30` };
    }
    if (hasOpposeSelected) {
      return { backgroundColor: `${OPPOSE_COLORS.base}10`, borderColor: `${OPPOSE_COLORS.base}30` };
    }
    return undefined;
  };
  const bgStyle = getBgStyle();

  return (
    <div className="border rounded-lg p-4 space-y-4" style={bgStyle || { backgroundColor: 'rgba(255,255,255,0.05)', borderColor: 'rgba(255,255,255,0.1)' }}>
      {/* Position Selector - Multi-select with toggle */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-white/50">
            {t('founderExpanded.selectPositions', 'Sélectionnez les positions à retirer')}
          </span>
          <span className="text-xs text-orange-300">
            {selectedIndexes.size}/{availablePositions.length} sélectionnées
          </span>
        </div>
        <div className="grid gap-2">
          {availablePositions.map((pos, index) => {
            const { directionLabel, curveLabel, amount } = getPositionLabel(pos);
            const isSelected = selectedIndexes.has(index);
            const directionColors = pos.direction === 'for' ? SUPPORT_COLORS : OPPOSE_COLORS;
            const curveColors = pos.curveId === 1 ? CURVE_COLORS.linear : CURVE_COLORS.progressive;

            return (
              <button
                key={`${pos.direction}-${pos.curveId}`}
                onClick={() => toggleSelection(index)}
                className={`flex items-center justify-between p-3 rounded-lg border transition-all ${
                  isSelected ? 'ring-1' : 'bg-white/5 border-white/10 hover:bg-white/10 opacity-60'
                }`}
                style={isSelected ? {
                  backgroundColor: `${directionColors.base}20`,
                  borderColor: `${directionColors.base}50`,
                  boxShadow: `0 0 0 1px ${directionColors.base}30`,
                } : undefined}
              >
                <div className="flex items-center gap-2">
                  {/* Checkbox indicator */}
                  <span className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                    isSelected
                      ? 'bg-orange-500 border-orange-500'
                      : 'border-white/30 bg-transparent'
                  }`}>
                    {isSelected && (
                      <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </span>
                  <span className="font-medium" style={{ color: directionColors.base }}>{directionLabel}</span>
                  <span
                    className="text-xs px-1.5 py-0.5 rounded bg-white/10"
                    style={{ color: curveColors.text }}
                  >
                    {curveLabel}
                  </span>
                </div>
                <span className="text-white font-medium">{amount} TRUST</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Show withdraw controls only when at least one position is selected */}
      {selectedIndexes.size > 0 && (
        <>
          {/* Withdraw Amount Display - Real-time feedback */}
          <div className="bg-black/30 rounded-lg p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-white/70">{t('founderExpanded.withdrawAmount')}</span>
              <span className="text-sm text-orange-300 font-medium">{withdrawPercent}%</span>
            </div>
            <div className="text-center">
              <span className="text-2xl font-bold text-orange-400">{formattedWithdrawAmount}</span>
              <span className="text-lg text-white/50 ml-1">/ {formattedTotalSelected} TRUST</span>
            </div>
            {selectedIndexes.size > 1 && (
              <p className="text-xs text-white/40 text-center mt-1">
                ({selectedIndexes.size} positions sélectionnées)
              </p>
            )}
          </div>

          {/* Percentage Slider */}
          <div className="space-y-2">
            <input
              type="range"
              min={0}
              max={100}
              step={1}
              value={withdrawPercent}
              onChange={(e) => handlePercentChange(parseInt(e.target.value))}
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

          {/* Preview - Single position shows detailed preview */}
          {previewLoading ? (
            <div className="text-sm text-white/50 text-center">{t('common.loading')}</div>
          ) : selectedPositions.length === 1 && currentPreview && totalSharesToWithdraw > 0n ? (
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
          ) : selectedPositions.length > 1 && totalSharesToWithdraw > 0n ? (
            <div className="bg-black/20 rounded-lg p-3">
              <p className="text-xs text-white/50 text-center">
                {withdrawRequests.length} retraits seront effectués séquentiellement
              </p>
            </div>
          ) : withdrawPercent === 0 ? (
            <div className="text-sm text-white/40 text-center">{t('founderExpanded.selectWithdrawAmount')}</div>
          ) : null}

          {/* Confirm Button */}
          <button
            onClick={handleWithdrawSubmit}
            disabled={disabled || totalSharesToWithdraw <= 0n}
            className="w-full px-4 py-3 bg-orange-500 text-white rounded-lg font-medium hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {withdrawPercent === 100
              ? selectedIndexes.size > 1
                ? t('founderExpanded.withdrawAllPositions', 'Retirer tout') + ` (${selectedIndexes.size})`
                : t('founderExpanded.withdrawAll')
              : t('founderExpanded.confirmWithdraw')}
          </button>
        </>
      )}
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
  /** Callback when user's position is detected - helps sync curve filter in parent */
  onUserPositionDetected?: (position: { direction: 'for' | 'against'; curveId: CurveId } | null) => void;
  /** Trigger to refetch positions (increment to refetch) */
  refetchTrigger?: number;
}

export function VoteTotemPanel({
  founder,
  selectedTotemId,
  selectedTotemLabel,
  newTotemData,
  onOpenCart,
  onUserPositionDetected,
  refetchTrigger,
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
  } = useVoteCartContext();
  // Note: initCart is called by FounderExpandedView which provides the context

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
  const [error, setError] = useState<string | null>(null);

  // Track previous form step for animations
  const prevFormStepRef = useRef<number>(-1);

  // Blur step utility function with animation classes
  // Returns: base blur class + animation class if step changed
  const getBlurClass = (elementStep: number, currentStep: number): string => {
    const distance = elementStep - currentStep;
    const prevStep = prevFormStepRef.current;
    const prevDistance = elementStep - prevStep;

    // Determine base blur class
    let blurClass = 'blur-transition';
    if (distance <= 0) blurClass = 'blur-step-none blur-transition';
    else if (distance === 1) blurClass = 'blur-step-1 blur-transition';
    else if (distance === 2) blurClass = 'blur-step-2 blur-transition';
    else blurClass = 'blur-step-3 blur-transition';

    // Add animation class if step changed and element is becoming visible
    // step-reveal: element just became the current step (was blurred, now clear)
    if (currentStep !== prevStep) {
      if (distance <= 0 && prevDistance > 0) {
        blurClass += ' step-reveal';
      }
      // step-reduce-blur: element was 2+ steps away, now 1 step away
      else if (distance === 1 && prevDistance >= 2) {
        blurClass += ' step-reduce-blur';
      }
    }

    return blurClass;
  };

  // Pulsation utility function - guides user to next step
  // Mode 1: First visit (no position) → neutral glow (gray)
  // Mode 2: Return visit (has position) → violet border + scale
  const getPulseClass = (elementStep: number, isElementSelected: boolean): string => {
    // Don't pulse if element is already selected
    if (isElementSelected) return '';
    // Only pulse the current step
    if (elementStep !== currentFormStep) return '';
    // Choose pulse style based on whether user has a position
    return hasAnyPosition ? 'return-visit-pulse' : 'first-visit-pulse';
  };

  // Current form step based on selections
  // Step -1: Select totem (in FounderCenterPanel), Step 0: Predicate, Step 1: Direction, Step 2: Curve, Step 3: Amount
  const currentFormStep = useMemo(() => {
    // No totem selected = step -1 (totem selection phase)
    if (!selectedTotemId && !newTotemData) return -1;
    if (!selectedPredicateId) return 0;
    if (operationMode === 'redeem') return 3; // Skip direction/curve for redeem
    if (!voteDirection || voteDirection === 'withdraw') return 1;
    if (!selectedCurve) return 2;
    return 3;
  }, [selectedTotemId, newTotemData, selectedPredicateId, operationMode, voteDirection, selectedCurve]);

  // Update prevFormStepRef after render (for animation detection)
  useEffect(() => {
    // Use a small delay to ensure animations have time to play before updating ref
    const timer = setTimeout(() => {
      prevFormStepRef.current = currentFormStep;
    }, 350); // Slightly longer than animation duration (300ms)
    return () => clearTimeout(timer);
  }, [currentFormStep]);

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

  // Refetch positions when refetchTrigger changes (after cart validation)
  useEffect(() => {
    if (refetchTrigger && refetchTrigger > 0) {
      console.log('[VoteTotemPanel] Refetching positions due to trigger:', refetchTrigger);
      refetchPosition();
    }
  }, [refetchTrigger, refetchPosition]);

  // INTUITION Rule: Cannot have Support AND Oppose on same curve
  // Calculate which curves are available based on existing positions AND cart items
  const curveAvailability = useMemo(() => {
    const direction = voteDirection === 'for' ? 'support' : voteDirection === 'against' ? 'oppose' : null;

    // No blocking for withdraw mode or if no direction selected
    if (!direction || voteDirection === 'withdraw') {
      return { linear: true, progressive: true, blockedReason: null, allBlocked: false };
    }

    // Check if opposite position exists on each curve (from on-chain positions)
    // If I want to Support, check if Oppose exists. If I want to Oppose, check if Support exists.
    let linearBlockedByPosition = direction === 'support' ? hasAgainstPositionLinear : hasForPositionLinear;
    let progressiveBlockedByPosition = direction === 'support' ? hasAgainstPositionProgressive : hasForPositionProgressive;

    // Also check cart items for this totem
    // If cart has an opposite direction vote on a curve, block that curve
    let linearBlockedByCart = false;
    let progressiveBlockedByCart = false;

    if (cart && selectedTotemId) {
      const cartItemsForTotem = cart.items.filter(item => item.totemId === selectedTotemId);
      for (const item of cartItemsForTotem) {
        const itemIsSupport = item.direction === 'for';
        const itemIsOppose = item.direction === 'against';

        // If I want Support, check if cart has Oppose on this curve
        // If I want Oppose, check if cart has Support on this curve
        if (direction === 'support' && itemIsOppose) {
          if (item.curveId === 1) linearBlockedByCart = true;
          if (item.curveId === 2) progressiveBlockedByCart = true;
        } else if (direction === 'oppose' && itemIsSupport) {
          if (item.curveId === 1) linearBlockedByCart = true;
          if (item.curveId === 2) progressiveBlockedByCart = true;
        }
      }
    }

    const linearBlocked = linearBlockedByPosition || linearBlockedByCart;
    const progressiveBlocked = progressiveBlockedByPosition || progressiveBlockedByCart;

    // Build blocked reason message
    let blockedReason: string | null = null;
    const oppositeDirection = direction === 'support' ? 'Oppose' : 'Support';

    if (linearBlocked && progressiveBlocked) {
      const source = (linearBlockedByCart || progressiveBlockedByCart) ? ' (panier inclus)' : '';
      blockedReason = `Position ${oppositeDirection} sur les deux curves${source}. Faites un Redeem d'abord.`;
    } else if (linearBlocked) {
      const source = linearBlockedByCart ? ' (dans le panier)' : '';
      blockedReason = `Position ${oppositeDirection} sur Linear${source}. ${direction === 'support' ? 'Support' : 'Oppose'} uniquement sur Progressive.`;
    } else if (progressiveBlocked) {
      const source = progressiveBlockedByCart ? ' (dans le panier)' : '';
      blockedReason = `Position ${oppositeDirection} sur Progressive${source}. ${direction === 'support' ? 'Support' : 'Oppose'} uniquement sur Linear.`;
    }

    return {
      linear: !linearBlocked,
      progressive: !progressiveBlocked,
      blockedReason,
      allBlocked: linearBlocked && progressiveBlocked,
    };
  }, [voteDirection, hasForPositionLinear, hasForPositionProgressive, hasAgainstPositionLinear, hasAgainstPositionProgressive, cart, selectedTotemId]);

  // Withdraw hook
  const {
    withdraw,
    isLoading: withdrawLoading,
    reset: resetWithdraw,
  } = useWithdraw();

  // Ref to store onUserPositionDetected to avoid re-renders when parent recreates the callback
  const onUserPositionDetectedRef = useRef(onUserPositionDetected);
  useEffect(() => {
    onUserPositionDetectedRef.current = onUserPositionDetected;
  }, [onUserPositionDetected]);

  // Auto-select direction and curve based on user's existing position
  // This provides visual feedback that matches user's current vote
  // Also reset operationMode to 'deposit' if user has no position on this totem
  useEffect(() => {
    if (positionLoading) return; // Wait for position data to load

    // IMPORTANT: Reset to deposit mode if no position on this totem
    // This fixes the bug where switching totems keeps "redeem" selected
    // Use functional update to avoid needing operationMode in deps
    if (!hasAnyPosition) {
      setOperationMode(prev => prev === 'redeem' ? 'deposit' : prev);
    }

    if (hasAnyPosition && positionDirection) {
      // Auto-select direction to match existing position
      setVoteDirection(positionDirection);
    }

    if (hasAnyPosition && positionCurveId) {
      // Auto-select curve to match existing position
      setSelectedCurve(positionCurveId);
    }

    // Notify parent of user's position (for syncing curve filter in charts)
    // Use ref to avoid re-renders from unstable callback reference
    const callback = onUserPositionDetectedRef.current;
    if (callback) {
      if (hasAnyPosition && positionDirection && positionCurveId) {
        callback({ direction: positionDirection, curveId: positionCurveId });
      } else {
        callback(null);
      }
    }
  }, [hasAnyPosition, positionDirection, positionCurveId, positionLoading, selectedTotemId]);

  // Auto-select the only available curve when one is blocked (INTUITION rule)
  useEffect(() => {
    if (voteDirection === 'withdraw') return;

    // If only Linear is available, select it
    if (!curveAvailability.linear && curveAvailability.progressive) {
      setSelectedCurve(CURVE_PROGRESSIVE);
    }
    // If only Progressive is available, select it
    else if (curveAvailability.linear && !curveAvailability.progressive) {
      setSelectedCurve(CURVE_LINEAR);
    }
  }, [curveAvailability.linear, curveAvailability.progressive, voteDirection]);

  // Calculate minimum required amount based on creation mode
  // For new totem creation:
  //   - 2 triples minimum: Founder→predicate→Totem + Totem→hasCategory→Category
  //   - 3 triples if new category: + Category→tagCategory→System
  // For existing totem with new triple: 1 triple
  // For existing triple: just minDeposit
  //
  // IMPORTANT: Use BigInt arithmetic to preserve exact wei precision!
  // The protocol's tripleCost is NOT exactly 0.001 (e.g., 1000000002000000 wei)
  //
  // We compute TWO values:
  // - minRequiredExact: The EXACT value required by the contract (used for presets and validation)
  // - minRequiredDisplay: Truncated for clean UI display (e.g., "0.002" instead of "0.002000000002")
  //
  const { minRequiredExact, minRequiredDisplay } = useMemo(() => {
    if (!protocolConfig) return { minRequiredExact: '0.001', minRequiredDisplay: '0.001' };

    // Convert string values to BigInt for exact arithmetic
    const tripleCostBigInt = BigInt(protocolConfig.tripleCost);
    const minDepositBigInt = BigInt(protocolConfig.minDeposit);

    let totalBigInt: bigint;

    // Creating a brand new totem (from creation form)
    if (newTotemData) {
      // 2 triples if existing category, 3 if new category
      const triplesNeeded = BigInt(newTotemData.isNewCategory ? 3 : 2);
      totalBigInt = (tripleCostBigInt * triplesNeeded) + minDepositBigInt;
    }
    // Existing totem but new relationship triple
    else if (isNewTotem) {
      totalBigInt = tripleCostBigInt + minDepositBigInt;
    }
    // Existing triple: just minDeposit
    else {
      totalBigInt = minDepositBigInt;
    }

    // formatEther gives exact string representation (e.g., "0.002000000002")
    const exact = formatEther(totalBigInt);

    // Truncate for clean UI display (e.g., "0.002")
    // User sees "0.002" but we actually use the exact value for validation
    const display = truncateAmount(exact);

    return { minRequiredExact: exact, minRequiredDisplay: display };
  }, [protocolConfig, isNewTotem, newTotemData]);

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

  // Calculate position for the selected direction+curve combination
  // This shows the user their current position on the exact selection they made
  const selectedCombinationPosition = useMemo(() => {
    if (!voteDirection || voteDirection === 'withdraw' || !selectedCurve) {
      return { shares: 0n, formatted: '0', hasPosition: false };
    }

    let shares: bigint;
    if (voteDirection === 'for') {
      shares = selectedCurve === CURVE_LINEAR ? forSharesLinear : forSharesProgressive;
    } else {
      shares = selectedCurve === CURVE_LINEAR ? againstSharesLinear : againstSharesProgressive;
    }

    return {
      shares,
      formatted: shares > 0n ? truncateAmount(formatEther(shares)) : '0',
      hasPosition: shares > 0n,
    };
  }, [voteDirection, selectedCurve, forSharesLinear, forSharesProgressive, againstSharesLinear, againstSharesProgressive]);

  // Calculate pending amount in cart for current selection (totem + direction + curve)
  const pendingCartAmount = useMemo(() => {
    if (!cart || !selectedTotemId || !voteDirection || voteDirection === 'withdraw' || !selectedCurve) {
      return { amount: 0n, formatted: '0', hasPending: false };
    }

    // Find cart item matching current selection
    const direction = voteDirection as 'for' | 'against';
    const matchingItem = cart.items.find(
      item =>
        item.totemId === selectedTotemId &&
        item.direction === direction &&
        item.curveId === selectedCurve
    );

    if (!matchingItem) {
      return { amount: 0n, formatted: '0', hasPending: false };
    }

    return {
      amount: matchingItem.amount,
      formatted: truncateAmount(formatEther(matchingItem.amount)),
      hasPending: true,
    };
  }, [cart, selectedTotemId, voteDirection, selectedCurve]);

  // Cross-predicate detection: group votes by predicate for this totem
  // This is computed BEFORE any predicate selection to enable proper blocking
  const votesOnTotemByPredicate = useMemo(() => {
    const result: Record<string, typeof userVotesForFounder> = {
      'has totem': [],
      'embodies': [],
    };

    if (!selectedTotemId || !userVotesForFounder.length) {
      return result;
    }

    // Find all votes on this totem
    const votesOnTotem = userVotesForFounder.filter(
      v => v.term?.object?.term_id === selectedTotemId
    );

    // Group by predicate
    for (const vote of votesOnTotem) {
      const predicateLabel = vote.term?.predicate?.label;
      if (predicateLabel && result[predicateLabel] !== undefined) {
        result[predicateLabel].push(vote);
      }
    }

    return result;
  }, [selectedTotemId, userVotesForFounder]);

  // Check if a predicate is blocked (user has votes with the OTHER predicate on this totem)
  const isPredicateBlocked = (predicateLabel: string): boolean => {
    const otherPredicate = predicateLabel === 'has totem' ? 'embodies' : 'has totem';
    return votesOnTotemByPredicate[otherPredicate]?.length > 0;
  };

  // Get votes to redeem when switching to a blocked predicate
  const getVotesToRedeem = (targetPredicateLabel: string) => {
    const otherPredicate = targetPredicateLabel === 'has totem' ? 'embodies' : 'has totem';
    const votes = votesOnTotemByPredicate[otherPredicate] || [];
    const total = votes.reduce((sum, v) => sum + parseFloat(v.formattedAmount), 0);
    return {
      votes,
      otherPredicateLabel: otherPredicate,
      totalToRedeem: truncateAmount(total),
    };
  };

  // State for cross-predicate popup
  const [showCrossPredicatePopup, setShowCrossPredicatePopup] = useState(false);
  const [crossPredicateLoading, setCrossPredicateLoading] = useState(false);
  const [pendingPredicateId, setPendingPredicateId] = useState<string | null>(null);

  // Get redeem info for pending predicate
  const pendingPredicateLabel = pendingPredicateId
    ? predicates.find(p => p.id === pendingPredicateId)?.label
    : null;
  const crossPredicateRedeemInfo = pendingPredicateLabel
    ? getVotesToRedeem(pendingPredicateLabel)
    : null;

  // Handle click on blocked predicate (show popup)
  const handleBlockedPredicateClick = (predicateId: string) => {
    setPendingPredicateId(predicateId);
    setShowCrossPredicatePopup(true);
  };

  // Handle redeem all positions with other predicate
  const handleRedeemAllCrossPredicate = async () => {
    if (!crossPredicateRedeemInfo?.votes.length) return;

    setCrossPredicateLoading(true);
    try {
      // Redeem each position one by one
      for (const vote of crossPredicateRedeemInfo.votes) {
        const shares = BigInt(vote.shares);
        if (shares <= 0n) continue;

        await withdraw(
          vote.term_id as Hex,
          shares,
          vote.isPositive,
          0n // minAssets
        );
      }

      setSuccess(t('founderExpanded.crossPredicateRedeemSuccess', 'Positions retirées avec succès !'));
      setTimeout(() => setSuccess(null), 3000);
      setShowCrossPredicatePopup(false);

      // Now select the predicate user wanted
      if (pendingPredicateId) {
        setSelectedPredicateId(pendingPredicateId);
      }
      setPendingPredicateId(null);

      // Refetch position after successful withdraw
      refetchPosition();
    } catch (err) {
      console.error('[VoteTotemPanel] Cross-predicate redeem error:', err);
      setError(t('founderExpanded.crossPredicateRedeemError', 'Erreur lors du retrait'));
      setTimeout(() => setError(null), 3000);
    } finally {
      setCrossPredicateLoading(false);
    }
  };

  // Track pending redeem curve when user wants to change direction
  // This is displayed as a message and passed to cart for execution
  const [pendingRedeemCurve, setPendingRedeemCurve] = useState<CurveId | null>(null);

  // Calculate positions to redeem for each curve when both curves are blocked
  // This is shown inline (not in a popup) between Direction and Curve sections
  const directionChangeInfo = useMemo(() => {
    // Only show when both curves are blocked AND user hasn't chosen one yet
    if (!curveAvailability.allBlocked || !voteDirection || voteDirection === 'withdraw') return null;

    // Get the opposite direction's positions (what we need to redeem)
    const linearPosition = voteDirection === 'against'
      ? { shares: forSharesLinear, formatted: forSharesLinear > 0n ? truncateAmount(formatEther(forSharesLinear)) : '0', hasPosition: forSharesLinear > 0n }
      : { shares: againstSharesLinear, formatted: againstSharesLinear > 0n ? truncateAmount(formatEther(againstSharesLinear)) : '0', hasPosition: againstSharesLinear > 0n };

    const progressivePosition = voteDirection === 'against'
      ? { shares: forSharesProgressive, formatted: forSharesProgressive > 0n ? truncateAmount(formatEther(forSharesProgressive)) : '0', hasPosition: forSharesProgressive > 0n }
      : { shares: againstSharesProgressive, formatted: againstSharesProgressive > 0n ? truncateAmount(formatEther(againstSharesProgressive)) : '0', hasPosition: againstSharesProgressive > 0n };

    const currentDirectionLabel = voteDirection === 'against' ? 'Support' : 'Oppose';
    const targetDirectionLabel = voteDirection === 'against' ? 'Oppose' : 'Support';

    return {
      linear: linearPosition,
      progressive: progressivePosition,
      currentDirectionLabel,
      targetDirectionLabel,
    };
  }, [curveAvailability.allBlocked, voteDirection, forSharesLinear, forSharesProgressive, againstSharesLinear, againstSharesProgressive]);

  // Handle direction button click
  // Always sets direction - if both curves are blocked, the inline curve choice will appear
  const handleDirectionClick = (direction: 'for' | 'against') => {
    // Reset pending redeem curve when changing direction
    setPendingRedeemCurve(null);
    setSelectedCurve(null);
    setVoteDirection(direction);
  };

  // Handle curve choice when both curves are blocked (inline section)
  // Does NOT execute redeem - just selects curve and stores pending redeem info
  // The actual redeem will be executed by the cart when processing the vote
  const handleDirectionChangeCurveChoice = (curveId: CurveId) => {
    if (!directionChangeInfo) return;

    const position = curveId === CURVE_LINEAR ? directionChangeInfo.linear : directionChangeInfo.progressive;
    if (!position.hasPosition) return;

    // Set curve selection and track which curve needs redeem
    setSelectedCurve(curveId);
    setPendingRedeemCurve(curveId);
  };

  // Calculate pending redeem info for display (after user chose a curve)
  const pendingRedeemInfo = useMemo(() => {
    if (!pendingRedeemCurve || !voteDirection) return null;

    // Get the shares that will be redeemed (opposite direction on the chosen curve)
    const isRedeemingFor = voteDirection === 'against'; // If we're going to Oppose, we redeem For
    const shares = pendingRedeemCurve === CURVE_LINEAR
      ? (isRedeemingFor ? forSharesLinear : againstSharesLinear)
      : (isRedeemingFor ? forSharesProgressive : againstSharesProgressive);

    if (shares <= 0n) return null;

    return {
      curveId: pendingRedeemCurve,
      curveLabel: pendingRedeemCurve === CURVE_LINEAR ? 'Linear' : 'Progressive',
      shares,
      formatted: truncateAmount(formatEther(shares)),
      redeemDirection: isRedeemingFor ? 'Support' : 'Oppose',
      newDirection: voteDirection === 'for' ? 'Support' : 'Oppose',
    };
  }, [pendingRedeemCurve, voteDirection, forSharesLinear, forSharesProgressive, againstSharesLinear, againstSharesProgressive]);

  // Handle withdraw from WithdrawOnlyPanel (multi-position version)
  const handleWithdrawMultiple = async (requests: WithdrawRequest[]) => {
    if (requests.length === 0) return;

    console.log('[VoteTotemPanel] WithdrawMultiple:', {
      count: requests.length,
      requests: requests.map(r => ({
        termId: r.termId,
        shares: r.shares.toString(),
        curveId: r.curveId,
        direction: r.direction,
        percentage: r.percentage,
      })),
    });

    let successCount = 0;
    let failCount = 0;

    // Execute withdrawals sequentially
    for (const request of requests) {
      try {
        const txHash = await withdraw(
          request.termId,
          request.shares,
          request.direction === 'for',
          0n, // minAssets (slippage protection)
          request.curveId as 1 | 2
        );

        if (txHash) {
          successCount++;
          console.log(`[VoteTotemPanel] Withdraw ${successCount}/${requests.length} success:`, txHash);
        } else {
          failCount++;
        }
      } catch (err) {
        console.error('[VoteTotemPanel] Withdraw error:', err);
        failCount++;
      }
    }

    // Show result notification
    if (successCount > 0 && failCount === 0) {
      const msg = requests.length > 1
        ? `${successCount} retraits effectués !`
        : t('withdraw.success') || 'Retrait effectué !';
      setSuccess(msg);
      setTimeout(() => setSuccess(null), 3000);
    } else if (successCount > 0) {
      setSuccess(`${successCount}/${requests.length} retraits réussis`);
      setTimeout(() => setSuccess(null), 3000);
    } else {
      setError(t('withdraw.error') || 'Erreur lors du retrait');
      setTimeout(() => setError(null), 3000);
    }

    // Refetch position after withdrawals
    refetchPosition();
    resetWithdraw();
  };

  // Build list of all available positions for WithdrawOnlyPanel
  const allUserPositions = useMemo((): PositionInfo[] => {
    if (!proactiveClaimInfo) return [];

    const positions: PositionInfo[] = [];

    // Support Linear
    if (forSharesLinear > 0n) {
      positions.push({
        direction: 'for',
        curveId: 1,
        shares: forSharesLinear,
        termId: proactiveClaimInfo.termId as Hex,
      });
    }

    // Support Progressive
    if (forSharesProgressive > 0n) {
      positions.push({
        direction: 'for',
        curveId: 2,
        shares: forSharesProgressive,
        termId: proactiveClaimInfo.termId as Hex,
      });
    }

    // Oppose Linear
    if (againstSharesLinear > 0n) {
      positions.push({
        direction: 'against',
        curveId: 1,
        shares: againstSharesLinear,
        termId: proactiveClaimInfo.counterTermId as Hex,
      });
    }

    // Oppose Progressive
    if (againstSharesProgressive > 0n) {
      positions.push({
        direction: 'against',
        curveId: 2,
        shares: againstSharesProgressive,
        termId: proactiveClaimInfo.counterTermId as Hex,
      });
    }

    return positions;
  }, [proactiveClaimInfo, forSharesLinear, forSharesProgressive, againstSharesLinear, againstSharesProgressive]);

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
    // If user chose to change direction via popup (pendingRedeemInfo), use the specific curve they chose
    const currentPositionForCart = pendingRedeemInfo
      ? {
          direction: (pendingRedeemInfo.redeemDirection === 'Support' ? 'for' : 'against') as 'for' | 'against',
          shares: pendingRedeemInfo.shares,
          curveId: pendingRedeemInfo.curveId,
        }
      : hasAnyPosition && positionDirection && positionCurveId
        ? { direction: positionDirection, shares: currentUserShares, curveId: positionCurveId }
        : undefined;

    // Build cart item differently for new totem creation vs existing totem vote
    // Note: selectedCurve is guaranteed to be non-null by isFormValid check
    const cartItem = isCreatingNewTotem
      ? {
          // New totem creation - totemId will be set after atom creation
          totemId: null,
          totemName: newTotemData.name,
          predicateId: selectedPredicateWithAtom.atomId as Hex,
          termId: null, // Will be set after triple creation
          counterTermId: null, // Will be set after triple creation
          direction: voteDirection as 'for' | 'against',
          curveId: selectedCurve!, // Non-null asserted (isFormValid guarantees)
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
          curveId: selectedCurve!, // Non-null asserted (isFormValid guarantees)
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

      // Reset amount after adding (use display value for clean UI)
      if (minRequiredDisplay) {
        setTrustAmount(minRequiredDisplay);
      }

      // Reset pending redeem state (direction change popup)
      if (pendingRedeemCurve) {
        setPendingRedeemCurve(null);
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
        {/* Triple Header: Tags/Bulles style */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Founder Tag */}
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-white/10 rounded-full">
            <img
              src={getFounderImageUrl(founder)}
              alt={founder.name}
              className="w-5 h-5 rounded-full object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
            <span className="text-xs font-medium text-white">{founder.name}</span>
          </div>

          {/* Predicate Tag (blur if not selected) - key forces re-render with animation */}
          {/* Ring pulse effect when selected */}
          <div
            key={selectedPredicateId || 'no-predicate'}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-full ${
              selectedPredicateId
                ? 'bg-slate-500/30 animate-blur-to-focus animate-ring-pulse'
                : 'bg-white/5 ring-1 ring-slate-500/30 blur-xs'
            }`}
          >
            <span className={`text-xs font-medium ${selectedPredicateId ? 'text-slate-200' : 'text-white/40'}`}>
              {selectedPredicate?.label || '???'}
            </span>
          </div>

          {/* Totem Tag (blur if not selected) - key forces re-render with animation */}
          {/* Ring pulse effect when selected */}
          <div
            key={selectedTotemId || 'no-totem'}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-full ${
              selectedTotemLabel || newTotemData
                ? 'bg-slate-500/30 animate-blur-to-focus animate-ring-pulse'
                : 'bg-white/5 ring-1 ring-slate-500/30 blur-xs'
            }`}
          >
            {/* Totem image/emoji/initial */}
            {(selectedTotemLabel || newTotemData) && (
              selectedTotemInfo?.image ? (
                <img
                  src={selectedTotemInfo.image}
                  alt={selectedTotemLabel || newTotemData?.name || ''}
                  className="w-5 h-5 rounded-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              ) : (
                <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-[10px]">
                  {selectedTotemInfo?.emoji || (selectedTotemLabel || newTotemData?.name || '?').charAt(0).toUpperCase()}
                </div>
              )
            )}
            <span className={`text-xs font-medium ${selectedTotemLabel || newTotemData ? 'text-white' : 'text-white/40'}`}>
              {newTotemData ? (
                <>
                  {newTotemData.name}
                  <span className="text-orange-400/70 ml-1">✨</span>
                </>
              ) : selectedTotemLabel || '???'}
            </span>
          </div>
        </div>

        {/* Predicate Selector - Step 0 with blur and pulsation */}
        {/* Cross-predicate rule: blur alternative predicate if votes exist with other predicate */}
        {/* Two visual states: current selection (animate-ring-pulse) vs default (ring-slate) */}
        <div className={`${getBlurClass(0, currentFormStep)} blur-transition`}>
          <label className="block text-xs text-white/60 mb-1">{t('founderExpanded.relationType')}</label>
          <div className="grid grid-cols-2 gap-2">
            {predicates.slice(0, 2).map((predicate) => {
              // Check if this predicate is blocked (user has votes with OTHER predicate on this totem)
              const isBlocked = isPredicateBlocked(predicate.label);
              // Check if user has existing votes with THIS predicate (for "existing position" style)
              const hasVotesWithThis = votesOnTotemByPredicate[predicate.label]?.length > 0;

              return (
                <button
                  key={predicate.id}
                  onClick={() => {
                    if (isBlocked) {
                      // Show popup to explain and offer redeem
                      handleBlockedPredicateClick(predicate.id);
                    } else {
                      setSelectedPredicateId(predicate.id);
                    }
                  }}
                  className={`p-2 rounded-lg text-sm transition-colors ${
                    selectedPredicateId === predicate.id
                      ? 'bg-slate-500/30 text-slate-200 animate-ring-pulse'
                      : isBlocked
                        ? 'bg-white/5 text-white/40 ring-1 ring-slate-500/20 blur-xs cursor-pointer'
                        : hasVotesWithThis
                          ? 'bg-slate-500/10 text-slate-300/80 ring-1 ring-slate-400/50'
                          : 'bg-white/5 text-white/70 ring-1 ring-slate-500/30 hover:bg-white/10'
                  } ${getPulseClass(0, !!selectedPredicateId)}`}
                >
                  {predicate.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Cross-Predicate Popup Modal */}
        {showCrossPredicatePopup && crossPredicateRedeemInfo && crossPredicateRedeemInfo.votes.length > 0 && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => { setShowCrossPredicatePopup(false); setPendingPredicateId(null); }}>
            <div className="bg-slate-800 rounded-xl p-6 max-w-md mx-4 shadow-xl" onClick={e => e.stopPropagation()}>
              <h3 className="text-lg font-semibold text-amber-400 mb-4 flex items-center gap-2">
                <span>⚠️</span>
                {t('founderExpanded.crossPredicateTitle', 'Position existante avec autre predicate')}
              </h3>

              <p className="text-white/80 text-sm mb-4">
                {t('founderExpanded.crossPredicateDesc', 'Vous avez déjà voté sur ce totem avec')} "{crossPredicateRedeemInfo.otherPredicateLabel}".
                {t('founderExpanded.crossPredicateDesc2', ' Pour voter avec un autre predicate, vous devez d\'abord retirer vos positions.')}
              </p>

              <div className="bg-white/5 rounded-lg p-3 mb-4 space-y-1">
                {crossPredicateRedeemInfo.votes.map((vote, i) => (
                  <div key={i} className="flex justify-between text-sm">
                    <span style={{ color: vote.isPositive ? SUPPORT_COLORS.base : OPPOSE_COLORS.base }}>
                      {vote.isPositive ? 'Support' : 'Oppose'}{' '}
                      <span style={{ color: vote.curveId === 1 ? CURVE_COLORS.linear.text : CURVE_COLORS.progressive.text }}>
                        {vote.curveId === 1 ? 'Linear' : 'Progressive'}
                      </span>
                    </span>
                    <span className="text-white">{truncateAmount(vote.formattedAmount)} TRUST</span>
                  </div>
                ))}
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => { setShowCrossPredicatePopup(false); setPendingPredicateId(null); }}
                  className="flex-1 py-2 rounded-lg bg-white/10 text-white/70 hover:bg-white/20 transition-colors"
                >
                  {t('common.cancel', 'Annuler')}
                </button>
                <button
                  onClick={handleRedeemAllCrossPredicate}
                  disabled={crossPredicateLoading}
                  className="flex-1 py-2 rounded-lg bg-amber-600 text-white font-medium hover:bg-amber-700 transition-colors disabled:opacity-50"
                >
                  {crossPredicateLoading ? '...' : `Redeem (${crossPredicateRedeemInfo.totalToRedeem} TRUST)`}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Deposit/Redeem Switch - Step 1 */}
        {/* Two visual states: current selection (animate-ring-pulse) vs default (ring-slate) */}
        <div className={getBlurClass(1, currentFormStep)}>
          <label className="block text-xs text-white/60 mb-1">Mode</label>
          <div className="flex gap-2">
            {/* Deposit button */}
            <button
              onClick={() => setOperationMode('deposit')}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${
                operationMode === 'deposit'
                  ? 'bg-slate-500/30 text-slate-200 animate-ring-pulse'
                  : 'bg-white/5 text-white/60 ring-1 ring-slate-500/30 hover:bg-white/10'
              }`}
            >
              Deposit
            </button>
            {/* Redeem button - blur-disabled if no position */}
            <button
              onClick={() => hasAnyPosition && setOperationMode('redeem')}
              disabled={!hasAnyPosition}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${
                operationMode === 'redeem'
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
        {/* Two visual states: existing position (ring-slate) vs current selection (ring-white) */}
        {operationMode === 'deposit' && (
          <div className={getBlurClass(1, currentFormStep)}>
            <label className="block text-xs text-white/60 mb-1">Direction</label>
            <div className="flex gap-2">
              <button
                onClick={() => handleDirectionClick('for')}
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                  voteDirection === 'for'
                    ? 'bg-slate-500/30 animate-ring-pulse'
                    : hasAnyPosition && positionDirection === 'for'
                      ? 'bg-slate-500/10 text-slate-300/80 ring-1 ring-slate-400/50'
                      : 'bg-white/5 text-white/60 ring-1 ring-slate-500/30 hover:bg-white/10'
                } ${voteDirection !== 'for' ? getPulseClass(1, false) : ''}`}
                style={voteDirection === 'for' ? { color: SUPPORT_COLORS.base } : undefined}
              >
                {t('vote.support')}
              </button>
              <button
                onClick={() => handleDirectionClick('against')}
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                  voteDirection === 'against'
                    ? 'bg-slate-500/30 animate-ring-pulse'
                    : hasAnyPosition && positionDirection === 'against'
                      ? 'bg-slate-500/10 text-slate-300/80 ring-1 ring-slate-400/50'
                      : 'bg-white/5 text-white/60 ring-1 ring-slate-500/30 hover:bg-white/10'
                } ${voteDirection !== 'against' ? getPulseClass(1, false) : ''}`}
                style={voteDirection === 'against' ? { color: OPPOSE_COLORS.base } : undefined}
              >
                {t('vote.oppose')}
              </button>
            </div>
          </div>
        )}

        {/* Direction Change Section - Inline curve choice when both curves are blocked */}
        {/* Shows BEFORE user chooses a curve: title + choice buttons */}
        {directionChangeInfo && !pendingRedeemCurve && (
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3 space-y-3">
            <div className="flex items-start gap-2">
              <span className="text-amber-400 text-lg">⚠️</span>
              <div className="flex-1">
                <p className="text-amber-300 text-sm font-medium">
                  Position {directionChangeInfo.currentDirectionLabel} sur les deux curves
                </p>
                <p className="text-white/70 text-xs mt-1">
                  Pour faire {directionChangeInfo.targetDirectionLabel}, choisissez quelle curve retirer :
                </p>
              </div>
            </div>
            {/* Curve choice buttons */}
            <div className="flex gap-2">
              <button
                onClick={() => handleDirectionChangeCurveChoice(CURVE_LINEAR)}
                className="flex-1 py-2.5 rounded-lg text-sm font-medium transition-colors border"
                style={{
                  backgroundColor: `${CURVE_COLORS.linear.base}20`,
                  color: CURVE_COLORS.linear.text,
                  borderColor: `${CURVE_COLORS.linear.base}30`,
                }}
              >
                📊 Linear ({directionChangeInfo.linear.formatted})
              </button>
              <button
                onClick={() => handleDirectionChangeCurveChoice(CURVE_PROGRESSIVE)}
                className="flex-1 py-2.5 rounded-lg text-sm font-medium transition-colors border"
                style={{
                  backgroundColor: `${CURVE_COLORS.progressive.base}20`,
                  color: CURVE_COLORS.progressive.text,
                  borderColor: `${CURVE_COLORS.progressive.base}30`,
                }}
              >
                📈 Progressive ({directionChangeInfo.progressive.formatted})
              </button>
            </div>
          </div>
        )}

        {/* Pending Redeem Info Message - Shows AFTER user chose a curve */}
        {pendingRedeemInfo && (
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3 animate-blur-to-focus">
            <div className="flex items-start gap-2">
              <span className="text-amber-400 text-lg">🔄</span>
              <div className="flex-1">
                <p className="text-amber-300 text-sm font-medium">
                  {t('founderExpanded.pendingRedeemTitle', 'Changement de direction prévu')}
                </p>
                <p className="text-white/70 text-xs mt-1">
                  Votre position <span style={{ color: pendingRedeemInfo.redeemDirection === 'Support' ? SUPPORT_COLORS.base : OPPOSE_COLORS.base }}>{pendingRedeemInfo.redeemDirection}</span> sur{' '}
                  <span style={{ color: pendingRedeemInfo.curveId === CURVE_LINEAR ? CURVE_COLORS.linear.text : CURVE_COLORS.progressive.text }}>
                    {pendingRedeemInfo.curveLabel}
                  </span>{' '}
                  ({pendingRedeemInfo.formatted} TRUST) sera retirée lors de la validation du panier.
                </p>
                <p className="text-white/50 text-xs mt-1">
                  Entrez le montant pour votre nouvelle position <span style={{ color: pendingRedeemInfo.newDirection === 'Support' ? SUPPORT_COLORS.base : OPPOSE_COLORS.base }}>{pendingRedeemInfo.newDirection}</span>.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Curve Selector - Only show for FOR/AGAINST, not withdraw - Step 2 with pulsation */}
        {/* INTUITION Rule: Cannot have Support AND Oppose on same curve */}
        {voteDirection !== 'withdraw' && (
          <div className={getBlurClass(2, currentFormStep)}>
            <label className="block text-xs text-white/60 mb-1">
              {t('founderExpanded.curveType', 'Courbe de bonding')}
            </label>
            <div className="flex gap-2">
              {/* Linear button - blocked if opposing position exists on Linear */}
              {/* BUT: if pendingRedeemCurve is set, the chosen curve is "unlocked" (will be redeemed) */}
              {/* Two visual states: existing position (ring-slate) vs current selection (animate-ring-pulse) */}
              <button
                key={`linear-${pendingRedeemCurve === CURVE_LINEAR ? 'selected' : 'default'}`}
                onClick={() => {
                  // Allow click if curve is normally available OR if user chose this curve via direction change
                  if (curveAvailability.linear || pendingRedeemCurve === CURVE_LINEAR) {
                    setSelectedCurve(CURVE_LINEAR);
                  }
                }}
                disabled={!curveAvailability.linear && pendingRedeemCurve !== CURVE_LINEAR}
                className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                  // If curve is blocked AND not chosen via direction change → blur-disabled
                  !curveAvailability.linear && pendingRedeemCurve !== CURVE_LINEAR
                    ? 'blur-disabled cursor-not-allowed ring-1 ring-slate-500/20'
                    : selectedCurve === CURVE_LINEAR
                      ? 'bg-slate-500/30 animate-ring-pulse'
                      : hasAnyPosition && positionCurveId === CURVE_LINEAR
                        ? 'bg-slate-500/10 text-slate-300/80 ring-1 ring-slate-400/50'
                        : 'bg-white/5 text-white/60 ring-1 ring-slate-500/30 hover:bg-white/10'
                } ${(curveAvailability.linear || pendingRedeemCurve === CURVE_LINEAR) && selectedCurve !== CURVE_LINEAR ? getPulseClass(2, false) : ''} ${
                  selectedCurve === CURVE_LINEAR && pendingRedeemCurve === CURVE_LINEAR ? 'animate-blur-to-focus' : ''
                }`}
                title={!curveAvailability.linear && pendingRedeemCurve !== CURVE_LINEAR ? 'Bloqué: position opposée existante' : t('founderExpanded.linearDesc', 'Prix stable, tout le monde pareil')}
                style={selectedCurve === CURVE_LINEAR ? { color: CURVE_COLORS.linear.text } : undefined}
              >
                📊 Linear
              </button>
              {/* Progressive button - blocked if opposing position exists on Progressive */}
              {/* BUT: if pendingRedeemCurve is set, the chosen curve is "unlocked" (will be redeemed) */}
              {/* Two visual states: existing position (ring-slate) vs current selection (animate-ring-pulse) */}
              <button
                key={`progressive-${pendingRedeemCurve === CURVE_PROGRESSIVE ? 'selected' : 'default'}`}
                onClick={() => {
                  // Allow click if curve is normally available OR if user chose this curve via direction change
                  if (curveAvailability.progressive || pendingRedeemCurve === CURVE_PROGRESSIVE) {
                    setSelectedCurve(CURVE_PROGRESSIVE);
                  }
                }}
                disabled={!curveAvailability.progressive && pendingRedeemCurve !== CURVE_PROGRESSIVE}
                className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                  // If curve is blocked AND not chosen via direction change → blur-disabled
                  !curveAvailability.progressive && pendingRedeemCurve !== CURVE_PROGRESSIVE
                    ? 'blur-disabled cursor-not-allowed ring-1 ring-slate-500/20'
                    : selectedCurve === CURVE_PROGRESSIVE
                      ? 'bg-slate-500/30 animate-ring-pulse'
                      : hasAnyPosition && positionCurveId === CURVE_PROGRESSIVE
                        ? 'bg-slate-500/10 text-slate-300/80 ring-1 ring-slate-400/50'
                        : 'bg-white/5 text-white/60 ring-1 ring-slate-500/30 hover:bg-white/10'
                } ${(curveAvailability.progressive || pendingRedeemCurve === CURVE_PROGRESSIVE) && selectedCurve !== CURVE_PROGRESSIVE ? getPulseClass(2, false) : ''} ${
                  selectedCurve === CURVE_PROGRESSIVE && pendingRedeemCurve === CURVE_PROGRESSIVE ? 'animate-blur-to-focus' : ''
                }`}
                title={!curveAvailability.progressive && pendingRedeemCurve !== CURVE_PROGRESSIVE ? 'Bloqué: position opposée existante' : t('founderExpanded.progressiveDesc', 'Récompense les early adopters')}
                style={selectedCurve === CURVE_PROGRESSIVE ? { color: CURVE_COLORS.progressive.text } : undefined}
              >
                📈 Progressive
              </button>
            </div>
            {/* Blocked curve warning message */}
            {curveAvailability.blockedReason && (
              <p className="text-xs text-yellow-400 mt-2 flex items-center gap-1">
                <span>⚠️</span> {curveAvailability.blockedReason}
              </p>
            )}
            {/* Normal hint when no blocking */}
            {!curveAvailability.blockedReason && (
              <p className="text-xs text-white/40 mt-1">
                {selectedCurve === CURVE_LINEAR
                  ? t('founderExpanded.linearHint', 'Vote démocratique : prix stable pour tous')
                  : t('founderExpanded.progressiveHint', 'Vote conviction : récompense les premiers votants')}
              </p>
            )}
          </div>
        )}

        {/* Alert: User needs to redeem before voting (different direction OR different curve) */}
        {needsRedeemBeforeVote && !positionLoading && (
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3 space-y-3">
            <div className="flex items-start gap-2">
              <svg className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <div className="flex-1">
                <p className="text-amber-300 text-sm font-medium">
                  Position existante à retirer
                </p>
                <p className="text-white/70 text-xs mt-1">
                  Vous avez <span className="text-amber-300 font-medium">{formattedCurrentPosition} TRUST</span> en{' '}
                  <span style={{ color: positionDirection === 'for' ? SUPPORT_COLORS.base : OPPOSE_COLORS.base }}>
                    {positionDirection === 'for' ? 'Support' : 'Oppose'}
                  </span>
                  {' '}({positionCurveId === CURVE_LINEAR ? 'Linear' : 'Progressive'}).
                </p>
                {estimatedRecoverable && (
                  <p className="text-green-400/80 text-xs mt-1">
                    Vous récupérerez ~{estimatedRecoverable.net} TRUST (après {estimatedRecoverable.feePercent}% frais)
                  </p>
                )}
                <p className="text-white/50 text-xs mt-1">
                  Pour {voteDirection === 'for' ? 'Support' : 'Oppose'} {selectedCurve === CURVE_LINEAR ? 'Linear' : 'Progressive'}, retrait automatique.
                </p>
              </div>
            </div>

            {/* Amount input with slider for opposite vote */}
            <div className="pt-2 border-t border-amber-500/20">
              <label className="block text-xs text-white/60 mb-2">
                Montant pour votre nouvelle position {voteDirection === 'for' ? 'Support' : 'Oppose'}
              </label>
              {/* Slider - Uses integer scale (x10000) for browser precision */}
              {(() => {
                // Calculate slider bounds (use exact minimum for validation)
                const minVal = parseFloat(minRequiredExact || '0.0001');
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
                        setTrustAmount(truncateAmount(intValue / SCALE));
                      }}
                      className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-amber-500"
                    />
                    <div className="flex justify-between text-xs text-white/40 mt-1">
                      <span>{truncateAmount(minVal)}</span>
                      <span>{truncateAmount(maxVal)}</span>
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
                  placeholder={minRequiredDisplay}
                  className="flex-1 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm placeholder-white/30 focus:outline-none focus:border-amber-500"
                />
                <span className="text-xs text-white/50">TRUST</span>
              </div>
              {balanceData && (
                <p className="text-xs text-white/40 mt-1">
                  Balance: {truncateAmount(balanceData.formatted)} + ~{truncateAmount(parseFloat(formattedCurrentPosition) * 0.93)} récupérable
                </p>
              )}
            </div>
          </div>
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
              <div className="bg-white/5 rounded-lg p-3 mb-3">
                <div className="text-xs text-white/50 mb-1">
                  Position actuelle ({voteDirection === 'for' ? t('vote.support') : t('vote.oppose')} {selectedCurve === CURVE_LINEAR ? 'Linear' : 'Progressive'})
                </div>
                <div className="text-base font-medium">
                  {selectedCombinationPosition.hasPosition ? (
                    <span style={{ color: voteDirection === 'for' ? SUPPORT_COLORS.base : OPPOSE_COLORS.base }}>
                      {selectedCombinationPosition.formatted} TRUST
                    </span>
                  ) : (
                    <span className="text-white/40">{t('founderExpanded.noPosition', 'Aucune position')}</span>
                  )}
                </div>
                {/* Pending cart amount for this position */}
                {pendingCartAmount.hasPending && (
                  <div className="text-xs text-amber-400 mt-1.5 flex items-center gap-1">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    <span>
                      +{pendingCartAmount.formatted} TRUST en attente dans le panier
                    </span>
                  </div>
                )}
                {operationMode === 'redeem' && selectedCombinationPosition.hasPosition && (
                  <div className="text-xs text-violet-400 mt-1">
                    {t('founderExpanded.canWithdrawUpTo', 'Vous pouvez retirer jusqu\'à')} {selectedCombinationPosition.formatted} TRUST
                  </div>
                )}
              </div>
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
                  {voteDirection === 'for' ? `👍 ${t('vote.support')}` : `👎 ${t('vote.oppose')}`} - {trustAmount || '0'} TRUST
                </p>
                {isCreatingNewTotem && newTotemData && (
                  <p className="text-xs text-orange-400/60 mt-1">
                    + {t('creation.category')}: {newTotemData.category}
                    {newTotemData.isNewCategory && ` (${t('creation.new') || 'nouveau'})`}
                  </p>
                )}
              </div>
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
