/**
 * useDirectionChange - Direction change management
 *
 * When user wants to change vote direction but has positions on opposite direction,
 * they must redeem those positions first.
 *
 * Three scenarios:
 * 1. Single curve with position → User selects that curve to redeem
 * 2. Both curves with positions → Auto-preselect both for redeem
 * 3. After selection → Show pending redeem info
 *
 * @see VoteTotemPanel.tsx, DirectionChangeAlert.tsx
 */

import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { formatEther } from 'viem';
import { truncateAmount } from '../../utils/formatters';
import { CURVE_LINEAR, type CurveId } from '../index';
import type { CurveAvailability } from './useCurveAvailability';

/** Position info for a single curve */
interface CurvePosition {
  shares: bigint;
  formatted: string;
  hasPosition: boolean;
}

/** Info about direction change when curves are blocked */
export interface DirectionChangeInfo {
  linear: CurvePosition;
  progressive: CurvePosition;
  currentDirectionLabel: string;
  targetDirectionLabel: string;
}

/** Info about pending redeem after curve choice (single curve) */
export interface PendingRedeemInfo {
  curveId: CurveId;
  curveLabel: string;
  shares: bigint;
  formatted: string;
  redeemDirection: string;
  newDirection: string;
}

/** Info about pending redeem for BOTH curves */
export interface PendingRedeemBothInfo {
  redeemDirection: string;
  newDirection: string;
  linearShares: bigint;
  progressiveShares: bigint;
  linearFormatted: string;
  progressiveFormatted: string;
}

export interface UseDirectionChangeParams {
  /** Curve availability info */
  curveAvailability: CurveAvailability;
  /** Current vote direction */
  voteDirection: 'for' | 'against' | 'withdraw' | null;
  /** FOR shares on Linear curve */
  forSharesLinear: bigint;
  /** FOR shares on Progressive curve */
  forSharesProgressive: bigint;
  /** AGAINST shares on Linear curve */
  againstSharesLinear: bigint;
  /** AGAINST shares on Progressive curve */
  againstSharesProgressive: bigint;
}

export interface UseDirectionChangeResult {
  /** Info about positions when curves are blocked (before user choice) */
  directionChangeInfo: DirectionChangeInfo | null;
  /** Info about pending redeem (after user chose a single curve) */
  pendingRedeemInfo: PendingRedeemInfo | null;
  /** Info about pending redeem (after user chose both curves) */
  pendingRedeemBothInfo: PendingRedeemBothInfo | null;
  /** Curve chosen for pending redeem (null = none, 'both' handled separately) */
  pendingRedeemCurve: CurveId | null;
  /** Whether both curves are pending redeem */
  pendingRedeemBoth: boolean;
  /** Set the curve for pending redeem */
  setPendingRedeemCurve: (curve: CurveId | null) => void;
  /** Handle curve choice for direction change (single curve) */
  handleDirectionChangeCurveChoice: (curveId: CurveId, setSelectedCurve: (curve: CurveId) => void) => void;
  /** Handle both curves auto-select for direction change */
  handleBothCurvesAutoSelect: (setSelectedCurve: (curve: CurveId) => void) => void;
}

/**
 * Hook for managing direction change flow
 */
