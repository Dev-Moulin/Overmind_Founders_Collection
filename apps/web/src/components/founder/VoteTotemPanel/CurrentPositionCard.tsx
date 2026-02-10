/**
 * CurrentPositionCard - Display current position for selected direction+curve
 *
 * Shows:
 * - Current position amount with direction color
 * - Pending cart amount (if any)
 * - Redeem hint in redeem mode
 */

import { useTranslation } from 'react-i18next';
import { SUPPORT_COLORS, OPPOSE_COLORS, CURVE_COLORS } from '../../../config/colors';
import { CURVE_LINEAR, type CurveId } from '../../../hooks';

/** Position info for the selected combination */
interface SelectedPosition {
  shares: bigint;
  formatted: string;
  hasPosition: boolean;
}

/** Pending cart amount info */
interface PendingCartInfo {
  amount: bigint;
  formatted: string;
  hasPending: boolean;
}

interface CurrentPositionCardProps {
  /** Current vote direction */
  voteDirection: 'for' | 'against';
  /** Selected curve */
  selectedCurve: CurveId;
  /** Position for the selected direction+curve */
  selectedCombinationPosition: SelectedPosition;
  /** Pending amount in cart for this selection */
  pendingCartAmount: PendingCartInfo;
  /** Current operation mode */
  operationMode: 'deposit' | 'redeem';
}

export function CurrentPositionCard({
  voteDirection,
  selectedCurve,
  selectedCombinationPosition,
  pendingCartAmount,
  operationMode,
}: CurrentPositionCardProps) {
  const { t } = useTranslation();

  const directionLabel = voteDirection === 'for' ? t('vote.support') : t('vote.oppose');
  const curveLabel = selectedCurve === CURVE_LINEAR ? t('curve.linear') : t('curve.progressive');
  const directionColor = voteDirection === 'for' ? SUPPORT_COLORS.base : OPPOSE_COLORS.base;

  return (
    <div className="bg-white/5 rounded-lg p-3 mb-3">
      <div className="text-xs text-white/50 mb-1">
        {t('founderExpanded.currentPosition')} ({directionLabel} {curveLabel})
      </div>
      <div className="text-base font-medium">
        {selectedCombinationPosition.hasPosition ? (
          <span style={{ color: directionColor }}>
            {selectedCombinationPosition.formatted} {t('common.trustUnit')}
          </span>
        ) : (
          <span className="text-white/40">{t('founderExpanded.noPosition')}</span>
        )}
      </div>

      {/* Pending cart amount for this position */}
      {pendingCartAmount.hasPending && (
        <div className="text-xs text-amber-400 mt-1.5 flex items-center gap-1">
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
          <span>
            {t('founderExpanded.pendingCartAmount', { amount: pendingCartAmount.formatted })}
          </span>
        </div>
      )}

      {/* Redeem hint */}
      {operationMode === 'redeem' && selectedCombinationPosition.hasPosition && (
        <div className="text-xs mt-1" style={{ color: CURVE_COLORS.progressive.text }}>
          {t('founderExpanded.canWithdrawUpTo')} {selectedCombinationPosition.formatted} {t('common.trustUnit')}
        </div>
      )}
    </div>
  );
}
