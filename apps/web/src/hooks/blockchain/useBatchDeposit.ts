/**
 * useBatchDeposit - Execute multiple deposits in a single transaction
 *
 * Hook pour exécuter plusieurs dépôts (votes FOR) en une seule transaction.
 * Utilise la fonction `depositBatch` du contrat MultiVault.
 *
 * @see Phase 5 in TODO_Implementation.md
 * @see Contract: depositBatch(receiver, termIds[], curveIds[], assets[], minShares[])
 */

import { useState, useCallback } from 'react';
import { usePublicClient, useWalletClient } from 'wagmi';
import { type Hex } from 'viem';
import {
  getMultiVaultAddressFromChainId,
  depositBatch,
  type DepositBatchInputs,
} from '@0xintuition/protocol';
import { currentIntuitionChain } from '../../config/wagmi';

/**
 * Single deposit item input
 */
export interface BatchDepositItem {
  /** Term ID to deposit into */
  termId: Hex;
  /** Amount in wei */
  amount: bigint;
  /** Minimum shares to receive (slippage protection) */
  minShares?: bigint;
  /** Curve ID (default: 1 for linear) */
  curveId?: bigint;
}

/**
 * Batch deposit result
 */
export interface BatchDepositResult {
  /** Transaction hash */
  transactionHash: Hex;
  /** Number of deposits executed */
  depositCount: number;
  /** Total amount deposited */
  totalAmount: bigint;
}

/**
 * Hook result
 */
export interface UseBatchDepositResult {
  /** Execute batch deposit */
  executeBatch: (items: BatchDepositItem[]) => Promise<BatchDepositResult>;
  /** Loading state */
  loading: boolean;
  /** Error state */
  error: Error | null;
  /** Clear error */
  clearError: () => void;
}

/**
 * Hook to execute multiple deposits in a single transaction
 *
 * @example
 * ```tsx
 * function CartCheckout({ items }) {
 *   const { executeBatch, loading, error } = useBatchDeposit();
 *
 *   const handleCheckout = async () => {
 *     const depositItems = items.map(item => ({
 *       termId: item.termId,
 *       amount: item.amount,
 *     }));
 *
 *     const result = await executeBatch(depositItems);
 *     console.log('Deposited in tx:', result.transactionHash);
 *   };
 *
 *   return (
 *     <button onClick={handleCheckout} disabled={loading}>
 *       {loading ? 'Processing...' : 'Checkout'}
 *     </button>
 *   );
 * }
 * ```
 */
export function useBatchDeposit(): UseBatchDepositResult {
  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const multiVaultAddress = getMultiVaultAddressFromChainId(currentIntuitionChain.id);

  /**
   * Execute batch deposit
   */
  const executeBatch = useCallback(
    async (items: BatchDepositItem[]): Promise<BatchDepositResult> => {
      if (!publicClient || !walletClient) {
        throw new Error('Wallet not connected');
      }

      if (items.length === 0) {
        throw new Error('No items to deposit');
      }

      setLoading(true);
      setError(null);

      try {
        // Prepare arrays for batch call
        const termIds: Hex[] = [];
        const curveIds: bigint[] = [];
        const assets: bigint[] = [];
        const minShares: bigint[] = [];

        let totalAmount = 0n;

        for (const item of items) {
          termIds.push(item.termId);
          curveIds.push(item.curveId ?? 1n); // Default to linear curve
          assets.push(item.amount);
          minShares.push(item.minShares ?? 0n); // 0 = no slippage protection
          totalAmount += item.amount;
        }

        // Get receiver address (user's wallet)
        const receiver = walletClient.account.address;

        console.log('[useBatchDeposit] ========== BATCH DEPOSIT START ==========');
        console.log('[useBatchDeposit] Executing batch deposit:', {
          itemCount: items.length,
          totalAmount: totalAmount.toString(),
          totalAmountETH: Number(totalAmount) / 1e18,
          receiver,
          multiVaultAddress,
        });
        console.log('[useBatchDeposit] Term IDs to deposit into:');
        termIds.forEach((termId, index) => {
          console.log(`  [${index + 1}] termId: ${termId}, amount: ${assets[index].toString()} (${Number(assets[index]) / 1e18} ETH)`);
        });
        console.log('[useBatchDeposit] ⚠️ NOTE: depositBatch deposits into EXISTING term IDs only!');
        console.log('[useBatchDeposit] If a termId is for an atom (not a triple), the deposit goes to the atom, NOT a triple!');

        // Use SDK depositBatch function
        const config = {
          walletClient,
          publicClient,
          address: multiVaultAddress,
        };

        const inputs: DepositBatchInputs = {
          args: [receiver, termIds, curveIds, assets, minShares],
          value: totalAmount,
        };

        const transactionHash = await depositBatch(config, inputs);

        console.log('[useBatchDeposit] ✅ Batch deposit successful!');
        console.log('[useBatchDeposit] Transaction hash:', transactionHash);
        console.log('[useBatchDeposit] ========== BATCH DEPOSIT END ==========');

        return {
          transactionHash,
          depositCount: items.length,
          totalAmount,
        };
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Batch deposit failed';
        console.error('[useBatchDeposit] Error:', errorMessage);
        const error = new Error(errorMessage);
        setError(error);
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [publicClient, walletClient, multiVaultAddress]
  );

  /**
   * Clear error
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    executeBatch,
    loading,
    error,
    clearError,
  };
}
