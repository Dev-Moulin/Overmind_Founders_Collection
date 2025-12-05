/**
 * FounderInfoPanel - Left panel showing founder information
 *
 * Displays:
 * - Photo + name
 * - Short bio
 * - Tags (if any)
 * - Social links (Twitter, GitHub, LinkedIn)
 * - Vote Market stats (collapsible)
 *
 * @see Phase 9 in TODO_Implementation.md
 */

import { formatEther } from 'viem';
import { useTranslation } from 'react-i18next';
import type { FounderForHomePage } from '../../hooks/useFoundersForHomePage';
import { getFounderImageUrl } from '../../utils/founderImage';
import { VoteMarketCompact } from '../vote/VoteMarket';
import { RefreshIndicator } from '../RefreshIndicator';
import { TopTotemsRadar } from '../graph/TopTotemsRadar';
import { RelationsRadar } from '../graph/RelationsRadar';
import { useTopTotems } from '../../hooks/useTopTotems';

interface FounderInfoPanelProps {
  founder: FounderForHomePage;
  onClose: () => void;
  // Real-time subscription state
  secondsSinceUpdate?: number;
  isConnected?: boolean;
  isPaused?: boolean;
  isLoading?: boolean;
  hasNewData?: boolean;
}

/**
 * Format net score for compact display
 */
function formatScore(score: bigint): string {
  const ethValue = parseFloat(formatEther(score));
  if (ethValue >= 1000) {
    return `${(ethValue / 1000).toFixed(1)}k`;
  }
  if (ethValue >= 1) {
    return ethValue.toFixed(1);
  }
  return ethValue.toFixed(3);
}

export function FounderInfoPanel({
  founder,
  onClose,
  secondsSinceUpdate = 0,
  isConnected = false,
  isPaused = false,
  isLoading = false,
  hasNewData = false,
}: FounderInfoPanelProps) {
  const { t } = useTranslation();
  const imageUrl = getFounderImageUrl(founder);

  // Fetch top totems for radar chart
  const { topTotems, loading: totemsLoading } = useTopTotems(founder.name, 5);

  // Extract social links from founder data
  const socialLinks = {
    twitter: founder.twitter,
    github: founder.github,
    linkedin: founder.linkedin,
  };

  const hasSocialLinks = Object.values(socialLinks).some(Boolean);

  return (
    <div className="glass-card p-4 h-full flex flex-col relative">
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-3 right-3 w-7 h-7 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white/70 hover:text-white transition-colors z-10"
        aria-label={t('common.close')}
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      {/* Founder Photo */}
      <div className="flex justify-center mb-4">
        <img
          src={imageUrl}
          alt={founder.name}
          className="w-24 h-24 rounded-full object-cover border-3 border-slate-500/50 shadow-lg shadow-slate-500/20"
          onError={(e) => {
            (e.target as HTMLImageElement).src = `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(founder.name)}`;
          }}
        />
      </div>

      {/* Founder Name */}
      <h2 className="text-xl font-bold text-white text-center mb-1">
        {founder.name}
      </h2>

      {/* Real-time indicator */}
      <div className="flex justify-center mb-3">
        <RefreshIndicator
          secondsSinceUpdate={secondsSinceUpdate}
          isConnected={isConnected}
          isPaused={isPaused}
          isLoading={isLoading}
        />
      </div>

      {/* Full Bio (with fallback to short bio) */}
      {(founder.fullBio || founder.shortBio) && (
        <p className="text-xs text-white/60 text-center mb-4 leading-relaxed">
          {founder.fullBio || founder.shortBio}
        </p>
      )}

      {/* Social Links */}
      {hasSocialLinks && (
        <div className="flex justify-center gap-3 mb-4">
          {socialLinks.twitter && (
            <a
              href={`https://twitter.com/${socialLinks.twitter.replace('@', '')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-8 h-8 flex items-center justify-center rounded-full bg-white/10 hover:bg-blue-500/20 text-white/60 hover:text-blue-400 transition-colors"
              aria-label="Twitter"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
            </a>
          )}
          {socialLinks.github && (
            <a
              href={`https://github.com/${socialLinks.github}`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-8 h-8 flex items-center justify-center rounded-full bg-white/10 hover:bg-gray-500/20 text-white/60 hover:text-white transition-colors"
              aria-label="GitHub"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
              </svg>
            </a>
          )}
          {socialLinks.linkedin && (
            <a
              href={socialLinks.linkedin.startsWith('http') ? socialLinks.linkedin : `https://linkedin.com/in/${socialLinks.linkedin}`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-8 h-8 flex items-center justify-center rounded-full bg-white/10 hover:bg-blue-600/20 text-white/60 hover:text-blue-500 transition-colors"
              aria-label="LinkedIn"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
              </svg>
            </a>
          )}
        </div>
      )}

      {/* Divider */}
      <div className="border-t border-white/10 my-3" />

      {/* Quick Stats with animation */}
      <div
        className={`space-y-2 rounded-lg p-2 -mx-2 transition-all duration-300 ${
          hasNewData ? 'bg-slate-500/20 ring-1 ring-slate-500/50' : ''
        }`}
      >
        <div className="flex justify-between text-xs">
          <span className="text-white/50">{t('common.proposals')}</span>
          <span className="text-white font-medium">{founder.proposalCount}</span>
        </div>

        {founder.winningTotem && (
          <>
            <div className="flex justify-between text-xs">
              <span className="text-white/50">Top totem</span>
              <span className="text-slate-400 font-medium truncate ml-2 max-w-[100px]">
                {founder.winningTotem.label}
              </span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-white/50">Score</span>
              <span className={`text-slate-400 font-medium transition-all duration-300 ${
                hasNewData ? 'scale-110' : ''
              }`}>
                {formatScore(founder.winningTotem.netScore)} TRUST
              </span>
            </div>
          </>
        )}
      </div>

      {/* Top Totems Radar Chart */}
      <div className="mt-4">
        <TopTotemsRadar
          totems={topTotems}
          loading={totemsLoading}
          height={200}
        />
      </div>

      {/* Relations Radar Graph */}
      <div className="mt-4">
        <RelationsRadar
          founderName={founder.name}
          founderImage={imageUrl}
          totems={topTotems}
          loading={totemsLoading}
          height={220}
        />
      </div>

      {/* Spacer */}
      <div className="flex-1 min-h-4" />

      {/* Vote Market Stats (compact) */}
      <div className="mt-4">
        <VoteMarketCompact founderName={founder.name} />
      </div>

      {/* Atom ID (footer) */}
      {founder.atomId && (
        <div className="mt-3 pt-3 border-t border-white/10">
          <div className="flex justify-between text-xs">
            <span className="text-white/40">Atom ID</span>
            <span className="text-white/50 font-mono">
              {founder.atomId.slice(0, 8)}...{founder.atomId.slice(-4)}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
