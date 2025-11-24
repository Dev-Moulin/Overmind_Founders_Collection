import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '../test/utils';
import userEvent from '@testing-library/user-event';
import { FounderCard, type FounderData } from './FounderCard';

const mockFounder: FounderData = {
  id: '1',
  name: 'Vitalik Buterin',
  shortBio: 'Co-founder of Ethereum',
  twitter: '@VitalikButerin',
  linkedin: 'https://linkedin.com/in/vitalik',
};

describe('FounderCard', () => {
  it('should render founder name', () => {
    render(<FounderCard founder={mockFounder} />);
    expect(screen.getByText('Vitalik Buterin')).toBeInTheDocument();
  });

  it('should render founder bio', () => {
    render(<FounderCard founder={mockFounder} />);
    expect(screen.getByText('Co-founder of Ethereum')).toBeInTheDocument();
  });

  it('should render social links when provided', () => {
    render(<FounderCard founder={mockFounder} />);
    const twitterLink = screen.getByTitle('Twitter');
    expect(twitterLink).toHaveAttribute('href', 'https://twitter.com/VitalikButerin');
  });

  it('should call onPropose when propose button is clicked', async () => {
    const handlePropose = vi.fn();
    const user = userEvent.setup();

    render(<FounderCard founder={mockFounder} onPropose={handlePropose} />);

    const proposeButton = screen.getByRole('button', { name: /propose/i });
    await user.click(proposeButton);

    expect(handlePropose).toHaveBeenCalled();
  });

  it('should display proposal count', () => {
    render(<FounderCard founder={mockFounder} proposalCount={5} />);
    expect(screen.getByText(/5/)).toBeInTheDocument();
  });

  it('should not render social links when not provided', () => {
    const founderWithoutSocials: FounderData = {
      id: '2',
      name: 'Gavin Wood',
      shortBio: 'Co-founder of Polkadot',
    };
    render(<FounderCard founder={founderWithoutSocials} />);
    expect(screen.queryByTitle('Twitter')).not.toBeInTheDocument();
    expect(screen.queryByTitle('LinkedIn')).not.toBeInTheDocument();
  });
});
