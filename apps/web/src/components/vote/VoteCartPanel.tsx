/**
 * VoteCartPanel - Interface utilisateur du panier de votes
 *
 * Affiche le contenu du panier de votes et permet la validation en batch.
 * Vérifie la balance utilisateur AVANT soumission et indique clairement
 * quels votes peuvent passer et lesquels sont bloqués par manque de fonds.
 *
 * @see Documentation: Claude/00_GESTION_PROJET/Projet_02_SDK_V2/TODO_Implementation.md
 */

import { useMemo, useRef, useCallback, useState, memo } from 'react';
import { formatEther } from 'viem';
import { useTranslation } from 'react-i18next';
import { useAccount, useBalance } from 'wagmi';
import { useBatchVote } from '../../hooks';
import { truncateAmount } from '../../utils/formatters';
import type { VoteCart, VoteCartItem, VoteCartCostSummary } from '../../types/voteCart';
import { SUPPORT_COLORS, OPPOSE_COLORS } from '../../config/colors';

/**
 * Draggable amount input - allows drag left/right to change value
 */
function DraggableAmountInput({
  value,
  onChange,
  min = 0.001,
  step = 0.001,
  canAfford = true,
  showSpinners = false,
}: {
  value: string;
  onChange: (value: string) => void;
  min?: number;
  step?: number;
  canAfford?: boolean;
  showSpinners?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartX = useRef(0);
  const dragStartValue = useRef(0);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    // Only start drag if not clicking directly in input for text selection
    if (e.target === inputRef.current && document.activeElement === inputRef.current) {
      return; // Allow normal input behavior when focused
    }

    // Don't interfere with spinner clicks (they are on the right side of input)
    if (e.target === inputRef.current) {
      const rect = inputRef.current.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      // Spinners are typically in the rightmost ~20px of the input
      if (clickX > rect.width - 25) {
        return; // Let native spinner handle it
      }
    }

    e.preventDefault();
    setIsDragging(true);
    dragStartX.current = e.clientX;
    dragStartValue.current = parseFloat(value) || 0;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const deltaX = moveEvent.clientX - dragStartX.current;
      // Sensitivity: 1px = 0.001 TRUST, with shift for finer control
      const sensitivity = moveEvent.shiftKey ? 0.0001 : 0.001;
      const deltaValue = deltaX * sensitivity;
      const newValue = Math.max(min, dragStartValue.current + deltaValue);
      onChange(truncateAmount(newValue));
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [value, onChange, min]);

  // Touch support
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (document.activeElement === inputRef.current) return;

    setIsDragging(true);
    dragStartX.current = e.touches[0].clientX;
    dragStartValue.current = parseFloat(value) || 0;

    const handleTouchMove = (moveEvent: TouchEvent) => {
      const deltaX = moveEvent.touches[0].clientX - dragStartX.current;
      const sensitivity = 0.001;
      const deltaValue = deltaX * sensitivity;
      const newValue = Math.max(min, dragStartValue.current + deltaValue);
      onChange(truncateAmount(newValue));
    };

    const handleTouchEnd = () => {
      setIsDragging(false);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };

    document.addEventListener('touchmove', handleTouchMove);
    document.addEventListener('touchend', handleTouchEnd);
  }, [value, onChange, min]);

  return (
    <div
      className={`relative flex items-center cursor-ew-resize select-none ${isDragging ? 'opacity-80' : ''}`}
      onMouseDown={handleMouseDown}
      onTouchStart={handleTouchStart}
      title="Glisser pour ajuster"
    >
      <input
        ref={inputRef}
        type="number"
        min={min}
        step={step}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`w-[88px] border rounded px-1.5 py-1 text-xs text-center focus:outline-none cursor-ew-resize
          ${canAfford
            ? 'bg-white/5 border-white/10 text-white focus:border-slate-500/50'
            : 'bg-red-500/10 border-red-500/30 text-red-300'
          }
          ${isDragging ? 'border-amber-500/50' : ''}
          ${showSpinners
            ? '[&::-webkit-inner-spin-button]:opacity-100 [&::-webkit-inner-spin-button]:h-6 [&::-webkit-inner-spin-button]:cursor-pointer'
            : '[&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none [-moz-appearance:textfield]'
          }`}
        onClick={(e) => e.stopPropagation()}
      />
      {isDragging && (
        <div className="absolute -top-5 left-1/2 -translate-x-1/2 text-[9px] text-amber-400 whitespace-nowrap">
          ← →
        </div>
      )}
    </div>
  );
}

