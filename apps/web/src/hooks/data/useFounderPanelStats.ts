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

import { useMemo, useCallback } from 'react';
import { useQuery } from '@apollo/client';
import { formatEther } from 'viem';
import {
  GET_FOUNDER_PANEL_STATS,
  GET_DEPOSITS_BY_TERM_IDS,
} from '../../lib/graphql/queries';
import type {
  GetFounderPanelStatsResult,
  GetDepositsByTermIdsResult,
} from '../../lib/graphql/types';
import { truncateAmount } from '../../utils/formatters';
import { useAllOFCTotems } from './useAllOFCTotems';

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
  // Get OFC category map for filtering
  const { categoryMap, loading: categoryLoading } = useAllOFCTotems();

  // First query: get triples for this founder
  const {
    data: triplesData,
    loading: triplesLoading,
    error: triplesError,
    refetch: refetchTriples,
  } = useQuery<GetFounderPanelStatsResult>(GET_FOUNDER_PANEL_STATS, {
    variables: { founderName },
    skip: !founderName,
    fetchPolicy: 'cache-and-network',
  });

  // Filter triples to only include OFC totems
  const filteredTriples = useMemo(() => {
    if (!triplesData?.triples) return [];
    return triplesData.triples.filter((t) => {
      // Only keep triples where the totem (object) has an OFC category
      return t.object?.term_id && categoryMap.has(t.object.term_id);
    });
  }, [triplesData?.triples, categoryMap]);

  // Extract term_ids from filtered triples for the deposits query
  // Include both term_id (FOR) and counter_term.id (AGAINST)
  const termIds = useMemo(() => {
    const ids: string[] = [];
    filteredTriples.forEach((t) => {
      ids.push(t.term_id);
      if (t.counter_term?.id) {
        ids.push(t.counter_term.id);
      }
    });
    return ids;
  }, [filteredTriples]);

  // Second query: get deposits for those term_ids
  // Apollo automatically refetches when termIds changes (via variables)
  const {
    data: depositsData,
    loading: depositsLoading,
    error: depositsError,
    refetch: refetchDeposits,
  } = useQuery<GetDepositsByTermIdsResult>(GET_DEPOSITS_BY_TERM_IDS, {
    variables: { termIds },
    skip: termIds.length === 0,
    fetchPolicy: 'cache-and-network',
  });

  // Calculate Total Market Cap = Σ(FOR + AGAINST) on filtered OFC triples
  let totalMarketCap = 0n;
  for (const triple of filteredTriples) {
    // FOR votes (triple_vault)
    if (triple.triple_vault?.total_assets) {
      totalMarketCap += BigInt(triple.triple_vault.total_assets);
    }
    // AGAINST votes (counter_term)
    if (triple.counter_term?.total_assets) {
      totalMarketCap += BigInt(triple.counter_term.total_assets);
    }
  }

  // Calculate Total Holders = count distinct sender_id
  const uniqueHolders = new Set<string>();
  if (depositsData?.deposits) {
    for (const deposit of depositsData.deposits) {
      uniqueHolders.add(deposit.sender_id.toLowerCase());
    }
  }

  // Claims = number of distinct OFC triples
  const claims = filteredTriples.length;

  const stats: FounderPanelStats = {
    totalMarketCap,
    formattedMarketCap: formatMarketCap(totalMarketCap),
    totalHolders: uniqueHolders.size,
    claims,
  };

  // Combined loading state (includes category loading for OFC filtering)
  const loading = triplesLoading || categoryLoading || (termIds.length > 0 && depositsLoading);

  // Combined error (return first error encountered)
  const error = triplesError || depositsError;

  // Combined refetch function
  // Memoize refetch to prevent unnecessary re-renders
  const refetch = useCallback(() => {
    refetchTriples();
    if (termIds.length > 0) {
      refetchDeposits();
    }
  }, [refetchTriples, refetchDeposits, termIds.length]);

  // Memoize return value to prevent unnecessary re-renders
  return useMemo(() => ({
    stats,
    loading,
    error: error as Error | undefined,
    refetch,
  }), [stats, loading, error, refetch]);
}
