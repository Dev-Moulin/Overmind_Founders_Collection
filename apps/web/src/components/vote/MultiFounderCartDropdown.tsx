/**
 * MultiFounderCartDropdown - Multi-founder cart with accordion UI
 *
 * Displays all pending votes across multiple founders with:
 * - Compact view: Founder name + position badges + total TRUST
 * - Expanded view: Individual items with editable amounts
 * - Current founder first + auto-expanded
 * - Single "Valider" button at bottom for ALL founders
 *
 * Position badges:
 * - SL = Support Linear
 * - SP = Support Progressive
 * - OL = Oppose Linear
 * - OP = Oppose Progressive
 */

import { useState, useMemo, memo, useEffect, useCallback, useRef } from 'react';
import { formatEther } from 'viem';
import type { Hex } from 'viem';
import { useAccount, useBalance } from 'wagmi';
import type { VoteCart, VoteCartItem } from '../../types/voteCart';
import { SUPPORT_COLORS, OPPOSE_COLORS } from '../../config/colors';
import { truncateAmount } from '../../utils/formatters';
import { useTranslation } from 'react-i18next';
import { useBatchVote } from '../../hooks';
import { useLoadingMessages } from '../../hooks/ui/useLoadingMessages';

interface MultiFounderCartDropdownProps {
  /** All carts from all founders */
  allCarts: Map<Hex, VoteCart>;
  /** Total items across all founders */
  totalItemCount: number;
  /** Current founder ID (will be shown first and auto-expanded) */
  currentFounderId?: Hex;
  /** Whether the cart panel is currently visible/open */
  isOpen?: boolean;
  /** Clear all items for a founder */
  onClearFounder: (founderId: Hex) => void;
  /** Remove single item from a founder's cart */
  onRemoveItem: (founderId: Hex, itemId: string) => void;
  /** Update amount for an item */
  onUpdateAmount: (founderId: Hex, itemId: string, amount: string) => void;
  /** Callback when validation succeeds */
  onSuccess?: () => void;
}

/**
 * Badge for position type (SL, SP, OL, OP)
 */
function PositionBadge({ direction, curveId }: { direction: 'for' | 'against'; curveId: number }) {
  const { t } = useTranslation();
  const isSupport = direction === 'for';
  const isLinear = curveId === 1;
  const label = `${isSupport ? 'S' : 'O'}${isLinear ? 'L' : 'P'}`;
  const color = isSupport ? SUPPORT_COLORS.base : OPPOSE_COLORS.base;

  return (
    <span
      className="px-1 py-0.5 text-[9px] font-bold rounded"
      style={{
        backgroundColor: `${color}25`,
        color: color,
      }}
      title={`${isSupport ? t('vote.support') : t('vote.oppose')} ${isLinear ? t('curve.linear') : t('curve.progressive')}`}
    >
      {label}
    </span>
  );
}

/**
 * Analyze cart items to get unique position badges
 */
function getPositionBadges(items: VoteCartItem[]): Array<{ direction: 'for' | 'against'; curveId: number }> {
  const seen = new Set<string>();
  const badges: Array<{ direction: 'for' | 'against'; curveId: number }> = [];

  for (const item of items) {
    const key = `${item.direction}-${item.curveId}`;
    if (!seen.has(key)) {
      seen.add(key);
      badges.push({ direction: item.direction, curveId: item.curveId });
    }
  }

  // Sort: Support before Oppose, Linear before Progressive
  return badges.sort((a, b) => {
    if (a.direction !== b.direction) return a.direction === 'for' ? -1 : 1;
    return a.curveId - b.curveId;
  });
}

/**
 * Calculate total amount for a cart
 */
function getCartTotal(cart: VoteCart): string {
  const total = cart.items.reduce((sum, item) => sum + item.amount, 0n);
  return truncateAmount(Number(formatEther(total)));
}

/**
 * Single cart item row (expanded view)
 */
