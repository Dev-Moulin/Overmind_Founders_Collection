import { describe, it, expect } from 'vitest';
import {
  aggregateTriplesByObject,
  getWinningTotem,
  formatTrustAmount,
  type Triple,
} from './aggregateVotes';

describe('aggregateVotes', () => {
  describe('aggregateTriplesByObject', () => {
    it('should aggregate multiple claims for the same totem', () => {
      const triples: Triple[] = [
        {
          id: '0x1',
          predicate: { id: 'pred1', label: 'is represented by' },
          object: { id: 'lion', label: 'Lion' },
          positiveVault: { totalAssets: '50000000000000000000' }, // 50 TRUST
          negativeVault: { totalAssets: '5000000000000000000' }, // 5 TRUST
        },
        {
          id: '0x2',
          predicate: { id: 'pred2', label: 'embodies' },
          object: { id: 'lion', label: 'Lion' },
          positiveVault: { totalAssets: '30000000000000000000' }, // 30 TRUST
          negativeVault: { totalAssets: '2000000000000000000' }, // 2 TRUST
        },
        {
          id: '0x3',
          predicate: { id: 'pred3', label: 'channels' },
          object: { id: 'lion', label: 'Lion' },
          positiveVault: { totalAssets: '20000000000000000000' }, // 20 TRUST
          negativeVault: { totalAssets: '0' }, // 0 TRUST
        },
      ];

      const result = aggregateTriplesByObject(triples);

      expect(result).toHaveLength(1);
      expect(result[0].objectId).toBe('lion');
      expect(result[0].claimCount).toBe(3);
      expect(result[0].totalFor).toBe(100000000000000000000n); // 100 TRUST
      expect(result[0].totalAgainst).toBe(7000000000000000000n); // 7 TRUST
      expect(result[0].netScore).toBe(93000000000000000000n); // 93 NET
      expect(result[0].claims).toHaveLength(3);
    });

    it('should handle multiple different totems', () => {
      const triples: Triple[] = [
        {
          id: '0x1',
          predicate: { id: 'pred1', label: 'is represented by' },
          object: { id: 'lion', label: 'Lion' },
          positiveVault: { totalAssets: '50000000000000000000' },
          negativeVault: { totalAssets: '5000000000000000000' },
        },
        {
          id: '0x2',
          predicate: { id: 'pred1', label: 'is represented by' },
          object: { id: 'eagle', label: 'Eagle' },
          positiveVault: { totalAssets: '60000000000000000000' },
          negativeVault: { totalAssets: '10000000000000000000' },
        },
        {
          id: '0x3',
          predicate: { id: 'pred2', label: 'embodies' },
          object: { id: 'lion', label: 'Lion' },
          positiveVault: { totalAssets: '30000000000000000000' },
          negativeVault: { totalAssets: '0' },
        },
      ];

      const result = aggregateTriplesByObject(triples);

      expect(result).toHaveLength(2);

      // Should be sorted by NET score descending
      expect(result[0].objectId).toBe('lion'); // 75 NET
      expect(result[0].netScore).toBe(75000000000000000000n);
      expect(result[0].claimCount).toBe(2);

      expect(result[1].objectId).toBe('eagle'); // 50 NET
      expect(result[1].netScore).toBe(50000000000000000000n);
      expect(result[1].claimCount).toBe(1);
    });

    it('should handle negative NET scores', () => {
      const triples: Triple[] = [
        {
          id: '0x1',
          predicate: { id: 'pred1', label: 'is NOT represented by' },
          object: { id: 'snake', label: 'Snake' },
          positiveVault: { totalAssets: '5000000000000000000' }, // 5 FOR
          negativeVault: { totalAssets: '50000000000000000000' }, // 50 AGAINST
        },
      ];

      const result = aggregateTriplesByObject(triples);

      expect(result).toHaveLength(1);
      expect(result[0].netScore).toBe(-45000000000000000000n); // -45 NET
    });

    it('should sort totems by NET score descending', () => {
      const triples: Triple[] = [
        {
          id: '0x1',
          predicate: { id: 'pred1', label: 'is represented by' },
          object: { id: 'lion', label: 'Lion' },
          positiveVault: { totalAssets: '30000000000000000000' },
          negativeVault: { totalAssets: '0' },
        },
        {
          id: '0x2',
          predicate: { id: 'pred1', label: 'is represented by' },
          object: { id: 'eagle', label: 'Eagle' },
          positiveVault: { totalAssets: '100000000000000000000' },
          negativeVault: { totalAssets: '0' },
        },
        {
          id: '0x3',
          predicate: { id: 'pred1', label: 'is represented by' },
          object: { id: 'wolf', label: 'Wolf' },
          positiveVault: { totalAssets: '50000000000000000000' },
          negativeVault: { totalAssets: '0' },
        },
      ];

      const result = aggregateTriplesByObject(triples);

      expect(result).toHaveLength(3);
      expect(result[0].objectId).toBe('eagle'); // 100 NET
      expect(result[1].objectId).toBe('wolf'); // 50 NET
      expect(result[2].objectId).toBe('lion'); // 30 NET
    });

    it('should handle empty array', () => {
      const result = aggregateTriplesByObject([]);
      expect(result).toHaveLength(0);
    });

    it('should preserve object metadata', () => {
      const triples: Triple[] = [
        {
          id: '0x1',
          predicate: { id: 'pred1', label: 'is represented by' },
          object: {
            id: 'lion',
            label: 'Lion',
            image: 'ipfs://lion.png',
            description: 'King of the jungle',
          },
          positiveVault: { totalAssets: '50000000000000000000' },
          negativeVault: { totalAssets: '5000000000000000000' },
        },
      ];

      const result = aggregateTriplesByObject(triples);

      expect(result[0].object.label).toBe('Lion');
      expect(result[0].object.image).toBe('ipfs://lion.png');
      expect(result[0].object.description).toBe('King of the jungle');
    });
  });

  describe('getWinningTotem', () => {
    it('should return the totem with highest NET score', () => {
      const triples: Triple[] = [
        {
          id: '0x1',
          predicate: { id: 'pred1', label: 'is represented by' },
          object: { id: 'lion', label: 'Lion' },
          positiveVault: { totalAssets: '30000000000000000000' },
          negativeVault: { totalAssets: '0' },
        },
        {
          id: '0x2',
          predicate: { id: 'pred1', label: 'is represented by' },
          object: { id: 'eagle', label: 'Eagle' },
          positiveVault: { totalAssets: '100000000000000000000' },
          negativeVault: { totalAssets: '0' },
        },
      ];

      const aggregated = aggregateTriplesByObject(triples);
      const winner = getWinningTotem(aggregated);

      expect(winner).not.toBeNull();
      expect(winner?.objectId).toBe('eagle');
      expect(winner?.netScore).toBe(100000000000000000000n);
    });

    it('should return null for empty array', () => {
      const winner = getWinningTotem([]);
      expect(winner).toBeNull();
    });

    it('should handle single totem', () => {
      const triples: Triple[] = [
        {
          id: '0x1',
          predicate: { id: 'pred1', label: 'is represented by' },
          object: { id: 'lion', label: 'Lion' },
          positiveVault: { totalAssets: '50000000000000000000' },
          negativeVault: { totalAssets: '5000000000000000000' },
        },
      ];

      const aggregated = aggregateTriplesByObject(triples);
      const winner = getWinningTotem(aggregated);

      expect(winner).not.toBeNull();
      expect(winner?.objectId).toBe('lion');
    });

    it('should handle negative NET score winner', () => {
      const triples: Triple[] = [
        {
          id: '0x1',
          predicate: { id: 'pred1', label: 'is NOT' },
          object: { id: 'lion', label: 'Lion' },
          positiveVault: { totalAssets: '5000000000000000000' },
          negativeVault: { totalAssets: '50000000000000000000' },
        },
        {
          id: '0x2',
          predicate: { id: 'pred1', label: 'is NOT' },
          object: { id: 'eagle', label: 'Eagle' },
          positiveVault: { totalAssets: '1000000000000000000' },
          negativeVault: { totalAssets: '100000000000000000000' },
        },
      ];

      const aggregated = aggregateTriplesByObject(triples);
      const winner = getWinningTotem(aggregated);

      expect(winner).not.toBeNull();
      expect(winner?.objectId).toBe('lion'); // -45 is better than -99
      expect(winner?.netScore).toBe(-45000000000000000000n);
    });
  });

  describe('formatTrustAmount', () => {
    it('should format whole numbers', () => {
      expect(formatTrustAmount(1000000000000000000n)).toBe('1.00');
      expect(formatTrustAmount(10000000000000000000n)).toBe('10.00');
      expect(formatTrustAmount(100000000000000000000n)).toBe('100.00');
    });

    it('should format decimals', () => {
      expect(formatTrustAmount(1500000000000000000n)).toBe('1.50');
      expect(formatTrustAmount(1230000000000000000n)).toBe('1.23');
      expect(formatTrustAmount(999000000000000000n)).toBe('0.99');
    });

    it('should handle small amounts', () => {
      expect(formatTrustAmount(123456789012345678n)).toBe('0.12');
      expect(formatTrustAmount(1000000000000000n)).toBe('0.00');
    });

    it('should handle zero', () => {
      expect(formatTrustAmount(0n)).toBe('0.00');
    });

    it('should support custom decimal places', () => {
      expect(formatTrustAmount(1234560000000000000n, 4)).toBe('1.2345');
      expect(formatTrustAmount(1000000000000000000n, 0)).toBe('1.');
      expect(formatTrustAmount(1500000000000000000n, 1)).toBe('1.5');
    });

    it('should truncate without rounding', () => {
      expect(formatTrustAmount(1996000000000000000n, 2)).toBe('1.99');
      expect(formatTrustAmount(1994000000000000000n, 2)).toBe('1.99');
      expect(formatTrustAmount(1999000000000000000n, 2)).toBe('1.99');
    });

    it('should handle large amounts', () => {
      expect(formatTrustAmount(1000000000000000000000n)).toBe('1000.00');
      expect(formatTrustAmount(1234567890000000000000n)).toBe('1234.56');
    });
  });
});
