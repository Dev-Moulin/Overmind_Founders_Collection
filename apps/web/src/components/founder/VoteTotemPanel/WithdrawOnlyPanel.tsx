/**
 * WithdrawOnlyPanel - Multi-position withdraw panel
 *
 * WITHDRAW button allows withdrawing TRUST from any position.
 * Now supports multiple positions (Linear/Progressive x Support/Oppose).
 * This component shows:
 * 1. All available positions with Direction + Curve + Amount
 * 2. Position selector to choose which position to withdraw from
 * 3. Slider to choose how much to withdraw (0-100%)
 * 4. Confirm withdraw button
 */

import { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import type { Hex } from 'viem';
import { formatEther } from 'viem';
import { truncateAmount } from '../../../utils/formatters';
import { usePreviewRedeem, type CurveId } from '../../../hooks';
import { SUPPORT_COLORS, OPPOSE_COLORS, CURVE_COLORS, NET_COLORS } from '../../../config/colors';

/** Single position info */
export interface PositionInfo {
  direction: 'for' | 'against';
  curveId: CurveId;
  shares: bigint;
  termId: Hex;
}

/** Info for a single withdrawal to execute */
export interface WithdrawRequest {
  termId: Hex;
  shares: bigint;
  curveId: CurveId;
  direction: 'for' | 'against';
  percentage: number;
}

interface WithdrawOnlyPanelProps {
  /** All user positions on this totem */
  positions: PositionInfo[];
  /** Callback when user confirms withdrawal - now accepts multiple positions */
  onWithdrawMultiple: (requests: WithdrawRequest[]) => Promise<void>;
  disabled?: boolean;
}

export function WithdrawOnlyPanel({
  positions,
  onWithdrawMultiple,
  disabled = false,
}: WithdrawOnlyPanelProps) {
  const { t } = useTranslation();
  const { preview, currentPreview, loading: previewLoading } = usePreviewRedeem();

  // Filter only positions with shares > 0
  const availablePositions = positions.filter(p => p.shares > 0n);

  // Selected position indices (Set for multi-select with toggle)
  const [selectedIndexes, setSelectedIndexes] = useState<Set<number>>(() => {
    // Auto-select all positions on mount
    return new Set(availablePositions.map((_, i) => i));
  });

  // Get selected positions
  const selectedPositions = availablePositions.filter((_, i) => selectedIndexes.has(i));

  // Toggle selection on click
  const toggleSelection = (index: number) => {
    setSelectedIndexes(prev => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  };

  // Total of all selected positions in TRUST
  const totalSelectedFloat = selectedPositions.reduce(
    (sum, pos) => sum + parseFloat(formatEther(pos.shares)),
    0
  );
  const formattedTotalSelected = truncateAmount(totalSelectedFloat);

  // Withdraw percentage (0-100)
  const [withdrawPercent, setWithdrawPercent] = useState(100);

  // Reset to 100% when selection changes
  useEffect(() => {
    setWithdrawPercent(100);
  }, [selectedIndexes.size]);

  // Calculate amount to withdraw based on percentage
  const withdrawAmountFloat = (totalSelectedFloat * withdrawPercent) / 100;
  const formattedWithdrawAmount = truncateAmount(withdrawAmountFloat);

  // Calculate shares to withdraw for each selected position (proportional)
  const withdrawRequests = useMemo((): WithdrawRequest[] => {
    if (selectedPositions.length === 0 || withdrawPercent === 0) return [];

    return selectedPositions.map(pos => {
      // Use BigInt arithmetic to avoid precision loss with large numbers
      // For 100%, use all shares directly to avoid any rounding issues
      const sharesToWithdraw = withdrawPercent === 100
        ? pos.shares
        : (pos.shares * BigInt(withdrawPercent)) / 100n;
      return {
        termId: pos.termId,
        shares: sharesToWithdraw,
        curveId: pos.curveId,
        direction: pos.direction,
        percentage: withdrawPercent,
      };
    }).filter(req => req.shares > 0n);
  }, [selectedPositions, withdrawPercent]);

  // Total shares to withdraw (for display)
  const totalSharesToWithdraw = withdrawRequests.reduce((sum, req) => sum + req.shares, 0n);

  // Handle percentage change from slider
  const handlePercentChange = (newPercent: number) => {
    setWithdrawPercent(Math.max(0, Math.min(100, newPercent)));
  };

  // Preview withdrawal (simplified - just show percentage of total)
  // Use stable dependencies: only trigger when selection or percent actually changes
  const selectedPositionsCount = selectedPositions.length;
  const firstSelectedTermId = selectedPositions[0]?.termId;
  const firstSelectedShares = selectedPositions[0]?.shares;
  const firstSelectedCurveId = selectedPositions[0]?.curveId;

  useEffect(() => {
    if (selectedPositionsCount === 1 && firstSelectedShares && firstSelectedShares > 0n) {
      // Use BigInt arithmetic to avoid precision loss with large numbers
      const shares = withdrawPercent === 100
        ? firstSelectedShares
        : (firstSelectedShares * BigInt(withdrawPercent)) / 100n;
      if (shares > 0n && firstSelectedTermId) {
        preview(firstSelectedTermId, shares, firstSelectedCurveId);
      }
    }
  }, [selectedPositionsCount, firstSelectedTermId, firstSelectedShares, firstSelectedCurveId, withdrawPercent, preview]);

  const handleWithdrawSubmit = async () => {
    if (withdrawRequests.length > 0) {
      await onWithdrawMultiple(withdrawRequests);
    }
  };

  // Quick presets
  const handlePreset = (percent: number) => {
    handlePercentChange(percent);
  };

  // Helper to get position label
  const getPositionLabel = (pos: PositionInfo) => {
    const directionLabel = pos.direction === 'for' ? 'Support' : 'Oppose';
    const curveLabel = pos.curveId === 1 ? 'Linear' : 'Progressive';
    const amount = truncateAmount(formatEther(pos.shares));
    return { directionLabel, curveLabel, amount };
  };

  // If no positions available
  if (availablePositions.length === 0) {
    return (
      <div className="bg-orange-500/10 border border-orange-500/30 rounded-lg p-4 text-center">
        <p className="text-orange-300 text-sm mb-2">
          {t('founderExpanded.noPositionToWithdraw') || 'Vous n\'avez pas de position sur ce totem'}
        </p>
      </div>
    );
  }

  // Determine background color based on majority of selected positions
  const hasSupportSelected = selectedPositions.some(p => p.direction === 'for');
  const hasOpposeSelected = selectedPositions.some(p => p.direction === 'against');
  // Use inline styles for Intuition colors
  const getBgStyle = () => {
    if (hasSupportSelected && hasOpposeSelected) {
      return { backgroundColor: `${OPPOSE_COLORS.base}10`, borderColor: `${OPPOSE_COLORS.base}30` }; // Mixed
    }
    if (hasSupportSelected) {
      return { backgroundColor: `${SUPPORT_COLORS.base}10`, borderColor: `${SUPPORT_COLORS.base}30` };
    }
    if (hasOpposeSelected) {
      return { backgroundColor: `${OPPOSE_COLORS.base}10`, borderColor: `${OPPOSE_COLORS.base}30` };
    }
    return undefined;
  };
  const bgStyle = getBgStyle();

  return (
    <div className="border rounded-lg p-4 space-y-4" style={bgStyle || { backgroundColor: 'rgba(255,255,255,0.05)', borderColor: 'rgba(255,255,255,0.1)' }}>
      {/* Position Selector - Multi-select with toggle */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-white/50">
            {t('founderExpanded.selectPositions')}
          </span>
          <span className="text-xs text-orange-300">
            {t('founderExpanded.selectedCount', { selected: selectedIndexes.size, total: availablePositions.length })}
          </span>
        </div>
        <div className="grid gap-2">
          {availablePositions.map((pos, index) => {
            const { directionLabel, curveLabel, amount } = getPositionLabel(pos);
            const isSelected = selectedIndexes.has(index);
            const directionColors = pos.direction === 'for' ? SUPPORT_COLORS : OPPOSE_COLORS;
            const curveColors = pos.curveId === 1 ? CURVE_COLORS.linear : CURVE_COLORS.progressive;

            return (
              <button
                key={`${pos.direction}-${pos.curveId}`}
                onClick={() => toggleSelection(index)}
                className={`flex items-center justify-between p-3 rounded-lg border transition-all ${
                  isSelected ? 'ring-1' : 'bg-white/5 border-white/10 hover:bg-white/10 opacity-60'
                }`}
                style={isSelected ? {
                  backgroundColor: `${directionColors.base}20`,
                  borderColor: `${directionColors.base}50`,
                  boxShadow: `0 0 0 1px ${directionColors.base}30`,
                } : undefined}
              >
                <div className="flex items-center gap-2">
                  {/* Checkbox indicator */}
                  <span className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                    isSelected
                      ? 'bg-orange-500 border-orange-500'
                      : 'border-white/30 bg-transparent'
                  }`}>
                    {isSelected && (
                      <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </span>
                  <span className="font-medium" style={{ color: directionColors.base }}>{directionLabel}</span>
                  <span
                    className="text-xs px-1.5 py-0.5 rounded bg-white/10"
                    style={{ color: curveColors.text }}
                  >
                    {curveLabel}
                  </span>
                </div>
                <span className="text-white font-medium">{amount} TRUST</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Show withdraw controls only when at least one position is selected */}
      {selectedIndexes.size > 0 && (
        <>
          {/* Withdraw Amount Display - Real-time feedback */}
          <div className="bg-black/30 rounded-lg p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-white/70">{t('founderExpanded.withdrawAmount')}</span>
              <span className="text-sm text-orange-300 font-medium">{withdrawPercent}%</span>
            </div>
            <div className="text-center">
              <span className="text-2xl font-bold text-orange-400">{formattedWithdrawAmount}</span>
              <span className="text-lg text-white/50 ml-1">/ {formattedTotalSelected} TRUST</span>
            </div>
            {selectedIndexes.size > 1 && (
              <p className="text-xs text-white/40 text-center mt-1">
                {t('founderExpanded.positionsSelectedCount', { count: selectedIndexes.size })}
              </p>
            )}
          </div>

          {/* Percentage Slider */}
          <div className="space-y-2">
            <input
              type="range"
              min={0}
              max={100}
              step={1}
              value={withdrawPercent}
              onChange={(e) => handlePercentChange(parseInt(e.target.value))}
              className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-orange-500"
            />
            {/* Quick presets */}
            <div className="flex justify-between gap-2">
              <button
                onClick={() => handlePreset(25)}
                className={`flex-1 py-1 text-xs rounded transition-colors ${
                  withdrawPercent === 25 ? 'bg-orange-500/30 text-orange-300' : 'bg-white/5 text-white/50 hover:bg-white/10'
                }`}
              >
                25%
              </button>
              <button
                onClick={() => handlePreset(50)}
                className={`flex-1 py-1 text-xs rounded transition-colors ${
                  withdrawPercent === 50 ? 'bg-orange-500/30 text-orange-300' : 'bg-white/5 text-white/50 hover:bg-white/10'
                }`}
              >
                50%
              </button>
              <button
                onClick={() => handlePreset(75)}
                className={`flex-1 py-1 text-xs rounded transition-colors ${
                  withdrawPercent === 75 ? 'bg-orange-500/30 text-orange-300' : 'bg-white/5 text-white/50 hover:bg-white/10'
                }`}
              >
                75%
              </button>
              <button
                onClick={() => handlePreset(100)}
                className={`flex-1 py-1 text-xs rounded transition-colors ${
                  withdrawPercent === 100 ? 'bg-orange-500/30 text-orange-300' : 'bg-white/5 text-white/50 hover:bg-white/10'
                }`}
              >
                MAX
              </button>
            </div>
          </div>

          {/* Preview - Single position shows detailed preview */}
          {previewLoading ? (
            <div className="text-sm text-white/50 text-center">{t('common.loading')}</div>
          ) : selectedPositions.length === 1 && currentPreview && totalSharesToWithdraw > 0n ? (
            <div className="bg-black/20 rounded-lg p-3 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-white/70">{t('founderExpanded.youWillReceive')}</span>
                <span className="font-semibold" style={{ color: NET_COLORS.positive.base }}>{currentPreview.netAmountFormatted} TRUST</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-white/50">{t('founderExpanded.exitFee')} ({currentPreview.exitFeePercent})</span>
                <span style={{ color: NET_COLORS.negative.base }}>-{currentPreview.exitFeeFormatted} TRUST</span>
              </div>
            </div>
          ) : selectedPositions.length > 1 && totalSharesToWithdraw > 0n ? (
            <div className="bg-black/20 rounded-lg p-3">
              <p className="text-xs text-white/50 text-center">
                {t('founderExpanded.sequentialWithdraws', { count: withdrawRequests.length })}
              </p>
            </div>
          ) : withdrawPercent === 0 ? (
            <div className="text-sm text-white/40 text-center">{t('founderExpanded.selectWithdrawAmount')}</div>
          ) : null}

          {/* Confirm Button */}
          <button
            onClick={handleWithdrawSubmit}
            disabled={disabled || totalSharesToWithdraw <= 0n}
            className="w-full px-4 py-3 bg-orange-500 text-white rounded-lg font-medium hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {withdrawPercent === 100
              ? selectedIndexes.size > 1
                ? t('founderExpanded.withdrawAllPositions') + ` (${selectedIndexes.size})`
                : t('founderExpanded.withdrawAll')
              : t('founderExpanded.confirmWithdraw')}
          </button>
        </>
      )}
    </div>
  );
}
