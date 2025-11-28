export {
  aggregateTriplesByObject,
  getWinningTotem,
  formatTrustAmount,
  type Triple,
  type Claim,
  type AggregatedTotem,
} from './aggregateVotes';

export { getFounderImageUrl } from './founderImage';

export {
  calculateVoteCounts,
  calculatePercentage,
  enrichTripleWithVotes,
} from './voteCalculations';

// GraphQL types
export type {
  Atom,
  Triple as GraphQLTriple,
  Deposit,
  Position,
  Vault,
  Account,
  VaultType,
  AtomType,
  ProposalWithVotes,
  TripleVoteCounts,
} from '../lib/graphql/types';
