import { describe, it, expect, vi } from 'vitest';
import type { Hex, Address } from 'viem';
import {
  chunkArray,
  chunkBatchArrays,
  applySlippage,
  previewDepositBatch,
  previewRedeemBatch,
  calculateMinSharesBatch,
  calculateMinAssetsBatch,
} from './utils';

// ============================================================
// Pure functions
// ============================================================

describe('chunkArray', () => {
  it('should return a single chunk when array is smaller than size', () => {
    expect(chunkArray([1, 2, 3], 5)).toEqual([[1, 2, 3]]);
  });

  it('should split array into equal chunks', () => {
    expect(chunkArray([1, 2, 3, 4], 2)).toEqual([[1, 2], [3, 4]]);
  });

  it('should handle remainder in last chunk', () => {
    expect(chunkArray([1, 2, 3, 4, 5], 2)).toEqual([[1, 2], [3, 4], [5]]);
  });

  it('should return empty array for empty input', () => {
    expect(chunkArray([], 3)).toEqual([]);
  });

  it('should handle chunk size of 1', () => {
    expect(chunkArray([1, 2, 3], 1)).toEqual([[1], [2], [3]]);
  });

  it('should handle array length equal to chunk size', () => {
    expect(chunkArray([1, 2, 3], 3)).toEqual([[1, 2, 3]]);
  });
});

describe('chunkBatchArrays', () => {
  const termIds: Hex[] = ['0x01', '0x02', '0x03', '0x04', '0x05'];
  const curveIds = [1n, 2n, 1n, 2n, 1n];
  const values = [100n, 200n, 300n, 400n, 500n];
  const minValues = [10n, 20n, 30n, 40n, 50n];

  it('should return a single chunk when arrays are smaller than maxSize', () => {
    const chunks = chunkBatchArrays(termIds, curveIds, values, minValues, 10);
    expect(chunks).toHaveLength(1);
    expect(chunks[0].termIds).toEqual(termIds);
    expect(chunks[0].curveIds).toEqual(curveIds);
    expect(chunks[0].values).toEqual(values);
    expect(chunks[0].minValues).toEqual(minValues);
  });

  it('should split into multiple chunks', () => {
    const chunks = chunkBatchArrays(termIds, curveIds, values, minValues, 2);
    expect(chunks).toHaveLength(3);
    expect(chunks[0].termIds).toEqual(['0x01', '0x02']);
    expect(chunks[0].values).toEqual([100n, 200n]);
    expect(chunks[1].termIds).toEqual(['0x03', '0x04']);
    expect(chunks[1].curveIds).toEqual([1n, 2n]);
    expect(chunks[2].termIds).toEqual(['0x05']);
    expect(chunks[2].minValues).toEqual([50n]);
  });

  it('should keep parallel arrays synchronized', () => {
    const chunks = chunkBatchArrays(termIds, curveIds, values, minValues, 3);
    expect(chunks).toHaveLength(2);
    // First chunk: indices 0-2
    expect(chunks[0].termIds).toHaveLength(3);
    expect(chunks[0].curveIds).toHaveLength(3);
    expect(chunks[0].values).toHaveLength(3);
    expect(chunks[0].minValues).toHaveLength(3);
    // Second chunk: indices 3-4
    expect(chunks[1].termIds).toHaveLength(2);
    expect(chunks[1].curveIds).toHaveLength(2);
  });

  it('should return empty array for empty input', () => {
    const chunks = chunkBatchArrays([], [], [], [], 10);
    expect(chunks).toEqual([]);
  });
});

describe('applySlippage', () => {
  it('should apply 2% slippage (200 bps)', () => {
    // 1000 * (10000 - 200) / 10000 = 1000 * 9800 / 10000 = 980
    expect(applySlippage(1000n, 200)).toBe(980n);
  });

  it('should apply 0% slippage', () => {
    expect(applySlippage(1000n, 0)).toBe(1000n);
  });

  it('should apply 100% slippage (10000 bps)', () => {
    expect(applySlippage(1000n, 10000)).toBe(0n);
  });

  it('should apply 1% slippage (100 bps)', () => {
    expect(applySlippage(10000n, 100)).toBe(9900n);
  });

  it('should handle 0 expected amount', () => {
    expect(applySlippage(0n, 200)).toBe(0n);
  });

  it('should handle large amounts', () => {
    const oneEther = 1_000_000_000_000_000_000n;
    const result = applySlippage(oneEther, 200);
    // 1e18 * 9800 / 10000 = 9.8e17
    expect(result).toBe(980_000_000_000_000_000n);
  });

  it('should handle 50% slippage (5000 bps)', () => {
    expect(applySlippage(1000n, 5000)).toBe(500n);
  });
});

// ============================================================
// Async functions (with mocked publicClient)
// ============================================================

const MOCK_ADDRESS = '0x1234567890abcdef1234567890abcdef12345678' as Address;

function createMockPublicClient(multicallResult: Array<{ status: string; result?: readonly [bigint, bigint] }>) {
  return {
    multicall: vi.fn().mockResolvedValue(multicallResult),
  } as unknown as Parameters<typeof previewDepositBatch>[0];
}

