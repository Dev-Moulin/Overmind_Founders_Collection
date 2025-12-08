/**
 * useVotesTimeline - Hook for fetching vote timeline data for TradingChart
 *
 * Transforms founder deposits into time-series data for visualization
 * Supports multiple timeframes: 12H, 24H, 7D, All
 *
 * Uses two-query approach because Hasura doesn't support filtering deposits
 * by term.subject directly. We:
 * 1. Get all term_ids for founder's triples
 * 2. Get deposits for those term_ids
 *
 * @see Phase 10 in TODO_FIX_01_Discussion.md
 */

import { useMemo } from 'react';
import { useQuery } from '@apollo/client';
import { formatEther } from 'viem';
import {
  GET_FOUNDER_TRIPLES_WITH_DETAILS,
  GET_DEPOSITS_FOR_TIMELINE,
} from '../../lib/graphql/queries';
import type { Timeframe, VoteDataPoint } from '../../components/graph/TradingChart';

/**
 * Triple info from query
 */
interface TripleInfo {
  term_id: string;
  subject: { term_id: string; label: string };
  predicate: { term_id: string; label: string };
  object: { term_id: string; label: string };
}

/**
 * Raw deposit data from GraphQL
 */
interface RawDeposit {
  id: string;
  sender_id: string;
  term_id: string;
  vault_type: string;
  shares: string;
  assets_after_fees: string;
  created_at: string;
  transaction_hash: string;
}

/**
 * Hook result
 */
export interface UseVotesTimelineResult {
  /** Aggregated data points for chart */
  data: VoteDataPoint[];
  /** Loading state */
  loading: boolean;
  /** Error state */
  error: Error | null;
  /** Refetch data */
  refetch: () => void;
  /** Summary stats */
  stats: {
    totalFor: string;
    totalAgainst: string;
    netVotes: string;
    voteCount: number;
  };
}

/**
 * Get timeframe duration in milliseconds
 */
function getTimeframeDuration(timeframe: Timeframe): number {
  switch (timeframe) {
    case '12H':
      return 12 * 60 * 60 * 1000;
    case '24H':
      return 24 * 60 * 60 * 1000;
    case '7D':
      return 7 * 24 * 60 * 60 * 1000;
    case 'All':
      return Number.MAX_SAFE_INTEGER;
    default:
      return 24 * 60 * 60 * 1000;
  }
}

/**
 * Get number of buckets for the timeframe
 */
function getBucketCount(timeframe: Timeframe): number {
  switch (timeframe) {
    case '12H':
      return 12; // 1 bucket per hour
    case '24H':
      return 24; // 1 bucket per hour
    case '7D':
      return 14; // 2 buckets per day
    case 'All':
      return 30; // 30 buckets for all time
    default:
      return 24;
  }
}

/**
 * Format date for display
 */
function formatDate(timestamp: number, timeframe: Timeframe): string {
  const date = new Date(timestamp);

  switch (timeframe) {
    case '12H':
    case '24H':
      return date.toLocaleTimeString('fr-FR', {
        hour: '2-digit',
        minute: '2-digit',
      });
    case '7D':
      return date.toLocaleDateString('fr-FR', {
        weekday: 'short',
        day: 'numeric',
      });
    case 'All':
      return date.toLocaleDateString('fr-FR', {
        month: 'short',
        day: 'numeric',
      });
    default:
      return date.toLocaleDateString('fr-FR');
  }
}

/**
 * Hook to fetch and transform vote timeline data
 *
 * @param founderName - Name of the founder to fetch data for
 * @param timeframe - Selected timeframe (12H, 24H, 7D, All)
 * @param selectedTotemId - Optional totem object ID to filter data (the object.term_id of the triple)
 * @returns Timeline data for TradingChart
 */
