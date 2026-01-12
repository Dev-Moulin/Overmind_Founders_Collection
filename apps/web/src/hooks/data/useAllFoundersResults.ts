/**
 * useAllFoundersResults - Hook to fetch results for all founders
 *
 * Returns Top 5 totems (by Net Votes) for each founder
 * Optimized: Uses batch queries instead of 42 individual queries
 *
 * @see Phase 11 - ResultsPage in TODO_Implementation.md
 */

import { useMemo } from 'react';
import { useQuery } from '@apollo/client';
import { formatEther } from 'viem';
import foundersData from '../../../../../packages/shared/src/data/founders.json';
import type { FounderData } from '../../types/founder';
import { GET_ALL_PROPOSALS, GET_ATOMS_BY_LABELS } from '../../lib/graphql/queries';
import type { Triple } from '../../lib/graphql/types';
import { filterTriplesWithValidObject } from '../../utils/tripleGuards';

export interface TotemResult {
  id: string;
  label: string;
  image?: string;
  // TRUST metrics
  trustFor: number;
  trustAgainst: number;
  totalTrust: number;
  netTrust: number;
  // Wallet metrics (for future when we add deposits query)
  // For now, use TRUST as proxy
}

export interface FounderResult {
  id: string;
  name: string;
  image?: string;
  atomId?: string;
  /** Top 5 totems sorted by Total TRUST (Net Votes requires deposits query) */
  topTotems: TotemResult[];
  /** Total TRUST across all totems */
  totalTrust: number;
  /** Number of unique totems */
  totemCount: number;
}

interface UseAllFoundersResultsReturn {
  results: FounderResult[];
  loading: boolean;
  error?: Error;
  stats: {
    totalFounders: number;
    foundersWithTotems: number;
    totalTrust: number;
  };
}

interface AtomsQueryResult {
  atoms: Array<{
    term_id: string;
    label: string;
  }>;
}

interface ProposalsQueryResult {
  triples: Triple[];
}

/**
 * Convert wei string to ETH number
 */
function weiToEth(weiStr: string | undefined): number {
  if (!weiStr) return 0;
  return parseFloat(formatEther(BigInt(weiStr)));
}

/**
 * Hook to get results for all 42 founders
 *
 * @param topN - Number of top totems per founder (default: 5)
 * @returns Results for all founders sorted by name
 *
 * @example
 * ```tsx
 * const { results, loading, stats } = useAllFoundersResults(5);
 *
 * // Display grid of founder cards with top 5 totems each
 * ```
 */
export function useAllFoundersResults(topN: number = 5): UseAllFoundersResultsReturn {
  const founders = foundersData as FounderData[];
  const founderNames = founders.map((f) => f.name);

  // Query 1: Get atomIds for all founders (for linking)
  const {
    data: atomsData,
    loading: atomsLoading,
    error: atomsError,
  } = useQuery<AtomsQueryResult>(GET_ATOMS_BY_LABELS, {
    variables: { labels: founderNames },
    fetchPolicy: 'cache-first',
  });

  // Query 2: Get all proposals (triples) in one query
  const {
    data: proposalsData,
    loading: proposalsLoading,
    error: proposalsError,
  } = useQuery<ProposalsQueryResult>(GET_ALL_PROPOSALS, {
    fetchPolicy: 'cache-and-network',
  });

  // Process all data
  const result = useMemo(() => {
    // Create atomId map
    const atomIdMap = new Map<string, string>();
    if (atomsData?.atoms) {
      atomsData.atoms.forEach((atom) => {
        atomIdMap.set(atom.label, atom.term_id);
      });
    }

    // Group triples by founder (subject.label)
    const founderTriplesMap = new Map<string, Triple[]>();
    if (proposalsData?.triples) {
      // Filter valid triples first
      const validTriples = filterTriplesWithValidObject(proposalsData.triples);

      validTriples.forEach((triple) => {
        const founderName = triple.subject?.label;
        if (!founderName) return;

        if (!founderTriplesMap.has(founderName)) {
          founderTriplesMap.set(founderName, []);
        }
        founderTriplesMap.get(founderName)!.push(triple);
      });
    }

    // Calculate top totems for each founder
    const results: FounderResult[] = founders.map((founder) => {
      const triples = founderTriplesMap.get(founder.name) || [];

      // Aggregate by totem (object)
      const totemMap = new Map<string, TotemResult>();

      triples.forEach((triple) => {
        const totemId = triple.object?.term_id;
        if (!totemId) return;

        const trustFor = weiToEth(triple.triple_vault?.total_assets);
        const trustAgainst = weiToEth(triple.counter_term?.total_assets);

        if (totemMap.has(totemId)) {
          const existing = totemMap.get(totemId)!;
          existing.trustFor += trustFor;
          existing.trustAgainst += trustAgainst;
          existing.totalTrust = existing.trustFor + existing.trustAgainst;
          existing.netTrust = existing.trustFor - existing.trustAgainst;
        } else {
          totemMap.set(totemId, {
            id: totemId,
            label: triple.object?.label || '',
            image: triple.object?.image,
            trustFor,
            trustAgainst,
            totalTrust: trustFor + trustAgainst,
            netTrust: trustFor - trustAgainst,
          });
        }
      });

      // Sort by Total TRUST (descending) and take top N
      const topTotems = Array.from(totemMap.values())
        .sort((a, b) => b.totalTrust - a.totalTrust)
        .slice(0, topN);

      // Calculate total TRUST for this founder
      const totalTrust = Array.from(totemMap.values())
        .reduce((sum, t) => sum + t.totalTrust, 0);

      return {
        id: founder.id,
        name: founder.name,
        image: founder.image,
        atomId: atomIdMap.get(founder.name),
        topTotems,
        totalTrust,
        totemCount: totemMap.size,
      };
    });

    // Sort founders by name (alphabetical)
    results.sort((a, b) => a.name.localeCompare(b.name));

    // Calculate global stats
    const foundersWithTotems = results.filter((r) => r.topTotems.length > 0).length;
    const totalTrust = results.reduce((sum, r) => sum + r.totalTrust, 0);

    return {
      results,
      stats: {
        totalFounders: founders.length,
        foundersWithTotems,
        totalTrust,
      },
    };
  }, [founders, atomsData, proposalsData, topN]);

  // Memoize loading and error
  const loading = atomsLoading || proposalsLoading;
  const errorObj = useMemo(
    () => (atomsError || proposalsError) as Error | undefined,
    [atomsError, proposalsError]
  );

  // Memoize return value to prevent unnecessary re-renders
  return useMemo(() => ({
    results: result.results,
    loading,
    error: errorObj,
    stats: result.stats,
  }), [result.results, loading, errorObj, result.stats]);
}
