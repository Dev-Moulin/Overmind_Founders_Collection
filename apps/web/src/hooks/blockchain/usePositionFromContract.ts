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
import { getMultiVaultAddressFromChainId } from '@0xintuition/sdk';
import { MultiVaultAbi } from '@0xintuition/protocol';
import { currentIntuitionChain } from '../../config/wagmi';

/**
 * CurveId constants
 * In INTUITION V2, curveId=1 is the default bonding curve for all standard deposits
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

  return {
    shares: (data as bigint) ?? 0n,
    isLoading,
    error: error as Error | null,
    refetch,
  };
}

/**
 * Hook to check if user has a position on either FOR or AGAINST side of a triple
 *
 * @param userAddress - The user's wallet address
 * @param termId - The triple's term_id (FOR side)
 * @param counterTermId - The triple's counter_term_id (AGAINST side)
 * @returns Position info including which side has shares
 */
export function usePositionBothSides(
  userAddress: Address | undefined,
  termId: Hex | undefined,
  counterTermId: Hex | undefined
) {
  const forPosition = usePositionFromContract(userAddress, termId);
  const againstPosition = usePositionFromContract(userAddress, counterTermId);

  const hasForPosition = forPosition.shares > 0n;
  const hasAgainstPosition = againstPosition.shares > 0n;

  // Determine which side the user is on
  const positionDirection: 'for' | 'against' | null =
    hasForPosition ? 'for' :
    hasAgainstPosition ? 'against' :
    null;

  return {
    forShares: forPosition.shares,
    againstShares: againstPosition.shares,
    hasForPosition,
    hasAgainstPosition,
    hasAnyPosition: hasForPosition || hasAgainstPosition,
    positionDirection,
    isLoading: forPosition.isLoading || againstPosition.isLoading,
    error: forPosition.error || againstPosition.error,
    refetch: () => {
      forPosition.refetch();
      againstPosition.refetch();
    },
  };
}
