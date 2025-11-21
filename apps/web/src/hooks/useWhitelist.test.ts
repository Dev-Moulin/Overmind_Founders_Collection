import { describe, it, expect, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useWhitelist } from './useWhitelist';
import type { Address } from 'viem';

// Mock wagmi
vi.mock('wagmi', () => ({
  useReadContract: vi.fn(),
}));

import { useReadContract } from 'wagmi';

describe('useWhitelist', () => {
  const mockAddress: Address = '0x1234567890123456789012345678901234567890';
  const NFT_CONTRACT = '0x98e240326966e86ad6ec27e13409ffb748788f8c';

  it('should return not eligible when no address provided', () => {
    vi.mocked(useReadContract).mockReturnValue({
      data: undefined,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    } as any);

    const { result } = renderHook(() => useWhitelist(undefined));

    expect(result.current.isEligible).toBe(false);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.balance).toBe(0n);
  });

  it('should return eligible when balance > 0', () => {
    vi.mocked(useReadContract).mockReturnValue({
      data: 5n,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    } as any);

    const { result } = renderHook(() => useWhitelist(mockAddress));

    expect(result.current.isEligible).toBe(true);
    expect(result.current.balance).toBe(5n);
    expect(result.current.isLoading).toBe(false);
  });

  it('should return not eligible when balance = 0', () => {
    vi.mocked(useReadContract).mockReturnValue({
      data: 0n,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    } as any);

    const { result } = renderHook(() => useWhitelist(mockAddress));

    expect(result.current.isEligible).toBe(false);
    expect(result.current.balance).toBe(0n);
  });

  it('should handle loading state', () => {
    vi.mocked(useReadContract).mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null,
      refetch: vi.fn(),
    } as any);

    const { result } = renderHook(() => useWhitelist(mockAddress));

    expect(result.current.isLoading).toBe(true);
    expect(result.current.isEligible).toBe(false);
  });

  it('should handle error state', () => {
    const mockError = new Error('RPC Error');

    vi.mocked(useReadContract).mockReturnValue({
      data: undefined,
      isLoading: false,
      error: mockError,
      refetch: vi.fn(),
    } as any);

    const { result } = renderHook(() => useWhitelist(mockAddress));

    expect(result.current.error).toBe(mockError);
    expect(result.current.isEligible).toBe(false);
  });

  it('should return correct contract address', () => {
    vi.mocked(useReadContract).mockReturnValue({
      data: 1n,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    } as any);

    const { result } = renderHook(() => useWhitelist(mockAddress));

    expect(result.current.contractAddress).toBe(NFT_CONTRACT);
  });

  it('should provide refetch function', () => {
    const mockRefetch = vi.fn();

    vi.mocked(useReadContract).mockReturnValue({
      data: 1n,
      isLoading: false,
      error: null,
      refetch: mockRefetch,
    } as any);

    const { result } = renderHook(() => useWhitelist(mockAddress));

    expect(result.current.refetch).toBe(mockRefetch);
  });

  it('should call useReadContract with correct parameters', () => {
    vi.mocked(useReadContract).mockReturnValue({
      data: undefined,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    } as any);

    renderHook(() => useWhitelist(mockAddress));

    expect(useReadContract).toHaveBeenCalledWith({
      address: NFT_CONTRACT,
      abi: expect.any(Array),
      functionName: 'balanceOf',
      args: [mockAddress],
      query: {
        enabled: true,
        staleTime: 60_000,
        retry: 2,
      },
    });
  });

  it('should disable query when no address provided', () => {
    vi.mocked(useReadContract).mockReturnValue({
      data: undefined,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    } as any);

    renderHook(() => useWhitelist(undefined));

    expect(useReadContract).toHaveBeenCalledWith(
      expect.objectContaining({
        args: undefined,
        query: expect.objectContaining({
          enabled: false,
        }),
      })
    );
  });
});
