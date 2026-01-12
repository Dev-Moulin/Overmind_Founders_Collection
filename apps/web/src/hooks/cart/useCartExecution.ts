/**
 * useCartExecution - Cart execution orchestrator
 *
 * Orchestrates the complete cart execution workflow:
 * 1. Validate cart items
 * 2. Execute withdrawals for items with opposite positions (batch)
 * 3. Execute deposits for all items (batch)
 *
 * Handles partial failures, retries, and status tracking.
 *
 * @see Phase 5 in TODO_Implementation.md
 */

import { useState, useCallback, useMemo } from 'react';
import { type Hex } from 'viem';
import { useBatchDeposit, type BatchDepositItem } from '../blockchain/useBatchDeposit';
import { useBatchRedeem, type BatchRedeemItem } from '../blockchain/useBatchRedeem';
import type {
  VoteCart,
  VoteCartItem,
  VoteCartStatus,
  VoteCartError,
} from '../../types/voteCart';

/**
 * Type guard to check if a cart item has all required IDs for processing
 */
function isProcessableItem(item: VoteCartItem): item is VoteCartItem & { totemId: Hex; termId: Hex; counterTermId: Hex } {
  return item.totemId !== null && item.termId !== null && item.counterTermId !== null;
}

/**
 * Execution step result
 */
interface StepResult {
  success: boolean;
  transactionHash?: Hex;
  error?: string;
}

/**
 * Complete execution result
 */
export interface CartExecutionResult {
  /** Overall success */
  success: boolean;
  /** Withdraw step result (if applicable) */
  withdrawStep?: StepResult;
  /** Deposit step result */
  depositStep?: StepResult;
  /** Total items processed */
  totalItems: number;
  /** Items that needed withdrawal */
  withdrawnItems: number;
  /** Items deposited */
  depositedItems: number;
}

/**
 * Hook result
 */
export interface UseCartExecutionResult {
  /** Execute the cart */
  executeCart: (cart: VoteCart) => Promise<CartExecutionResult>;
  /** Current execution status */
  status: VoteCartStatus;
  /** Current error (if any) */
  error: VoteCartError | null;
  /** Progress percentage (0-100) */
  progress: number;
  /** Reset state */
  reset: () => void;
}

/**
 * Hook to orchestrate cart execution
 *
 * @example
 * ```tsx
 * function CartCheckout({ cart, onSuccess }) {
 *   const { executeCart, status, error, progress } = useCartExecution();
 *
 *   const handleCheckout = async () => {
 *     const result = await executeCart(cart);
 *     if (result.success) {
 *       onSuccess();
 *     }
 *   };
 *
 *   return (
 *     <div>
 *       <button onClick={handleCheckout} disabled={status !== 'idle'}>
 *         Confirmer
 *       </button>
 *       {status !== 'idle' && (
 *         <div>
 *           <progress value={progress} max={100} />
 *           <span>{getStatusLabel(status)}</span>
 *         </div>
 *       )}
 *       {error && <div className="error">{error.message}</div>}
 *     </div>
 *   );
 * }
 * ```
 */
