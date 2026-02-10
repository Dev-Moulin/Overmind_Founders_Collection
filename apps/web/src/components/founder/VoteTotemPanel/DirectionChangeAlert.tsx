/**
 * DirectionChangeAlert - Alert sections for direction change scenarios
 *
 * Shows when user wants to change vote direction and has positions to redeem.
 *
 * Three scenarios:
 * 1. Single curve with position → Show which curve to redeem (other is disabled)
 * 2. Both curves with positions → Auto-preselect both (no choice needed)
 * 3. After choice → Show pending redeem confirmation
 */

import { useTranslation } from 'react-i18next';
import { CURVE_COLORS, SUPPORT_COLORS, OPPOSE_COLORS } from '../../../config/colors';
import { CURVE_LINEAR, CURVE_PROGRESSIVE, type CurveId } from '../../../hooks';

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

/** Info about pending redeem after curve choice */
export interface PendingRedeemInfo {
  redeemDirection: string;
  newDirection: string;
  curveId: CurveId;
  curveLabel: string;
  formatted: string;
}

interface DirectionChangeSectionProps {
  /** Info about positions on curves */
  info: DirectionChangeInfo;
  /** Callback when user chooses a curve to redeem */
  onCurveChoice: (curveId: CurveId) => void;
  /** Callback when both curves should be auto-selected */
  onBothCurvesAutoSelect?: () => void;
}

/** Section shown BEFORE user chooses a curve */
export function DirectionChangeSection({ info, onCurveChoice, onBothCurvesAutoSelect }: DirectionChangeSectionProps) {
  const hasBothPositions = info.linear.hasPosition && info.progressive.hasPosition;
  const hasOnlyLinear = info.linear.hasPosition && !info.progressive.hasPosition;

  const { t } = useTranslation();

  // Build dynamic message based on positions
  const positionMessage = hasBothPositions
    ? t('founderExpanded.positionOnBothCurves', { direction: info.currentDirectionLabel })
    : hasOnlyLinear
      ? t('founderExpanded.positionOnCurve', { direction: info.currentDirectionLabel, curve: t('curve.linear') })
      : t('founderExpanded.positionOnCurve', { direction: info.currentDirectionLabel, curve: t('curve.progressive') });

  const actionMessage = hasBothPositions
    ? t('founderExpanded.positionsWillBeWithdrawn', { direction: info.targetDirectionLabel })
    : t('founderExpanded.selectCurveToWithdraw', { direction: info.targetDirectionLabel });

  // If both curves have positions, auto-trigger the selection
  // This is handled by useEffect in parent or by onBothCurvesAutoSelect

  return (
    <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3 space-y-3">
      <div className="flex items-start gap-2">
        <span className="text-amber-400 text-lg">⚠️</span>
        <div className="flex-1">
          <p className="text-amber-300 text-sm font-medium">
            {positionMessage}
          </p>
          <p className="text-white/70 text-xs mt-1">
            {actionMessage}
          </p>
        </div>
      </div>

      {/* Curve choice buttons - only show if NOT both curves */}
      {!hasBothPositions && (
        <div className="flex gap-2">
          {/* Linear button */}
          <button
            onClick={() => info.linear.hasPosition && onCurveChoice(CURVE_LINEAR)}
            disabled={!info.linear.hasPosition}
            className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-colors border ${
              !info.linear.hasPosition ? 'opacity-30 cursor-not-allowed' : 'hover:opacity-80'
            }`}
            style={{
              backgroundColor: `${CURVE_COLORS.linear.base}20`,
              color: info.linear.hasPosition ? CURVE_COLORS.linear.text : '#666',
              borderColor: `${CURVE_COLORS.linear.base}30`,
            }}
            title={!info.linear.hasPosition ? t('founderExpanded.noPositionOnCurve', { curve: t('curve.linear') }) : undefined}
          >
            📊 {t('curve.linear')} {info.linear.hasPosition ? `(${info.linear.formatted})` : ''}
          </button>

          {/* Progressive button */}
          <button
            onClick={() => info.progressive.hasPosition && onCurveChoice(CURVE_PROGRESSIVE)}
            disabled={!info.progressive.hasPosition}
            className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-colors border ${
              !info.progressive.hasPosition ? 'opacity-30 cursor-not-allowed' : 'hover:opacity-80'
            }`}
            style={{
              backgroundColor: `${CURVE_COLORS.progressive.base}20`,
              color: info.progressive.hasPosition ? CURVE_COLORS.progressive.text : '#666',
              borderColor: `${CURVE_COLORS.progressive.base}30`,
            }}
            title={!info.progressive.hasPosition ? t('founderExpanded.noPositionOnCurve', { curve: t('curve.progressive') }) : undefined}
          >
            📈 {t('curve.progressive')} {info.progressive.hasPosition ? `(${info.progressive.formatted})` : ''}
          </button>
        </div>
      )}

      {/* If both curves, show confirmation button to proceed */}
      {hasBothPositions && (
        <button
          onClick={onBothCurvesAutoSelect}
          className="w-full py-2.5 rounded-lg text-sm font-medium transition-colors border bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border-amber-500/30"
        >
          ✓ {t('founderExpanded.withdrawBothPositions')} ({info.linear.formatted} + {info.progressive.formatted})
        </button>
      )}
    </div>
  );
}

