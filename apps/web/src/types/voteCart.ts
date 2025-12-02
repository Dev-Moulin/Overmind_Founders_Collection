/**
 * Vote Cart Types
 *
 * Types for the vote cart system allowing users to accumulate
 * multiple votes before batch submission.
 *
 * @see Documentation: Claude/00_GESTION_PROJET/Projet_02_SDK_V2/TODO_Implementation.md
 */

import type { Hex } from 'viem';

/**
 * A single item in the vote cart
 */
export interface VoteCartItem {
  /** Unique ID for this cart item */
  id: string;
  /** The totem (object) atom ID */
  totemId: Hex;
  /** Human-readable totem name for display */
  totemName: string;
  /** The predicate atom ID (e.g., "is trait of") */
  predicateId: Hex;
  /** The term ID for FOR votes (triple's term_id) */
  termId: Hex;
  /** The counter term ID for AGAINST votes (triple's counter_term_id) */
  counterTermId: Hex;
  /** Vote direction: 'for' or 'against' */
  direction: 'for' | 'against';
  /** Amount to deposit in wei */
  amount: bigint;
  /** Current user position on this claim (if any) */
  currentPosition?: {
    direction: 'for' | 'against';
    shares: bigint;
  };
  /** Whether user needs to withdraw before voting (opposite position) */
  needsWithdraw: boolean;
  /** Whether this is a new totem that doesn't exist yet */
  isNewTotem: boolean;
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
  /** Net cost (deposits + fees - withdrawable) */
  netCost: bigint;
  /** Number of items needing withdrawal first */
  withdrawCount: number;
  /** Number of new totems to create */
  newTotemCount: number;
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