export function useVotesTimeline(
  founderName: string,
  timeframe: Timeframe = '24H',
  selectedTotemId?: string
): UseVotesTimelineResult {
  // Fetch more data for All timeframe
  const limit = timeframe === 'All' ? 500 : 100;

  // Query 1: Get founder's triples to get term_ids
  const {
    data: triplesData,
    loading: triplesLoading,
    error: triplesError,
  } = useQuery<{ triples: TripleInfo[] }>(GET_FOUNDER_TRIPLES_WITH_DETAILS, {
    variables: { founderName },
    skip: !founderName,
    fetchPolicy: 'cache-and-network',
  });

  // Extract term_ids from triples
  const termIds = useMemo(() => {
    if (!triplesData?.triples) return [];
    return triplesData.triples.map((t) => t.term_id);
  }, [triplesData?.triples]);

  // Create a map from triple term_id to object term_id (totem ID)
  // This allows filtering deposits by selected totem
  const tripleToObjectMap = useMemo(() => {
    const map = new Map<string, string>();
    if (triplesData?.triples) {
      for (const triple of triplesData.triples) {
        map.set(triple.term_id, triple.object.term_id);
      }
    }
    return map;
  }, [triplesData?.triples]);

  // Query 2: Get deposits for those term_ids
  const {
    data: depositsData,
    loading: depositsLoading,
    error: depositsError,
    refetch: refetchDeposits,
  } = useQuery<{ deposits: RawDeposit[] }>(GET_DEPOSITS_FOR_TIMELINE, {
    variables: { termIds, limit },
    skip: termIds.length === 0,
    fetchPolicy: 'cache-and-network',
  });

  // Process and aggregate data
  const { chartData, stats } = useMemo(() => {
    if (!depositsData?.deposits || depositsData.deposits.length === 0) {
      return {
        chartData: [],
        stats: {
          totalFor: '0',
          totalAgainst: '0',
          netVotes: '0',
          voteCount: 0,
        },
      };
    }

    const now = Date.now();
    const duration = getTimeframeDuration(timeframe);
    const bucketCount = getBucketCount(timeframe);
    const cutoff = now - duration;

    // Filter by timeframe and optionally by selected totem
    // Note: We filter by totem using tripleToObjectMap to match deposit.term_id to object.term_id
    let filteredDeposits = depositsData.deposits.filter((d) => {
      const timestamp = new Date(d.created_at).getTime();
      if (timeframe !== 'All' && timestamp < cutoff) return false;
      // Filter by selected totem: check if the triple's object matches selectedTotemId
      if (selectedTotemId) {
        const objectId = tripleToObjectMap.get(d.term_id);
        if (objectId !== selectedTotemId) return false;
      }
      return true;
    });

    // Sort by time ascending
    filteredDeposits = filteredDeposits.sort(
      (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );

    if (filteredDeposits.length === 0) {
      return {
        chartData: [],
        stats: {
          totalFor: '0',
          totalAgainst: '0',
          netVotes: '0',
          voteCount: 0,
        },
      };
    }

    // Calculate total stats
    let totalFor = 0n;
    let totalAgainst = 0n;

    for (const deposit of filteredDeposits) {
      const amount = BigInt(deposit.assets_after_fees);
      if (deposit.vault_type === 'triple_positive') {
        totalFor += amount;
      } else {
        totalAgainst += amount;
      }
    }

    // Determine time range
    const minTime =
      timeframe === 'All'
        ? new Date(filteredDeposits[0].created_at).getTime()
        : cutoff;
    const maxTime = now;
    const bucketSize = (maxTime - minTime) / bucketCount;

    // Create buckets
    const buckets: Map<
      number,
      { forVotes: bigint; againstVotes: bigint }
    > = new Map();

    for (let i = 0; i < bucketCount; i++) {
      const bucketTime = minTime + i * bucketSize;
      buckets.set(bucketTime, { forVotes: 0n, againstVotes: 0n });
    }

    // Aggregate deposits into buckets (cumulative)
    let runningFor = 0n;
    let runningAgainst = 0n;

    for (const deposit of filteredDeposits) {
      const timestamp = new Date(deposit.created_at).getTime();
      const amount = BigInt(deposit.assets_after_fees);

      if (deposit.vault_type === 'triple_positive') {
        runningFor += amount;
      } else {
        runningAgainst += amount;
      }

      // Find the bucket this deposit belongs to
      const bucketIndex = Math.min(
        Math.floor((timestamp - minTime) / bucketSize),
        bucketCount - 1
      );
      const bucketTime = minTime + bucketIndex * bucketSize;

      // Update this bucket and all following buckets with cumulative values
      for (const [time, bucket] of buckets) {
        if (time >= bucketTime) {
          bucket.forVotes = runningFor;
          bucket.againstVotes = runningAgainst;
        }
      }
    }

    // Convert buckets to chart data
    const chartData: VoteDataPoint[] = Array.from(buckets.entries()).map(
      ([timestamp, bucket]) => ({
        timestamp,
        date: formatDate(timestamp, timeframe),
        forVotes: parseFloat(formatEther(bucket.forVotes)),
        againstVotes: parseFloat(formatEther(bucket.againstVotes)),
        netVotes: parseFloat(formatEther(bucket.forVotes - bucket.againstVotes)),
      })
    );

    return {
      chartData,
      stats: {
        totalFor: parseFloat(formatEther(totalFor)).toFixed(4),
        totalAgainst: parseFloat(formatEther(totalAgainst)).toFixed(4),
        netVotes: parseFloat(formatEther(totalFor - totalAgainst)).toFixed(4),
        voteCount: filteredDeposits.length,
      },
    };
  }, [depositsData, timeframe, selectedTotemId, tripleToObjectMap]);

  // Combined loading and error states
  const loading = triplesLoading || depositsLoading;
  const error = triplesError || depositsError;

  return {
    data: chartData,
    loading,
    error: error ? new Error(error.message) : null,
    refetch: refetchDeposits,
    stats,
  };
}
