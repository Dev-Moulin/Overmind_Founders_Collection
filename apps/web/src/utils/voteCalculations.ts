import type { Triple, TripleVoteCounts, ProposalWithVotes } from '../lib/graphql/types';

/**
 * Calculate vote counts and statistics for a triple
 */
export function calculateVoteCounts(triple: Triple): TripleVoteCounts {
  const forVotes = triple.triple_vault?.total_assets || '0';
  const againstVotes = triple.counter_term?.total_assets || '0';
  const forShares = triple.triple_vault?.total_shares || '0';
  const againstShares = '0'; // counter_term doesn't have shares in V2 schema

  // Calculate net votes (FOR - AGAINST)
  const forBigInt = BigInt(forVotes);
  const againstBigInt = BigInt(againstVotes);
  const netVotes = (forBigInt - againstBigInt).toString();

  return {
    forVotes,
    againstVotes,
    netVotes,
    forShares,
    againstShares,
  };
}

/**
 * Calculate percentage of FOR votes vs total votes
 */
export function calculatePercentage(votes: TripleVoteCounts): number {
  const forBigInt = BigInt(votes.forVotes);
  const againstBigInt = BigInt(votes.againstVotes);
  const total = forBigInt + againstBigInt;

  if (total === 0n) return 0;

  // Calculate percentage: (FOR / TOTAL) * 100
  return Number((forBigInt * 100n) / total);
}

/**
 * Enrich triple with vote data
 */
export function enrichTripleWithVotes(triple: Triple): ProposalWithVotes {
  const votes = calculateVoteCounts(triple);
  const percentage = calculatePercentage(votes);

  return {
    ...triple,
    votes,
    percentage,
  };
}
