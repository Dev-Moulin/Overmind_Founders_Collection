import { useQuery } from '@apollo/client';
import { formatEther } from 'viem';
import {
  GET_TRIPLE_VOTES,
  GET_RECENT_VOTES,
  GET_VOTE_STATS,
  GET_TOP_VOTERS,
} from '../lib/graphql/queries';
import type {
  GetTripleVotesResult,
  GetRecentVotesResult,
  GetVoteStatsResult,
  GetTopVotersResult,
  AggregatedVoter,
  VoteStats,
} from '../lib/graphql/types';

/**
 * Hook to fetch all votes on a specific triple (proposal)
 *
 * @param termId - The term_id of the triple
 * @returns Votes on this triple with FOR/AGAINST separation
 *
 * @example
 * ```tsx
 * const { votes, forVotes, againstVotes, uniqueVoters } = useTripleVotes('0xterm...');
 * ```
 */
export function useTripleVotes(termId: string | undefined) {
  const { data, loading, error, refetch } = useQuery<GetTripleVotesResult>(
    GET_TRIPLE_VOTES,
    {
      variables: { termId },
      skip: !termId,
    }
  );

  const votes = data?.deposits || [];
  const forVotes = votes.filter((v) => v.vault_type === 'triple_positive');
  const againstVotes = votes.filter((v) => v.vault_type === 'triple_negative');

  // Calculate totals
  const totalFor = forVotes.reduce(
    (sum, v) => sum + BigInt(v.assets_after_fees),
    0n
  );
  const totalAgainst = againstVotes.reduce(
    (sum, v) => sum + BigInt(v.assets_after_fees),
    0n
  );

  // Get unique voters
  const uniqueVoterAddresses = new Set(votes.map((v) => v.sender_id));

  return {
    votes,
    forVotes,
    againstVotes,
    totalFor: totalFor.toString(),
    totalAgainst: totalAgainst.toString(),
    formattedFor: formatEther(totalFor),
    formattedAgainst: formatEther(totalAgainst),
    uniqueVoters: uniqueVoterAddresses.size,
    loading,
    error,
    refetch,
  };
}

/**
 * Hook to fetch recent votes across all proposals
 *
 * @param limit - Maximum number of votes to fetch (default: 20)
 * @returns Recent votes for activity feed
 *
 * @example
 * ```tsx
 * const { recentVotes, loading } = useRecentVotes(10);
 * ```
 */
export function useRecentVotes(limit: number = 20) {
  const { data, loading, error, refetch } = useQuery<GetRecentVotesResult>(
    GET_RECENT_VOTES,
    {
      variables: { limit },
      pollInterval: 30000, // Poll every 30 seconds for near real-time updates
    }
  );

  const recentVotes =
    data?.deposits.map((deposit) => ({
      ...deposit,
      isPositive: deposit.vault_type === 'triple_positive',
      formattedAmount: formatEther(BigInt(deposit.assets_after_fees)),
    })) || [];

  return {
    recentVotes,
    loading,
    error,
    refetch,
  };
}

/**
 * Hook to fetch global vote statistics
 *
 * @returns Platform-wide vote stats
 *
 * @example
 * ```tsx
 * const { stats, loading } = useVoteStats();
 * console.log(stats.totalVotes, stats.uniqueVoters);
 * ```
 */
export function useGlobalVoteStats() {
  const { data, loading, error, refetch } = useQuery<GetVoteStatsResult>(
    GET_VOTE_STATS
  );

  let stats: VoteStats = {
    totalVotes: 0,
    totalTrustDeposited: '0',
    uniqueVoters: 0,
    averageVoteAmount: '0',
    formattedTotal: '0',
    formattedAverage: '0',
  };

  if (data?.deposits_aggregate) {
    const { aggregate, nodes } = data.deposits_aggregate;
    const totalVotes = aggregate.count;
    const totalTrust = aggregate.sum?.assets_after_fees || '0';
    const uniqueVoters = new Set(nodes.map((n) => n.sender_id)).size;

    const totalBigInt = BigInt(totalTrust);
    const averageBigInt = totalVotes > 0 ? totalBigInt / BigInt(totalVotes) : 0n;

    stats = {
      totalVotes,
      totalTrustDeposited: totalTrust,
      uniqueVoters,
      averageVoteAmount: averageBigInt.toString(),
      formattedTotal: formatEther(totalBigInt),
      formattedAverage: formatEther(averageBigInt),
    };
  }

  return {
    stats,
    loading,
    error,
    refetch,
  };
}

/**
 * Hook to fetch top voters leaderboard
 *
 * @param limit - Maximum number of voters to fetch (default: 10)
 * @returns Aggregated top voters with total amounts
 *
 * @example
 * ```tsx
 * const { topVoters, loading } = useTopVoters(5);
 * ```
 */
export function useTopVoters(limit: number = 10) {
  const { data, loading, error, refetch } = useQuery<GetTopVotersResult>(
    GET_TOP_VOTERS,
    {
      variables: { limit: limit * 3 }, // Fetch more to aggregate properly
    }
  );

  // Aggregate by sender address
  const voterMap = new Map<string, { total: bigint; count: number }>();

  data?.deposits.forEach((deposit) => {
    const current = voterMap.get(deposit.sender_id) || { total: 0n, count: 0 };
    voterMap.set(deposit.sender_id, {
      total: current.total + BigInt(deposit.assets_after_fees),
      count: current.count + 1,
    });
  });

  // Convert to array and sort
  const topVoters: AggregatedVoter[] = Array.from(voterMap.entries())
    .map(([address, { total, count }]) => ({
      address,
      totalVoted: total.toString(),
      voteCount: count,
      formattedTotal: formatEther(total),
    }))
    .sort((a, b) => {
      const diff = BigInt(b.totalVoted) - BigInt(a.totalVoted);
      return diff > 0n ? 1 : diff < 0n ? -1 : 0;
    })
    .slice(0, limit);

  return {
    topVoters,
    loading,
    error,
    refetch,
  };
}
