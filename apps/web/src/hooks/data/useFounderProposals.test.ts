import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock Apollo client before importing
vi.mock('@apollo/client', () => ({
  useQuery: vi.fn(),
  gql: vi.fn((strings: TemplateStringsArray) => strings.join('')),
}));

import { useQuery } from '@apollo/client';
import {
  useFounderProposals,
  // useUserProposals,  // COMMENTED - not exported from hook
  useProposalLimit,
  sortProposalsByVotes,
  getWinningProposal,
  formatVoteAmount,
} from './useFounderProposals';
import type { ProposalWithVotes } from '../../lib/graphql/types';

// Mock triple data - V2 schema format (triple_vault + counter_term)
const mockTriples = [
  {
    term_id: '0xtriple1',
    subject: { term_id: '0xsubject1', label: 'Joseph Lubin', image: 'https://example.com/joseph.jpg' },
    predicate: { term_id: '0xpred1', label: 'is represented by' },
    object: { term_id: '0xobject1', label: 'Phoenix', image: 'https://example.com/phoenix.jpg' },
    triple_vault: { total_assets: '1000000000000000000', total_shares: '1000000000000000000' },
    counter_term: { id: '0xcounter1', total_assets: '200000000000000000' },
  },
  {
    term_id: '0xtriple2',
    subject: { term_id: '0xsubject1', label: 'Joseph Lubin', image: 'https://example.com/joseph.jpg' },
    predicate: { term_id: '0xpred2', label: 'embodies' },
    object: { term_id: '0xobject2', label: 'Dragon', image: 'https://example.com/dragon.jpg' },
    triple_vault: { total_assets: '500000000000000000', total_shares: '500000000000000000' },
    counter_term: { id: '0xcounter2', total_assets: '500000000000000000' },
  },
];

// Mock triple without vaults (edge case)
const mockTriplesWithoutVaults = [
  {
    term_id: '0xtriple3',
    subject: { term_id: '0xsubject1', label: 'Test Founder' },
    predicate: { term_id: '0xpred1', label: 'is' },
    object: { term_id: '0xobject1', label: 'Test Totem' },
    triple_vault: null,
    counter_term: null,
  },
];

