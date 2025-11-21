import type { Hex } from 'viem';

/**
 * Cache entry for a predicate or object
 */
interface CachedItem {
  id: Hex;
  label: string;
  image?: string;
  createdAt: number;
}

/**
 * Cache data structure stored in localStorage
 */
interface CachedData {
  predicates: CachedItem[];
  objects: CachedItem[];
  lastUpdated: number;
}

/**
 * localStorage key for the cache
 */
const CACHE_KEY = 'intuition-cache-v1';

/**
 * Time-to-live for cached items (7 days in milliseconds)
 */
const TTL_MS = 7 * 24 * 60 * 60 * 1000;

/**
 * Get the cache from localStorage, with automatic TTL cleanup
 */
function getCache(): CachedData {
  try {
    const cached = localStorage.getItem(CACHE_KEY);

    if (!cached) {
      return {
        predicates: [],
        objects: [],
        lastUpdated: Date.now(),
      };
    }

    const data: CachedData = JSON.parse(cached);

    // Automatic cleanup: remove items older than TTL
    const cutoff = Date.now() - TTL_MS;
    data.predicates = data.predicates.filter((p) => p.createdAt > cutoff);
    data.objects = data.objects.filter((o) => o.createdAt > cutoff);

    return data;
  } catch (error) {
    console.error('Error reading cache:', error);
    return {
      predicates: [],
      objects: [],
      lastUpdated: Date.now(),
    };
  }
}

/**
 * Save the cache to localStorage
 */
function saveCache(data: CachedData): void {
  try {
    data.lastUpdated = Date.now();
    localStorage.setItem(CACHE_KEY, JSON.stringify(data));
  } catch (error) {
    console.error('Error saving cache:', error);
  }
}

/**
 * Cache a newly created predicate
 *
 * @param id - The predicate atom ID (termId)
 * @param label - The predicate label
 *
 * @example
 * ```ts
 * const atom = await createAtomFromString('embodies');
 * cacheNewPredicate(atom.state.termId, 'embodies');
 * ```
 */
export function cacheNewPredicate(id: Hex, label: string): void {
  const cache = getCache();

  // Avoid duplicates
  if (cache.predicates.some((p) => p.id === id)) {
    return;
  }

  cache.predicates.push({
    id,
    label,
    createdAt: Date.now(),
  });

  saveCache(cache);
}

/**
 * Cache a newly created object (totem)
 *
 * @param id - The object atom ID (termId)
 * @param label - The object label
 * @param image - Optional image URL or IPFS hash
 *
 * @example
 * ```ts
 * const atom = await createAtomFromThing({
 *   name: 'Lion',
 *   description: '...',
 *   image: 'ipfs://...'
 * });
 * cacheNewObject(atom.state.termId, 'Lion', 'ipfs://...');
 * ```
 */
export function cacheNewObject(
  id: Hex,
  label: string,
  image?: string
): void {
  const cache = getCache();

  // Avoid duplicates
  if (cache.objects.some((o) => o.id === id)) {
    return;
  }

  cache.objects.push({
    id,
    label,
    image,
    createdAt: Date.now(),
  });

  saveCache(cache);
}

/**
 * Get all cached predicates
 *
 * @returns Array of cached predicates with automatic TTL cleanup
 */
export function getCachedPredicates(): CachedItem[] {
  return getCache().predicates;
}

/**
 * Get all cached objects (totems)
 *
 * @returns Array of cached objects with automatic TTL cleanup
 */
export function getCachedObjects(): CachedItem[] {
  return getCache().objects;
}

/**
 * Remove a predicate from cache (e.g., when it appears in GraphQL)
 *
 * @param id - The predicate atom ID to remove
 */
export function removeCachedPredicate(id: Hex): void {
  const cache = getCache();
  cache.predicates = cache.predicates.filter((p) => p.id !== id);
  saveCache(cache);
}

/**
 * Remove an object from cache (e.g., when it appears in GraphQL)
 *
 * @param id - The object atom ID to remove
 */
export function removeCachedObject(id: Hex): void {
  const cache = getCache();
  cache.objects = cache.objects.filter((o) => o.id !== id);
  saveCache(cache);
}

/**
 * Clear all cached data
 */
export function clearCache(): void {
  try {
    localStorage.removeItem(CACHE_KEY);
  } catch (error) {
    console.error('Error clearing cache:', error);
  }
}

/**
 * Get cache statistics
 *
 * @returns Object with cache stats
 */
export function getCacheStats() {
  const cache = getCache();
  return {
    predicateCount: cache.predicates.length,
    objectCount: cache.objects.length,
    lastUpdated: new Date(cache.lastUpdated),
    oldestItem: cache.predicates
      .concat(cache.objects)
      .reduce((oldest, item) => {
        return item.createdAt < oldest ? item.createdAt : oldest;
      }, Date.now()),
  };
}
