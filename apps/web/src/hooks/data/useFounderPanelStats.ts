/**
 * useFounderPanelStats - Hook to fetch stats for the left panel
 *
 * Returns:
 * - Total Market Cap = Σ(FOR + AGAINST) on all founder's triples
 * - Total Holders = count distinct sender_id
 * - Claims = count of distinct triples
 *
 * NOTE: Due to Hasura limitations with nested filters on polymorphic relations,
 * we use two queries: one for triples (to get term_ids) and one for deposits
 * using those term_ids.
 *
 * @see Phase 10 - Etape 6 in TODO_FIX_01_Discussion.md
 */

import { useMemo } from 'react';
import { formatEther } from 'viem';
import { truncateAmount } from '../../utils/formatters';
import { useAllOFCTotems } from './useAllOFCTotems';
import { useFoundersData } from '../../contexts/FoundersDataContext';

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
 * Format large numbers for display (using truncation like INTUITION)
 */
function formatMarketCap(value: bigint): string {
  const ethValue = parseFloat(formatEther(value));
  if (ethValue >= 1000000) {
    return `${truncateAmount(ethValue / 1000000, 2)}M`;
  }
  if (ethValue >= 1000) {
    return `${truncateAmount(ethValue / 1000, 2)}k`;
  }
  if (ethValue >= 1) {
    return truncateAmount(ethValue, 2);
  }
  if (ethValue >= 0.001) {
    return truncateAmount(ethValue, 5);
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
  const { proposalsByFounder, depositsByTermId, loading, error, refetch } = useFoundersData();
  const { categoryMap, loading: categoryLoading } = useAllOFCTotems();

  const stats = useMemo(() => {
    const proposals = proposalsByFounder.get(founderName) ?? [];

    // Filter to OFC totems only
    const ofcTriples = proposals.filter((t) =>
      t.object?.term_id && categoryMap.has(t.object.term_id)
    );

    // Total Market Cap = Σ(FOR + AGAINST)
    let totalMarketCap = 0n;
    const termIds = new Set<string>();

    for (const triple of ofcTriples) {
      if (triple.triple_vault?.total_assets) {
        totalMarketCap += BigInt(triple.triple_vault.total_assets);
      }
      if (triple.counter_term?.total_assets) {
        totalMarketCap += BigInt(triple.counter_term.total_assets);
      }
      termIds.add(triple.term_id);
      if (triple.counter_term?.id) {
        termIds.add(triple.counter_term.id);
      }
    }

    // Total Holders = count distinct sender_id from deposits
    const uniqueHolders = new Set<string>();
    termIds.forEach((id) => {
      const deposits = depositsByTermId.get(id);
      if (deposits) {
        deposits.forEach((d) => uniqueHolders.add(d.sender_id.toLowerCase()));
      }
    });

    return {
      totalMarketCap,
      formattedMarketCap: formatMarketCap(totalMarketCap),
      totalHolders: uniqueHolders.size,
      claims: ofcTriples.length,
    } as FounderPanelStats;
  }, [proposalsByFounder, depositsByTermId, founderName, categoryMap]);

  return useMemo(() => ({
    stats,
    loading: loading || categoryLoading,
    error: error as Error | undefined,
    refetch,
  }), [stats, loading, categoryLoading, error, refetch]);
}
