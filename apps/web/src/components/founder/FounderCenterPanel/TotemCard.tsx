/**
 * TotemCard - Totem display card for FounderCenterPanel grid
 *
 * Extracted from FounderCenterPanel.tsx
 * Displays totem info with user position badges and expandable details
 *
 * @see FounderCenterPanel.tsx
 */

import { formatEther } from 'viem';
import { useTranslation } from 'react-i18next';
import { truncateAmount } from '../../../utils/formatters';
import { SUPPORT_COLORS, OPPOSE_COLORS, CURVE_COLORS } from '../../../config/colors';

/** User position data for a totem */
export interface UserPositionData {
  trust: bigint;
  shares: bigint;
  linearTrust: bigint;
  progressiveTrust: bigint;
  linearSupport: bigint;
  linearOppose: bigint;
  progressiveSupport: bigint;
  progressiveOppose: bigint;
}

export interface TotemCardProps {
  /** Totem label */
  label: string;
  /** Totem image URL */
  image?: string;
  /** Totem category */
  category?: string;
  /** Whether this totem is selected */
  isSelected: boolean;
  /** Index in the grid (for cascade animation) */
  index: number;
  /** Whether any totem is selected (for cascade animation) */
  hasSelectedTotem: boolean;
  /** Whether user is connected */
  isConnected: boolean;
  /** User's position on this totem */
  userPosition: UserPositionData | null;
}

