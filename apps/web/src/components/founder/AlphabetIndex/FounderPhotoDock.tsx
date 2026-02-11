import { memo, useState, useRef, useCallback } from 'react';
import type { FounderForHomePage } from '../../../types/founder';
import { getFounderImageUrl } from '../../../utils/founderImage';
import { FounderMiniCard } from './FounderMiniCard';

interface FounderPhotoDockProps {
  founders: FounderForHomePage[];
  onSelectFounder: (founderId: string) => void;
}

/**
 * Niveau 2 — Photos circulaires avec effet dock magnification.
 * Hover prolonge (~300ms) sur une photo → affiche la mini-card (Niveau 3).
 */
export const FounderPhotoDock = memo(function FounderPhotoDock({
  founders,
  onSelectFounder,
}: FounderPhotoDockProps) {
  const [hoveredFounderId, setHoveredFounderId] = useState<string | null>(null);
  const hoverTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handlePhotoEnter = useCallback((founderId: string) => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }
    hoverTimeoutRef.current = setTimeout(() => {
      setHoveredFounderId(founderId);
    }, 300);
  }, []);

  const handlePhotoLeave = useCallback(() => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }
    setHoveredFounderId(null);
  }, []);

  return (
    <div className="founder-photo-dock">
      {founders.map((founder) => (
          <div
            key={founder.id}
            className="dock-item"
            onMouseEnter={() => handlePhotoEnter(founder.id)}
            onMouseLeave={handlePhotoLeave}
            onClick={() => onSelectFounder(founder.id)}
          >
            <img
              src={getFounderImageUrl(founder)}
              alt={founder.name}
              onError={(e) => {
                (e.target as HTMLImageElement).src = `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(founder.name)}`;
              }}
            />
            {hoveredFounderId === founder.id && (
              <FounderMiniCard founder={founder} />
            )}
          </div>
        ))}
    </div>
  );
});
