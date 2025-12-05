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

import { useMemo, useState } from 'react';
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

export type Timeframe = '12H' | '24H' | '7D' | 'All';

export interface VoteDataPoint {
  timestamp: number;
  date: string;
  forVotes: number;
  againstVotes: number;
  netVotes: number;
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
  /** Optional title */
  title?: string;
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
 * Format TRUST value for display
 */
function formatTrust(value: number): string {
  if (value >= 1000) {
    return `${(value / 1000).toFixed(1)}k`;
  }
  if (value >= 1) {
    return value.toFixed(2);
  }
  return value.toFixed(4);
}

/**
 * Custom tooltip component
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

  const forValue = payload.find(p => p.name === 'FOR')?.value || 0;
  const againstValue = payload.find(p => p.name === 'AGAINST')?.value || 0;
  const net = forValue - againstValue;

  return (
    <div className="bg-gray-900/95 border border-white/10 rounded-lg p-3 shadow-xl">
      <p className="text-xs text-white/60 mb-2">{label}</p>
      <div className="space-y-1">
        <div className="flex items-center justify-between gap-4">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-green-500" />
            <span className="text-xs text-white/70">FOR</span>
          </span>
          <span className="text-xs font-medium text-green-400">
            {formatTrust(forValue)} TRUST
          </span>
        </div>
        <div className="flex items-center justify-between gap-4">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-orange-500" />
            <span className="text-xs text-white/70">AGAINST</span>
          </span>
          <span className="text-xs font-medium text-orange-400">
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
 * Timeframe selector buttons
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
    <div className="flex gap-1 bg-white/5 rounded-lg p-0.5">
      {timeframes.map((tf) => (
        <button
          key={tf}
          onClick={() => onChange(tf)}
          className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
            selected === tf
              ? 'bg-slate-500/30 text-slate-300'
              : 'text-white/50 hover:text-white/80 hover:bg-white/5'
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
 */
export function TradingChart({
  data,
  timeframe,
  onTimeframeChange,
  height = 200,
  loading = false,
  title = 'Vote Activity',
}: TradingChartProps) {
  const { t } = useTranslation();

  // Format data for display
  const chartData = useMemo(() => {
    return data.map((point) => ({
      ...point,
      formattedDate: formatXAxis(point.timestamp, timeframe),
    }));
  }, [data, timeframe]);

  // Empty state
  if (!loading && data.length === 0) {
    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-white/70">{title}</h3>
          <TimeframeSelector selected={timeframe} onChange={onTimeframeChange} />
        </div>
        <div
          className="flex items-center justify-center bg-white/5 rounded-lg"
          style={{ height }}
        >
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
                d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z"
              />
            </svg>
            <p className="text-white/40 text-sm">{t('common.noData')}</p>
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
          <h3 className="text-sm font-medium text-white/70">{title}</h3>
          <TimeframeSelector selected={timeframe} onChange={onTimeframeChange} />
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
        <h3 className="text-sm font-medium text-white/70">{title}</h3>
        <TimeframeSelector selected={timeframe} onChange={onTimeframeChange} />
      </div>

      {/* Chart */}
      <div className="bg-gray-900/30 rounded-lg p-2" style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={chartData}
            margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
          >
            <defs>
              {/* Gradient for FOR area */}
              <linearGradient id="gradientFor" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#22c55e" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
              </linearGradient>
              {/* Gradient for AGAINST area */}
              <linearGradient id="gradientAgainst" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#f97316" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
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

            {/* FOR area (green) */}
            <Area
              type="monotone"
              dataKey="forVotes"
              name="FOR"
              stroke="#22c55e"
              strokeWidth={2}
              fill="url(#gradientFor)"
              animationDuration={750}
            />

            {/* AGAINST area (orange) */}
            <Area
              type="monotone"
              dataKey="againstVotes"
              name="AGAINST"
              stroke="#f97316"
              strokeWidth={2}
              fill="url(#gradientAgainst)"
              animationDuration={750}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

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
