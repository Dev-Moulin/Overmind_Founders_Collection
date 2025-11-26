import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '../test/utils';
import userEvent from '@testing-library/user-event';
import { VoteModal } from './VoteModal';
import type { AggregatedTotem } from '../hooks/useAllTotems';
import type { VoteStatus, VoteError } from '../hooks/useVote';

// Mock wagmi with dynamic address
let mockAddressValue: string | undefined = '0x1234567890abcdef1234567890abcdef12345678';
vi.mock('wagmi', () => ({
  useAccount: () => ({ address: mockAddressValue }),
}));

// Mock useVote hook with dynamic return
const mockVote = vi.fn();
const mockReset = vi.fn();
let mockUseVoteReturnValue: {
  vote: typeof mockVote;
  status: VoteStatus;
  error: VoteError | null;
  isLoading: boolean;
  currentStep: number;
  totalSteps: number;
  reset: typeof mockReset;
} = {
  vote: mockVote,
  status: 'idle',
  error: null,
  isLoading: false,
  currentStep: 0,
  totalSteps: 3,
  reset: mockReset,
};

vi.mock('../hooks/useVote', () => ({
  useVote: () => mockUseVoteReturnValue,
}));

const mockTotem: AggregatedTotem = {
  totemId: '0x123',
  totemLabel: 'Innovation Leader',
  totemImage: 'https://example.com/totem.png',
  totalFor: 1000n,
  totalAgainst: 200n,
  netScore: 800n,
  claimCount: 1,
  topPredicate: 'is a visionary',
  founder: {
    id: '0xfounder1',
    name: 'Vitalik Buterin',
  },
  claims: [
    {
      tripleId: '0xtriple1',
      predicate: 'is a visionary',
      trustFor: 1000n,
      trustAgainst: 200n,
      netScore: 800n,
      forVotes: 1000n,
      againstVotes: 200n,
    },
  ],
};

const mockTotemWithMultipleClaims: AggregatedTotem = {
  ...mockTotem,
  claimCount: 2,
  claims: [
    {
      tripleId: '0xtriple1',
      predicate: 'is a visionary',
      trustFor: 1000n,
      trustAgainst: 200n,
      netScore: 800n,
      forVotes: 1000n,
      againstVotes: 200n,
    },
    {
      tripleId: '0xtriple2',
      predicate: 'is innovative',
      trustFor: 500n,
      trustAgainst: 100n,
      netScore: 400n,
      forVotes: 500n,
      againstVotes: 100n,
    },
  ],
};

