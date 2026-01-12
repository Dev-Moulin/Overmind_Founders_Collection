/**
 * RelationsRadar - Radial graph showing Founder → Totems relations
 *
 * Displays:
 * - Center: Founder (name/image)
 * - Around: Totems positioned radially
 * - Blue zone: FOR votes
 * - Orange zone: AGAINST votes
 * - Distance from center = total TRUST
 * - Tooltip shows predicate on hover
 *
 * @see Phase 10 - Étape 4 in TODO_FIX_01_Discussion.md
 */

import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { TopTotem } from '../../hooks';
import { truncateAmount } from '../../utils/formatters';
import { SUPPORT_COLORS, OPPOSE_COLORS } from '../../config/colors';

interface RelationsRadarProps {
  /** Founder name (displayed at center) */
  founderName: string;
  /** Founder image URL */
  founderImage?: string;
  /** Totems to display around the founder */
  totems: TopTotem[];
  /** Whether data is loading */
  loading?: boolean;
  /** Height of the chart */
  height?: number;
  /** Callback when a totem is clicked */
  onTotemClick?: (totemId: string, totemLabel: string) => void;
}

interface TotemNode {
  id: string;
  label: string;
  image?: string;
  trustFor: number;
  trustAgainst: number;
  totalTrust: number;
  angle: number; // Position angle in radians
  distance: number; // Distance from center (0-1)
  x: number;
  y: number;
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
 * Truncate label for display
 */
function truncateLabel(label: string, maxLength: number = 8): string {
  if (label.length <= maxLength) return label;
  return `${label.slice(0, maxLength - 1)}…`;
}

/**
 * RelationsRadar component - displays founder-totem relationships radially
 */
export function RelationsRadar({
  founderName,
  founderImage,
  totems,
  loading = false,
  height = 280,
  onTotemClick,
}: RelationsRadarProps) {
  const { t } = useTranslation();
  const [hoveredTotem, setHoveredTotem] = useState<string | null>(null);

  // Calculate node positions
  const { nodes, centerX, centerY, radius } = useMemo(() => {
    const cx = 150; // Center X (SVG viewBox is 300x300)
    const cy = 150; // Center Y
    const r = 145; // Max radius for nodes (increased to use more space)

    if (totems.length === 0) {
      return { nodes: [], maxTrust: 1, centerX: cx, centerY: cy, radius: r };
    }

    // Find max trust for scaling
    const trustValues = totems.map((t) => t.totalTrust);
    const max = Math.max(...trustValues, 0.001);

    // Calculate positions for each totem
    // Use sqrt normalization to compress extreme values
    // This makes differences visible without extreme clustering
    const angleStep = (2 * Math.PI) / totems.length;
    const calculatedNodes: TotemNode[] = totems.map((totem, index) => {
      const angle = index * angleStep - Math.PI / 2; // Start from top

      // Normalize with sqrt to compress high values
      // sqrt(value/max) gives ratio ~3:1 instead of 11:1 for values like 0.55 vs 0.05
      const normalizedRatio = totem.totalTrust > 0
        ? Math.sqrt(totem.totalTrust / max)
        : 0.1; // Minimum for totems with no votes

      // Scale to 30%-100% range (more spread than before)
      const distance = normalizedRatio * 0.7 + 0.3;

      return {
        ...totem,
        angle,
        distance,
        x: cx + Math.cos(angle) * r * distance,
        y: cy + Math.sin(angle) * r * distance,
      };
    });

    return {
      nodes: calculatedNodes,
      maxTrust: max,
      centerX: cx,
      centerY: cy,
      radius: r,
    };
  }, [totems]);

  // Generate SVG path for FOR zone (blue)
  const forPath = useMemo(() => {
    if (nodes.length < 3) return '';

    const points = nodes.map((node) => {
      const forRatio = node.totalTrust > 0 ? node.trustFor / node.totalTrust : 0.5;
      const forDistance = node.distance * forRatio;
      return {
        x: centerX + Math.cos(node.angle) * radius * forDistance,
        y: centerY + Math.sin(node.angle) * radius * forDistance,
      };
    });

    return `M ${points[0].x} ${points[0].y} ` +
      points.slice(1).map((p) => `L ${p.x} ${p.y}`).join(' ') +
      ' Z';
  }, [nodes, centerX, centerY, radius]);

  // Generate SVG path for AGAINST zone (orange)
  const againstPath = useMemo(() => {
    if (nodes.length < 3) return '';

    const points = nodes.map((node) => {
      const againstRatio = node.totalTrust > 0 ? node.trustAgainst / node.totalTrust : 0.5;
      const againstDistance = node.distance * againstRatio;
      return {
        x: centerX + Math.cos(node.angle) * radius * againstDistance,
        y: centerY + Math.sin(node.angle) * radius * againstDistance,
      };
    });

    return `M ${points[0].x} ${points[0].y} ` +
      points.slice(1).map((p) => `L ${p.x} ${p.y}`).join(' ') +
      ' Z';
  }, [nodes, centerX, centerY, radius]);

  // Empty state
  if (!loading && totems.length === 0) {
    return (
      <div className="space-y-2">
        <h4 className="text-sm font-medium text-white/70">Vote Graph</h4>
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
                d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
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
        <h4 className="text-sm font-medium text-white/70">Vote Graph</h4>
        <div
          className="flex items-center justify-center bg-white/5 rounded-lg"
          style={{ height }}
        >
          <div className="animate-spin w-6 h-6 border-2 border-slate-500 border-t-transparent rounded-full" />
        </div>
      </div>
    );
  }

  // Hovered totem info
  const hoveredNode = hoveredTotem ? nodes.find((n) => n.id === hoveredTotem) : null;

  return (
    <div className="space-y-2">
      <h4 className="text-sm font-medium text-white/70">Vote Graph</h4>
      <div className="bg-gray-900/30 rounded-lg p-2 relative" style={{ height }}>
        <svg
          viewBox="0 0 300 300"
          className="w-full h-full"
          style={{ maxHeight: height - 16 }}
        >
          {/* Grid circles */}
          {[0.25, 0.5, 0.75, 1].map((scale, index) => (
            <circle
              key={`grid-${index}`}
              cx={centerX}
              cy={centerY}
              r={radius * scale}
              fill="none"
              stroke="#374151"
              strokeOpacity={0.3}
              strokeDasharray="4 4"
            />
          ))}

          {/* Grid lines from center to each totem */}
          {nodes.map((node, index) => (
            <line
              key={`line-${node.id || index}`}
              x1={centerX}
              y1={centerY}
              x2={centerX + Math.cos(node.angle) * radius}
              y2={centerY + Math.sin(node.angle) * radius}
              stroke="#374151"
              strokeOpacity={0.2}
            />
          ))}

          {/* FOR zone - Intuition blue */}
          {forPath && (
            <path
              d={forPath}
              fill={SUPPORT_COLORS.base}
              fillOpacity={0.3}
              stroke={SUPPORT_COLORS.base}
              strokeWidth={2}
              strokeOpacity={0.8}
            />
          )}

          {/* AGAINST zone - Intuition orange */}
          {againstPath && (
            <path
              d={againstPath}
              fill={OPPOSE_COLORS.base}
              fillOpacity={0.3}
              stroke={OPPOSE_COLORS.base}
              strokeWidth={2}
              strokeOpacity={0.8}
            />
          )}

          {/* Clip path definition */}
          <defs>
            <clipPath id="founder-clip">
              <circle cx={centerX} cy={centerY} r={16} />
            </clipPath>
          </defs>

          {/* Center - Founder (smaller avatar) */}
          <g className="cursor-pointer">
            <circle
              cx={centerX}
              cy={centerY}
              r={18}
              fill="#1f2937"
              stroke="#64748b"
              strokeWidth={2}
            />
            {founderImage ? (
              <image
                href={founderImage}
                x={centerX - 16}
                y={centerY - 16}
                width={32}
                height={32}
                clipPath="url(#founder-clip)"
                preserveAspectRatio="xMidYMid slice"
              />
            ) : (
              <text
                x={centerX}
                y={centerY}
                textAnchor="middle"
                dominantBaseline="middle"
                fill="#9ca3af"
                fontSize={10}
                fontWeight="bold"
              >
                {founderName.slice(0, 2).toUpperCase()}
              </text>
            )}
          </g>

          {/* Totem nodes */}
          {nodes.map((node, index) => {
            const isHovered = hoveredTotem === node.id;
            const netScore = node.trustFor - node.trustAgainst;
            const nodeColor = netScore >= 0 ? SUPPORT_COLORS.base : OPPOSE_COLORS.base;

            return (
              <g
                key={node.id || `node-${index}`}
                className="cursor-pointer transition-transform"
                onMouseEnter={() => setHoveredTotem(node.id)}
                onMouseLeave={() => setHoveredTotem(null)}
                onClick={() => onTotemClick?.(node.id, node.label)}
              >
                {/* Node circle */}
                <circle
                  cx={node.x}
                  cy={node.y}
                  r={isHovered ? 18 : 14}
                  fill="#1f2937"
                  stroke={nodeColor}
                  strokeWidth={isHovered ? 3 : 2}
                  className="transition-all duration-200"
                />

                {/* Node label */}
                <text
                  x={node.x}
                  y={node.y + (isHovered ? 28 : 24)}
                  textAnchor="middle"
                  fill="#9ca3af"
                  fontSize={isHovered ? 10 : 9}
                  className="transition-all duration-200"
                >
                  {truncateLabel(node.label)}
                </text>

                {/* Score badge */}
                <text
                  x={node.x}
                  y={node.y + 4}
                  textAnchor="middle"
                  fill={nodeColor}
                  fontSize={8}
                  fontWeight="bold"
                >
                  {netScore >= 0 ? '+' : ''}{formatTrust(netScore)}
                </text>
              </g>
            );
          })}
        </svg>

        {/* Tooltip - Intuition colors */}
        {hoveredNode && (
          <div className="absolute bottom-2 left-2 right-2 bg-gray-900/95 border border-white/10 rounded-lg p-2 shadow-xl">
            <p className="text-sm font-medium text-white mb-1">{hoveredNode.label}</p>
            <div className="flex items-center gap-4 text-xs">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: SUPPORT_COLORS.base }} />
                <span className="text-white/70">FOR:</span>
                <span className="font-medium" style={{ color: SUPPORT_COLORS.base }}>{formatTrust(hoveredNode.trustFor)}</span>
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: OPPOSE_COLORS.base }} />
                <span className="text-white/70">AGAINST:</span>
                <span className="font-medium" style={{ color: OPPOSE_COLORS.base }}>{formatTrust(hoveredNode.trustAgainst)}</span>
              </span>
            </div>
            <p className="text-xs text-white/50 mt-1">
              Predicate: has totem / embodies
            </p>
          </div>
        )}

        {/* Legend - Intuition colors */}
        <div className="absolute top-2 right-2 flex gap-3 text-xs">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: SUPPORT_COLORS.base }} />
            <span className="text-white/50">FOR</span>
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: OPPOSE_COLORS.base }} />
            <span className="text-white/50">AGAINST</span>
          </span>
        </div>
      </div>
    </div>
  );
}
