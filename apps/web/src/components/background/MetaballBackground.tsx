/**
 * MetaballBackground - Animated blob background with gooey merge effect
 *
 * Creates blobs that float randomly. Same-color blobs merge (metaball effect),
 * different-color blobs repel each other (support vs oppose).
 *
 * Colors: Support (blue) and Oppose (orange) from the design system
 */

import { useEffect, useRef, useState } from 'react';
import { SUPPORT_COLORS, OPPOSE_COLORS } from '../../config/colors';

interface Blob {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: 'support' | 'oppose';
}

interface MetaballBackgroundProps {
  className?: string;
  blobCount?: number;
  /** Respect user's reduced motion preference */
  respectReducedMotion?: boolean;
}

// Generate random value in range
const random = (min: number, max: number) => Math.random() * (max - min) + min;

// Generate initial blobs - ensure good distribution of colors
const createBlobs = (count: number, width: number, height: number): Blob[] => {
  const blobs: Blob[] = [];

  // Ensure at least 2 of each color (half support, half oppose)
  const supportCount = Math.ceil(count / 2);

  for (let i = 0; i < count; i++) {
    const color = i < supportCount ? 'support' : 'oppose';
    blobs.push({
      id: i,
      x: random(0.2 * width, 0.8 * width),
      y: random(0.2 * height, 0.8 * height),
      vx: random(-0.4, 0.4),
      vy: random(-0.4, 0.4),
      radius: random(120, 250),
      color,
    });
  }

  return blobs;
};

// Calculate repulsion force between two blobs of different colors
const getRepulsionForce = (blob: Blob, other: Blob, repulsionStrength: number = 0.15) => {
  const dx = blob.x - other.x;
  const dy = blob.y - other.y;
  const dist = Math.sqrt(dx * dx + dy * dy);
  const minDist = blob.radius + other.radius;

  // Only repel if within interaction range
  if (dist < minDist * 1.5 && dist > 0) {
    const force = repulsionStrength * (1 - dist / (minDist * 1.5));
    return {
      fx: (dx / dist) * force,
      fy: (dy / dist) * force,
    };
  }
  return { fx: 0, fy: 0 };
};

export function MetaballBackground({
  className = '',
  blobCount = 5,
  respectReducedMotion = true,
}: MetaballBackgroundProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [blobs, setBlobs] = useState<Blob[]>([]);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const animationRef = useRef<number | undefined>(undefined);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  // Check for reduced motion preference
  useEffect(() => {
    if (!respectReducedMotion) return;

    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);

    const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, [respectReducedMotion]);

  // Initialize dimensions and blobs
  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const { width, height } = containerRef.current.getBoundingClientRect();
        setDimensions({ width, height });
        setBlobs(createBlobs(blobCount, width, height));
      }
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, [blobCount]);

  // Animation loop
  useEffect(() => {
    if (prefersReducedMotion || blobs.length === 0 || dimensions.width === 0) return;

    const animate = () => {
      setBlobs(prevBlobs =>
        prevBlobs.map((blob, index) => {
          let { x, y, vx, vy, radius } = blob;

          // Calculate repulsion from blobs of different color
          let repulsionX = 0;
          let repulsionY = 0;

          for (let i = 0; i < prevBlobs.length; i++) {
            if (i !== index && prevBlobs[i].color !== blob.color) {
              const { fx, fy } = getRepulsionForce(blob, prevBlobs[i]);
              repulsionX += fx;
              repulsionY += fy;
            }
          }

          // Apply repulsion to velocity
          vx += repulsionX;
          vy += repulsionY;

          // Update position
          x += vx;
          y += vy;

          // Bounce off edges with padding
          const padding = radius * 0.5;
          if (x < padding || x > dimensions.width - padding) {
            vx = -vx * 0.9;
            x = Math.max(padding, Math.min(dimensions.width - padding, x));
          }
          if (y < padding || y > dimensions.height - padding) {
            vy = -vy * 0.9;
            y = Math.max(padding, Math.min(dimensions.height - padding, y));
          }

          // Add slight random drift for organic movement
          vx += random(-0.01, 0.01);
          vy += random(-0.01, 0.01);

          // Clamp velocity
          const maxVel = 0.8;
          vx = Math.max(-maxVel, Math.min(maxVel, vx));
          vy = Math.max(-maxVel, Math.min(maxVel, vy));

          return { ...blob, x, y, vx, vy };
        })
      );

      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [blobs.length, dimensions, prefersReducedMotion]);

  // Get color values
  const getColor = (type: 'support' | 'oppose') => {
    if (type === 'support') {
      return SUPPORT_COLORS.base; // #0073e6
    }
    return OPPOSE_COLORS.base; // #ff8000
  };

  const getDarkColor = (type: 'support' | 'oppose') => {
    if (type === 'support') {
      return SUPPORT_COLORS.fill; // #092b4e
    }
    return OPPOSE_COLORS.fill; // #26190c
  };

  return (
    <div
      ref={containerRef}
      className={`fixed inset-0 overflow-hidden pointer-events-none ${className}`}
      style={{ backgroundColor: '#0f172a' }}
    >
      {/* SVG Filters for gooey merge effect */}
      <svg className="absolute w-0 h-0">
        <defs>
          {/* Filter for Support (blue) blobs - gooey merge effect */}
          <filter id="gooey-support" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="40" result="blur" />
            <feColorMatrix
              in="blur"
              mode="matrix"
              values="1 0 0 0 0
                      0 1 0 0 0
                      0 0 1 0 0
                      0 0 0 25 -10"
              result="gooey"
            />
            <feComposite in="SourceGraphic" in2="gooey" operator="atop" />
          </filter>
          {/* Filter for Oppose (orange) blobs - gooey merge effect */}
          <filter id="gooey-oppose" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="40" result="blur" />
            <feColorMatrix
              in="blur"
              mode="matrix"
              values="1 0 0 0 0
                      0 1 0 0 0
                      0 0 1 0 0
                      0 0 0 25 -10"
              result="gooey"
            />
            <feComposite in="SourceGraphic" in2="gooey" operator="atop" />
          </filter>
        </defs>
      </svg>

      {/* Support blobs (blue) - separate container with own filter */}
      <div
        className="absolute inset-0"
        style={{ filter: 'url(#gooey-support)' }}
      >
        {blobs.filter(b => b.color === 'support').map(blob => (
          <div
            key={blob.id}
            className="absolute rounded-full transition-none"
            style={{
              width: blob.radius * 2,
              height: blob.radius * 2,
              left: blob.x - blob.radius,
              top: blob.y - blob.radius,
              background: `radial-gradient(circle at 30% 30%, ${getColor(blob.color)}, ${getDarkColor(blob.color)})`,
              opacity: 0.6,
            }}
          />
        ))}
      </div>

      {/* Oppose blobs (orange) - separate container with own filter */}
      <div
        className="absolute inset-0"
        style={{ filter: 'url(#gooey-oppose)' }}
      >
        {blobs.filter(b => b.color === 'oppose').map(blob => (
          <div
            key={blob.id}
            className="absolute rounded-full transition-none"
            style={{
              width: blob.radius * 2,
              height: blob.radius * 2,
              left: blob.x - blob.radius,
              top: blob.y - blob.radius,
              background: `radial-gradient(circle at 30% 30%, ${getColor(blob.color)}, ${getDarkColor(blob.color)})`,
              opacity: 0.6,
            }}
          />
        ))}
      </div>

      {/* Subtle glow overlay */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at center, transparent 0%, #0f172a 70%)',
        }}
      />
    </div>
  );
}

export default MetaballBackground;
