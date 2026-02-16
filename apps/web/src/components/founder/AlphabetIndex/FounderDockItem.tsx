import { memo } from 'react';
import type { FounderForHomePage } from '../../../types/founder';
import { getFounderImageUrl } from '../../../utils/founderImage';

interface FounderDockItemProps {
  founder: FounderForHomePage;
  expanded: boolean;
  onSelect: (founderId: string) => void;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
}

/**
 * Photo fondateur inline dans la barre, avec morph vers mini-card.
 * Composant controle : l'etat expanded est gere par AlphabetBar
 * pour coordonner le sticky (une seule mini-card ouverte a la fois).
 */
export const FounderDockItem = memo(function FounderDockItem({
  founder,
  expanded,
  onSelect,
  onMouseEnter,
  onMouseLeave,
}: FounderDockItemProps) {
  return (
    <div
      className={`dock-item dock-photo-item ${expanded ? 'expanded' : ''}`}
      style={{ '--s': 1.7 } as React.CSSProperties}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
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
