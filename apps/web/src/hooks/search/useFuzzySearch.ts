import Fuse, { type IFuseOptions, type FuseResult } from 'fuse.js';
import { useMemo, useRef } from 'react';

const DEFAULT_OPTIONS: Partial<IFuseOptions<unknown>> = {
  threshold: 0.3,
  minMatchCharLength: 2,
  includeScore: true,
};

/**
 * Generic fuzzy search hook using fuse.js
 *
 * Returns matching results when query has >= 2 chars, empty array otherwise.
 * Fuse instance is memoized and only recreated when items change.
 */
export function useFuzzySearch<T>(
  items: T[],
  keys: string[],
  query: string,
  options?: Partial<IFuseOptions<T>>
): FuseResult<T>[] {
  // Stable keys reference to avoid recreating Fuse on every render
  const keysRef = useRef(keys);
  keysRef.current = keys;

  const fuse = useMemo(
    () => new Fuse(items, { ...DEFAULT_OPTIONS, keys: keysRef.current, ...options } as IFuseOptions<T>),
    [items, options]
  );

  return useMemo(() => {
    if (!query || query.trim().length < 2) return [];
    return fuse.search(query.trim());
  }, [fuse, query]);
}
