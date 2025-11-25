import { useQuery } from '@apollo/client';
import { GET_ALL_PROPOSALS } from '../lib/graphql/queries';
import type { Triple } from '../lib/graphql/types';
import { aggregateTriplesByObject } from '../utils/aggregateVotes';
import type { AggregatedTotem as BaseAggregatedTotem, Claim as BaseClaim } from '../utils/aggregateVotes';

/**
 * Extended claim with aliases for backward compatibility
 */
export interface ExtendedClaim extends BaseClaim {
  forVotes: bigint; // Alias for trustFor
  againstVotes: bigint; // Alias for trustAgainst
}

/**
 * Extended aggregated totem with founder info and top predicate
 */
export interface AggregatedTotem extends Omit<BaseAggregatedTotem, 'objectId' | 'object' | 'claims'> {
  totemId: string; // Object ID
  totemLabel: string;
  totemImage?: string;
  founder: {
    id: string;
    name: string;
    image?: string;
  };
  claims: ExtendedClaim[];
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
    // Use the aggregation utility function
    const baseAggregated = aggregateTriplesByObject(data.triples);

    // Group original triples by totem for founder info and predicate analysis
    const totemMap = new Map<string, Triple[]>();
    data.triples.forEach((triple: Triple) => {
      const totemId = triple.object.term_id;
      if (!totemMap.has(totemId)) {
        totemMap.set(totemId, []);
      }
      totemMap.get(totemId)!.push(triple);
    });

    // Extend base aggregated data with founder info and top predicate
    baseAggregated.forEach((base) => {
      const triples = totemMap.get(base.objectId)!;

      // Find most used predicate
      const predicateCounts = new Map<string, number>();
      base.claims.forEach((c) => {
        predicateCounts.set(
          c.predicate,
          (predicateCounts.get(c.predicate) || 0) + 1
        );
      });
      let topPredicate = base.claims[0]?.predicate || 'represented_by';
      let maxCount = 0;
      predicateCounts.forEach((count, pred) => {
        if (count > maxCount) {
          maxCount = count;
          topPredicate = pred;
        }
      });

      // Map claims to extended format with aliases
      const extendedClaims: ExtendedClaim[] = base.claims.map((claim) => ({
        ...claim,
        forVotes: claim.trustFor,
        againstVotes: claim.trustAgainst,
      }));

      totems.push({
        totemId: base.objectId,
        totemLabel: base.object.label,
        totemImage: base.object.image,
        founder: {
          id: triples[0].subject.label,
          name: triples[0].subject.label,
          image: triples[0].subject.image,
        },
        claims: extendedClaims,
        totalFor: base.totalFor,
        totalAgainst: base.totalAgainst,
        netScore: base.netScore,
        claimCount: base.claimCount,
        topPredicate,
      });
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
