/**
 * VoteMarket - Aggregated vote statistics display
 *
 * Shows vote market stats for a founder:
 * - Total TRUST deposited
 * - Number of unique voters
 * - Number of totems
 * - Top totem
 * - FOR/AGAINST ratio bar
 *
 * Collapsible section for details.
 *
 * @see Phase 7 in TODO_Implementation.md
 */

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useVoteMarketStats } from '../../hooks/useVoteMarketStats';

interface VoteMarketProps {
  /** Founder name to show stats for */
  founderName: string;
  /** Optional className for container */
  className?: string;
}

/**
 * Vote market statistics component
 *
 * @example
 * ```tsx
 * <VoteMarket founderName="Vitalik Buterin" />
 * ```
 */
export function VoteMarket({ founderName, className = '' }: VoteMarketProps) {
  const { t } = useTranslation();
  const { stats, loading, error } = useVoteMarketStats(founderName);
  const [isExpanded, setIsExpanded] = useState(false);

  if (loading) {
    return (
      <div className={`p-4 bg-white/5 border border-white/10 rounded-lg ${className}`}>
        <div className="animate-pulse space-y-2">
          <div className="h-4 bg-white/10 rounded w-3/4" />
          <div className="h-3 bg-white/10 rounded w-1/2" />
          <div className="h-3 bg-white/10 rounded w-2/3" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`p-4 bg-red-500/10 border border-red-500/20 rounded-lg ${className}`}>
        <p className="text-sm text-red-400">Erreur chargement stats</p>
      </div>
    );
  }

  if (!stats) {
    return null;
  }

  // No stats yet
  if (stats.totemCount === 0) {
    return (
      <div className={`p-4 bg-white/5 border border-white/10 rounded-lg ${className}`}>
        <p className="text-sm text-white/40 text-center">{t('founderExpanded.noVotesYet')}</p>
      </div>
    );
  }

  return (
    <div className={`bg-white/5 border border-white/10 rounded-lg overflow-hidden ${className}`}>
      {/* Header - Always visible */}
      <div className="p-4">
        {/* Title */}
        <h4 className="text-sm font-semibold text-white/70 mb-3 flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          Vote Market
        </h4>

        {/* Main stats */}
        <div className="space-y-2">
          {/* Total TRUST */}
          <div className="flex justify-between items-center">
            <span className="text-white/60 text-sm">Total TRUST</span>
            <span className="text-white font-medium">{stats.formattedTotalTrust}</span>
          </div>

          {/* Voters */}
          <div className="flex justify-between items-center">
            <span className="text-white/60 text-sm">Votants</span>
            <span className="text-white font-medium">{stats.uniqueVoters}</span>
          </div>

          {/* Totems */}
          <div className="flex justify-between items-center">
            <span className="text-white/60 text-sm">Totems</span>
            <span className="text-white font-medium">{stats.totemCount}</span>
          </div>
        </div>

        {/* FOR/AGAINST ratio bar */}
        <div className="mt-4">
          <div className="flex justify-between text-xs text-white/50 mb-1">
            <span>FOR {stats.forPercentage}%</span>
            <span>AGAINST {stats.againstPercentage}%</span>
          </div>
          <div className="h-2 bg-white/10 rounded-full overflow-hidden flex">
            <div
              className="h-full bg-green-500 transition-all duration-300"
              style={{ width: `${stats.forPercentage}%` }}
            />
            <div
              className="h-full bg-red-500 transition-all duration-300"
              style={{ width: `${stats.againstPercentage}%` }}
            />
          </div>
        </div>

        {/* Expand button */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="mt-3 w-full flex items-center justify-center gap-1 text-xs text-slate-400 hover:text-slate-300 transition-colors"
        >
          {isExpanded ? 'Masquer' : 'Détails'}
          <svg
            className={`w-3 h-3 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>

      {/* Expanded details */}
      {isExpanded && (
        <div className="border-t border-white/10 p-4 bg-white/[0.02]">
          {/* Top totem */}
          {stats.topTotem && (
            <div className="mb-3">
              <span className="text-xs text-white/50">Top totem</span>
              <div className="flex justify-between items-center mt-1">
                <span className="text-white text-sm font-medium truncate max-w-[150px]">
                  {stats.topTotem.label}
                </span>
                <span className="text-white/60 text-xs">{stats.topTotem.formattedTrust} TRUST</span>
              </div>
            </div>
          )}

          {/* All totems list */}
          {stats.totems.length > 0 && (
            <div>
              <span className="text-xs text-white/50">Tous les totems</span>
              <div className="mt-2 space-y-2 max-h-32 overflow-y-auto">
                {stats.totems.map((totem) => (
                  <div key={totem.termId} className="flex items-center justify-between text-xs">
                    <span className="text-white/70 truncate max-w-[120px]">{totem.label}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-green-400/80">
                        +{Number(totem.forTrust / BigInt(1e18)).toFixed(2)}
                      </span>
                      <span className="text-red-400/80">
                        -{Number(totem.againstTrust / BigInt(1e18)).toFixed(2)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Compact version of VoteMarket for smaller spaces
 */
export function VoteMarketCompact({ founderName, className = '' }: VoteMarketProps) {
  const { stats, loading } = useVoteMarketStats(founderName);

  if (loading || !stats || stats.totemCount === 0) {
    return null;
  }

  return (
    <div className={`flex items-center gap-3 text-xs ${className}`}>
      <div className="flex items-center gap-1">
        <span className="text-white/50">TRUST:</span>
        <span className="text-white font-medium">{stats.formattedTotalTrust}</span>
      </div>
      <div className="flex items-center gap-1">
        <span className="text-white/50">Votants:</span>
        <span className="text-white font-medium">{stats.uniqueVoters}</span>
      </div>
      <div className="flex items-center gap-1">
        <span className="text-green-400">{stats.forPercentage}%</span>
        <span className="text-white/30">/</span>
        <span className="text-red-400">{stats.againstPercentage}%</span>
      </div>
    </div>
  );
}
