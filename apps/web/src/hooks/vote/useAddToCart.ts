/**
 * useAddToCart - Cart item builder and add logic
 *
 * Extracted from VoteTotemPanel.tsx handleAddToCart (~130 lines)
 * Builds cart item for new totem creation or existing totem vote,
 * handles position detection for auto-withdraw, and manages notifications.
 *
 * @see VoteTotemPanel.tsx
 */

import { useCallback } from 'react';
import type { Hex } from 'viem';
import type { CurveId } from '../index';
import type { NewTotemData } from '../../components/founder/TotemCreationForm';
import type { PendingRedeemInfo } from './useDirectionChange';

/** Predicate with atomId from chain */
interface PredicateWithAtom {
  id: string;
  label: string;
  atomId: string | null;
}

/** Proactive claim info from useProactiveClaimCheck */
interface ProactiveClaimInfo {
  termId: string;
  counterTermId: string;
}

/** Form state for validation */
export interface AddToCartFormState {
  isFormValid: boolean;
  selectedTotemId: string | undefined;
  selectedTotemLabel: string | undefined;
  newTotemData: NewTotemData | null | undefined;
  selectedPredicateWithAtom: PredicateWithAtom | undefined;
  voteDirection: 'for' | 'against' | 'withdraw' | null;
  selectedCurve: CurveId | null;
  trustAmount: string;
}

/** Founder info */
export interface AddToCartFounderInfo {
  name: string;
  atomId: string;
}

/** Position info for cart */
export interface AddToCartPositionInfo {
  hasAnyPosition: boolean;
  positionDirection: 'for' | 'against' | null;
  positionCurveId: CurveId | null;
  currentUserShares: bigint;
}

/** Pending redeem info (from direction change) */
export interface AddToCartPendingInfo {
  pendingRedeemInfo: PendingRedeemInfo | null;
  pendingRedeemCurve: CurveId | null;
}

export interface UseAddToCartParams {
  /** Form state */
  formState: AddToCartFormState;
  /** Founder info */
  founder: AddToCartFounderInfo;
  /** Proactive claim info (null if triple doesn't exist) */
  proactiveClaimInfo: ProactiveClaimInfo | null;
  /** Position info */
  positionInfo: AddToCartPositionInfo;
  /** Pending redeem info */
  pendingInfo: AddToCartPendingInfo;
  /** Min required amount for display */
  minRequiredDisplay: string | undefined;
  /** Add item to cart function */
  addItem: (item: unknown) => void;
  /** Reset pending redeem curve */
  setPendingRedeemCurve: (curve: CurveId | null) => void;
  /** Set trust amount */
  setTrustAmount: (amount: string) => void;
  /** Set success message */
  setSuccess: (msg: string | null) => void;
  /** Set error message */
  setError: (msg: string | null) => void;
  /** Translation function (i18next TFunction) */
  t: (key: string, defaultValue?: string | Record<string, unknown>) => string;
}

export interface UseAddToCartResult {
  /** Add current selection to cart */
  addToCart: () => void;
}

/**
 * Hook for adding vote to cart with full validation and cart item building
 */
