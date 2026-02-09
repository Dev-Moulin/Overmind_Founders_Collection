/**
 * CurveSelector - Bonding curve selection (Linear vs Progressive)
 *
 * INTUITION Rule: Cannot have Support AND Oppose on the same curve.
 * Visual states:
 * - Selected: animate-ring-pulse
 * - Has existing position: ring-slate
 * - Blocked: blur-disabled
 * - Unlocked via direction change: animate-blur-to-focus
 */

import { useTranslation } from 'react-i18next';
import { CURVE_LINEAR, CURVE_PROGRESSIVE, type CurveId } from '../../../hooks';
import { CURVE_COLORS } from '../../../config/colors';

/** Curve availability info with blocking reason */
export interface CurveAvailability {
  linear: boolean;
  progressive: boolean;
  blockedReason: string | null;
  allBlocked: boolean;
}

interface CurveSelectorProps {
  /** Which curves are available */
  curveAvailability: CurveAvailability;
  /** Currently selected curve */
  selectedCurve: CurveId | null;
  /** Callback when curve is selected */
  onCurveSelect: (curve: CurveId) => void;
  /** Curve chosen via direction change (unlocks blocked curve) */
  pendingRedeemCurve: CurveId | null;
  /** Whether user has any position on this totem */
  hasAnyPosition: boolean;
  /** User's current position curve (for "existing position" style) */
  positionCurveId: CurveId | null;
  /** CSS class for blur effect based on form step */
  blurClass: string;
  /** CSS class for pulse animation */
  getPulseClass: (step: number, isSelected: boolean) => string;
  /** Whether Redeem button is highlighted (to dim this component) */
  isRedeemHighlighted?: boolean;
}

export function CurveSelector({
  curveAvailability,
  selectedCurve,
  onCurveSelect,
  pendingRedeemCurve,
  hasAnyPosition,
  positionCurveId,
  blurClass,
  getPulseClass,
  isRedeemHighlighted,
}: CurveSelectorProps) {
  const { t } = useTranslation();

  // Check if Linear is clickable
  const isLinearClickable = curveAvailability.linear || pendingRedeemCurve === CURVE_LINEAR;
  // Check if Progressive is clickable
  const isProgressiveClickable = curveAvailability.progressive || pendingRedeemCurve === CURVE_PROGRESSIVE;

  // Dim style when Redeem is highlighted (using inline style to ensure it works)
  const dimStyle = isRedeemHighlighted ? { opacity: 0.4, transition: 'opacity 200ms' } : { transition: 'opacity 200ms' };

  return (
    <div className={blurClass} style={dimStyle}>
      <label className="block text-xs text-white/60 mb-1">
        {t('founderExpanded.curveType', 'Courbe de bonding')}
      </label>
      <div className="flex gap-2">
        {/* Linear button */}
        <button
          key={`linear-${pendingRedeemCurve === CURVE_LINEAR ? 'selected' : 'default'}`}
          onClick={() => isLinearClickable && onCurveSelect(CURVE_LINEAR)}
          disabled={!isLinearClickable}
          className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
            !isLinearClickable
              ? 'blur-disabled cursor-not-allowed ring-1 ring-slate-500/20'
              : selectedCurve === CURVE_LINEAR
                ? 'bg-slate-500/30 animate-ring-pulse'
                : hasAnyPosition && positionCurveId === CURVE_LINEAR
                  ? 'bg-slate-500/10 text-slate-300/80 ring-1 ring-slate-400/50'
                  : 'bg-white/5 text-white/60 ring-1 ring-slate-500/30 hover:bg-white/10'
          } ${isLinearClickable && selectedCurve !== CURVE_LINEAR ? getPulseClass(2, false) : ''} ${
            selectedCurve === CURVE_LINEAR && pendingRedeemCurve === CURVE_LINEAR ? 'animate-blur-to-focus' : ''
          }`}
          title={!isLinearClickable ? t('founderExpanded.blockedOppositePosition') : t('founderExpanded.linearDesc')}
          style={selectedCurve === CURVE_LINEAR ? { color: CURVE_COLORS.linear.text } : undefined}
        >
          📊 Linear
        </button>

        {/* Progressive button */}
        <button
          key={`progressive-${pendingRedeemCurve === CURVE_PROGRESSIVE ? 'selected' : 'default'}`}
          onClick={() => isProgressiveClickable && onCurveSelect(CURVE_PROGRESSIVE)}
          disabled={!isProgressiveClickable}
          className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
            !isProgressiveClickable
              ? 'blur-disabled cursor-not-allowed ring-1 ring-slate-500/20'
              : selectedCurve === CURVE_PROGRESSIVE
                ? 'bg-slate-500/30 animate-ring-pulse'
                : hasAnyPosition && positionCurveId === CURVE_PROGRESSIVE
                  ? 'bg-slate-500/10 text-slate-300/80 ring-1 ring-slate-400/50'
                  : 'bg-white/5 text-white/60 ring-1 ring-slate-500/30 hover:bg-white/10'
          } ${isProgressiveClickable && selectedCurve !== CURVE_PROGRESSIVE ? getPulseClass(2, false) : ''} ${
            selectedCurve === CURVE_PROGRESSIVE && pendingRedeemCurve === CURVE_PROGRESSIVE ? 'animate-blur-to-focus' : ''
          }`}
          title={!isProgressiveClickable ? t('founderExpanded.blockedOppositePosition') : t('founderExpanded.progressiveDesc')}
          style={selectedCurve === CURVE_PROGRESSIVE ? { color: CURVE_COLORS.progressive.text } : undefined}
        >
          📈 Progressive
        </button>
      </div>

      {/* Blocked curve warning message */}
      {curveAvailability.blockedReason && (
        <p className="text-xs text-yellow-400 mt-2 flex items-center gap-1">
          <span>⚠️</span> {curveAvailability.blockedReason}
        </p>
      )}

      {/* Normal hint when no blocking */}
      {!curveAvailability.blockedReason && (
        <p className="text-xs text-white/40 mt-1">
          {selectedCurve === CURVE_LINEAR
            ? t('founderExpanded.linearHint', 'Vote démocratique : prix stable pour tous')
            : t('founderExpanded.progressiveHint', 'Vote conviction : récompense les premiers votants')}
        </p>
      )}
    </div>
  );
}
