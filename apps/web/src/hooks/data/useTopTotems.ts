/**
 * useTopTotems - Hook to fetch top totems for a founder
 *
 * Returns the top N totems sorted by total TRUST (FOR + AGAINST)
 * Includes both TRUST metrics and wallet counts for Results display
 * Used for Radar Chart visualization
 *
 * @see Phase 10 - Étape 3 in TODO_FIX_01_Discussion.md
 * @see Phase 11 - Results in HomePage cards
 */

import { useMemo } from 'react';
import { useQuery } from '@apollo/client';
import { formatEther } from 'viem';
import { useFounderProposals } from './useFounderProposals';
import { filterValidTriples, type RawTriple } from '../../utils/tripleGuards';
import { GET_DEPOSITS_BY_TERM_IDS } from '../../lib/graphql/queries';
import type { GetDepositsByTermIdsResult } from '../../lib/graphql/types';

export interface TopTotem {
  id: string;
  label: string;
  image?: string;
  /** FOR votes in TRUST */
  trustFor: number;
  /** AGAINST votes in TRUST */
  trustAgainst: number;
  /** Total TRUST (FOR + AGAINST) */
  totalTrust: number;
  /** Net TRUST score (FOR - AGAINST) */
  netScore: number;
  /** Number of unique wallets voting FOR */
  walletsFor: number;
  /** Number of unique wallets voting AGAINST */
  walletsAgainst: number;
  /** Total unique wallets (may overlap if same wallet voted both ways on different triples) */
  totalWallets: number;
  /** Net Votes = walletsFor - walletsAgainst (democratic consensus) */
  netVotes: number;
}

interface UseTopTotemsReturn {
  topTotems: TopTotem[];
  loading: boolean;
  error?: Error;
}

/**
 * Convert wei string to ETH number
 */
function weiToEth(weiStr: string): number {
  return parseFloat(formatEther(BigInt(weiStr)));
}

/**
 * Hook to get top totems for a founder
 *
 * @param founderName - The founder's name (e.g., "Joseph Lubin")
 * @param limit - Maximum number of totems to return (default: 5)
 * @returns Top totems sorted by total TRUST, includes wallet counts
 *
 * @example
 * ```tsx
 * const { topTotems, loading } = useTopTotems('Joseph Lubin', 5);
 * // Each totem has: trustFor, trustAgainst, walletsFor, walletsAgainst, netVotes
 * ```
 */
export function useTopTotems(
  founderName: string,
  limit: number = 5
): UseTopTotemsReturn {
  const { proposals, loading: proposalsLoading, error: proposalsError } = useFounderProposals(founderName);

  // Filter valid proposals first (removes those with null object/subject/predicate)
  const validProposals = useMemo(() => {
    if (!proposals || proposals.length === 0) return [];
    return filterValidTriples(proposals as RawTriple[], 'useTopTotems');
  }, [proposals]);

  // Extract term_ids from valid proposals for the deposits query
  const termIds = useMemo(() => {
    if (validProposals.length === 0) return [];
    return validProposals.map((p) => p.term_id);
  }, [validProposals]);

  // Query deposits to count unique wallets per totem
  const {
    data: depositsData,
    loading: depositsLoading,
    error: depositsError,
  } = useQuery<GetDepositsByTermIdsResult>(GET_DEPOSITS_BY_TERM_IDS, {
    variables: { termIds },
    skip: termIds.length === 0,
    fetchPolicy: 'cache-and-network',
  });

  // Build a map of term_id -> { walletsFor: Set, walletsAgainst: Set }
  const walletsByTermId = useMemo(() => {
    const map = new Map<string, { walletsFor: Set<string>; walletsAgainst: Set<string> }>();

    if (!depositsData?.deposits) return map;

    for (const deposit of depositsData.deposits) {
      const termId = deposit.term_id;
      const wallet = deposit.sender_id.toLowerCase();
      const vaultType = deposit.vault_type;

      if (!map.has(termId)) {
        map.set(termId, { walletsFor: new Set(), walletsAgainst: new Set() });
      }

      const entry = map.get(termId)!;
      if (vaultType === 'triple_positive') {
        entry.walletsFor.add(wallet);
      } else if (vaultType === 'triple_negative') {
        entry.walletsAgainst.add(wallet);
      }
    }

    return map;
  }, [depositsData?.deposits]);

  const topTotems = useMemo((): TopTotem[] => {
    if (validProposals.length === 0) return [];

    // Aggregate votes by totem (object_id)
    const totemMap = new Map<string, TopTotem>();

    validProposals.forEach((proposal) => {
      // Use object.term_id since object_id is not in GraphQL response
      // proposal.object is guaranteed non-null by filterValidTriples
      const totemId = proposal.object.term_id;
      const trustFor = weiToEth(proposal.votes?.forVotes || '0');
      const trustAgainst = weiToEth(proposal.votes?.againstVotes || '0');

      // Get wallet counts for this triple
      const walletData = walletsByTermId.get(proposal.term_id);
      const walletsFor = walletData?.walletsFor.size || 0;
      const walletsAgainst = walletData?.walletsAgainst.size || 0;

      if (totemMap.has(totemId)) {
        // Aggregate if same totem appears with different predicates
        const existing = totemMap.get(totemId)!;
        existing.trustFor += trustFor;
        existing.trustAgainst += trustAgainst;
        existing.totalTrust = existing.trustFor + existing.trustAgainst;
        existing.netScore = existing.trustFor - existing.trustAgainst;
        // Aggregate wallet counts
        existing.walletsFor += walletsFor;
        existing.walletsAgainst += walletsAgainst;
        existing.totalWallets = existing.walletsFor + existing.walletsAgainst;
        existing.netVotes = existing.walletsFor - existing.walletsAgainst;
      } else {
        totemMap.set(totemId, {
          id: totemId,
          label: proposal.object.label,
          image: proposal.object.image,
          trustFor,
          trustAgainst,
          totalTrust: trustFor + trustAgainst,
          netScore: trustFor - trustAgainst,
          walletsFor,
          walletsAgainst,
          totalWallets: walletsFor + walletsAgainst,
          netVotes: walletsFor - walletsAgainst,
        });
      }
    });

    // Sort by total TRUST (descending) and take top N
    return Array.from(totemMap.values())
      .sort((a, b) => b.totalTrust - a.totalTrust)
      .slice(0, limit);
  }, [validProposals, walletsByTermId, limit]);

  // Combined loading state
  const loading = proposalsLoading || (termIds.length > 0 && depositsLoading);

  // Combined error
  const error = proposalsError || depositsError;

  return {
    topTotems,
    loading,
    error: error as Error | undefined,
  };
}
