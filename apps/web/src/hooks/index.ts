/**
 * Export all custom hooks
 *
 * Reorganized structure (08/12/2025):
 * - blockchain/ : Interactions with smart contracts
 * - data/       : GraphQL queries and subscriptions
 * - config/     : Protocol and network configuration
 * - cart/       : Vote cart management
 * - admin/      : Admin-only hooks
 * - utils/      : Utility hooks
 */

// ============================================================================
// BLOCKCHAIN - Smart contract interactions
// ============================================================================

// Hook for voting on claims
export { useVote, type UseVoteResult } from './blockchain/useVote';
export type { VoteStatus, VoteError, VoteWithDetails } from '../types/vote';

// Hook for withdrawing TRUST from vaults
export {
  useWithdraw,
  estimateWithdrawAmount,
  type UseWithdrawResult,
} from './blockchain/useWithdraw';
export type { WithdrawStatus, WithdrawError, WithdrawPreview } from '../types/withdraw';

// Batch operations
export { useBatchVote, type UseBatchVoteResult, type BatchVoteResult } from './blockchain/useBatchVote';
export { useBatchDeposit } from './blockchain/useBatchDeposit';
export { useBatchRedeem } from './blockchain/useBatchRedeem';
export {
  useBatchTriples,
  type BatchTripleItem,
  type TripleValidation,
  type BatchTripleCost,
  type BatchTripleResult,
  type UseBatchTriplesResult,
} from './blockchain/useBatchTriples';

// Hook for INTUITION protocol operations (atoms, triples, claims)
export {
  useIntuition,
  getFounderImageUrl,
  type CreateAtomResult,
  type CreateTripleResult,
  type FounderData,
  ClaimExistsError,
} from './blockchain/useIntuition';
export type { CategoryConfig } from '../types/intuition';

// Preview hooks
export { usePreviewDeposit } from './blockchain/usePreviewDeposit';
export { usePreviewRedeem } from './blockchain/usePreviewRedeem';
export { usePositionFromContract, usePositionBothSides } from './blockchain/usePositionFromContract';

// ============================================================================
// DATA - GraphQL queries and subscriptions
// ============================================================================

// GraphQL hooks for proposals
export {
  useFounderProposals,
  useProposalLimit,
  sortProposalsByVotes,
  getWinningProposal,
  formatVoteAmount,
} from './data/useFounderProposals';

// GraphQL hooks for votes
export {
  useUserVotes,
  useUserPosition,
  filterVotesByType,
  hasVotedOnTerm,
  getUserVoteDirection,
} from './data/useUserVotes';

// Hooks for vote statistics and leaderboard
export {
  useTripleVotes,
  useRecentVotes,
  useTopVoters,
  useVotesTimeline,
  useVotesDistribution,
} from './data/useVoteStats';

// Hook for fetching voters of a specific totem
export { useTotemVoters } from './data/useTotemVoters';
export type { TotemVoter } from '../types/voter';

// Hook for real-time founder proposals via WebSocket subscription
export { useFounderSubscription } from './data/useFounderSubscription';
export { formatTimeSinceUpdate } from '../utils/formatters';

// Hook for founders on HomePage with winning totems
export { useFoundersForHomePage } from './data/useFoundersForHomePage';
export type { TrendDirection, WinningTotem, FounderForHomePage } from '../types/founder';

// Hook for user's votes on a specific founder with triple details (My Votes section)
export { useUserVotesForFounder, type UserVoteWithDetails } from './data/useUserVotesForFounder';

// Hook for founder panel stats (Market Cap, Holders, Claims)
export { useFounderPanelStats, type FounderPanelStats } from './data/useFounderPanelStats';

// Hook for totem data
export { useTotemData } from './data/useTotemData';

// Hook for top totems
export { useTopTotems, type TopTotem } from './data/useTopTotems';

// Hook for all OFC totems
export { useAllOFCTotems } from './data/useAllOFCTotems';

// Hook for vote graph data
export { useVoteGraph, type GraphNode, type GraphEdge, type GraphData } from './data/useVoteGraph';

// Hook for vote market stats
export { useVoteMarketStats } from './data/useVoteMarketStats';

// Hook for votes timeline
export { useVotesTimeline as useVotesTimelineHook } from './data/useVotesTimeline';

// Hook for founder tags
export { useFounderTags, type FounderTag } from './data/useFounderTags';

// ============================================================================
// CONFIG - Protocol and network configuration
// ============================================================================

// Hook for INTUITION protocol configuration (costs, fees)
export { useProtocolConfig } from './config/useProtocolConfig';
export type { ProtocolConfig } from '../types/protocol';

// Hook for network detection
export { useNetwork } from './config/useNetwork';

// Hook for whitelist
export { useWhitelist } from './config/useWhitelist';

// ============================================================================
// CART - Vote cart management
// ============================================================================

// Vote Cart - Batch voting system
export {
  useVoteCart,
  useVoteCartContext,
  VoteCartContext,
  type UseVoteCartResult,
  type AddToCartInput
} from './cart/useVoteCart';
export type {
  VoteCart,
  VoteCartItem,
  VoteCartCostSummary,
  VoteCartStatus,
  VoteCartError,
} from '../types/voteCart';

// Cart execution
export { useCartExecution } from './cart/useCartExecution';

// Proactive claim check
export { useProactiveClaimCheck } from './cart/useProactiveClaimCheck';

// ============================================================================
// ADMIN - Admin-only hooks
// ============================================================================

export { useAdminActions } from './admin/useAdminActions';
export { useAdminAtoms } from './admin/useAdminAtoms';

// ============================================================================
// UTILS - Utility hooks
// ============================================================================

// Hook for detecting window/tab focus state
export {
  useWindowFocus,
  useAutoSubscriptionPause,
} from './utils/useWindowFocus';

// Hook for vote submission
export { useVoteSubmit } from './utils/useVoteSubmit';
