/**
 * Vote-related types
 */

import type { Deposit } from '../lib/graphql/types';

/**
 * Enriched vote with computed data
 */
export interface VoteWithDetails extends Deposit {
  isPositive: boolean; // true = FOR, false = AGAINST
  formattedAmount: string; // Human-readable amount (e.g., "10.50")
}

/**
 * Status of a vote operation
 */
export type VoteStatus =
  | 'idle'
  | 'checking'
  | 'depositing'
  | 'success'
  | 'error';

/**
 * Error during vote operation
 */
export interface VoteError {
  code: string;
  message: string;
  step: 'checking' | 'depositing';
}
