import { useQuery } from '@apollo/client';
import { formatEther } from 'viem';
import {
  GET_FOUNDER_PROPOSALS,
  // GET_USER_PROPOSALS,  // COMMENTED - useUserProposals disabled
  COUNT_USER_PROPOSALS_FOR_FOUNDER,
} from '../lib/graphql/queries';
import type {
  GetFounderProposalsResult,
  // GetUserProposalsResult,  // COMMENTED - useUserProposals disabled
  CountUserProposalsForFounderResult,
  ProposalWithVotes,
  Triple,
  TripleVoteCounts,
} from '../lib/graphql/types';

/**
 * Calculate vote counts and statistics for a triple
 */
function calculateVoteCounts(triple: Triple): TripleVoteCounts {
  const forVotes = triple.triple_vault?.total_assets || '0';
  const againstVotes = triple.counter_term?.total_assets || '0';
  const forShares = triple.triple_vault?.total_shares || '0';
  const againstShares = '0'; // counter_term doesn't have shares in V2 schema

  // Calculate net votes (FOR - AGAINST)
  const forBigInt = BigInt(forVotes);
  const againstBigInt = BigInt(againstVotes);
  const netVotes = (forBigInt - againstBigInt).toString();

  return {
    forVotes,
    againstVotes,
    netVotes,
    forShares,
    againstShares,
  };
}

/**
 * Calculate percentage of FOR votes vs total votes
 */
function calculatePercentage(votes: TripleVoteCounts): number {
  const forBigInt = BigInt(votes.forVotes);
  const againstBigInt = BigInt(votes.againstVotes);
  const total = forBigInt + againstBigInt;

  if (total === 0n) return 0;

  // Calculate percentage: (FOR / TOTAL) * 100
  return Number((forBigInt * 100n) / total);
}

/**
 * Enrich triple with vote data
 */
function enrichTripleWithVotes(triple: Triple): ProposalWithVotes {
  const votes = calculateVoteCounts(triple);
  const percentage = calculatePercentage(votes);

  return {
    ...triple,
    votes,
    percentage,
  };
}

/**
 * Hook to fetch all proposals for a specific founder
 *
 * @param founderName - The name of the founder (e.g., "Joseph Lubin")
 * @returns Query result with proposals including vote counts
 *
 * @example
 * ```tsx
 * const { proposals, loading, error } = useFounderProposals('Joseph Lubin');
 * ```
 */
export function useFounderProposals(founderName: string) {
  const { data, loading, error, refetch } = useQuery<GetFounderProposalsResult>(
    GET_FOUNDER_PROPOSALS,
    {
      variables: { founderName },
      skip: !founderName,
    }
  );

  const proposals: ProposalWithVotes[] =
    data?.triples.map(enrichTripleWithVotes) || [];

  return {
    proposals,
    loading,
    error,
    refetch,
  };
}

/**
 * COMMENTED OUT - NOT USED
 * Hook non utilisé dans le codebase actuel (seulement dans les tests)
 *
 * Hook to fetch all proposals created by a specific user
 *
 * @param walletAddress - The user's wallet address (0x...)
 * @returns Query result with user's proposals including vote counts
 *
 * @example
 * ```tsx
 * const { proposals, loading, error } = useUserProposals('0x123...');
 * ```
 */
// export function useUserProposals(walletAddress: string | undefined) {
//   const { data, loading, error, refetch } = useQuery<GetUserProposalsResult>(
//     GET_USER_PROPOSALS,
//     {
//       variables: { walletAddress },
//       skip: !walletAddress,
//     }
//   );
//
//   const proposals: ProposalWithVotes[] =
//     data?.triples.map(enrichTripleWithVotes) || [];
//
//   return {
//     proposals,
//     loading,
//     error,
//     refetch,
//   };
// }

/**
 * Hook to check if a user can create a new proposal for a founder
 *
 * Enforces the 3 proposals per founder limit.
 *
 * @param walletAddress - The user's wallet address
 * @param founderName - The founder's name
 * @returns Object with count, canPropose flag, and remaining proposals
 *
 * @example
 * ```tsx
 * const { count, canPropose, remaining } = useProposalLimit(
 *   '0x123...',
 *   'Joseph Lubin'
 * );
 *
 * if (!canPropose) {
 *   alert(`You've reached the limit of 3 proposals for ${founderName}`);
 * }
 * ```
 */
export function useProposalLimit(
  walletAddress: string | undefined,
  founderName: string
) {
  const { data, loading, error } =
    useQuery<CountUserProposalsForFounderResult>(
      COUNT_USER_PROPOSALS_FOR_FOUNDER,
      {
        variables: { walletAddress, founderName },
        skip: !walletAddress || !founderName,
      }
    );

  const MAX_PROPOSALS = 3;
  const count = data?.triples_aggregate?.aggregate?.count || 0;
  const canPropose = count < MAX_PROPOSALS;
  const remaining = Math.max(0, MAX_PROPOSALS - count);

  return {
    count,
    canPropose,
    remaining,
    loading,
    error,
    maxProposals: MAX_PROPOSALS,
  };
}

/**
 * Sort proposals by vote count (descending)
 *
 * @param proposals - Array of proposals with votes
 * @returns Sorted array (most votes first)
 */
export function sortProposalsByVotes(
  proposals: ProposalWithVotes[]
): ProposalWithVotes[] {
  return [...proposals].sort((a, b) => {
    const aVotes = BigInt(a.votes.forVotes);
    const bVotes = BigInt(b.votes.forVotes);
    return bVotes > aVotes ? 1 : bVotes < aVotes ? -1 : 0;
  });
}

/**
 * Get the winning proposal (most FOR votes) for a founder
 *
 * @param proposals - Array of proposals
 * @returns The proposal with the most FOR votes, or undefined if no proposals
 */
export function getWinningProposal(
  proposals: ProposalWithVotes[]
): ProposalWithVotes | undefined {
  if (proposals.length === 0) return undefined;

  return proposals.reduce((winner, current) => {
    const winnerVotes = BigInt(winner.votes.forVotes);
    const currentVotes = BigInt(current.votes.forVotes);
    return currentVotes > winnerVotes ? current : winner;
  });
}

/**
 * Format vote amount from wei to human-readable string
 *
 * @param voteAmountWei - Vote amount in wei (as string)
 * @param decimals - Number of decimals to show (default: 2)
 * @returns Formatted string (e.g., "150.50")
 */
export function formatVoteAmount(
  voteAmountWei: string,
  decimals: number = 2
): string {
  const ether = formatEther(BigInt(voteAmountWei));
  const num = parseFloat(ether);
  return num.toFixed(decimals);
}
