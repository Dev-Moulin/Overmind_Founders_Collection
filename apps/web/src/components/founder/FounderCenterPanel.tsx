/**
 * FounderCenterPanel - Center panel showing Trading chart, totems grid and user votes
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

import { useState, useMemo, useEffect } from 'react';
import { formatEther } from 'viem';
import { useAccount } from 'wagmi';
import { useTranslation } from 'react-i18next';
import type { FounderForHomePage } from '../../hooks';
import { useFounderProposals } from '../../hooks';
import { useVotesTimeline } from '../../hooks/data/useVotesTimeline';
import { useAllOFCTotems } from '../../hooks';
import { useUserVotesForFounder } from '../../hooks';
import { TradingChart, type Timeframe } from '../graph/TradingChart';
import { MyVotesItem, MyVotesSkeleton } from '../vote/MyVotesItem';

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
  /** Trigger to refetch user votes (increment to refetch) */
  refetchTrigger?: number;
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
  refetchTrigger,
}: FounderCenterPanelProps) {
  const { t } = useTranslation();
  const { isConnected, address } = useAccount();
  const { proposals, loading: proposalsLoading } = useFounderProposals(founder.name);
  const { totems: ofcTotems, loading: ofcLoading } = useAllOFCTotems();
  const { votes: userVotes, loading: votesLoading, refetch: refetchVotes } = useUserVotesForFounder(address, founder.name);

  // Refetch user votes when refetchTrigger changes (after cart validation)
  useEffect(() => {
    if (refetchTrigger && refetchTrigger > 0) {
      refetchVotes();
    }
  }, [refetchTrigger, refetchVotes]);

  // Section 1: Totems / Création
  const [section1Tab, setSection1Tab] = useState<'totems' | 'creation'>('totems');
  // Section 2: My Votes / Best Triples
  const [section2Tab, setSection2Tab] = useState<'myVotes' | 'bestTriples'>('myVotes');
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

  // Best triples = top totems sorted by total TRUST
  const bestTriples = useMemo(() => {
    return allTotems
      .filter(t => t.hasVotes)
      .sort((a, b) => {
        const totalA = BigInt(a.forVotes) + BigInt(a.againstVotes);
        const totalB = BigInt(b.forVotes) + BigInt(b.againstVotes);
        return totalB > totalA ? 1 : totalB < totalA ? -1 : 0;
      })
      .slice(0, 10);
  }, [allTotems]);

  // Calculate total TRUST for percentage
  const totalTrust = useMemo(() => {
    return bestTriples.reduce((sum, t) => sum + BigInt(t.forVotes) + BigInt(t.againstVotes), 0n);
  }, [bestTriples]);

  return (
    <div className="glass-card p-4 h-full flex flex-col overflow-hidden">
      {/* Trading Chart Section - Always visible at top */}
      <div className="mb-3 shrink-0">
        <TradingChart
          data={timelineData}
          timeframe={timeframe}
          onTimeframeChange={setTimeframe}
          height={120}
          loading={timelineLoading}
          title="Vote Activity"
        />
      </div>

      {/* SECTION 1: Totems / Création */}
      <div className="mb-3 shrink-0">
        {/* Section 1 Tabs */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex bg-white/5 rounded-lg p-0.5">
            <button
              onClick={() => setSection1Tab('totems')}
              className={`px-3 py-1 text-xs rounded-md transition-colors ${
                section1Tab === 'totems'
                  ? 'bg-slate-500/30 text-slate-300'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              Totems
            </button>
            <button
              onClick={() => setSection1Tab('creation')}
              className={`px-3 py-1 text-xs rounded-md transition-colors ${
                section1Tab === 'creation'
                  ? 'bg-slate-500/30 text-slate-300'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              {t('founderExpanded.creation') || 'Création'}
            </button>
          </div>
        </div>

        {/* Section 1 Content */}
        <div className="h-[140px] xl:h-[180px] overflow-y-auto scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent">
          {loading ? (
            <div className="grid grid-cols-2 gap-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="bg-white/5 rounded-lg p-2 animate-pulse">
                  <div className="h-3 bg-white/10 rounded w-2/3 mb-1" />
                  <div className="h-2 bg-white/10 rounded w-1/3" />
                </div>
              ))}
            </div>
          ) : section1Tab === 'totems' ? (
            allTotems.length > 0 ? (
              <div className="grid grid-cols-2 gap-2">
                {allTotems.map((totem, index) => {
                  const isSelected = totem.id === selectedTotemId;
                  const scoreColor = totem.netScore > 0n ? 'text-green-400' : totem.netScore < 0n ? 'text-red-400' : 'text-white/60';

                  return (
                    <button
                      key={totem.id || `totem-${index}`}
                      onClick={() => onSelectTotem?.(totem.id, totem.label)}
                      className={`text-left p-2 rounded-lg transition-all ${
                        isSelected
                          ? 'bg-slate-500/30 ring-1 ring-slate-500/50'
                          : 'bg-white/5 hover:bg-white/10'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-1">
                        <span className="text-xs font-medium text-white truncate flex-1">
                          {totem.label}
                        </span>
                        {isSelected && (
                          <span className="shrink-0 w-1.5 h-1.5 rounded-full bg-slate-400" />
                        )}
                      </div>
                      <div className="flex items-center gap-1 mt-0.5">
                        {totem.hasVotes ? (
                          <span className={`text-[10px] font-medium ${scoreColor}`}>
                            {totem.netScore >= 0n ? '+' : ''}{formatScore(totem.netScore.toString())}
                          </span>
                        ) : (
                          <span className="text-[10px] text-white/30">{totem.category || 'No votes'}</span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <p className="text-white/50 text-xs">{t('founderExpanded.noTotemForFounder')}</p>
              </div>
            )
          ) : (
            // Création tab - placeholder for now
            <div className="flex flex-col items-center justify-center h-full text-center">
              <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mb-2">
                <svg className="w-6 h-6 text-white/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
                </svg>
              </div>
              <p className="text-white/50 text-xs">{t('founderExpanded.createNewTotem') || 'Créer un nouveau totem'}</p>
              <p className="text-white/30 text-[10px] mt-1">{t('founderExpanded.comingSoon') || 'Bientôt disponible'}</p>
            </div>
          )}
        </div>
      </div>

      {/* Divider */}
      <div className="border-t border-white/10 my-2" />

      {/* SECTION 2: My Votes / Best Triples */}
      <div className="flex-1 min-h-0 flex flex-col">
        {/* Section 2 Tabs */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex bg-white/5 rounded-lg p-0.5">
            <button
              onClick={() => setSection2Tab('myVotes')}
              className={`px-3 py-1 text-xs rounded-md transition-colors ${
                section2Tab === 'myVotes'
                  ? 'bg-slate-500/30 text-slate-300'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              {t('header.nav.myVotes')}
            </button>
            <button
              onClick={() => setSection2Tab('bestTriples')}
              className={`px-3 py-1 text-xs rounded-md transition-colors ${
                section2Tab === 'bestTriples'
                  ? 'bg-slate-500/30 text-slate-300'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              Best Triples
            </button>
          </div>
        </div>

        {/* Section 2 Content */}
        <div className="flex-1 overflow-y-auto min-h-0 scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent">
          {section2Tab === 'myVotes' ? (
            // My Votes - User's votes on this founder
            isConnected ? (
              votesLoading ? (
                <MyVotesSkeleton />
              ) : userVotes.length > 0 ? (
                <div className="space-y-1.5">
                  {userVotes.map((vote) => (
                    <MyVotesItem
                      key={vote.id}
                      vote={vote}
                      onClick={onSelectTotem}
                      isSelected={vote.term.object.term_id === selectedTotemId}
                    />
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-center py-4">
                  <p className="text-white/50 text-xs">{t('founderExpanded.noVotesYet')}</p>
                  <p className="text-white/30 text-[10px] mt-1">{t('founderExpanded.voteOnTotemToStart')}</p>
                </div>
              )
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center py-4">
                <p className="text-white/50 text-xs">{t('common.connectWallet')}</p>
              </div>
            )
          ) : (
            // Best Triples - Top triples by total TRUST
            bestTriples.length > 0 ? (
              <div className="space-y-1.5">
                {bestTriples.map((totem, index) => {
                  const total = BigInt(totem.forVotes) + BigInt(totem.againstVotes);
                  const percentage = totalTrust > 0n
                    ? Number((total * 100n) / totalTrust)
                    : 0;

                  return (
                    <button
                      key={totem.id || `best-${index}`}
                      onClick={() => onSelectTotem?.(totem.id, totem.label)}
                      className={`w-full text-left p-2 rounded-lg transition-all ${
                        totem.id === selectedTotemId
                          ? 'bg-slate-500/30 ring-1 ring-slate-500/50'
                          : 'bg-white/5 hover:bg-white/10'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-white truncate flex-1">
                          {founder.name.split(' ')[0]} - {totem.label}
                        </span>
                        <span className="text-xs text-slate-400 ml-2">
                          {percentage}%
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center py-4">
                <p className="text-white/50 text-xs">{t('founderExpanded.noVotesYet')}</p>
              </div>
            )
          )}
        </div>
      </div>

      {/* Footer stats */}
      <div className="mt-2 pt-2 border-t border-white/10 flex items-center justify-between text-[10px] text-white/40">
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
