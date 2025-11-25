import { useFounderProposals } from './useFounderProposals';

/**
 * Totem details with aggregated statistics and claims
 */
export interface TotemDetails {
  totemId: string;
  totem: {
    id: string;
    label: string;
    image?: string;
  };
  founder: {
    id: string;
    name: string;
    image?: string;
  };
  claims: Array<{
    tripleId: string;
    predicate: string;
    netScore: bigint;
    trustFor: bigint;
    trustAgainst: bigint;
  }>;
  totalFor: bigint;
  totalAgainst: bigint;
  netScore: bigint;
  claimCount: number;
  winRate: number;
  isWinner: boolean;
}

/**
 * Hook to fetch details for a specific totem of a founder
 *
 * This hook fetches all proposals for a founder and filters them
 * to get only the triples for the specified totem, then aggregates
 * the voting data.
 *
 * @param founderName - Name of the founder
 * @param totemId - ID of the totem (atom term_id)
 *
 * @example
 * ```tsx
 * function TotemDetailsPage() {
 *   const { founderId, totemId } = useParams();
 *   const founderName = decodeURIComponent(founderId).replace(/-/g, ' ');
 *
 *   const { totem, loading, error } = useTotemDetails(founderName, totemId || '');
 *
 *   if (loading) return <div>Loading...</div>;
 *   if (error) return <div>Error: {error.message}</div>;
 *   if (!totem) return <div>Totem not found</div>;
 *
 *   return (
 *     <div>
 *       <h1>{totem.totem.label}</h1>
 *       <p>NET Score: {totem.netScore.toString()}</p>
 *       <p>{totem.claimCount} claims</p>
 *     </div>
 *   );
 * }
 * ```
 */
export function useTotemDetails(founderName: string, totemId: string) {
  // Fetch all proposals for this founder
  const { proposals, loading, error, refetch } = useFounderProposals(founderName);

  // Filter proposals to get only this totem
  const totemProposals = proposals.filter(
    (p) => p.object.term_id === totemId
  );

  // Build totem details
  let totemDetails: TotemDetails | null = null;

  if (totemProposals.length > 0) {
    // Extract claims from proposals
    const claims = totemProposals.map((p) => {
      const forVotes = BigInt(p.votes.forVotes);
      const againstVotes = BigInt(p.votes.againstVotes);
      return {
        tripleId: p.id,
        predicate: p.predicate?.label || 'represented_by',
        netScore: forVotes - againstVotes,
        trustFor: forVotes,
        trustAgainst: againstVotes,
      };
    });

    // Sort claims by net score
    claims.sort((a, b) => {
      if (a.netScore > b.netScore) return -1;
      if (a.netScore < b.netScore) return 1;
      return 0;
    });

    // Calculate aggregated stats
    const totalFor = claims.reduce((sum, c) => sum + c.trustFor, 0n);
    const totalAgainst = claims.reduce((sum, c) => sum + c.trustAgainst, 0n);
    const netScore = totalFor - totalAgainst;
    const winRate =
      totalFor > 0n
        ? Number((totalFor * 100n) / (totalFor + totalAgainst))
        : 0;

    // Check if this is the winning totem by comparing with all proposals
    // Convert all proposals to aggregated format
    const allTotemsMap = new Map<string, { totalFor: bigint; totalAgainst: bigint }>();

    proposals.forEach((p) => {
      const existing = allTotemsMap.get(p.object.term_id) || { totalFor: 0n, totalAgainst: 0n };
      allTotemsMap.set(p.object.term_id, {
        totalFor: existing.totalFor + BigInt(p.votes.forVotes),
        totalAgainst: existing.totalAgainst + BigInt(p.votes.againstVotes),
      });
    });

    // Find winner (highest net score)
    let winningTotemId = '';
    let highestNetScore = -Infinity;
    allTotemsMap.forEach((stats, id) => {
      const score = Number(stats.totalFor - stats.totalAgainst);
      if (score > highestNetScore) {
        highestNetScore = score;
        winningTotemId = id;
      }
    });

    const isWinner = winningTotemId === totemId;

    totemDetails = {
      totemId,
      totem: {
        id: totemProposals[0].object.term_id,
        label: totemProposals[0].object.label,
        image: totemProposals[0].object.image,
      },
      founder: {
        id: founderName,
        name: totemProposals[0].subject.label,
        image: totemProposals[0].subject.image,
      },
      claims,
      totalFor,
      totalAgainst,
      netScore,
      claimCount: claims.length,
      winRate,
      isWinner,
    };
  }

  return {
    /**
     * Totem details with aggregated statistics and claims
     * null if totem not found
     */
    totem: totemDetails,

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
