/**
 * CurveSwitch - Animated toggle switch for curve selection
 *
 * Based on Figma design with:
 * - Track: solid color background
 * - Thumb (Bull): Glass/water drop effect - semi-transparent with reflections
 * - Animation: thumb STRETCHES symmetrically during transition
 *
 * Figma specs:
 * - Thumb ~66% of track width
 * - Glass effect with inner shadows + drop shadows
 * - Stretch animation during P↔L transition
 */

import { useCallback, useState, useEffect, useRef } from 'react';
import { CURVE_COLORS } from '../../config/colors';

export interface CurveSwitchProps {
  /** Whether Linear mode is active (false = Progressive) */
  isLinear: boolean;
  /** Callback when switch is toggled */
  onChange: (isLinear: boolean) => void;
  /** Whether user has a position on the linear curve (visual highlight) */
  hasLinearPosition?: boolean;
  /** Whether user has a position on the progressive curve (visual highlight) */
  hasProgressivePosition?: boolean;
  /** Size variant */
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'xxl';
  /** Optional className for the container */
  className?: string;
  /** Whether the switch is disabled */
  disabled?: boolean;
}

/**
 * Animation phases (matching Figma variants)
 * Phase 1: Progressive position (thumb left, normal size)
 * Phase 2: Transition (thumb stretched, center-left)
 * Phase 3: Transition (thumb stretched, center-right)
 * Phase 4: Linear position (thumb right, normal size)
 */
type AnimationPhase = 1 | 2 | 3 | 4;

/**
 * Animated curve toggle switch with glass effect
 */
