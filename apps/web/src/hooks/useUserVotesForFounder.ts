/**
 * useUserVotesForFounder - Hook to fetch user's votes for a specific founder
 *
 * Returns detailed vote information including subject, predicate, object with images
 * for display in "My Votes" section with inline images format:
 * [Img Subject] Subject - [Img Predicate] Predicate - [Img Object] Object  +X.XXX
 *
 * @see Phase 10 - Etape 5 in TODO_FIX_01_Discussion.md
 */

import { useQuery } from '@apollo/client';
import { formatEther } from 'viem';
import { GET_USER_VOTES_FOR_FOUNDER } from '../lib/graphql/queries';
import type {
  GetUserVotesForFounderResult,
  DepositWithTriple,
} from '../lib/graphql/types';

/**
 * Enriched user vote with computed fields
 */
export interface UserVoteWithDetails extends DepositWithTriple {
  /** true = FOR (triple_positive), false = AGAINST (triple_negative) */
  isPositive: boolean;
  /** Human-readable amount (e.g., "10.50") */
  formattedAmount: string;
  /** Signed amount string (e.g., "+10.50" or "-10.50") */
  signedAmount: string;
}

interface UseUserVotesForFounderReturn {
  votes: UserVoteWithDetails[];
  forVotes: UserVoteWithDetails[];
  againstVotes: UserVoteWithDetails[];
  totalFor: string;
  totalAgainst: string;
  loading: boolean;
  error?: Error;
  refetch: () => void;
}

/**
 * Enrich deposit with computed fields
 */
function enrichDeposit(deposit: DepositWithTriple): UserVoteWithDetails {
  const isPositive = deposit.vault_type === 'triple_positive';
  const formattedAmount = formatEther(BigInt(deposit.assets_after_fees));
  const signedAmount = `${isPositive ? '+' : '-'}${parseFloat(formattedAmount).toFixed(4)}`;

  return {
    ...deposit,
    isPositive,
    formattedAmount,
    signedAmount,
  };
}

/**
 * Hook to fetch user's votes for a specific founder
 *
 * @param walletAddress - The user's wallet address (0x...)
 * @param founderName - The founder's name (e.g., "Joseph Lubin")
 * @returns Detailed votes with triple info for display
 *
 * @example
 * ```tsx
 * const { votes, forVotes, againstVotes, loading } = useUserVotesForFounder(
 *   address,
 *   'Joseph Lubin'
 * );
 *
 * // Display format: [Img] Subject - [Img] Predicate - [Img] Object  +X.XXX
 * votes.map(vote => (
 *   <div>
 *     <img src={vote.term.subject.image} />
 *     {vote.term.subject.label} -
 *     <img src={vote.term.predicate.image} />
 *     {vote.term.predicate.label} -
 *     <img src={vote.term.object.image} />
 *     {vote.term.object.label}
 *     <span>{vote.signedAmount}</span>
 *   </div>
 * ))
 * ```
 */
export function useUserVotesForFounder(
  walletAddress: string | undefined,
  founderName: string
): UseUserVotesForFounderReturn {
  const { data, loading, error, refetch } = useQuery<GetUserVotesForFounderResult>(
    GET_USER_VOTES_FOR_FOUNDER,
    {
      variables: { walletAddress, founderName },
      skip: !walletAddress || !founderName,
      fetchPolicy: 'cache-and-network',
    }
  );

  const allVotes: UserVoteWithDetails[] = data?.deposits.map(enrichDeposit) || [];

  // Separate FOR and AGAINST votes
  const forVotes = allVotes.filter((v) => v.isPositive);
  const againstVotes = allVotes.filter((v) => !v.isPositive);

  // Calculate totals
  const totalFor = forVotes
    .reduce((sum, v) => sum + BigInt(v.assets_after_fees), 0n)
    .toString();
  const totalAgainst = againstVotes
    .reduce((sum, v) => sum + BigInt(v.assets_after_fees), 0n)
    .toString();

  return {
    votes: allVotes,
    forVotes,
    againstVotes,
    totalFor,
    totalAgainst,
    loading,
    error: error as Error | undefined,
    refetch,
  };
}
