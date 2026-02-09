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
export {
  useVote,
  type UseVoteResult,
  type CurveId,
  type VoteOptions,
  CURVE_LINEAR,
  CURVE_PROGRESSIVE,
} from './blockchain/vault/useVote';
export type { VoteStatus, VoteError, VoteWithDetails } from '../types/vote';

// Hook for withdrawing TRUST from vaults
export {
  useWithdraw,
  estimateWithdrawAmount,
  type UseWithdrawResult,
} from './blockchain/vault/useWithdraw';
export type { WithdrawStatus, WithdrawError, WithdrawPreview } from '../types/withdraw';

// Batch operations - Version refactorisée (15.8/15.9)
// useBatchVote.ts, useBatchDeposit.ts, useBatchRedeem.ts supprimés le 21/01/2026
export { useBatchVote, type UseBatchVoteResult, type BatchVoteResult } from './blockchain/batch/useBatchVote.refactored';
export {
  useBatchTriples,
  type BatchTripleItem,
  type TripleValidation,
  type BatchTripleCost,
  type BatchTripleResult,
  type UseBatchTriplesResult,
} from './blockchain/batch/useBatchTriples';

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

// Hook for creating new totems (atom + category triple) without deposit
// NEW: Séparation création/dépôt pour résoudre bug counterTermId (15.9)
export {
  useCreateTotemWithTriples,
  type TotemCreationInput,
  type TotemCreationResult,
  type CreationStep,
  type UseCreateTotemWithTriplesResult,
} from './blockchain/claims/useCreateTotemWithTriples';

// Preview hooks
export { usePreviewDeposit } from './blockchain/vault/usePreviewDeposit';
export { usePreviewRedeem } from './blockchain/vault/usePreviewRedeem';
export { usePositionFromContract, usePositionBothSides } from './blockchain/vault/usePositionFromContract';

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

// Type for totem voters (useTotemVoters kept for future use)
export type { TotemVoter } from '../types/voter';

// Hook for real-time founder proposals via WebSocket subscription
export { useFounderSubscription } from './data/useFounderSubscription';
export { formatTimeSinceUpdate } from '../utils/formatters';

// Hook for founders on HomePage with winning totems
export { useFoundersForHomePage } from './data/useFoundersForHomePage';
export type { TrendDirection, WinningTotem, FounderForHomePage, CurveWinnerInfo } from '../types/founder';

// Hook for user's votes on a specific founder with triple details (My Votes section)
export { useUserVotesForFounder, type UserVoteWithDetails } from './data/useUserVotesForFounder';

// Hook for founder panel stats (Market Cap, Holders, Claims)
export { useFounderPanelStats, type FounderPanelStats } from './data/useFounderPanelStats';

// Hook for top totems
export { useTopTotems, type TopTotem } from './data/useTopTotems';

// Hook for top totems with Linear/Progressive curve breakdown
export {
  useTopTotemsByCurve,
  formatWinnerLabel,
  type TotemWithCurves,
  type CurveStats,
  type CurveWinner,
} from './data/useTopTotemsByCurve';

// Hook for all OFC totems
export { useAllOFCTotems } from './data/useAllOFCTotems';

// Hook for vote market stats
export { useVoteMarketStats } from './data/useVoteMarketStats';

// Hook for votes timeline (with Progressive curve filter by default)
// Also provides recentVotes for activity feed with correct FOR/AGAINST detection
export { useVotesTimeline, type CurveFilter, type RecentVote } from './data/useVotesTimeline';

// Hook for founder tags
export { useFounderTags, type FounderTag } from './data/useFounderTags';

// Hook for checking if a vault is initialized (for Progressive curve)
export { useVaultInitStatus } from './data/useVaultInitStatus';

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

// ============================================================================
// VOTE - Vote panel hooks (extracted from VoteTotemPanel)
// ============================================================================

// Form step management (blur, pulsation, progression)
export {
  useFormSteps,
  type FormStep,
  type UseFormStepsParams,
  type UseFormStepsResult,
} from './vote/useFormSteps';

// INTUITION protocol curve availability rules
export {
  useCurveAvailability,
  type CurveAvailability,
  type UseCurveAvailabilityParams,
} from './vote/useCurveAvailability';

// Cross-predicate blocking rules
export {
  usePredicateBlocking,
  type VotesByPredicate,
  type PredicateRedeemInfo,
  type UsePredicateBlockingParams,
  type UsePredicateBlockingResult,
} from './vote/usePredicateBlocking';

// Direction change flow management
export {
  useDirectionChange,
  type DirectionChangeInfo,
  type PendingRedeemInfo,
  type UseDirectionChangeParams,
  type UseDirectionChangeResult,
} from './vote/useDirectionChange';

// Minimum required amount calculation
export {
  useMinRequired,
  type MinRequiredAmount,
  type UseMinRequiredParams,
} from './vote/useMinRequired';

// Add to cart logic (cart item builder)
export {
  useAddToCart,
  type AddToCartFormState,
  type AddToCartFounderInfo,
  type AddToCartPositionInfo,
  type AddToCartPendingInfo,
  type UseAddToCartParams,
  type UseAddToCartResult,
} from './vote/useAddToCart';

// Multiple position withdrawal
export {
  useWithdrawMultiple,
  type WithdrawRequest,
  type UseWithdrawMultipleParams,
  type UseWithdrawMultipleResult,
} from './vote/useWithdrawMultiple';

// Cross-predicate redemption
export {
  useCrossPredicateRedeem,
  type UseCrossPredicateRedeemParams,
  type UseCrossPredicateRedeemResult,
} from './vote/useCrossPredicateRedeem';

// All user positions for withdraw panel
export {
  useAllUserPositions,
  type UserPositionInfo,
  type ClaimInfoForPositions,
  type UseAllUserPositionsParams,
  type UseAllUserPositionsResult,
} from './vote/useAllUserPositions';

// Position display calculations
export {
  usePositionDisplay,
  type SelectedCombinationPosition,
  type PendingCartAmount,
  type UsePositionDisplayParams,
  type UsePositionDisplayResult,
} from './vote/usePositionDisplay';

// Auto-select position based on user's existing position
export {
  useAutoSelectPosition,
  type UseAutoSelectPositionParams,
} from './vote/useAutoSelectPosition';
