/**
 * FounderCenterPanel - Center panel showing Trading chart, totems grid and user positions
 *
 * Displays:
 * - Trading chart at the top (always visible) - FOR/AGAINST votes over time
 * - Two sections with tabs:
 *   - Section 1: Totems / Création
 *   - Section 2: My Votes / Best Triples
 * - Click on totem to select for voting
 *
 * @see Phase 10 in TODO_FIX_01_Discussion.md
 */

import { useState, useMemo } from 'react';
import { formatEther } from 'viem';
import { useAccount } from 'wagmi';
import { useTranslation } from 'react-i18next';
import type { FounderForHomePage } from '../../hooks/useFoundersForHomePage';
import { useFounderProposals } from '../../hooks/useFounderProposals';
import { useVotesTimeline } from '../../hooks/useVotesTimeline';
import { useAllOFCTotems } from '../../hooks/useAllOFCTotems';
import { TradingChart, type Timeframe } from '../graph/TradingChart';

/** Unified totem type for display */
interface DisplayTotem {
  id: string;
  label: string;
  image?: string;
  category?: string;
  hasVotes: boolean;
  netScore: bigint;
  forVotes: string;
  againstVotes: string;
}

interface FounderCenterPanelProps {
  founder: FounderForHomePage;
  onSelectTotem?: (totemId: string, totemLabel: string) => void;
  selectedTotemId?: string;
}

/**
 * Format score for display
 */
function formatScore(score: bigint | string): string {
  const value = typeof score === 'string' ? BigInt(score) : score;
  const ethValue = parseFloat(formatEther(value));
  if (ethValue >= 1000) {
    return `${(ethValue / 1000).toFixed(1)}k`;
  }
  if (ethValue >= 1) {
    return ethValue.toFixed(2);
  }
  if (ethValue >= 0.001) {
    return ethValue.toFixed(4);
  }
  return '< 0.001';
}

