import { formatEther } from 'viem';
import type { FounderForHomePage } from '../hooks/useFoundersForHomePage';
import { getFounderImageUrl } from '../utils/founderImage';

interface FounderHomeCardProps {
  founder: FounderForHomePage;
  onSelect?: (founderId: string) => void;
  isSelected?: boolean;
}

/**
 * Compact founder card for HomePage grid
 * Shows photo, name, winning totem (if any), and action buttons
 */
export function FounderHomeCard({ founder, onSelect, isSelected }: FounderHomeCardProps) {
  const imageUrl = getFounderImageUrl(founder);

  const handleCardClick = () => {
    if (onSelect) {
      onSelect(founder.id);
    }
  };

  // Format net score for display
  const formatScore = (score: bigint): string => {
    const ethValue = parseFloat(formatEther(score));
    if (ethValue >= 1000) {
      return `${(ethValue / 1000).toFixed(1)}k`;
    }
    if (ethValue >= 1) {
      return ethValue.toFixed(1);
    }
    return ethValue.toFixed(3);
  };

  return (
    <div
      onClick={handleCardClick}
      className={`glass-card p-2 flex flex-col h-full w-full min-w-0 transition-all duration-200 cursor-pointer relative
        ${isSelected ? 'border-purple-500 ring-2 ring-purple-500/50' : 'hover:border-purple-500/50'}`}
    >
      {/* Badge for recent activity */}
      {founder.recentActivityCount > 0 && (
        <div className="absolute -top-2 -right-2 z-10">
          <span className="inline-flex items-center justify-center px-2 py-0.5 text-xs font-bold text-white bg-green-500 rounded-full shadow-lg animate-pulse">
            {founder.recentActivityCount === 1 ? 'NEW' : `+${founder.recentActivityCount}`}
          </span>
        </div>
      )}

      {/* Header: Photo + Name */}
      <div className="flex items-center gap-4 mb-10">
        <img
          src={imageUrl}
          alt={founder.name}
          width={64}
          height={64}
          className="rounded-full object-cover shrink-0 bg-white/10 border-2 border-purple-500/30"
          onError={(e) => {
            (e.target as HTMLImageElement).src = `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(founder.name)}`;
          }}
        />
        <div className="flex-1 min-w-0">
          <h3 className="text-base font-semibold text-white truncate">{founder.name}</h3>
          {founder.shortBio && (
            <p className="text-sm text-white/50 line-clamp-2 leading-snug">{founder.shortBio}</p>
          )}
        </div>
      </div>

      {/* Winning Totem */}
      <div className="flex-1 mb-4">
        {founder.winningTotem ? (
          <div className="bg-purple-500/10 rounded-lg p-3 border border-purple-500/20">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-white truncate flex-1">
                {founder.winningTotem.label}
              </p>
              {/* Trend indicator */}
              {founder.winningTotem.trend === 'up' && (
                <span className="text-green-400 text-sm ml-2" title="Tendance haussière (>60% FOR)">
                  ↑
                </span>
              )}
              {founder.winningTotem.trend === 'down' && (
                <span className="text-red-400 text-sm ml-2" title="Tendance baissière (<40% FOR)">
                  ↓
                </span>
              )}
            </div>
            <div className="flex items-center justify-between mt-2 text-sm">
              <span className="text-purple-400">{formatScore(founder.winningTotem.netScore)} TRUST</span>
              <span className="text-white/40">{founder.proposalCount} prop.</span>
            </div>
          </div>
        ) : (
          <div className="bg-white/5 rounded-lg p-3 border border-white/10 text-center">
            <p className="text-sm text-white/40">Aucun totem</p>
          </div>
        )}
      </div>

      {/* Click indicator */}
      <div className="text-center text-xs text-white/30 mt-auto pt-2">
        Cliquez pour voter
      </div>
    </div>
  );
}

/**
 * Skeleton loader for FounderHomeCard
 */
export function FounderHomeCardSkeleton() {
  return (
    <div className="glass-card p-3 animate-pulse">
      <div className="flex items-center gap-2 mb-2">
        <div className="w-8 h-8 rounded-full bg-white/10" />
        <div className="flex-1">
          <div className="h-3 bg-white/10 rounded w-16" />
        </div>
      </div>
      <div className="h-10 bg-white/5 rounded mb-2" />
      <div className="flex gap-1.5">
        <div className="flex-1 h-5 bg-white/10 rounded" />
        <div className="flex-1 h-5 bg-purple-500/10 rounded" />
      </div>
    </div>
  );
}