export function useAddToCart({
  formState,
  founder,
  proactiveClaimInfo,
  positionInfo,
  pendingInfo,
  minRequiredDisplay,
  addItem,
  setPendingRedeemCurve,
  setTrustAmount,
  setSuccess,
  setError,
  t,
}: UseAddToCartParams): UseAddToCartResult {

  const addToCart = useCallback(() => {
    const {
      isFormValid,
      selectedTotemId,
      selectedTotemLabel,
      newTotemData,
      selectedPredicateWithAtom,
      voteDirection,
      selectedCurve,
      trustAmount,
    } = formState;

    const {
      hasAnyPosition,
      positionDirection,
      positionCurveId,
      currentUserShares,
    } = positionInfo;

    const { pendingRedeemInfo, pendingRedeemCurve } = pendingInfo;

    console.log('[useAddToCart] ========== ADD TO CART START ==========');
    console.log('[useAddToCart] Form state:', {
      isFormValid,
      selectedTotemId,
      selectedTotemLabel,
      selectedPredicateLabel: selectedPredicateWithAtom?.label,
      selectedPredicateAtomId: selectedPredicateWithAtom?.atomId,
      voteDirection,
      trustAmount,
      founderName: founder.name,
      founderAtomId: founder.atomId,
    });
    console.log('[useAddToCart] Proactive claim info:', proactiveClaimInfo);

    if (!isFormValid) {
      console.log('[useAddToCart] Form NOT valid, aborting');
      return;
    }

    if (voteDirection === 'withdraw') {
      setError(t('founderExpanded.withdrawNotInCart', 'Withdraw non disponible dans le panier'));
      setTimeout(() => setError(null), 3000);
      return;
    }

    // For new totem creation, selectedTotemId is undefined - newTotemData is used instead
    const hasTotemSelection = selectedTotemId || newTotemData;
    if (!hasTotemSelection || !selectedPredicateWithAtom?.atomId) {
      console.log('[useAddToCart] Missing data:', {
        selectedTotemId,
        newTotemData,
        predicateAtomId: selectedPredicateWithAtom?.atomId
      });
      setError('Données manquantes pour ajouter au panier');
      setTimeout(() => setError(null), 3000);
      return;
    }

    // Determine if this is a brand new totem (creation mode) or existing totem
    const isCreatingNewTotem = !!newTotemData && !selectedTotemId;
    // For new triples (no proactiveClaimInfo), we need to create termId on-chain
    const isNewTotem = isCreatingNewTotem || !proactiveClaimInfo;

    // Include current position so cart can detect if withdrawal is needed for opposite-side vote
    const currentPositionForCart = pendingRedeemInfo
      ? {
          direction: (pendingRedeemInfo.redeemDirection === 'Support' ? 'for' : 'against') as 'for' | 'against',
          shares: pendingRedeemInfo.shares,
          curveId: pendingRedeemInfo.curveId,
        }
      : hasAnyPosition && positionDirection && positionCurveId
        ? { direction: positionDirection, shares: currentUserShares, curveId: positionCurveId }
        : undefined;

    // Build cart item differently for new totem creation vs existing totem vote
    const cartItem = isCreatingNewTotem
      ? {
          totemId: null,
          totemName: newTotemData!.name,
          predicateId: selectedPredicateWithAtom.atomId as Hex,
          termId: null,
          counterTermId: null,
          direction: voteDirection as 'for' | 'against',
          curveId: selectedCurve!,
          amount: trustAmount,
          isNewTotem: true,
          currentPosition: undefined,
          newTotemData: {
            name: newTotemData!.name,
            category: newTotemData!.category,
            categoryTermId: newTotemData!.categoryTermId,
            isNewCategory: newTotemData!.isNewCategory,
          },
        }
      : {
          totemId: selectedTotemId as Hex,
          totemName: selectedTotemLabel || 'Unknown',
          predicateId: selectedPredicateWithAtom.atomId as Hex,
          termId: (proactiveClaimInfo?.termId || selectedTotemId) as Hex,
          counterTermId: (proactiveClaimInfo?.counterTermId || selectedTotemId) as Hex,
          direction: voteDirection as 'for' | 'against',
          curveId: selectedCurve!,
          amount: trustAmount,
          isNewTotem,
          currentPosition: currentPositionForCart,
        };

    console.log('[useAddToCart] Cart item to add:', cartItem);
    console.log('[useAddToCart] isCreatingNewTotem:', isCreatingNewTotem, 'isNewTotem:', isNewTotem);

    // DEBUG: Verify totemId is atom ID not triple ID
    if (!isCreatingNewTotem) {
      console.log('[useAddToCart] 🔍 DEBUG VERIFICATION (existing totem):');
      console.log('  - selectedTotemId (should be ATOM id):', selectedTotemId);
      console.log('  - proactiveClaimInfo?.termId (TRIPLE id):', proactiveClaimInfo?.termId);
      console.log('  - Are they different?', selectedTotemId !== proactiveClaimInfo?.termId ? '✅ YES (correct!)' : '⚠️ NO (might be bug if triple exists)');
    } else {
      console.log('[useAddToCart] 🆕 CREATING NEW TOTEM:', newTotemData);
    }

    try {
      addItem(cartItem);

      console.log('[useAddToCart] Item added to cart successfully!');
      // Timestamp unique pour que React détecte toujours un changement
      // (permet de relancer l'animation même si on clique plusieurs fois rapidement)
      setSuccess(`added-${Date.now()}`);

      // Reset amount after adding
      if (minRequiredDisplay) {
        setTrustAmount(minRequiredDisplay);
      }

      // Reset pending redeem state
      if (pendingRedeemCurve) {
        setPendingRedeemCurve(null);
      }
    } catch (err) {
      console.error('[useAddToCart] Error adding to cart:', err);
      setError('Erreur lors de l\'ajout au panier');
      setTimeout(() => setError(null), 3000);
    }
    console.log('[useAddToCart] ========== ADD TO CART END ==========');
  }, [
    formState,
    founder,
    proactiveClaimInfo,
    positionInfo,
    pendingInfo,
    minRequiredDisplay,
    addItem,
    setPendingRedeemCurve,
    setTrustAmount,
    setSuccess,
    setError,
    t,
  ]);

  return { addToCart };
}