interface VoteCartPanelProps {
  /** The current cart */
  cart: VoteCart | null;
  /** Cost summary */
  costSummary: VoteCartCostSummary | null;
  /** Remove item callback */
  onRemoveItem: (itemId: string) => void;
  /** Clear cart callback */
  onClearCart: () => void;
  /** Update amount callback */
  onUpdateAmount: (itemId: string, amount: string) => void;
  /** Callback when batch is successfully executed */
  onSuccess?: () => void;
  /** Validation errors from cart */
  validationErrors: string[];
  /** Is cart valid */
  isValid: boolean;
}

/**
 * Analyze which items can be afforded with current balance
 */
interface ItemAffordability {
  itemId: string;
  canAfford: boolean;
  cumulativeCost: bigint;
  /** Maximum amount this item could be set to (if blocked) */
  maxAffordableAmount: bigint;
}

function analyzeAffordability(
  items: VoteCartItem[],
  userBalance: bigint,
  feeMultiplier = 105n // 5% entry fees = multiply by 1.05 (105/100)
): {
  affordability: Map<string, ItemAffordability>;
  totalAffordable: number;
  totalBlocked: number;
  remainingBalance: bigint;
} {
  const affordability = new Map<string, ItemAffordability>();
  let totalAffordable = 0;
  let totalBlocked = 0;

  // Helper: apply fee multiplier to get real cost
  const withFees = (amount: bigint) => (amount * feeMultiplier) / 100n;
  // Helper: reverse - from budget to max deposit amount
  const toDepositAmount = (budget: bigint) => (budget * 100n) / feeMultiplier;

  // Calculate total cost of all items (with fees)
  const totalCostWithFees = items.reduce((sum, item) => sum + withFees(item.amount), 0n);

  // Check global affordability
  const globalCanAfford = totalCostWithFees <= userBalance;

  // For each item: check if THIS item causes the overflow
  // Don't sort - keep original order so the item user is editing gets marked
  for (const item of items) {
    const itemCostWithFees = withFees(item.amount);

    // Cost of all OTHER items
    const otherItemsCostWithFees = totalCostWithFees - itemCostWithFees;

    // What budget is available for THIS item after others are paid
    const availableForThis = userBalance > otherItemsCostWithFees
      ? userBalance - otherItemsCostWithFees
      : 0n;

    // Can we afford this item given the budget left after others?
    const canAfford = itemCostWithFees <= availableForThis;

    // Max deposit amount for this item (convert budget back to deposit)
    const maxAffordableDeposit = toDepositAmount(availableForThis);

    affordability.set(item.id, {
      itemId: item.id,
      canAfford: globalCanAfford ? true : canAfford,
      cumulativeCost: totalCostWithFees,
      maxAffordableAmount: canAfford ? item.amount : maxAffordableDeposit,
    });

    if (globalCanAfford || canAfford) {
      totalAffordable++;
    } else {
      totalBlocked++;
    }
  }

  const remainingBalance = userBalance > totalCostWithFees ? userBalance - totalCostWithFees : 0n;

  return { affordability, totalAffordable, totalBlocked, remainingBalance };
}

/**
 * Single cart item display - 2 row layout with draggable amount input
 * Row 1: FOR/AGAINST (small, left) | Totem name (center) | X (small, right)
 * Row 2: Draggable input + TRUST + MAX button
 *
 * MEMOIZED to prevent re-renders when parent re-renders with same props
 */
