/**
 * FounderCenterPanel - Center panel showing Trading chart, totems grid and user votes
 *
 * Displays:
 * - Trading chart at the top (always visible) - FOR/AGAINST votes over time
 * - Unified tab navigation with 4 tabs side by side:
 *   - Totems: Grid of available totems
 *   - Création: Form to create new totems
 *   - My Votes: User's votes on this founder
 *   - Best Triples: Top triples by total TRUST
 * - Click on totem to select for voting
 *
 * @see Phase 10 in TODO_FIX_01_Discussion.md
 */

import { useState, useMemo, useEffect, useRef, lazy, Suspense } from 'react';
import { useAccount } from 'wagmi';
import { useTranslation } from 'react-i18next';
import type { FounderForHomePage } from '../../hooks';
import { useFounderProposals, type CurveId } from '../../hooks';
import { useVotesTimeline } from '../../hooks/data/useVotesTimeline';
import { useAllOFCTotems } from '../../hooks';
import { useUserVotesForFounder, type UserVoteWithDetails } from '../../hooks';
import type { Timeframe, ChartTitleInfo } from '../graph/TradingChart';

// Lazy load TradingChart to defer recharts (~1.2MB)
const TradingChart = lazy(() => import('../graph/TradingChart').then(m => ({ default: m.TradingChart })));
import { useTopTotemsByCurve } from '../../hooks/data/useTopTotemsByCurve';
import { MyVotesSkeleton } from '../common/MyVotesSkeleton';
import { filterValidTriples, type RawTriple } from '../../utils/tripleGuards';
import { TotemCreationForm, type NewTotemData } from './TotemCreationForm';
import { invalidateAllQueryCache } from '../../lib/queryCacheTTL';
import type { TotemCreationResult } from '../../hooks/blockchain/claims/useCreateTotemWithTriples';
import type { CurveFilter } from '../../hooks/data/useVotesTimeline';
import { GooeySwitch } from '../common';
import { TotemCard, type UserPositionData } from './FounderCenterPanel/TotemCard';
import { MyVotesItem, type VoteDisplayData } from './FounderCenterPanel/MyVotesItem';
import { BestTripleItem } from './FounderCenterPanel/BestTripleItem';
import { aggregateUserPositions, mergeProposalsAndTotems } from './FounderCenterPanel/helpers';

