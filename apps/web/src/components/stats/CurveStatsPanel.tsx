/**
 * CurveStatsPanel - Compact curve filter toggle
 *
 * Simple toggle for Progressive/Linear/All curve filter
 * Used inline with the TradingChart header
 *
 * @see Phase 10 in TODO_FIX_01_Discussion.md
 */

import { CURVE_LINEAR, type CurveId } from '../../hooks';
import type { CurveFilter } from '../../hooks/data/useVotesTimeline';
import { CURVE_COLORS } from '../../config/colors';

interface CurveStatsPanelProps {
  /** Current curve filter for TradingChart */
  curveFilter: CurveFilter;
  /** Callback when curve filter changes */
  onCurveFilterChange: (filter: CurveFilter) => void;
  /** User's position curve on selected totem (for visual highlighting) */
  userPositionCurveId?: CurveId | null;
}

export function CurveStatsPanel({
  curveFilter,
  onCurveFilterChange,
  userPositionCurveId,
}: CurveStatsPanelProps) {
  // Determine if user has position on each curve
  const hasLinearPosition = userPositionCurveId === CURVE_LINEAR;
  const hasProgressivePosition = userPositionCurveId !== null && userPositionCurveId !== CURVE_LINEAR;

  return (
    <div className="flex bg-white/5 rounded-lg p-0.5">
      <button
        onClick={() => onCurveFilterChange('progressive')}
        className={`px-2 py-1 text-[10px] rounded-md transition-colors ${
          curveFilter === 'progressive' || hasProgressivePosition
            ? ''
            : 'text-white/50 hover:text-white/70'
        }`}
        style={
          curveFilter === 'progressive'
            ? { backgroundColor: `${CURVE_COLORS.progressive.base}4d`, color: CURVE_COLORS.progressive.text }
            : hasProgressivePosition
              ? { backgroundColor: `${CURVE_COLORS.progressive.base}1a`, color: `${CURVE_COLORS.progressive.text}b3`, boxShadow: `inset 0 0 0 1px ${CURVE_COLORS.progressive.base}80` }
              : undefined
        }
      >
        Prog
      </button>
      <button
        onClick={() => onCurveFilterChange('linear')}
        className={`px-2 py-1 text-[10px] rounded-md transition-colors ${
          curveFilter === 'linear' || hasLinearPosition
            ? ''
            : 'text-white/50 hover:text-white/70'
        }`}
        style={
          curveFilter === 'linear'
            ? { backgroundColor: `${CURVE_COLORS.linear.base}4d`, color: CURVE_COLORS.linear.text }
            : hasLinearPosition
              ? { backgroundColor: `${CURVE_COLORS.linear.base}1a`, color: `${CURVE_COLORS.linear.text}b3`, boxShadow: `inset 0 0 0 1px ${CURVE_COLORS.linear.base}80` }
              : undefined
        }
      >
        Lin
      </button>
      <button
        onClick={() => onCurveFilterChange('all')}
        className={`px-2 py-1 text-[10px] rounded-md transition-colors ${
          curveFilter === 'all'
            ? 'bg-white/20 text-white'
            : 'text-white/50 hover:text-white/70'
        }`}
      >
        All
      </button>
    </div>
  );
}
