import { useQuery } from '@apollo/client';
import { formatEther } from 'viem';
import { GET_ALL_PROPOSALS, GET_VOTE_STATS } from '../lib/graphql/queries';
import type { Triple, GetVoteStatsResult } from '../lib/graphql/types';
import { aggregateTriplesByObject } from '../utils/aggregateVotes';

/**
 * Most voted totem across all founders
 */
export interface TopTotem {
  totemId: string;
  totemLabel: string;
  totemImage?: string;
  founderName: string;
  netScore: bigint;
  formattedNetScore: string;
  totalFor: bigint;
  totalAgainst: bigint;
  claimCount: number;
}

/**
 * Platform-wide statistics
 */
export interface PlatformStats {
  totalVotes: number;
  totalTrustDeposited: string;
  formattedTotalTrust: string;
  uniqueVoters: number;
  totalFounders: number;
  totalTotems: number;
  foundersWithWinners: number;
  topTotem: TopTotem | null;
}

/**
 * Hook to fetch platform-wide statistics including the most voted totem globally
 *
 * Combines global vote stats with totem aggregation to find the top totem.
 *
 * @example
 * ```tsx
 * function StatsPage() {
 *   const { stats, loading } = usePlatformStats();
 *
 *   if (loading) return <div>Loading...</div>;
 *
 *   return (
 *     <div>
 *       <p>Total votes: {stats.totalVotes}</p>
 *       <p>Total TRUST: {stats.formattedTotalTrust}</p>
 *       {stats.topTotem && (
 *         <p>Top totem: {stats.topTotem.totemLabel} with {stats.topTotem.formattedNetScore} TRUST</p>
 *       )}
 *     </div>
 *   );
 * }
 * ```
 */
export function usePlatformStats() {
  // Fetch global vote stats
  const {
    data: voteStatsData,
    loading: voteStatsLoading,
    error: voteStatsError,
  } = useQuery<GetVoteStatsResult>(GET_VOTE_STATS);

  // Fetch all proposals for totem aggregation
  const {
    data: proposalsData,
    loading: proposalsLoading,
    error: proposalsError,
  } = useQuery(GET_ALL_PROPOSALS, {
    fetchPolicy: 'cache-and-network',
  });

  const loading = voteStatsLoading || proposalsLoading;
  const error = voteStatsError || proposalsError;

  let stats: PlatformStats = {
    totalVotes: 0,
    totalTrustDeposited: '0',
    formattedTotalTrust: '0',
    uniqueVoters: 0,
    totalFounders: 0,
    totalTotems: 0,
    foundersWithWinners: 0,
    topTotem: null,
  };

  if (voteStatsData?.deposits_aggregate && proposalsData?.triples) {
    const { aggregate, nodes } = voteStatsData.deposits_aggregate;
    const totalTrust = aggregate.sum?.assets_after_fees || '0';
    const uniqueVoters = new Set(nodes.map((n) => n.sender_id)).size;

    // Group triples by founder to count founders
    const founderMap = new Map<string, Triple[]>();
    proposalsData.triples.forEach((triple: Triple) => {
      const founderName = triple.subject.label;
      if (!founderMap.has(founderName)) {
        founderMap.set(founderName, []);
      }
      founderMap.get(founderName)!.push(triple);
    });

    // Aggregate all totems globally
    const allAggregatedTotems = aggregateTriplesByObject(proposalsData.triples);

    // Find the top totem globally (highest NET score)
    let topTotem: TopTotem | null = null;
    if (allAggregatedTotems.length > 0) {
      const top = allAggregatedTotems[0];

      // Find which founder this totem belongs to
      const founderTriple = proposalsData.triples.find(
        (t: Triple) => t.object.term_id === top.objectId
      );

      topTotem = {
        totemId: top.objectId,
        totemLabel: top.object.label,
        totemImage: top.object.image,
        founderName: founderTriple?.subject.label || 'Unknown',
        netScore: top.netScore,
        formattedNetScore: formatEther(top.netScore),
        totalFor: top.totalFor,
        totalAgainst: top.totalAgainst,
        claimCount: top.claimCount,
      };
    }

    // Count founders with at least one winning totem
    let foundersWithWinners = 0;
    founderMap.forEach((triples) => {
      const founderTotems = aggregateTriplesByObject(
        triples.map((t) => ({
          term_id: t.term_id,
          predicate: { term_id: t.predicate?.term_id || '', label: t.predicate?.label || '' },
          object: t.object,
          triple_vault: { total_assets: t.triple_vault?.total_assets || '0' },
          counter_term: { id: '', total_assets: t.counter_term?.total_assets || '0' },
        }))
      );
      if (founderTotems.length > 0 && founderTotems[0].netScore > 0n) {
        foundersWithWinners++;
      }
    });

    stats = {
      totalVotes: aggregate.count,
      totalTrustDeposited: totalTrust,
      formattedTotalTrust: formatEther(BigInt(totalTrust)),
      uniqueVoters,
      totalFounders: founderMap.size,
      totalTotems: allAggregatedTotems.length,
      foundersWithWinners,
      topTotem,
    };
  }

  return {
    stats,
    loading,
    error,
  };
}
