/**
 * useCrossPredicateRedeem - Handle cross-predicate position redemption
 *
 * Extracted from VoteTotemPanel.tsx handleRedeemAllCrossPredicate (~40 lines)
 * When user wants to vote with a different predicate but has existing positions
 * with another predicate on the same totem, this hook handles redeeming those positions.
 *
 * @see VoteTotemPanel.tsx, CrossPredicatePopup.tsx, usePredicateBlocking.ts
 */

import { useState, useCallback } from 'react';
import type { Hex } from 'viem';
import type { PredicateRedeemInfo } from './usePredicateBlocking';

/** Vote with details for redemption */
interface VoteForRedeem {
  term_id: string;
  shares: string;
  isPositive: boolean;
}

export interface UseCrossPredicateRedeemParams {
  /** Withdraw function from useWithdraw hook */
  withdraw: (
    termId: Hex,
    shares: bigint,
    isPositive: boolean,
    minAssets: bigint
  ) => Promise<string | null>;
  /** Refetch position after redemption */
  refetchPosition: () => void;
  /** Set success message */
  setSuccess: (msg: string | null) => void;
  /** Set error message */
  setError: (msg: string | null) => void;
  /** Translation function (i18next TFunction) */
  t: (key: string, defaultValue?: string | Record<string, unknown>) => string;
}

export interface UseCrossPredicateRedeemResult {
  /** Whether redemption is in progress */
  isLoading: boolean;
  /** Redeem all positions with the other predicate */
  redeemAllCrossPredicate: (
    redeemInfo: PredicateRedeemInfo,
    pendingPredicateId: string | null,
    callbacks: {
      onSuccess: (predicateId: string | null) => void;
      onClose: () => void;
    }
  ) => Promise<void>;
}

/**
 * Hook for handling cross-predicate position redemption
 */
export function useCrossPredicateRedeem({
  withdraw,
  refetchPosition,
  setSuccess,
  setError,
  t,
}: UseCrossPredicateRedeemParams): UseCrossPredicateRedeemResult {
  const [isLoading, setIsLoading] = useState(false);

  const redeemAllCrossPredicate = useCallback(async (
    redeemInfo: PredicateRedeemInfo,
    pendingPredicateId: string | null,
    callbacks: {
      onSuccess: (predicateId: string | null) => void;
      onClose: () => void;
    }
  ) => {
    if (!redeemInfo?.votes?.length) return;

    setIsLoading(true);
    try {
      // Redeem each position one by one
      for (const vote of redeemInfo.votes as VoteForRedeem[]) {
        const shares = BigInt(vote.shares);
        if (shares <= 0n) continue;

        await withdraw(
          vote.term_id as Hex,
          shares,
          vote.isPositive,
          0n // minAssets
        );
      }

      setSuccess(t('founderExpanded.crossPredicateRedeemSuccess'));
      setTimeout(() => setSuccess(null), 3000);
      callbacks.onClose();

      // Now select the predicate user wanted
      callbacks.onSuccess(pendingPredicateId);

      // Refetch position after successful withdraw
      refetchPosition();
    } catch (err) {
      console.error('[useCrossPredicateRedeem] Cross-predicate redeem error:', err);
      setError(t('founderExpanded.crossPredicateRedeemError'));
      setTimeout(() => setError(null), 3000);
    } finally {
      setIsLoading(false);
    }
  }, [withdraw, refetchPosition, setSuccess, setError, t]);

  return {
    isLoading,
    redeemAllCrossPredicate,
  };
}
