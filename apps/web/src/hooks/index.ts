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
  // type VoteWithDetails, // Migré vers types/vote.ts
} from './useUserVotes';

// DEPRECATED - À supprimer - Commenté le 27/11/2025
// export { useAllTotems, type AggregatedTotem } from './useAllTotems';

// Hook for voting on claims
export { useVote, type UseVoteResult } from './useVote';
export type { VoteStatus, VoteError, VoteWithDetails } from '../types/vote';

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
export { useTotemVoters } from './useTotemVoters';
export type { TotemVoter } from '../types/voter';

// Hook for withdrawing TRUST from vaults
export {
  useWithdraw,
  estimateWithdrawAmount,
  type UseWithdrawResult,
} from './useWithdraw';
export type { WithdrawStatus, WithdrawError, WithdrawPreview } from '../types/withdraw';

// useWalletAuth - SUPPRIMÉ (auth handled by wagmi/Privy)

// Hook for INTUITION protocol operations (atoms, triples, claims)
export {
  useIntuition,
  getFounderImageUrl,
  type CreateAtomResult,
  type CreateTripleResult,
  type FounderData,
  ClaimExistsError,
} from './useIntuition';
export type { CategoryConfig } from '../types/intuition';

// Hook for INTUITION protocol configuration (costs, fees)
export { useProtocolConfig } from './useProtocolConfig';
export type { ProtocolConfig } from '../types/protocol';

// Vote Cart - Batch voting system
export { useVoteCart, type UseVoteCartResult, type AddToCartInput } from './useVoteCart';
export { useBatchVote, type UseBatchVoteResult, type BatchVoteResult } from './useBatchVote';
export type {
  VoteCart,
  VoteCartItem,
  VoteCartCostSummary,
  VoteCartStatus,
  VoteCartError,
} from '../types/voteCart';

// Hook for real-time founder proposals via WebSocket subscription
export { useFounderSubscription } from './useFounderSubscription';
export { formatTimeSinceUpdate } from '../utils/formatters';

// Hook for detecting window/tab focus state
export {
  useWindowFocus,
  useAutoSubscriptionPause,
} from './useWindowFocus';

// Hook for founders on HomePage with winning totems
export { useFoundersForHomePage } from './useFoundersForHomePage';
export type { TrendDirection, WinningTotem, FounderForHomePage } from '../types/founder';

// Hook for user's votes on a specific founder with triple details (My Votes section)
export { useUserVotesForFounder, type UserVoteWithDetails } from './useUserVotesForFounder';
