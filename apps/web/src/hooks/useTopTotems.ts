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

  const topTotems = useMemo((): TopTotem[] => {
    if (!proposals || proposals.length === 0) return [];

    // Aggregate votes by totem (object_id)
    const totemMap = new Map<string, TopTotem>();

    proposals.forEach((proposal) => {
      const totemId = proposal.object_id;
      const trustFor = weiToEth(proposal.votes.forVotes);
      const trustAgainst = weiToEth(proposal.votes.againstVotes);

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
        });
      }
    });

    // Sort by total TRUST (descending) and take top N
    return Array.from(totemMap.values())
      .sort((a, b) => b.totalTrust - a.totalTrust)
      .slice(0, limit);
  }, [proposals, limit]);

  return {
    topTotems,
    loading,
    error: error as Error | undefined,
  };
}