const CartItemRow = memo(function CartItemRow({
  item,
  onRemove,
  onUpdateAmount,
  canAfford = true,
  maxAffordableAmount,
}: {
  item: VoteCartItem;
  onRemove: () => void;
  onUpdateAmount: (amount: string) => void;
  canAfford?: boolean;
  maxAffordableAmount?: bigint;
}) {
  const { t } = useTranslation();
  const formattedAmount = truncateAmount(Number(formatEther(item.amount)));
  // MAX déjà calculé avec les fees dans analyzeAffordability, petit buffer de sécurité
  const maxAffordableRaw = maxAffordableAmount ? Number(formatEther(maxAffordableAmount)) : 0;
  const maxAffordable = truncateAmount(Math.max(0.001, maxAffordableRaw - 0.0005)); // Tiny safety margin
  const canAdjustToMax = !canAfford && maxAffordableAmount && maxAffordableAmount > 0n;

  return (
    <div
      className={`p-2 rounded-lg border transition-all ${
        canAfford ? 'bg-white/5 border-white/10' : 'bg-red-500/5 border-red-500/30'
      }`}
    >
      {/* Row 1: Direction+Curve badges (left) | Totem name (center) | Remove (right) */}
      <div className="flex items-center gap-1 mb-1.5">
        {/* Direction + Curve badges - compact [S/O] [L/P] both colored by direction */}
        <div className="flex items-center gap-0.5 shrink-0">
          {/* Direction badge: S (Support) or O (Oppose) */}
          <span
            className="w-5 h-5 flex items-center justify-center text-[10px] font-bold rounded"
            style={{
              backgroundColor: `${item.direction === 'for' ? SUPPORT_COLORS.base : OPPOSE_COLORS.base}30`,
              color: item.direction === 'for' ? SUPPORT_COLORS.base : OPPOSE_COLORS.base,
            }}
            title={item.direction === 'for' ? 'Support' : 'Oppose'}
          >
            {item.direction === 'for' ? 'S' : 'O'}
          </span>
          {/* Curve badge: L (Linear) or P (Progressive) - same direction color */}
          <span
            className="w-5 h-5 flex items-center justify-center text-[10px] font-bold rounded"
            style={{
              backgroundColor: `${item.direction === 'for' ? SUPPORT_COLORS.base : OPPOSE_COLORS.base}20`,
              color: item.direction === 'for' ? SUPPORT_COLORS.base : OPPOSE_COLORS.base,
            }}
            title={item.curveId === 1 ? 'Linear' : 'Progressive'}
          >
            {item.curveId === 1 ? 'L' : 'P'}
          </span>
        </div>

        {/* Totem name - centered, flex-1 */}
        <div className="flex-1 text-center min-w-0">
          <span
            className={`font-medium text-xs truncate block ${canAfford ? 'text-white' : 'text-white/50'}`}
            title={item.totemName}
          >
            {item.totemName}
          </span>
          {!canAfford && (
            <span className="text-[9px] text-red-400">
              {t('voteCart.insufficientFunds')}
            </span>
          )}
        </div>

        {/* Remove button - reduced container, larger icon */}
        <button
          onClick={onRemove}
          className="shrink-0 text-white/30 hover:text-red-400 transition-colors scale-[0.7] origin-right"
          title={t('common.cancel')}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Row 2: Draggable input with native spinners + TRUST + MAX button */}
      <div className="flex items-center justify-center gap-2">
        <DraggableAmountInput
          value={formattedAmount}
          onChange={onUpdateAmount}
          canAfford={canAfford}
          showSpinners={true}
        />
        <span className="text-xs text-white/40">TRUST</span>

        {/* MAX button for blocked items */}
        {canAdjustToMax && (
          <button
            onClick={() => onUpdateAmount(maxAffordable)}
            className="px-1.5 py-0.5 text-[10px] bg-amber-500/20 text-amber-400 rounded hover:bg-amber-500/30 transition-colors"
            title={t('voteCart.adjustToMax', { amount: maxAffordable })}
          >
            MAX
          </button>
        )}
      </div>

      {/* Row 3: Warnings (if any) */}
      {(item.needsWithdraw || item.isNewTotem) && (
        <div className="flex justify-center gap-2 mt-1.5">
          {item.needsWithdraw && (
            <span className="text-[9px] text-yellow-400/80 bg-yellow-500/10 px-1.5 py-0.5 rounded">
              {t('voteCart.autoWithdraw')}
            </span>
          )}
          {item.isNewTotem && (
            <span className="text-[9px] text-blue-400/80 bg-blue-500/10 px-1.5 py-0.5 rounded">
              {t('voteCart.newTotem')}
            </span>
          )}
        </div>
      )}
    </div>
  );
});

/**
 * Cost summary display - compact
 * Shows detailed breakdown of costs including triple creation
 */