export function useCartExecution(): UseCartExecutionResult {
  const [status, setStatus] = useState<VoteCartStatus>('idle');
  const [error, setError] = useState<VoteCartError | null>(null);
  const [progress, setProgress] = useState(0);

  const { executeBatch: executeBatchDeposit } = useBatchDeposit();
  const { executeBatch: executeBatchRedeem } = useBatchRedeem();

  /**
   * Execute the cart
   */
  const executeCart = useCallback(
    async (cart: VoteCart): Promise<CartExecutionResult> => {
      console.log('[useCartExecution] ========== EXECUTE CART START ==========');
      console.log('[useCartExecution] Cart received:', {
        itemCount: cart?.items?.length || 0,
        items: cart?.items?.map(item => ({
          id: item.id,
          totemName: item.totemName,
          termId: item.termId,
          counterTermId: item.counterTermId,
          direction: item.direction,
          curveId: item.curveId,
          amount: item.amount.toString(),
          isNewTotem: item.isNewTotem,
          needsWithdraw: item.needsWithdraw,
        })),
      });

      if (!cart || cart.items.length === 0) {
        console.log('[useCartExecution] ❌ Cart is empty, aborting');
        const err: VoteCartError = {
          code: 'EMPTY_CART',
          message: 'Le panier est vide',
          step: 'validating',
        };
        setError(err);
        setStatus('error');
        return {
          success: false,
          totalItems: 0,
          withdrawnItems: 0,
          depositedItems: 0,
        };
      }

      setStatus('validating');
      setProgress(10);
      setError(null);

      const result: CartExecutionResult = {
        success: false,
        totalItems: cart.items.length,
        withdrawnItems: 0,
        depositedItems: 0,
      };

      try {
        // Filter to only processable items (with valid totemId/termId/counterTermId)
        const processableItems = cart.items.filter(isProcessableItem);

        // Step 1: Identify items needing withdrawal
        const itemsNeedingWithdraw = processableItems.filter(
          (item) => item.needsWithdraw && item.currentPosition
        );
        console.log('[useCartExecution] Items needing withdraw:', itemsNeedingWithdraw.length);

        // Step 2: Execute withdrawals if any
        if (itemsNeedingWithdraw.length > 0) {
          setStatus('withdrawing');
          setProgress(30);

          const redeemItems: BatchRedeemItem[] = itemsNeedingWithdraw.map((item) => {
            // Determine which termId to redeem from based on current position
            const redeemTermId =
              item.currentPosition!.direction === 'for'
                ? item.termId
                : item.counterTermId;

            return {
              termId: redeemTermId,
              shares: item.currentPosition!.shares,
            };
          });

          console.log('[useCartExecution] Executing withdrawals:', redeemItems.length, 'items');

          try {
            const redeemResult = await executeBatchRedeem(redeemItems);
            result.withdrawStep = {
              success: true,
              transactionHash: redeemResult.transactionHash,
            };
            result.withdrawnItems = redeemResult.redeemCount;
          } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Withdrawal failed';
            result.withdrawStep = {
              success: false,
              error: errorMessage,
            };

            setError({
              code: 'WITHDRAW_FAILED',
              message: `Échec du retrait: ${errorMessage}`,
              step: 'withdrawing',
            });
            setStatus('error');
            return result;
          }
        }

        // Step 3: Execute deposits
        setStatus('depositing');
        setProgress(60);

        // Prepare deposit items - use correct termId based on direction
        // Only process items with valid IDs
        const depositItems: BatchDepositItem[] = processableItems.map((item) => {
          const depositTermId =
            item.direction === 'for' ? item.termId : item.counterTermId;

          return {
            termId: depositTermId,
            amount: item.amount,
            curveId: BigInt(item.curveId), // 1 = Linear, 2 = Progressive
          };
        });

        console.log('[useCartExecution] ========== PREPARING DEPOSITS ==========');
        console.log('[useCartExecution] Deposit items count:', depositItems.length);
        depositItems.forEach((item, index) => {
          const cartItem = cart.items[index];
          console.log(`[useCartExecution] Deposit #${index + 1}:`, {
            totemName: cartItem.totemName,
            direction: cartItem.direction,
            termId: cartItem.termId,
            counterTermId: cartItem.counterTermId,
            depositTermId: item.termId,
            amount: item.amount.toString(),
            amountETH: Number(item.amount) / 1e18,
            isNewTotem: cartItem.isNewTotem,
          });
        });
        console.log('[useCartExecution] ⚠️ IMPORTANT: If isNewTotem=true, the triple must be created FIRST!');

        try {
          const depositResult = await executeBatchDeposit(depositItems);
          result.depositStep = {
            success: true,
            transactionHash: depositResult.transactionHash,
          };
          result.depositedItems = depositResult.depositCount;
        } catch (err) {
          const errorMessage = err instanceof Error ? err.message : 'Deposit failed';
          result.depositStep = {
            success: false,
            error: errorMessage,
          };

          setError({
            code: 'DEPOSIT_FAILED',
            message: `Échec du dépôt: ${errorMessage}`,
            step: 'depositing',
          });
          setStatus('error');
          return result;
        }

        // Success!
        setProgress(100);
        setStatus('success');
        result.success = true;

        console.log('[useCartExecution] Cart execution successful:', {
          totalItems: result.totalItems,
          withdrawnItems: result.withdrawnItems,
          depositedItems: result.depositedItems,
        });

        return result;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        setError({
          code: 'UNKNOWN_ERROR',
          message: errorMessage,
          step: status,
        });
        setStatus('error');
        return result;
      }
    },
    [executeBatchDeposit, executeBatchRedeem, status]
  );

  /**
   * Reset state
   */
  const reset = useCallback(() => {
    setStatus('idle');
    setError(null);
    setProgress(0);
  }, []);

  // Memoize return value to prevent unnecessary re-renders
  return useMemo(() => ({
    executeCart,
    status,
    error,
    progress,
    reset,
  }), [executeCart, status, error, progress, reset]);
}

/**
 * Get human-readable status label
 */
export function getStatusLabel(status: VoteCartStatus): string {
  switch (status) {
    case 'idle':
      return 'Prêt';
    case 'validating':
      return 'Validation...';
    case 'withdrawing':
      return 'Retrait des positions opposées...';
    case 'creating_atoms':
      return 'Création des nouveaux totems...';
    case 'depositing':
      return 'Dépôt des votes...';
    case 'success':
      return 'Terminé !';
    case 'error':
      return 'Erreur';
    default:
      return status;
  }
}
