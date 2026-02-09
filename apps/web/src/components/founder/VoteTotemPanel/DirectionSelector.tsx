/**
 * DirectionSelector - FOR/AGAINST vote direction buttons
 *
 * Features:
 * - INTUITION protocol rule: AGAINST blocked on new triples (must vote FOR to create)
 * - Sole voter rule: AGAINST blocked if user is the only FOR voter (no sense voting against yourself)
 * - Visual states: existing position (ring-slate), current selection (animate-ring-pulse)
 * - Pulsation on current step to guide user
 * - Hover on blocked Oppose shows tooltip below and highlights Redeem button
 */

import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
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
  /** Callback when hovering on blocked Oppose (to highlight Redeem button) */
  onOpposeBlockedHover?: (isHovering: boolean) => void;
  /** Whether Redeem is highlighted (to dim this component) */
  isRedeemHighlighted?: boolean;
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
  onOpposeBlockedHover,
  isRedeemHighlighted,
}: DirectionSelectorProps) {
  const { t } = useTranslation();

  // Combine both blocking reasons
  const isOpposeBlocked = isOpposeBlockedByProtocol || isSoleForVoter;

  // State for tooltip visibility and position
  const [showTooltip, setShowTooltip] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });
  const opposeButtonRef = useRef<HTMLDivElement>(null);

  // Update tooltip position when shown
  useEffect(() => {
    if (showTooltip && opposeButtonRef.current) {
      const rect = opposeButtonRef.current.getBoundingClientRect();
      setTooltipPosition({
        top: rect.bottom + 8, // 8px below the button
        left: rect.right - 224, // 224px = w-56 (14rem)
      });
    }
  }, [showTooltip]);

  // Handle hover on blocked Oppose
  const handleOpposeMouseEnter = () => {
    if (isOpposeBlocked) {
      setShowTooltip(true);
      // Only trigger Redeem highlight for sole voter case (not for protocol block)
      if (isSoleForVoter && onOpposeBlockedHover) {
        onOpposeBlockedHover(true);
      }
    }
  };

  const handleOpposeMouseLeave = () => {
    setShowTooltip(false);
    if (onOpposeBlockedHover) {
      onOpposeBlockedHover(false);
    }
  };

  // Dim style when Redeem is highlighted (using inline style to ensure it works)
  const dimStyle = isRedeemHighlighted ? { opacity: 0.4, transition: 'opacity 200ms' } : { transition: 'opacity 200ms' };

  return (
    <div className={blurClass} style={dimStyle}>
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
          ref={opposeButtonRef}
          className="relative flex-1"
          onMouseEnter={handleOpposeMouseEnter}
          onMouseLeave={handleOpposeMouseLeave}
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

          {/* Custom tooltip - rendered via portal to escape overflow constraints */}
          {showTooltip && isOpposeBlocked && createPortal(
            <div
              className="fixed w-56 p-2 bg-slate-800 border border-slate-600 rounded-lg shadow-lg "
              style={{
                top: tooltipPosition.top,
                left: tooltipPosition.left,
              }}
            >
              <p className="text-xs text-white/80 text-center leading-relaxed">
                {isOpposeBlockedByProtocol ? (
                  t('founderExpanded.opposeBlockedProtocol')
                ) : isSoleForVoter ? (
                  t('founderExpanded.soleVoterMessage')
                ) : null}
              </p>
              {/* Tooltip arrow pointing up */}
              <div className="absolute -top-2 right-4 border-4 border-transparent border-b-slate-600" />
            </div>,
            document.body
          )}
        </div>
      </div>
    </div>
  );
}