function CostSummarySection({ summary }: { summary: VoteCartCostSummary }) {
  const { t } = useTranslation();

  // Calculate effective deposit (what goes to vault after triple costs)
  const effectiveDeposit = summary.totalDeposits > summary.tripleCreationCosts
    ? summary.totalDeposits - summary.tripleCreationCosts
    : 0n;

  return (
    <div className="p-1.5 bg-slate-500/10 border border-slate-500/20 rounded shrink-0">
      <div className="space-y-0.5 text-[10px]">
        {/* User's total input */}
        <div className="flex justify-between text-white/50">
          <span>{t('founderExpanded.deposits')}</span>
          <span>{truncateAmount(Number(formatEther(summary.totalDeposits)))}</span>
        </div>

        {/* Triple creation costs (taken from deposit) */}
        {summary.tripleCreationCosts > 0n && (
          <div className="flex justify-between text-orange-400/70">
            <span>{t('founderExpanded.tripleCreation', { count: summary.newTripleCount }) || `Triple creation (${summary.newTripleCount})`}</span>
            <span>-{truncateAmount(Number(formatEther(summary.tripleCreationCosts)))}</span>
          </div>
        )}

        {/* Effective deposit (what actually goes to vault) */}
        {summary.tripleCreationCosts > 0n && (
          <div className="flex justify-between text-blue-400/70">
            <span>{t('founderExpanded.effectiveDeposit') || 'Effective deposit'}</span>
            <span>{truncateAmount(Number(formatEther(effectiveDeposit)))}</span>
          </div>
        )}

        {/* Entry fees (calculated on effective deposit) */}
        {summary.estimatedEntryFees > 0n && (
          <div className="flex justify-between text-white/30">
            <span>{t('founderExpanded.entryFees')}</span>
            <span>+{truncateAmount(Number(formatEther(summary.estimatedEntryFees)))}</span>
          </div>
        )}

        {/* Atom creation costs (for new totems) */}
        {summary.atomCreationCosts > 0n && (
          <div className="flex justify-between text-white/30">
            <span>{t('founderExpanded.atomCreation', { count: summary.newTotemCount })}</span>
            <span>+{truncateAmount(Number(formatEther(summary.atomCreationCosts)))}</span>
          </div>
        )}

        {/* Withdrawals (reduce cost) */}
        {summary.totalWithdrawable > 0n && (
          <div className="flex justify-between text-green-400/70">
            <span>{t('founderExpanded.withdrawals', { count: summary.withdrawCount })}</span>
            <span>-{truncateAmount(Number(formatEther(summary.totalWithdrawable)))}</span>
          </div>
        )}

        {/* Net total */}
        <div className="border-t border-white/10 pt-1 mt-1">
          <div className="flex justify-between text-white text-xs font-medium">
            <span>{t('founderExpanded.netTotal')}</span>
            <span>{truncateAmount(Number(formatEther(summary.netCost)))} TRUST</span>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Main VoteCartPanel component
 */
export function VoteCartPanel({
  cart,
  costSummary,
  onRemoveItem,
  onClearCart,
  onUpdateAmount,
  onSuccess,
  validationErrors,
  isValid,
}: VoteCartPanelProps) {
  const { t } = useTranslation();
  const { address } = useAccount();
  const { data: balanceData } = useBalance({ address });
  const { executeBatch, status, error, isLoading, currentStep, totalSteps } = useBatchVote();

  // Get user balance in wei
  const userBalance = balanceData?.value ?? 0n;
  const formattedBalance = balanceData ? truncateAmount(Number(balanceData.formatted)) : '0';

  // Analyze affordability of each item
  const { affordability, totalAffordable, totalBlocked } = useMemo(() => {
    if (!cart || cart.items.length === 0) {
      return { affordability: new Map(), totalAffordable: 0, totalBlocked: 0, remainingBalance: userBalance };
    }
    return analyzeAffordability(cart.items, userBalance);
  }, [cart, userBalance]);

  // Calculate missing amount
  const missingAmount = useMemo(() => {
    if (!costSummary) return 0n;
    const needed = costSummary.netCost;
    if (needed > userBalance) {
      return needed - userBalance;
    }
    return 0n;
  }, [costSummary, userBalance]);

  const hasSufficientBalance = missingAmount === 0n;

  const handleSubmit = async () => {
    if (!cart || !isValid) return;

    // Block submission if insufficient balance
    if (!hasSufficientBalance) {
      return;
    }

    const result = await executeBatch(cart);
    if (result && onSuccess) {
      onSuccess();
    }
  };

  if (!cart || cart.items.length === 0) {
    return (
      <div className="p-2 bg-white/5 border border-white/10 rounded-lg text-center">
        <p className="text-white/40 text-xs">{t('founderExpanded.emptyCart')}</p>
        <p className="text-white/30 text-[10px] mt-0.5">
          {t('founderExpanded.addVotesHint')}
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full gap-2">
      {/* Header - compact */}
      <div className="flex items-center justify-between shrink-0">
        <h3 className="text-xs font-semibold text-white/70">
          {t('founderExpanded.voteCart')} ({cart.items.length})
        </h3>
        <button
          onClick={onClearCart}
          disabled={isLoading}
          className="text-[10px] text-white/40 hover:text-red-400 transition-colors disabled:opacity-50"
        >
          {t('common.reset')}
        </button>
      </div>

      {/* Balance bar - compact */}
      <div className="flex items-center justify-between text-[10px] px-1.5 py-1 bg-white/5 rounded shrink-0">
        <span className="text-white/50 truncate">
          {cart.founderName}
        </span>
        <span className={`shrink-0 font-medium ${hasSufficientBalance ? 'text-green-400' : 'text-red-400'}`}>
          {formattedBalance} TRUST
        </span>
      </div>

      {/* Insufficient balance warning - compact */}
      {!hasSufficientBalance && (
        <div className="p-1.5 bg-red-500/10 border border-red-500/30 rounded shrink-0">
          <div className="flex items-center gap-1.5">
            <svg className="w-3.5 h-3.5 text-red-400 shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[11px] font-medium text-red-400 truncate">
                  {t('voteCart.insufficientBalance') || 'Balance insuffisante'}
                </span>
                <span className="text-[10px] text-red-300 shrink-0">
                  -{truncateAmount(Number(formatEther(missingAmount)), 2)} TRUST
                </span>
              </div>
              {totalBlocked > 0 && (
                <p className="text-[10px] text-white/40 mt-0.5">
                  {totalAffordable > 0
                    ? `${totalAffordable} OK, ${totalBlocked} bloqué(s)`
                    : `${totalBlocked} bloqué(s)`}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Cart items - flex-1 pour utiliser l'espace disponible */}
      <div className="space-y-1 flex-1 overflow-y-auto min-h-0">
        {cart.items.map((item) => {
          const itemAff = affordability.get(item.id);
          return (
            <CartItemRow
              key={item.id}
              item={item}
              onRemove={() => onRemoveItem(item.id)}
              onUpdateAmount={(amount) => onUpdateAmount(item.id, amount)}
              canAfford={itemAff?.canAfford ?? true}
              maxAffordableAmount={itemAff?.maxAffordableAmount}
            />
          );
        })}
      </div>

      {/* Cost summary */}
      {costSummary && <CostSummarySection summary={costSummary} />}

      {/* Validation errors - compact */}
      {validationErrors.length > 0 && (
        <div className="p-1.5 bg-red-500/10 border border-red-500/20 rounded shrink-0">
          <ul className="text-[10px] text-red-300/80 space-y-0.5">
            {validationErrors.map((err, i) => (
              <li key={i}>{err}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Error from execution */}
      {error && (
        <div className="p-1.5 bg-red-500/10 border border-red-500/20 rounded shrink-0">
          <p className="text-[10px] text-red-400">{error.message}</p>
        </div>
      )}

      {/* Submit button - compact */}
      <button
        onClick={handleSubmit}
        disabled={!isValid || isLoading || !hasSufficientBalance}
        className={`w-full py-1.5 px-2 rounded text-xs font-medium transition-colors shrink-0 ${
          isValid && !isLoading && hasSufficientBalance
            ? 'bg-slate-600 hover:bg-slate-700 text-white'
            : 'bg-white/10 text-white/40 cursor-not-allowed'
        }`}
      >
        {isLoading ? (
          <span className="flex items-center justify-center gap-1.5">
            <svg className="animate-spin h-3 w-3" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            {currentStep}/{totalSteps}
          </span>
        ) : status === 'success' ? (
          <span className="flex items-center justify-center gap-1.5 text-green-400">
            <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            OK
          </span>
        ) : !hasSufficientBalance ? (
          <span className="text-red-400">{t('voteCart.needMoreFunds')}</span>
        ) : (
          `${t('founderExpanded.validateCart')} (${cart.items.length})`
        )}
      </button>

      {/* Transaction info - show when there are withdrawals needed */}
      {costSummary && costSummary.withdrawCount > 0 && !isLoading && status !== 'success' && (
        <div className="p-1 bg-amber-500/10 border border-amber-500/20 rounded shrink-0">
          <p className="text-[10px] text-amber-300 text-center">
            {t('voteCart.autoWithdrawInfo') || 'Retrait auto puis vote'}
          </p>
        </div>
      )}
    </div>
  );
}