export function CurveSwitch({
  isLinear,
  onChange,
  hasLinearPosition: _hLP = false,
  hasProgressivePosition: _hPP = false,
  size = 'sm',
  className = '',
  disabled = false,
}: CurveSwitchProps) {
  void _hLP; void _hPP; // Suppress TS6133

  // Animation state
  const [phase, setPhase] = useState<AnimationPhase>(isLinear ? 4 : 1);
  const animating = useRef(false);
  const targetIsLinear = useRef(isLinear);

  // Sync with external isLinear changes
  useEffect(() => {
    if (isLinear !== targetIsLinear.current && !animating.current) {
      targetIsLinear.current = isLinear;
      setPhase(isLinear ? 4 : 1);
    }
  }, [isLinear]);

  // Animate through phases
  useEffect(() => {
    if (!animating.current) return;

    const targetPhase = targetIsLinear.current ? 4 : 1;
    if (phase === targetPhase) {
      animating.current = false;
      return;
    }

    // 250ms per transition (équilibré)
    const timer = setTimeout(() => {
      if (targetIsLinear.current) {
        setPhase((p) => Math.min(p + 1, 4) as AnimationPhase);
      } else {
        setPhase((p) => Math.max(p - 1, 1) as AnimationPhase);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [phase]);

  const toggle = useCallback(() => {
    if (disabled || animating.current) return;

    animating.current = true;
    targetIsLinear.current = !isLinear;
    onChange(!isLinear);

    if (!isLinear) {
      setPhase(2);
    } else {
      setPhase(3);
    }
  }, [isLinear, onChange, disabled]);

  // Size configurations
  // Thumb = ~66% of track width at rest
  // Figma: thumb scaled (1094) / track (966) = 1.133
  // But thumb is smaller than track, so we need higher scale to overflow
  // thumbHeight * SCALE_FACTOR > trackHeight => overflow modéré
  // Entre-deux : 1.6 (ni trop petit 1.4, ni trop grand 1.8)
  const SCALE_FACTOR = 1.6;

  // Tailles pour le switch
  // Track width réduit de 20%
  const sizeConfig = {
    sm: {
      track: { width: 88, height: 24, borderRadius: 12 }, // -20% largeur
      thumb: { width: 57, height: 20 },
      padding: 2,
      fontSize: 8,
      thumbFontSize: 10,
    },
    md: {
      track: { width: 112, height: 30, borderRadius: 15 }, // -20% largeur
      thumb: { width: 73, height: 26 },
      padding: 3,
      fontSize: 10,
      thumbFontSize: 12,
    },
    lg: {
      track: { width: 136, height: 38, borderRadius: 19 }, // -20% largeur
      thumb: { width: 89, height: 34 },
      padding: 4,
      fontSize: 12,
      thumbFontSize: 14,
    },
    // 3x bigger than sm - for testing/preview
    xl: {
      track: { width: 264, height: 72, borderRadius: 36 }, // -20% largeur
      thumb: { width: 170, height: 60 },
      padding: 6,
      fontSize: 20,
      thumbFontSize: 24,
    },
    // 5x bigger than sm - for large preview
    xxl: {
      track: { width: 440, height: 120, borderRadius: 60 }, // -20% largeur
      thumb: { width: 284, height: 100 },
      padding: 10,
      fontSize: 32,
      thumbFontSize: 38,
    },
  };

  const config = sizeConfig[size];

  // Thumb always has the same base size, scale is applied via transform
  const thumbWidth = config.thumb.width;
  const thumbHeight = config.thumb.height;

  // Scale factor for phases 2 and 3 (thumb grows and overflows track)
  const isStretched = phase === 2 || phase === 3;
  const thumbScale = isStretched ? SCALE_FACTOR : 1;

  // Calculate overflow amount (how much thumb exceeds track when scaled)
  // thumbHeight * SCALE_FACTOR - trackHeight = overflow total
  // overflow per side = overflow / 2
  const overflowPerSide = (thumbHeight * SCALE_FACTOR - config.track.height) / 2;
  // Rectangle_4 = track size minus overflow (internal margin)
  const rect4Padding = Math.max(overflowPerSide, 0);

  // Calculate thumb position
  const getThumbX = () => {
    const leftPos = config.padding;
    const rightPos = config.track.width - thumbWidth - config.padding;
    const centerPos = (config.track.width - thumbWidth) / 2;

    switch (phase) {
      case 1: return leftPos; // Left position
      case 2: return leftPos + (centerPos - leftPos) * 0.3; // Slightly toward center
      case 3: return rightPos - (rightPos - centerPos) * 0.3; // Slightly toward center from right
      case 4: return rightPos; // Right position
    }
  };

  const thumbX = getThumbX();
  const thumbY = (config.track.height - thumbHeight) / 2;

  // Track color - Figma specs: D9D9D9 (gray) for Progressive, 11FF00 (green) for Linear
  const isInLinearZone = phase >= 3;
  const trackColor = isInLinearZone
    ? 'rgba(17, 255, 0, 0.8)' // Green #11FF00 for Linear
    : 'rgba(217, 217, 217, 0.8)'; // Gray #D9D9D9 for Progressive

  // Glass/Water drop effect for thumb - subtle shadows
  const scale = config.track.height / 120; // Scale factor based on xxl size
  const thumbShadow = `
    inset 0 ${Math.round(2 * scale)}px ${Math.round(1 * scale)}px rgba(255, 255, 255, 0.2),
    inset 0 ${Math.round(-2 * scale)}px ${Math.round(6 * scale)}px rgba(0, 0, 0, 0.15),
    0 ${Math.round(2 * scale)}px ${Math.round(3 * scale)}px rgba(0, 0, 0, 0.1),
    0 ${Math.round(3 * scale)}px ${Math.round(5 * scale)}px rgba(0, 0, 0, 0.08)
  `;

  // Animation: cubic-bezier fluide pour transitions smooth
  // ease-out-quart pour mouvement naturel et rapide
  const easing = 'cubic-bezier(0.25, 0.46, 0.45, 0.94)';

  const thumbRadius = thumbHeight / 2;

  return (
    <button
      onClick={toggle}
      disabled={disabled}
      className={`
        relative transition-colors duration-200
        focus:outline-none focus:ring-0
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        ${className}
      `.trim().replace(/\s+/g, ' ')}
      style={{
        width: config.track.width,
        height: config.track.height,
        borderRadius: config.track.borderRadius,
        backgroundColor: trackColor,
        border: '1px solid rgba(255, 255, 255, 0.2)',
        outline: 'none',
        overflow: 'visible', // Allow thumb to overflow during scale
      }}
      title={isLinear ? 'Linear (clic pour Progressive)' : 'Progressive (clic pour Linear)'}
      aria-label={isLinear ? 'Switch to Progressive curve' : 'Switch to Linear curve'}
      role="switch"
      aria-checked={isLinear}
    >
      {/* Labels P and L */}
      <span
        className={`
          absolute font-bold transition-opacity duration-200
          ${phase <= 2 ? 'opacity-80' : 'opacity-30'}
        `}
        style={{
          left: config.padding + 2,
          top: '50%',
          transform: 'translateY(-50%)',
          color: 'white',
          fontSize: config.fontSize,
        }}
      >
        P
      </span>
      <span
        className={`
          absolute font-bold transition-opacity duration-200
          ${phase >= 3 ? 'opacity-80' : 'opacity-30'}
        `}
        style={{
          right: config.padding + 2,
          top: '50%',
          transform: 'translateY(-50%)',
          color: 'white',
          fontSize: config.fontSize,
        }}
      >
        L
      </span>

      {/* Thumb (Bull_Glass_1) - Glass/Water drop effect - EN DESSOUS */}
      <span
        className="absolute"
        style={{
          width: thumbWidth,
          height: thumbHeight,
          left: thumbX,
          top: thumbY,
          borderRadius: thumbRadius,
          // Semi-transparent white for glass effect
          backgroundColor: 'rgba(255, 255, 255, 0.85)',
          boxShadow: thumbShadow,
          // Add slight blur for frosted glass effect
          backdropFilter: 'blur(2px)',
          // Scale transform for phases 2 and 3 (thumb overflows track)
          transform: `scale(${thumbScale})`,
          // S'assurer que le scale part du centre exact
          transformOrigin: 'center center',
          // 250ms transition fluide
          transition: `all 250ms ${easing}`,
        }}
      >
        {/* Top highlight - strong reflection */}
        <span
          className="absolute rounded-[inherit] overflow-hidden"
          style={{
            top: 2,
            left: '10%',
            right: '10%',
            height: '40%',
            background: 'linear-gradient(180deg, rgba(255,255,255,0.8) 0%, rgba(255,255,255,0.2) 50%, rgba(255,255,255,0) 100%)',
            borderRadius: thumbRadius,
          }}
        />
        {/* Bottom subtle shadow */}
        <span
          className="absolute rounded-[inherit]"
          style={{
            bottom: 2,
            left: '15%',
            right: '15%',
            height: '20%',
            background: 'linear-gradient(0deg, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0) 100%)',
            borderRadius: thumbRadius / 2,
          }}
        />
        {/* Texte Linear / Progressive dans le thumb */}
        <span
          className="absolute inset-0 flex items-center justify-center font-bold select-none"
          style={{
            fontSize: config.thumbFontSize,
            color: 'rgba(0, 0, 0, 0.85)',
            letterSpacing: '0.02em',
          }}
        >
          {isLinear ? 'Linear' : 'Progressive'}
        </span>
      </span>

      {/* Mask Group: Rectangle_4 + Bull_2 - AU DESSUS pour masquer le thumb */}
      {/* Rectangle_4 clip Bull_2 à sa forme, Bull_2 montre la couleur du track */}
      <span
        className="absolute"
        style={{
          // Position: centré avec rect4Padding de marge de chaque côté
          top: rect4Padding,
          left: rect4Padding,
          right: rect4Padding,
          bottom: rect4Padding,
          borderRadius: config.track.borderRadius - rect4Padding,
          // Rectangle_4 est TRANSPARENT - juste un conteneur de clip
          backgroundColor: 'transparent',
          // Clip Bull_2 à cette forme
          overflow: 'hidden',
          // Visible seulement pendant les phases stretched (mask group actif)
          opacity: isStretched ? 1 : 0,
          transition: `opacity 250ms ${easing}`,
        }}
      >
        {/* Bull_2 - Montre la couleur du track dans la forme du thumb, clippé à Rectangle_4 */}
        {/* Ceci crée l'effet "fenêtre" montrant la couleur du track à travers le thumb */}
        <span
          className="absolute"
          style={{
            // Position relative à Rectangle_4 (soustraire rect4Padding de la position du thumb)
            width: thumbWidth,
            height: thumbHeight,
            left: thumbX - rect4Padding,
            top: thumbY - rect4Padding,
            borderRadius: thumbRadius,
            // Bull_2 montre la couleur du track - visible AU DESSUS de Bull_Glass_1
            backgroundColor: trackColor,
            // Appliquer le même scale que le thumb
            transform: `scale(${thumbScale})`,
            // S'assurer que le scale part du centre exact (comme Bull_Glass_1)
            transformOrigin: 'center center',
            transition: `all 250ms ${easing}`,
          }}
        />
      </span>
    </button>
  );
}

/**
 * CurveSwitch with extended "All" option
 */
export interface CurveSwitchExtendedProps {
  filter: 'progressive' | 'linear' | 'all';
  onChange: (filter: 'progressive' | 'linear' | 'all') => void;
  hasLinearPosition?: boolean;
  hasProgressivePosition?: boolean;
  size?: 'sm' | 'md';
  className?: string;
}

export function CurveSwitchExtended({
  filter,
  onChange,
  hasLinearPosition = false,
  hasProgressivePosition = false,
  size = 'sm',
  className = '',
}: CurveSwitchExtendedProps) {
  const sizeConfig = {
    sm: { button: 'px-2 py-1 text-[10px]' },
    md: { button: 'px-3 py-1.5 text-xs' },
  };

  const config = sizeConfig[size];

  // Subtle curve colors - slate for Linear (cooler), stone for Progressive (warmer)
  return (
    <div className={`flex bg-white/5 rounded-lg p-0.5 ${className}`}>
      <button
        onClick={() => onChange('progressive')}
        className={`${config.button} rounded-md transition-colors`}
        style={{
          backgroundColor: filter === 'progressive' ? `${CURVE_COLORS.progressive.base}30` : hasProgressivePosition ? `${CURVE_COLORS.progressive.base}15` : undefined,
          color: filter === 'progressive' ? CURVE_COLORS.progressive.text : hasProgressivePosition ? `${CURVE_COLORS.progressive.text}B0` : undefined,
          boxShadow: hasProgressivePosition ? `0 0 0 1px ${CURVE_COLORS.progressive.base}50` : undefined,
        }}
      >
        Prog
      </button>
      <button
        onClick={() => onChange('linear')}
        className={`${config.button} rounded-md transition-colors`}
        style={{
          backgroundColor: filter === 'linear' ? `${CURVE_COLORS.linear.base}30` : hasLinearPosition ? `${CURVE_COLORS.linear.base}15` : undefined,
          color: filter === 'linear' ? CURVE_COLORS.linear.text : hasLinearPosition ? `${CURVE_COLORS.linear.text}B0` : undefined,
          boxShadow: hasLinearPosition ? `0 0 0 1px ${CURVE_COLORS.linear.base}50` : undefined,
        }}
      >
        Lin
      </button>
      <button
        onClick={() => onChange('all')}
        className={`
          ${config.button} rounded-md transition-colors
          ${filter === 'all'
            ? 'bg-white/20 text-white'
            : 'text-white/50 hover:text-white/70'
          }
        `}
      >
        All
      </button>
    </div>
  );
}
