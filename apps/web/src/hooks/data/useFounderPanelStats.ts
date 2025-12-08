/**
 * useFounderPanelStats - Hook to fetch stats for the left panel
 *
 * Returns:
 * - Total Market Cap = Σ(FOR + AGAINST) on all founder's triples
 * - Total Holders = count distinct sender_id
 * - Claims = count of distinct triples
 *
 * @see Phase 10 - Etape 6 in TODO_FIX_01_Discussion.md
 */

import { useQuery } from '@apollo/client';
import { formatEther } from 'viem';
import { GET_FOUNDER_PANEL_STATS } from '../../lib/graphql/queries';
import type { GetFounderPanelStatsResult } from '../../lib/graphql/types';

export interface FounderPanelStats {
  /** Total Market Cap in wei */
  totalMarketCap: bigint;
  /** Formatted Market Cap (e.g., "1.23k") */
  formattedMarketCap: string;
  /** Number of unique voters */
  totalHolders: number;
  /** Number of distinct claims/triples */
  claims: number;
}

interface UseFounderPanelStatsReturn {
  stats: FounderPanelStats;
  loading: boolean;
  error?: Error;
  refetch: () => void;
}

/**
 * Format large numbers for display
 */
function formatMarketCap(value: bigint): string {
  const ethValue = parseFloat(formatEther(value));
  if (ethValue >= 1000000) {
    return `${(ethValue / 1000000).toFixed(2)}M`;
  }
  if (ethValue >= 1000) {
    return `${(ethValue / 1000).toFixed(2)}k`;
  }
  if (ethValue >= 1) {
    return ethValue.toFixed(2);
  }
  if (ethValue >= 0.001) {
    return ethValue.toFixed(4);
  }
  return '0';
}

/**
 * Hook to fetch founder panel stats
 *
 * @param founderName - The founder's name (e.g., "Joseph Lubin")
 * @returns Stats for the left panel display
 *
 * @example
 * ```tsx
 * const { stats, loading } = useFounderPanelStats('Joseph Lubin');
 *
 * // Display:
 * // Total Market Cap: 1.23k TRUST
 * // Total Holders: 42 voters
 * // Claims: 5
 * ```
 */
export function useFounderPanelStats(founderName: string): UseFounderPanelStatsReturn {
  const { data, loading, error, refetch } = useQuery<GetFounderPanelStatsResult>(
    GET_FOUNDER_PANEL_STATS,
    {
      variables: { founderName },
      skip: !founderName,
      fetchPolicy: 'cache-and-network',
    }
  );

  // Calculate Total Market Cap = Σ(FOR + AGAINST)
  let totalMarketCap = 0n;
  if (data?.triples) {
    for (const triple of data.triples) {
      // FOR votes (triple_vault)
      if (triple.triple_vault?.total_assets) {
        totalMarketCap += BigInt(triple.triple_vault.total_assets);
      }
      // AGAINST votes (counter_term)
      if (triple.counter_term?.total_assets) {
        totalMarketCap += BigInt(triple.counter_term.total_assets);
      }
    }
  }

  // Calculate Total Holders = count distinct sender_id
  const uniqueHolders = new Set<string>();
  if (data?.deposits) {
    for (const deposit of data.deposits) {
      uniqueHolders.add(deposit.sender_id);
    }
  }

  // Claims = number of distinct triples
  const claims = data?.triples?.length || 0;

  const stats: FounderPanelStats = {
    totalMarketCap,
    formattedMarketCap: formatMarketCap(totalMarketCap),
    totalHolders: uniqueHolders.size,
    claims,
  };

  return {
    stats,
    loading,
    error: error as Error | undefined,
    refetch,
  };
}
