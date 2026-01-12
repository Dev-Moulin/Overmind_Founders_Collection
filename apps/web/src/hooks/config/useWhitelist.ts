import { useMemo } from 'react';
import { useReadContract } from 'wagmi';
import { base } from 'wagmi/chains';
import type { Address } from 'viem';
import { NFT_CONTRACT } from '../../config/constants';

/**
 * ERC-721 balanceOf ABI
 */
const ABI = [
  {
    name: 'balanceOf',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'owner', type: 'address' }],
    outputs: [{ name: 'balance', type: 'uint256' }],
  },
] as const;

/**
 * Hook to check if a wallet address is eligible (owns the required NFT)
 *
 * @param address - Wallet address to check
 * @returns Object with eligibility status, loading state, and error
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { address } = useAccount();
 *   const { isEligible, isLoading, error } = useWhitelist(address);
 *
 *   if (isLoading) return <div>Checking eligibility...</div>;
 *   if (error) return <div>Error: {error.message}</div>;
 *   if (!isEligible) return <NotEligible />;
 *
 *   return <div>Welcome!</div>;
 * }
 * ```
 */
export function useWhitelist(address?: Address) {
  const {
    data: balance,
    isLoading,
    error,
    refetch,
  } = useReadContract({
    address: NFT_CONTRACT,
    abi: ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    chainId: base.id, // Force read from Base Mainnet (cross-chain verification)
    query: {
      enabled: !!address,
      staleTime: 60_000, // Cache for 1 minute
      retry: 2,
    },
  });

  // Memoize computed values
  const isEligible = balance ? balance > 0n : false;
  const balanceValue = balance ?? 0n;

  // Memoize return value to prevent unnecessary re-renders
  return useMemo(() => ({
    /** True if the address owns at least one NFT */
    isEligible,
    /** Loading state while checking balance */
    isLoading,
    /** Error if contract read fails */
    error,
    /** Manual refetch function to check eligibility again */
    refetch,
    /** NFT balance (number of NFTs owned) */
    balance: balanceValue,
    /** NFT contract address */
    contractAddress: NFT_CONTRACT,
  }), [isEligible, isLoading, error, refetch, balanceValue]);
}