describe('useFounderProposals', () => {
  const mockRefetch = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('loading state', () => {
    it('should return loading true when query is loading', () => {
      vi.mocked(useQuery).mockReturnValue({
        data: undefined,
        loading: true,
        error: undefined,
        refetch: mockRefetch,
      } as any);

      const result = useFounderProposals('Joseph Lubin');

      expect(result.loading).toBe(true);
      expect(result.proposals).toEqual([]);
    });
  });

  describe('successful query', () => {
    it('should return proposals after loading', () => {
      vi.mocked(useQuery).mockReturnValue({
        data: { triples: mockTriples },
        loading: false,
        error: undefined,
        refetch: mockRefetch,
      } as any);

      const result = useFounderProposals('Joseph Lubin');

      expect(result.loading).toBe(false);
      expect(result.proposals.length).toBe(2);
      expect(result.error).toBeUndefined();
    });

    it('should include vote counts in proposals', () => {
      vi.mocked(useQuery).mockReturnValue({
        data: { triples: mockTriples },
        loading: false,
        error: undefined,
        refetch: mockRefetch,
      } as any);

      const result = useFounderProposals('Joseph Lubin');

      const proposal = result.proposals[0];
      expect(proposal.votes).toBeDefined();
      expect(proposal.votes.forVotes).toBe('1000000000000000000');
      expect(proposal.votes.againstVotes).toBe('200000000000000000');
    });

    it('should calculate net votes', () => {
      vi.mocked(useQuery).mockReturnValue({
        data: { triples: mockTriples },
        loading: false,
        error: undefined,
        refetch: mockRefetch,
      } as any);

      const result = useFounderProposals('Joseph Lubin');

      const proposal = result.proposals[0];
      // Net = 1000000000000000000 - 200000000000000000 = 800000000000000000
      expect(proposal.votes.netVotes).toBe('800000000000000000');
    });

    it('should calculate percentage correctly', () => {
      vi.mocked(useQuery).mockReturnValue({
        data: { triples: mockTriples },
        loading: false,
        error: undefined,
        refetch: mockRefetch,
      } as any);

      const result = useFounderProposals('Joseph Lubin');

      // First proposal: FOR=1e18, AGAINST=0.2e18, percentage = 1/(1+0.2)*100 = 83%
      const proposal1 = result.proposals[0];
      expect(proposal1.percentage).toBe(83);

      // Second proposal: FOR=0.5e18, AGAINST=0.5e18, percentage = 50%
      const proposal2 = result.proposals[1];
      expect(proposal2.percentage).toBe(50);
    });

    it('should handle zero votes (percentage = 0)', () => {
      vi.mocked(useQuery).mockReturnValue({
        data: { triples: mockTriplesWithoutVaults },
        loading: false,
        error: undefined,
        refetch: mockRefetch,
      } as any);

      const result = useFounderProposals('Test Founder');

      const proposal = result.proposals[0];
      expect(proposal.percentage).toBe(0);
      expect(proposal.votes.forVotes).toBe('0');
      expect(proposal.votes.againstVotes).toBe('0');
    });

    it('should provide refetch function', () => {
      vi.mocked(useQuery).mockReturnValue({
        data: { triples: mockTriples },
        loading: false,
        error: undefined,
        refetch: mockRefetch,
      } as any);

      const result = useFounderProposals('Joseph Lubin');

      expect(result.refetch).toBe(mockRefetch);
    });
  });

  describe('empty founder name', () => {
    it('should skip query when founderName is empty', () => {
      vi.mocked(useQuery).mockReturnValue({
        data: undefined,
        loading: false,
        error: undefined,
        refetch: mockRefetch,
      } as any);

      const result = useFounderProposals('');

      expect(result.proposals).toEqual([]);
    });
  });

  describe('empty results', () => {
    it('should return empty array when no proposals found', () => {
      vi.mocked(useQuery).mockReturnValue({
        data: { triples: [] },
        loading: false,
        error: undefined,
        refetch: mockRefetch,
      } as any);

      const result = useFounderProposals('Unknown Founder');

      expect(result.proposals).toEqual([]);
    });
  });

  describe('error handling', () => {
    it('should return error when query fails', () => {
      const mockError = new Error('GraphQL error');
      vi.mocked(useQuery).mockReturnValue({
        data: undefined,
        loading: false,
        error: mockError,
        refetch: mockRefetch,
      } as any);

      const result = useFounderProposals('Error Founder');

      expect(result.error).toBe(mockError);
      expect(result.proposals).toEqual([]);
    });
  });

  describe('proposal structure', () => {
    it('should include triple data in proposal', () => {
      vi.mocked(useQuery).mockReturnValue({
        data: { triples: mockTriples },
        loading: false,
        error: undefined,
        refetch: mockRefetch,
      } as any);

      const result = useFounderProposals('Joseph Lubin');

      const proposal = result.proposals[0];
      expect(proposal.term_id).toBe('0xtriple1');
      expect(proposal.subject.label).toBe('Joseph Lubin');
      expect(proposal.object.label).toBe('Phoenix');
    });
  });

  describe('query configuration', () => {
    it('should call useQuery with correct variables', () => {
      vi.mocked(useQuery).mockReturnValue({
        data: { triples: mockTriples },
        loading: false,
        error: undefined,
        refetch: mockRefetch,
      } as any);

      useFounderProposals('Joseph Lubin');

      expect(useQuery).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          variables: { founderName: 'Joseph Lubin' },
          skip: false,
        })
      );
    });

    it('should skip query when founderName is empty', () => {
      vi.mocked(useQuery).mockReturnValue({
        data: undefined,
        loading: false,
        error: undefined,
        refetch: mockRefetch,
      } as any);

      useFounderProposals('');

      expect(useQuery).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          skip: true,
        })
      );
    });
  });
});

// useUserProposals tests removed - hook is commented out in implementation

