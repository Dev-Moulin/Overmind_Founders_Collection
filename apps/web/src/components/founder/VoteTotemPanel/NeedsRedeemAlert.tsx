/**
 * NeedsRedeemAlert - Alert shown when user needs to redeem before voting
 *
 * Displayed when user wants to vote in a different direction or on a different curve
 * than their existing position. Shows:
 * - Current position info
 * - Estimated recoverable amount
 * - Slider + input for new position amount
 */

import { useTranslation } from 'react-i18next';
import { truncateAmount } from '../../../utils/formatters';
import { CURVE_LINEAR, type CurveId } from '../../../hooks';
import { SUPPORT_COLORS, OPPOSE_COLORS, NET_COLORS } from '../../../config/colors';

/** Estimated recoverable amount info */
export interface EstimatedRecoverable {
  gross: string;
  net: string;
  feePercent: string;
}

interface NeedsRedeemAlertProps {
  /** Current position amount formatted */
  formattedCurrentPosition: string;
  /** Current position direction */
  positionDirection: 'for' | 'against' | null;
  /** Current position curve */
  positionCurveId: CurveId | null;
  /** Estimated recoverable amount */
  estimatedRecoverable: EstimatedRecoverable | null;
  /** Target vote direction */
  voteDirection: 'for' | 'against';
  /** Target curve */
  selectedCurve: CurveId;
  /** Minimum required amount (exact value) */
  minRequiredExact: string;
  /** Minimum required amount (display value) */
  minRequiredDisplay: string;
  /** Current trust amount input */
  trustAmount: string;
  /** Callback to update trust amount */
  onAmountChange: (amount: string) => void;
  /** User's wallet balance formatted */
  balanceFormatted: string | undefined;
}

export function NeedsRedeemAlert({
  formattedCurrentPosition,
  positionDirection,
  positionCurveId,
  estimatedRecoverable,
  voteDirection,
  selectedCurve,
  minRequiredExact,
  minRequiredDisplay,
  trustAmount,
  onAmountChange,
  balanceFormatted,
}: NeedsRedeemAlertProps) {
  const { t } = useTranslation();

  // Calculate slider bounds
  const minVal = parseFloat(minRequiredExact || '0.0001');
  const currentPosValue = parseFloat(formattedCurrentPosition) || 0;
  const balanceVal = parseFloat(balanceFormatted || '0');
  const maxVal = Math.max(minVal, balanceVal + currentPosValue * 0.93); // 93% = after ~7% exit fee

  // Convert to integer scale (x10000) for better slider precision
  const SCALE = 10000;
  const minInt = Math.round(minVal * SCALE);
  const maxInt = Math.round(maxVal * SCALE);
  const currentAmount = parseFloat(trustAmount) || minVal;
  const currentInt = Math.min(Math.max(Math.round(currentAmount * SCALE), minInt), maxInt);

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const intValue = parseInt(e.target.value, 10);
    onAmountChange(truncateAmount(intValue / SCALE));
  };

  return (
    <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3 space-y-3">
      <div className="flex items-start gap-2">
        <svg className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
        <div className="flex-1">
          <p className="text-amber-300 text-sm font-medium">
            {t('founderExpanded.positionToWithdraw')}
          </p>
          <p className="text-white/70 text-xs mt-1">
            {t('founderExpanded.youHaveTrustIn', { amount: formattedCurrentPosition })}{' '}
            <span style={{ color: positionDirection === 'for' ? SUPPORT_COLORS.base : OPPOSE_COLORS.base }}>
              {positionDirection === 'for' ? t('vote.support') : t('vote.oppose')}
            </span>
            {' '}({positionCurveId === CURVE_LINEAR ? t('curve.linear') : t('curve.progressive')}).
          </p>
          {estimatedRecoverable && (
            <p className="text-xs mt-1" style={{ color: `${NET_COLORS.positive.base}cc` }}>
              {t('founderExpanded.estimatedRecovery', { amount: estimatedRecoverable.net, fees: estimatedRecoverable.feePercent })}
            </p>
          )}
          <p className="text-white/50 text-xs mt-1">
            {t('founderExpanded.autoWithdrawalInfo', { direction: voteDirection === 'for' ? t('vote.support') : t('vote.oppose'), curve: selectedCurve === CURVE_LINEAR ? t('curve.linear') : t('curve.progressive') })}
          </p>
        </div>
      </div>

      {/* Amount input with slider for opposite vote */}
      <div className="pt-2 border-t border-amber-500/20">
        <label className="block text-xs text-white/60 mb-2">
          {t('founderExpanded.amountForNewPosition', { direction: voteDirection === 'for' ? t('vote.support') : t('vote.oppose') })}
        </label>

        {/* Slider */}
        <input
          type="range"
          min={minInt}
          max={maxInt}
          step={1}
          value={currentInt}
          onChange={handleSliderChange}
          className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-amber-500"
        />
        <div className="flex justify-between text-xs text-white/40 mt-1">
          <span>{truncateAmount(minVal)}</span>
          <span>{truncateAmount(maxVal)}</span>
        </div>

        {/* Manual input + balance */}
        <div className="flex items-center gap-2 mt-2">
          <input
            type="text"
            value={trustAmount}
            onChange={(e) => onAmountChange(e.target.value)}
            placeholder={minRequiredDisplay}
            className="flex-1 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm placeholder-white/30 focus:outline-none focus:border-amber-500"
          />
          <span className="text-xs text-white/50">{t('common.trustUnit')}</span>
        </div>
        {balanceFormatted && (
          <p className="text-xs text-white/40 mt-1">
            {t('founderExpanded.balanceRecoverable', { balance: truncateAmount(balanceFormatted), recoverable: truncateAmount(parseFloat(formattedCurrentPosition) * 0.93) })}
          </p>
        )}
      </div>
    </div>
  );
}
