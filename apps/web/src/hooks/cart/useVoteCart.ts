/**
 * useVoteCart - Vote Cart State Management
 *
 * Hook for managing a cart of votes that can be batch-submitted.
 * Allows users to accumulate multiple votes on different totems
 * for a single founder before executing them in minimal transactions.
 *
 * Features:
 * - localStorage persistence (survives page refresh)
 * - Per-founder carts (each founder has its own cart)
 *
 * @see Documentation: Claude/00_GESTION_PROJET/Projet_02_SDK_V2/TODO_Implementation.md
 * @see Contract Reference: Claude/00_GESTION_PROJET/Projet_02_SDK_V2/17_EthMultiVault_V2_Reference.md
 */

import { useState, useCallback, useMemo, useEffect, createContext, useContext } from 'react';
import { type Hex, parseEther, formatEther } from 'viem';
import { useProtocolConfig } from '../config/useProtocolConfig';
import { type CurveId, CURVE_LINEAR } from '../blockchain/vault/useVote';
import { truncateAmount } from '../../utils/formatters';
import type {
  VoteCart,
  VoteCartItem,
  VoteCartCostSummary,
} from '../../types/voteCart';

// Storage helpers (extracted to storage/)
import {
  loadCartFromStorage,
  loadAllCartsFromStorage,
  saveCartToStorage,
  removeCartFromStorage,
} from './storage';

// Helpers (extracted to helpers/)
import { calculateCostSummary, validateCart } from './helpers';

/**
 * Input for adding an item to the cart
 */
export interface AddToCartInput {
  totemId: Hex | null;
  totemName: string;
  predicateId: Hex;
  termId: Hex | null;
  counterTermId: Hex | null;
  direction: 'for' | 'against';
  /** Bonding curve: 1 = Linear (default), 2 = Progressive */
  curveId?: CurveId;
  amount: string; // In TRUST (will be converted to wei)
  /** Existing position info (includes curveId for correct redeem) */
  currentPosition?: {
    direction: 'for' | 'against';
    shares: bigint;
    /** The curveId of the existing position (needed for correct redeem) */
    curveId: CurveId;
  };
  isNewTotem?: boolean;
  /** Data for creating a new totem (only when isNewTotem is true) */
  newTotemData?: {
    name: string;
    category: string;
    categoryTermId: string | null;
    isNewCategory: boolean;
  };
}

/**
 * Result of useVoteCart hook
 */
export interface UseVoteCartResult {
  /** Current cart state (for active founder) */
  cart: VoteCart | null;
  /** Number of items in current cart */
  itemCount: number;
  /** Cost summary for the current cart */
  costSummary: VoteCartCostSummary | null;
  /** Initialize cart for a founder */
  initCart: (founderId: Hex, founderName: string) => void;
  /** Add an item to the cart */
  addItem: (input: AddToCartInput) => void;
  /** Remove an item from the cart */
  removeItem: (itemId: string) => void;
  /** Update amount for an item */
  updateAmount: (itemId: string, amount: string) => void;
  /** Update direction for an item */
  updateDirection: (itemId: string, direction: 'for' | 'against') => void;
  /** Clear all items from cart */
  clearCart: () => void;
  /** Check if an item exists in cart by totemId (optionally filter by direction and curveId) */
  hasItem: (totemId: Hex, direction?: 'for' | 'against', curveId?: CurveId) => boolean;
  /** Get item by totemId (optionally filter by direction and curveId) */
  getItem: (totemId: Hex, direction?: 'for' | 'against', curveId?: CurveId) => VoteCartItem | undefined;
  /** Get all items for a totemId (all 4 possible positions) */
  getItemsForTotem: (totemId: Hex) => VoteCartItem[];
  /** Formatted total cost for display */
  formattedNetCost: string;
  /** Formatted total deposits */
  formattedTotalDeposits: string;
  /** Formatted triple creation costs */
  formattedTripleCreationCosts: string;
  /** Formatted effective deposit (after triple costs) */
  formattedEffectiveDeposit: string;
  /** Is cart valid for submission */
  isValid: boolean;
  /** Validation errors */
  validationErrors: string[];

  // ============ MULTI-FOUNDER CART ============
  /** All carts from all founders (Map<founderId, VoteCart>) */
  allCarts: Map<Hex, VoteCart>;
  /** Total items across ALL founders */
  totalItemCount: number;
  /** Clear cart for a specific founder */
  clearFounderCart: (founderId: Hex) => void;
  /** Remove item from a specific founder's cart */
  removeItemFromFounder: (founderId: Hex, itemId: string) => void;
  /** Update amount for an item in a specific founder's cart */
  updateAmountInFounder: (founderId: Hex, itemId: string, amount: string) => void;
  /** Reload all carts from localStorage */
  reloadAllCarts: () => void;
}