describe('useProposalLimit', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return canPropose true when count is below limit', () => {
    vi.mocked(useQuery).mockReturnValue({
      data: { triples_aggregate: { aggregate: { count: 1 } } },
      loading: false,
      error: undefined,
    } as any);

    const result = useProposalLimit('0x123', 'Joseph Lubin');

    expect(result.count).toBe(1);
    expect(result.canPropose).toBe(true);
    expect(result.remaining).toBe(2);
    expect(result.maxProposals).toBe(3);
  });

  it('should return canPropose false when at limit', () => {
    vi.mocked(useQuery).mockReturnValue({
      data: { triples_aggregate: { aggregate: { count: 3 } } },
      loading: false,
      error: undefined,
    } as any);

    const result = useProposalLimit('0x123', 'Joseph Lubin');

    expect(result.count).toBe(3);
    expect(result.canPropose).toBe(false);
    expect(result.remaining).toBe(0);
  });

  it('should return canPropose false when over limit', () => {
    vi.mocked(useQuery).mockReturnValue({
      data: { triples_aggregate: { aggregate: { count: 5 } } },
      loading: false,
      error: undefined,
    } as any);

    const result = useProposalLimit('0x123', 'Joseph Lubin');

    expect(result.canPropose).toBe(false);
    expect(result.remaining).toBe(0); // Math.max(0, -2) = 0
  });

  it('should skip query when walletAddress is undefined', () => {
    vi.mocked(useQuery).mockReturnValue({
      data: undefined,
      loading: false,
      error: undefined,
    } as any);

    useProposalLimit(undefined, 'Joseph Lubin');

    expect(useQuery).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        skip: true,
      })
    );
  });

  it('should skip query when founderName is empty', () => {
    vi.mocked(useQuery).mockReturnValue({
      data: undefined,
      loading: false,
      error: undefined,
    } as any);

    useProposalLimit('0x123', '');

    expect(useQuery).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        skip: true,
      })
    );
  });

  it('should return loading state', () => {
    vi.mocked(useQuery).mockReturnValue({
      data: undefined,
      loading: true,
      error: undefined,
    } as any);

    const result = useProposalLimit('0x123', 'Joseph Lubin');

    expect(result.loading).toBe(true);
  });

  it('should return error state', () => {
    const mockError = new Error('Query failed');
    vi.mocked(useQuery).mockReturnValue({
      data: undefined,
      loading: false,
      error: mockError,
    } as any);

    const result = useProposalLimit('0x123', 'Joseph Lubin');

    expect(result.error).toBe(mockError);
  });

  it('should handle missing aggregate data', () => {
    vi.mocked(useQuery).mockReturnValue({
      data: undefined,
      loading: false,
      error: undefined,
    } as any);

    const result = useProposalLimit('0x123', 'Joseph Lubin');

    expect(result.count).toBe(0);
    expect(result.canPropose).toBe(true);
    expect(result.remaining).toBe(3);
  });
});

describe('sortProposalsByVotes', () => {
  it('should sort proposals by FOR votes descending', () => {
    const proposals: ProposalWithVotes[] = [
      {
        term_id: '1',
        votes: { forVotes: '100', againstVotes: '0', netVotes: '100', forShares: '100', againstShares: '0' },
        percentage: 100,
      } as any,
      {
        term_id: '2',
        votes: { forVotes: '500', againstVotes: '0', netVotes: '500', forShares: '500', againstShares: '0' },
        percentage: 100,
      } as any,
      {
        term_id: '3',
        votes: { forVotes: '200', againstVotes: '0', netVotes: '200', forShares: '200', againstShares: '0' },
        percentage: 100,
      } as any,
    ];

    const sorted = sortProposalsByVotes(proposals);

    expect(sorted[0].term_id).toBe('2'); // 500
    expect(sorted[1].term_id).toBe('3'); // 200
    expect(sorted[2].term_id).toBe('1'); // 100
  });

  it('should handle empty array', () => {
    const sorted = sortProposalsByVotes([]);
    expect(sorted).toEqual([]);
  });

  it('should handle equal votes', () => {
    const proposals: ProposalWithVotes[] = [
      {
        term_id: '1',
        votes: { forVotes: '100', againstVotes: '0', netVotes: '100', forShares: '100', againstShares: '0' },
        percentage: 100,
      } as any,
      {
        term_id: '2',
        votes: { forVotes: '100', againstVotes: '0', netVotes: '100', forShares: '100', againstShares: '0' },
        percentage: 100,
      } as any,
    ];

    const sorted = sortProposalsByVotes(proposals);

    expect(sorted.length).toBe(2);
  });

  it('should not mutate original array', () => {
    const proposals: ProposalWithVotes[] = [
      {
        term_id: '1',
        votes: { forVotes: '100', againstVotes: '0', netVotes: '100', forShares: '100', againstShares: '0' },
        percentage: 100,
      } as any,
      {
        term_id: '2',
        votes: { forVotes: '500', againstVotes: '0', netVotes: '500', forShares: '500', againstShares: '0' },
        percentage: 100,
      } as any,
    ];

    const sorted = sortProposalsByVotes(proposals);

    expect(proposals[0].term_id).toBe('1'); // Original unchanged
    expect(sorted[0].term_id).toBe('2'); // Sorted is different
  });
});

