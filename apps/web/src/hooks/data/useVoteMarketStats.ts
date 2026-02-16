/**
 * useVoteMarketStats - Aggregated vote statistics for a founder
 *
 * Hook to fetch and compute vote market statistics:
 * - Total TRUST deposited on founder's triples
 * - Number of unique voters
 * - Number of totems associated
 * - Top totem by TRUST
 * - FOR/AGAINST ratio
 *
 * @see Phase 7 in TODO_Implementation.md
 */

import { useMemo } from 'react';
import { useQuery, gql } from '@apollo/client';
import { formatEther } from 'viem';
import { truncateAmount } from '../../utils/formatters';
import { getCacheFetchPolicy, TWO_MINUTES } from '../../lib/queryCacheTTL';

/**
 * GraphQL query for founder vote market stats
 *
 * Fetches all triples for a founder with their vault data,
 * plus all deposits to count unique voters.
 */
const GET_FOUNDER_VOTE_MARKET = gql`
  query GetFounderVoteMarket($founderName: String!, $predicateLabels: [String!]!) {
    # All triples for this founder
    triples(
      where: {
        subject: { label: { _eq: $founderName } }
        predicate: { label: { _in: $predicateLabels } }
      }
    ) {
      term_id
      object {
        term_id
        label
      }
      triple_vault {
        total_assets
        total_shares
      }
      counter_term {
        id
        total_assets
      }
    }

    # All deposits on this founder's triples (to count unique voters)
    deposits(
      where: {
        term: {
          subject: { label: { _eq: $founderName } }
          predicate: { label: { _in: $predicateLabels } }
        }
        vault_type: { _in: ["Triple", "CounterTriple"] }
      }
    ) {
      sender_id
      vault_type
      assets_after_fees
      term_id
    }
  }
`;

/**
 * Triple data from GraphQL
 */
interface TripleData {
  term_id: string;
  object: {
    term_id: string;
    label: string;
  };
  triple_vault: {
    total_assets: string;
    total_shares: string;
  } | null;
  counter_term: {
    id: string;
    total_assets: string;
  } | null;
}

/**
 * Deposit data from GraphQL
 */
interface DepositData {
  sender_id: string;
  vault_type: 'Triple' | 'CounterTriple';
  assets_after_fees: string;
  term_id: string;
}

/**
 * Vote market statistics result
 */
export interface VoteMarketStats {
  /** Total TRUST deposited FOR across all totems */
  totalTrustFor: bigint;
  /** Total TRUST deposited AGAINST across all totems */
  totalTrustAgainst: bigint;
  /** Total TRUST deposited (FOR + AGAINST) */
  totalTrust: bigint;
  /** Formatted total TRUST for display */
  formattedTotalTrust: string;
  /** Number of unique voters */
  uniqueVoters: number;
  /** Number of totems associated with this founder */
  totemCount: number;
  /** Top totem by total TRUST (FOR + AGAINST) */
  topTotem: {
    label: string;
    termId: string;
    totalTrust: bigint;
    formattedTrust: string;
  } | null;
  /** FOR percentage (0-100) */
  forPercentage: number;
  /** AGAINST percentage (0-100) */
  againstPercentage: number;
  /** List of all totems with their stats */
  totems: Array<{
    termId: string;
    label: string;
    forTrust: bigint;
    againstTrust: bigint;
    totalTrust: bigint;
  }>;
}

/**
 * Hook result
 */
export interface UseVoteMarketStatsResult {
  /** Vote market statistics */
  stats: VoteMarketStats | null;
  /** Loading state */
  loading: boolean;
  /** Error state */
  error: Error | null;
  /** Refetch function */
  refetch: () => void;
}

/**
 * Default predicates to query
 */
const DEFAULT_PREDICATES = ['has totem', 'embodies'];