/** Best triple type - includes predicate for full triple display */
interface BestTriple {
  id: string; // Object atom term_id (totem atomId)
  tripleTermId: string; // Triple term_id (for reference)
  subjectLabel: string;
  subjectImage?: string;
  subjectEmoji?: string;
  predicateLabel: string;
  predicateImage?: string;
  predicateEmoji?: string;
  objectLabel: string;
  objectImage?: string;
  objectEmoji?: string;
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
  /** Called when a totem is created (to switch to vote tab with totem pre-filled) */
  onTotemCreated?: (result: TotemCreationResult) => void;
  /** Current curve filter (controlled from parent) */
  curveFilter?: CurveFilter;
  /** Callback when curve filter changes */
  onCurveFilterChange?: (filter: CurveFilter) => void;
  /** User's position curve on selected totem (for visual highlighting) */
  userPositionCurveId?: CurveId | null;
}
export function FounderCenterPanel({
  founder,
  onSelectTotem,
  selectedTotemId,
  refetchTrigger,
  onNewTotemChange,
  onTotemCreated,
  curveFilter: curveFilterProp,
  onCurveFilterChange,
  userPositionCurveId,
}: FounderCenterPanelProps) {
  const { t } = useTranslation();
  const { isConnected, address } = useAccount();

  const { proposals, loading: proposalsLoading, refetch: refetchProposals } = useFounderProposals(founder.name);
  const { totems: ofcTotems, loading: ofcLoading, dynamicCategories } = useAllOFCTotems();
  const { votes: userVotes, loading: votesLoading, refetch: refetchVotes } = useUserVotesForFounder(address, founder.name);

  // Get curve breakdown data for dynamic chart title
  const { totems: totemsByCurve, linearWinner, progressiveWinner } = useTopTotemsByCurve(founder.name);

  // Aggregate user positions by totem - extracted to helpers/aggregateUserPositions.ts
  const userPositionsByTotem = useMemo(
    () => aggregateUserPositions(userVotes),
    [userVotes]
  );

  // Track the last refetchTrigger value to avoid duplicate refetches
  const lastRefetchTrigger = useRef(0);

  // Refetch all data when refetchTrigger changes (after cart validation or totem creation)
  // Add delay to allow blockchain indexer to process new data
  useEffect(() => {
    if (refetchTrigger && refetchTrigger > 0 && refetchTrigger !== lastRefetchTrigger.current) {
      lastRefetchTrigger.current = refetchTrigger;
      console.log('[FounderCenterPanel] Refetch triggered, invalidating cache and waiting for indexer...');

      // Invalidate TTL cache to force fresh network requests
      invalidateAllQueryCache('GetUserPositionsForTerms');
      invalidateAllQueryCache('GetFounderTriplesWithDetails');

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

  // Single tab state for all 4 tabs (unified navigation)
  const [activeTab, setActiveTab] = useState<'totems' | 'creation' | 'myVotes' | 'bestTriples'>('totems');

  // Track previous selectedTotemId to detect when it CHANGES (not just when it's defined)
  const prevSelectedTotemIdRef = useRef<string | undefined>(undefined);

  // Auto-switch to 'totems' tab only when a totem is NEWLY selected (e.g., after creation)
  // This allows manual switching to 'creation' tab even if a totem is already selected
  useEffect(() => {
    const wasUndefined = prevSelectedTotemIdRef.current === undefined;
    const isNowDefined = selectedTotemId !== undefined;

    // Only switch tab when going from undefined -> defined (new selection)
    if (wasUndefined && isNowDefined && activeTab === 'creation') {
      setActiveTab('totems');
    }

    prevSelectedTotemIdRef.current = selectedTotemId;
  }, [selectedTotemId, activeTab]);
  const [timeframe, setTimeframe] = useState<Timeframe>('24H');
  // Curve filter - use prop if controlled, otherwise use local state
  const [localCurveFilter, setLocalCurveFilter] = useState<CurveFilter>('progressive');
  const curveFilter = curveFilterProp ?? localCurveFilter;
  const setCurveFilter = onCurveFilterChange ?? setLocalCurveFilter;

  // Container ref for the panel
  const containerRef = useRef<HTMLDivElement>(null);

  const loading = proposalsLoading || ofcLoading;

  // Filter valid proposals first (removes those with null object/subject/predicate)
  const validProposals = useMemo(() => {
    if (!proposals || proposals.length === 0) return [];
    return filterValidTriples(proposals as RawTriple[], 'FounderCenterPanel');
  }, [proposals]);

  // Trading chart data - filtered by selected totem and curve filter
  const {
    data: timelineData,
    loading: timelineLoading,
    suggestedTimeframe,
    hasAnyData,
  } = useVotesTimeline(founder.name, timeframe, selectedTotemId, curveFilter);

  // Performance measurement: log total loading time once
  const centerPanelStart = useRef(performance.now());
  const centerPanelLogged = useRef(false);
  const allCenterLoaded = !proposalsLoading && !ofcLoading && !votesLoading && !timelineLoading;
  useEffect(() => {
    if (allCenterLoaded && !centerPanelLogged.current) {
      centerPanelLogged.current = true;
      const elapsed = performance.now() - centerPanelStart.current;
      console.log(
        `%c[PERF] FounderCenterPanel loaded in ${elapsed.toFixed(0)}ms`,
        'color: #54a0ff; font-weight: bold; font-size: 13px'
      );
      console.log(`  Proposals: done, OFC: done, Votes: done, Timeline: done`);
    }
  }, [allCenterLoaded]);

  // Calculate dynamic chart title based on selected totem or global winner
  const chartTitleInfo = useMemo((): ChartTitleInfo | null => {
    // If a totem is selected, show its info
    if (selectedTotemId) {
      const selectedTotem = totemsByCurve.find((t) => t.id === selectedTotemId);
      if (selectedTotem) {
        // Determine which curve has more activity based on curveFilter
        const stats = curveFilter === 'linear'
          ? selectedTotem.linear
          : curveFilter === 'progressive'
            ? selectedTotem.progressive
            : selectedTotem.total;

        const trust = stats.trustFor + stats.trustAgainst;
        const direction = stats.netScore > 0 ? 'for' : stats.netScore < 0 ? 'against' : 'neutral';
        const curve = curveFilter === 'linear' ? 'linear' : 'progressive';

        return {
          label: selectedTotem.label,
          trust,
          curve,
          direction,
        };
      }
    }

    // No totem selected - show global winner (highest TRUST between linear and progressive)
    const linearTrust = linearWinner?.netScore ?? 0;
    const progressiveTrust = progressiveWinner?.netScore ?? 0;

    // No winners at all
    if (!linearWinner && !progressiveWinner) {
      return null;
    }

    // Pick the winner with higher absolute netScore
    const useLinear = Math.abs(linearTrust) >= Math.abs(progressiveTrust);
    const winner = useLinear ? linearWinner : progressiveWinner;

    if (!winner) return null;

    return {
      label: winner.totemLabel,
      trust: Math.abs(winner.netScore),
      curve: useLinear ? 'linear' : 'progressive',
      direction: winner.netScore > 0 ? 'for' : winner.netScore < 0 ? 'against' : 'neutral',
      isWinner: true,
    };
  }, [selectedTotemId, totemsByCurve, curveFilter, linearWinner, progressiveWinner]);

  // Auto-switch timeframe when current one has no data but another does
  // This ensures user always sees relevant data when selecting a totem
  useEffect(() => {
    // Wait for loading to complete
    if (timelineLoading) return;

    // If current timeframe has no data but suggested one does, switch
    if (timelineData.length === 0 && suggestedTimeframe && suggestedTimeframe !== timeframe) {
      setTimeframe(suggestedTimeframe);
    }
  }, [timelineData.length, suggestedTimeframe, timeframe, timelineLoading, selectedTotemId, curveFilter]);

  // Merge proposals and totems - extracted to helpers/mergeProposalsAndTotems.ts
  const allTotems = useMemo(
    () => mergeProposalsAndTotems(validProposals, ofcTotems),
    [validProposals, ofcTotems]
  );

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
        subjectImage: proposal.subject.image,
        subjectEmoji: proposal.subject.emoji,
        predicateLabel: proposal.predicate.label,
        predicateImage: proposal.predicate.image,
        predicateEmoji: proposal.predicate.emoji,
        objectLabel: proposal.object.label,
        objectImage: proposal.object.image,
        objectEmoji: proposal.object.emoji,
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
      {/* Trading Chart Section - Always visible at top with integrated curve toggle */}
      <div className="mb-3 shrink-0 relative z-10">
        <Suspense fallback={<div className="h-[120px] bg-white/5 rounded-lg animate-pulse" />}>
          <TradingChart
            data={timelineData}
            timeframe={timeframe}
            onTimeframeChange={setTimeframe}
            height={120}
            loading={timelineLoading}
            title="Vote Activity"
            titleInfo={chartTitleInfo}
            suggestedTimeframe={suggestedTimeframe}
            hasAnyData={hasAnyData}
            curveFilter={curveFilter}
            onCurveFilterChange={setCurveFilter}
            userPositionCurveId={userPositionCurveId}
          />
        </Suspense>
      </div>

      {/* UNIFIED TABS - All 4 tabs side by side */}
      <div className="flex-1 min-h-0 flex flex-col">
        {/* Single GooeySwitch with 4 tabs */}
        <div className="flex items-center justify-center mb-3 shrink-0">
          <GooeySwitch
            options={[
              { id: 'totems', label: 'Totems' },
              { id: 'creation', label: t('founderExpanded.creation') || 'Création' },
              { id: 'myVotes', label: t('header.nav.myVotes') },
              { id: 'bestTriples', label: 'Best Triples' },
            ]}
            value={activeTab}
            onChange={(id) => setActiveTab(id as 'totems' | 'creation' | 'myVotes' | 'bestTriples')}
            columns={4}
            className="w-full"
            renderOption={(option, isSelected) => (
              <div className="flex items-center justify-center px-1 py-0">
                <span className={`text-xs font-medium leading-none ${isSelected ? 'text-white' : 'text-white/60'}`}>
                  {option.label}
                </span>
              </div>
            )}
          />
        </div>

        {/* Unified Content Area */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden min-h-0 hide-scrollbar" style={{ overscrollBehavior: 'contain' }}>
          {/* TOTEMS TAB */}
          {activeTab === 'totems' && (
            loading ? (
              <div className="grid grid-cols-2 gap-2">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="bg-white/5 rounded-lg p-2 animate-pulse">
                    <div className="h-3 bg-white/10 rounded w-2/3 mb-1" />
                    <div className="h-2 bg-white/10 rounded w-1/3" />
                  </div>
                ))}
              </div>
            ) : allTotems.length > 0 ? (
              <GooeySwitch
                options={allTotems.map(t => ({ id: t.id, label: t.label, category: t.category, image: t.image }))}
                value={selectedTotemId || ''}
                onChange={(id) => {
                  const totem = allTotems.find(t => t.id === id);
                  if (totem) onSelectTotem?.(id, totem.label);
                }}
                columns={2}
                gap={8}
                padding={10}
                transparent={true}
                renderOption={(option, isSelected, index) => {
                  const userPosition = isConnected ? userPositionsByTotem.get(option.id) as UserPositionData | undefined : null;
                  return (
                    <TotemCard
                      label={option.label}
                      image={option.image as string | undefined}
                      category={option.category as string}
                      isSelected={isSelected}
                      index={index}
                      hasSelectedTotem={!!selectedTotemId}
                      isConnected={isConnected}
                      userPosition={userPosition ?? null}
                    />
                  );
                }}
              />
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <p className="text-white/50 text-xs">{t('founderExpanded.noTotemForFounder')}</p>
              </div>
            )
          )}

          {/* CRÉATION TAB */}
          {activeTab === 'creation' && (
            <TotemCreationForm
              onChange={(data) => onNewTotemChange?.(data)}
              dynamicCategories={dynamicCategories}
              existingTotems={ofcTotems}
              onTotemCreated={onTotemCreated}
            />
          )}

          {/* MY VOTES TAB */}
          {activeTab === 'myVotes' && (
            isConnected ? (
              votesLoading ? (
                <MyVotesSkeleton />
              ) : userVotes.length > 0 ? (
                (() => {
                  const validVotes = userVotes.filter((vote) => vote.term?.object?.term_id);
                  const selectedVoteId = selectedTotemId
                    ? validVotes.find(v => v.term.object.term_id === selectedTotemId)?.id || ''
                    : '';
                  return (
                    <GooeySwitch
                      options={validVotes.map((vote) => ({
                        id: vote.id,
                        label: vote.term.object.label,
                        vote,
                      }))}
                      value={selectedVoteId}
                      onChange={(id) => {
                        const vote = validVotes.find(v => v.id === id);
                        if (vote) onSelectTotem?.(vote.term.object.term_id, vote.term.object.label);
                      }}
                      columns={1}
                      gap={6}
                      padding={10}
                      transparent={true}
                      hideIndicator={true}
                      renderOption={(option, isSelected, index) => {
                        const vote = (option as unknown as { vote: UserVoteWithDetails }).vote;
                        const voteData: VoteDisplayData = {
                          subject: vote.term.subject,
                          predicate: vote.term.predicate,
                          object: vote.term.object,
                          isPositive: vote.isPositive,
                          signedAmount: vote.signedAmount,
                          curveId: vote.curveId,
                        };
                        return (
                          <MyVotesItem
                            vote={voteData}
                            isSelected={isSelected}
                            index={index}
                            hasSelectedTotem={!!selectedTotemId}
                          />
                        );
                      }}
                    />
                  );
                })()
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
          )}

          {/* BEST TRIPLES TAB */}
          {activeTab === 'bestTriples' && (
            bestTriples.length > 0 ? (
              <div className="space-y-1.5">
                {bestTriples.map((triple, index) => {
                  const total = BigInt(triple.forVotes) + BigInt(triple.againstVotes);
                  const percentage = totalTrust > 0n
                    ? Number((total * 100n) / totalTrust)
                    : 0;

                  return (
                    <BestTripleItem
                      key={triple.tripleTermId || `best-${index}`}
                      triple={triple}
                      percentage={percentage}
                      isSelected={triple.id === selectedTotemId}
                      onClick={() => onSelectTotem?.(triple.id, triple.objectLabel)}
                    />
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