export function TotemCard({
  label,
  image,
  category,
  isSelected,
  index,
  hasSelectedTotem,
  isConnected,
  userPosition,
}: TotemCardProps) {
  const { t } = useTranslation();
  const hasTrust = userPosition && userPosition.trust > 0n;
  const trustValue = hasTrust ? parseFloat(formatEther(userPosition.trust)) : 0;
  const sharesValue = hasTrust ? parseFloat(formatEther(userPosition.shares)) : 0;

  // Cascade pulse effect when no totem selected
  const rowIndex = Math.floor(index / 2);
  const cascadeClass = !hasSelectedTotem
    ? `cascade-pulse cascade-delay-${Math.min(rowIndex, 7)}`
    : '';

  // Position details for expanded view
  const linearSupportValue = userPosition ? parseFloat(formatEther(userPosition.linearSupport)) : 0;
  const linearOpposeValue = userPosition ? parseFloat(formatEther(userPosition.linearOppose)) : 0;
  const progressiveSupportValue = userPosition ? parseFloat(formatEther(userPosition.progressiveSupport)) : 0;
  const progressiveOpposeValue = userPosition ? parseFloat(formatEther(userPosition.progressiveOppose)) : 0;

  // Should expand details when selected AND has positions
  const shouldExpand = isSelected && hasTrust;

  return (
    <div className={`text-left p-2 rounded-lg transition-all ${
      isSelected
        ? 'bg-slate-500/30 ring-1 ring-slate-500/50 animate-ring-pulse'
        : `bg-white/5 hover:bg-white/10 ${cascadeClass}`
    }`}>
      {/* Header: Image + Totem name + Category */}
      <div className="flex items-start gap-1.5">
        {image && (
          <img src={image} alt="" className="w-6 h-6 rounded-md object-cover border border-white/20 shrink-0 mt-0.5" />
        )}
        <div className="flex items-start justify-between gap-1 flex-1 min-w-0">
          <span className={`text-sm font-medium truncate flex-1 ${isSelected ? 'text-white' : 'text-white/80'}`}>
            {label}
          </span>
          <span className="text-xs text-white/40 truncate max-w-[60px]">
            {category || ''}
          </span>
        </div>
      </div>

      {/* User position (only if connected) */}
      {isConnected && (
        <div className="flex items-center gap-1.5 mt-1 text-xs">
          <span className={hasTrust ? 'text-cyan-400' : 'text-white/30'}>
            {truncateAmount(trustValue)} {t('common.trustUnit')}
          </span>
          <span className="text-white/20">·</span>
          <span className={hasTrust ? 'text-white/60' : 'text-white/30'}>
            {truncateAmount(sharesValue, 2)} {t('common.shares')}
          </span>
          {/* Position badges [S/O] [L/P] */}
          {userPosition && (userPosition.linearTrust > 0n || userPosition.progressiveTrust > 0n) && (
            <>
              <span className="text-white/20">·</span>
              {userPosition.linearSupport > 0n && (
                <span className="flex gap-0.5">
                  <span className="w-4 h-4 flex items-center justify-center rounded text-[10px] font-bold" style={{ backgroundColor: `${SUPPORT_COLORS.base}30`, color: SUPPORT_COLORS.base }}>S</span>
                  <span className="w-4 h-4 flex items-center justify-center rounded text-[10px] font-bold" style={{ backgroundColor: `${SUPPORT_COLORS.base}20`, color: SUPPORT_COLORS.base }}>L</span>
                </span>
              )}
              {userPosition.linearOppose > 0n && (
                <span className="flex gap-0.5">
                  <span className="w-4 h-4 flex items-center justify-center rounded text-[10px] font-bold" style={{ backgroundColor: `${OPPOSE_COLORS.base}30`, color: OPPOSE_COLORS.base }}>O</span>
                  <span className="w-4 h-4 flex items-center justify-center rounded text-[10px] font-bold" style={{ backgroundColor: `${OPPOSE_COLORS.base}20`, color: OPPOSE_COLORS.base }}>L</span>
                </span>
              )}
              {userPosition.progressiveSupport > 0n && (
                <span className="flex gap-0.5">
                  <span className="w-4 h-4 flex items-center justify-center rounded text-[10px] font-bold" style={{ backgroundColor: `${SUPPORT_COLORS.base}30`, color: SUPPORT_COLORS.base }}>S</span>
                  <span className="w-4 h-4 flex items-center justify-center rounded text-[10px] font-bold" style={{ backgroundColor: `${SUPPORT_COLORS.base}20`, color: SUPPORT_COLORS.base }}>P</span>
                </span>
              )}
              {userPosition.progressiveOppose > 0n && (
                <span className="flex gap-0.5">
                  <span className="w-4 h-4 flex items-center justify-center rounded text-[10px] font-bold" style={{ backgroundColor: `${OPPOSE_COLORS.base}30`, color: OPPOSE_COLORS.base }}>O</span>
                  <span className="w-4 h-4 flex items-center justify-center rounded text-[10px] font-bold" style={{ backgroundColor: `${OPPOSE_COLORS.base}20`, color: OPPOSE_COLORS.base }}>P</span>
                </span>
              )}
            </>
          )}
        </div>
      )}

      {/* Expanded Details - Animated open/close */}
      {hasTrust && (
        <div className={`overflow-hidden transition-all duration-500 ease-out ${
          shouldExpand ? 'max-h-24 opacity-100 mt-2' : 'max-h-0 opacity-0 mt-0'
        }`}>
          <div className="border-t border-white/10 pt-2 space-y-1">
            {linearSupportValue > 0 && (
              <div className="flex justify-between items-center text-xs">
                <span>
                  <span className="font-medium" style={{ color: SUPPORT_COLORS.base }}>{t('vote.support')}</span>
                  <span className="ml-1" style={{ color: `${CURVE_COLORS.linear.text}B0` }}>{t('curve.linear')}</span>
                </span>
                <span className="text-white/80 font-medium">{truncateAmount(linearSupportValue)}</span>
              </div>
            )}
            {linearOpposeValue > 0 && (
              <div className="flex justify-between items-center text-xs">
                <span>
                  <span className="font-medium" style={{ color: OPPOSE_COLORS.base }}>{t('vote.oppose')}</span>
                  <span className="ml-1" style={{ color: `${CURVE_COLORS.linear.text}B0` }}>{t('curve.linear')}</span>
                </span>
                <span className="text-white/80 font-medium">{truncateAmount(linearOpposeValue)}</span>
              </div>
            )}
            {progressiveSupportValue > 0 && (
              <div className="flex justify-between items-center text-xs">
                <span>
                  <span className="font-medium" style={{ color: SUPPORT_COLORS.base }}>{t('vote.support')}</span>
                  <span className="ml-1" style={{ color: `${CURVE_COLORS.progressive.text}B0` }}>{t('curve.progressive')}</span>
                </span>
                <span className="text-white/80 font-medium">{truncateAmount(progressiveSupportValue)}</span>
              </div>
            )}
            {progressiveOpposeValue > 0 && (
              <div className="flex justify-between items-center text-xs">
                <span>
                  <span className="font-medium" style={{ color: OPPOSE_COLORS.base }}>{t('vote.oppose')}</span>
                  <span className="ml-1" style={{ color: `${CURVE_COLORS.progressive.text}B0` }}>{t('curve.progressive')}</span>
                </span>
                <span className="text-white/80 font-medium">{truncateAmount(progressiveOpposeValue)}</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
