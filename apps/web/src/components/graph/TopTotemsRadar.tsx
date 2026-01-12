/**
 * TopTotemsRadar - Radar chart showing top totems FOR vs AGAINST
 *
 * Displays a radar/spider chart with:
 * - Each axis = one totem
 * - Blue area = FOR votes
 * - Orange area = AGAINST votes
 *
 * Supports two display modes:
 * - 'trust': Shows TRUST values (ETH deposited)
 * - 'wallets': Shows wallet counts (1 wallet = 1 vote)
 *
 * Uses recharts RadarChart component
 *
 * @see Phase 10 - Étape 3 in TODO_FIX_01_Discussion.md
 */

import { useMemo, useState, useEffect, useRef, useCallback, memo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Legend,
  Tooltip,
} from 'recharts';
import type { TopTotem } from '../../hooks';
import { truncateAmount } from '../../utils/formatters';
import { SUPPORT_COLORS, OPPOSE_COLORS } from '../../config/colors';

/** Display mode for the radar chart */
export type RadarMode = 'trust' | 'wallets';

/** Curve mode for filtering data by bonding curve type */
export type CurveMode = 'linear' | 'progressive' | 'total';

interface TopTotemsRadarProps {
  /** Top totems data */
  totems: TopTotem[];
  /** Whether data is loading */
  loading?: boolean;
  /** Optional click handler for totem selection */
  onTotemClick?: (totemId: string, totemLabel: string) => void;
  /** Height of the chart */
  height?: number;
  /** Display mode: 'trust' for TRUST values, 'wallets' for wallet counts */
  mode?: RadarMode;
  /** Show curve toggle (Linear/Progressive/Total) */
  showCurveToggle?: boolean;
  /** Currently selected curve mode */
  curveMode?: CurveMode;
  /** Callback when curve mode changes */
  onCurveModeChange?: (mode: CurveMode) => void;
}

/**
 * Format TRUST value for display (using truncation like INTUITION)
 */
function formatTrust(value: number): string {
  if (value >= 1000) {
    return `${truncateAmount(value / 1000, 1)}k`;
  }
  if (value >= 1) {
    return truncateAmount(value, 2);
  }
  if (value >= 0.001) {
    return truncateAmount(value, 5);
  }
  return '0';
}

/**
 * Format wallet count for display
 */
function formatWallets(value: number): string {
  if (value >= 1000) {
    return `${truncateAmount(value / 1000, 1)}k`;
  }
  return value.toString();
}

/**
 * Truncate label for radar axis
 */
function truncateLabel(label: string, maxLength: number = 10): string {
  if (label.length <= maxLength) return label;
  return `${label.slice(0, maxLength - 1)}…`;
}

/**
 * Custom tick component for clickable axis labels
 */
function ClickableAxisTick({
  x,
  y,
  payload,
  onTotemClick,
  chartData,
}: {
  x?: string | number;
  y?: string | number;
  payload?: { value: string };
  onTotemClick?: (totemId: string, totemLabel: string) => void;
  chartData: Array<{ totem: string; totemId: string; fullLabel: string }>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
}) {
  if (!payload || x === undefined || y === undefined) return null;

  const totemData = chartData.find((d) => d.totem === payload.value);
  const numX = typeof x === 'string' ? parseFloat(x) : x;
  const numY = typeof y === 'string' ? parseFloat(y) : y;

  const handleClick = () => {
    if (onTotemClick && totemData) {
      onTotemClick(totemData.totemId, totemData.fullLabel);
    }
  };

  return (
    <g
      transform={`translate(${numX},${numY})`}
      onClick={handleClick}
      style={{ cursor: onTotemClick ? 'pointer' : 'default' }}
    >
      <text
        fill="#9ca3af"
        fontSize={11}
        textAnchor="middle"
        dominantBaseline="middle"
        className={onTotemClick ? 'hover:fill-white transition-colors' : ''}
      >
        {payload.value}
      </text>
    </g>
  );
}