/**
 * Generate unique ID for cart items
 */
function generateItemId(): string {
  return `vote-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Hook to manage vote cart state
 *
 * @example
 * ```tsx
 * function VoteCartExample({ founder }) {
 *   const {
 *     cart,
 *     itemCount,
 *     costSummary,
 *     addItem,
 *     removeItem,
 *     clearCart,
 *     formattedNetCost,
 *     isValid,
 *   } = useVoteCart();
 *
 *   // Initialize cart for a founder
 *   useEffect(() => {
 *     initCart(founder.id, founder.name);
 *   }, [founder]);
 *
 *   // Add a vote to cart
 *   const handleAddVote = (totem, direction) => {
 *     addItem({
 *       totemId: totem.id,
 *       totemName: totem.label,
 *       predicateId: totem.predicateId,
 *       termId: totem.termId,
 *       counterTermId: totem.counterTermId,
 *       direction,
 *       amount: "0.01",
 *     });
 *   };
 *
 *   return (
 *     <div>
 *       <p>{itemCount} items in cart</p>
 *       <p>Total cost: {formattedNetCost} TRUST</p>
 *       {cart?.items.map(item => (
 *         <CartItem
 *           key={item.id}
 *           item={item}
 *           onRemove={() => removeItem(item.id)}
 *         />
 *       ))}
 *     </div>
 *   );
 * }
 * ```
 */
export function useVoteCart(): UseVoteCartResult {
  const { config } = useProtocolConfig();
  const [cart, setCart] = useState<VoteCart | null>(null);

  // ============ MULTI-FOUNDER STATE ============
  const [allCarts, setAllCarts] = useState<Map<Hex, VoteCart>>(new Map());

  /**
   * Load all carts from localStorage on mount
   */
  useEffect(() => {
    const carts = loadAllCartsFromStorage();
    setAllCarts(carts);
  }, []);

  /**
   * Sync allCarts when current cart changes
   */
  useEffect(() => {
    if (cart) {
      setAllCarts(prev => {
        const newMap = new Map(prev);
        if (cart.items.length > 0) {
          newMap.set(cart.founderId, cart);
        } else {
          newMap.delete(cart.founderId);
        }
        return newMap;
      });
    }
  }, [cart]);

  /**
   * Persist cart to localStorage whenever it changes
   */
  useEffect(() => {
    if (cart && cart.items.length > 0) {
      saveCartToStorage(cart);
    } else if (cart && cart.items.length === 0) {
      // Remove from storage when cart is empty
      removeCartFromStorage(cart.founderId);
    }
  }, [cart]);

  /**
   * Initialize cart for a founder
   * Attempts to restore from localStorage if available
   * Validates and adjusts amounts for items below minimum
   */
  const initCart = useCallback((founderId: Hex, founderName: string) => {
    // Try to load existing cart from localStorage
    const savedCart = loadCartFromStorage(founderId);
    if (savedCart) {
      console.log('[useVoteCart] Restored cart from localStorage:', savedCart.items.length, 'items');

      // Validate and fix amounts for restored items
      if (config) {
        const minDepositWei = BigInt(config.minDeposit);
        const tripleCostWei = BigInt(config.tripleCost);

        const fixedItems = savedCart.items.map(item => {
          const minRequired = item.isNewTotem
            ? tripleCostWei + minDepositWei
            : minDepositWei;

          if (item.amount < minRequired) {
            console.log(`[useVoteCart] Fixing amount for "${item.totemName}": ${formatEther(item.amount)} -> ${formatEther(minRequired)}`);
            return { ...item, amount: minRequired };
          }
          return item;
        });

        setCart({ ...savedCart, items: fixedItems });
      } else {
        setCart(savedCart);
      }
    } else {
      setCart({
        founderId,
        founderName,
        items: [],
      });
    }
  }, [config]);

  /**
   * Add an item to the cart
   */
  const addItem = useCallback((input: AddToCartInput) => {
    console.log('[useVoteCart] ========== ADD ITEM START ==========');
    console.log('[useVoteCart] Input received:', input);

    setCart((prev) => {
      if (!prev) {
        console.warn('[useVoteCart] Cannot add item: cart not initialized');
        return prev;
      }

      console.log('[useVoteCart] Current cart state:', {
        founderId: prev.founderId,
        founderName: prev.founderName,
        itemCount: prev.items.length,
      });

      // Check if item for this totem + direction + curve already exists
      // This allows up to 4 positions per totem (L-Support, L-Oppose, P-Support, P-Oppose)
      const inputCurveId = input.curveId ?? CURVE_LINEAR;

      console.log('[useVoteCart] ===== MATCHING CHECK =====');
      console.log('[useVoteCart] Input to match:', {
        totemId: input.totemId,
        totemName: input.totemName,
        direction: input.direction,
        curveId: inputCurveId,
      });
      console.log('[useVoteCart] Existing items in cart:');
      prev.items.forEach((item, idx) => {
        console.log(`[useVoteCart]   [${idx}] totemId=${item.totemId}, name=${item.totemName}, direction=${item.direction}, curveId=${item.curveId}`);
      });

      const existingIndex = prev.items.findIndex((item) => {
        const totemMatch = input.totemId === null
          ? (item.totemId === null && item.totemName === input.totemName)
          : (item.totemId === input.totemId);
        const directionMatch = item.direction === input.direction;
        const curveMatch = item.curveId === inputCurveId;

        console.log(`[useVoteCart] Comparing with item "${item.totemName}": totemMatch=${totemMatch}, directionMatch=${directionMatch}, curveMatch=${curveMatch}`);

        return totemMatch && directionMatch && curveMatch;
      });
      console.log('[useVoteCart] Existing item index:', existingIndex);
      console.log('[useVoteCart] ===== END MATCHING =====');

      let amountWei: bigint;
      try {
        amountWei = parseEther(input.amount);
        console.log('[useVoteCart] Amount parsed:', input.amount, '-> wei:', amountWei.toString());
      } catch {
        console.error('[useVoteCart] Invalid amount:', input.amount);
        return prev;
      }

      // Determine if withdrawal is needed (position on opposite side)
      const needsWithdraw =
        !!input.currentPosition &&
        input.currentPosition.direction !== input.direction;

      const newItem: VoteCartItem = {
        id: generateItemId(),
        totemId: input.totemId,
        totemName: input.totemName,
        predicateId: input.predicateId,
        termId: input.termId,
        counterTermId: input.counterTermId,
        direction: input.direction,
        curveId: input.curveId ?? CURVE_LINEAR,
        amount: amountWei,
        currentPosition: input.currentPosition,
        needsWithdraw,
        isNewTotem: input.isNewTotem ?? false,
        newTotemData: input.newTotemData,
      };

      console.log('[useVoteCart] New item created:', {
        id: newItem.id,
        totemId: newItem.totemId,
        totemName: newItem.totemName,
        termId: newItem.termId,
        counterTermId: newItem.counterTermId,
        direction: newItem.direction,
        curveId: newItem.curveId,
        amount: newItem.amount.toString(),
        isNewTotem: newItem.isNewTotem,
        needsWithdraw: newItem.needsWithdraw,
        newTotemData: newItem.newTotemData,
      });

      if (existingIndex >= 0) {
        // ACCUMULATE amounts instead of replacing
        const existingItem = prev.items[existingIndex];
        const accumulatedAmount = existingItem.amount + amountWei;
        console.log('[useVoteCart] Accumulating amount for existing item at index:', existingIndex);
        console.log('[useVoteCart] Existing amount:', formatEther(existingItem.amount), '+ new:', formatEther(amountWei), '= total:', formatEther(accumulatedAmount));

        const newItems = [...prev.items];
        newItems[existingIndex] = {
          ...existingItem,
          // Accumulate the amount
          amount: accumulatedAmount,
          // Update position info in case it changed
          currentPosition: input.currentPosition,
          needsWithdraw,
        };
        return { ...prev, items: newItems };
      }

      // Add new item
      console.log('[useVoteCart] Adding new item to cart. New count:', prev.items.length + 1);
      console.log('[useVoteCart] ========== ADD ITEM END ==========');
      return { ...prev, items: [...prev.items, newItem] };
    });
  }, []);

  /**
   * Remove an item from the cart
   */
  const removeItem = useCallback((itemId: string) => {
    setCart((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        items: prev.items.filter((item) => item.id !== itemId),
      };
    });
  }, []);

  /**
   * Update amount for an item
   */
  const updateAmount = useCallback((itemId: string, amount: string) => {
    setCart((prev) => {
      if (!prev) return prev;

      let amountWei: bigint;
      try {
        amountWei = parseEther(amount);
      } catch {
        console.error('[useVoteCart] Invalid amount:', amount);
        return prev;
      }

      return {
        ...prev,
        items: prev.items.map((item) =>
          item.id === itemId ? { ...item, amount: amountWei } : item
        ),
      };
    });
  }, []);

  /**
   * Update direction for an item
   */
  const updateDirection = useCallback(
    (itemId: string, direction: 'for' | 'against') => {
      setCart((prev) => {
        if (!prev) return prev;

        return {
          ...prev,
          items: prev.items.map((item) => {
            if (item.id !== itemId) return item;

            // Recalculate needsWithdraw based on new direction
            const needsWithdraw =
              !!item.currentPosition &&
              item.currentPosition.direction !== direction;

            return { ...item, direction, needsWithdraw };
          }),
        };
      });
    },
    []
  );

  /**
   * Clear all items from cart (also removes from localStorage)
   */
  const clearCart = useCallback(() => {
    setCart((prev) => {
      if (!prev) return prev;
      // Remove from localStorage immediately
      removeCartFromStorage(prev.founderId);
      return { ...prev, items: [] };
    });
  }, []);

  /**
   * Check if an item exists in cart by totemId
   * Optionally filter by direction and curveId for exact match
   */
  const hasItem = useCallback(
    (totemId: Hex, direction?: 'for' | 'against', curveId?: CurveId): boolean => {
      if (!cart) return false;
      return cart.items.some((item) => {
        if (item.totemId !== totemId) return false;
        if (direction !== undefined && item.direction !== direction) return false;
        if (curveId !== undefined && item.curveId !== curveId) return false;
        return true;
      });
    },
    [cart]
  );

  /**
   * Get item by totemId
   * Optionally filter by direction and curveId for exact match
   */
  const getItem = useCallback(
    (totemId: Hex, direction?: 'for' | 'against', curveId?: CurveId): VoteCartItem | undefined => {
      if (!cart) return undefined;
      return cart.items.find((item) => {
        if (item.totemId !== totemId) return false;
        if (direction !== undefined && item.direction !== direction) return false;
        if (curveId !== undefined && item.curveId !== curveId) return false;
        return true;
      });
    },
    [cart]
  );

  /**
   * Get all items for a totemId (all positions)
   */
  const getItemsForTotem = useCallback(
    (totemId: Hex): VoteCartItem[] => {
      if (!cart) return [];
      return cart.items.filter((item) => item.totemId === totemId);
    },
    [cart]
  );

  /**
   * Calculate cost summary (logic extracted to helpers/calculateCostSummary.ts)
   */
  const costSummary = useMemo((): VoteCartCostSummary | null => {
    if (!cart || !config) return null;
    return calculateCostSummary(cart.items, config);
  }, [cart, config]);

  /**
   * Item count
   */
  const itemCount = cart?.items.length ?? 0;

  /**
   * Formatted values for display
   */
  const formattedNetCost = useMemo(() => {
    if (!costSummary) return '0';
    const value = Number(formatEther(costSummary.netCost));
    return truncateAmount(value);
  }, [costSummary]);

  const formattedTotalDeposits = useMemo(() => {
    if (!costSummary) return '0';
    const value = Number(formatEther(costSummary.totalDeposits));
    return truncateAmount(value);
  }, [costSummary]);

  const formattedTripleCreationCosts = useMemo(() => {
    if (!costSummary) return '0';
    const value = Number(formatEther(costSummary.tripleCreationCosts));
    return truncateAmount(value);
  }, [costSummary]);

  // Effective deposit = what will actually be deposited after triple costs
  const formattedEffectiveDeposit = useMemo(() => {
    if (!costSummary) return '0';
    const effective = costSummary.totalDeposits - costSummary.tripleCreationCosts;
    const value = Number(formatEther(effective > 0n ? effective : 0n));
    return truncateAmount(value);
  }, [costSummary]);

  /**
   * Validate cart (logic extracted to helpers/validateCart.ts)
   */
  const validationResult = useMemo(() => {
    return validateCart(cart?.items ?? null, config);
  }, [cart, config]);

  // ============ MULTI-FOUNDER FUNCTIONS ============

  /**
   * Total item count across ALL founders
   */
  const totalItemCount = useMemo(() => {
    let count = 0;
    allCarts.forEach((c) => {
      count += c.items.length;
    });
    return count;
  }, [allCarts]);

  /**
   * Clear cart for a specific founder
   */
  const clearFounderCart = useCallback((founderId: Hex) => {
    removeCartFromStorage(founderId);
    setAllCarts(prev => {
      const newMap = new Map(prev);
      newMap.delete(founderId);
      return newMap;
    });
    // If clearing the current cart, also clear local state
    if (cart?.founderId === founderId) {
      setCart(prev => prev ? { ...prev, items: [] } : null);
    }
  }, [cart?.founderId]);

  /**
   * Remove item from a specific founder's cart
   */
  const removeItemFromFounder = useCallback((founderId: Hex, itemId: string) => {
    setAllCarts(prev => {
      const newMap = new Map(prev);
      const founderCart = newMap.get(founderId);
      if (!founderCart) return prev;

      const newItems = founderCart.items.filter(item => item.id !== itemId);
      if (newItems.length === 0) {
        newMap.delete(founderId);
        removeCartFromStorage(founderId);
      } else {
        const updatedCart = { ...founderCart, items: newItems };
        newMap.set(founderId, updatedCart);
        saveCartToStorage(updatedCart);
      }
      return newMap;
    });
    // If modifying the current cart, also update local state
    if (cart?.founderId === founderId) {
      setCart(prev => {
        if (!prev) return prev;
        return { ...prev, items: prev.items.filter(item => item.id !== itemId) };
      });
    }
  }, [cart?.founderId]);

  /**
   * Update amount for an item in a specific founder's cart
   */
  const updateAmountInFounder = useCallback((founderId: Hex, itemId: string, amount: string) => {
    let amountWei: bigint;
    try {
      amountWei = parseEther(amount);
    } catch {
      console.error('[useVoteCart] Invalid amount:', amount);
      return;
    }

    setAllCarts(prev => {
      const newMap = new Map(prev);
      const founderCart = newMap.get(founderId);
      if (!founderCart) return prev;

      const newItems = founderCart.items.map(item =>
        item.id === itemId ? { ...item, amount: amountWei } : item
      );
      const updatedCart = { ...founderCart, items: newItems };
      newMap.set(founderId, updatedCart);
      saveCartToStorage(updatedCart);
      return newMap;
    });
    // If modifying the current cart, also update local state
    if (cart?.founderId === founderId) {
      setCart(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          items: prev.items.map(item =>
            item.id === itemId ? { ...item, amount: amountWei } : item
          ),
        };
      });
    }
  }, [cart?.founderId]);

  /**
   * Reload all carts from localStorage
   */
  const reloadAllCarts = useCallback(() => {
    const carts = loadAllCartsFromStorage();
    setAllCarts(carts);
  }, []);

  // IMPORTANT: Memoize the return value to prevent unnecessary re-renders
  // when this hook's result is passed to a Context Provider
  return useMemo(() => ({
    cart,
    itemCount,
    costSummary,
    initCart,
    addItem,
    removeItem,
    updateAmount,
    updateDirection,
    clearCart,
    hasItem,
    getItem,
    getItemsForTotem,
    formattedNetCost,
    formattedTotalDeposits,
    formattedTripleCreationCosts,
    formattedEffectiveDeposit,
    isValid: validationResult.isValid,
    validationErrors: validationResult.errors,
    // Multi-founder cart
    allCarts,
    totalItemCount,
    clearFounderCart,
    removeItemFromFounder,
    updateAmountInFounder,
    reloadAllCarts,
  }), [
    cart,
    itemCount,
    costSummary,
    initCart,
    addItem,
    removeItem,
    updateAmount,
    updateDirection,
    clearCart,
    hasItem,
    getItem,
    getItemsForTotem,
    formattedNetCost,
    formattedTotalDeposits,
    formattedTripleCreationCosts,
    formattedEffectiveDeposit,
    validationResult.isValid,
    validationResult.errors,
    // Multi-founder cart
    allCarts,
    totalItemCount,
    clearFounderCart,
    removeItemFromFounder,
    updateAmountInFounder,
    reloadAllCarts,
  ]);
}

// ============================================================================
// CONTEXT - For sharing cart state across components
// ============================================================================

/**
 * Context for sharing vote cart state
 */
export const VoteCartContext = createContext<UseVoteCartResult | null>(null);

/**
 * Hook to access shared vote cart state from context
 * Must be used within a VoteCartProvider
 *
 * @throws Error if used outside of VoteCartProvider
 */
export function useVoteCartContext(): UseVoteCartResult {
  const context = useContext(VoteCartContext);
  if (!context) {
    throw new Error('useVoteCartContext must be used within a VoteCartProvider');
  }
  return context;
}
