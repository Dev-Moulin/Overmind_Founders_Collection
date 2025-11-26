import { useState, useCallback } from 'react';
import { useAccount, usePublicClient, useWalletClient } from 'wagmi';
import { formatEther, type Hex } from 'viem';
import { redeem, getMultiVaultAddressFromChainId } from '@0xintuition/protocol';
import { currentIntuitionChain } from '../config/wagmi';
import { toast } from 'sonner';

/**
 * Withdraw status states
 */
export type WithdrawStatus =
  | 'idle'
  | 'calculating'
  | 'withdrawing'
  | 'success'
  | 'error';

/**
 * Withdraw error with details
 */
export interface WithdrawError {
  code: string;
  message: string;
}

/**
 * Preview of withdrawal amounts
 */
export interface WithdrawPreview {
  shares: bigint;
  estimatedAssets: bigint;
  formattedAssets: string;
  exitFeePercent: number;
}

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
 * Curve IDs for MultiVault
 * 0 = positive vault (FOR)
 * 1 = negative vault (AGAINST)
 */
const POSITIVE_CURVE_ID = 0n;
const NEGATIVE_CURVE_ID = 1n;

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

        const curveId = isPositive ? POSITIVE_CURVE_ID : NEGATIVE_CURVE_ID;

        const config = {
          walletClient,
          publicClient,
          address: multiVaultAddress,
        };

        // Call redeem function from @0xintuition/protocol
        const txHash = await redeem(config, {
          args: [address, termId, curveId, shares, minAssets],
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