describe('getWinningProposal', () => {
  it('should return proposal with most FOR votes', () => {
    const proposals: ProposalWithVotes[] = [
      {
        term_id: '1',
        votes: { forVotes: '100', againstVotes: '0', netVotes: '100', forShares: '100', againstShares: '0' },
        percentage: 100,
      } as any,
      {
        term_id: '2',
        votes: { forVotes: '500', againstVotes: '0', netVotes: '500', forShares: '500', againstShares: '0' },
        percentage: 100,
      } as any,
      {
        term_id: '3',
        votes: { forVotes: '200', againstVotes: '0', netVotes: '200', forShares: '200', againstShares: '0' },
        percentage: 100,
      } as any,
    ];

    const winner = getWinningProposal(proposals);

    expect(winner?.term_id).toBe('2');
  });

  it('should return undefined for empty array', () => {
    const winner = getWinningProposal([]);
    expect(winner).toBeUndefined();
  });

  it('should return first proposal when all have equal votes', () => {
    const proposals: ProposalWithVotes[] = [
      {
        term_id: '1',
        votes: { forVotes: '100', againstVotes: '0', netVotes: '100', forShares: '100', againstShares: '0' },
        percentage: 100,
      } as any,
      {
        term_id: '2',
        votes: { forVotes: '100', againstVotes: '0', netVotes: '100', forShares: '100', againstShares: '0' },
        percentage: 100,
      } as any,
    ];

    const winner = getWinningProposal(proposals);

    expect(winner?.term_id).toBe('1'); // First one wins in a tie
  });

  it('should handle single proposal', () => {
    const proposals: ProposalWithVotes[] = [
      {
        term_id: '1',
        votes: { forVotes: '100', againstVotes: '0', netVotes: '100', forShares: '100', againstShares: '0' },
        percentage: 100,
      } as any,
    ];

    const winner = getWinningProposal(proposals);

    expect(winner?.term_id).toBe('1');
  });
});

describe('formatVoteAmount', () => {
  it('should format wei to ether with default 2 decimals', () => {
    const result = formatVoteAmount('1000000000000000000'); // 1 ETH
    expect(result).toBe('1.00');
  });

  it('should format with custom decimals', () => {
    const result = formatVoteAmount('1500000000000000000', 4); // 1.5 ETH
    expect(result).toBe('1.5000');
  });

  it('should handle large amounts', () => {
    const result = formatVoteAmount('150500000000000000000'); // 150.5 ETH
    expect(result).toBe('150.50');
  });

  it('should handle small amounts', () => {
    const result = formatVoteAmount('1000000000000000'); // 0.001 ETH
    expect(result).toBe('0.00'); // Rounds to 0.00 with 2 decimals
  });

  it('should handle small amounts with more decimals', () => {
    const result = formatVoteAmount('1000000000000000', 5); // 0.001 ETH
    expect(result).toBe('0.00100');
  });

  it('should handle zero', () => {
    const result = formatVoteAmount('0');
    expect(result).toBe('0.00');
  });
});
