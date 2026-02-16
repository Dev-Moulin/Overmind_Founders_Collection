/**
 * useUserVotesForFounder - Hook to fetch user's votes for a specific founder
 *
 * Returns detailed vote information including subject, predicate, object with images
 * for display in "My Votes" section with inline images format:
 * [Img Subject] Subject - [Img Predicate] Predicate - [Img Object] Object  +X.XXX
 *
 * NOTE: Uses positions (not deposits) to correctly account for redeems.
 * Position value = total_deposit - total_redeem
 *
 * @see Phase 10 - Etape 5 in TODO_FIX_01_Discussion.md
 */

import { useMemo, useCallback } from 'react';
import { useQuery } from '@apollo/client';
import { formatEther } from 'viem';
import { GET_USER_POSITIONS_FOR_TERMS } from '../../lib/graphql/queries';
import { filterValidTriples, type RawTriple } from '../../utils/tripleGuards';
import { formatSignedAmount } from '../../utils/formatters';
import { getCacheFetchPolicy, TWO_MINUTES } from '../../lib/queryCacheTTL';
import { useFoundersData } from '../../contexts/FoundersDataContext';

/** Predicates used for founder-totem relationships */
const FOUNDER_PREDICATES = ['has totem', 'embodies'];

/** Triple info from the triples query */
interface TripleInfo {
  term_id: string;
  /** Direct counter_term_id field (for AGAINST votes) */
  counter_term_id?: string | null;
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

/** Position from the positions query (accounts for redeems) */
interface UserPosition {
  id: string;
  account_id: string;
  term_id: string;
  shares: string;
  /** Curve ID: 1 = Linear, 2 = Progressive */
  curve_id: string | number;
  /** Total deposited (sum of all deposits) */
  total_deposit_assets_after_total_fees: string;
  /** Total redeemed (sum of all withdrawals) */
  total_redeem_assets_for_receiver: string;
  created_at: string;
  updated_at: string;
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
  /** Current position value (deposits - redeems) */
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
  /** Curve ID: 1 = Linear, 2 = Progressive */
  curveId: number;
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

/** Result type for GET_USER_POSITIONS_ALL */
interface GetUserPositionsResult {
  positions: UserPosition[];
}

/**
 * Hook to fetch user's votes for a specific founder
 *
 * Uses two queries in sequence:
 * 1. Get founder's triples with subject/predicate/object details (to get term_ids)
 * 2. Get user's positions for those specific term_ids (efficient: only founder's triples)
 *
 * This approach is more efficient than fetching ALL user positions and filtering client-side.
 *
 * @param walletAddress - The user's wallet address (0x...)
 * @param founderName - The founder's name (e.g., "Joseph Lubin")
 * @returns Detailed votes with triple info for display
 */
export function useUserVotesForFounder(
  walletAddress: string | undefined,
  founderName: string
): UseUserVotesForFounderReturn {
  const { proposalsByFounder, loading: contextLoading, refetch: refetchContext } = useFoundersData();

  // Normalize wallet address to lowercase
  const normalizedAddress = walletAddress?.toLowerCase();

  // Get triples from Context instead of query
  const validTriples = useMemo(() => {
    const proposals = proposalsByFounder.get(founderName) ?? [];
    return filterValidTriples(proposals as RawTriple[], 'useUserVotesForFounder');
  }, [proposalsByFounder, founderName]);

  // Extract all term_ids (triple term_ids + counter_term_ids) for positions query
  // Also create map for later lookup
  const { allTermIds, termToVoteInfo } = useMemo(() => {
    const termIds: string[] = [];
    const map = new Map<string, { triple: TripleInfo; isFor: boolean }>();

    for (const triple of validTriples) {
      const tripleInfo = triple as unknown as TripleInfo;
      // Position on term_id = FOR vote
      termIds.push(tripleInfo.term_id);
      map.set(tripleInfo.term_id, { triple: tripleInfo, isFor: true });
      // Position on counter_term_id = AGAINST vote
      if (tripleInfo.counter_term_id) {
        termIds.push(tripleInfo.counter_term_id);
        map.set(tripleInfo.counter_term_id, { triple: tripleInfo, isFor: false });
      }
    }

    return { allTermIds: termIds, termToVoteInfo: map };
  }, [validTriples]);

  // TTL-based cache policy for positions (per wallet + founder)
  const positionsFetchPolicy = getCacheFetchPolicy(
    'GetUserPositionsForTerms',
    { walletAddress: normalizedAddress, founderName },
    TWO_MINUTES
  );

  // Query 2: Get user's positions for founder's triples only (efficient)
  const {
    data: positionsData,
    loading: positionsLoading,
    error: positionsError,
    refetch: refetchPositions,
  } = useQuery<GetUserPositionsResult>(GET_USER_POSITIONS_FOR_TERMS, {
    variables: {
      walletAddress: normalizedAddress,
      termIds: allTermIds,
    },
    // Skip if no wallet, no founder, or no term_ids yet
    skip: !normalizedAddress || !founderName || allTermIds.length === 0,
    // TTL-based: 'cache-first' if fresh, 'cache-and-network' if stale
    fetchPolicy: positionsFetchPolicy,
    nextFetchPolicy: 'cache-first',
  });

  // Join positions with triples and create enriched votes
  // Uses termToVoteInfo to determine FOR/AGAINST based on term_id vs counter_term_id
  // Groups by totem + direction + curve (keeps Linear and Progressive separate)
  const allVotes = useMemo((): UserVoteWithDetails[] => {
    if (!positionsData?.positions || termToVoteInfo.size === 0) {
      return [];
    }

    // Group positions by totem + direction + curve
    // Key: `${object.term_id}_${isFor}_${curveId}` to keep curves separate
    const consolidatedMap = new Map<string, {
      triple: TripleInfo;
      isFor: boolean;
      curveId: number;
      currentValue: bigint; // deposits - redeems
      totalShares: bigint;
      latestPosition: UserPosition;
    }>();

    for (const position of positionsData.positions) {
      // Skip positions with no shares (fully redeemed)
      const shares = BigInt(position.shares || '0');
      if (shares <= 0n) continue;

      // Check if this position is for one of the founder's triples
      const voteInfo = termToVoteInfo.get(position.term_id);
      if (!voteInfo) continue;

      const { triple, isFor } = voteInfo;

      // Check if predicate matches founder predicates
      if (!FOUNDER_PREDICATES.includes(triple.predicate.label)) continue;

      // Calculate current position value = deposits - redeems
      const totalDeposit = BigInt(position.total_deposit_assets_after_total_fees || '0');
      const totalRedeem = BigInt(position.total_redeem_assets_for_receiver || '0');
      const currentValue = totalDeposit - totalRedeem;

      // Skip if current value is 0 or negative (shouldn't happen, but safety check)
      if (currentValue <= 0n) continue;
      // Curve ID from positions table
      const curveId = Number(position.curve_id) || 1; // Default to Linear if missing
      const key = `${triple.object.term_id}_${isFor}_${curveId}`;

      const existing = consolidatedMap.get(key);
      if (existing) {
        // Add to existing
        existing.currentValue += currentValue;
        existing.totalShares += shares;
        // Keep the most recent position for metadata
        if (position.updated_at > existing.latestPosition.updated_at) {
          existing.latestPosition = position;
        }
      } else {
        // Create new entry
        consolidatedMap.set(key, {
          triple,
          isFor,
          curveId,
          currentValue,
          totalShares: shares,
          latestPosition: position,
        });
      }
    }

    // Convert consolidated map to votes array
    const votes: UserVoteWithDetails[] = [];
    for (const [, data] of consolidatedMap) {
      const { triple, isFor, curveId, currentValue, totalShares, latestPosition } = data;

      const formattedAmount = formatEther(currentValue);
      const signedAmount = formatSignedAmount(formattedAmount, isFor);

      votes.push({
        id: latestPosition.id,
        sender_id: latestPosition.account_id,
        term_id: latestPosition.term_id,
        vault_type: isFor ? 'Triple' : 'CounterTriple',
        shares: totalShares.toString(),
        assets_after_fees: currentValue.toString(),
        created_at: latestPosition.created_at,
        transaction_hash: '', // Positions don't have tx hash
        term: {
          term_id: triple.term_id,
          subject: triple.subject,
          predicate: triple.predicate,
          object: triple.object,
        },
        isPositive: isFor,
        formattedAmount,
        signedAmount,
        curveId,
      });
    }

    return votes;
  }, [positionsData?.positions, termToVoteInfo, allTermIds.length]);

  // Separate FOR and AGAINST votes - memoized to prevent unnecessary re-renders
  const forVotes = useMemo(() => allVotes.filter((v) => v.isPositive), [allVotes]);
  const againstVotes = useMemo(() => allVotes.filter((v) => !v.isPositive), [allVotes]);

  // Calculate totals - memoized
  const totalFor = useMemo(
    () => forVotes.reduce((sum, v) => sum + BigInt(v.assets_after_fees), 0n).toString(),
    [forVotes]
  );
  const totalAgainst = useMemo(
    () => againstVotes.reduce((sum, v) => sum + BigInt(v.assets_after_fees), 0n).toString(),
    [againstVotes]
  );

  // Combined loading state
  const loading = positionsLoading || contextLoading;

  // Combined error
  const error = positionsError;

  // Combined refetch - forces network-only to bypass cache after mutations
  const refetch = useCallback(() => {
    refetchPositions({ fetchPolicy: 'network-only' });
    refetchContext();
  }, [refetchPositions, refetchContext]);

  // Memoize return value to prevent unnecessary re-renders
  return useMemo(() => ({
    votes: allVotes,
    forVotes,
    againstVotes,
    totalFor,
    totalAgainst,
    loading,
    error: error as Error | undefined,
    refetch,
  }), [allVotes, forVotes, againstVotes, totalFor, totalAgainst, loading, error, refetch]);
}
