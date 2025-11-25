import { useQuery } from '@apollo/client';
import { GET_ALL_PROPOSALS } from '../lib/graphql/queries';
import type { Triple } from '../lib/graphql/types';
import { aggregateTriplesByObject } from '../utils/aggregateVotes';

/**
 * Founder with aggregated totem data
 */
export interface FounderWithTotem {
  id: string; // Founder name used as ID
  name: string;
  image?: string;
  winningTotem?: {
    objectId: string;
    object: {
      id: string;
      label: string;
      image?: string;
      description?: string;
    };
    netScore: bigint;
    totalFor: bigint;
    totalAgainst: bigint;
    claimCount: number;
  };
  totalProposals: number; // Total unique totems proposed
  totalClaims: number; // Total triples (can be multiple per totem)
  totalVoters: number; // Unique voters (approximation)
}

/**
 * Hook to fetch all proposals and group them by founder
 *
 * Returns a list of founders with their winning totems and statistics.
 *
 * @example
 * ```tsx
 * function ResultsPage() {
 *   const { founders, loading, error, refetch } = useAllProposals();
 *
 *   if (loading) return <div>Loading...</div>;
 *   if (error) return <div>Error: {error.message}</div>;
 *
 *   return (
 *     <div>
 *       {founders.map(founder => (
 *         <div key={founder.id}>
 *           <h2>{founder.name}</h2>
 *           {founder.winningTotem && (
 *             <p>Winning totem: {founder.winningTotem.object.label}</p>
 *           )}
 *         </div>
 *       ))}
 *     </div>
 *   );
 * }
 * ```
 */
export function useAllProposals() {
  const { data, loading, error, refetch } = useQuery(GET_ALL_PROPOSALS, {
    fetchPolicy: 'cache-and-network',
  });

  // Group triples by founder (subject.label)
  const founders: FounderWithTotem[] = [];

  if (data?.triples) {
    const founderMap = new Map<string, Triple[]>();

    // Group by founder name
    data.triples.forEach((triple: Triple) => {
      const founderName = triple.subject.label;
      if (!founderMap.has(founderName)) {
        founderMap.set(founderName, []);
      }
      founderMap.get(founderName)!.push(triple);
    });

    // For each founder, aggregate totems and find winner
    founderMap.forEach((triples, founderName) => {
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

      // Winning totem is the one with highest NET score
      const winningTotem = aggregatedTotems.length > 0 ? aggregatedTotems[0] : undefined;

      // Count unique voters (approximate from vault shares)
      const totalVoters = 0; // TODO: Calculate from deposits if needed

      founders.push({
        id: founderName,
        name: founderName,
        image: triples[0]?.subject?.image,
        winningTotem,
        totalProposals: aggregatedTotems.length,
        totalClaims: triples.length,
        totalVoters,
      });
    });

    // Sort founders alphabetically
    founders.sort((a, b) => a.name.localeCompare(b.name));
  }

  return {
    /**
     * Array of founders with their winning totems
     */
    founders,

    /**
     * Loading state
     */
    loading,

    /**
     * Error if query fails
     */
    error,

    /**
     * Refetch function to manually refresh data
     */
    refetch,

    /**
     * Total number of unique founders
     */
    totalFounders: founders.length,

    /**
     * Total number of proposals (unique totems across all founders)
     */
    totalProposals: founders.reduce((sum, f) => sum + f.totalProposals, 0),

    /**
     * Total number of claims (total triples)
     */
    totalClaims: founders.reduce((sum, f) => sum + f.totalClaims, 0),

    /**
     * Number of founders with at least one winning totem
     */
    foundersWithWinners: founders.filter((f) => f.winningTotem).length,
  };
}
