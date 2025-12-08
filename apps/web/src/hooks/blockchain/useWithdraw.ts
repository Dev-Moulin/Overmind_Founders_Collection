import { useState, useCallback } from 'react';
import { useAccount, usePublicClient, useWalletClient } from 'wagmi';
import { formatEther, type Hex } from 'viem';
import { redeem, getMultiVaultAddressFromChainId, MultiVaultAbi } from '@0xintuition/protocol';
import { currentIntuitionChain } from '../../config/wagmi';
import { toast } from 'sonner';
import type { WithdrawStatus, WithdrawError, WithdrawPreview } from '../../types/withdraw';

/**
 * Result of useWithdraw hook
 */
export interface UseWithdrawResult {
  withdraw: (
    termId: Hex,
    shares: bigint,
    isPositive: boolean,
    minAssets?: bigint
  ) => Promise<Hex | null>;
  status: WithdrawStatus;
  error: WithdrawError | null;
  isLoading: boolean;
  reset: () => void;
}

/**
 * Default Curve ID for MultiVault
 *
 * In INTUITION V2, curveId=1 is the default bonding curve used for ALL deposits.
 * FOR vs AGAINST is determined by the termId used:
 * - FOR = triple's term_id
 * - AGAINST = triple's counter_term_id
 *
 * The curveId is NOT different for FOR vs AGAINST.
 */
const DEFAULT_CURVE_ID = 1n;

/**
 * Hook to withdraw TRUST from a vault after voting
 *
 * Handles the redeem process from INTUITION MultiVault contract.
 *
 * @example
 * ```tsx
 * function WithdrawButton({ termId, shares, isPositive }) {
 *   const { withdraw, status, error, isLoading } = useWithdraw();
 *
 *   const handleWithdraw = async () => {
 *     const txHash = await withdraw(termId, shares, isPositive);
 *     if (txHash) {
 *       console.log('Withdrawal successful:', txHash);
 *     }
 *   };
 *
 *   return (
 *     <button onClick={handleWithdraw} disabled={isLoading}>
 *       {isLoading ? 'Withdrawing...' : 'Withdraw TRUST'}
 *     </button>
 *   );
 * }
 * ```
 */
