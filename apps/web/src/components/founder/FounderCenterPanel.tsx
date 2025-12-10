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

import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
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
import { filterValidTriples, type RawTriple } from '../../utils/tripleGuards';
import { TotemCreationForm, type NewTotemData } from './TotemCreationForm';

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

/** Best triple type - includes predicate for full triple display */
interface BestTriple {
  id: string; // Object atom term_id (totem atomId)
  tripleTermId: string; // Triple term_id (for reference)
  subjectLabel: string;
  predicateLabel: string;
  objectLabel: string;
  forVotes: string;
  againstVotes: string;
  totalTrust: bigint;
}

interface FounderCenterPanelProps {
  founder: FounderForHomePage;
  onSelectTotem?: (totemId: string, totemLabel: string) => void;
  selectedTotemId?: string;
  /** Trigger to refetch user votes (increment to refetch) */
  refetchTrigger?: number;
  /** Called when new totem data changes in the creation form (real-time sync) */
  onNewTotemChange?: (data: NewTotemData | null) => void;
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
  onNewTotemChange,
}: FounderCenterPanelProps) {
  const { t } = useTranslation();
  const { isConnected, address } = useAccount();
  const { proposals, loading: proposalsLoading, refetch: refetchProposals } = useFounderProposals(founder.name);
  const { totems: ofcTotems, loading: ofcLoading, dynamicCategories } = useAllOFCTotems();
  const { votes: userVotes, loading: votesLoading, refetch: refetchVotes } = useUserVotesForFounder(address, founder.name);

  // Track the last refetchTrigger value to avoid duplicate refetches
  const lastRefetchTrigger = useRef(0);

  // Refetch all data when refetchTrigger changes (after cart validation or totem creation)
  // Add delay to allow blockchain indexer to process new data
  useEffect(() => {
    if (refetchTrigger && refetchTrigger > 0 && refetchTrigger !== lastRefetchTrigger.current) {
      lastRefetchTrigger.current = refetchTrigger;
      console.log('[FounderCenterPanel] Refetch triggered, waiting for indexer...');

      // Wait 3 seconds for the blockchain indexer to process new data
      const timeoutId = setTimeout(() => {
        console.log('[FounderCenterPanel] Refetching all data after indexer delay...');
        // Refetch both proposals (for new totems) and user votes (for new positions)
        refetchProposals();
        refetchVotes();
      }, 3000);

      return () => clearTimeout(timeoutId);
    }
  }, [refetchTrigger, refetchProposals, refetchVotes]);

  // Section 1: Totems / Création
  const [section1Tab, setSection1Tab] = useState<'totems' | 'creation'>('totems');
  // Section 2: My Votes / Best Triples
  const [section2Tab, setSection2Tab] = useState<'myVotes' | 'bestTriples'>('myVotes');
  const [timeframe, setTimeframe] = useState<Timeframe>('24H');

  // Resizable divider state - height of section 1 in pixels (null = not initialized)
  const [section1Height, setSection1Height] = useState<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Initialize section1Height to ~50% of available space on first render
  useEffect(() => {
    if (section1Height === null && containerRef.current) {
      const containerRect = containerRef.current.getBoundingClientRect();
      // Available space = container - chart (~156px) - footer (~40px) - divider (~32px) - margins (~20px)
      const chartAndOverhead = 248;
      const availableSpace = containerRect.height - chartAndOverhead;
      // Split 50/50 between sections
      const initialHeight = Math.max(80, availableSpace / 2);
      setSection1Height(initialHeight);
    }
  }, [section1Height]);

  // Handle resize drag
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;

      const containerRect = containerRef.current.getBoundingClientRect();
      // Calculate position relative to container, accounting for chart height (~156px) and padding
      const chartAndPaddingHeight = 156;
      const relativeY = e.clientY - containerRect.top - chartAndPaddingHeight;

      // Calculate max height dynamically: container height - chart - section2 minimum (100px) - margins
      const maxHeight = containerRect.height - chartAndPaddingHeight - 100;

      // Clamp between min (60px) and dynamic max
      const newHeight = Math.max(60, Math.min(maxHeight, relativeY));
      setSection1Height(newHeight);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  const loading = proposalsLoading || ofcLoading;

  // Filter valid proposals first (removes those with null object/subject/predicate)
  const validProposals = useMemo(() => {
    if (!proposals || proposals.length === 0) return [];
    return filterValidTriples(proposals as RawTriple[], 'FounderCenterPanel');
  }, [proposals]);

  // Trading chart data - filtered by selected totem if any
  const {
    data: timelineData,
    loading: timelineLoading,
    suggestedTimeframe,
    hasAnyData,
  } = useVotesTimeline(founder.name, timeframe, selectedTotemId);

  // Merge proposals (with votes) and OFC totems (may not have votes)
  const allTotems = useMemo((): DisplayTotem[] => {
    const totemMap = new Map<string, DisplayTotem>();

    // First, add all valid proposals (totems with votes for this founder)
    // validProposals is already filtered by filterValidTriples - object is guaranteed non-null
    validProposals.forEach((proposal) => {
      // Use object.term_id as the unique identifier (object_id is not returned by GraphQL)
      const id = proposal.object.term_id;
      const netScore = BigInt(proposal.votes?.netVotes || '0');

      const forVotes = proposal.votes?.forVotes || '0';
      const againstVotes = proposal.votes?.againstVotes || '0';

      if (totemMap.has(id)) {
        // Aggregate votes if same totem appears multiple times
        const existing = totemMap.get(id)!;
        existing.netScore += netScore;
        existing.forVotes = (BigInt(existing.forVotes) + BigInt(forVotes)).toString();
        existing.againstVotes = (BigInt(existing.againstVotes) + BigInt(againstVotes)).toString();
      } else {
        totemMap.set(id, {
          id,
          label: proposal.object.label,
          image: proposal.object.image,
          hasVotes: true,
          netScore,
          forVotes,
          againstVotes,
        });
      }
    });

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
  }, [validProposals, ofcTotems]);

  // Best triples = top proposals sorted by total TRUST (includes predicate info)
  // Uses validProposals which is already filtered by filterValidTriples
  const bestTriples = useMemo((): BestTriple[] => {
    if (validProposals.length === 0) return [];

    return validProposals
      // Only filter for votes (subject/predicate/object are guaranteed by validProposals)
      .filter((proposal) => proposal.votes)
      .map((proposal) => ({
        id: proposal.object.term_id, // Use object atomId, NOT triple term_id!
        tripleTermId: proposal.term_id, // Keep triple term_id for reference
        subjectLabel: proposal.subject.label,
        predicateLabel: proposal.predicate.label,
        objectLabel: proposal.object.label,
        forVotes: proposal.votes!.forVotes,
        againstVotes: proposal.votes!.againstVotes,
        totalTrust: BigInt(proposal.votes!.forVotes) + BigInt(proposal.votes!.againstVotes),
      }))
      .filter((t) => t.totalTrust > 0n)
      .sort((a, b) => (b.totalTrust > a.totalTrust ? 1 : b.totalTrust < a.totalTrust ? -1 : 0))
      .slice(0, 10);
  }, [validProposals]);

  // Calculate total TRUST for percentage
  const totalTrust = useMemo(() => {
    return bestTriples.reduce((sum, t) => sum + BigInt(t.forVotes) + BigInt(t.againstVotes), 0n);
  }, [bestTriples]);

  return (
    <div ref={containerRef} className="glass-card p-4 h-full flex flex-col overflow-hidden">
      {/* Trading Chart Section - Always visible at top */}
      <div className="mb-3 shrink-0">
        <TradingChart
          data={timelineData}
          timeframe={timeframe}
          onTimeframeChange={setTimeframe}
          height={120}
          loading={timelineLoading}
          title="Vote Activity"
          suggestedTimeframe={suggestedTimeframe}
          hasAnyData={hasAnyData}
        />
      </div>

      {/* SECTION 1: Totems / Création */}
      <div className="shrink-0" style={{ height: section1Height ?? 150 }}>
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

        {/* Section 1 Content - height adapts to section1Height minus tabs (~32px) */}
        <div className="overflow-y-auto scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent" style={{ height: (section1Height ?? 150) - 32, overscrollBehavior: 'contain' }}>
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
            // Création tab - Totem creation form
            <TotemCreationForm
              onChange={(data) => onNewTotemChange?.(data)}
              dynamicCategories={dynamicCategories}
            />
          )}
        </div>
      </div>

      {/* Resizable Divider - Fade blur effect: glass-card top → blur middle → transparent bottom */}
      <div
        className="group relative flex items-center justify-center cursor-row-resize shrink-0 h-8"
        onMouseDown={handleMouseDown}
      >
        {/* Top fade: glass-card color to blur (hides totems) */}
        <div className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-[#0f172a]/80 to-white/5 backdrop-blur-md" />
        {/* Bottom fade: blur to transparent (blends with My Votes) */}
        <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-b from-white/5 to-transparent backdrop-blur-sm" />
        {/* Drag handle indicator */}
        <div className={`relative z-10 w-10 h-1.5 rounded-full transition-colors ${
          isDragging ? 'bg-white/50' : 'bg-white/25 group-hover:bg-white/40'
        }`} />
      </div>

      {/* SECTION 2: My Votes / Best Triples */}
      <div className="flex-1 min-h-0 flex flex-col pt-1">
        {/* Section 2 Tabs */}
        <div className="flex items-center justify-between mb-3">
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
        <div className="flex-1 overflow-y-auto min-h-0 scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent" style={{ overscrollBehavior: 'contain' }}>
          {section2Tab === 'myVotes' ? (
            // My Votes - User's votes on this founder
            isConnected ? (
              votesLoading ? (
                <MyVotesSkeleton />
              ) : userVotes.length > 0 ? (
                <div className="space-y-1.5">
                  {userVotes
                    .filter((vote) => vote.term?.object?.term_id)
                    .map((vote) => (
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
                      key={totem.tripleTermId || `best-${index}`}
                      onClick={() => onSelectTotem?.(totem.id, totem.objectLabel)}
                      className={`w-full text-left p-2 rounded-lg transition-all ${
                        totem.id === selectedTotemId
                          ? 'bg-slate-500/30 ring-1 ring-slate-500/50'
                          : 'bg-white/5 hover:bg-white/10'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-white truncate flex-1">
                          {totem.subjectLabel} → {totem.predicateLabel} → {totem.objectLabel}
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
