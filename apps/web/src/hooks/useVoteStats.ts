import { useQuery } from '@apollo/client';
import { formatEther, parseEther } from 'viem';
import {
  GET_TRIPLE_VOTES,
  GET_RECENT_VOTES,
  // GET_VOTE_STATS,  // COMMENTED - useGlobalVoteStats disabled
  GET_TOP_VOTERS,
  GET_VOTES_TIMELINE,
  GET_VOTES_DISTRIBUTION,
  // GET_FOUNDER_STATS,  // COMMENTED - useFounderStats disabled
} from '../lib/graphql/queries';
import type {
  GetTripleVotesResult,
  GetRecentVotesResult,
  // GetVoteStatsResult,  // COMMENTED - useGlobalVoteStats disabled
  GetTopVotersResult,
  GetVotesTimelineResult,
  GetVotesDistributionResult,
  // GetFounderStatsResult,  // COMMENTED - useFounderStats disabled
  AggregatedVoter,
  // VoteStats,  // COMMENTED - useGlobalVoteStats disabled
  TimelineDataPoint,
  DistributionBucket,
  // FounderStats,  // COMMENTED - useFounderStats disabled
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
 * COMMENTED OUT - NOT USED
 * Doublon avec usePlatformStats qui fait la même chose + plus
 *
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
// export function useGlobalVoteStats() {
//   const { data, loading, error, refetch } = useQuery<GetVoteStatsResult>(
//     GET_VOTE_STATS
//   );
//
//   let stats: VoteStats = {
//     totalVotes: 0,
//     totalTrustDeposited: '0',
//     uniqueVoters: 0,
//     averageVoteAmount: '0',
//     formattedTotal: '0',
//     formattedAverage: '0',
//   };
//
//   if (data?.deposits_aggregate) {
//     const { aggregate, nodes } = data.deposits_aggregate;
//     const totalVotes = aggregate.count;
//     const totalTrust = aggregate.sum?.assets_after_fees || '0';
//     const uniqueVoters = new Set(nodes.map((n) => n.sender_id)).size;
//
//     const totalBigInt = BigInt(totalTrust);
//     const averageBigInt = totalVotes > 0 ? totalBigInt / BigInt(totalVotes) : 0n;
//
//     stats = {
//       totalVotes,
//       totalTrustDeposited: totalTrust,
//       uniqueVoters,
//       averageVoteAmount: averageBigInt.toString(),
//       formattedTotal: formatEther(totalBigInt),
//       formattedAverage: formatEther(averageBigInt),
//     };
//   }
//
//   return {
//     stats,
//     loading,
//     error,
//     refetch,
//   };
// }

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

/**
 * Hook to fetch votes timeline for a specific triple
 *
 * Returns cumulative vote data over time for chart display.
 *
 * @param termId - The term_id of the triple
 * @returns Timeline data points with cumulative FOR/AGAINST/NET
 *
 * @example
 * ```tsx
 * const { timeline, loading } = useVotesTimeline('0xterm...');
 * // Use with a chart library like recharts
 * ```
 */
export function useVotesTimeline(termId: string | undefined) {
  const { data, loading, error, refetch } = useQuery<GetVotesTimelineResult>(
    GET_VOTES_TIMELINE,
    {
      variables: { termId },
      skip: !termId,
    }
  );

  const timeline: TimelineDataPoint[] = [];

  if (data?.deposits) {
    let cumulativeFor = 0n;
    let cumulativeAgainst = 0n;

    data.deposits.forEach((deposit) => {
      const amount = BigInt(deposit.assets_after_fees);

      if (deposit.vault_type === 'triple_positive') {
        cumulativeFor += amount;
      } else {
        cumulativeAgainst += amount;
      }

      const cumulativeNet = cumulativeFor - cumulativeAgainst;

      timeline.push({
        timestamp: deposit.created_at,
        date: new Date(deposit.created_at),
        cumulativeFor,
        cumulativeAgainst,
        cumulativeNet,
        formattedFor: formatEther(cumulativeFor),
        formattedAgainst: formatEther(cumulativeAgainst),
        formattedNet: formatEther(cumulativeNet),
      });
    });
  }

  return {
    timeline,
    loading,
    error,
    refetch,
  };
}

/**
 * Hook to fetch votes distribution for a specific triple
 *
 * Returns vote amount distribution in buckets for histogram display.
 *
 * @param termId - The term_id of the triple
 * @returns Distribution buckets and top voters
 *
 * @example
 * ```tsx
 * const { buckets, topVoters, loading } = useVotesDistribution('0xterm...');
 * ```
 */
export function useVotesDistribution(termId: string | undefined) {
  const { data, loading, error, refetch } = useQuery<GetVotesDistributionResult>(
    GET_VOTES_DISTRIBUTION,
    {
      variables: { termId },
      skip: !termId,
    }
  );

  // Define buckets in ETH
  const bucketRanges = [
    { range: '0-0.1', min: 0n, max: parseEther('0.1') },
    { range: '0.1-1', min: parseEther('0.1'), max: parseEther('1') },
    { range: '1-5', min: parseEther('1'), max: parseEther('5') },
    { range: '5-10', min: parseEther('5'), max: parseEther('10') },
    { range: '10-50', min: parseEther('10'), max: parseEther('50') },
    { range: '50+', min: parseEther('50'), max: BigInt('999999999999999999999999') },
  ];

  const buckets: DistributionBucket[] = bucketRanges.map(({ range, min, max }) => ({
    range,
    minAmount: min,
    maxAmount: max,
    count: 0,
    totalAmount: 0n,
    formattedTotal: '0',
  }));

  const topVotersList: Array<{
    address: string;
    amount: string;
    formattedAmount: string;
    isPositive: boolean;
  }> = [];

  if (data?.deposits) {
    data.deposits.forEach((deposit) => {
      const amount = BigInt(deposit.assets_after_fees);

      // Find the right bucket
      for (const bucket of buckets) {
        if (amount >= bucket.minAmount && amount < bucket.maxAmount) {
          bucket.count++;
          bucket.totalAmount += amount;
          bucket.formattedTotal = formatEther(bucket.totalAmount);
          break;
        }
      }

      // Add to top voters (already sorted by amount desc from query)
      if (topVotersList.length < 10) {
        topVotersList.push({
          address: deposit.sender_id,
          amount: deposit.assets_after_fees,
          formattedAmount: formatEther(amount),
          isPositive: deposit.vault_type === 'triple_positive',
        });
      }
    });
  }

  // Calculate total and "others" percentage
  const totalVotes = data?.deposits.length || 0;
  const top10Total = topVotersList.reduce(
    (sum, v) => sum + BigInt(v.amount),
    0n
  );
  const allTotal = data?.deposits.reduce(
    (sum, d) => sum + BigInt(d.assets_after_fees),
    0n
  ) || 0n;
  const othersTotal = allTotal - top10Total;

  return {
    buckets,
    topVoters: topVotersList,
    totalVotes,
    top10Percentage: allTotal > 0n ? Number((top10Total * 100n) / allTotal) : 0,
    othersTotal: othersTotal.toString(),
    formattedOthersTotal: formatEther(othersTotal),
    loading,
    error,
    refetch,
  };
}

/**
 * COMMENTED OUT - NOT USED
 * Hook non utilisé dans le codebase actuel
 *
 * Hook to fetch statistics for a specific founder
 *
 * @param founderName - Name of the founder
 * @returns Founder statistics with totem distribution
 *
 * @example
 * ```tsx
 * const { stats, loading } = useFounderStats('Vitalik Buterin');
 * ```
 */
// export function useFounderStats(founderName: string | undefined) {
//   const { data, loading, error, refetch } = useQuery<GetFounderStatsResult>(
//     GET_FOUNDER_STATS,
//     {
//       variables: { founderName },
//       skip: !founderName,
//     }
//   );
//
//   let stats: FounderStats | null = null;
//
//   if (data?.triples && founderName) {
//     // Calculate total trust and totem distribution
//     const totemMap = new Map<string, {
//       label: string;
//       trustFor: bigint;
//       trustAgainst: bigint;
//     }>();
//
//     let totalTrust = 0n;
//     let mostRecentProposal: string | null = null;
//
//     data.triples.forEach((triple) => {
//       const forAmount = BigInt(triple.triple_vault?.total_assets || '0');
//       const againstAmount = BigInt(triple.counter_term?.total_assets || '0');
//       totalTrust += forAmount + againstAmount;
//
//       // Track most recent proposal
//       if (!mostRecentProposal || triple.created_at > mostRecentProposal) {
//         mostRecentProposal = triple.created_at;
//       }
//
//       // Aggregate by totem
//       const existing = totemMap.get(triple.object.term_id) || {
//         label: triple.object.label,
//         trustFor: 0n,
//         trustAgainst: 0n,
//       };
//       totemMap.set(triple.object.term_id, {
//         label: triple.object.label,
//         trustFor: existing.trustFor + forAmount,
//         trustAgainst: existing.trustAgainst + againstAmount,
//       });
//     });
//
//     const totemDistribution = Array.from(totemMap.entries())
//       .map(([totemId, { label, trustFor, trustAgainst }]) => ({
//         totemId,
//         totemLabel: label,
//         trustFor: trustFor.toString(),
//         trustAgainst: trustAgainst.toString(),
//         netScore: (trustFor - trustAgainst).toString(),
//       }))
//       .sort((a, b) => {
//         const diff = BigInt(b.netScore) - BigInt(a.netScore);
//         return diff > 0n ? 1 : diff < 0n ? -1 : 0;
//       });
//
//     stats = {
//       founderName,
//       totalTrust: totalTrust.toString(),
//       formattedTrust: formatEther(totalTrust),
//       proposalCount: data.triples.length,
//       uniqueVoters: 0, // Would need separate query to calculate
//       mostRecentProposal,
//       mostRecentVote: data.deposits[0]?.created_at || null,
//       totemDistribution,
//     };
//   }
//
//   return {
//     stats,
//     loading,
//     error,
//     refetch,
//   };
// }
