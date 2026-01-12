/**
 * usePositionFromContract - Read user shares directly from MultiVault contract
 *
 * This provides a reliable fallback when GraphQL position queries fail due to:
 * - Indexer synchronization delays (15-30s after transaction)
 * - term_id format mismatches between frontend and indexer
 *
 * The contract is the source of truth for positions.
 */

import { useReadContract } from 'wagmi';
import { type Hex, type Address } from 'viem';
import { useCallback, useMemo, useRef } from 'react';
import { getMultiVaultAddressFromChainId } from '@0xintuition/sdk';
import { MultiVaultAbi } from '@0xintuition/protocol';
import { currentIntuitionChain } from '../../config/wagmi';
import { CURVE_LINEAR, CURVE_PROGRESSIVE } from './useVote';
import type { CurveId } from './useVote';

/**
 * CurveId constants
 * In INTUITION V2:
 * - curveId=1 is Linear curve (default, stable price)
 * - curveId=2 is Progressive curve (rewards early adopters)
 */
const DEFAULT_CURVE_ID = 1n;

interface UsePositionFromContractResult {
  /** User's shares on this term (0n if no position) */
  shares: bigint;
  /** True while reading from contract */
  isLoading: boolean;
  /** Error if contract read failed */
  error: Error | null;
  /** Refetch the position */
  refetch: () => void;
}

/**
 * Hook to read user's position directly from the MultiVault contract
 *
 * This is more reliable than GraphQL because:
 * - No indexer delay
 * - No format mismatch issues
 * - Direct source of truth
 *
 * @param userAddress - The user's wallet address
 * @param termId - The term ID (triple or atom) to check position for
 * @param curveId - The bonding curve ID (default: 1n)
 * @returns The user's shares on this term
 *
 * @example
 * ```tsx
 * const { shares, isLoading } = usePositionFromContract(
 *   address,
 *   claim.termId
 * );
 *
 * if (shares > 0n) {
 *   console.log('User has', formatEther(shares), 'shares');
 * }
 * ```
 */
export function usePositionFromContract(
  userAddress: Address | undefined,
  termId: Hex | undefined,
  curveId: bigint = DEFAULT_CURVE_ID
): UsePositionFromContractResult {
  const multiVaultAddress = getMultiVaultAddressFromChainId(currentIntuitionChain.id);

  const { data, isLoading, error, refetch } = useReadContract({
    address: multiVaultAddress,
    abi: MultiVaultAbi,
    functionName: 'getShares',
    args: userAddress && termId ? [userAddress, termId, curveId] : undefined,
    query: {
      enabled: !!userAddress && !!termId,
    },
  });

  // Memoize error to prevent new reference on each render
  const errorObj = useMemo(() => error as Error | null, [error]);

  // Memoize return value to prevent unnecessary re-renders
  return useMemo(() => ({
    shares: (data as bigint) ?? 0n,
    isLoading,
    error: errorObj,
    refetch,
  }), [data, isLoading, errorObj, refetch]);
}

/**
 * Hook to check if user has a position on either FOR or AGAINST side of a triple
 * Now checks BOTH Linear (curveId=1) and Progressive (curveId=2) curves
 *
 * @param userAddress - The user's wallet address
 * @param termId - The triple's term_id (FOR side)
 * @param counterTermId - The triple's counter_term_id (AGAINST side)
 * @returns Position info including which side has shares and on which curve
 */