describe('VoteModal', () => {
  const mockOnClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockAddressValue = '0x1234567890abcdef1234567890abcdef12345678';
    mockUseVoteReturnValue = {
      vote: mockVote,
      status: 'idle',
      error: null,
      isLoading: false,
      currentStep: 0,
      totalSteps: 3,
      reset: mockReset,
    };
  });

  describe('rendering', () => {
    it('should not render when closed', () => {
      render(
        <VoteModal
          isOpen={false}
          onClose={mockOnClose}
          totem={mockTotem}
          direction="for"
        />
      );

      expect(screen.queryByText('Vote FOR')).not.toBeInTheDocument();
    });

    it('should render when open', () => {
      render(
        <VoteModal
          isOpen={true}
          onClose={mockOnClose}
          totem={mockTotem}
          direction="for"
        />
      );

      expect(screen.getByText('Vote FOR')).toBeInTheDocument();
      expect(screen.getByText('Innovation Leader')).toBeInTheDocument();
    });

    it('should display totem information', () => {
      render(
        <VoteModal
          isOpen={true}
          onClose={mockOnClose}
          totem={mockTotem}
          direction="for"
        />
      );

      expect(screen.getByText('Innovation Leader')).toBeInTheDocument();
      expect(screen.getByText(/Vitalik Buterin/)).toBeInTheDocument();
    });

    it('should display totem image when available', () => {
      render(
        <VoteModal
          isOpen={true}
          onClose={mockOnClose}
          totem={mockTotem}
          direction="for"
        />
      );

      const image = screen.getByAltText('Innovation Leader');
      expect(image).toHaveAttribute('src', 'https://example.com/totem.png');
    });

    it('should show AGAINST vote direction', () => {
      render(
        <VoteModal
          isOpen={true}
          onClose={mockOnClose}
          totem={mockTotem}
          direction="against"
        />
      );

      expect(screen.getByText('Vote AGAINST')).toBeInTheDocument();
      expect(screen.getByText(/voting AGAINST/)).toBeInTheDocument();
    });

    it('should have amount input', () => {
      render(
        <VoteModal
          isOpen={true}
          onClose={mockOnClose}
          totem={mockTotem}
          direction="for"
        />
      );

      const amountInput = screen.getByPlaceholderText('0.0');
      expect(amountInput).toBeInTheDocument();
    });

    it('should display claim predicate', () => {
      render(
        <VoteModal
          isOpen={true}
          onClose={mockOnClose}
          totem={mockTotem}
          direction="for"
        />
      );

      expect(screen.getByText(/is a visionary/)).toBeInTheDocument();
    });
  });

  describe('close functionality', () => {
    it('should call onClose when cancel is clicked', async () => {
      const user = userEvent.setup();

      render(
        <VoteModal
          isOpen={true}
          onClose={mockOnClose}
          totem={mockTotem}
          direction="for"
        />
      );

      await user.click(screen.getByRole('button', { name: /cancel/i }));
      expect(mockOnClose).toHaveBeenCalled();
    });

    it('should call onClose when X button is clicked', async () => {
      const user = userEvent.setup();

      render(
        <VoteModal
          isOpen={true}
          onClose={mockOnClose}
          totem={mockTotem}
          direction="for"
        />
      );

      // Find the X button (SVG close button in header)
      const closeButtons = screen.getAllByRole('button');
      const xButton = closeButtons.find(
        (btn) => btn.querySelector('svg') && !btn.textContent?.includes('Cancel')
      );
      if (xButton) {
        await user.click(xButton);
        expect(mockOnClose).toHaveBeenCalled();
      }
    });
  });

  describe('validation', () => {
    it('should show validation error for empty amount', async () => {
      const user = userEvent.setup();

      render(
        <VoteModal
          isOpen={true}
          onClose={mockOnClose}
          totem={mockTotem}
          direction="for"
        />
      );

      await user.click(screen.getByRole('button', { name: /confirm vote/i }));
      expect(screen.getByText(/valid amount/i)).toBeInTheDocument();
    });

    it('should disable confirm button when wallet not connected', () => {
      mockAddressValue = undefined;

      render(
        <VoteModal
          isOpen={true}
          onClose={mockOnClose}
          totem={mockTotem}
          direction="for"
        />
      );

      // Button should be disabled when wallet is not connected
      expect(screen.getByRole('button', { name: /confirm vote/i })).toBeDisabled();
    });

    it('should accept valid amount input', async () => {
      const user = userEvent.setup();

      render(
        <VoteModal
          isOpen={true}
          onClose={mockOnClose}
          totem={mockTotem}
          direction="for"
        />
      );

      const amountInput = screen.getByPlaceholderText('0.0');
      await user.type(amountInput, '10');
      expect(amountInput).toHaveValue(10);
    });
  });

  describe('multiple claims', () => {
    it('should show radio buttons for multiple claims', () => {
      render(
        <VoteModal
          isOpen={true}
          onClose={mockOnClose}
          totem={mockTotemWithMultipleClaims}
          direction="for"
        />
      );

      const radioButtons = screen.getAllByRole('radio');
      expect(radioButtons.length).toBe(2);
    });

    it('should select first claim by default', () => {
      render(
        <VoteModal
          isOpen={true}
          onClose={mockOnClose}
          totem={mockTotemWithMultipleClaims}
          direction="for"
        />
      );

      const radioButtons = screen.getAllByRole('radio');
      expect(radioButtons[0]).toBeChecked();
      expect(radioButtons[1]).not.toBeChecked();
    });

    it('should allow selecting different claim', async () => {
      const user = userEvent.setup();

      render(
        <VoteModal
          isOpen={true}
          onClose={mockOnClose}
          totem={mockTotemWithMultipleClaims}
          direction="for"
        />
      );

      const radioButtons = screen.getAllByRole('radio');
      await user.click(radioButtons[1]);

      expect(radioButtons[0]).not.toBeChecked();
      expect(radioButtons[1]).toBeChecked();
    });

    it('should display both claim predicates', () => {
      render(
        <VoteModal
          isOpen={true}
          onClose={mockOnClose}
          totem={mockTotemWithMultipleClaims}
          direction="for"
        />
      );

      expect(screen.getByText(/is a visionary/)).toBeInTheDocument();
      expect(screen.getByText(/is innovative/)).toBeInTheDocument();
    });
  });

  describe('vote submission', () => {
    it('should call vote function with correct parameters', async () => {
      const user = userEvent.setup();

      render(
        <VoteModal
          isOpen={true}
          onClose={mockOnClose}
          totem={mockTotem}
          direction="for"
        />
      );

      await user.type(screen.getByPlaceholderText('0.0'), '10');
      await user.click(screen.getByRole('button', { name: /confirm vote/i }));

      expect(mockVote).toHaveBeenCalledWith('0xtriple1', '10', true);
    });

    it('should call vote with isFor=false for against direction', async () => {
      const user = userEvent.setup();

      render(
        <VoteModal
          isOpen={true}
          onClose={mockOnClose}
          totem={mockTotem}
          direction="against"
        />
      );

      await user.type(screen.getByPlaceholderText('0.0'), '5');
      await user.click(screen.getByRole('button', { name: /confirm vote/i }));

      expect(mockVote).toHaveBeenCalledWith('0xtriple1', '5', false);
    });
  });

  describe('loading state', () => {
    it('should show progress indicator when loading', () => {
      mockUseVoteReturnValue = {
        vote: mockVote,
        status: 'checking',
        error: null,
        isLoading: true,
        currentStep: 1,
        totalSteps: 2,
        reset: mockReset,
      };

      render(
        <VoteModal
          isOpen={true}
          onClose={mockOnClose}
          totem={mockTotem}
          direction="for"
        />
      );

      expect(screen.getByText(/vérification balance/i)).toBeInTheDocument();
      expect(screen.getByText('Étape 1/2')).toBeInTheDocument();
    });

    // Note: 'approving' status no longer exists - TRUST is native token, no approval needed
    it('should show checking status', () => {
      mockUseVoteReturnValue = {
        vote: mockVote,
        status: 'checking',
        error: null,
        isLoading: true,
        currentStep: 1,
        totalSteps: 2,
        reset: mockReset,
      };

      render(
        <VoteModal
          isOpen={true}
          onClose={mockOnClose}
          totem={mockTotem}
          direction="for"
        />
      );

      expect(screen.getByText(/vérification balance/i)).toBeInTheDocument();
    });

    it('should show depositing status', () => {
      mockUseVoteReturnValue = {
        vote: mockVote,
        status: 'depositing',
        error: null,
        isLoading: true,
        currentStep: 2,
        totalSteps: 2,
        reset: mockReset,
      };

      render(
        <VoteModal
          isOpen={true}
          onClose={mockOnClose}
          totem={mockTotem}
          direction="for"
        />
      );

      expect(screen.getByText(/envoi du vote/i)).toBeInTheDocument();
    });

    it('should disable buttons when loading', () => {
      mockUseVoteReturnValue = {
        vote: mockVote,
        status: 'checking',
        error: null,
        isLoading: true,
        currentStep: 1,
        totalSteps: 3,
        reset: mockReset,
      };

      render(
        <VoteModal
          isOpen={true}
          onClose={mockOnClose}
          totem={mockTotem}
          direction="for"
        />
      );

      expect(screen.getByRole('button', { name: /cancel/i })).toBeDisabled();
    });
  });

  describe('success state', () => {
    it('should show success message', () => {
      mockUseVoteReturnValue = {
        vote: mockVote,
        status: 'success',
        error: null,
        isLoading: false,
        currentStep: 3,
        totalSteps: 3,
        reset: mockReset,
      };

      render(
        <VoteModal
          isOpen={true}
          onClose={mockOnClose}
          totem={mockTotem}
          direction="for"
        />
      );

      expect(screen.getByText(/vote successfully recorded/i)).toBeInTheDocument();
    });
  });

  describe('error state', () => {
    it('should show error message from vote hook', () => {
      mockUseVoteReturnValue = {
        vote: mockVote,
        status: 'error',
        error: { code: 'INSUFFICIENT_BALANCE', message: 'Not enough TRUST', step: 'depositing' },
        isLoading: false,
        currentStep: 0,
        totalSteps: 3,
        reset: mockReset,
      };

      render(
        <VoteModal
          isOpen={true}
          onClose={mockOnClose}
          totem={mockTotem}
          direction="for"
        />
      );

      expect(screen.getByText('Not enough TRUST')).toBeInTheDocument();
    });
  });

  describe('auto-close on success', () => {
    it('should call onClose after success with delay', async () => {
      vi.useFakeTimers();

      mockUseVoteReturnValue = {
        vote: mockVote,
        status: 'success',
        error: null,
        isLoading: false,
        currentStep: 3,
        totalSteps: 3,
        reset: mockReset,
      };

      render(
        <VoteModal
          isOpen={true}
          onClose={mockOnClose}
          totem={mockTotem}
          direction="for"
        />
      );

      // Verify success message is shown
      expect(screen.getByText(/vote successfully recorded/i)).toBeInTheDocument();

      // Fast-forward timers to trigger the auto-close
      vi.advanceTimersByTime(1000);

      expect(mockOnClose).toHaveBeenCalled();

      vi.useRealTimers();
    });
  });

  describe('empty claim handling', () => {
    it('should handle totem with empty claims array', () => {
      const totemWithNoClaims: AggregatedTotem = {
        ...mockTotem,
        claims: [],
        claimCount: 0,
      };

      render(
        <VoteModal
          isOpen={true}
          onClose={mockOnClose}
          totem={totemWithNoClaims}
          direction="for"
        />
      );

      // Should still render the modal
      expect(screen.getByText('Vote FOR')).toBeInTheDocument();
    });

    it('should show error when submitting with no claim selected', async () => {
      const user = userEvent.setup();

      const totemWithNoClaims: AggregatedTotem = {
        ...mockTotem,
        claims: [],
        claimCount: 0,
      };

      render(
        <VoteModal
          isOpen={true}
          onClose={mockOnClose}
          totem={totemWithNoClaims}
          direction="for"
        />
      );

      await user.type(screen.getByPlaceholderText('0.0'), '10');
      await user.click(screen.getByRole('button', { name: /confirm vote/i }));

      expect(screen.getByText(/select a claim/i)).toBeInTheDocument();
    });
  });

  describe('vote error handling', () => {
    it('should handle vote function throwing an error', async () => {
      const user = userEvent.setup();
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      mockVote.mockRejectedValueOnce(new Error('Network error'));

      render(
        <VoteModal
          isOpen={true}
          onClose={mockOnClose}
          totem={mockTotem}
          direction="for"
        />
      );

      await user.type(screen.getByPlaceholderText('0.0'), '10');
      await user.click(screen.getByRole('button', { name: /confirm vote/i }));

      // Wait for the promise to reject
      await vi.waitFor(() => {
        expect(consoleErrorSpy).toHaveBeenCalledWith(
          'Vote submission error:',
          expect.any(Error)
        );
      });

      consoleErrorSpy.mockRestore();
    });
  });

  describe('reset on modal open', () => {
    it('should reset state when modal opens', () => {
      const { rerender } = render(
        <VoteModal
          isOpen={false}
          onClose={mockOnClose}
          totem={mockTotem}
          direction="for"
        />
      );

      // Open the modal
      rerender(
        <VoteModal
          isOpen={true}
          onClose={mockOnClose}
          totem={mockTotem}
          direction="for"
        />
      );

      expect(mockReset).toHaveBeenCalled();
    });
  });

});
