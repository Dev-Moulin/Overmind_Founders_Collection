/**
 * Vote Cart Storage - localStorage persistence helpers
 *
 * Extracted from useVoteCart.ts
 * Handles serialization/deserialization and localStorage operations
 *
 * @see useVoteCart.ts
 */

import { type Hex } from 'viem';
import { type CurveId, CURVE_LINEAR } from '../../blockchain/vault/useVote';
import type { VoteCart } from '../../../types/voteCart';

// localStorage key prefix for vote carts
export const STORAGE_KEY_PREFIX = 'ofc_vote_cart_';

/**
 * Serializable version of VoteCartItem for localStorage
 * bigint values are stored as strings
 */
export interface SerializedVoteCartItem {
  id: string;
  totemId: Hex | null;
  totemName: string;
  predicateId: Hex;
  termId: Hex | null;
  counterTermId: Hex | null;
  direction: 'for' | 'against';
  curveId: CurveId; // 1 = Linear, 2 = Progressive
  amount: string; // bigint as string
  currentPosition?: {
    direction: 'for' | 'against';
    shares: string; // bigint as string
    curveId: CurveId; // curveId of existing position (for correct redeem)
  };
  needsWithdraw: boolean;
  isNewTotem: boolean;
  newTotemData?: {
    name: string;
    category: string;
    categoryTermId: string | null;
    isNewCategory: boolean;
  };
}

export interface SerializedVoteCart {
  founderId: Hex;
  founderName: string;
  items: SerializedVoteCartItem[];
  savedAt: number; // timestamp
}

/**
 * Serialize cart for localStorage
 */
export function serializeCart(cart: VoteCart): SerializedVoteCart {
  return {
    founderId: cart.founderId,
    founderName: cart.founderName,
    items: cart.items.map((item) => ({
      ...item,
      amount: item.amount.toString(),
      currentPosition: item.currentPosition
        ? {
            direction: item.currentPosition.direction,
            shares: item.currentPosition.shares.toString(),
            curveId: item.currentPosition.curveId,
          }
        : undefined,
    })),
    savedAt: Date.now(),
  };
}

/**
 * Deserialize cart from localStorage
 */
export function deserializeCart(data: SerializedVoteCart): VoteCart {
  return {
    founderId: data.founderId,
    founderName: data.founderName,
    items: data.items.map((item) => ({
      ...item,
      // Default to Linear for old cart items that don't have curveId
      curveId: (item as { curveId?: CurveId }).curveId ?? CURVE_LINEAR,
      amount: BigInt(item.amount),
      currentPosition: item.currentPosition
        ? {
            direction: item.currentPosition.direction,
            shares: BigInt(item.currentPosition.shares),
            // Default to Linear for old cart items that don't have position curveId
            curveId: item.currentPosition.curveId ?? CURVE_LINEAR,
          }
        : undefined,
    })),
  };
}

/**
 * Get storage key for a founder
 */
export function getStorageKey(founderId: Hex): string {
  return `${STORAGE_KEY_PREFIX}${founderId}`;
}

/**
 * Load cart from localStorage
 */
export function loadCartFromStorage(founderId: Hex): VoteCart | null {
  try {
    const key = getStorageKey(founderId);
    const stored = localStorage.getItem(key);
    if (!stored) return null;

    const data: SerializedVoteCart = JSON.parse(stored);

    // Check if cart is older than 24 hours (expired)
    const maxAge = 24 * 60 * 60 * 1000; // 24 hours
    if (Date.now() - data.savedAt > maxAge) {
      localStorage.removeItem(key);
      return null;
    }

    return deserializeCart(data);
  } catch (error) {
    console.warn('[useVoteCart] Error loading cart from storage:', error);
    return null;
  }
}

/**
 * Save cart to localStorage
 */
export function saveCartToStorage(cart: VoteCart): void {
  try {
    const key = getStorageKey(cart.founderId);
    const serialized = serializeCart(cart);
    localStorage.setItem(key, JSON.stringify(serialized));
  } catch (error) {
    console.warn('[useVoteCart] Error saving cart to storage:', error);
  }
}

/**
 * Remove cart from localStorage
 */
export function removeCartFromStorage(founderId: Hex): void {
  try {
    const key = getStorageKey(founderId);
    localStorage.removeItem(key);
  } catch (error) {
    console.warn('[useVoteCart] Error removing cart from storage:', error);
  }
}

/**
 * Load ALL carts from localStorage
 * Scans for all keys with STORAGE_KEY_PREFIX and returns a Map
 */
export function loadAllCartsFromStorage(): Map<Hex, VoteCart> {
  const carts = new Map<Hex, VoteCart>();
  const maxAge = 24 * 60 * 60 * 1000; // 24 hours
  const now = Date.now();

  try {
    // Scan localStorage for all cart keys
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key || !key.startsWith(STORAGE_KEY_PREFIX)) continue;

      try {
        const stored = localStorage.getItem(key);
        if (!stored) continue;

        const data: SerializedVoteCart = JSON.parse(stored);

        // Skip expired carts
        if (now - data.savedAt > maxAge) {
          localStorage.removeItem(key);
          continue;
        }

        // Skip empty carts
        if (!data.items || data.items.length === 0) {
          localStorage.removeItem(key);
          continue;
        }

        const cart = deserializeCart(data);
        carts.set(cart.founderId, cart);
      } catch (parseError) {
        console.warn('[loadAllCartsFromStorage] Error parsing cart:', key, parseError);
        // Remove corrupted cart
        localStorage.removeItem(key);
      }
    }
  } catch (error) {
    console.warn('[loadAllCartsFromStorage] Error scanning localStorage:', error);
  }

  return carts;
}
