import { useState, memo } from 'react';
import { useTranslation } from 'react-i18next';
import type { FounderForHomePage, TopTotem } from '../../hooks';
import { getFounderImageUrl } from '../../utils/founderImage';
import { TopTotemsRadar, type RadarMode } from '../graph/TopTotemsRadar';

interface FounderHomeCardProps {
  founder: FounderForHomePage;
  onSelect?: (founderId: string) => void;
  isSelected?: boolean;
  /** Card is in front position in the 3D carousel */
  isFront?: boolean;
  /** Pre-computed top totems from batched query (avoids 42 individual API calls) */
  topTotems: TopTotem[];
}

/**
 * Compact founder card for HomePage grid
 * Shows photo, name, Top 5 totems radar (with carousel for votes/trust), and action buttons
 *
 * IMPORTANT: topTotems is passed as props from HomePage (batched query)
 * This avoids 42 individual useTopTotems calls that caused 429 rate limiting
 *
 * Wrapped in React.memo to prevent unnecessary re-renders (42 cards on HomePage)
 */
export const FounderHomeCard = memo(function FounderHomeCard({ founder, onSelect, isSelected, isFront, topTotems }: FounderHomeCardProps) {
  const { t } = useTranslation();
  const imageUrl = getFounderImageUrl(founder);

  // Carousel state: 'wallets' = Net Votes (default), 'trust' = Total TRUST
  const [radarMode, setRadarMode] = useState<RadarMode>('wallets');

  const handleCardClick = () => {
    if (onSelect) {
      onSelect(founder.id);
    }
  };

  return (
    <div
      onClick={handleCardClick}
      className={`glass-card glass-shine p-4 flex flex-col h-full w-full min-w-0 cursor-pointer relative
        ${isSelected ? 'border-slate-500 ring-2 ring-slate-500/50' : 'hover:border-slate-500/50'}
        ${isFront ? 'animate-ring-pulse' : ''}`}
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
      <div className="flex items-center gap-4 mb-4">
        <img
          src={imageUrl}
          alt={founder.name}
          width={76}
          height={76}
          className="w-[76px] h-[76px] rounded-full object-cover shrink-0 bg-white/10 border-2 border-slate-500/30"
          onError={(e) => {
            (e.target as HTMLImageElement).src = `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(founder.name)}`;
          }}
        />
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-semibold text-white truncate">{founder.name}</h3>
          {founder.shortBio && (
            <p className="text-sm text-white/50 line-clamp-2 leading-snug">{founder.shortBio}</p>
          )}
        </div>
      </div>

      {/* Curve Winners - Linear and Progressive */}
      {(founder.linearWinner || founder.progressiveWinner) && (
        <div className="mb-3 p-2 bg-white/5 rounded-lg border border-white/10">
          <div className="grid grid-cols-2 gap-2 text-xs">
            {/* Linear Winner */}
            <div className="flex items-center gap-1.5">
              <span className="text-yellow-500">🏆</span>
              <span className="text-white/50">Linear:</span>
              <span className="text-white font-medium truncate">
                {founder.linearWinner?.label || '-'}
              </span>
            </div>
            {/* Progressive Winner */}
            <div className="flex items-center gap-1.5">
              <span className="text-yellow-500">🏆</span>
              <span className="text-white/50">Progressive:</span>
              <span className="text-white font-medium truncate">
                {founder.progressiveWinner?.label || '-'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Top Totems Radar with Carousel */}
      <div className="flex-1 mb-2">
        {/* Radar Chart - data comes from batched query in HomePage */}
        {topTotems.length > 0 ? (
          <TopTotemsRadar
            totems={topTotems}
            loading={false}
            mode={radarMode}
            height={200}
          />
        ) : (
          <div className="bg-white/5 rounded-lg p-4 border border-white/10 text-center h-[200px] flex items-center justify-center">
            <p className="text-sm text-white/40">{t('common.noTotem')}</p>
          </div>
        )}
      </div>

      {/* Mode selector dots - clearly separated from vote button */}
      <div className="flex justify-center items-center gap-3 py-2 border-t border-white/10">
        <button
          onClick={(e) => { e.stopPropagation(); setRadarMode('wallets'); }}
          className={`flex items-center gap-1.5 px-2 py-1 rounded transition-all ${
            radarMode === 'wallets'
              ? 'bg-slate-500/30 scale-105'
              : 'hover:bg-white/10 opacity-50 hover:opacity-80'
          }`}
          title={t('results.carousel.votes', 'Net Votes')}
        >
          <span className={`rounded-full transition-all ${
            radarMode === 'wallets' ? 'w-2.5 h-2.5 bg-slate-400' : 'w-2 h-2 bg-white/30'
          }`} />
          <span className="text-xs text-white/60">Votes</span>
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); setRadarMode('trust'); }}
          className={`flex items-center gap-1.5 px-2 py-1 rounded transition-all ${
            radarMode === 'trust'
              ? 'bg-slate-500/30 scale-105'
              : 'hover:bg-white/10 opacity-50 hover:opacity-80'
          }`}
          title={t('results.carousel.trust', 'Total TRUST')}
        >
          <span className={`rounded-full transition-all ${
            radarMode === 'trust' ? 'w-2.5 h-2.5 bg-slate-400' : 'w-2 h-2 bg-white/30'
          }`} />
          <span className="text-xs text-white/60">TRUST</span>
        </button>
      </div>

      {/* Vote button - visually distinct */}
      <div className="mt-auto pt-2">
        <div className="text-center py-2 bg-slate-500/20 hover:bg-slate-500/30 rounded-lg transition-colors border border-slate-500/30">
          <span className="text-sm text-slate-300 font-medium">{t('common.clickToVote')}</span>
        </div>
      </div>
    </div>
  );
});

/**
 * Skeleton loader for FounderHomeCard
 */
export function FounderHomeCardSkeleton() {
  return (
    <div className="glass-card p-4 animate-pulse">
      <div className="flex items-center gap-4 mb-4">
        <div className="w-[76px] h-[76px] rounded-full bg-white/10" />
        <div className="flex-1">
          <div className="h-4 bg-white/10 rounded w-24 mb-2" />
          <div className="h-3 bg-white/5 rounded w-full" />
        </div>
      </div>
      <div className="h-16 bg-white/5 rounded mb-4" />
      <div className="h-4 bg-white/5 rounded w-24 mx-auto" />
    </div>
  );
}