export function useWithdraw(): UseWithdrawResult {
  const { address } = useAccount();
  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();

  const [status, setStatus] = useState<WithdrawStatus>('idle');
  const [error, setError] = useState<WithdrawError | null>(null);

  const multiVaultAddress = getMultiVaultAddressFromChainId(currentIntuitionChain.id);

  const reset = useCallback(() => {
    setStatus('idle');
    setError(null);
  }, []);

  /**
   * Withdraw TRUST from a vault
   *
   * @param termId - The triple/atom ID
   * @param shares - Number of shares to redeem
   * @param isPositive - true for FOR vault, false for AGAINST vault
   * @param minAssets - Minimum assets to receive (slippage protection), defaults to 0
   * @returns Transaction hash or null if failed
   */
  const withdraw = useCallback(
    async (
      termId: Hex,
      shares: bigint,
      isPositive: boolean,
      minAssets: bigint = 0n
    ): Promise<Hex | null> => {
      if (!address) {
        setError({
          code: 'WALLET_NOT_CONNECTED',
          message: 'Please connect your wallet',
        });
        setStatus('error');
        toast.error('Please connect your wallet');
        return null;
      }

      if (!walletClient || !publicClient) {
        setError({
          code: 'CLIENT_NOT_READY',
          message: 'Wallet client not ready',
        });
        setStatus('error');
        toast.error('Wallet client not ready');
        return null;
      }

      if (shares <= 0n) {
        setError({
          code: 'NO_SHARES',
          message: 'No shares to withdraw',
        });
        setStatus('error');
        toast.error('No shares to withdraw');
        return null;
      }

      try {
        reset();
        setStatus('withdrawing');
        toast.info('Please sign the withdrawal transaction...');

        // In INTUITION V2, curveId=1 is used for ALL deposits (FOR and AGAINST)
        // FOR vs AGAINST is determined by which termId you use, not the curveId
        // The isPositive parameter is kept for future use/clarity but doesn't affect curveId
        const curveId = DEFAULT_CURVE_ID;

        // Check maxRedeem to see how much can be redeemed
        const maxRedeemable = await publicClient.readContract({
          address: multiVaultAddress,
          abi: MultiVaultAbi,
          functionName: 'maxRedeem',
          args: [address, termId, curveId],
        }) as bigint;

        console.log('[useWithdraw] Pre-redeem check:', {
          receiver: address,
          termId,
          curveId: curveId.toString(),
          requestedShares: shares.toString(),
          maxRedeemable: maxRedeemable.toString(),
          canRedeem: maxRedeemable >= shares,
          minAssets: minAssets.toString(),
          isPositive, // For logging only
        });

        // Determine actual shares to redeem
        let sharesToRedeem = shares;

        // If maxRedeem returns less than requested, adjust
        if (maxRedeemable < shares) {
          console.warn('[useWithdraw] maxRedeem < requested shares!', {
            maxRedeemable: maxRedeemable.toString(),
            requested: shares.toString(),
            difference: (shares - maxRedeemable).toString(),
          });

          if (maxRedeemable > 0n) {
            // Use maxRedeemable instead
            console.log('[useWithdraw] Using maxRedeemable instead:', maxRedeemable.toString());
            sharesToRedeem = maxRedeemable;
            toast.info(`Ajustement: retrait de ${formatEther(maxRedeemable)} shares (max disponible)`);
          } else {
            throw new Error('Aucune share retirable actuellement. Le vault peut être vide ou verrouillé.');
          }
        }

        const config = {
          walletClient,
          publicClient,
          address: multiVaultAddress,
        };

        // Call redeem function from @0xintuition/protocol
        const txHash = await redeem(config, {
          args: [address, termId, curveId, sharesToRedeem, minAssets],
        });

        toast.loading('Withdrawing TRUST...', { id: 'withdraw' });

        // Wait for confirmation
        const receipt = await publicClient.waitForTransactionReceipt({
          hash: txHash,
        });

        if (receipt.status !== 'success') {
          throw new Error('Withdrawal transaction failed');
        }

        // Format shares for display
        const formattedShares = formatEther(shares);

        toast.success(`Successfully withdrew ${formattedShares} TRUST!`, {
          id: 'withdraw',
        });

        setStatus('success');
        setError(null);

        return txHash;
      } catch (err: unknown) {
        console.error('Withdraw error:', err);

        let errorMessage = 'An unexpected error occurred';
        let errorCode = 'UNKNOWN_ERROR';

        const errorObj = err as { message?: string };

        // Parse error messages
        if (errorObj.message?.includes('User rejected')) {
          errorMessage = 'Transaction rejected by user';
          errorCode = 'USER_REJECTED';
        } else if (errorObj.message?.includes('insufficient funds')) {
          errorMessage = 'Insufficient ETH for gas fees';
          errorCode = 'INSUFFICIENT_GAS';
        } else if (errorObj.message?.includes('InsufficientSharesInVault') || errorObj.message?.includes('MultiVault_InsufficientSharesInVault')) {
          errorMessage = 'Le vault n\'a pas assez de liquidité pour ce retrait. Essayez un montant plus petit.';
          errorCode = 'INSUFFICIENT_VAULT_SHARES';
        } else if (errorObj.message?.includes('no shares')) {
          errorMessage = 'No shares to withdraw';
          errorCode = 'NO_SHARES';
        } else if (errorObj.message?.includes('slippage')) {
          errorMessage = 'Slippage too high, try increasing minAssets';
          errorCode = 'SLIPPAGE_ERROR';
        } else if (errorObj.message) {
          errorMessage = errorObj.message;
        }

        setError({
          code: errorCode,
          message: errorMessage,
        });
        setStatus('error');

        toast.error(errorMessage, { id: 'withdraw' });

        return null;
      }
    },
    [address, walletClient, publicClient, multiVaultAddress, reset]
  );

  return {
    withdraw,
    status,
    error,
    isLoading: status === 'withdrawing',
    reset,
  };
}

/**
 * Calculate estimated assets from shares
 *
 * This is an approximation. The actual amount depends on the bonding curve.
 * For exact calculation, query the contract's previewRedeem function.
 *
 * @param shares - Number of shares
 * @param totalShares - Total shares in the vault
 * @param totalAssets - Total assets in the vault
 * @param exitFeePercent - Exit fee percentage (default 7%)
 * @returns Estimated assets after fees
 */
export function estimateWithdrawAmount(
  shares: bigint,
  totalShares: bigint,
  totalAssets: bigint,
  exitFeePercent: number = 7
): WithdrawPreview {
  if (totalShares === 0n) {
    return {
      shares,
      estimatedAssets: 0n,
      formattedAssets: '0',
      exitFeePercent,
    };
  }

  // Calculate pro-rata share of assets
  const grossAssets = (shares * totalAssets) / totalShares;

  // Apply exit fee
  const feeMultiplier = BigInt(100 - exitFeePercent);
  const estimatedAssets = (grossAssets * feeMultiplier) / 100n;

  return {
    shares,
    estimatedAssets,
    formattedAssets: formatEther(estimatedAssets),
    exitFeePercent,
  };
}
