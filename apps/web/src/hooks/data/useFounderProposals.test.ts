import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';

// Mock Apollo client (still needed by useProposalLimit)
vi.mock('@apollo/client', () => ({
  useQuery: vi.fn(),
  gql: vi.fn((strings: TemplateStringsArray) => strings.join('')),
}));

// Mock FoundersDataContext (used by useFounderProposals)
const mockRefetch = vi.fn().mockResolvedValue(undefined);
vi.mock('../../contexts/FoundersDataContext', () => ({
  useFoundersData: vi.fn(),
}));

import { useQuery } from '@apollo/client';
import { useFoundersData } from '../../contexts/FoundersDataContext';
import {
  useFounderProposals,
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

/** Helper to mock useFoundersData with a proposalsByFounder Map */
function mockContextWith(triples: any[], founderName: string, overrides: Partial<{ loading: boolean; error: any }> = {}) {
  const map = new Map<string, any[]>();
  if (triples.length > 0) {
    map.set(founderName, triples);
  }
  vi.mocked(useFoundersData).mockReturnValue({
    founders: [],
    stats: { totalTrustVoted: 0, uniqueVoters: 0, foundersWithTotems: 0, totalProposals: 0 },
    topTotemsMap: new Map(),
    proposalsByFounder: map,
    depositsByTermId: new Map(),
    loading: overrides.loading ?? false,
    error: overrides.error ?? null,
    refetch: mockRefetch,
  } as any);
}

describe('useFounderProposals', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('loading state', () => {
    it('should return loading true when context is loading', () => {
      mockContextWith([], 'Joseph Lubin', { loading: true });

      const { result } = renderHook(() => useFounderProposals('Joseph Lubin'));

      expect(result.current.loading).toBe(true);
      expect(result.current.proposals).toEqual([]);
    });
  });

  describe('successful query', () => {
    it('should return proposals after loading', () => {
      mockContextWith(mockTriples, 'Joseph Lubin');

      const { result } = renderHook(() => useFounderProposals('Joseph Lubin'));

      expect(result.current.loading).toBe(false);
      expect(result.current.proposals.length).toBe(2);
      expect(result.current.error).toBeNull();
    });

    it('should include vote counts in proposals', () => {
      mockContextWith(mockTriples, 'Joseph Lubin');

      const { result } = renderHook(() => useFounderProposals('Joseph Lubin'));

      const proposal = result.current.proposals[0];
      expect(proposal.votes).toBeDefined();
      expect(proposal.votes.forVotes).toBe('1000000000000000000');
      expect(proposal.votes.againstVotes).toBe('200000000000000000');
    });

    it('should calculate net votes', () => {
      mockContextWith(mockTriples, 'Joseph Lubin');

      const { result } = renderHook(() => useFounderProposals('Joseph Lubin'));

      const proposal = result.current.proposals[0];
      // Net = 1000000000000000000 - 200000000000000000 = 800000000000000000
      expect(proposal.votes.netVotes).toBe('800000000000000000');
    });

    it('should calculate percentage correctly', () => {
      mockContextWith(mockTriples, 'Joseph Lubin');

      const { result } = renderHook(() => useFounderProposals('Joseph Lubin'));

      // First proposal: FOR=1e18, AGAINST=0.2e18, percentage = 1/(1+0.2)*100 = 83%
      const proposal1 = result.current.proposals[0];
      expect(proposal1.percentage).toBe(83);

      // Second proposal: FOR=0.5e18, AGAINST=0.5e18, percentage = 50%
      const proposal2 = result.current.proposals[1];
      expect(proposal2.percentage).toBe(50);
    });

    it('should handle zero votes (percentage = 0)', () => {
      mockContextWith(mockTriplesWithoutVaults, 'Test Founder');

      const { result } = renderHook(() => useFounderProposals('Test Founder'));

      const proposal = result.current.proposals[0];
      expect(proposal.percentage).toBe(0);
      expect(proposal.votes.forVotes).toBe('0');
      expect(proposal.votes.againstVotes).toBe('0');
    });

    it('should provide refetch function', () => {
      mockContextWith(mockTriples, 'Joseph Lubin');

      const { result } = renderHook(() => useFounderProposals('Joseph Lubin'));

      expect(typeof result.current.refetch).toBe('function');
    });
  });

  describe('empty founder name', () => {
    it('should return empty proposals when founderName is empty', () => {
      mockContextWith([], '');

      const { result } = renderHook(() => useFounderProposals(''));

      expect(result.current.proposals).toEqual([]);
    });
  });

  describe('empty results', () => {
    it('should return empty array when no proposals found', () => {
      mockContextWith([], 'Unknown Founder');

      const { result } = renderHook(() => useFounderProposals('Unknown Founder'));

      expect(result.current.proposals).toEqual([]);
    });
  });

  describe('error handling', () => {
    it('should return error when context has error', () => {
      const mockError = new Error('GraphQL error');
      mockContextWith([], 'Error Founder', { error: mockError });

      const { result } = renderHook(() => useFounderProposals('Error Founder'));

      expect(result.current.error).toBe(mockError);
      expect(result.current.proposals).toEqual([]);
    });
  });

  describe('proposal structure', () => {
    it('should include triple data in proposal', () => {
      mockContextWith(mockTriples, 'Joseph Lubin');

      const { result } = renderHook(() => useFounderProposals('Joseph Lubin'));

      const proposal = result.current.proposals[0];
      expect(proposal.term_id).toBe('0xtriple1');
      expect(proposal.subject.label).toBe('Joseph Lubin');
      expect(proposal.object.label).toBe('Phoenix');
    });
  });

  describe('context integration', () => {
    it('should read from proposalsByFounder Map', () => {
      mockContextWith(mockTriples, 'Joseph Lubin');

      const { result } = renderHook(() => useFounderProposals('Joseph Lubin'));

      expect(useFoundersData).toHaveBeenCalled();
      expect(result.current.proposals.length).toBe(2);
    });

    it('should return empty when founder not in Map', () => {
      mockContextWith(mockTriples, 'Joseph Lubin');

      const { result } = renderHook(() => useFounderProposals('Unknown'));

      expect(result.current.proposals).toEqual([]);
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

    const { result } = renderHook(() => useProposalLimit('0x123', 'Joseph Lubin'));

    expect(result.current.count).toBe(1);
    expect(result.current.canPropose).toBe(true);
    expect(result.current.remaining).toBe(2);
    expect(result.current.maxProposals).toBe(3);
  });

  it('should return canPropose false when at limit', () => {
    vi.mocked(useQuery).mockReturnValue({
      data: { triples_aggregate: { aggregate: { count: 3 } } },
      loading: false,
      error: undefined,
    } as any);

    const { result } = renderHook(() => useProposalLimit('0x123', 'Joseph Lubin'));

    expect(result.current.count).toBe(3);
    expect(result.current.canPropose).toBe(false);
    expect(result.current.remaining).toBe(0);
  });

  it('should return canPropose false when over limit', () => {
    vi.mocked(useQuery).mockReturnValue({
      data: { triples_aggregate: { aggregate: { count: 5 } } },
      loading: false,
      error: undefined,
    } as any);

    const { result } = renderHook(() => useProposalLimit('0x123', 'Joseph Lubin'));

    expect(result.current.canPropose).toBe(false);
    expect(result.current.remaining).toBe(0); // Math.max(0, -2) = 0
  });

  it('should skip query when walletAddress is undefined', () => {
    vi.mocked(useQuery).mockReturnValue({
      data: undefined,
      loading: false,
      error: undefined,
    } as any);

    renderHook(() => useProposalLimit(undefined, 'Joseph Lubin'));

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

    renderHook(() => useProposalLimit('0x123', ''));

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

    const { result } = renderHook(() => useProposalLimit('0x123', 'Joseph Lubin'));

    expect(result.current.loading).toBe(true);
  });

  it('should return error state', () => {
    const mockError = new Error('Query failed');
    vi.mocked(useQuery).mockReturnValue({
      data: undefined,
      loading: false,
      error: mockError,
    } as any);

    const { result } = renderHook(() => useProposalLimit('0x123', 'Joseph Lubin'));

    expect(result.current.error).toBe(mockError);
  });

  it('should handle missing aggregate data', () => {
    vi.mocked(useQuery).mockReturnValue({
      data: undefined,
      loading: false,
      error: undefined,
    } as any);

    const { result } = renderHook(() => useProposalLimit('0x123', 'Joseph Lubin'));

    expect(result.current.count).toBe(0);
    expect(result.current.canPropose).toBe(true);
    expect(result.current.remaining).toBe(3);
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
