export {
  aggregateTriplesByObject,
  getWinningTotem,
  formatTrustAmount,
  type Triple,
  type Claim,
  type AggregatedTotem,
} from './aggregateVotes';

export {
  cacheNewPredicate,
  cacheNewObject,
  getCachedPredicates,
  getCachedObjects,
  removeCachedPredicate,
  removeCachedObject,
  clearCache,
  getCacheStats,
} from './localCache';

export {
  formatError,
  isUserRejection,
  isRetryableError,
  type FormattedError,
} from './errorFormatter';

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
