/**
 * useVaultInitStatus - Check if a vault is initialized for a specific curve
 *
 * INTUITION Protocol Rule:
 * - Oppose Progressive requires the FOR Progressive vault to be initialized first
 * - If not initialized: 3 transactions (init FOR → redeem FOR → deposit AGAINST)
 * - If already initialized: 1 transaction
 *
 * This hook reads directly from the MultiVault contract using getVault().
 * A vault is initialized if totalShares > 0 (ghost shares remain after redeem).
 *
 * NOTE: Using contract read instead of GraphQL because:
 * - GraphQL deposits_aggregate shows 0 after redeem (deposits removed)
 * - Contract getVault shows totalShares > 0 (ghost shares persist)
 */

import { useMemo } from 'react';
import { useReadContract } from 'wagmi';
import { type Hex } from 'viem';
import { getMultiVaultAddressFromChainId } from '@0xintuition/sdk';
import { MultiVaultAbi } from '@0xintuition/protocol';
import { currentIntuitionChain } from '../../config/wagmi';

interface UseVaultInitStatusParams {
  /** The triple's term_id (FOR vault) */
  termId: string | undefined;
  /** The curve ID to check (2 = Progressive) */
  curveId: number;
  /** Skip the query if not needed */
  skip?: boolean;
}

interface UseVaultInitStatusResult {
  /** Whether the vault is initialized (totalShares > 0) */
  isInitialized: boolean;
  /** Whether the contract read is loading */
  isLoading: boolean;
  /** Total shares in the vault (includes ghost shares) */
  totalShares: bigint;
  /** Force refetch from contract (e.g., after a transaction) */
  refetch: () => void;
}

export function useVaultInitStatus({
  termId,
  curveId,
  skip = false,
}: UseVaultInitStatusParams): UseVaultInitStatusResult {
  const shouldSkip = skip || !termId;
  const multiVaultAddress = getMultiVaultAddressFromChainId(currentIntuitionChain.id);

  // Read vault state directly from contract
  // getVault(termId, curveId) returns (totalAssets, totalShares)
  const { data, isLoading, refetch } = useReadContract({
    address: multiVaultAddress,
    abi: MultiVaultAbi,
    functionName: 'getVault',
    args: termId ? [termId as Hex, BigInt(curveId)] : undefined,
    query: {
      enabled: !shouldSkip,
    },
  });

  const result = useMemo(() => {
    if (shouldSkip || isLoading) {
      return {
        isInitialized: false,
        isLoading,
        totalShares: 0n,
      };
    }

    // getVault returns [totalAssets, totalShares]
    const vaultData = data as [bigint, bigint] | undefined;
    const totalShares = vaultData?.[1] ?? 0n;

    return {
      isInitialized: totalShares > 0n,
      isLoading: false,
      totalShares,
    };
  }, [shouldSkip, isLoading, data]);

  return { ...result, refetch };
}
