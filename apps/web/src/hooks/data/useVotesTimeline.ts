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
import { filterValidTriples, type RawTriple } from '../../utils/tripleGuards';
import { truncateAmount } from '../../utils/formatters';

/**
 * Triple info from query (may have null fields due to data integrity issues)
 */
interface TripleInfo extends Omit<RawTriple, 'counter_term'> {
  term_id: string;
  /** Direct counter_term_id field from GraphQL (for AGAINST votes) */
  counter_term_id?: string | null;
  counter_term?: { id: string; total_assets?: string } | null;
  subject: { term_id: string; label: string } | null;
  predicate: { term_id: string; label: string } | null;
  object: { term_id: string; label: string } | null;
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
  curve_id?: string;
}

/**
 * Curve filter options for TradingChart
 * - 'progressive': Only show Progressive curve deposits (curveId=2)
 * - 'linear': Only show Linear curve deposits (curveId=1)
 * - 'all': Show all deposits (both curves combined)
 */
export type CurveFilter = 'progressive' | 'linear' | 'all';

/**
 * Recent vote with FOR/AGAINST info for activity feed
 */
export interface RecentVote {
  id: string;
  sender_id: string;
  assets_after_fees: string;
  created_at: string;
  /** Whether this is a FOR vote (true) or AGAINST vote (false) */
  isFor: boolean;
  /** The totem label */
  totemLabel: string;
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
  /** Suggested timeframe if current one has no data but others do */
  suggestedTimeframe: Timeframe | null;
  /** Whether data exists at all for this totem */
  hasAnyData: boolean;
  /** Recent votes for activity feed (5 most recent, all curves) */
  recentVotes: RecentVote[];
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
 * @param curveFilter - Filter by curve type: 'progressive' (default), 'linear', or 'all'
 * @returns Timeline data for TradingChart
 */
export function useVotesTimeline(
  founderName: string,
  timeframe: Timeframe = '24H',
  selectedTotemId?: string,
  curveFilter: CurveFilter = 'progressive'
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

  // Filter valid triples first (removes those with null object/subject/predicate)
  const validTriples = useMemo(() => {
    if (!triplesData?.triples) return [];
    return filterValidTriples(triplesData.triples as RawTriple[], 'useVotesTimeline');
  }, [triplesData?.triples]);

  // Extract term_ids AND counter_term_ids from valid triples
  // We need BOTH to properly track FOR (term_id) and AGAINST (counter_term_id) votes
  const termIds = useMemo(() => {
    const ids: string[] = [];
    validTriples.forEach((t) => {
      ids.push(t.term_id);
      // Use counter_term_id (direct field from GraphQL) or counter_term?.id (nested object)
      const counterTermId = (t as TripleInfo).counter_term_id || t.counter_term?.id;
      if (counterTermId) {
        ids.push(counterTermId);
      }
    });
    return ids;
  }, [validTriples]);

  // Create a map: termId/counterTermId -> { objectId, isFor, totemLabel }
  // This allows:
  // 1. Filtering deposits by selected totem (using objectId)
  // 2. Determining if a deposit is FOR or AGAINST (using isFor)
  // 3. Getting totem label for activity feed (using totemLabel)
  const termToInfoMap = useMemo(() => {
    const map = new Map<string, { objectId: string; isFor: boolean; totemLabel: string }>();
    for (const triple of validTriples) {
      // triple.object is guaranteed non-null by filterValidTriples
      const objectId = triple.object.term_id;
      const totemLabel = triple.object.label;
      // Deposit on term_id = FOR vote
      map.set(triple.term_id, { objectId, isFor: true, totemLabel });
      // Deposit on counter_term_id = AGAINST vote
      // Use counter_term_id (direct field from GraphQL) or counter_term?.id (nested object)
      const counterTermId = (triple as TripleInfo).counter_term_id || triple.counter_term?.id;
      if (counterTermId) {
        map.set(counterTermId, { objectId, isFor: false, totemLabel });
      }
    }
    return map;
  }, [validTriples]);

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

  // Helper function to check if deposit matches curve filter
  const matchesCurveFilter = (deposit: RawDeposit): boolean => {
    if (curveFilter === 'all') return true;
    const depositCurveId = deposit.curve_id || '1'; // Default to Linear if not specified
    if (curveFilter === 'progressive') return depositCurveId === '2';
    if (curveFilter === 'linear') return depositCurveId === '1';
    return true;
  };

  // Get deposits filtered only by totem and curve (not by timeframe) to check data availability
  const totemDeposits = useMemo(() => {
    if (!depositsData?.deposits) return [];

    return depositsData.deposits.filter((d) => {
      // Filter by curve
      if (!matchesCurveFilter(d)) return false;
      // Get term info (objectId and isFor)
      const termInfo = termToInfoMap.get(d.term_id);
      if (!termInfo) return false; // Unknown deposit
      // Filter by totem if specified
      if (selectedTotemId) {
        if (termInfo.objectId !== selectedTotemId) return false;
      }
      return true;
    });
  }, [depositsData?.deposits, selectedTotemId, termToInfoMap, curveFilter]);

  // Check if data exists at all for this totem
  const hasAnyData = totemDeposits.length > 0;

  // Find the best timeframe that has data (for suggestion)
  const suggestedTimeframe = useMemo((): Timeframe | null => {
    if (!hasAnyData) return null;

    const now = Date.now();
    const oldestDepositTime = Math.min(
      ...totemDeposits.map((d) => new Date(d.created_at).getTime())
    );
    const dataAge = now - oldestDepositTime;

    // Check which timeframes would show data
    const timeframes: Timeframe[] = ['12H', '24H', '7D', 'All'];

    for (const tf of timeframes) {
      const duration = getTimeframeDuration(tf);
      // If data age is within this timeframe, it would show data
      if (dataAge <= duration) {
        // Only suggest if it's different from current timeframe
        if (tf !== timeframe) {
          return tf;
        }
        return null; // Current timeframe is good
      }
    }

    // Data is older than 7D, suggest "All"
    return timeframe !== 'All' ? 'All' : null;
  }, [hasAnyData, totemDeposits, timeframe]);

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

    // Filter by timeframe, curve, and optionally by selected totem
    // Note: We use termToInfoMap to:
    // 1. Match deposit.term_id to object.term_id (totem)
    // 2. Determine if deposit is FOR (term_id) or AGAINST (counter_term_id)
    let filteredDeposits = depositsData.deposits.filter((d) => {
      const timestamp = new Date(d.created_at).getTime();
      if (timeframe !== 'All' && timestamp < cutoff) return false;
      // Filter by curve type
      if (curveFilter !== 'all') {
        const depositCurveId = d.curve_id || '1';
        if (curveFilter === 'progressive' && depositCurveId !== '2') return false;
        if (curveFilter === 'linear' && depositCurveId !== '1') return false;
      }
      // Get term info - if not found, skip this deposit
      const termInfo = termToInfoMap.get(d.term_id);
      if (!termInfo) return false;
      // Filter by selected totem: check if the triple's object matches selectedTotemId
      if (selectedTotemId) {
        if (termInfo.objectId !== selectedTotemId) return false;
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

    // Calculate total stats using isFor from termToInfoMap
    let totalFor = 0n;
    let totalAgainst = 0n;

    for (const deposit of filteredDeposits) {
      const amount = BigInt(deposit.assets_after_fees);
      const termInfo = termToInfoMap.get(deposit.term_id);
      // termInfo is guaranteed to exist because we filtered in filteredDeposits
      if (termInfo?.isFor) {
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

    // Aggregate deposits into buckets (cumulative) using isFor from termToInfoMap
    let runningFor = 0n;
    let runningAgainst = 0n;

    for (const deposit of filteredDeposits) {
      const timestamp = new Date(deposit.created_at).getTime();
      const amount = BigInt(deposit.assets_after_fees);
      const termInfo = termToInfoMap.get(deposit.term_id);

      if (termInfo?.isFor) {
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
        totalFor: truncateAmount(parseFloat(formatEther(totalFor))),
        totalAgainst: truncateAmount(parseFloat(formatEther(totalAgainst))),
        netVotes: truncateAmount(parseFloat(formatEther(totalFor - totalAgainst))),
        voteCount: filteredDeposits.length,
      },
    };
  }, [depositsData, timeframe, selectedTotemId, termToInfoMap, curveFilter]);

  // Recent votes for activity feed (5 most recent, all curves, no timeframe filter)
  const recentVotes = useMemo((): RecentVote[] => {
    if (!depositsData?.deposits) return [];

    // Get deposits sorted by date desc, enrich with isFor and totemLabel
    return depositsData.deposits
      .map((deposit) => {
        const termInfo = termToInfoMap.get(deposit.term_id);
        if (!termInfo) return null;
        return {
          id: deposit.id,
          sender_id: deposit.sender_id,
          assets_after_fees: deposit.assets_after_fees,
          created_at: deposit.created_at,
          isFor: termInfo.isFor,
          totemLabel: termInfo.totemLabel,
        };
      })
      .filter((v): v is RecentVote => v !== null)
      .slice(0, 5);
  }, [depositsData?.deposits, termToInfoMap]);

  // Combined loading and error states
  const loading = triplesLoading || depositsLoading;
  const error = triplesError || depositsError;

  // Memoize error object to prevent unnecessary re-renders
  const errorObj = useMemo(() => error ? new Error(error.message) : null, [error]);

  // Memoize return value to prevent unnecessary re-renders
  return useMemo(() => ({
    data: chartData,
    loading,
    error: errorObj,
    refetch: refetchDeposits,
    stats,
    suggestedTimeframe,
    hasAnyData,
    recentVotes,
  }), [chartData, loading, errorObj, refetchDeposits, stats, suggestedTimeframe, hasAnyData, recentVotes]);
}
