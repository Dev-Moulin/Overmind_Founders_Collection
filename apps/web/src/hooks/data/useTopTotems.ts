/**
 * useTopTotems - Hook to fetch top totems for a founder
 *
 * Returns the top N totems sorted by total TRUST (FOR + AGAINST)
 * Used for Radar Chart visualization
 *
 * @see Phase 10 - Étape 3 in TODO_FIX_01_Discussion.md
 */

import { useMemo } from 'react';
import { formatEther } from 'viem';
import { useFounderProposals } from './useFounderProposals';
import { filterValidTriples, type RawTriple } from '../../utils/tripleGuards';

export interface TopTotem {
  id: string;
  label: string;
  image?: string;
  /** FOR votes in ETH */
  trustFor: number;
  /** AGAINST votes in ETH */
  trustAgainst: number;
  /** Total TRUST (FOR + AGAINST) */
  totalTrust: number;
  /** Net score (FOR - AGAINST) */
  netScore: number;
  /** Number of unique wallets voting FOR (disabled - causes rate limiting) */
  walletsFor: number;
  /** Number of unique wallets voting AGAINST (disabled - causes rate limiting) */
  walletsAgainst: number;
  /** Total unique wallets */
  totalWallets: number;
  /** Net Votes = walletsFor - walletsAgainst */
  netVotes: number;
}

interface UseTopTotemsReturn {
  topTotems: TopTotem[];
  loading: boolean;
  error?: Error;
}

/**
 * Convert wei string to ETH number
 */
function weiToEth(weiStr: string): number {
  return parseFloat(formatEther(BigInt(weiStr)));
}

/**
 * Hook to get top totems for a founder
 *
 * @param founderName - The founder's name (e.g., "Joseph Lubin")
 * @param limit - Maximum number of totems to return (default: 5)
 * @returns Top totems sorted by total TRUST
 *
 * @example
 * ```tsx
 * const { topTotems, loading } = useTopTotems('Joseph Lubin', 5);
 * ```
 */
export function useTopTotems(
  founderName: string,
  limit: number = 5
): UseTopTotemsReturn {
  const { proposals, loading, error } = useFounderProposals(founderName);

  // Filter valid proposals first (removes those with null object/subject/predicate)
  const validProposals = useMemo(() => {
    if (!proposals || proposals.length === 0) return [];
    return filterValidTriples(proposals as RawTriple[], 'useTopTotems');
  }, [proposals]);

  const topTotems = useMemo((): TopTotem[] => {
    if (validProposals.length === 0) return [];

    // Aggregate votes by totem (object_id)
    const totemMap = new Map<string, TopTotem>();

    validProposals.forEach((proposal) => {
      // Use object.term_id since object_id is not in GraphQL response
      // proposal.object is guaranteed non-null by filterValidTriples
      const totemId = proposal.object.term_id;
      const trustFor = weiToEth(proposal.votes?.forVotes || '0');
      const trustAgainst = weiToEth(proposal.votes?.againstVotes || '0');

      if (totemMap.has(totemId)) {
        // Aggregate if same totem appears with different predicates
        const existing = totemMap.get(totemId)!;
        existing.trustFor += trustFor;
        existing.trustAgainst += trustAgainst;
        existing.totalTrust = existing.trustFor + existing.trustAgainst;
        existing.netScore = existing.trustFor - existing.trustAgainst;
      } else {
        totemMap.set(totemId, {
          id: totemId,
          label: proposal.object.label,
          image: proposal.object.image,
          trustFor,
          trustAgainst,
          totalTrust: trustFor + trustAgainst,
          netScore: trustFor - trustAgainst,
          // Wallet counts disabled (deposits query causes 429 rate limiting with 42 founders)
          // TODO: Implement batched solution at HomePage level
          walletsFor: 0,
          walletsAgainst: 0,
          totalWallets: 0,
          netVotes: 0,
        });
      }
    });

    // Sort by total TRUST (descending) and take top N
    return Array.from(totemMap.values())
      .sort((a, b) => b.totalTrust - a.totalTrust)
      .slice(0, limit);
  }, [validProposals, limit]);

  // Memoize error to prevent new reference on each render
  const errorObj = useMemo(() => error as Error | undefined, [error]);

  // Memoize return value to prevent unnecessary re-renders
  return useMemo(() => ({
    topTotems,
    loading,
    error: errorObj,
  }), [topTotems, loading, errorObj]);
}
