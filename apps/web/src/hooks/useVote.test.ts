import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';

// Mock all external dependencies before importing the hook
const mockWriteContract = vi.fn();
const mockWaitForTransactionReceipt = vi.fn();
const mockRefetchAllowance = vi.fn();
const mockSimulateContract = vi.fn();

vi.mock('wagmi', () => ({
  useAccount: vi.fn(() => ({ address: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266' })),
  usePublicClient: vi.fn(() => ({
    waitForTransactionReceipt: mockWaitForTransactionReceipt,
    getBalance: vi.fn().mockResolvedValue(100000000000000000000n), // 100 TRUST
    simulateContract: mockSimulateContract,
  })),
  useWalletClient: vi.fn(() => ({
    data: {
      writeContract: mockWriteContract,
    },
  })),
  useReadContract: vi.fn(() => ({
    data: 0n,
    refetch: mockRefetchAllowance,
  })),
}));

vi.mock('@0xintuition/sdk', () => ({
  batchDepositStatement: vi.fn().mockResolvedValue({ transactionHash: '0xmockdeposithash' }),
  getMultiVaultAddressFromChainId: vi.fn().mockReturnValue('0x1234567890abcdef1234567890abcdef12345678'),
}));

vi.mock('@0xintuition/protocol', () => ({
  intuitionTestnet: { id: 84532, name: 'Base Sepolia' },
  MultiVaultAbi: [], // Mock ABI (not used in tests, just needs to exist)
}));

vi.mock('sonner', () => ({
  toast: {
    info: vi.fn(),
    success: vi.fn(),
    error: vi.fn(),
    loading: vi.fn(),
  },
}));

// Import after mocks are set up
import { useVote } from './useVote';
import * as wagmi from 'wagmi';
import * as sdk from '@0xintuition/sdk';
import { toast } from 'sonner';

describe('useVote', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockWriteContract.mockResolvedValue('0xmocktxhash');
    mockWaitForTransactionReceipt.mockResolvedValue({ status: 'success' });
    mockRefetchAllowance.mockResolvedValue({ data: 0n });
    mockSimulateContract.mockResolvedValue({ request: { address: '0xmultivault' } });
  });

  describe('initial state', () => {
    it('should return idle status initially', () => {
      const { result } = renderHook(() => useVote());

      expect(result.current.status).toBe('idle');
      expect(result.current.error).toBeNull();
      expect(result.current.isLoading).toBe(false);
      expect(result.current.currentStep).toBe(0);
      expect(result.current.totalSteps).toBe(2);
    });

    it('should provide vote function', () => {
      const { result } = renderHook(() => useVote());
      expect(typeof result.current.vote).toBe('function');
    });

    it('should provide reset function', () => {
      const { result } = renderHook(() => useVote());
      expect(typeof result.current.reset).toBe('function');
    });
  });

  describe('reset', () => {
    it('should reset state to initial values', () => {
      const { result } = renderHook(() => useVote());

      act(() => {
        result.current.reset();
      });

      expect(result.current.status).toBe('idle');
      expect(result.current.error).toBeNull();
      expect(result.current.currentStep).toBe(0);
    });
  });

  describe('vote function validation', () => {
    it('should set error when wallet not connected', async () => {
      vi.mocked(wagmi.useAccount).mockReturnValue({ address: undefined } as any);

      const { result } = renderHook(() => useVote());

      await act(async () => {
        await result.current.vote('0x123' as `0x${string}`, '10', true);
      });

      expect(result.current.status).toBe('error');
      expect(result.current.error?.code).toBe('WALLET_NOT_CONNECTED');
      expect(result.current.error?.message).toBe('Veuillez connecter votre wallet');
      expect(result.current.error?.step).toBe('checking');
    });

    it('should set error when wallet client not ready', async () => {
      vi.mocked(wagmi.useAccount).mockReturnValue({
        address: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
      } as any);
      vi.mocked(wagmi.useWalletClient).mockReturnValue({ data: null } as any);

      const { result } = renderHook(() => useVote());

      await act(async () => {
        await result.current.vote('0x123' as `0x${string}`, '10', true);
      });

      expect(result.current.status).toBe('error');
      expect(result.current.error?.code).toBe('CLIENT_NOT_READY');
      expect(result.current.error?.message).toBe('Wallet client not ready');
    });

    it('should set error when public client not ready', async () => {
      vi.mocked(wagmi.useAccount).mockReturnValue({
        address: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
      } as any);
      vi.mocked(wagmi.usePublicClient).mockReturnValue(null as any);
      vi.mocked(wagmi.useWalletClient).mockReturnValue({
        data: { writeContract: mockWriteContract },
      } as any);

      const { result } = renderHook(() => useVote());

      await act(async () => {
        await result.current.vote('0x123' as `0x${string}`, '10', true);
      });

      expect(result.current.status).toBe('error');
      expect(result.current.error?.code).toBe('CLIENT_NOT_READY');
    });
  });

  describe('vote flow - no approval needed', () => {
    beforeEach(() => {
      vi.mocked(wagmi.useAccount).mockReturnValue({
        address: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
      } as any);
      vi.mocked(wagmi.usePublicClient).mockReturnValue({
        waitForTransactionReceipt: mockWaitForTransactionReceipt,
        getBalance: vi.fn().mockResolvedValue(100000000000000000000n), // 100 TRUST
        simulateContract: mockSimulateContract,
      } as any);
      vi.mocked(wagmi.useWalletClient).mockReturnValue({
        data: { writeContract: mockWriteContract },
      } as any);
      // High allowance - no approval needed
      vi.mocked(wagmi.useReadContract).mockReturnValue({
        data: BigInt('100000000000000000000'), // 100 TRUST
        refetch: mockRefetchAllowance,
      } as any);
    });

    it('should complete vote without approval when allowance is sufficient', async () => {
      const { result } = renderHook(() => useVote());

      await act(async () => {
        await result.current.vote('0x123' as `0x${string}`, '10', true);
      });

      expect(result.current.status).toBe('success');
      expect(result.current.totalSteps).toBe(2); // Only checking + depositing
      expect(mockSimulateContract).toHaveBeenCalled();
      expect(mockWriteContract).toHaveBeenCalled();
      expect(toast.success).toHaveBeenCalledWith(
        'Vote FOR enregistré avec succès !',
        { id: 'deposit' }
      );
    });

    it('should reject AGAINST votes (not yet supported)', async () => {
      const { result } = renderHook(() => useVote());

      await act(async () => {
        await result.current.vote('0x123' as `0x${string}`, '5', false);
      });

      expect(result.current.status).toBe('error');
      expect(result.current.error?.message).toBe('Les votes AGAINST ne sont pas encore supportés. Il faut le counter_term_id du triple.');
    });
  });

  // Note: These tests are now obsolete - TRUST is a native token, no approval needed
  describe('vote flow - native token (no approval)', () => {
    beforeEach(() => {
      vi.mocked(wagmi.useAccount).mockReturnValue({
        address: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
      } as any);
      vi.mocked(wagmi.usePublicClient).mockReturnValue({
        waitForTransactionReceipt: mockWaitForTransactionReceipt,
        getBalance: vi.fn().mockResolvedValue(100000000000000000000n), // 100 TRUST
        simulateContract: mockSimulateContract,
      } as any);
      vi.mocked(wagmi.useWalletClient).mockReturnValue({
        data: { writeContract: mockWriteContract },
      } as any);
    });

    it('should complete vote directly without approval (TRUST is native)', async () => {
      const { result } = renderHook(() => useVote());

      await act(async () => {
        await result.current.vote('0x123' as `0x${string}`, '10', true);
      });

      expect(result.current.status).toBe('success');
      expect(result.current.totalSteps).toBe(2); // Only checking + depositing (no approval)
      expect(mockWriteContract).toHaveBeenCalled(); // For deposit only
    });

    it('should handle transaction receipt failure', async () => {
      mockWaitForTransactionReceipt.mockResolvedValueOnce({ status: 'reverted' });

      const { result } = renderHook(() => useVote());

      await act(async () => {
        await result.current.vote('0x123' as `0x${string}`, '10', true);
      });

      expect(result.current.status).toBe('error');
      expect(result.current.error?.message).toContain('Transaction de vote échouée');
    });
  });

  describe('deposit failure', () => {
    beforeEach(() => {
      vi.mocked(wagmi.useAccount).mockReturnValue({
        address: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
      } as any);
      vi.mocked(wagmi.usePublicClient).mockReturnValue({
        waitForTransactionReceipt: mockWaitForTransactionReceipt,
        getBalance: vi.fn().mockResolvedValue(100000000000000000000n), // 100 TRUST
        simulateContract: mockSimulateContract,
      } as any);
      vi.mocked(wagmi.useWalletClient).mockReturnValue({
        data: { writeContract: mockWriteContract },
      } as any);
      vi.mocked(wagmi.useReadContract).mockReturnValue({
        data: BigInt('100000000000000000000'),
        refetch: mockRefetchAllowance,
      } as any);
    });

    it('should handle deposit transaction failure', async () => {
      mockWaitForTransactionReceipt.mockResolvedValueOnce({ status: 'reverted' });

      const { result } = renderHook(() => useVote());

      await act(async () => {
        await result.current.vote('0x123' as `0x${string}`, '10', true);
      });

      expect(result.current.status).toBe('error');
      expect(result.current.error?.message).toContain('Transaction de vote échouée');
    });
  });

  describe('error handling', () => {
    beforeEach(() => {
      vi.mocked(wagmi.useAccount).mockReturnValue({
        address: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
      } as any);
      vi.mocked(wagmi.usePublicClient).mockReturnValue({
        waitForTransactionReceipt: mockWaitForTransactionReceipt,
        getBalance: vi.fn().mockResolvedValue(100000000000000000000n), // 100 TRUST
        simulateContract: mockSimulateContract,
      } as any);
      vi.mocked(wagmi.useWalletClient).mockReturnValue({
        data: { writeContract: mockWriteContract },
      } as any);
      vi.mocked(wagmi.useReadContract).mockReturnValue({
        data: BigInt('100000000000000000000'),
        refetch: mockRefetchAllowance,
      } as any);
    });

    it('should handle user rejection error', async () => {
      mockSimulateContract.mockRejectedValueOnce(
        new Error('User rejected the request')
      );

      const { result } = renderHook(() => useVote());

      await act(async () => {
        await result.current.vote('0x123' as `0x${string}`, '10', true);
      });

      expect(result.current.status).toBe('error');
      expect(result.current.error?.code).toBe('USER_REJECTED');
      expect(result.current.error?.message).toBe('Transaction rejetée par l\'utilisateur');
    });

    it('should handle insufficient funds error', async () => {
      mockSimulateContract.mockRejectedValueOnce(
        new Error('insufficient funds for gas')
      );

      const { result } = renderHook(() => useVote());

      await act(async () => {
        await result.current.vote('0x123' as `0x${string}`, '10', true);
      });

      expect(result.current.status).toBe('error');
      expect(result.current.error?.code).toBe('INSUFFICIENT_BALANCE');
      expect(result.current.error?.message).toBe('Balance TRUST insuffisante pour cette transaction');
    });

    it('should handle insufficient balance error', async () => {
      mockSimulateContract.mockRejectedValueOnce(
        new Error('InsufficientBalance')
      );

      const { result } = renderHook(() => useVote());

      await act(async () => {
        await result.current.vote('0x123' as `0x${string}`, '10', true);
      });

      expect(result.current.status).toBe('error');
      expect(result.current.error?.code).toBe('INSUFFICIENT_BALANCE');
      expect(result.current.error?.message).toBe('Balance TRUST insuffisante pour cette transaction');
    });

    it('should handle generic error', async () => {
      mockSimulateContract.mockRejectedValueOnce(
        new Error('Some random blockchain error')
      );

      const { result } = renderHook(() => useVote());

      await act(async () => {
        await result.current.vote('0x123' as `0x${string}`, '10', true);
      });

      expect(result.current.status).toBe('error');
      expect(result.current.error?.code).toBe('UNKNOWN_ERROR');
      expect(result.current.error?.message).toBe('Some random blockchain error');
    });

    it('should handle error without message', async () => {
      mockSimulateContract.mockRejectedValueOnce({});

      const { result } = renderHook(() => useVote());

      await act(async () => {
        await result.current.vote('0x123' as `0x${string}`, '10', true);
      });

      expect(result.current.status).toBe('error');
      expect(result.current.error?.message).toBe('Une erreur inattendue est survenue');
    });

    it('should include error step in error object', async () => {
      mockSimulateContract.mockRejectedValueOnce(new Error('Deposit failed'));

      const { result } = renderHook(() => useVote());

      await act(async () => {
        await result.current.vote('0x123' as `0x${string}`, '10', true);
      });

      expect(result.current.status).toBe('error');
      // Error step is always defined in VoteError
      expect(result.current.error?.step).toBeDefined();
      expect(['checking', 'approving', 'depositing']).toContain(result.current.error?.step);
    });

    it('should set error step to depositing when deposit confirmation fails', async () => {
      // High allowance - no approval needed, goes directly to depositing
      vi.mocked(wagmi.useReadContract).mockReturnValue({
        data: BigInt('100000000000000000000'),
        refetch: mockRefetchAllowance,
      } as any);

      // batchDepositStatement succeeds but waitForTransactionReceipt fails during deposit phase
      vi.mocked(sdk.batchDepositStatement).mockResolvedValueOnce({ transactionHash: '0xdeposithash', state: [] } as any);
      mockWaitForTransactionReceipt.mockRejectedValueOnce(new Error('Deposit confirmation failed'));

      const { result } = renderHook(() => useVote());

      await act(async () => {
        await result.current.vote('0x123' as `0x${string}`, '10', true);
      });

      expect(result.current.status).toBe('error');
      expect(result.current.error?.step).toBe('depositing');
    });
  });

  describe('isLoading computed property', () => {
    it('should be false when idle', () => {
      const { result } = renderHook(() => useVote());
      expect(result.current.isLoading).toBe(false);
    });

    it('should be true during checking status', async () => {
      vi.mocked(wagmi.useAccount).mockReturnValue({
        address: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
      } as any);
      vi.mocked(wagmi.usePublicClient).mockReturnValue({
        waitForTransactionReceipt: mockWaitForTransactionReceipt,
        getBalance: vi.fn().mockResolvedValue(100000000000000000000n), // 100 TRUST
        simulateContract: mockSimulateContract,
      } as any);
      vi.mocked(wagmi.useWalletClient).mockReturnValue({
        data: { writeContract: mockWriteContract },
      } as any);
      vi.mocked(wagmi.useReadContract).mockReturnValue({
        data: BigInt('100000000000000000000'),
        refetch: vi.fn().mockImplementation(() => new Promise(() => {})), // Never resolves
      } as any);

      const { result } = renderHook(() => useVote());

      // Start vote but don't await
      act(() => {
        result.current.vote('0x123' as `0x${string}`, '10', true);
      });

      // Check loading state during execution
      await waitFor(() => {
        expect(result.current.isLoading).toBe(true);
      });
    });
  });

  describe('VoteStatus type', () => {
    it('should have correct initial status type', () => {
      const { result } = renderHook(() => useVote());

      const validStatuses = ['idle', 'checking', 'approving', 'depositing', 'success', 'error'];
      expect(validStatuses).toContain(result.current.status);
    });
  });

  describe('VoteError type', () => {
    it('should have correct error structure when error occurs', async () => {
      vi.mocked(wagmi.useAccount).mockReturnValue({ address: undefined } as any);

      const { result } = renderHook(() => useVote());

      await act(async () => {
        await result.current.vote('0x123' as `0x${string}`, '10', true);
      });

      expect(result.current.error).toHaveProperty('code');
      expect(result.current.error).toHaveProperty('message');
      expect(result.current.error).toHaveProperty('step');
    });
  });

  describe('UseVoteResult interface', () => {
    it('should return all expected properties', () => {
      const { result } = renderHook(() => useVote());

      expect(result.current).toHaveProperty('vote');
      expect(result.current).toHaveProperty('status');
      expect(result.current).toHaveProperty('error');
      expect(result.current).toHaveProperty('isLoading');
      expect(result.current).toHaveProperty('currentStep');
      expect(result.current).toHaveProperty('totalSteps');
      expect(result.current).toHaveProperty('reset');
    });
  });
});
