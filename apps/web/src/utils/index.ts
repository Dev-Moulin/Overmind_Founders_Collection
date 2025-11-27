export {
  aggregateTriplesByObject,
  getWinningTotem,
  formatTrustAmount,
  type Triple,
  type Claim,
  type AggregatedTotem,
} from './aggregateVotes';

export { getFounderImageUrl } from './founderImage';

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
