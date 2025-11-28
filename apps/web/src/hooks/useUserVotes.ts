import { useQuery } from '@apollo/client';
import { formatEther } from 'viem';
import {
  GET_USER_VOTES,
  GET_USER_VOTES_DETAILED,
  GET_USER_POSITION,
} from '../lib/graphql/queries';
import type {
  GetUserVotesResult,
  GetUserVotesDetailedResult,
  GetUserPositionResult,
  Deposit,
  VaultType,
} from '../lib/graphql/types';
import type { VoteWithDetails } from '../types/vote';

/**
 * Enrich deposit with computed fields
 */
function enrichDeposit(deposit: Deposit): VoteWithDetails {
  const isPositive = deposit.vault_type === 'triple_positive';
  const formattedAmount = formatEther(BigInt(deposit.assets_after_fees));

  return {
    ...deposit,
    isPositive,
    formattedAmount,
  };
}

/**
 * Hook to fetch all votes made by a user
 *
 * Returns deposits on atoms and triples (both FOR and AGAINST).
 *
 * @param walletAddress - The user's wallet address
 * @returns Query result with user's votes
 *
 * @example
 * ```tsx
 * const { votes, loading, error, refetch } = useUserVotes('0x123...');
 * ```
 */
export function useUserVotes(walletAddress: string | undefined) {
  const { data, loading, error, refetch } = useQuery<GetUserVotesResult>(
    GET_USER_VOTES,
    {
      variables: { walletAddress },
      skip: !walletAddress,
    }
  );

  const votes: VoteWithDetails[] = data?.deposits.map(enrichDeposit) || [];

  return {
    votes,
    loading,
    error,
    refetch,
  };
}

/**
 * Hook to fetch detailed votes (triples only) made by a user
 *
 * Only returns votes on triples (FOR/AGAINST), excluding atom votes.
 *
 * @param walletAddress - The user's wallet address
 * @returns Query result with user's triple votes
 *
 * @example
 * ```tsx
 * const { votes, forVotes, againstVotes } = useUserVotesDetailed('0x123...');
 * ```
 */
export function useUserVotesDetailed(walletAddress: string | undefined) {
  const { data, loading, error, refetch } =
    useQuery<GetUserVotesDetailedResult>(GET_USER_VOTES_DETAILED, {
      variables: { walletAddress },
      skip: !walletAddress,
    });

  const allVotes: VoteWithDetails[] = data?.deposits.map(enrichDeposit) || [];

  // Separate FOR and AGAINST votes
  const forVotes = allVotes.filter((v) => v.isPositive);
  const againstVotes = allVotes.filter((v) => !v.isPositive);

  return {
    votes: allVotes,
    forVotes,
    againstVotes,
    loading,
    error,
    refetch,
  };
}

/**
 * Hook to get user's position on a specific triple
 *
 * Returns the user's shares and assets deposited on a specific term.
 *
 * @param walletAddress - The user's wallet address
 * @param termId - The term_id of the triple or atom
 * @returns Query result with user's position
 *
 * @example
 * ```tsx
 * const { position, hasPosition, shares, totalDeposited } = useUserPosition(
 *   '0x123...',
 *   '0xtermId...'
 * );
 * ```
 */
export function useUserPosition(
  walletAddress: string | undefined,
  termId: string | undefined
) {
  const { data, loading, error, refetch } = useQuery<GetUserPositionResult>(
    GET_USER_POSITION,
    {
      variables: { walletAddress, termId },
      skip: !walletAddress || !termId,
    }
  );

  const position = data?.positions?.[0] || null;
  const hasPosition = position !== null;

  const shares = position?.shares || '0';
  const totalDeposited =
    position?.total_deposit_assets_after_total_fees || '0';
  const totalRedeemed = position?.total_redeem_assets_for_receiver || '0';

  return {
    position,
    hasPosition,
    shares,
    totalDeposited,
    totalRedeemed,
    loading,
    error,
    refetch,
  };
}

/**
 * Calculate total amount deposited by user across all votes
 *
 * @param votes - Array of user's votes
 * @returns Total amount in wei as string
 */
export function getTotalVotedAmount(votes: VoteWithDetails[]): string {
  const total = votes.reduce((sum, vote) => {
    return sum + BigInt(vote.assets_after_fees);
  }, 0n);
  return total.toString();
}

/**
 * Filter votes by vault type
 *
 * @param votes - Array of votes
 * @param vaultType - The vault type to filter by
 * @returns Filtered votes
 */
export function filterVotesByType(
  votes: VoteWithDetails[],
  vaultType: VaultType
): VoteWithDetails[] {
  return votes.filter((v) => v.vault_type === vaultType);
}

/**
 * Group votes by term_id
 *
 * @param votes - Array of votes
 * @returns Map of term_id to array of votes
 */
export function groupVotesByTerm(
  votes: VoteWithDetails[]
): Map<string, VoteWithDetails[]> {
  const grouped = new Map<string, VoteWithDetails[]>();

  votes.forEach((vote) => {
    const existing = grouped.get(vote.term_id) || [];
    grouped.set(vote.term_id, [...existing, vote]);
  });

  return grouped;
}

/**
 * Format total vote amount to human-readable string
 *
 * @param voteAmountWei - Vote amount in wei (as string)
 * @param decimals - Number of decimals (default: 2)
 * @returns Formatted string with unit (e.g., "150.50 TRUST")
 */
export function formatTotalVotes(
  voteAmountWei: string,
  decimals: number = 2
): string {
  const ether = formatEther(BigInt(voteAmountWei));
  const num = parseFloat(ether);
  return `${num.toFixed(decimals)} TRUST`;
}

/**
 * Check if user has voted on a specific term
 *
 * @param votes - Array of user's votes
 * @param termId - The term_id to check
 * @returns true if user has voted on this term
 */
export function hasVotedOnTerm(
  votes: VoteWithDetails[],
  termId: string
): boolean {
  return votes.some((v) => v.term_id === termId);
}

/**
 * Get user's vote direction on a term (FOR or AGAINST)
 *
 * @param votes - Array of user's votes
 * @param termId - The term_id to check
 * @returns 'for' | 'against' | null
 */
export function getUserVoteDirection(
  votes: VoteWithDetails[],
  termId: string
): 'for' | 'against' | null {
  const vote = votes.find((v) => v.term_id === termId);
  if (!vote) return null;
  return vote.isPositive ? 'for' : 'against';
}