describe('previewDepositBatch', () => {
  it('should return empty array for empty input', async () => {
    const client = createMockPublicClient([]);
    const result = await previewDepositBatch(client, MOCK_ADDRESS, [], [], []);
    expect(result).toEqual([]);
    expect(client.multicall).not.toHaveBeenCalled();
  });

  it('should return shares from successful multicall results', async () => {
    const client = createMockPublicClient([
      { status: 'success', result: [500n, 490n] as readonly [bigint, bigint] },
      { status: 'success', result: [1000n, 980n] as readonly [bigint, bigint] },
    ]);

    const termIds: Hex[] = ['0x01', '0x02'];
    const curveIds = [1n, 2n];
    const amounts = [100n, 200n];

    const result = await previewDepositBatch(client, MOCK_ADDRESS, termIds, curveIds, amounts);
    expect(result).toEqual([500n, 1000n]);
    expect(client.multicall).toHaveBeenCalledOnce();
  });

  it('should return 0n for failed individual results', async () => {
    const client = createMockPublicClient([
      { status: 'success', result: [500n, 490n] as readonly [bigint, bigint] },
      { status: 'failure' },
    ]);

    const result = await previewDepositBatch(
      client, MOCK_ADDRESS, ['0x01', '0x02'] as Hex[], [1n, 1n], [100n, 200n]
    );
    expect(result).toEqual([500n, 0n]);
  });

  it('should fallback to all 0n when multicall throws', async () => {
    const client = {
      multicall: vi.fn().mockRejectedValue(new Error('RPC error')),
    } as unknown as Parameters<typeof previewDepositBatch>[0];

    const result = await previewDepositBatch(
      client, MOCK_ADDRESS, ['0x01', '0x02'] as Hex[], [1n, 1n], [100n, 200n]
    );
    expect(result).toEqual([0n, 0n]);
  });
});

describe('previewRedeemBatch', () => {
  it('should return empty array for empty input', async () => {
    const client = createMockPublicClient([]);
    const result = await previewRedeemBatch(client, MOCK_ADDRESS, [], [], []);
    expect(result).toEqual([]);
  });

  it('should return assets from successful multicall results', async () => {
    const client = createMockPublicClient([
      { status: 'success', result: [900n, 880n] as readonly [bigint, bigint] },
      { status: 'success', result: [1800n, 1760n] as readonly [bigint, bigint] },
    ]);

    const result = await previewRedeemBatch(
      client, MOCK_ADDRESS, ['0x01', '0x02'] as Hex[], [1n, 2n], [500n, 1000n]
    );
    expect(result).toEqual([900n, 1800n]);
  });

  it('should return 0n for failed individual results', async () => {
    const client = createMockPublicClient([
      { status: 'failure' },
      { status: 'success', result: [1800n, 1760n] as readonly [bigint, bigint] },
    ]);

    const result = await previewRedeemBatch(
      client, MOCK_ADDRESS, ['0x01', '0x02'] as Hex[], [1n, 1n], [500n, 1000n]
    );
    expect(result).toEqual([0n, 1800n]);
  });

  it('should fallback to all 0n when multicall throws', async () => {
    const client = {
      multicall: vi.fn().mockRejectedValue(new Error('network error')),
    } as unknown as Parameters<typeof previewRedeemBatch>[0];

    const result = await previewRedeemBatch(
      client, MOCK_ADDRESS, ['0x01'] as Hex[], [1n], [500n]
    );
    expect(result).toEqual([0n]);
  });
});

describe('calculateMinSharesBatch', () => {
  it('should return preview shares with slippage applied', async () => {
    // previewDeposit returns [shares, assetsAfterFees]
    const client = createMockPublicClient([
      { status: 'success', result: [1000n, 980n] as readonly [bigint, bigint] },
      { status: 'success', result: [2000n, 1960n] as readonly [bigint, bigint] },
    ]);

    const result = await calculateMinSharesBatch(
      client, MOCK_ADDRESS, ['0x01', '0x02'] as Hex[], [1n, 1n], [100n, 200n]
    );

    // 1000 * 9800 / 10000 = 980, 2000 * 9800 / 10000 = 1960
    expect(result).toEqual([980n, 1960n]);
  });

  it('should return 0n for failed previews (0n * slippage = 0n)', async () => {
    const client = createMockPublicClient([
      { status: 'failure' },
    ]);

    const result = await calculateMinSharesBatch(
      client, MOCK_ADDRESS, ['0x01'] as Hex[], [1n], [100n]
    );
    expect(result).toEqual([0n]);
  });
});

describe('calculateMinAssetsBatch', () => {
  it('should return preview assets with slippage applied', async () => {
    const client = createMockPublicClient([
      { status: 'success', result: [5000n, 4900n] as readonly [bigint, bigint] },
    ]);

    const result = await calculateMinAssetsBatch(
      client, MOCK_ADDRESS, ['0x01'] as Hex[], [1n], [500n]
    );

    // 5000 * 9800 / 10000 = 4900
    expect(result).toEqual([4900n]);
  });

  it('should handle mixed success/failure results', async () => {
    const client = createMockPublicClient([
      { status: 'success', result: [10000n, 9800n] as readonly [bigint, bigint] },
      { status: 'failure' },
      { status: 'success', result: [3000n, 2940n] as readonly [bigint, bigint] },
    ]);

    const result = await calculateMinAssetsBatch(
      client, MOCK_ADDRESS, ['0x01', '0x02', '0x03'] as Hex[], [1n, 1n, 2n], [100n, 200n, 300n]
    );

    // 10000 * 0.98 = 9800, 0 * 0.98 = 0, 3000 * 0.98 = 2940
    expect(result).toEqual([9800n, 0n, 2940n]);
  });
});
