/**
 * TopTotemsRadar - Radar chart showing top totems FOR vs AGAINST
 *
 * Displays a radar/spider chart with:
 * - Each axis = one totem
 * - Blue area = FOR votes
 * - Orange area = AGAINST votes
 *
 * Uses recharts RadarChart component
 *
 * @see Phase 10 - Étape 3 in TODO_FIX_01_Discussion.md
 */

import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from 'recharts';
import type { TopTotem } from '../../hooks';

interface TopTotemsRadarProps {
  /** Top totems data */
  totems: TopTotem[];
  /** Whether data is loading */
  loading?: boolean;
  /** Optional click handler for totem selection */
  onTotemClick?: (totemId: string, totemLabel: string) => void;
  /** Height of the chart */
  height?: number;
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
  if (value >= 0.001) {
    return value.toFixed(4);
  }
  return '0';
}

/**
 * Truncate label for radar axis
 */
function truncateLabel(label: string, maxLength: number = 10): string {
  if (label.length <= maxLength) return label;
  return `${label.slice(0, maxLength - 1)}…`;
}

/**
 * Custom tooltip for radar chart
 */
function CustomTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{
    value: number;
    name: string;
    payload: { totem: string; for: number; against: number; fullLabel: string };
  }>;
}) {
  if (!active || !payload || payload.length === 0) return null;

  const data = payload[0]?.payload;
  if (!data) return null;

  const net = data.for - data.against;

  return (
    <div className="bg-gray-900/95 border border-white/10 rounded-lg p-3 shadow-xl">
      <p className="text-sm font-medium text-white mb-2">{data.fullLabel}</p>
      <div className="space-y-1">
        <div className="flex items-center justify-between gap-4">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-blue-500" />
            <span className="text-xs text-white/70">FOR</span>
          </span>
          <span className="text-xs font-medium text-blue-400">
            {formatTrust(data.for)} TRUST
          </span>
        </div>
        <div className="flex items-center justify-between gap-4">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-orange-500" />
            <span className="text-xs text-white/70">AGAINST</span>
          </span>
          <span className="text-xs font-medium text-orange-400">
            {formatTrust(data.against)} TRUST
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
 * Radar chart component for top totems visualization
 */
export function TopTotemsRadar({
  totems,
  loading = false,
  onTotemClick,
  height = 250,
}: TopTotemsRadarProps) {
  const { t } = useTranslation();

  // Transform data for recharts
  const chartData = useMemo(() => {
    return totems.map((totem) => ({
      totem: truncateLabel(totem.label),
      fullLabel: totem.label,
      totemId: totem.id,
      for: totem.trustFor,
      against: totem.trustAgainst,
    }));
  }, [totems]);

  // Calculate max value for scale
  const maxValue = useMemo(() => {
    if (totems.length === 0) return 1;
    const max = Math.max(...totems.map((t) => Math.max(t.trustFor, t.trustAgainst)));
    return max > 0 ? max * 1.1 : 1; // Add 10% padding
  }, [totems]);

  // Empty state
  if (!loading && totems.length === 0) {
    return (
      <div className="space-y-2">
        <h4 className="text-sm font-medium text-white/70">Top Totems</h4>
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
      </div>
    );
  }

  // Loading state
  if (loading) {
    return (
      <div className="space-y-2">
        <h4 className="text-sm font-medium text-white/70">Top Totems</h4>
        <div
          className="flex items-center justify-center bg-white/5 rounded-lg"
          style={{ height }}
        >
          <div className="animate-spin w-6 h-6 border-2 border-slate-500 border-t-transparent rounded-full" />
        </div>
      </div>
    );
  }

  // Need at least 3 points for a proper radar
  if (totems.length < 3) {
    return (
      <div className="space-y-2">
        <h4 className="text-sm font-medium text-white/70">Top Totems</h4>
        <div className="bg-white/5 rounded-lg p-3" style={{ minHeight: height }}>
          <div className="space-y-2">
            {totems.map((totem, index) => (
              <div
                key={totem.id || `totem-${index}`}
                className="flex items-center justify-between p-2 bg-white/5 rounded cursor-pointer hover:bg-white/10 transition-colors"
                onClick={() => onTotemClick?.(totem.id, totem.label)}
              >
                <span className="text-sm text-white truncate">{totem.label}</span>
                <div className="flex gap-2 text-xs">
                  <span className="text-blue-400">+{formatTrust(totem.trustFor)}</span>
                  <span className="text-orange-400">-{formatTrust(totem.trustAgainst)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <h4 className="text-sm font-medium text-white/70">Top Totems</h4>
      <div className="bg-gray-900/30 rounded-lg" style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart
            data={chartData}
            margin={{ top: 20, right: 30, bottom: 20, left: 30 }}
          >
            <PolarGrid
              stroke="#374151"
              strokeOpacity={0.5}
            />
            <PolarAngleAxis
              dataKey="totem"
              tick={{
                fill: '#9ca3af',
                fontSize: 11,
              }}
            />
            <PolarRadiusAxis
              angle={90}
              domain={[0, maxValue]}
              tick={{ fill: '#6b7280', fontSize: 9 }}
              tickFormatter={(value) => formatTrust(value)}
              axisLine={false}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              verticalAlign="bottom"
              height={24}
              formatter={(value) => (
                <span className="text-xs text-white/60">{value}</span>
              )}
            />

            {/* FOR area (blue) */}
            <Radar
              name="FOR"
              dataKey="for"
              stroke="#3b82f6"
              strokeWidth={2}
              fill="#3b82f6"
              fillOpacity={0.3}
              animationDuration={750}
            />

            {/* AGAINST area (orange) */}
            <Radar
              name="AGAINST"
              dataKey="against"
              stroke="#f97316"
              strokeWidth={2}
              fill="#f97316"
              fillOpacity={0.3}
              animationDuration={750}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

/**
 * TopTotemsRadar with data fetching
 */
export { useTopTotems } from '../../hooks';
