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
import type { CurveId } from '../../hooks';
import type { CurveFilter } from '../../hooks/data/useVotesTimeline';
import { GooeySwitch } from '../common';
import { truncateAmount } from '../../utils/formatters';
import { SUPPORT_COLORS, OPPOSE_COLORS, CURVE_COLORS, NET_COLORS } from '../../config/colors';

/**
 * Trophy icon for winners - Laurel wreath
 */
function TrophyIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="currentColor"
    >
      <path d="m9.654,8.86c-.199-.19-.206-.508-.015-.707l1.742-1.814c.278-.277.682-.36,1.037-.211.354.146.583.489.583.872v8.5c0,.276-.224.5-.5.5s-.5-.224-.5-.5V7.139l-1.639,1.708c-.191.198-.509.206-.707.014Zm-6.257,3.641c.005,0,.01,0,.015,0-.01-.008-.044-.024-.015,0Zm1.721-1.879v-.009c-.014-.021-.005,0,0,.009Zm15.659,1.878s.005,0,.008,0c.02-.011,0-.004-.008,0Zm3.206,1.062c.191.394.194.846.006,1.24-.475,1-1.32,2.297-2.745,3.189.133.101.257.201.372.299.358.304.551.746.528,1.212-.023.459-.253.872-.632,1.134-.788.544-1.977,1.181-3.376,1.331.02.046.039.092.057.136.156.381.128.807-.076,1.166s-.555.602-.962.664c-.49.074-.939.108-1.351.108-1.913,0-3.026-.734-3.675-1.582-.648.849-1.762,1.582-3.674,1.582-.412,0-.861-.034-1.351-.108-.408-.062-.759-.305-.963-.665-.204-.359-.231-.784-.076-1.166.018-.044.037-.089.057-.135-1.4-.15-2.588-.787-3.376-1.331-.379-.262-.609-.675-.632-1.134-.023-.466.169-.908.528-1.212.098-.084.204-.169.315-.255-1.468-.893-2.333-2.217-2.816-3.233-.188-.395-.185-.847.006-1.24.204-.419.589-.72,1.057-.825.126-.029.259-.056.397-.082-.455-.348-.851-.795-1.06-1.334-.608-1.569-.432-3.521-.178-4.881.08-.423.36-.778.751-.951.359-.16.769-.146,1.118.029-.168-.632-.15-1.293.188-1.935C3.202,2.096,4.726.927,5.867.208c.379-.239.831-.272,1.239-.099.427.184.738.576.833,1.049.539,2.705-.04,5.217-1.674,7.314-.932,7.465,2.922,11.545,5.879,11.99,2.947-.444,6.787-4.526,5.849-12.001-2.228-2.915-1.926-6.036-1.673-7.303.094-.473.406-.865.833-1.049.409-.175.859-.14,1.238.099,1.141.719,2.666,1.888,3.449,3.374.338.642.355,1.303.188,1.935.349-.175.759-.188,1.118-.03.391.174.672.529.751.951.255,1.361.431,3.312-.177,4.882-.214.551-.62,1.004-1.085,1.354.101.02.2.041.294.062.467.105.852.406,1.056.825ZM5.299,8.076c1.606-1.925,2.164-4.185,1.658-6.723-.03-.15-.123-.271-.247-.325-.036-.016-.081-.028-.132-.028-.054,0-.115.014-.179.054-.849.535-2.38,1.636-3.096,2.995-.756,1.437,1.17,3.314,1.996,4.027Zm-1.903,4.425c.592.014,1.228.096,1.844.287-.086-.682-.129-1.404-.123-2.166.003.006.005.007,0-.009-.759-2.181-2.246-3.534-3.311-4.189-.128-.079-.245-.042-.289-.021-.054.023-.147.084-.173.222-.189,1.009-.424,2.914.127,4.335.279.719,1.282,1.319,1.925,1.542Zm.491,4.907c.676-.389,1.484-.718,2.402-.849-.362-.786-.656-1.665-.859-2.638,0,0,0,0,0,0-1.407-.606-2.955-.45-4.006-.21-.17.039-.308.144-.378.288-.042.085-.076.22-.002.373.465.979,1.332,2.284,2.845,3.036Zm2.71,3.59c.331-.588.775-1.24,1.366-1.878-.425-.467-.822-1.003-1.177-1.608-1.513.105-2.731.887-3.499,1.539-.12.102-.184.248-.176.4.004.086.036.247.202.361.759.524,1.935,1.146,3.285,1.185Zm5.029.385c-.978-.22-2.006-.741-2.949-1.563-.887.965-1.404,1.962-1.689,2.661-.054.132-.011.241.02.295.052.092.141.154.244.17,2.203.336,3.672-.192,4.374-1.563Zm7.512-10.718s0,.002,0,0c.004.731-.037,1.426-.117,2.083.593-.168,1.188-.239,1.754-.248-.005.002-.006.004.008,0,.743-.224,1.72-.817,2.001-1.541.551-1.421.316-3.326.127-4.336-.026-.137-.12-.197-.173-.221-.044-.02-.16-.057-.29.021-1.096.675-2.567,1.975-3.309,4.241Zm-.18-2.59c.828-.715,2.749-2.591,1.994-4.025-.716-1.359-2.248-2.46-3.097-2.995-.063-.04-.124-.054-.178-.054-.051,0-.097.013-.132.028-.125.054-.217.175-.247.325-.231,1.16-.509,4.064,1.661,6.721Zm-1.693,14.406c-.285-.698-.8-1.691-1.681-2.652-.945.824-1.975,1.344-2.954,1.56.703,1.366,2.172,1.887,4.372,1.557.141-.021.213-.115.243-.169.031-.054.074-.164.021-.296Zm3.878-3.028c.008-.152-.057-.299-.176-.4-.247-.21-1.469-1.321-3.489-1.539-.356.608-.754,1.147-1.18,1.616.586.635,1.028,1.284,1.358,1.87,1.35-.039,2.527-.661,3.286-1.185.166-.114.197-.275.202-.361Zm1.938-5.453c-.07-.145-.208-.249-.377-.288-1.016-.229-2.495-.385-3.864.151-.203.998-.5,1.897-.868,2.7.887.127,1.673.441,2.333.813,1.471-.756,2.32-2.036,2.778-3.002.073-.153.039-.288-.002-.373Zm-3.943-3.334h0s.001-.004,0,0Z"/>
    </svg>
  );
}

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
  /** Whether this is a winner (shows trophy icon) */
  isWinner?: boolean;
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
            <span className="text-xs font-medium" style={{ color: net >= 0 ? NET_COLORS.positive.base : NET_COLORS.negative.base }}>
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

  // Curve colors from Intuition design system
  const curveColorHex = titleInfo.curve === 'linear'
    ? CURVE_COLORS.linear.text
    : CURVE_COLORS.progressive.text;

  // Direction colors from Intuition design system
  const directionColorHex = titleInfo.direction === 'for'
    ? SUPPORT_COLORS.base
    : titleInfo.direction === 'against'
      ? OPPOSE_COLORS.base
      : undefined;

  return (
    <span className="flex items-center gap-2">
      {titleInfo.isWinner && <TrophyIcon className="w-4 h-4 text-yellow-400" />}
      <span style={{ color: curveColorHex }}>{titleInfo.label}</span>
      <span className="text-xs" style={{ color: directionColorHex || 'rgba(255,255,255,0.6)' }}>
        {formatTrust(titleInfo.trust)} TRUST
      </span>
    </span>
  );
}

