/**
 * DirectionSelector - FOR/AGAINST vote direction buttons
 *
 * Features:
 * - INTUITION protocol rule: AGAINST blocked on new triples (must vote FOR to create)
 * - Sole voter rule: AGAINST blocked if user is the only FOR voter (no sense voting against yourself)
 * - Visual states: existing position (ring-slate), current selection (animate-ring-pulse)
 * - Pulsation on current step to guide user
 */

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { SUPPORT_COLORS, OPPOSE_COLORS } from '../../../config/colors';

interface DirectionSelectorProps {
  /** Current vote direction */
  voteDirection: 'for' | 'against' | 'withdraw' | null;
  /** Callback when direction is selected */
  onDirectionClick: (direction: 'for' | 'against') => void;
  /** Whether user has any position on this totem */
  hasAnyPosition: boolean;
  /** User's current position direction */
  positionDirection: 'for' | 'against' | null;
  /** Whether AGAINST is blocked (new triple = must vote FOR) */
  isOpposeBlockedByProtocol: boolean;
  /** Whether user is the sole FOR voter (AGAINST blocked because no sense voting against yourself) */
  isSoleForVoter: boolean;
  /** CSS class for blur effect */
  blurClass: string;
  /** Get pulse class for step guidance */
  getPulseClass: (step: number, isSelected: boolean) => string;
}

export function DirectionSelector({
  voteDirection,
  onDirectionClick,
  hasAnyPosition,
  positionDirection,
  isOpposeBlockedByProtocol,
  isSoleForVoter,
  blurClass,
  getPulseClass,
}: DirectionSelectorProps) {
  const { t } = useTranslation();

  // Combine both blocking reasons
  const isOpposeBlocked = isOpposeBlockedByProtocol || isSoleForVoter;

  // State for tooltip visibility
  const [showTooltip, setShowTooltip] = useState(false);

  return (
    <div className={blurClass}>
      <label className="block text-xs text-white/60 mb-1">Direction</label>
      <div className="flex gap-2">
        {/* Support button */}
        <button
          onClick={() => onDirectionClick('for')}
          className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
            voteDirection === 'for'
              ? 'bg-slate-500/30 animate-ring-pulse'
              : hasAnyPosition && positionDirection === 'for'
                ? 'bg-slate-500/10 text-slate-300/80 ring-1 ring-slate-400/50'
                : 'bg-white/5 text-white/60 ring-1 ring-slate-500/30 hover:bg-white/10'
          } ${voteDirection !== 'for' ? getPulseClass(1, false) : ''}`}
          style={voteDirection === 'for' ? { color: SUPPORT_COLORS.base } : undefined}
        >
          {t('vote.support')}
        </button>

        {/* Oppose button with custom tooltip */}
        <div
          className="relative flex-1"
          onMouseEnter={() => isOpposeBlocked && setShowTooltip(true)}
          onMouseLeave={() => setShowTooltip(false)}
        >
          <button
            onClick={() => !isOpposeBlocked && onDirectionClick('against')}
            disabled={isOpposeBlocked}
            className={`w-full py-2 rounded-lg text-sm font-medium transition-colors ${
              isOpposeBlocked
                ? 'bg-white/5 text-white/20 ring-1 ring-slate-500/20 cursor-not-allowed'
                : voteDirection === 'against'
                  ? 'bg-slate-500/30 animate-ring-pulse'
                  : hasAnyPosition && positionDirection === 'against'
                    ? 'bg-slate-500/10 text-slate-300/80 ring-1 ring-slate-400/50'
                    : 'bg-white/5 text-white/60 ring-1 ring-slate-500/30 hover:bg-white/10'
            } ${!isOpposeBlocked && voteDirection !== 'against' ? getPulseClass(1, false) : ''}`}
            style={!isOpposeBlocked && voteDirection === 'against' ? { color: OPPOSE_COLORS.base } : undefined}
          >
            {t('vote.oppose')}
          </button>

          {/* Custom tooltip */}
          {showTooltip && isOpposeBlocked && (
            <div className="absolute bottom-full right-0 mb-2 w-52 p-2 bg-slate-800 border border-slate-600 rounded-lg shadow-lg z-50">
              <p className="text-xs text-white/80 text-center leading-relaxed">
                {isOpposeBlockedByProtocol ? (
                  <>Oppose impossible sur un<br />nouveau triple (protocole)</>
                ) : isSoleForVoter ? (
                  <>Seul votant Support.<br />Retirez ou attendez d'autres votants.</>
                ) : null}
              </p>
              {/* Tooltip arrow */}
              <div className="absolute top-full right-4 border-4 border-transparent border-t-slate-600" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
