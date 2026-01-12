/**
 * Vote Cart Types
 *
 * Types for the vote cart system allowing users to accumulate
 * multiple votes before batch submission.
 *
 * @see Documentation: Claude/00_GESTION_PROJET/Projet_02_SDK_V2/TODO_Implementation.md
 */

import type { Hex } from 'viem';
import type { CurveId } from '../hooks/blockchain/useVote';

/**
 * Information about an existing position that may need to be redeemed
 * before voting in a different direction
 */
export interface CurrentPositionInfo {
  direction: 'for' | 'against';
  shares: bigint;
  /** The curveId of the existing position (needed for correct redeem) */
  curveId: CurveId;
}

/**
 * Data for creating a new totem (when isNewTotem is true)
 */
export interface NewTotemCreationData {
  /** Name for the new totem atom */
  name: string;
  /** Category label */
  category: string;
  /** Category termId (null if new category needs to be created) */
  categoryTermId: string | null;
  /** Whether this is a new category that needs to be created first */
  isNewCategory: boolean;
}

/**
 * A single item in the vote cart
 */
export interface VoteCartItem {
  /** Unique ID for this cart item */
  id: string;
  /** The totem (object) atom ID - null for new totems being created */
  totemId: Hex | null;
  /** Human-readable totem name for display */
  totemName: string;
  /** The predicate atom ID (e.g., "is trait of") */
  predicateId: Hex;
  /** The term ID for FOR votes (triple's term_id) - null for new totems */
  termId: Hex | null;
  /** The counter term ID for AGAINST votes (triple's counter_term_id) - null for new totems */
  counterTermId: Hex | null;
  /** Vote direction: 'for' or 'against' */
  direction: 'for' | 'against';
  /** Bonding curve: 1 = Linear, 2 = Progressive */
  curveId: CurveId;
  /** Amount to deposit in wei */
  amount: bigint;
  /** Current user position on this claim (if any) - includes curveId for correct redeem */
  currentPosition?: CurrentPositionInfo;
  /** Whether user needs to withdraw before voting (opposite position) */
  needsWithdraw: boolean;
  /** Whether this is a new totem that doesn't exist yet */
  isNewTotem: boolean;
  /** Data for creating a new totem (only present when isNewTotem is true) */
  newTotemData?: NewTotemCreationData;
}

/**
 * The complete vote cart for a founder
 */
export interface VoteCart {
  /** The founder (subject) atom ID */
  founderId: Hex;
  /** Human-readable founder name for display */
  founderName: string;
  /** Items in the cart */
  items: VoteCartItem[];
}

/**
 * Summary of cart costs
 */
export interface VoteCartCostSummary {
  /** Total deposits amount (sum of all item amounts) */
  totalDeposits: bigint;
  /** Total withdrawable from opposite positions */
  totalWithdrawable: bigint;
  /** Estimated entry fees */
  estimatedEntryFees: bigint;
  /** Cost for creating new atoms (if any) */
  atomCreationCosts: bigint;
  /** Cost for creating new triples (~0.001 per triple) */
  tripleCreationCosts: bigint;
  /** Net cost (deposits + fees - withdrawable) */
  netCost: bigint;
  /** Number of items needing withdrawal first */
  withdrawCount: number;
  /** Number of new totems to create */
  newTotemCount: number;
  /** Number of new triples to create */
  newTripleCount: number;
}

/**
 * Status of cart validation/execution
 */
export type VoteCartStatus =
  | 'idle'
  | 'validating'
  | 'withdrawing'
  | 'creating_atoms'
  | 'depositing'
  | 'success'
  | 'error';

/**
 * Error during cart execution
 */
export interface VoteCartError {
  code: string;
  message: string;
  step: VoteCartStatus;
  failedItemId?: string;
}
