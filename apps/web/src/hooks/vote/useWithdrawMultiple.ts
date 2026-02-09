/**
 * useWithdrawMultiple - Handle multiple position withdrawals
 *
 * Extracted from VoteTotemPanel.tsx handleWithdrawMultiple (~60 lines)
 * Executes sequential withdrawals for multiple positions and manages notifications.
 *
 * @see VoteTotemPanel.tsx, WithdrawOnlyPanel.tsx
 */

import { useCallback } from 'react';
import type { Hex } from 'viem';
import type { CurveId } from '../index';

/** Withdraw request from WithdrawOnlyPanel */
export interface WithdrawRequest {
  termId: Hex;
  shares: bigint;
  curveId: CurveId;
  direction: 'for' | 'against';
  percentage: number;
}

export interface UseWithdrawMultipleParams {
  /** Withdraw function from useWithdraw hook */
  withdraw: (
    termId: Hex,
    shares: bigint,
    isPositive: boolean,
    minAssets: bigint,
    curveId?: 1 | 2
  ) => Promise<string | null>;
  /** Refetch position after withdrawal */
  refetchPosition: () => void;
  /** Reset withdraw state */
  resetWithdraw: () => void;
  /** Set success message */
  setSuccess: (msg: string | null) => void;
  /** Set error message */
  setError: (msg: string | null) => void;
  /** Translation function (i18next TFunction) */
  t: (key: string, defaultValue?: string | Record<string, unknown>) => string;
}

export interface UseWithdrawMultipleResult {
  /** Execute multiple withdrawals */
  withdrawMultiple: (requests: WithdrawRequest[]) => Promise<void>;
}

/**
 * Hook for handling multiple position withdrawals sequentially
 */
export function useWithdrawMultiple({
  withdraw,
  refetchPosition,
  resetWithdraw,
  setSuccess,
  setError,
  t,
}: UseWithdrawMultipleParams): UseWithdrawMultipleResult {

  const withdrawMultiple = useCallback(async (requests: WithdrawRequest[]) => {
    if (requests.length === 0) return;

    console.log('[useWithdrawMultiple] WithdrawMultiple:', {
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
          console.log(`[useWithdrawMultiple] Withdraw ${successCount}/${requests.length} success:`, txHash);
        } else {
          failCount++;
        }
      } catch (err) {
        console.error('[useWithdrawMultiple] Withdraw error:', err);
        failCount++;
      }
    }

    // Show result notification
    if (successCount > 0 && failCount === 0) {
      const msg = requests.length > 1
        ? t('withdraw.multipleSuccess', { count: successCount })
        : t('withdraw.success');
      setSuccess(msg);
      setTimeout(() => setSuccess(null), 3000);
    } else if (successCount > 0) {
      setSuccess(t('withdraw.partialSuccess', { success: successCount, total: requests.length }));
      setTimeout(() => setSuccess(null), 3000);
    } else {
      setError(t('withdraw.error'));
      setTimeout(() => setError(null), 3000);
    }

    // Refetch position after withdrawals
    refetchPosition();
    resetWithdraw();
  }, [withdraw, refetchPosition, resetWithdraw, setSuccess, setError, t]);

  return { withdrawMultiple };
}