/**
 * Custom tooltip for radar chart with quadrant-based positioning
 */
function CustomRadarTooltip({
  active,
  payload,
  coordinate,
  viewBox,
  mode = 'trust',
}: {
  active?: boolean;
  payload?: Array<{
    value: number;
    name: string;
    payload: {
      totem: string;
      for: number;
      against: number;
      fullLabel: string;
      rawFor?: number;
      rawAgainst?: number;
      rawWalletsFor?: number;
      rawWalletsAgainst?: number;
    };
  }>;
  coordinate?: { x: number; y: number };
  viewBox?: { cx: number; cy: number; width: number; height: number };
  mode?: RadarMode;
}) {
  if (!active || !payload || payload.length === 0) return null;

  const data = payload[0]?.payload;
  if (!data) return null;

  // Use raw values for display if available (before sqrt normalization)
  const isTrustMode = mode === 'trust';
  const forValue = isTrustMode
    ? (data.rawFor ?? data.for)
    : (data.rawWalletsFor ?? data.for);
  const againstValue = isTrustMode
    ? (data.rawAgainst ?? data.against)
    : (data.rawWalletsAgainst ?? data.against);
  const net = forValue - againstValue;

  // Calculate quadrant-based positioning
  const cx = viewBox?.cx ?? (viewBox?.width ?? 300) / 2;
  const cy = viewBox?.cy ?? (viewBox?.height ?? 300) / 2;
  const mouseX = coordinate?.x ?? cx;
  const mouseY = coordinate?.y ?? cy;

  const isLeft = mouseX < cx;
  const isTop = mouseY < cy;

  // Position style based on quadrant (opposite corner)
  const positionStyle: React.CSSProperties = {
    position: 'absolute',
    pointerEvents: 'none',
    zIndex: 10,
    ...(isTop ? { bottom: 8 } : { top: 8 }),
    ...(isLeft ? { right: 8 } : { left: 8 }),
  };

  const formatValue = isTrustMode ? formatTrust : formatWallets;
  const unitLabel = isTrustMode ? 'TRUST' : 'wallets';

  return (
    <div style={positionStyle}>
      <div className="bg-gray-900/95 border border-white/10 rounded-lg p-3 shadow-xl">
        <p className="text-sm font-medium text-white mb-2">{data.fullLabel}</p>
        <div className="space-y-1">
          <div className="flex items-center justify-between gap-4">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: SUPPORT_COLORS.base }} />
              <span className="text-xs text-white/70">Support</span>
            </span>
            <span className="text-xs font-medium" style={{ color: SUPPORT_COLORS.base }}>
              {formatValue(forValue)} {unitLabel}
            </span>
          </div>
          <div className="flex items-center justify-between gap-4">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: OPPOSE_COLORS.base }} />
              <span className="text-xs text-white/70">Oppose</span>
            </span>
            <span className="text-xs font-medium" style={{ color: OPPOSE_COLORS.base }}>
              {formatValue(againstValue)} {unitLabel}
            </span>
          </div>
          <div className="border-t border-white/10 pt-1 mt-1">
            <div className="flex items-center justify-between gap-4">
              <span className="text-xs text-white/50">Net</span>
              <span className={`text-xs font-medium ${net >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {net >= 0 ? '+' : ''}{formatValue(Math.abs(net))}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Radar chart component for top totems visualization
 * Wrapped in React.memo to prevent unnecessary re-renders
 */
export const TopTotemsRadar = memo(function TopTotemsRadar({
  totems,
  loading = false,
  onTotemClick,
  height = 250,
  mode = 'trust',
  showCurveToggle = false,
  curveMode = 'total',
  onCurveModeChange,
}: TopTotemsRadarProps) {
  const { t } = useTranslation();
  const containerRef = useRef<HTMLDivElement>(null);
  const isTrustMode = mode === 'trust';

  // Track container dimensions for RadarChart (avoiding ResponsiveContainer issues)
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  const measureContainer = useCallback(() => {
    if (containerRef.current) {
      const { clientWidth, clientHeight } = containerRef.current;
      // Only update if dimensions actually changed to avoid unnecessary re-renders
      if (clientWidth > 0 && clientHeight > 0) {
        setDimensions((prev) => {
          if (prev.width === clientWidth && prev.height === clientHeight) {
            return prev; // Return same reference if unchanged
          }
          return { width: clientWidth, height: clientHeight };
        });
      }
    }
  }, []);

  useEffect(() => {
    // Use requestAnimationFrame to ensure DOM is ready
    const rafId = requestAnimationFrame(() => {
      measureContainer();
    });

    // Use ResizeObserver to handle resize
    const observer = new ResizeObserver(() => {
      measureContainer();
    });

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => {
      cancelAnimationFrame(rafId);
      observer.disconnect();
    };
  }, [measureContainer]);

  // Transform data for recharts with sqrt normalization
  // This compresses extreme values so differences are visible but not overwhelming
  const { chartData, maxValue } = useMemo(() => {
    if (totems.length === 0) {
      return { chartData: [], maxValue: 1 };
    }

    // Get values based on mode
    const getForValue = (t: TopTotem) => isTrustMode ? t.trustFor : t.walletsFor;
    const getAgainstValue = (t: TopTotem) => isTrustMode ? t.trustAgainst : t.walletsAgainst;

    // Find max for normalization
    const rawMax = Math.max(...totems.map((t) => Math.max(getForValue(t), getAgainstValue(t))), 0.001);

    // Apply sqrt normalization to compress extreme values
    // sqrt(0.55) ≈ 0.74, sqrt(0.05) ≈ 0.22 → ratio 3.4:1 instead of 11:1
    const normalizedData = totems.map((totem) => {
      const forVal = getForValue(totem);
      const againstVal = getAgainstValue(totem);
      return {
        totem: truncateLabel(totem.label),
        fullLabel: totem.label,
        totemId: totem.id,
        // Normalized values for chart display
        for: Math.sqrt(forVal / rawMax) * rawMax,
        against: Math.sqrt(againstVal / rawMax) * rawMax,
        // Keep raw values for tooltip (both modes)
        rawFor: totem.trustFor,
        rawAgainst: totem.trustAgainst,
        rawWalletsFor: totem.walletsFor,
        rawWalletsAgainst: totem.walletsAgainst,
      };
    });

    // Recalculate max after normalization
    const normalizedMax = Math.max(
      ...normalizedData.map((d) => Math.max(d.for, d.against)),
      0.001
    );

    return {
      chartData: normalizedData,
      maxValue: normalizedMax * 1.1, // Add 10% padding
    };
  }, [totems, isTrustMode]);

  const hasValidSize = dimensions.width > 0 && dimensions.height > 0;

  // Determine what to render inside the container
  const renderContent = () => {
    // Empty state
    if (!loading && totems.length === 0) {
      return (
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <svg
              className="w-10 h-10 mx-auto text-white/20 mb-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z"
              />
            </svg>
            <p className="text-white/40 text-sm">{t('common.noData')}</p>
          </div>
        </div>
      );
    }

    // Loading state
    if (loading) {
      return (
        <div className="flex items-center justify-center h-full">
          <div className="animate-spin w-6 h-6 border-2 border-slate-500 border-t-transparent rounded-full" />
        </div>
      );
    }

    // Need at least 3 points for a proper radar - show list instead
    if (totems.length < 3) {
      const formatValue = isTrustMode ? formatTrust : formatWallets;
      return (
        <div className="p-3 h-full overflow-auto">
          <div className="space-y-2">
            {totems.map((totem, index) => {
              const forVal = isTrustMode ? totem.trustFor : totem.walletsFor;
              const againstVal = isTrustMode ? totem.trustAgainst : totem.walletsAgainst;
              return (
                <div
                  key={totem.id || `totem-${index}`}
                  className="flex items-center justify-between p-2 bg-white/5 rounded cursor-pointer hover:bg-white/10 transition-colors"
                  onClick={() => onTotemClick?.(totem.id, totem.label)}
                >
                  <span className="text-sm text-white truncate">{totem.label}</span>
                  <div className="flex gap-2 text-xs">
                    <span style={{ color: SUPPORT_COLORS.base }}>+{formatValue(forVal)}</span>
                    <span style={{ color: OPPOSE_COLORS.base }}>-{formatValue(againstVal)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      );
    }

    // Waiting for dimensions
    if (!hasValidSize) {
      return (
        <div className="flex items-center justify-center h-full">
          <div className="animate-spin w-6 h-6 border-2 border-slate-500 border-t-transparent rounded-full" />
        </div>
      );
    }

    // Handle click on radar point
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handleRadarClick = (data: any) => {
      if (data?.payload && onTotemClick) {
        const payload = data.payload;
        onTotemClick(payload.totemId, payload.fullLabel);
      }
    };

    // Render radar chart with recharts Tooltip using custom content with quadrant positioning
    return (
      <div className="relative w-full h-full outline-none focus:outline-none" tabIndex={-1}>
        <RadarChart
          width={dimensions.width}
          height={dimensions.height}
          data={chartData}
          margin={{ top: 1, right: 1, bottom: 1, left: 1 }}
          style={{ outline: 'none' }}
        >
          <PolarGrid
            stroke="#374151"
            strokeOpacity={0.5}
          />
          <PolarAngleAxis
            dataKey="totem"
            tick={(props) => (
              <ClickableAxisTick
                {...props}
                onTotemClick={onTotemClick}
                chartData={chartData}
              />
            )}
          />
          <PolarRadiusAxis
            angle={90}
            domain={[0, maxValue]}
            tick={false}
            axisLine={false}
          />
          <Tooltip
            content={<CustomRadarTooltip viewBox={{ cx: dimensions.width / 2, cy: dimensions.height / 2, width: dimensions.width, height: dimensions.height }} mode={mode} />}
            wrapperStyle={{ visibility: 'visible', position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, pointerEvents: 'none' }}
            trigger="hover"
          />
          <Legend
            verticalAlign="bottom"
            height={24}
            formatter={(value) => (
              <span className="text-xs text-white/60">{value}</span>
            )}
          />

          {/* Support area - Intuition blue with clickable dots */}
          <Radar
            name="Support"
            dataKey="for"
            stroke={SUPPORT_COLORS.base}
            strokeWidth={2}
            fill={SUPPORT_COLORS.base}
            fillOpacity={0.3}
            animationDuration={750}
            dot={{ r: 4, fill: SUPPORT_COLORS.base, stroke: SUPPORT_COLORS.fill, strokeWidth: 1, cursor: 'pointer' }}
            activeDot={{ r: 6, fill: SUPPORT_COLORS.base, stroke: SUPPORT_COLORS.fill, strokeWidth: 2, cursor: 'pointer', onClick: handleRadarClick }}
          />

          {/* Oppose area - Intuition orange with clickable dots */}
          <Radar
            name="Oppose"
            dataKey="against"
            stroke={OPPOSE_COLORS.base}
            strokeWidth={2}
            fill={OPPOSE_COLORS.base}
            fillOpacity={0.3}
            animationDuration={750}
            dot={{ r: 4, fill: OPPOSE_COLORS.base, stroke: OPPOSE_COLORS.fill, strokeWidth: 1, cursor: 'pointer' }}
            activeDot={{ r: 6, fill: OPPOSE_COLORS.base, stroke: OPPOSE_COLORS.fill, strokeWidth: 2, cursor: 'pointer', onClick: handleRadarClick }}
          />
        </RadarChart>
      </div>
    );
  };

  // Dynamic title based on mode and curve
  const getCurveLabel = () => {
    switch (curveMode) {
      case 'linear': return 'Linear';
      case 'progressive': return 'Progressive';
      default: return 'Total';
    }
  };

  const title = isTrustMode
    ? t('results.topTotems.titleTrust', 'Top Totems (TRUST)')
    : t('results.topTotems.titleWallets', 'Top Totems (Votes)');

  // Curve toggle component
  const CurveToggle = () => {
    if (!showCurveToggle) return null;

    const modes: CurveMode[] = ['linear', 'progressive', 'total'];
    const labels: Record<CurveMode, string> = {
      linear: 'Linear',
      progressive: 'Progressive',
      total: 'Total',
    };

    return (
      <div className="flex gap-0.5 bg-white/5 rounded p-0.5">
        {modes.map((m) => (
          <button
            key={m}
            onClick={() => onCurveModeChange?.(m)}
            className={`px-2 py-0.5 text-[10px] font-medium rounded transition-colors ${
              curveMode === m
                ? 'bg-slate-500/30 text-slate-300'
                : 'text-white/40 hover:text-white/60'
            }`}
          >
            {labels[m]}
          </button>
        ))}
      </div>
    );
  };

  // Render flat list for wallets mode (simple ranking)
  const renderWalletsList = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center h-full">
          <div className="animate-spin w-6 h-6 border-2 border-slate-500 border-t-transparent rounded-full" />
        </div>
      );
    }

    if (totems.length === 0) {
      return (
        <div className="flex items-center justify-center h-full">
          <p className="text-white/40 text-sm">{t('common.noData')}</p>
        </div>
      );
    }

    // Sort by netVotes for wallets mode
    const sortedTotems = [...totems].sort((a, b) => b.netVotes - a.netVotes);
    const maxNetVotes = Math.max(...sortedTotems.map((t) => Math.abs(t.netVotes)), 1);

    return (
      <div className="p-2 h-full overflow-auto space-y-1.5">
        {sortedTotems.map((totem, index) => {
          const barWidth = Math.abs(totem.netVotes) / maxNetVotes * 100;
          const isPositive = totem.netVotes >= 0;

          return (
            <div
              key={totem.id || `totem-${index}`}
              className="relative bg-white/5 rounded p-2 cursor-pointer hover:bg-white/10 transition-colors"
              onClick={() => onTotemClick?.(totem.id, totem.label)}
            >
              {/* Background bar - Intuition colors */}
              <div
                className="absolute inset-y-0 left-0 rounded opacity-20"
                style={{
                  width: `${barWidth}%`,
                  backgroundColor: isPositive ? SUPPORT_COLORS.base : OPPOSE_COLORS.base,
                }}
              />
              {/* Content */}
              <div className="relative flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <span className="text-white/40 text-xs w-4">{index + 1}.</span>
                  <span className="text-sm text-white truncate">{totem.label}</span>
                </div>
                <div className="flex items-center gap-2 text-xs shrink-0">
                  <span style={{ color: SUPPORT_COLORS.base }}>{totem.walletsFor}</span>
                  <span className="text-white/30">/</span>
                  <span style={{ color: OPPOSE_COLORS.base }}>{totem.walletsAgainst}</span>
                  <span className={`font-medium ml-1 ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
                    {isPositive ? '+' : ''}{totem.netVotes}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <h4 className="text-sm font-medium text-white/70">
          {title}
          {showCurveToggle && curveMode !== 'total' && (
            <span className="ml-1 text-xs text-slate-400">({getCurveLabel()})</span>
          )}
        </h4>
        <CurveToggle />
      </div>
      <div
        ref={containerRef}
        className="bg-gray-900/30 rounded-lg outline-none focus:outline-none **:outline-none"
        style={{ height }}
        tabIndex={-1}
      >
        {isTrustMode ? renderContent() : renderWalletsList()}
      </div>
    </div>
  );
});

/**
 * TopTotemsRadar with data fetching
 */
export { useTopTotems } from '../../hooks';
