import { memo, useState, useRef, useCallback } from 'react';
import type { FounderForHomePage } from '../../../types/founder';
import { getFounderImageUrl } from '../../../utils/founderImage';

interface FounderDockItemProps {
  founder: FounderForHomePage;
  onSelect: (founderId: string) => void;
}

/**
 * Photo fondateur inline dans la barre, avec morph vers mini-card.
 * - Par defaut : photo circulaire avec magnification dock (--s)
 * - Apres 300ms hover : la photo s'ouvre en mini-card (nom, votes, badge NEW)
 * - Clic : naviguer vers le fondateur dans le carrousel
 */
export const FounderDockItem = memo(function FounderDockItem({
  founder,
  onSelect,
}: FounderDockItemProps) {
  const [expanded, setExpanded] = useState(false);
  const hoverTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleMouseEnter = useCallback(() => {
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    hoverTimeoutRef.current = setTimeout(() => {
      setExpanded(true);
    }, 400);
  }, []);

  const handleMouseLeave = useCallback(() => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }
    hoverTimeoutRef.current = setTimeout(() => {
      setExpanded(false);
      hoverTimeoutRef.current = null;
    }, 500);
  }, []);

  return (
    <div
      className={`dock-item dock-photo-item ${expanded ? 'expanded' : ''}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={() => onSelect(founder.id)}
    >
      <img
        src={getFounderImageUrl(founder)}
        alt={founder.name}
        onError={(e) => {
          (e.target as HTMLImageElement).src = `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(founder.name)}`;
        }}
      />
      <div className="dock-photo-info">
        <div className="photo-name">{founder.name}</div>
        <div className="photo-stats">
          <span>{founder.proposalCount} votes</span>
          {founder.recentActivityCount > 0 && (
            <span className="photo-badge">NEW +{founder.recentActivityCount}</span>
          )}
        </div>
      </div>
    </div>
  );
});