export function useDirectionChange({
  curveAvailability,
  voteDirection,
  forSharesLinear,
  forSharesProgressive,
  againstSharesLinear,
  againstSharesProgressive,
}: UseDirectionChangeParams): UseDirectionChangeResult {
  const { t } = useTranslation();

  // Track pending redeem curve when user wants to change direction
  const [pendingRedeemCurve, setPendingRedeemCurve] = useState<CurveId | null>(null);
  // Track if both curves are pending redeem
  const [pendingRedeemBoth, setPendingRedeemBoth] = useState<boolean>(false);

  // Calculate positions to redeem for each curve when curves are blocked
  // This is shown inline (not in a popup) between Direction and Curve sections
  const directionChangeInfo = useMemo((): DirectionChangeInfo | null => {
    // Only show when all curves are blocked AND user hasn't chosen yet
    if (!curveAvailability.allBlocked || !voteDirection || voteDirection === 'withdraw') return null;
    // Don't show if already chosen
    if (pendingRedeemCurve || pendingRedeemBoth) return null;

    // Get the opposite direction's positions (what we need to redeem)
    const linearPosition = voteDirection === 'against'
      ? { shares: forSharesLinear, formatted: forSharesLinear > 0n ? truncateAmount(formatEther(forSharesLinear)) : '0', hasPosition: forSharesLinear > 0n }
      : { shares: againstSharesLinear, formatted: againstSharesLinear > 0n ? truncateAmount(formatEther(againstSharesLinear)) : '0', hasPosition: againstSharesLinear > 0n };

    const progressivePosition = voteDirection === 'against'
      ? { shares: forSharesProgressive, formatted: forSharesProgressive > 0n ? truncateAmount(formatEther(forSharesProgressive)) : '0', hasPosition: forSharesProgressive > 0n }
      : { shares: againstSharesProgressive, formatted: againstSharesProgressive > 0n ? truncateAmount(formatEther(againstSharesProgressive)) : '0', hasPosition: againstSharesProgressive > 0n };

    const currentDirectionLabel = voteDirection === 'against' ? t('vote.support') : t('vote.oppose');
    const targetDirectionLabel = voteDirection === 'against' ? t('vote.oppose') : t('vote.support');

    return {
      linear: linearPosition,
      progressive: progressivePosition,
      currentDirectionLabel,
      targetDirectionLabel,
    };
  }, [curveAvailability.allBlocked, voteDirection, forSharesLinear, forSharesProgressive, againstSharesLinear, againstSharesProgressive, pendingRedeemCurve, pendingRedeemBoth, t]);

  // Calculate pending redeem info for display (after user chose a SINGLE curve)
  const pendingRedeemInfo = useMemo((): PendingRedeemInfo | null => {
    if (!pendingRedeemCurve || pendingRedeemBoth || !voteDirection) return null;

    // Get the shares that will be redeemed (opposite direction on the chosen curve)
    const isRedeemingFor = voteDirection === 'against'; // If we're going to Oppose, we redeem For
    const shares = pendingRedeemCurve === CURVE_LINEAR
      ? (isRedeemingFor ? forSharesLinear : againstSharesLinear)
      : (isRedeemingFor ? forSharesProgressive : againstSharesProgressive);

    if (shares <= 0n) return null;

    return {
      curveId: pendingRedeemCurve,
      curveLabel: pendingRedeemCurve === CURVE_LINEAR ? t('curve.linear') : t('curve.progressive'),
      shares,
      formatted: truncateAmount(formatEther(shares)),
      redeemDirection: isRedeemingFor ? t('vote.support') : t('vote.oppose'),
      newDirection: voteDirection === 'for' ? t('vote.support') : t('vote.oppose'),
    };
  }, [pendingRedeemCurve, pendingRedeemBoth, voteDirection, forSharesLinear, forSharesProgressive, againstSharesLinear, againstSharesProgressive, t]);

  // Calculate pending redeem info for BOTH curves
  const pendingRedeemBothInfo = useMemo((): PendingRedeemBothInfo | null => {
    if (!pendingRedeemBoth || !voteDirection) return null;

    const isRedeemingFor = voteDirection === 'against';
    const linearShares = isRedeemingFor ? forSharesLinear : againstSharesLinear;
    const progressiveShares = isRedeemingFor ? forSharesProgressive : againstSharesProgressive;

    if (linearShares <= 0n && progressiveShares <= 0n) return null;

    return {
      redeemDirection: isRedeemingFor ? t('vote.support') : t('vote.oppose'),
      newDirection: voteDirection === 'for' ? t('vote.support') : t('vote.oppose'),
      linearShares,
      progressiveShares,
      linearFormatted: truncateAmount(formatEther(linearShares)),
      progressiveFormatted: truncateAmount(formatEther(progressiveShares)),
    };
  }, [pendingRedeemBoth, voteDirection, forSharesLinear, forSharesProgressive, againstSharesLinear, againstSharesProgressive, t]);

  // Handle curve choice when user selects a SINGLE curve (inline section)
  // Does NOT execute redeem - just selects curve and stores pending redeem info
  // The actual redeem will be executed by the cart when processing the vote
  const handleDirectionChangeCurveChoice = (curveId: CurveId, setSelectedCurve: (curve: CurveId) => void) => {
    if (!directionChangeInfo) return;

    const position = curveId === CURVE_LINEAR ? directionChangeInfo.linear : directionChangeInfo.progressive;
    if (!position.hasPosition) return;

    // Set curve selection and track which curve needs redeem
    setSelectedCurve(curveId);
    setPendingRedeemCurve(curveId);
    setPendingRedeemBoth(false);
  };

  // Handle both curves auto-select (when user has positions on both)
  const handleBothCurvesAutoSelect = (setSelectedCurve: (curve: CurveId) => void) => {
    if (!directionChangeInfo) return;
    if (!directionChangeInfo.linear.hasPosition || !directionChangeInfo.progressive.hasPosition) return;

    // Default to Linear for the new vote (user can change later)
    setSelectedCurve(CURVE_LINEAR);
    setPendingRedeemCurve(null);
    setPendingRedeemBoth(true);
  };

  return {
    directionChangeInfo,
    pendingRedeemInfo,
    pendingRedeemBothInfo,
    pendingRedeemCurve,
    pendingRedeemBoth,
    setPendingRedeemCurve,
    handleDirectionChangeCurveChoice,
    handleBothCurvesAutoSelect,
  };
}
