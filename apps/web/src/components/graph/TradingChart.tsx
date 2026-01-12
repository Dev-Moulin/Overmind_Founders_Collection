/**
 * TradingChart - Trading-style graph for vote visualization
 *
 * Displays FOR (green) and AGAINST (orange) votes over time
 * Similar to stock trading charts with area fills
 *
 * Uses recharts library (Evil Charts style)
 *
 * @see Phase 10 in TODO_FIX_01_Discussion.md
 */

import { useMemo, useState, memo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { CURVE_LINEAR, type CurveId } from '../../hooks';
import type { CurveFilter } from '../../hooks/data/useVotesTimeline';
import { CurveSwitch } from '../common/CurveSwitch';
import { truncateAmount } from '../../utils/formatters';
import { SUPPORT_COLORS, OPPOSE_COLORS } from '../../config/colors';

export type Timeframe = '12H' | '24H' | '7D' | 'All';

export interface VoteDataPoint {
  timestamp: number;
  date: string;
  forVotes: number;
  againstVotes: number;
  netVotes: number;
}

/** Dynamic title info for displaying totem or winner */
export interface ChartTitleInfo {
  /** Label (totem name or winner name) */
  label: string;
  /** TRUST value */
  trust: number;
  /** Curve type for coloring the label */
  curve: 'linear' | 'progressive';
  /** Direction for coloring the TRUST value */
  direction: 'for' | 'against' | 'neutral';
}

interface TradingChartProps {
  /** Vote data points over time */
  data: VoteDataPoint[];
  /** Current selected timeframe */
  timeframe: Timeframe;
  /** Callback when timeframe changes */
  onTimeframeChange: (timeframe: Timeframe) => void;
  /** Height of the chart */
  height?: number;
  /** Whether data is loading */
  loading?: boolean;
  /** Optional title (fallback if no dynamic title) */
  title?: string;
  /** Dynamic title info (takes precedence over title prop) */
  titleInfo?: ChartTitleInfo | null;
  /** Suggested timeframe if current one has no data */
  suggestedTimeframe?: Timeframe | null;
  /** Whether any data exists for this item */
  hasAnyData?: boolean;
  /** Current curve filter */
  curveFilter?: CurveFilter;
  /** Callback when curve filter changes */
  onCurveFilterChange?: (filter: CurveFilter) => void;
  /** User's position curve (for visual highlighting) */
  userPositionCurveId?: CurveId | null;
}

/**
 * Format timestamp for X-axis based on timeframe
 */
function formatXAxis(timestamp: number, timeframe: Timeframe): string {
  const date = new Date(timestamp);

  switch (timeframe) {
    case '12H':
    case '24H':
      return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    case '7D':
      return date.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric' });
    case 'All':
      return date.toLocaleDateString('fr-FR', { month: 'short', day: 'numeric' });
    default:
      return date.toLocaleDateString('fr-FR');
  }
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
  return truncateAmount(value, 5);
}

/**
 * Custom tooltip component
 * Uses Intuition color scheme: Support = blue (#0073e6), Oppose = orange (#ff8000)
 */
function CustomTooltip({
  active,
  payload,
  label
}: {
  active?: boolean;
  payload?: Array<{ value: number; name: string; color: string }>;
  label?: string;
}) {
  if (!active || !payload || payload.length === 0) return null;

  const forValue = payload.find(p => p.name === 'Support')?.value || 0;
  const againstValue = payload.find(p => p.name === 'Oppose')?.value || 0;
  const net = forValue - againstValue;

  return (
    <div className="bg-gray-900/95 border border-white/10 rounded-lg p-3 shadow-xl">
      <p className="text-xs text-white/60 mb-2">{label}</p>
      <div className="space-y-1">
        <div className="flex items-center justify-between gap-4">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: SUPPORT_COLORS.base }} />
            <span className="text-xs text-white/70">Support</span>
          </span>
          <span className="text-xs font-medium" style={{ color: SUPPORT_COLORS.base }}>
            {formatTrust(forValue)} TRUST
          </span>
        </div>
        <div className="flex items-center justify-between gap-4">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: OPPOSE_COLORS.base }} />
            <span className="text-xs text-white/70">Oppose</span>
          </span>
          <span className="text-xs font-medium" style={{ color: OPPOSE_COLORS.base }}>
            {formatTrust(againstValue)} TRUST
          </span>
        </div>
        <div className="border-t border-white/10 pt-1 mt-1">
          <div className="flex items-center justify-between gap-4">
            <span className="text-xs text-white/50">Net</span>
            <span className={`text-xs font-medium ${net >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {net >= 0 ? '+' : ''}{formatTrust(net)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Dynamic title component - shows colored label and TRUST value
 */
function DynamicTitle({
  titleInfo,
  fallbackTitle,
}: {
  titleInfo?: ChartTitleInfo | null;
  fallbackTitle: string;
}) {
  if (!titleInfo) {
    return <span className="text-white/70">{fallbackTitle}</span>;
  }

  // Curve colors: blue for linear, purple for progressive
  const curveColor = titleInfo.curve === 'linear'
    ? 'text-blue-400'
    : 'text-purple-400';

  // Direction colors: green for FOR, orange for AGAINST, neutral for balanced
  const directionColor = titleInfo.direction === 'for'
    ? 'text-green-400'
    : titleInfo.direction === 'against'
      ? 'text-orange-400'
      : 'text-white/60';

  return (
    <span className="flex items-center gap-2">
      <span className={curveColor}>{titleInfo.label}</span>
      <span className={`${directionColor} text-xs`}>
        {formatTrust(titleInfo.trust)} TRUST
      </span>
    </span>
  );
}

/**
 * Wrapper to adapt CurveSwitch props for TradingChart usage
 */
function CurveSwitchWrapper({
  selected,
  onChange,
  userPositionCurveId,
}: {
  selected: CurveFilter;
  onChange: (filter: CurveFilter) => void;
  userPositionCurveId?: CurveId | null;
}) {
  const hasLinearPosition = userPositionCurveId === CURVE_LINEAR;
  const hasProgressivePosition = userPositionCurveId !== null && userPositionCurveId !== CURVE_LINEAR;
  const isLinear = selected === 'linear';

  return (
    <CurveSwitch
      isLinear={isLinear}
      onChange={(newIsLinear) => onChange(newIsLinear ? 'linear' : 'progressive')}
      hasLinearPosition={hasLinearPosition}
      hasProgressivePosition={hasProgressivePosition}
      size="md"
    />
  );
}

/**
 * Timeframe selector buttons (compact)
 */
function TimeframeSelector({
  selected,
  onChange,
}: {
  selected: Timeframe;
  onChange: (tf: Timeframe) => void;
}) {
  const timeframes: Timeframe[] = ['12H', '24H', '7D', 'All'];

  return (
    <div className="flex bg-white/5 rounded-full p-0.5">
      {timeframes.map((tf) => (
        <button
          key={tf}
          onClick={() => onChange(tf)}
          className={`px-1.5 py-0.5 text-[9px] font-medium rounded-full transition-colors ${
            selected === tf
              ? 'bg-slate-500/30 text-slate-300'
              : 'text-white/40 hover:text-white/70'
          }`}
        >
          {tf}
        </button>
      ))}
    </div>
  );
}

/**
 * Trading-style chart component for vote visualization
 * Wrapped in React.memo to prevent unnecessary re-renders
 */
export const TradingChart = memo(function TradingChart({
  data,
  timeframe,
  onTimeframeChange,
  height = 200,
  loading = false,
  title = 'Vote Activity',
  titleInfo,
  suggestedTimeframe,
  hasAnyData = true,
  curveFilter,
  onCurveFilterChange,
  userPositionCurveId,
}: TradingChartProps) {
  const { t } = useTranslation();

  // Format data for display
  const chartData = useMemo(() => {
    return data.map((point) => ({
      ...point,
      formattedDate: formatXAxis(point.timestamp, timeframe),
    }));
  }, [data, timeframe]);

  // Empty state - with suggestion if data exists in another timeframe
  if (!loading && data.length === 0) {
    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium">
            <DynamicTitle titleInfo={titleInfo} fallbackTitle={title} />
          </h3>
          <div className="flex items-center gap-1.5">
            {curveFilter && onCurveFilterChange && (
              <CurveSwitchWrapper selected={curveFilter} onChange={onCurveFilterChange} userPositionCurveId={userPositionCurveId} />
            )}
            <TimeframeSelector selected={timeframe} onChange={onTimeframeChange} />
          </div>
        </div>
        <div
          className="flex items-center justify-center bg-white/5 rounded-lg"
          style={{ height }}
        >
          <div className="text-center px-4">
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
                d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z"
              />
            </svg>
            {hasAnyData && suggestedTimeframe ? (
              <>
                <p className="text-white/50 text-sm mb-2">
                  {t('tradingChart.noDataInTimeframe', { timeframe })}
                </p>
                <button
                  onClick={() => onTimeframeChange(suggestedTimeframe)}
                  className="px-3 py-1.5 bg-slate-500/30 text-slate-300 text-xs rounded-lg hover:bg-slate-500/40 transition-colors"
                >
                  {t('tradingChart.switchTo', { timeframe: suggestedTimeframe })}
                </button>
              </>
            ) : (
              <p className="text-white/40 text-sm">{t('common.noData')}</p>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Loading state
  if (loading) {
    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium">
            <DynamicTitle titleInfo={titleInfo} fallbackTitle={title} />
          </h3>
          <div className="flex items-center gap-1.5">
            {curveFilter && onCurveFilterChange && (
              <CurveSwitchWrapper selected={curveFilter} onChange={onCurveFilterChange} userPositionCurveId={userPositionCurveId} />
            )}
            <TimeframeSelector selected={timeframe} onChange={onTimeframeChange} />
          </div>
        </div>
        <div
          className="flex items-center justify-center bg-white/5 rounded-lg"
          style={{ height }}
        >
          <div className="animate-spin w-6 h-6 border-2 border-slate-500 border-t-transparent rounded-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">
          <DynamicTitle titleInfo={titleInfo} fallbackTitle={title} />
        </h3>
        <div className="flex items-center gap-1.5">
          {curveFilter && onCurveFilterChange && (
            <CurveSwitchWrapper selected={curveFilter} onChange={onCurveFilterChange} userPositionCurveId={userPositionCurveId} />
          )}
          <TimeframeSelector selected={timeframe} onChange={onTimeframeChange} />
        </div>
      </div>

      {/* Chart */}
      <div className="bg-gray-900/30 rounded-lg p-2" style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={chartData}
            margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
          >
            <defs>
              {/* Gradient for Support area - Intuition blue */}
              <linearGradient id="gradientFor" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={SUPPORT_COLORS.base} stopOpacity={0.4} />
                <stop offset="95%" stopColor={SUPPORT_COLORS.base} stopOpacity={0} />
              </linearGradient>
              {/* Gradient for Oppose area - Intuition orange */}
              <linearGradient id="gradientAgainst" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={OPPOSE_COLORS.base} stopOpacity={0.4} />
                <stop offset="95%" stopColor={OPPOSE_COLORS.base} stopOpacity={0} />
              </linearGradient>
            </defs>

            <XAxis
              dataKey="formattedDate"
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#6b7280', fontSize: 10 }}
              dy={10}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#6b7280', fontSize: 10 }}
              tickFormatter={(value) => formatTrust(value)}
              width={45}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              verticalAlign="top"
              height={24}
              formatter={(value) => (
                <span className="text-xs text-white/60">{value}</span>
              )}
            />

            {/* Support area - Intuition blue */}
            <Area
              type="monotone"
              dataKey="forVotes"
              name="Support"
              stroke={SUPPORT_COLORS.base}
              strokeWidth={2}
              fill="url(#gradientFor)"
              animationDuration={750}
            />

            {/* Oppose area - Intuition orange */}
            <Area
              type="monotone"
              dataKey="againstVotes"
              name="Oppose"
              stroke={OPPOSE_COLORS.base}
              strokeWidth={2}
              fill="url(#gradientAgainst)"
              animationDuration={750}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
});

/**
 * TradingChart with internal state management
 */
export function TradingChartWithState({
  data,
  height = 200,
  loading = false,
  title = 'Vote Activity',
  defaultTimeframe = '24H',
}: Omit<TradingChartProps, 'timeframe' | 'onTimeframeChange'> & {
  defaultTimeframe?: Timeframe;
}) {
  const [timeframe, setTimeframe] = useState<Timeframe>(defaultTimeframe);

  return (
    <TradingChart
      data={data}
      timeframe={timeframe}
      onTimeframeChange={setTimeframe}
      height={height}
      loading={loading}
      title={title}
    />
  );
}
