/**
 * Centralized Color Configuration
 *
 * Colors based on Intuition's design system:
 * - Support/Oppose states with vote indicators
 * - Linear/Progressive curve colors
 *
 * Usage:
 * - `base` = color without user vote (for strokes, borders, text)
 * - `fill` = color with user vote (for filled areas, backgrounds)
 * - When user has a vote, `base` becomes the glow/border effect
 */

// ============================================
// SUPPORT / FOR COLORS (Blue)
// ============================================
export const SUPPORT_COLORS = {
  /** Bright blue - used for strokes, borders, text when no user position */
  base: '#0073e6',
  /** Dark blue - used for fills when user has a position */
  fill: '#092b4e',
  /** Tailwind equivalent for base */
  tailwind: 'blue-500',
  /** RGB values for gradient stops */
  rgb: '0, 115, 230',
} as const;

// ============================================
// OPPOSE / AGAINST COLORS (Orange)
// ============================================
export const OPPOSE_COLORS = {
  /** Bright orange - used for strokes, borders, text when no user position */
  base: '#ff8000',
  /** Dark brown/orange - used for fills when user has a position */
  fill: '#26190c',
  /** Tailwind equivalent for base */
  tailwind: 'orange-500',
  /** RGB values for gradient stops */
  rgb: '255, 128, 0',
} as const;

// ============================================
// CURVE COLORS (Linear / Progressive)
// Subtle variation - same hue family, slight difference
// Linear = slightly cooler/lighter, Progressive = slightly warmer/darker
// ============================================
export const CURVE_COLORS = {
  linear: {
    /** Cool slate for Linear curve */
    base: '#94a3b8',     // slate-400 - légèrement plus clair/froid
    fill: '#64748b',     // slate-500
    text: '#cbd5e1',     // slate-300 for text
    tailwind: 'slate-400',
  },
  progressive: {
    /** Warm slate for Progressive curve - slightly darker/warmer */
    base: '#78716c',     // stone-500 - légèrement plus sombre/chaud
    fill: '#57534e',     // stone-600
    text: '#a8a29e',     // stone-400 for text
    tailwind: 'stone-500',
  },
} as const;

// ============================================
// NET RESULT COLORS (Positive / Negative)
// ============================================
export const NET_COLORS = {
  positive: {
    base: '#22c55e',
    tailwind: 'green-500',
  },
  negative: {
    base: '#ef4444',
    tailwind: 'red-500',
  },
} as const;

// ============================================
// SEMANTIC COLOR CLASSES
// ============================================

/**
 * Get Tailwind classes for Support/Oppose text
 */
export const getDirectionTextClass = (direction: 'for' | 'against' | 'support' | 'oppose'): string => {
  const isSupport = direction === 'for' || direction === 'support';
  return isSupport ? 'text-[#0073e6]' : 'text-[#ff8000]';
};

/**
 * Get Tailwind classes for Support/Oppose background (with glow)
 */
export const getDirectionBgClass = (direction: 'for' | 'against' | 'support' | 'oppose', hasPosition: boolean): string => {
  const isSupport = direction === 'for' || direction === 'support';

  if (hasPosition) {
    // With position: dark fill with bright border glow
    return isSupport
      ? 'bg-[#092b4e] border-[#0073e6] shadow-[0_0_8px_rgba(0,115,230,0.5)]'
      : 'bg-[#26190c] border-[#ff8000] shadow-[0_0_8px_rgba(255,128,0,0.5)]';
  }

  // Without position: transparent with colored border
  return isSupport
    ? 'border-[#0073e6]/50 hover:border-[#0073e6]'
    : 'border-[#ff8000]/50 hover:border-[#ff8000]';
};

/**
 * Get dot/bullet color class
 */
export const getDotColorClass = (direction: 'for' | 'against' | 'support' | 'oppose'): string => {
  const isSupport = direction === 'for' || direction === 'support';
  return isSupport ? 'bg-[#0073e6]' : 'bg-[#ff8000]';
};

// ============================================
// CHART GRADIENT DEFINITIONS (for SVG defs)
// ============================================

/**
 * Get gradient definition for recharts Area/Radar charts
 */
export const getChartGradient = (type: 'support' | 'oppose', hasPosition: boolean = false) => {
  const colors = type === 'support' ? SUPPORT_COLORS : OPPOSE_COLORS;
  const fillColor = hasPosition ? colors.fill : colors.base;

  return {
    id: `gradient${type === 'support' ? 'For' : 'Against'}`,
    stops: [
      { offset: '5%', color: fillColor, opacity: hasPosition ? 0.6 : 0.4 },
      { offset: '95%', color: fillColor, opacity: 0 },
    ],
  };
};

// ============================================
// LEGACY MAPPINGS (for gradual migration)
// ============================================

/** Map old green to new Support blue */
export const LEGACY_FOR_COLOR = '#22c55e'; // Was green-500

/** Map old orange to new Oppose orange */
export const LEGACY_AGAINST_COLOR = '#f97316'; // Was orange-500

// ============================================
// COLOR EXPORT FOR INLINE STYLES
// ============================================

export const COLORS = {
  support: SUPPORT_COLORS,
  oppose: OPPOSE_COLORS,
  curve: CURVE_COLORS,
  net: NET_COLORS,
} as const;

export default COLORS;
