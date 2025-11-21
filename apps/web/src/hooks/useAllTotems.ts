import { useQuery } from '@apollo/client';
import { GET_ALL_PROPOSALS } from '../lib/graphql/queries';
import type { Triple } from '../lib/graphql/types';

/**
 * Aggregated totem with all its claims
 */
export interface AggregatedTotem {
  totemId: string; // Object ID
  totemLabel: string;
  totemImage?: string;
  founder: {
    id: string;
    name: string;
    image?: string;
  };
  claims: Array<{
    tripleId: string;
    predicate: string;
    forVotes: bigint;
    againstVotes: bigint;
    netScore: bigint;
  }>;
  totalFor: bigint;
  totalAgainst: bigint;
  netScore: bigint;
  claimCount: number;
  topPredicate: string; // Most used predicate
}

/**
 * Hook to fetch all totems aggregated by object (totem)
 *
 * Groups all triples by their object (totem) and aggregates vote stats.
 * Used by VotePage to display totems with multiple claims.
 *
 * @example
 * ```tsx
 * function VotePage() {
 *   const { totems, loading, error } = useAllTotems();
 *
 *   return (
 *     <div>
 *       {totems.map(totem => (
 *         <TotemCard key={totem.totemId} totem={totem} />
 *       ))}
 *     </div>
 *   );
 * }
 * ```
 */
export function useAllTotems() {
  const { data, loading, error, refetch } = useQuery(GET_ALL_PROPOSALS, {
    fetchPolicy: 'cache-and-network',
  });

  const totems: AggregatedTotem[] = [];

  if (data?.triples) {
    // Group triples by totem (object)
    const totemMap = new Map<string, Triple[]>();

    data.triples.forEach((triple: Triple) => {
      const totemId = triple.object.id;
      if (!totemMap.has(totemId)) {
        totemMap.set(totemId, []);
      }
      totemMap.get(totemId)!.push(triple);
    });

    // Aggregate each totem
    totemMap.forEach((triples, totemId) => {
      // Extract claims
      const claims = triples.map((t) => {
        const forVotes = BigInt(t.positiveVault?.totalAssets || '0');
        const againstVotes = BigInt(t.negativeVault?.totalAssets || '0');
        return {
          tripleId: t.id,
          predicate: t.predicate?.label || 'represented_by',
          forVotes,
          againstVotes,
          netScore: forVotes - againstVotes,
        };
      });

      // Sort claims by net score
      claims.sort((a, b) => {
        if (a.netScore > b.netScore) return -1;
        if (a.netScore < b.netScore) return 1;
        return 0;
      });

      // Calculate total stats
      const totalFor = claims.reduce((sum, c) => sum + c.forVotes, 0n);
      const totalAgainst = claims.reduce((sum, c) => sum + c.againstVotes, 0n);
      const netScore = totalFor - totalAgainst;

      // Find most used predicate
      const predicateCounts = new Map<string, number>();
      claims.forEach((c) => {
        predicateCounts.set(
          c.predicate,
          (predicateCounts.get(c.predicate) || 0) + 1
        );
      });
      let topPredicate = claims[0]?.predicate || 'represented_by';
      let maxCount = 0;
      predicateCounts.forEach((count, pred) => {
        if (count > maxCount) {
          maxCount = count;
          topPredicate = pred;
        }
      });

      totems.push({
        totemId,
        totemLabel: triples[0].object.label,
        totemImage: triples[0].object.image,
        founder: {
          id: triples[0].subject.label,
          name: triples[0].subject.label,
          image: triples[0].subject.image,
        },
        claims,
        totalFor,
        totalAgainst,
        netScore,
        claimCount: claims.length,
        topPredicate,
      });
    });

    // Sort totems by net score (highest first)
    totems.sort((a, b) => {
      if (a.netScore > b.netScore) return -1;
      if (a.netScore < b.netScore) return 1;
      return 0;
    });
  }

  return {
    /**
     * Array of aggregated totems
     */
    totems,

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
  };
}
