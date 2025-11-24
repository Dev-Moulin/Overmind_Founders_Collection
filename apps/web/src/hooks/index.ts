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

// GraphQL hook for all proposals (grouped by founder)
export { useAllProposals, type FounderWithTotem } from './useAllProposals';

// GraphQL hook for totem details
export { useTotemDetails, type TotemDetails } from './useTotemDetails';

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

// GraphQL hook for all totems (aggregated by object)
export { useAllTotems, type AggregatedTotem } from './useAllTotems';

// Hook for voting on claims
export { useVote, type UseVoteResult, type VoteStatus, type VoteError } from './useVote';

// Hooks for vote statistics and leaderboard
export {
  useTripleVotes,
  useRecentVotes,
  useGlobalVoteStats,
  useTopVoters,
  useVotesTimeline,
  useVotesDistribution,
  useFounderStats,
} from './useVoteStats';

// Hook for platform-wide statistics (includes top totem globally)
export { usePlatformStats, type PlatformStats, type TopTotem } from './usePlatformStats';

// Hook for fetching voters of a specific totem
export { useTotemVoters, type TotemVoter } from './useTotemVoters';

// Hook for withdrawing TRUST from vaults
export {
  useWithdraw,
  estimateWithdrawAmount,
  type UseWithdrawResult,
  type WithdrawStatus,
  type WithdrawError,
  type WithdrawPreview,
} from './useWithdraw';

// Hook for wallet authentication with signature
export {
  useWalletAuth,
  type UseWalletAuthResult,
  type AuthStatus,
} from './useWalletAuth';
