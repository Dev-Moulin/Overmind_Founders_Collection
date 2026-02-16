/**
 * Query Cache TTL - Time-based cache expiration for Apollo queries
 *
 * Apollo's InMemoryCache doesn't have built-in TTL support.
 * This module provides a simple TTL mechanism that decides whether to
 * use cached data or fetch fresh data from the network.
 *
 * @see https://www.redsunsoft.com/2021/10/simple-cache-expiration-for-apollo-graphql-queries/
 * @see https://github.com/apollographql/apollo-client/issues/10274
 */

import type { WatchQueryFetchPolicy } from '@apollo/client';

/** Time constants */
export const ONE_SECOND = 1000;
export const ONE_MINUTE = ONE_SECOND * 60;
export const TWO_MINUTES = ONE_MINUTE * 2;
export const FIVE_MINUTES = ONE_MINUTE * 5;
export const TEN_MINUTES = ONE_MINUTE * 10;

/** Default TTL for queries (2 minutes) */
export const DEFAULT_TTL = TWO_MINUTES;

/** Map storing last fetch timestamps by query key */
const queryTimestamps = new Map<string, number>();

/**
 * Generate a unique cache key for a query based on name and variables
 *
 * @example
 * getCacheKey('GetFounderProposals', { founderName: 'Joseph Lubin' })
 * // Returns: 'GetFounderProposals:{"founderName":"Joseph Lubin"}'
 */
export function getCacheKey(
  queryName: string,
  variables?: Record<string, unknown>
): string {
  if (!variables || Object.keys(variables).length === 0) {
    return queryName;
  }
  // Sort keys for consistent cache keys
  const sortedVars = Object.keys(variables)
    .sort()
    .reduce((acc, key) => {
      acc[key] = variables[key];
      return acc;
    }, {} as Record<string, unknown>);
  return `${queryName}:${JSON.stringify(sortedVars)}`;
}

/**
 * Get the appropriate fetch policy based on cache TTL
 *
 * - If data was fetched within the TTL, returns 'cache-first' (use cache)
 * - If data is stale or never fetched, returns 'cache-and-network' (fetch fresh)
 *
 * @param queryName - Name of the GraphQL query
 * @param variables - Query variables (used to create unique cache key)
 * @param ttlMs - Time to live in milliseconds (default: 5 minutes)
 * @returns The fetch policy to use
 *
 * @example
 * ```ts
 * const { data } = useQuery(GET_FOUNDER_PROPOSALS, {
 *   variables: { founderName },
 *   fetchPolicy: getCacheFetchPolicy('GetFounderProposals', { founderName }),
 * });
 * ```
 */
export function getCacheFetchPolicy(
  queryName: string,
  variables?: Record<string, unknown>,
  ttlMs: number = DEFAULT_TTL
): WatchQueryFetchPolicy {
  const cacheKey = getCacheKey(queryName, variables);
  const lastFetchTime = queryTimestamps.get(cacheKey);
  const now = Date.now();

  // If never fetched or data is stale, fetch from network
  if (!lastFetchTime || (now - lastFetchTime) > ttlMs) {
    // Mark as fetched now
    queryTimestamps.set(cacheKey, now);
    // Use cache-and-network to show cached data immediately while fetching fresh
    return 'cache-and-network';
  }

  // Data is fresh, use cache only
  return 'cache-first';
}

/**
 * Manually invalidate a cache entry (force refetch on next query)
 *
 * @param queryName - Name of the GraphQL query
 * @param variables - Query variables
 *
 * @example
 * ```ts
 * // After a mutation, invalidate related queries
 * invalidateQueryCache('GetFounderProposals', { founderName: 'Joseph Lubin' });
 * ```
 */
export function invalidateQueryCache(
  queryName: string,
  variables?: Record<string, unknown>
): void {
  const cacheKey = getCacheKey(queryName, variables);
  queryTimestamps.delete(cacheKey);
}

/**
 * Invalidate all cache entries matching a query name (any variables)
 *
 * @param queryName - Name of the GraphQL query
 *
 * @example
 * ```ts
 * // After a mutation affecting all founders
 * invalidateAllQueryCache('GetFounderProposals');
 * ```
 */
export function invalidateAllQueryCache(queryName: string): void {
  const prefix = queryName + ':';
  for (const key of queryTimestamps.keys()) {
    if (key === queryName || key.startsWith(prefix)) {
      queryTimestamps.delete(key);
    }
  }
}

/**
 * Clear all cached timestamps (force refetch all queries)
 */
export function clearAllQueryCache(): void {
  queryTimestamps.clear();
}

/**
 * Get cache statistics for debugging
 */
export function getCacheStats(): {
  totalEntries: number;
  entries: Array<{ key: string; age: number; ageFormatted: string }>;
} {
  const now = Date.now();
  const entries = Array.from(queryTimestamps.entries()).map(([key, time]) => {
    const age = now - time;
    const ageMinutes = Math.floor(age / ONE_MINUTE);
    const ageSeconds = Math.floor((age % ONE_MINUTE) / ONE_SECOND);
    return {
      key,
      age,
      ageFormatted: `${ageMinutes}m ${ageSeconds}s`,
    };
  });

  return {
    totalEntries: entries.length,
    entries,
  };
}
