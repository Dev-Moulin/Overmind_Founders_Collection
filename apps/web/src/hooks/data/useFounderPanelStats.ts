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

import { useMemo, useEffect } from 'react';
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

  // Extract term_ids from triples for the deposits query
  const termIds = useMemo(() => {
    if (!triplesData?.triples) return [];
    return triplesData.triples.map((t) => t.term_id);
  }, [triplesData?.triples]);

  // Second query: get deposits for those term_ids
  // Note: We need to pass termIds as a stable reference, so we use JSON.stringify
  const termIdsKey = JSON.stringify(termIds);
  const {
    data: depositsData,
    loading: depositsLoading,
    error: depositsError,
    refetch: refetchDeposits,
  } = useQuery<GetDepositsByTermIdsResult>(GET_DEPOSITS_BY_TERM_IDS, {
    variables: { termIds },
    skip: termIds.length === 0,
    fetchPolicy: 'network-only', // Force network fetch to ensure fresh data
  });

  // Force refetch deposits when termIds change
  useEffect(() => {
    if (termIds.length > 0) {
      console.log('[useFounderPanelStats] Refetching deposits for termIds:', termIds);
      refetchDeposits({ termIds }).then((result) => {
        console.log('[useFounderPanelStats] Refetch result:', result);
      }).catch((err) => {
        console.error('[useFounderPanelStats] Refetch error:', err);
      });
    }
  }, [termIdsKey, refetchDeposits]);

  // DEBUG: Log data only when it changes
  useEffect(() => {
    console.log('[useFounderPanelStats] DEBUG:', {
      founderName,
      triplesCount: triplesData?.triples?.length || 0,
      termIds: termIds.slice(0, 3), // Show first 3 term IDs
      termIdsRaw: termIds, // Full array for inspection
      depositsCount: depositsData?.deposits?.length || 0,
      // Show all unique sender_ids to debug wallet matching
      uniqueSenderIds: [...new Set(depositsData?.deposits?.map(d => d.sender_id) || [])],
      triplesLoading,
      depositsLoading,
      depositsSkipped: termIds.length === 0,
      triplesError: triplesError?.message,
      depositsError: depositsError?.message,
    });
  }, [triplesData, depositsData, termIds, founderName, triplesLoading, depositsLoading, triplesError, depositsError]);

  // Calculate Total Market Cap = Σ(FOR + AGAINST)
  let totalMarketCap = 0n;
  if (triplesData?.triples) {
    for (const triple of triplesData.triples) {
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
  if (depositsData?.deposits) {
    for (const deposit of depositsData.deposits) {
      uniqueHolders.add(deposit.sender_id.toLowerCase());
    }
  }

  // Claims = number of distinct triples
  const claims = triplesData?.triples?.length || 0;

  const stats: FounderPanelStats = {
    totalMarketCap,
    formattedMarketCap: formatMarketCap(totalMarketCap),
    totalHolders: uniqueHolders.size,
    claims,
  };

  // Combined loading state
  const loading = triplesLoading || (termIds.length > 0 && depositsLoading);

  // Combined error (return first error encountered)
  const error = triplesError || depositsError;

  // Combined refetch function
  const refetch = () => {
    refetchTriples();
    if (termIds.length > 0) {
      refetchDeposits();
    }
  };

  return {
    stats,
    loading,
    error: error as Error | undefined,
    refetch,
  };
}
