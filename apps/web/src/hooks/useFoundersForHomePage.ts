import { useMemo } from 'react';
import { useQuery } from '@apollo/client';
import foundersData from '../../../../packages/shared/src/data/founders.json';
import type { FounderData } from '../components/FounderCard';
import { GET_ATOMS_BY_LABELS, GET_ALL_PROPOSALS } from '../lib/graphql/queries';
import type { Triple } from '../lib/graphql/types';
import { aggregateTriplesByObject } from '../utils/aggregateVotes';

/**
 * Trend direction for score changes
 */
export type TrendDirection = 'up' | 'down' | 'neutral';

/**
 * Winning totem data for a founder
 */
export interface WinningTotem {
  objectId: string;
  label: string;
  image?: string;
  netScore: bigint;
  totalFor: bigint;
  totalAgainst: bigint;
  claimCount: number;
  /** Trend based on FOR/AGAINST ratio: up if > 60% FOR, down if < 40% FOR, neutral otherwise */
  trend: TrendDirection;
}

/**
 * Founder data enriched with atomId and winning totem for HomePage
 */
export interface FounderForHomePage extends FounderData {
  winningTotem: WinningTotem | null;
  proposalCount: number;
  /** Number of new totems proposed in the last 24 hours */
  recentActivityCount: number;
}

interface AtomResult {
  term_id: string;
  label: string;
}

interface AtomsQueryResult {
  atoms: AtomResult[];
}

interface ProposalsQueryResult {
  triples: Triple[];
}

/**
 * Hook to get all 42 founders with their atomIds and winning totems
 *
 * Combines:
 * 1. Static founders data from JSON (all 42 founders)
 * 2. AtomIds from INTUITION GraphQL
 * 3. Winning totems calculated from all proposals
 *
 * @example
 * ```tsx
 * function HomePage() {
 *   const { founders, loading, stats } = useFoundersForHomePage();
 *
 *   return (
 *     <div className="grid grid-cols-4 gap-4">
 *       {founders.map(founder => (
 *         <FounderHomeCard key={founder.id} founder={founder} />
 *       ))}
 *     </div>
 *   );
 * }
 * ```
 */
export function useFoundersForHomePage() {
  const founders = foundersData as FounderData[];
  const founderNames = founders.map((f) => f.name);

  // Query 1: Get atomIds for all founders
  const {
    data: atomsData,
    loading: atomsLoading,
    error: atomsError,
  } = useQuery<AtomsQueryResult>(GET_ATOMS_BY_LABELS, {
    variables: { labels: founderNames },
    fetchPolicy: 'cache-first',
  });

  // Query 2: Get all proposals (triples)
  const {
    data: proposalsData,
    loading: proposalsLoading,
    error: proposalsError,
  } = useQuery<ProposalsQueryResult>(GET_ALL_PROPOSALS, {
    fetchPolicy: 'cache-and-network',
  });

  // Process data
  const result = useMemo(() => {
    // Create atomId map
    const atomIdMap = new Map<string, string>();
    if (atomsData?.atoms) {
      atomsData.atoms.forEach((atom) => {
        atomIdMap.set(atom.label, atom.term_id);
      });
    }

    // Create winning totem map by founder name
    const winningTotemMap = new Map<string, WinningTotem>();
    const proposalCountMap = new Map<string, number>();
    const recentActivityMap = new Map<string, number>();

    // Calculate 24 hours ago timestamp
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    if (proposalsData?.triples) {
      // Group triples by founder (subject.label)
      const founderTriples = new Map<string, Triple[]>();
      proposalsData.triples.forEach((triple) => {
        const founderName = triple.subject.label;
        if (!founderTriples.has(founderName)) {
          founderTriples.set(founderName, []);
        }
        founderTriples.get(founderName)!.push(triple);
      });

      // For each founder, calculate winning totem and recent activity
      founderTriples.forEach((triples, founderName) => {
        // Count recent triples (created in last 24h)
        const recentCount = triples.filter((t) => {
          if (!t.created_at) return false;
          const createdAt = new Date(t.created_at);
          return createdAt > twentyFourHoursAgo;
        }).length;
        recentActivityMap.set(founderName, recentCount);

        // Convert to format expected by aggregateTriplesByObject
        const formattedTriples = triples.map((t) => ({
          term_id: t.term_id,
          predicate: { term_id: t.predicate?.term_id || '', label: t.predicate?.label || '' },
          object: t.object,
          triple_vault: { total_assets: t.triple_vault?.total_assets || '0' },
          counter_term: { id: '', total_assets: t.counter_term?.total_assets || '0' },
        }));

        // Aggregate by totem
        const aggregatedTotems = aggregateTriplesByObject(formattedTriples);

        // Store proposal count (unique totems)
        proposalCountMap.set(founderName, aggregatedTotems.length);

        // Winning totem is the one with highest NET score (already sorted)
        if (aggregatedTotems.length > 0) {
          const winner = aggregatedTotems[0];

          // Calculate trend based on FOR/AGAINST ratio
          const total = winner.totalFor + winner.totalAgainst;
          let trend: TrendDirection = 'neutral';
          if (total > 0n) {
            const forPercentage = Number((winner.totalFor * 100n) / total);
            if (forPercentage > 60) {
              trend = 'up';
            } else if (forPercentage < 40) {
              trend = 'down';
            }
          }

          winningTotemMap.set(founderName, {
            objectId: winner.objectId,
            label: winner.object.label,
            image: winner.object.image,
            netScore: winner.netScore,
            totalFor: winner.totalFor,
            totalAgainst: winner.totalAgainst,
            claimCount: winner.claimCount,
            trend,
          });
        }
      });
    }

    // Combine all data for each founder
    const enrichedFounders: FounderForHomePage[] = founders.map((founder) => ({
      ...founder,
      atomId: atomIdMap.get(founder.name),
      winningTotem: winningTotemMap.get(founder.name) || null,
      proposalCount: proposalCountMap.get(founder.name) || 0,
      recentActivityCount: recentActivityMap.get(founder.name) || 0,
    }));

    // Calculate stats
    const foundersWithAtoms = enrichedFounders.filter((f) => f.atomId).length;
    const foundersWithTotems = enrichedFounders.filter((f) => f.winningTotem).length;
    const totalProposals = Array.from(proposalCountMap.values()).reduce((sum, count) => sum + count, 0);

    return {
      founders: enrichedFounders,
      stats: {
        totalFounders: founders.length,
        foundersWithAtoms,
        foundersWithTotems,
        totalProposals,
      },
    };
  }, [founders, atomsData, proposalsData]);

  return {
    founders: result.founders,
    loading: atomsLoading || proposalsLoading,
    error: atomsError || proposalsError,
    stats: result.stats,
  };
}