/**
 * Hook to fetch vote market statistics for a founder
 *
 * @example
 * ```tsx
 * function FounderStats({ founderName }) {
 *   const { stats, loading, error } = useVoteMarketStats(founderName);
 *
 *   if (loading) return <Loading />;
 *   if (error) return <Error message={error.message} />;
 *   if (!stats) return null;
 *
 *   return (
 *     <div>
 *       <p>Total TRUST: {stats.formattedTotalTrust}</p>
 *       <p>Unique voters: {stats.uniqueVoters}</p>
 *       <p>Totems: {stats.totemCount}</p>
 *       <p>FOR: {stats.forPercentage}%</p>
 *       {stats.topTotem && (
 *         <p>Top totem: {stats.topTotem.label}</p>
 *       )}
 *     </div>
 *   );
 * }
 * ```
 */
export function useVoteMarketStats(
  founderName: string | undefined,
  predicateLabels: string[] = DEFAULT_PREDICATES
): UseVoteMarketStatsResult {
  // TTL-based cache policy: only fetch if data is older than 5 minutes
  const fetchPolicy = getCacheFetchPolicy(
    'GetFounderVoteMarket',
    { founderName },
    TWO_MINUTES
  );

  const { data, loading, error, refetch } = useQuery<{
    triples: TripleData[];
    deposits: DepositData[];
  }>(GET_FOUNDER_VOTE_MARKET, {
    variables: { founderName, predicateLabels },
    skip: !founderName,
    // TTL-based: 'cache-first' if fresh, 'cache-and-network' if stale
    fetchPolicy,
    nextFetchPolicy: 'cache-first',
  });

  const stats = useMemo((): VoteMarketStats | null => {
    if (!data?.triples) return null;

    const { triples, deposits } = data;

    // Calculate totals and build totem list
    let totalTrustFor = 0n;
    let totalTrustAgainst = 0n;
    const totems: VoteMarketStats['totems'] = [];

    for (const triple of triples) {
      const forTrust = BigInt(triple.triple_vault?.total_assets || '0');
      const againstTrust = BigInt(triple.counter_term?.total_assets || '0');
      const totalTrust = forTrust + againstTrust;

      totalTrustFor += forTrust;
      totalTrustAgainst += againstTrust;

      totems.push({
        termId: triple.term_id,
        label: triple.object.label,
        forTrust,
        againstTrust,
        totalTrust,
      });
    }

    const totalTrust = totalTrustFor + totalTrustAgainst;

    // Sort totems by total TRUST (descending)
    totems.sort((a, b) => (b.totalTrust > a.totalTrust ? 1 : -1));

    // Top totem
    const topTotem = totems.length > 0
      ? {
          label: totems[0].label,
          termId: totems[0].termId,
          totalTrust: totems[0].totalTrust,
          formattedTrust: truncateAmount(Number(formatEther(totems[0].totalTrust)), 2),
        }
      : null;

    // Count unique voters
    const uniqueVotersSet = new Set<string>();
    for (const deposit of deposits || []) {
      uniqueVotersSet.add(deposit.sender_id.toLowerCase());
    }

    // Calculate percentages
    const forPercentage = totalTrust > 0n
      ? Number((totalTrustFor * 100n) / totalTrust)
      : 0;
    const againstPercentage = 100 - forPercentage;

    return {
      totalTrustFor,
      totalTrustAgainst,
      totalTrust,
      formattedTotalTrust: truncateAmount(Number(formatEther(totalTrust)), 2),
      uniqueVoters: uniqueVotersSet.size,
      totemCount: triples.length,
      topTotem,
      forPercentage,
      againstPercentage,
      totems,
    };
  }, [data]);

  // Memoize error to prevent new reference on each render
  const errorObj = useMemo(() => error || null, [error]);

  // Memoize return value to prevent unnecessary re-renders
  return useMemo(() => ({
    stats,
    loading,
    error: errorObj,
    refetch,
  }), [stats, loading, errorObj, refetch]);
}
