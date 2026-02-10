/**
 * useCurveAvailability - INTUITION protocol curve availability rules
 *
 * INTUITION Rules (V2 - courbes indépendantes):
 * - Les courbes Linear (curveId=1) et Progressive (curveId=2) sont INDÉPENDANTES
 * - Tu PEUX avoir Support Linear + Oppose Progressive (cross-courbe OK)
 * - Tu PEUX avoir Oppose Linear + Support Progressive (cross-courbe OK)
 * - SEULE interdiction : Support ET Oppose sur la MÊME courbe
 * - Pour voter dans la direction opposée sur une courbe → redeem ta position sur cette courbe
 *
 * @see VoteTotemPanel.tsx
 */

import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { CURVE_LINEAR, CURVE_PROGRESSIVE } from '../index';
import type { VoteCart } from '../../types/voteCart';

/** Curve availability result with blocking reason */
export interface CurveAvailability {
  /** Whether Linear curve is available */
  linear: boolean;
  /** Whether Progressive curve is available */
  progressive: boolean;
  /** Reason why curves are blocked (if any) */
  blockedReason: string | null;
  /** Whether ALL curves are blocked */
  allBlocked: boolean;
}

export interface UseCurveAvailabilityParams {
  /** Current vote direction */
  voteDirection: 'for' | 'against' | 'withdraw' | null;
  /** Has FOR position on Linear curve */
  hasForPositionLinear: boolean;
  /** Has FOR position on Progressive curve */
  hasForPositionProgressive: boolean;
  /** Has AGAINST position on Linear curve */
  hasAgainstPositionLinear: boolean;
  /** Has AGAINST position on Progressive curve */
  hasAgainstPositionProgressive: boolean;
  /** Vote cart (to check pending votes) */
  cart: VoteCart | null;
  /** Selected totem ID */
  selectedTotemId: string | undefined;
}

/**
 * Hook for computing curve availability based on INTUITION protocol rules
 */
export function useCurveAvailability({
  voteDirection,
  hasForPositionLinear,
  hasForPositionProgressive,
  hasAgainstPositionLinear,
  hasAgainstPositionProgressive,
  cart,
  selectedTotemId,
}: UseCurveAvailabilityParams): CurveAvailability {
  const { t } = useTranslation();

  return useMemo(() => {
    const direction = voteDirection === 'for' ? 'support' : voteDirection === 'against' ? 'oppose' : null;

    // No blocking for withdraw mode or if no direction selected
    if (!direction || voteDirection === 'withdraw') {
      return { linear: true, progressive: true, blockedReason: null, allBlocked: false };
    }

    // Per-curve blocking by existing positions
    // If I want Support → block ONLY the curve where I have Oppose
    // If I want Oppose → block ONLY the curve where I have Support
    const linearBlockedByPosition = direction === 'support' ? hasAgainstPositionLinear : hasForPositionLinear;
    const progressiveBlockedByPosition = direction === 'support' ? hasAgainstPositionProgressive : hasForPositionProgressive;

    // Per-curve blocking by cart items (same logic, per-curve)
    let linearBlockedByCart = false;
    let progressiveBlockedByCart = false;
    if (cart && selectedTotemId) {
      const cartItemsForTotem = cart.items.filter(item => item.totemId === selectedTotemId);
      for (const item of cartItemsForTotem) {
        const isOpposite =
          (direction === 'support' && item.direction === 'against') ||
          (direction === 'oppose' && item.direction === 'for');

        if (isOpposite) {
          if (item.curveId === CURVE_LINEAR) linearBlockedByCart = true;
          if (item.curveId === CURVE_PROGRESSIVE) progressiveBlockedByCart = true;
        }
      }
    }

    const linearBlocked = linearBlockedByPosition || linearBlockedByCart;
    const progressiveBlocked = progressiveBlockedByPosition || progressiveBlockedByCart;
    const allBlocked = linearBlocked && progressiveBlocked;

    // Build blocked reason message
    let blockedReason: string | null = null;
    if (linearBlocked || progressiveBlocked) {
      const oppositeDirection = direction === 'support' ? 'Oppose' : 'Support';
      const currentDirection = direction === 'support' ? 'Support' : 'Oppose';
      const hasCartBlocking = linearBlockedByCart || progressiveBlockedByCart;
      const source = hasCartBlocking ? ' (panier inclus)' : '';

      // Which curves are blocked?
      const blockedCurves: string[] = [];
      if (linearBlocked) blockedCurves.push('Linear');
      if (progressiveBlocked) blockedCurves.push('Progressive');

      if (allBlocked) {
        // Both curves blocked — user must redeem to continue
        blockedReason = t('founderExpanded.blockedBothCurves', {
          oppositeDirection,
          curves: blockedCurves.join(' + '),
          source,
          currentDirection,
        });
      } else {
        // Only one curve blocked — inform user the other is available
        const freeCurve = linearBlocked ? 'Progressive' : 'Linear';
        blockedReason = t('founderExpanded.blockedSingleCurve', {
          oppositeDirection,
          blockedCurve: blockedCurves[0],
          source,
          freeCurve,
        });
      }
    }

    return {
      linear: !linearBlocked,
      progressive: !progressiveBlocked,
      blockedReason,
      allBlocked,
    };
  }, [voteDirection, hasForPositionLinear, hasForPositionProgressive, hasAgainstPositionLinear, hasAgainstPositionProgressive, cart, selectedTotemId, t]);
}
