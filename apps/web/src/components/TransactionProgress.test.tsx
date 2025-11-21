import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TransactionProgress, type TransactionStatus } from './TransactionProgress';

describe('TransactionProgress', () => {
  const mockOnClose = vi.fn();
  const mockOnRetry = vi.fn();

  const defaultProps = {
    isOpen: true,
    onClose: mockOnClose,
    status: 'idle' as TransactionStatus,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('visibility', () => {
    it('should not render when isOpen is false', () => {
      const { container } = render(
        <TransactionProgress {...defaultProps} isOpen={false} />
      );
      expect(container.firstChild).toBeNull();
    });

    it('should render when isOpen is true', () => {
      render(<TransactionProgress {...defaultProps} />);
      expect(screen.getByText('Prêt')).toBeInTheDocument();
    });
  });

  describe('status states', () => {
    it('should render preparing state', () => {
      render(<TransactionProgress {...defaultProps} status="preparing" />);
      expect(screen.getByRole('heading', { name: /Préparation/ })).toBeInTheDocument();
      expect(
        screen.getByText('Préparation de la transaction...')
      ).toBeInTheDocument();
    });

    it('should render signature state', () => {
      render(<TransactionProgress {...defaultProps} status="signature" />);
      expect(screen.getByText(/Signature/)).toBeInTheDocument();
      expect(
        screen.getByText(/signer la transaction dans votre wallet/)
      ).toBeInTheDocument();
    });

    it('should render submitting state', () => {
      render(<TransactionProgress {...defaultProps} status="submitting" />);
      expect(screen.getByRole('heading', { name: /Envoi/ })).toBeInTheDocument();
    });

    it('should render confirming state', () => {
      render(<TransactionProgress {...defaultProps} status="confirming" />);
      expect(screen.getByText(/Confirmation/)).toBeInTheDocument();
    });

    it('should render success state', () => {
      render(<TransactionProgress {...defaultProps} status="success" />);
      expect(screen.getByText('Succès')).toBeInTheDocument();
      expect(
        screen.getByText('Transaction confirmée avec succès !')
      ).toBeInTheDocument();
    });

    it('should render error state', () => {
      render(<TransactionProgress {...defaultProps} status="error" />);
      expect(screen.getByText('Erreur')).toBeInTheDocument();
    });
  });

  describe('close button', () => {
    it('should show close button for idle state', () => {
      render(<TransactionProgress {...defaultProps} status="idle" />);
      expect(screen.getByLabelText('Fermer')).toBeInTheDocument();
    });

    it('should show close button for success state', () => {
      render(<TransactionProgress {...defaultProps} status="success" />);
      expect(screen.getByLabelText('Fermer')).toBeInTheDocument();
    });

    it('should show close button for error state', () => {
      render(<TransactionProgress {...defaultProps} status="error" />);
      expect(screen.getByLabelText('Fermer')).toBeInTheDocument();
    });

    it('should NOT show close button for preparing state', () => {
      render(<TransactionProgress {...defaultProps} status="preparing" />);
      expect(screen.queryByLabelText('Fermer')).not.toBeInTheDocument();
    });

    it('should NOT show close button for signature state', () => {
      render(<TransactionProgress {...defaultProps} status="signature" />);
      expect(screen.queryByLabelText('Fermer')).not.toBeInTheDocument();
    });

    it('should call onClose when close button clicked', async () => {
      const user = userEvent.setup();
      render(<TransactionProgress {...defaultProps} status="success" />);

      const closeButton = screen.getByLabelText('Fermer');
      await user.click(closeButton);

      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });
  });

  describe('transaction hash', () => {
    const txHash = '0x1234567890abcdef';

    it('should display transaction hash when provided', () => {
      render(
        <TransactionProgress
          {...defaultProps}
          status="confirming"
          txHash={txHash}
        />
      );
      expect(screen.getByText(txHash)).toBeInTheDocument();
    });

    it('should show block explorer link when txHash provided', () => {
      render(
        <TransactionProgress
          {...defaultProps}
          status="confirming"
          txHash={txHash}
        />
      );
      const link = screen.getByText('Voir ↗');
      expect(link).toHaveAttribute(
        'href',
        `https://sepolia.basescan.org/tx/${txHash}`
      );
      expect(link).toHaveAttribute('target', '_blank');
    });

    it('should not display transaction hash when not provided', () => {
      render(<TransactionProgress {...defaultProps} status="confirming" />);
      expect(screen.queryByText('Transaction Hash')).not.toBeInTheDocument();
    });
  });

  describe('error handling', () => {
    const mockError = new Error('Transaction failed: insufficient funds');

    it('should display error message when error provided', () => {
      render(
        <TransactionProgress
          {...defaultProps}
          status="error"
          error={mockError}
        />
      );
      expect(screen.getByText(/insufficient funds/)).toBeInTheDocument();
    });

    it('should show retry button when error and onRetry provided', () => {
      render(
        <TransactionProgress
          {...defaultProps}
          status="error"
          error={mockError}
          onRetry={mockOnRetry}
        />
      );
      expect(screen.getByText(/Réessayer/)).toBeInTheDocument();
    });

    it('should call onRetry when retry button clicked', async () => {
      const user = userEvent.setup();
      render(
        <TransactionProgress
          {...defaultProps}
          status="error"
          error={mockError}
          onRetry={mockOnRetry}
        />
      );

      const retryButton = screen.getByText(/Réessayer/);
      await user.click(retryButton);

      expect(mockOnRetry).toHaveBeenCalledTimes(1);
    });

    it('should not show retry button when onRetry not provided', () => {
      render(
        <TransactionProgress
          {...defaultProps}
          status="error"
          error={mockError}
        />
      );
      expect(screen.queryByText(/Réessayer/)).not.toBeInTheDocument();
    });
  });

  describe('steps progress', () => {
    const mockSteps = [
      { label: 'Create Atom', status: 'complete' as const },
      { label: 'Create Triple', status: 'current' as const },
      { label: 'Confirm', status: 'pending' as const },
    ];

    it('should render steps when provided', () => {
      render(
        <TransactionProgress
          {...defaultProps}
          status="submitting"
          steps={mockSteps}
        />
      );

      expect(screen.getByText('Create Atom')).toBeInTheDocument();
      expect(screen.getByText('Create Triple')).toBeInTheDocument();
      expect(screen.getByText('Confirm')).toBeInTheDocument();
    });

    it('should show checkmark for completed steps', () => {
      render(
        <TransactionProgress
          {...defaultProps}
          status="submitting"
          steps={mockSteps}
        />
      );

      // First step should be completed
      const completedSteps = screen.getAllByText('✓');
      expect(completedSteps.length).toBeGreaterThan(0);
    });

    it('should not render steps when not provided', () => {
      render(<TransactionProgress {...defaultProps} status="submitting" />);

      expect(screen.queryByText('Create Atom')).not.toBeInTheDocument();
    });
  });

  describe('pending notice', () => {
    it('should show pending notice for preparing state', () => {
      render(<TransactionProgress {...defaultProps} status="preparing" />);
      expect(
        screen.getByText(/Ne fermez pas cette fenêtre/)
      ).toBeInTheDocument();
    });

    it('should show pending notice for signature state', () => {
      render(<TransactionProgress {...defaultProps} status="signature" />);
      expect(
        screen.getByText(/Ne fermez pas cette fenêtre/)
      ).toBeInTheDocument();
    });

    it('should NOT show pending notice for success state', () => {
      render(<TransactionProgress {...defaultProps} status="success" />);
      expect(
        screen.queryByText(/Ne fermez pas cette fenêtre/)
      ).not.toBeInTheDocument();
    });
  });
});
