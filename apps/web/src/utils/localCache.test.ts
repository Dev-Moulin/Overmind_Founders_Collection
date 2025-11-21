import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  cacheNewPredicate,
  cacheNewObject,
  getCachedPredicates,
  getCachedObjects,
  removeCachedPredicate,
  removeCachedObject,
  clearCache,
  getCacheStats,
} from './localCache';
import type { Hex } from 'viem';

describe('localCache', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
  });

  describe('cacheNewPredicate', () => {
    it('should cache a new predicate', () => {
      const id: Hex = '0x1234';
      const label = 'embodies';

      cacheNewPredicate(id, label);

      const cached = getCachedPredicates();
      expect(cached).toHaveLength(1);
      expect(cached[0].id).toBe(id);
      expect(cached[0].label).toBe(label);
      expect(cached[0].createdAt).toBeGreaterThan(0);
    });

    it('should not cache duplicate predicates', () => {
      const id: Hex = '0x1234';
      const label = 'embodies';

      cacheNewPredicate(id, label);
      cacheNewPredicate(id, label); // Duplicate

      const cached = getCachedPredicates();
      expect(cached).toHaveLength(1);
    });

    it('should cache multiple different predicates', () => {
      cacheNewPredicate('0x1234' as Hex, 'embodies');
      cacheNewPredicate('0x5678' as Hex, 'channels');
      cacheNewPredicate('0x9abc' as Hex, 'resonates with');

      const cached = getCachedPredicates();
      expect(cached).toHaveLength(3);
    });
  });

  describe('cacheNewObject', () => {
    it('should cache a new object without image', () => {
      const id: Hex = '0x1234';
      const label = 'Lion';

      cacheNewObject(id, label);

      const cached = getCachedObjects();
      expect(cached).toHaveLength(1);
      expect(cached[0].id).toBe(id);
      expect(cached[0].label).toBe(label);
      expect(cached[0].image).toBeUndefined();
    });

    it('should cache a new object with image', () => {
      const id: Hex = '0x1234';
      const label = 'Lion';
      const image = 'ipfs://QmXxx';

      cacheNewObject(id, label, image);

      const cached = getCachedObjects();
      expect(cached).toHaveLength(1);
      expect(cached[0].image).toBe(image);
    });

    it('should not cache duplicate objects', () => {
      const id: Hex = '0x1234';
      const label = 'Lion';

      cacheNewObject(id, label);
      cacheNewObject(id, label); // Duplicate

      const cached = getCachedObjects();
      expect(cached).toHaveLength(1);
    });
  });

  describe('removeCachedPredicate', () => {
    it('should remove a predicate from cache', () => {
      const id: Hex = '0x1234';
      cacheNewPredicate(id, 'embodies');

      expect(getCachedPredicates()).toHaveLength(1);

      removeCachedPredicate(id);

      expect(getCachedPredicates()).toHaveLength(0);
    });

    it('should not affect other predicates', () => {
      cacheNewPredicate('0x1234' as Hex, 'embodies');
      cacheNewPredicate('0x5678' as Hex, 'channels');

      removeCachedPredicate('0x1234' as Hex);

      const cached = getCachedPredicates();
      expect(cached).toHaveLength(1);
      expect(cached[0].id).toBe('0x5678');
    });
  });

  describe('removeCachedObject', () => {
    it('should remove an object from cache', () => {
      const id: Hex = '0x1234';
      cacheNewObject(id, 'Lion');

      expect(getCachedObjects()).toHaveLength(1);

      removeCachedObject(id);

      expect(getCachedObjects()).toHaveLength(0);
    });
  });

  describe('clearCache', () => {
    it('should clear all cached data', () => {
      cacheNewPredicate('0x1234' as Hex, 'embodies');
      cacheNewObject('0x5678' as Hex, 'Lion');

      expect(getCachedPredicates()).toHaveLength(1);
      expect(getCachedObjects()).toHaveLength(1);

      clearCache();

      expect(getCachedPredicates()).toHaveLength(0);
      expect(getCachedObjects()).toHaveLength(0);
    });
  });

  describe('TTL cleanup', () => {
    it('should remove items older than 7 days', () => {
      // Mock Date.now() to simulate old items
      const now = Date.now();
      const eightDaysAgo = now - 8 * 24 * 60 * 60 * 1000;

      // Manually add old item to localStorage
      localStorage.setItem(
        'intuition-cache-v1',
        JSON.stringify({
          predicates: [
            {
              id: '0x1234',
              label: 'old predicate',
              createdAt: eightDaysAgo,
            },
          ],
          objects: [],
          lastUpdated: now,
        })
      );

      // Getting cache should trigger TTL cleanup
      const cached = getCachedPredicates();
      expect(cached).toHaveLength(0); // Old item removed
    });

    it('should keep items within TTL', () => {
      const id: Hex = '0x1234';
      cacheNewPredicate(id, 'embodies');

      // Wait 1ms to ensure createdAt is in the past
      vi.useFakeTimers();
      vi.advanceTimersByTime(1);

      const cached = getCachedPredicates();
      expect(cached).toHaveLength(1);

      vi.useRealTimers();
    });
  });

  describe('getCacheStats', () => {
    it('should return correct stats', () => {
      cacheNewPredicate('0x1234' as Hex, 'embodies');
      cacheNewPredicate('0x5678' as Hex, 'channels');
      cacheNewObject('0x9abc' as Hex, 'Lion');

      const stats = getCacheStats();

      expect(stats.predicateCount).toBe(2);
      expect(stats.objectCount).toBe(1);
      expect(stats.lastUpdated).toBeInstanceOf(Date);
    });

    it('should return zeros for empty cache', () => {
      const stats = getCacheStats();

      expect(stats.predicateCount).toBe(0);
      expect(stats.objectCount).toBe(0);
    });
  });

  describe('error handling', () => {
    it('should handle localStorage errors gracefully', () => {
      // Mock localStorage to throw error
      const mockSetItem = vi.spyOn(Storage.prototype, 'setItem');
      mockSetItem.mockImplementation(() => {
        throw new Error('QuotaExceededError');
      });

      // Should not throw
      expect(() => {
        cacheNewPredicate('0x1234' as Hex, 'embodies');
      }).not.toThrow();

      mockSetItem.mockRestore();
    });

    it('should handle corrupted cache data', () => {
      // Manually set corrupted data
      localStorage.setItem('intuition-cache-v1', 'invalid json');

      // Should return empty cache instead of throwing
      expect(() => {
        const cached = getCachedPredicates();
        expect(cached).toHaveLength(0);
      }).not.toThrow();
    });
  });
});
