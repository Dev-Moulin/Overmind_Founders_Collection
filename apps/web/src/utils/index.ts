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
