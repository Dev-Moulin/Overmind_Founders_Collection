/**
 * useBatchRedeem - Execute multiple redemptions in a single transaction
 *
 * Hook pour exécuter plusieurs retraits en une seule transaction.
 * Utilise la fonction `redeemBatch` du contrat MultiVault.
 *
 * @see Phase 5 in TODO_Implementation.md
 * @see Contract: redeemBatch(receiver, termIds[], curveIds[], shares[], minAssets[])
 */

import { useState, useCallback } from 'react';
import { usePublicClient, useWalletClient } from 'wagmi';
import { type Hex } from 'viem';
import {
  getMultiVaultAddressFromChainId,
  redeemBatch,
  type RedeemBatchInputs,
} from '@0xintuition/protocol';
import { currentIntuitionChain } from '../../config/wagmi';

/**
 * Single redeem item input
 */
export interface BatchRedeemItem {
  /** Term ID to redeem from */
  termId: Hex;
  /** Shares to redeem */
  shares: bigint;
  /** Minimum assets to receive (slippage protection) */
  minAssets?: bigint;
  /** Curve ID (default: 1 for linear) */
  curveId?: bigint;
}

/**
 * Batch redeem result
 */
export interface BatchRedeemResult {
  /** Transaction hash */
  transactionHash: Hex;
  /** Number of redemptions executed */
  redeemCount: number;
  /** Total shares redeemed */
  totalShares: bigint;
}

/**
 * Hook result
 */
export interface UseBatchRedeemResult {
  /** Execute batch redeem */
  executeBatch: (items: BatchRedeemItem[]) => Promise<BatchRedeemResult>;
  /** Loading state */
  loading: boolean;
  /** Error state */
  error: Error | null;
  /** Clear error */
  clearError: () => void;
}

/**
 * Hook to execute multiple redemptions in a single transaction
 *
 * @example
 * ```tsx
 * function WithdrawAll({ positions }) {
 *   const { executeBatch, loading, error } = useBatchRedeem();
 *
 *   const handleWithdrawAll = async () => {
 *     const redeemItems = positions.map(pos => ({
 *       termId: pos.termId,
 *       shares: pos.shares,
 *     }));
 *
 *     const result = await executeBatch(redeemItems);
 *     console.log('Redeemed in tx:', result.transactionHash);
 *   };
 *
 *   return (
 *     <button onClick={handleWithdrawAll} disabled={loading}>
 *       {loading ? 'Processing...' : 'Withdraw All'}
 *     </button>
 *   );
 * }
 * ```
 */
export function useBatchRedeem(): UseBatchRedeemResult {
  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const multiVaultAddress = getMultiVaultAddressFromChainId(currentIntuitionChain.id);

  /**
   * Execute batch redeem
   */
  const executeBatch = useCallback(
    async (items: BatchRedeemItem[]): Promise<BatchRedeemResult> => {
      if (!publicClient || !walletClient) {
        throw new Error('Wallet not connected');
      }

      if (items.length === 0) {
        throw new Error('No items to redeem');
      }

      setLoading(true);
      setError(null);

      try {
        // Prepare arrays for batch call
        const termIds: Hex[] = [];
        const curveIds: bigint[] = [];
        const shares: bigint[] = [];
        const minAssets: bigint[] = [];

        let totalShares = 0n;

        for (const item of items) {
          termIds.push(item.termId);
          curveIds.push(item.curveId ?? 1n); // Default to linear curve
          shares.push(item.shares);
          minAssets.push(item.minAssets ?? 0n); // 0 = no slippage protection
          totalShares += item.shares;
        }

        // Get receiver address (user's wallet)
        const receiver = walletClient.account.address;

        console.log('[useBatchRedeem] Executing batch redeem:', {
          itemCount: items.length,
          totalShares: totalShares.toString(),
          termIds,
        });

        // Use SDK redeemBatch function
        const config = {
          walletClient,
          publicClient,
          address: multiVaultAddress,
        };

        const inputs: RedeemBatchInputs = {
          args: [receiver, termIds, curveIds, shares, minAssets],
        };

        const transactionHash = await redeemBatch(config, inputs);

        console.log('[useBatchRedeem] Batch redeem successful:', transactionHash);

        return {
          transactionHash,
          redeemCount: items.length,
          totalShares,
        };
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Batch redeem failed';
        console.error('[useBatchRedeem] Error:', errorMessage);
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
