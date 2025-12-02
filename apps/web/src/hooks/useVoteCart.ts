/**
 * useVoteCart - Vote Cart State Management
 *
 * Hook for managing a cart of votes that can be batch-submitted.
 * Allows users to accumulate multiple votes on different totems
 * for a single founder before executing them in minimal transactions.
 *
 * @see Documentation: Claude/00_GESTION_PROJET/Projet_02_SDK_V2/TODO_Implementation.md
 * @see Contract Reference: Claude/00_GESTION_PROJET/Projet_02_SDK_V2/17_EthMultiVault_V2_Reference.md
 */

import { useState, useCallback, useMemo } from 'react';
import { type Hex, parseEther, formatEther } from 'viem';
import { useProtocolConfig } from './useProtocolConfig';
import type {
  VoteCart,
  VoteCartItem,
  VoteCartCostSummary,
} from '../types/voteCart';

/**
 * Input for adding an item to the cart
 */
export interface AddToCartInput {
  totemId: Hex;
  totemName: string;
  predicateId: Hex;
  termId: Hex;
  counterTermId: Hex;
  direction: 'for' | 'against';
  amount: string; // In TRUST (will be converted to wei)
  currentPosition?: {
    direction: 'for' | 'against';
    shares: bigint;
  };
  isNewTotem?: boolean;
}

/**
 * Result of useVoteCart hook
 */
export interface UseVoteCartResult {
  /** Current cart state */
  cart: VoteCart | null;
  /** Number of items in cart */
  itemCount: number;
  /** Cost summary for the cart */
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
  /** Check if an item exists in cart by totemId */
  hasItem: (totemId: Hex) => boolean;
  /** Get item by totemId */
  getItem: (totemId: Hex) => VoteCartItem | undefined;
  /** Formatted total cost for display */
  formattedNetCost: string;
  /** Formatted total deposits */
  formattedTotalDeposits: string;
  /** Is cart valid for submission */
  isValid: boolean;
  /** Validation errors */
  validationErrors: string[];
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

  /**
   * Initialize cart for a founder
   */
  const initCart = useCallback((founderId: Hex, founderName: string) => {
    setCart({
      founderId,
      founderName,
      items: [],
    });
  }, []);

  /**
   * Add an item to the cart
   */
  const addItem = useCallback((input: AddToCartInput) => {
    setCart((prev) => {
      if (!prev) {
        console.warn('[useVoteCart] Cannot add item: cart not initialized');
        return prev;
      }

      // Check if item for this totem already exists
      const existingIndex = prev.items.findIndex(
        (item) => item.totemId === input.totemId
      );

      let amountWei: bigint;
      try {
        amountWei = parseEther(input.amount);
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
        amount: amountWei,
        currentPosition: input.currentPosition,
        needsWithdraw,
        isNewTotem: input.isNewTotem ?? false,
      };

      if (existingIndex >= 0) {
        // Update existing item
        const newItems = [...prev.items];
        newItems[existingIndex] = { ...newItem, id: prev.items[existingIndex].id };
        return { ...prev, items: newItems };
      }

      // Add new item
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
   * Clear all items from cart
   */
  const clearCart = useCallback(() => {
    setCart((prev) => {
      if (!prev) return prev;
      return { ...prev, items: [] };
    });
  }, []);

  /**
   * Check if an item exists in cart by totemId
   */
  const hasItem = useCallback(
    (totemId: Hex): boolean => {
      return cart?.items.some((item) => item.totemId === totemId) ?? false;
    },
    [cart]
  );

  /**
   * Get item by totemId
   */
  const getItem = useCallback(
    (totemId: Hex): VoteCartItem | undefined => {
      return cart?.items.find((item) => item.totemId === totemId);
    },
    [cart]
  );

  /**
   * Calculate cost summary
   */
  const costSummary = useMemo((): VoteCartCostSummary | null => {
    if (!cart || !config) return null;

    let totalDeposits = 0n;
    let totalWithdrawable = 0n;
    let atomCreationCosts = 0n;
    let withdrawCount = 0;
    let newTotemCount = 0;

    for (const item of cart.items) {
      totalDeposits += item.amount;

      if (item.needsWithdraw && item.currentPosition) {
        // Approximate withdrawable amount (actual uses previewRedeem)
        // Apply exit fee (e.g., 7%)
        const exitFeePercent = BigInt(config.exitFee);
        const feeDenominator = BigInt(config.feeDenominator);
        const grossWithdrawable = item.currentPosition.shares;
        const feeAmount = (grossWithdrawable * exitFeePercent) / feeDenominator;
        totalWithdrawable += grossWithdrawable - feeAmount;
        withdrawCount++;
      }

      if (item.isNewTotem) {
        atomCreationCosts += BigInt(config.atomCost);
        newTotemCount++;
      }
    }

    // Calculate entry fees
    const entryFeePercent = BigInt(config.entryFee);
    const feeDenominator = BigInt(config.feeDenominator);
    const estimatedEntryFees = (totalDeposits * entryFeePercent) / feeDenominator;

    // Net cost = deposits + entry fees + atom costs - withdrawable
    const netCost =
      totalDeposits + estimatedEntryFees + atomCreationCosts - totalWithdrawable;

    return {
      totalDeposits,
      totalWithdrawable,
      estimatedEntryFees,
      atomCreationCosts,
      netCost,
      withdrawCount,
      newTotemCount,
    };
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
    return value.toFixed(4);
  }, [costSummary]);

  const formattedTotalDeposits = useMemo(() => {
    if (!costSummary) return '0';
    const value = Number(formatEther(costSummary.totalDeposits));
    return value.toFixed(4);
  }, [costSummary]);

  /**
   * Validate cart
   */
  const validationResult = useMemo(() => {
    const errors: string[] = [];

    if (!cart) {
      errors.push('Panier non initialisé');
      return { isValid: false, errors };
    }

    if (cart.items.length === 0) {
      errors.push('Le panier est vide');
      return { isValid: false, errors };
    }

    if (!config) {
      errors.push('Configuration du protocole non chargée');
      return { isValid: false, errors };
    }

    const minDepositWei = BigInt(config.minDeposit);

    for (const item of cart.items) {
      if (item.amount < minDepositWei) {
        errors.push(
          `${item.totemName}: montant minimum requis ${config.formattedMinDeposit} TRUST`
        );
      }

      if (item.amount <= 0n) {
        errors.push(`${item.totemName}: montant invalide`);
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }, [cart, config]);

  return {
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
    formattedNetCost,
    formattedTotalDeposits,
    isValid: validationResult.isValid,
    validationErrors: validationResult.errors,
  };
}