export function usePositionBothSides(
  userAddress: Address | undefined,
  termId: Hex | undefined,
  counterTermId: Hex | undefined
) {
  // Check positions on Linear curve (curveId=1)
  const forPositionLinear = usePositionFromContract(userAddress, termId, BigInt(CURVE_LINEAR));
  const againstPositionLinear = usePositionFromContract(userAddress, counterTermId, BigInt(CURVE_LINEAR));

  // Check positions on Progressive curve (curveId=2)
  const forPositionProgressive = usePositionFromContract(userAddress, termId, BigInt(CURVE_PROGRESSIVE));
  const againstPositionProgressive = usePositionFromContract(userAddress, counterTermId, BigInt(CURVE_PROGRESSIVE));

  // Combine positions across curves
  const forSharesLinear = forPositionLinear.shares;
  const forSharesProgressive = forPositionProgressive.shares;
  const againstSharesLinear = againstPositionLinear.shares;
  const againstSharesProgressive = againstPositionProgressive.shares;

  // Total shares (for display purposes)
  const totalForShares = forSharesLinear + forSharesProgressive;
  const totalAgainstShares = againstSharesLinear + againstSharesProgressive;

  const hasForPositionLinear = forSharesLinear > 0n;
  const hasForPositionProgressive = forSharesProgressive > 0n;
  const hasAgainstPositionLinear = againstSharesLinear > 0n;
  const hasAgainstPositionProgressive = againstSharesProgressive > 0n;

  const hasForPosition = hasForPositionLinear || hasForPositionProgressive;
  const hasAgainstPosition = hasAgainstPositionLinear || hasAgainstPositionProgressive;

  // Determine which side the user is on (prioritize Linear if both exist)
  const positionDirection: 'for' | 'against' | null =
    hasForPosition ? 'for' :
    hasAgainstPosition ? 'against' :
    null;

  // Determine which curveId the position is on
  // Note: A user could have positions on BOTH curves (Linear FOR + Progressive FOR)
  // We return the curveId of the largest position for the detected direction
  const positionCurveId: CurveId | null = (() => {
    if (positionDirection === 'for') {
      // User is FOR - check which curve has more shares
      if (forSharesLinear >= forSharesProgressive && hasForPositionLinear) return CURVE_LINEAR;
      if (hasForPositionProgressive) return CURVE_PROGRESSIVE;
      return null;
    }
    if (positionDirection === 'against') {
      // User is AGAINST - check which curve has more shares
      if (againstSharesLinear >= againstSharesProgressive && hasAgainstPositionLinear) return CURVE_LINEAR;
      if (hasAgainstPositionProgressive) return CURVE_PROGRESSIVE;
      return null;
    }
    return null;
  })();

  const isLoading =
    forPositionLinear.isLoading || againstPositionLinear.isLoading ||
    forPositionProgressive.isLoading || againstPositionProgressive.isLoading;

  const error =
    forPositionLinear.error || againstPositionLinear.error ||
    forPositionProgressive.error || againstPositionProgressive.error;

  // Store refetch functions in refs to avoid unstable references
  const refetchFnsRef = useRef({
    forLinear: forPositionLinear.refetch,
    againstLinear: againstPositionLinear.refetch,
    forProgressive: forPositionProgressive.refetch,
    againstProgressive: againstPositionProgressive.refetch,
  });

  // Update refs on each render (refs don't trigger re-renders)
  refetchFnsRef.current = {
    forLinear: forPositionLinear.refetch,
    againstLinear: againstPositionLinear.refetch,
    forProgressive: forPositionProgressive.refetch,
    againstProgressive: againstPositionProgressive.refetch,
  };

  // Stable refetch function that uses refs
  const refetch = useCallback(() => {
    refetchFnsRef.current.forLinear();
    refetchFnsRef.current.againstLinear();
    refetchFnsRef.current.forProgressive();
    refetchFnsRef.current.againstProgressive();
  }, []); // Empty deps - function is stable

  // Mémoriser le résultat pour éviter des références instables
  return useMemo(() => ({
    // Total shares for display
    forShares: totalForShares,
    againstShares: totalAgainstShares,
    // Per-curve breakdown
    forSharesLinear,
    forSharesProgressive,
    againstSharesLinear,
    againstSharesProgressive,
    // Position flags
    hasForPosition,
    hasAgainstPosition,
    hasForPositionLinear,
    hasForPositionProgressive,
    hasAgainstPositionLinear,
    hasAgainstPositionProgressive,
    hasAnyPosition: hasForPosition || hasAgainstPosition,
    // Direction and curve
    positionDirection,
    positionCurveId,
    // Loading/error states
    isLoading,
    error,
    refetch,
  }), [
    totalForShares,
    totalAgainstShares,
    forSharesLinear,
    forSharesProgressive,
    againstSharesLinear,
    againstSharesProgressive,
    hasForPosition,
    hasAgainstPosition,
    hasForPositionLinear,
    hasForPositionProgressive,
    hasAgainstPositionLinear,
    hasAgainstPositionProgressive,
    positionDirection,
    positionCurveId,
    isLoading,
    error,
    refetch,
  ]);
}
