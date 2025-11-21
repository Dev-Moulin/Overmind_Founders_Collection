/**
 * Export all custom hooks
 */

// GraphQL hooks for proposals
export {
  useFounderProposals,
  useUserProposals,
  useProposalLimit,
  sortProposalsByVotes,
  getWinningProposal,
  formatVoteAmount,
} from './useFounderProposals';

// GraphQL hooks for votes
export {
  useUserVotes,
  useUserVotesDetailed,
  useUserPosition,
  getTotalVotedAmount,
  filterVotesByType,
  groupVotesByTerm,
  formatTotalVotes,
  hasVotedOnTerm,
  getUserVoteDirection,
  type VoteWithDetails,
} from './useUserVotes';