export function FounderCenterPanel({
  founder,
  onSelectTotem,
  selectedTotemId,
}: FounderCenterPanelProps) {
  const { t } = useTranslation();
  const { isConnected, address } = useAccount();
  const { proposals, loading: proposalsLoading } = useFounderProposals(founder.name);
  const { totems: ofcTotems, loading: ofcLoading } = useAllOFCTotems();
  const [viewMode, setViewMode] = useState<'totems' | 'positions'>('totems');
  const [timeframe, setTimeframe] = useState<Timeframe>('24H');

  const loading = proposalsLoading || ofcLoading;

  // Trading chart data
  const {
    data: timelineData,
    loading: timelineLoading,
  } = useVotesTimeline(founder.name, timeframe);

  // Merge proposals (with votes) and OFC totems (may not have votes)
  const allTotems = useMemo((): DisplayTotem[] => {
    const totemMap = new Map<string, DisplayTotem>();

    // First, add all proposals (totems with votes for this founder)
    if (proposals) {
      proposals.forEach((proposal) => {
        const id = proposal.object_id;
        const netScore = BigInt(proposal.votes.netVotes);

        if (totemMap.has(id)) {
          // Aggregate votes if same totem appears multiple times
          const existing = totemMap.get(id)!;
          existing.netScore += netScore;
          existing.forVotes = (BigInt(existing.forVotes) + BigInt(proposal.votes.forVotes)).toString();
          existing.againstVotes = (BigInt(existing.againstVotes) + BigInt(proposal.votes.againstVotes)).toString();
        } else {
          totemMap.set(id, {
            id,
            label: proposal.object.label,
            image: proposal.object.image,
            hasVotes: true,
            netScore,
            forVotes: proposal.votes.forVotes,
            againstVotes: proposal.votes.againstVotes,
          });
        }
      });
    }

    // Then, add OFC totems that don't have votes yet
    ofcTotems.forEach((totem) => {
      if (!totemMap.has(totem.id)) {
        totemMap.set(totem.id, {
          id: totem.id,
          label: totem.label,
          image: totem.image,
          category: totem.category,
          hasVotes: false,
          netScore: 0n,
          forVotes: '0',
          againstVotes: '0',
        });
      } else {
        // Add category info to existing totem
        const existing = totemMap.get(totem.id)!;
        existing.category = totem.category;
      }
    });

    // Sort: totems with votes first (by net score), then totems without votes (alphabetically)
    return Array.from(totemMap.values()).sort((a, b) => {
      if (a.hasVotes && !b.hasVotes) return -1;
      if (!a.hasVotes && b.hasVotes) return 1;
      if (a.hasVotes && b.hasVotes) {
        return b.netScore > a.netScore ? 1 : b.netScore < a.netScore ? -1 : 0;
      }
      return a.label.localeCompare(b.label);
    });
  }, [proposals, ofcTotems]);

  // Filter user's positions (proposals where user has voted)
  const userPositions = useMemo(() => {
    // TODO: Filter by user's actual positions when we have that data
    return allTotems.filter(t => t.hasVotes).slice(0, 5);
  }, [allTotems]);

  return (
    <div className="glass-card p-4 h-full flex flex-col">
      {/* Trading Chart Section - Always visible at top */}
      <div className="mb-4">
        <TradingChart
          data={timelineData}
          timeframe={timeframe}
          onTimeframeChange={setTimeframe}
          height={180}
          loading={timelineLoading}
          title="Vote Activity"
        />
      </div>

      {/* Tabs Header */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-bold text-white">
          {viewMode === 'totems' ? t('founderExpanded.associatedTotems') : t('founderExpanded.myPositions')}
        </h3>
        <div className="flex bg-white/5 rounded-lg p-0.5">
          <button
            onClick={() => setViewMode('totems')}
            className={`px-3 py-1 text-xs rounded-md transition-colors ${
              viewMode === 'totems'
                ? 'bg-slate-500/30 text-slate-300'
                : 'text-white/60 hover:text-white'
            }`}
          >
            Totems
          </button>
          {isConnected && (
            <button
              onClick={() => setViewMode('positions')}
              className={`px-3 py-1 text-xs rounded-md transition-colors ${
                viewMode === 'positions'
                  ? 'bg-slate-500/30 text-slate-300'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              Positions
            </button>
          )}
        </div>
      </div>

      {/* Content area */}
      <div className="flex-1 overflow-y-auto min-h-0">
        {loading ? (
          // Loading skeleton
          <div className="grid grid-cols-2 gap-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-white/5 rounded-lg p-3 animate-pulse">
                <div className="h-4 bg-white/10 rounded w-2/3 mb-2" />
                <div className="h-3 bg-white/10 rounded w-1/3" />
              </div>
            ))}
          </div>
        ) : viewMode === 'totems' ? (
          // Totems grid - includes both voted totems and OFC totems without votes
          allTotems.length > 0 ? (
            <div className="grid grid-cols-2 gap-3">
              {allTotems.map((totem) => {
                const isSelected = totem.id === selectedTotemId;
                const scoreColor = totem.netScore > 0n ? 'text-green-400' : totem.netScore < 0n ? 'text-red-400' : 'text-white/60';

                return (
                  <button
                    key={totem.id}
                    onClick={() => onSelectTotem?.(totem.id, totem.label)}
                    className={`text-left p-3 rounded-lg transition-all ${
                      isSelected
                        ? 'bg-slate-500/30 ring-2 ring-slate-500/50'
                        : 'bg-white/5 hover:bg-white/10'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-sm font-medium text-white truncate flex-1">
                        {totem.label}
                      </span>
                      {isSelected && (
                        <span className="shrink-0 w-2 h-2 rounded-full bg-slate-400" />
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      {totem.hasVotes ? (
                        <>
                          <span className={`text-xs font-medium ${scoreColor}`}>
                            {totem.netScore >= 0n ? '+' : ''}{formatScore(totem.netScore.toString())}
                          </span>
                          <span className="text-xs text-white/40">
                            ({formatScore(totem.forVotes)} FOR / {formatScore(totem.againstVotes)} AGAINST)
                          </span>
                        </>
                      ) : (
                        <>
                          <span className="text-xs text-slate-400">{totem.category}</span>
                          <span className="text-xs text-white/30">• No votes yet</span>
                        </>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center py-8">
              <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-white/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                </svg>
              </div>
              <p className="text-white/50 text-sm">{t('founderExpanded.noTotemForFounder')}</p>
              <p className="text-white/30 text-xs mt-1">{t('founderExpanded.beFirstToPropose')}</p>
            </div>
          )
        ) : (
          // User positions
          isConnected ? (
            userPositions.length > 0 ? (
              <div className="space-y-3">
                {userPositions.map((totem) => {
                  const scoreColor = totem.netScore > 0n ? 'text-green-400' : totem.netScore < 0n ? 'text-red-400' : 'text-white/60';

                  return (
                    <div
                      key={totem.id}
                      className="bg-white/5 rounded-lg p-3"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-white">
                          {totem.label}
                        </span>
                        <span className={`text-xs font-medium ${scoreColor}`}>
                          {totem.netScore >= 0n ? '+' : ''}{formatScore(totem.netScore.toString())}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-white/50">
                        <span className="flex items-center gap-1">
                          <span className="w-2 h-2 rounded-full bg-green-400/50" />
                          FOR: {formatScore(totem.forVotes)}
                        </span>
                        <span className="flex items-center gap-1">
                          <span className="w-2 h-2 rounded-full bg-red-400/50" />
                          AGAINST: {formatScore(totem.againstVotes)}
                        </span>
                      </div>
                      {/* Position actions */}
                      <div className="flex gap-2 mt-3">
                        <button
                          onClick={() => onSelectTotem?.(totem.id, totem.label)}
                          className="flex-1 py-1.5 text-xs bg-green-500/20 hover:bg-green-500/30 text-green-400 rounded transition-colors"
                        >
                          + {t('founderExpanded.addToCart')}
                        </button>
                        <button
                          className="flex-1 py-1.5 text-xs bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded transition-colors"
                        >
                          - {t('founderExpanded.withdraw')}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center py-8">
                <p className="text-white/50 text-sm">{t('founderExpanded.noTotemForFounder')}</p>
                <p className="text-white/30 text-xs mt-1">{t('founderExpanded.voteOnTotemToStart')}</p>
              </div>
            )
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center py-8">
              <p className="text-white/50 text-sm">{t('common.connectWallet')}</p>
            </div>
          )
        )}
      </div>

      {/* Footer stats */}
      <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-xs text-white/40">
        <span>{allTotems.length} {t('founderExpanded.totems')}</span>
        {isConnected && address && (
          <span className="truncate ml-2">
            {address.slice(0, 6)}...{address.slice(-4)}
          </span>
        )}
      </div>
    </div>
  );
}
