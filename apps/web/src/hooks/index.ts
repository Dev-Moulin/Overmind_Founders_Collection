/**
 * Export all custom hooks
 */

// GraphQL hooks for proposals
export {
  useFounderProposals,
  // useUserProposals,  // COMMENTED - not used
  useProposalLimit,
  sortProposalsByVotes,
  getWinningProposal,
  formatVoteAmount,
} from './useFounderProposals';

// DEPRECATED - À supprimer - Commenté le 27/11/2025
// export { useAllProposals, type FounderWithTotem } from './useAllProposals';
// export { useTotemDetails, type TotemDetails } from './useTotemDetails';

// GraphQL hooks for votes - Exports utilisés conservés
export {
  useUserVotes,
  // DEPRECATED - À supprimer - Commenté le 27/11/2025
  // useUserVotesDetailed,
  useUserPosition,
  // getTotalVotedAmount,
  filterVotesByType,
  // groupVotesByTerm,
  // formatTotalVotes,
  hasVotedOnTerm,
  getUserVoteDirection,
  type VoteWithDetails,
} from './useUserVotes';

// DEPRECATED - À supprimer - Commenté le 27/11/2025
// export { useAllTotems, type AggregatedTotem } from './useAllTotems';

// Hook for voting on claims
export { useVote, type UseVoteResult, type VoteStatus, type VoteError } from './useVote';

// Hooks for vote statistics and leaderboard
export {
  useTripleVotes,
  useRecentVotes,
  // useGlobalVoteStats,  // COMMENTED - doublon avec usePlatformStats
  useTopVoters,
  useVotesTimeline,
  useVotesDistribution,
  // useFounderStats,  // COMMENTED - not used
} from './useVoteStats';

// DEPRECATED - À supprimer - Commenté le 27/11/2025
// export { usePlatformStats, type PlatformStats, type TopTotem } from './usePlatformStats';

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

// useWalletAuth - SUPPRIMÉ (auth handled by wagmi/Privy)

// Hook for INTUITION protocol configuration (costs, fees)
export { useProtocolConfig, type ProtocolConfig } from './useProtocolConfig';

// Hook for real-time founder proposals via WebSocket subscription
export {
  useFounderSubscription,
  formatTimeSinceUpdate,
} from './useFounderSubscription';

// Hook for detecting window/tab focus state
export {
  useWindowFocus,
  useAutoSubscriptionPause,
} from './useWindowFocus';