/**
 * Wrapper to adapt CurveSwitch props for TradingChart usage with GooeySwitch
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
  void userPositionCurveId; // Unused for now

  const options = [
    { id: 'progressive', label: 'Progressive' },
    { id: 'linear', label: 'Linear' },
  ];

  return (
    <GooeySwitch
      options={options}
      value={selected}
      onChange={(id) => onChange(id as CurveFilter)}
      columns={2}
      className="w-fit"
      renderOption={(option, isSelected) => (
        <div className="flex items-center justify-center px-0 py-0">
          <span className={`text-sm font-medium leading-none ${isSelected ? 'text-white' : 'text-white/60'}`}>
            {option.label}
          </span>
        </div>
      )}
    />
  );
}

/**
 * Timeframe selector - GooeySwitch
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
    <GooeySwitch
      options={timeframes.map((tf) => ({ id: tf, label: tf }))}
      value={selected}
      onChange={(id) => onChange(id as Timeframe)}
      columns={4}
      className="w-fit"
      renderOption={(option, isSelected) => (
        <div className="flex items-center justify-center px-0 py-0">
          <span className={`text-sm font-medium leading-none ${isSelected ? 'text-white' : 'text-white/60'}`}>
            {option.label}
          </span>
        </div>
      )}
    />
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
