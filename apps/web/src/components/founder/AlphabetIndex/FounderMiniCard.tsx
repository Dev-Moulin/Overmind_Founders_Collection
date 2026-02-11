import { memo } from 'react';
import type { FounderForHomePage } from '../../../types/founder';
import { getFounderImageUrl } from '../../../utils/founderImage';

interface FounderMiniCardProps {
  founder: FounderForHomePage;
}

/**
 * Niveau 3 — Mini-card avec photo, nom, votes et badge NEW.
 * Apparait au hover prolonge sur une photo (desktop) ou au glissement (mobile).
 */
export const FounderMiniCard = memo(function FounderMiniCard({ founder }: FounderMiniCardProps) {
  return (
    <div className="founder-mini-card">
      <img
        src={getFounderImageUrl(founder)}
        alt={founder.name}
        onError={(e) => {
          (e.target as HTMLImageElement).src = `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(founder.name)}`;
        }}
      />
      <div className="mini-card-info">
        <div className="mini-card-name">{founder.name}</div>
        <div className="mini-card-stats">
          <span>{founder.proposalCount} votes</span>
          {founder.recentActivityCount > 0 && (
            <span className="mini-card-badge">NEW +{founder.recentActivityCount}</span>
          )}
        </div>
      </div>
    </div>
  );
});