const CartItemRow = memo(function CartItemRow({
  item,
  onRemove,
  onUpdateAmount,
}: {
  item: VoteCartItem;
  onRemove: () => void;
  onUpdateAmount: (amount: string) => void;
}) {
  const { t } = useTranslation();
  const formattedAmount = truncateAmount(Number(formatEther(item.amount)));
  const isSupport = item.direction === 'for';
  const isLinear = item.curveId === 1;

  return (
    <div className="flex items-center gap-2 py-1.5 px-2 bg-white/5 rounded border border-white/5">
      {/* Totem name */}
      <span className="flex-1 text-xs text-white/80 truncate" title={item.totemName}>
        {item.totemName}
      </span>

      {/* Position badge */}
      <span
        className="text-[9px] px-1.5 py-0.5 rounded font-medium"
        style={{
          backgroundColor: `${isSupport ? SUPPORT_COLORS.base : OPPOSE_COLORS.base}20`,
          color: isSupport ? SUPPORT_COLORS.base : OPPOSE_COLORS.base,
        }}
      >
        {isSupport ? t('vote.support') : t('vote.oppose')} {isLinear ? 'L' : 'P'}
      </span>

      {/* Amount input */}
      <input
        type="number"
        min="0.001"
        step="0.001"
        value={formattedAmount}
        onChange={(e) => onUpdateAmount(e.target.value)}
        className="w-16 px-1.5 py-0.5 text-xs text-center bg-white/5 border border-white/10 rounded
          focus:outline-none focus:border-white/30 text-white"
        onClick={(e) => e.stopPropagation()}
      />

      <span className="text-[10px] text-white/40">{t('common.trustUnit')}</span>

      {/* Remove button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onRemove();
        }}
        className="text-white/30 hover:text-red-400 transition-colors p-0.5"
        title={t('voteCart.remove')}
      >
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
});

/**
 * Single founder accordion row
 */
function FounderAccordionRow({
  cart,
  isExpanded,
  isCurrent,
  onToggle,
  onClear,
  onRemoveItem,
  onUpdateAmount,
}: {
  cart: VoteCart;
  isExpanded: boolean;
  /** Whether this is the current founder (shown first) */
  isCurrent?: boolean;
  onToggle: () => void;
  onClear: () => void;
  onRemoveItem: (itemId: string) => void;
  onUpdateAmount: (itemId: string, amount: string) => void;
}) {
  const { t } = useTranslation();
  const badges = useMemo(() => getPositionBadges(cart.items), [cart.items]);
  const total = useMemo(() => getCartTotal(cart), [cart]);

  return (
    <div className={`border rounded-lg overflow-hidden ${isCurrent ? 'border-blue-500/40' : 'border-white/10'}`}>
      {/* Compact header - always visible */}
      <div
        className={`flex items-center gap-2 px-3 py-2 cursor-pointer transition-colors
          ${isCurrent ? 'bg-blue-500/10 hover:bg-blue-500/15' : 'bg-white/5 hover:bg-white/10'}`}
        onClick={onToggle}
      >
        {/* Expand/collapse chevron */}
        <svg
          className={`w-3.5 h-3.5 text-white/40 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>

        {/* Founder name + count */}
        <span className="text-xs font-medium text-white flex-1 truncate">
          {cart.founderName}
          <span className="text-white/40 ml-1">({cart.items.length})</span>
        </span>

        {/* Position badges */}
        <div className="flex gap-0.5">
          {badges.map((badge, i) => (
            <PositionBadge key={i} direction={badge.direction} curveId={badge.curveId} />
          ))}
        </div>

        {/* Total */}
        <span className="text-xs text-white/60 font-medium ml-1">
          {total} {t('common.trustUnit')}
        </span>

        {/* Clear founder button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onClear();
          }}
          className="text-white/30 hover:text-red-400 transition-colors p-0.5"
          title={t('voteCart.removeAllFounderVotes')}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Expanded content - items list */}
      {isExpanded && (
        <div className="p-2 space-y-1 bg-black/20">
          {cart.items.map((item) => (
            <CartItemRow
              key={item.id}
              item={item}
              onRemove={() => onRemoveItem(item.id)}
              onUpdateAmount={(amount) => onUpdateAmount(item.id, amount)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * Validation progress state
 */
interface ValidationProgress {
  isValidating: boolean;
  currentFounderIndex: number;
  totalFounders: number;
  currentFounderName: string;
  completedFounders: number;
  error?: string;
}

/**
 * Main component - Multi-founder cart dropdown
 */
export function MultiFounderCartDropdown({
  allCarts,
  totalItemCount,
  currentFounderId,
  isOpen = false,
  onClearFounder,
  onRemoveItem,
  onUpdateAmount,
  onSuccess,
}: MultiFounderCartDropdownProps) {
  const { t } = useTranslation();
  const { address } = useAccount();
  const { data: balanceData } = useBalance({ address });
  const { executeBatch, isLoading: isBatchLoading, currentStep, totalSteps, error: batchError } = useBatchVote();

  // Messages dynamiques pendant le chargement
  const { currentMessage } = useLoadingMessages({ isActive: isBatchLoading });

  // User balance
  const formattedBalance = balanceData ? truncateAmount(Number(formatEther(balanceData.value))) : '0';

  // Track which founders are expanded
  const [expandedFounders, setExpandedFounders] = useState<Set<Hex>>(new Set());

  // Track previous isOpen state to detect transition false -> true
  const wasOpenRef = useRef(false);

  // Validation progress state
  const [validationProgress, setValidationProgress] = useState<ValidationProgress>({
    isValidating: false,
    currentFounderIndex: 0,
    totalFounders: 0,
    currentFounderName: '',
    completedFounders: 0,
  });

  // Normalize ID for comparison (lowercase)
  const normalizeId = (id: Hex | undefined): string => id?.toLowerCase() ?? '';
  const normalizedCurrentId = normalizeId(currentFounderId);

  // Find current founder's cart key (may differ in case)
  const currentFounderKey = useMemo(() => {
    if (!currentFounderId) return null;
    for (const [key] of allCarts) {
      if (key.toLowerCase() === normalizedCurrentId) {
        return key;
      }
    }
    return null;
  }, [allCarts, normalizedCurrentId, currentFounderId]);

  // Auto-expand: only trigger when cart panel OPENS (isOpen: false -> true)
  useEffect(() => {
    const justOpened = isOpen && !wasOpenRef.current;
    wasOpenRef.current = isOpen;

    // Only run auto-expand when panel just opened
    if (!justOpened) return;

    // DEBUG: Comprendre pourquoi le mauvais fondateur est ouvert
    console.log('[AutoExpand] Panel just opened!');
    console.log('[AutoExpand] currentFounderId:', currentFounderId);
    console.log('[AutoExpand] currentFounderKey:', currentFounderKey);
    console.log('[AutoExpand] allCarts keys:', Array.from(allCarts.keys()));
    console.log('[AutoExpand] allCarts founders:', Array.from(allCarts.values()).map(c => c.founderName));

    if (currentFounderKey) {
      // Current founder has a cart - expand it
      console.log('[AutoExpand] -> Expanding currentFounderKey:', currentFounderKey);
      setExpandedFounders(new Set([currentFounderKey]));
    } else if (allCarts.size > 0) {
      // Current founder has no cart - expand the first available
      const firstKey = allCarts.keys().next().value;
      console.log('[AutoExpand] -> currentFounderKey is NULL, fallback to firstKey:', firstKey);
      if (firstKey) {
        setExpandedFounders(new Set([firstKey]));
      }
    }
  }, [isOpen, currentFounderKey, allCarts]);

  // Convert Map to array and sort: current founder first
  const cartsArray = useMemo(() => {
    const entries = Array.from(allCarts.entries()).map(([founderId, cart]) => ({
      founderId,
      cart,
    }));

    // Sort: current founder first, then by founder name
    return entries.sort((a, b) => {
      if (currentFounderKey) {
        if (a.founderId === currentFounderKey) return -1;
        if (b.founderId === currentFounderKey) return 1;
      }
      return a.cart.founderName.localeCompare(b.cart.founderName);
    });
  }, [allCarts, currentFounderKey]);

  // Calculate global total
  const globalTotal = useMemo(() => {
    let total = 0n;
    allCarts.forEach((cart) => {
      cart.items.forEach((item) => {
        total += item.amount;
      });
    });
    return truncateAmount(Number(formatEther(total)));
  }, [allCarts]);

  // Exclusive accordion: only one founder expanded at a time
  const toggleFounder = (founderId: Hex) => {
    setExpandedFounders((prev) => {
      // If clicking on already expanded founder, close it
      if (prev.has(founderId)) {
        return new Set<Hex>();
      }
      // Otherwise, close all others and open this one
      return new Set([founderId]);
    });
  };

  /**
   * Handle validation for all founders
   * Executes founder by founder with progress tracking using real useBatchVote
   */
  const handleValidateAll = useCallback(async () => {
    if (cartsArray.length === 0) return;

    setValidationProgress({
      isValidating: true,
      currentFounderIndex: 0,
      totalFounders: cartsArray.length,
      currentFounderName: cartsArray[0].cart.founderName,
      completedFounders: 0,
    });

    let allSuccessful = true;

    // Execute each founder's cart one by one
    for (let i = 0; i < cartsArray.length; i++) {
      const { founderId, cart } = cartsArray[i];

      setValidationProgress((prev) => ({
        ...prev,
        currentFounderIndex: i,
        currentFounderName: cart.founderName,
      }));

      try {
        // Execute batch vote for this founder
        const result = await executeBatch(cart);

        if (result) {
          // Success - clear this founder's cart
          onClearFounder(founderId);
          setValidationProgress((prev) => ({
            ...prev,
            completedFounders: i + 1,
          }));
        } else {
          // Failed - stop and show error
          allSuccessful = false;
          setValidationProgress((prev) => ({
            ...prev,
            error: t('voteCart.failedForFounder', { name: cart.founderName }),
          }));
          break;
        }
      } catch (err) {
        allSuccessful = false;
        setValidationProgress((prev) => ({
          ...prev,
          error: err instanceof Error ? err.message : t('voteCart.unknownError'),
        }));
        break;
      }
    }

    // Validation complete
    setValidationProgress({
      isValidating: false,
      currentFounderIndex: 0,
      totalFounders: 0,
      currentFounderName: '',
      completedFounders: 0,
    });

    // Trigger success callback if all succeeded
    if (allSuccessful) {
      onSuccess?.();
    }
  }, [cartsArray, executeBatch, onClearFounder, onSuccess]);

  if (totalItemCount === 0) {
    return (
      <div className="p-4 text-center text-white/40 text-xs">
        {t('founderExpanded.emptyCart')}
      </div>
    );
  }

  const progressPercent = validationProgress.totalFounders > 0
    ? (validationProgress.completedFounders / validationProgress.totalFounders) * 100
    : 0;

  return (
    <div className="flex flex-col h-full">
      {/* Founders list - scrollable */}
      <div className="flex-1 overflow-y-auto space-y-1.5 min-h-0">
        {cartsArray.map(({ founderId, cart }) => (
          <FounderAccordionRow
            key={founderId}
            cart={cart}
            isExpanded={expandedFounders.has(founderId)}
            isCurrent={founderId === currentFounderKey}
            onToggle={() => toggleFounder(founderId)}
            onClear={() => onClearFounder(founderId)}
            onRemoveItem={(itemId) => onRemoveItem(founderId, itemId)}
            onUpdateAmount={(itemId, amount) => onUpdateAmount(founderId, itemId, amount)}
          />
        ))}
      </div>

      {/* Footer with total + validate button */}
      <div className="shrink-0 pt-3 mt-3 border-t border-white/10">
        {/* Balance bar */}
        <div className="flex items-center justify-between text-[10px] px-2 py-1.5 bg-white/5 rounded mb-2">
          <span className="text-white/50">{t('common.balance')}</span>
          <span className={`font-medium ${Number(globalTotal) <= Number(formattedBalance) ? 'text-green-400' : 'text-red-400'}`}>
            {formattedBalance} {t('common.trustUnit')}
          </span>
        </div>

        {/* Total summary */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex flex-col">
            <span className="text-xs text-white/60">
              {t('voteCart.votesFoundersSummary', { votes: totalItemCount, founders: cartsArray.length })}
            </span>
          </div>
          <span className="text-sm font-semibold text-white">
            {globalTotal} {t('common.trustUnit')}
          </span>
        </div>

        {/* Error display */}
        {(batchError || validationProgress.error) && (
          <div className="p-2 mb-3 bg-red-500/10 border border-red-500/30 rounded">
            <p className="text-[10px] text-red-400">
              {validationProgress.error || batchError?.message}
            </p>
          </div>
        )}

        {/* Progress bar (shown during validation) */}
        {(validationProgress.isValidating || isBatchLoading) && (
          <div className="mb-3">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] text-white/60">
                {t('voteCart.foundersValidated', { completed: validationProgress.completedFounders, total: validationProgress.totalFounders })}
              </span>
              <span className="text-[10px] text-white/40">
                {validationProgress.currentFounderName}
                {isBatchLoading && totalSteps > 0 && ` (${currentStep}/${totalSteps})`}
              </span>
            </div>
            <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full bg-linear-to-r from-blue-500 to-purple-500 rounded-full transition-all duration-500 ease-out"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        )}

        {/* Validate button */}
        <button
          onClick={handleValidateAll}
          disabled={validationProgress.isValidating || isBatchLoading || totalItemCount === 0}
          className={`w-full py-2.5 px-4 rounded-lg font-semibold text-sm transition-all
            ${validationProgress.isValidating || isBatchLoading
              ? 'bg-white/10 text-white/40 cursor-not-allowed'
              : 'bg-linear-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white shadow-lg hover:shadow-xl'
            }`}
        >
          {validationProgress.isValidating || isBatchLoading ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="w-4 h-4 animate-spin shrink-0" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              <span className="font-medium shrink-0">{isBatchLoading ? `${currentStep}/${totalSteps}` : t('founderExpanded.validating')}</span>
              {isBatchLoading && <span className="text-sm text-white/80 truncate">{currentMessage}</span>}
            </span>
          ) : (
            <>{t('voteCart.validateAll', { count: totalItemCount })}</>
          )}
        </button>
      </div>
    </div>
  );
}
