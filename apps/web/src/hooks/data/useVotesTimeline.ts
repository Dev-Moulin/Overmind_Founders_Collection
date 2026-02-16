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
import { formatEther } from 'viem';
import type { Timeframe, VoteDataPoint } from '../../components/graph/TradingChart';
import { filterValidTriples, type RawTriple } from '../../utils/tripleGuards';
import { truncateAmount } from '../../utils/formatters';
import { useFoundersData } from '../../contexts/FoundersDataContext';

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
  const { proposalsByFounder, depositsByTermId, loading: contextLoading, error: contextError, refetch } = useFoundersData();

  // Fetch more data for All timeframe
  const limit = timeframe === 'All' ? 500 : 100;

  // Get triples from Context instead of query
  const validTriples = useMemo(() => {
    const proposals = proposalsByFounder.get(founderName) ?? [];
    return filterValidTriples(proposals as RawTriple[], 'useVotesTimeline');
  }, [proposalsByFounder, founderName]);

  // Create a map: termId/counterTermId -> { objectId, isFor, totemLabel }
  const termToInfoMap = useMemo(() => {
    const map = new Map<string, { objectId: string; isFor: boolean; totemLabel: string }>();
    for (const triple of validTriples) {
      const objectId = triple.object.term_id;
      const totemLabel = triple.object.label;
      map.set(triple.term_id, { objectId, isFor: true, totemLabel });
      const counterTermId = (triple as TripleInfo).counter_term_id || triple.counter_term?.id;
      if (counterTermId) {
        map.set(counterTermId, { objectId, isFor: false, totemLabel });
      }
    }
    return map;
  }, [validTriples]);

  // Get deposits from Context instead of query, apply sort + limit client-side
  const allDeposits = useMemo((): RawDeposit[] => {
    const termIds = [...termToInfoMap.keys()];
    const rawDeposits: RawDeposit[] = termIds.flatMap((id) => {
      const deps = depositsByTermId.get(id);
      if (!deps) return [];
      return deps.map((d) => ({
        id: d.id,
        sender_id: d.sender_id,
        term_id: d.term_id,
        vault_type: d.vault_type,
        shares: d.shares,
        assets_after_fees: d.assets_after_fees,
        created_at: d.created_at,
        transaction_hash: d.transaction_hash,
        curve_id: d.curve_id,
      }));
    });
    // Sort by created_at DESC + limit (matches original query behavior)
    return rawDeposits
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, limit);
  }, [termToInfoMap, depositsByTermId, limit]);

  // Helper function to check if deposit matches curve filter
  const matchesCurveFilter = (deposit: RawDeposit): boolean => {
    if (curveFilter === 'all') return true;
    const depositCurveId = deposit.curve_id || '1';
    if (curveFilter === 'progressive') return depositCurveId === '2';
    if (curveFilter === 'linear') return depositCurveId === '1';
    return true;
  };

  // Get deposits filtered only by totem and curve (not by timeframe) to check data availability
  const totemDeposits = useMemo(() => {
    return allDeposits.filter((d) => {
      if (!matchesCurveFilter(d)) return false;
      const termInfo = termToInfoMap.get(d.term_id);
      if (!termInfo) return false;
      if (selectedTotemId) {
        if (termInfo.objectId !== selectedTotemId) return false;
      }
      return true;
    });
  }, [allDeposits, selectedTotemId, termToInfoMap, curveFilter]);

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

    const timeframes: Timeframe[] = ['12H', '24H', '7D', 'All'];

    for (const tf of timeframes) {
      const duration = getTimeframeDuration(tf);
      if (dataAge <= duration) {
        if (tf !== timeframe) {
          return tf;
        }
        return null;
      }
    }

    return timeframe !== 'All' ? 'All' : null;
  }, [hasAnyData, totemDeposits, timeframe]);

  // Process and aggregate data
  const { chartData, stats } = useMemo(() => {
    if (allDeposits.length === 0) {
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
    let filteredDeposits = allDeposits.filter((d: RawDeposit) => {
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
  }, [allDeposits, timeframe, selectedTotemId, termToInfoMap, curveFilter]);

  // Recent votes for activity feed (5 most recent, all curves, no timeframe filter)
  const recentVotes = useMemo((): RecentVote[] => {
    // allDeposits is already sorted by created_at DESC
    return allDeposits
      .map((deposit: RawDeposit) => {
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
  }, [allDeposits, termToInfoMap]);

  // Memoize error object to prevent unnecessary re-renders
  const errorObj = useMemo(() => contextError ? new Error(contextError.message) : null, [contextError]);

  // Memoize return value to prevent unnecessary re-renders
  return useMemo(() => ({
    data: chartData,
    loading: contextLoading,
    error: errorObj,
    refetch,
    stats,
    suggestedTimeframe,
    hasAnyData,
    recentVotes,
  }), [chartData, contextLoading, errorObj, refetch, stats, suggestedTimeframe, hasAnyData, recentVotes]);
}