interface PendingRedeemMessageProps {
  /** Info about the pending redeem operation */
  info: PendingRedeemInfo;
}

/** Message shown AFTER user chose a curve */
export function PendingRedeemMessage({ info }: PendingRedeemMessageProps) {
  const { t } = useTranslation();

  return (
    <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3 animate-blur-to-focus">
      <div className="flex items-start gap-2">
        <span className="text-amber-400 text-lg">🔄</span>
        <div className="flex-1">
          <p className="text-amber-300 text-sm font-medium">
            {t('founderExpanded.pendingRedeemTitle')}
          </p>
          <p className="text-white/70 text-xs mt-1">
            {t('founderExpanded.pendingRedeemDescription', { direction: info.redeemDirection, curve: info.curveLabel, amount: info.formatted })}
          </p>
          <p className="text-white/50 text-xs mt-1">
            {t('founderExpanded.enterAmountNewPosition')}{' '}
            <span style={{ color: info.newDirection === t('vote.support') ? SUPPORT_COLORS.base : OPPOSE_COLORS.base }}>
              {info.newDirection}
            </span>.
          </p>
        </div>
      </div>
    </div>
  );
}

/** Info about pending redeem for BOTH curves */
export interface PendingRedeemBothInfo {
  redeemDirection: string;
  newDirection: string;
  linearFormatted: string;
  progressiveFormatted: string;
}

interface PendingRedeemBothMessageProps {
  /** Info about the pending redeem operation for both curves */
  info: PendingRedeemBothInfo;
}

/** Message shown when BOTH curves will be redeemed */
export function PendingRedeemBothMessage({ info }: PendingRedeemBothMessageProps) {
  const { t } = useTranslation();

  return (
    <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3 animate-blur-to-focus">
      <div className="flex items-start gap-2">
        <span className="text-amber-400 text-lg">🔄</span>
        <div className="flex-1">
          <p className="text-amber-300 text-sm font-medium">
            {t('founderExpanded.pendingRedeemTitle')}
          </p>
          <p className="text-white/70 text-xs mt-1">
            {t('founderExpanded.pendingRedeemBothDescription', { direction: info.redeemDirection, linearCurve: t('curve.linear'), linearAmount: info.linearFormatted, progressiveCurve: t('curve.progressive'), progressiveAmount: info.progressiveFormatted })}
          </p>
          <p className="text-white/50 text-xs mt-1">
            {t('founderExpanded.enterAmountNewPosition')}{' '}
            <span style={{ color: info.newDirection === t('vote.support') ? SUPPORT_COLORS.base : OPPOSE_COLORS.base }}>
              {info.newDirection}
            </span>.
          </p>
        </div>
      </div>
    </div>
  );
}
