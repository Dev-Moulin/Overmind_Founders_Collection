/**
 * useUserVotesForFounder - Hook to fetch user's votes for a specific founder
 *
 * Returns detailed vote information including subject, predicate, object with images
 * for display in "My Votes" section with inline images format:
 * [Img Subject] Subject - [Img Predicate] Predicate - [Img Object] Object  +X.XXX
 *
 * NOTE: Due to Hasura limitations:
 * 1. The `term` relation on deposits doesn't support inline fragments for triples
 * 2. We use a two-query approach: get user deposits, then get founder's triples
 * 3. Join them client-side by term_id
 *
 * @see Phase 10 - Etape 5 in TODO_FIX_01_Discussion.md
 */

import { useMemo, useEffect } from 'react';
import { useQuery } from '@apollo/client';
import { formatEther } from 'viem';
import {
  GET_USER_DEPOSITS_SIMPLE,
  GET_FOUNDER_TRIPLES_WITH_DETAILS,
} from '../../lib/graphql/queries';

/** Predicates used for founder-totem relationships */
const FOUNDER_PREDICATES = ['has totem', 'embodies'];

/** Triple info from the triples query */
interface TripleInfo {
  term_id: string;
  subject: {
    term_id: string;
    label: string;
    image?: string;
    emoji?: string;
  };
  predicate: {
    term_id: string;
    label: string;
    image?: string;
    emoji?: string;
  };
  object: {
    term_id: string;
    label: string;
    image?: string;
    emoji?: string;
  };
}

/** Deposit from the deposits query */
interface UserDeposit {
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
 * Enriched user vote with computed fields
 */
export interface UserVoteWithDetails {
  id: string;
  sender_id: string;
  term_id: string;
  vault_type: string;
  shares: string;
  assets_after_fees: string;
  created_at: string;
  transaction_hash: string;
  /** Triple info from the second query */
  term: {
    term_id: string;
    subject: {
      term_id: string;
      label: string;
      image?: string;
      emoji?: string;
    };
    predicate: {
      term_id: string;
      label: string;
      image?: string;
      emoji?: string;
    };
    object: {
      term_id: string;
      label: string;
      image?: string;
      emoji?: string;
    };
  };
  /** true = FOR (positive vault), false = AGAINST (negative vault) */
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

/** Result type for GET_USER_DEPOSITS_SIMPLE */
interface GetUserDepositsResult {
  deposits: UserDeposit[];
}

/** Result type for GET_FOUNDER_TRIPLES_WITH_DETAILS */
interface GetFounderTriplesResult {
  triples: TripleInfo[];
}

/**
 * Hook to fetch user's votes for a specific founder
 *
 * Uses two queries:
 * 1. Get all deposits for the user
 * 2. Get all triples for the founder with subject/predicate/object details
 * Then joins them client-side by term_id
 *
 * @param walletAddress - The user's wallet address (0x...)
 * @param founderName - The founder's name (e.g., "Joseph Lubin")
 * @returns Detailed votes with triple info for display
 */
export function useUserVotesForFounder(
  walletAddress: string | undefined,
  founderName: string
): UseUserVotesForFounderReturn {
  // Normalize wallet address to lowercase
  const normalizedAddress = walletAddress?.toLowerCase();

  // Query 1: Get user's deposits (simple, no term details)
  const {
    data: depositsData,
    loading: depositsLoading,
    error: depositsError,
    refetch: refetchDeposits,
  } = useQuery<GetUserDepositsResult>(GET_USER_DEPOSITS_SIMPLE, {
    variables: { walletAddress: normalizedAddress },
    skip: !normalizedAddress,
    fetchPolicy: 'cache-and-network',
  });

  // Query 2: Get founder's triples with full details
  const {
    data: triplesData,
    loading: triplesLoading,
    error: triplesError,
    refetch: refetchTriples,
  } = useQuery<GetFounderTriplesResult>(GET_FOUNDER_TRIPLES_WITH_DETAILS, {
    variables: { founderName },
    skip: !founderName,
    fetchPolicy: 'cache-and-network',
  });

  // Create a map of term_id -> triple info for fast lookup
  const triplesMap = useMemo(() => {
    const map = new Map<string, TripleInfo>();
    if (triplesData?.triples) {
      for (const triple of triplesData.triples) {
        map.set(triple.term_id, triple);
      }
    }
    return map;
  }, [triplesData?.triples]);

  // Join deposits with triples and create enriched votes
  const allVotes = useMemo((): UserVoteWithDetails[] => {
    if (!depositsData?.deposits || triplesMap.size === 0) {
      return [];
    }

    const votes: UserVoteWithDetails[] = [];

    for (const deposit of depositsData.deposits) {
      // Check if this deposit is for one of the founder's triples
      const triple = triplesMap.get(deposit.term_id);
      if (!triple) continue;

      // Check if predicate matches founder predicates
      if (!FOUNDER_PREDICATES.includes(triple.predicate.label)) continue;

      // Determine if it's a positive (FOR) or negative (AGAINST) vote
      // vault_type can be "Triple", "triple_positive", "triple_negative"
      // For "Triple", we assume positive (FOR) - this may need adjustment
      const isPositive = deposit.vault_type !== 'triple_negative';
      const formattedAmount = formatEther(BigInt(deposit.assets_after_fees));
      const signedAmount = `${isPositive ? '+' : '-'}${parseFloat(formattedAmount).toFixed(4)}`;

      votes.push({
        ...deposit,
        term: {
          term_id: triple.term_id,
          subject: triple.subject,
          predicate: triple.predicate,
          object: triple.object,
        },
        isPositive,
        formattedAmount,
        signedAmount,
      });
    }

    return votes;
  }, [depositsData?.deposits, triplesMap]);

  // DEBUG: Log data
  useEffect(() => {
    console.log('[useUserVotesForFounder] DEBUG:', {
      walletAddress: normalizedAddress,
      founderName,
      depositsCount: depositsData?.deposits?.length || 0,
      triplesCount: triplesData?.triples?.length || 0,
      triplesMapSize: triplesMap.size,
      matchedVotesCount: allVotes.length,
      sampleVotes: allVotes.slice(0, 3).map(v => ({
        term_id: v.term_id,
        subject: v.term.subject.label,
        predicate: v.term.predicate.label,
        object: v.term.object.label,
        amount: v.signedAmount,
      })),
    });
  }, [depositsData?.deposits, triplesData?.triples, triplesMap, allVotes, normalizedAddress, founderName]);

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

  // Combined loading state
  const loading = depositsLoading || triplesLoading;

  // Combined error
  const error = depositsError || triplesError;

  // Combined refetch
  const refetch = () => {
    refetchDeposits();
    refetchTriples();
  };

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
