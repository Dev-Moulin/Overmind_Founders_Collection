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
import { useFounderProposals, type CurveId } from '../../hooks';
import { useVotesTimeline } from '../../hooks/data/useVotesTimeline';
import { useAllOFCTotems } from '../../hooks';
import { useUserVotesForFounder, type UserVoteWithDetails } from '../../hooks';
import { TradingChart, type Timeframe, type ChartTitleInfo } from '../graph/TradingChart';
import { useTopTotemsByCurve } from '../../hooks/data/useTopTotemsByCurve';
import { MyVotesSkeleton } from '../vote/MyVotesItem';
import { truncateAmount } from '../../utils/formatters';
import { filterValidTriples, type RawTriple } from '../../utils/tripleGuards';
import { TotemCreationForm, type NewTotemData } from './TotemCreationForm';
import type { CurveFilter } from '../../hooks/data/useVotesTimeline';
import { SUPPORT_COLORS, OPPOSE_COLORS, CURVE_COLORS } from '../../config/colors';
import { GooeySwitch } from '../common';

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

  // Aggregate user positions by totem (TRUST + shares) - separated by curve and direction
  const userPositionsByTotem = useMemo(() => {
    if (!userVotes || userVotes.length === 0) return new Map<string, {
      trust: bigint;
      shares: bigint;
      linearTrust: bigint;
      progressiveTrust: bigint;
      // Detailed positions by curve and direction
      linearSupport: bigint;
      linearOppose: bigint;
      progressiveSupport: bigint;
      progressiveOppose: bigint;
    }>();
    const map = new Map<string, {
      trust: bigint;
      shares: bigint;
      linearTrust: bigint;
      progressiveTrust: bigint;
      linearSupport: bigint;
      linearOppose: bigint;
      progressiveSupport: bigint;
      progressiveOppose: bigint;
    }>();

    for (const vote of userVotes) {
      const totemId = vote.term?.object?.term_id;
      if (!totemId) continue;

      const existing = map.get(totemId) || {
        trust: 0n,
        shares: 0n,
        linearTrust: 0n,
        progressiveTrust: 0n,
        linearSupport: 0n,
        linearOppose: 0n,
        progressiveSupport: 0n,
        progressiveOppose: 0n,
      };
      const voteAssets = BigInt(vote.assets_after_fees);
      existing.trust += voteAssets;
      existing.shares += BigInt(vote.shares);

      // Track by curve: 1 = Linear, 2 = Progressive
      if (vote.curveId === 1) {
        existing.linearTrust += voteAssets;
        if (vote.isPositive) {
          existing.linearSupport += voteAssets;
        } else {
          existing.linearOppose += voteAssets;
        }
      } else if (vote.curveId === 2) {
        existing.progressiveTrust += voteAssets;
        if (vote.isPositive) {
          existing.progressiveSupport += voteAssets;
        } else {
          existing.progressiveOppose += voteAssets;
        }
      }

      map.set(totemId, existing);
    }

    return map;
  }, [userVotes]);

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
  // Curve filter - use prop if controlled, otherwise use local state
  const [localCurveFilter, setLocalCurveFilter] = useState<CurveFilter>('progressive');
  const curveFilter = curveFilterProp ?? localCurveFilter;
  const setCurveFilter = onCurveFilterChange ?? setLocalCurveFilter;

  // Resizable divider state - height of section 1 in pixels (null = not initialized)
  const [section1Height, setSection1Height] = useState<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  // Store initial values when drag starts to use delta-based resizing (prevents jump)
  const dragStartRef = useRef<{ mouseY: number; height: number } | null>(null);

  // Initialize section1Height to ~50% of available space on first render
  // Use requestAnimationFrame to avoid forced reflow (getBoundingClientRect)
  useEffect(() => {
    if (section1Height === null && containerRef.current) {
      const container = containerRef.current;
      // Defer measurement to next animation frame to avoid layout thrashing
      const rafId = requestAnimationFrame(() => {
        if (!container) return;
        const containerRect = container.getBoundingClientRect();
        // Available space = container - chart (~156px) - footer (~40px) - divider (~32px) - margins (~20px)
        const chartAndOverhead = 248;
        const availableSpace = containerRect.height - chartAndOverhead;
        // Split 50/50 between sections
        const initialHeight = Math.max(80, availableSpace / 2);
        setSection1Height(initialHeight);
      });
      return () => cancelAnimationFrame(rafId);
    }
  }, [section1Height]);

  // Handle resize drag - store initial position for delta calculation
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    // Store initial mouse Y and current height to calculate delta during drag
    dragStartRef.current = {
      mouseY: e.clientY,
      height: section1Height ?? 150,
    };
    setIsDragging(true);
  }, [section1Height]);

  useEffect(() => {
    if (!isDragging || !dragStartRef.current) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current || !dragStartRef.current) return;

      // Use cached container height to avoid repeated getBoundingClientRect calls during drag
      const containerRect = containerRef.current.getBoundingClientRect();

      // Delta-based resize: calculate how much mouse moved since drag started
      const deltaY = e.clientY - dragStartRef.current.mouseY;
      const newHeight = dragStartRef.current.height + deltaY;

      // Calculate max height dynamically: container height - overhead - section2 minimum (100px)
      const chartAndOverhead = 248;
      const maxHeight = containerRect.height - chartAndOverhead - 100;

      // Clamp between min (60px) and dynamic max
      const clampedHeight = Math.max(60, Math.min(maxHeight, newHeight));
      setSection1Height(clampedHeight);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      dragStartRef.current = null;
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

  // Trading chart data - filtered by selected totem and curve filter
  const {
    data: timelineData,
    loading: timelineLoading,
    suggestedTimeframe,
    hasAnyData,
  } = useVotesTimeline(founder.name, timeframe, selectedTotemId, curveFilter);

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
      <div className="mb-3 shrink-0">
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
      </div>

      {/* SECTION 1: Totems / Création */}
      <div className="shrink-0" style={{ height: section1Height ?? 150 }}>
        {/* Section 1 Tabs - GooeySwitch */}
        <div className="flex items-center justify-between mb-2">
          <GooeySwitch
            options={[
              { id: 'totems', label: 'Totems' },
              { id: 'creation', label: t('founderExpanded.creation') || 'Création' },
            ]}
            value={section1Tab}
            onChange={(id) => setSection1Tab(id as 'totems' | 'creation')}
            columns={2}
            className="w-fit"
            renderOption={(option, isSelected) => (
              <div className="flex items-center justify-center px-0 py-0">
                <span className={`text-sm font-medium leading-none ${isSelected ? 'text-white' : 'text-white/60'}`}>
                  {option.label}
                </span>
              </div>
            )}
          />
        </div>

        {/* Section 1 Content - height adapts to section1Height minus tabs (~32px) */}
        <div className="overflow-y-auto overflow-x-hidden hide-scrollbar" style={{ height: (section1Height ?? 150) - 32, overscrollBehavior: 'contain' }}>
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
              <GooeySwitch
                options={allTotems.map(t => ({ id: t.id, label: t.label, category: t.category }))}
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
                  const userPosition = isConnected ? userPositionsByTotem.get(option.id) : null;
                  const hasTrust = userPosition && userPosition.trust > 0n;
                  const trustValue = hasTrust ? parseFloat(formatEther(userPosition.trust)) : 0;
                  const sharesValue = hasTrust ? parseFloat(formatEther(userPosition.shares)) : 0;

                  // Cascade pulse effect when no totem selected
                  const rowIndex = Math.floor(index / 2);
                  const cascadeClass = !selectedTotemId
                    ? `cascade-pulse cascade-delay-${Math.min(rowIndex, 7)}`
                    : '';

                  // Position details for expanded view
                  const linearSupportValue = userPosition ? parseFloat(formatEther(userPosition.linearSupport)) : 0;
                  const linearOpposeValue = userPosition ? parseFloat(formatEther(userPosition.linearOppose)) : 0;
                  const progressiveSupportValue = userPosition ? parseFloat(formatEther(userPosition.progressiveSupport)) : 0;
                  const progressiveOpposeValue = userPosition ? parseFloat(formatEther(userPosition.progressiveOppose)) : 0;

                  // Should expand details when selected AND has positions
                  const shouldExpand = isSelected && hasTrust;

                  return (
                    <div className={`text-left p-2 rounded-lg transition-all ${
                      isSelected
                        ? 'bg-slate-500/30 ring-1 ring-slate-500/50 animate-ring-pulse'
                        : `bg-white/5 hover:bg-white/10 ${cascadeClass}`
                    }`}>
                      {/* Header: Totem name + Category */}
                      <div className="flex items-start justify-between gap-1">
                        <span className={`text-sm font-medium truncate flex-1 ${isSelected ? 'text-white' : 'text-white/80'}`}>
                          {option.label}
                        </span>
                        <span className="text-xs text-white/40 truncate max-w-[60px]">
                          {(option.category as string) || ''}
                        </span>
                      </div>
                      {/* User position (only if connected) */}
                      {isConnected && (
                        <div className="flex items-center gap-1.5 mt-1 text-xs">
                          <span className={hasTrust ? 'text-cyan-400' : 'text-white/30'}>
                            {truncateAmount(trustValue)} TRUST
                          </span>
                          <span className="text-white/20">·</span>
                          <span className={hasTrust ? 'text-white/60' : 'text-white/30'}>
                            {truncateAmount(sharesValue, 2)} shares
                          </span>
                          {/* Position badges [S/O] [L/P] */}
                          {userPosition && (userPosition.linearTrust > 0n || userPosition.progressiveTrust > 0n) && (
                            <>
                              <span className="text-white/20">·</span>
                              {userPosition.linearSupport > 0n && (
                                <span className="flex gap-0.5">
                                  <span className="w-4 h-4 flex items-center justify-center rounded text-[10px] font-bold" style={{ backgroundColor: `${SUPPORT_COLORS.base}30`, color: SUPPORT_COLORS.base }}>S</span>
                                  <span className="w-4 h-4 flex items-center justify-center rounded text-[10px] font-bold" style={{ backgroundColor: `${SUPPORT_COLORS.base}20`, color: SUPPORT_COLORS.base }}>L</span>
                                </span>
                              )}
                              {userPosition.linearOppose > 0n && (
                                <span className="flex gap-0.5">
                                  <span className="w-4 h-4 flex items-center justify-center rounded text-[10px] font-bold" style={{ backgroundColor: `${OPPOSE_COLORS.base}30`, color: OPPOSE_COLORS.base }}>O</span>
                                  <span className="w-4 h-4 flex items-center justify-center rounded text-[10px] font-bold" style={{ backgroundColor: `${OPPOSE_COLORS.base}20`, color: OPPOSE_COLORS.base }}>L</span>
                                </span>
                              )}
                              {userPosition.progressiveSupport > 0n && (
                                <span className="flex gap-0.5">
                                  <span className="w-4 h-4 flex items-center justify-center rounded text-[10px] font-bold" style={{ backgroundColor: `${SUPPORT_COLORS.base}30`, color: SUPPORT_COLORS.base }}>S</span>
                                  <span className="w-4 h-4 flex items-center justify-center rounded text-[10px] font-bold" style={{ backgroundColor: `${SUPPORT_COLORS.base}20`, color: SUPPORT_COLORS.base }}>P</span>
                                </span>
                              )}
                              {userPosition.progressiveOppose > 0n && (
                                <span className="flex gap-0.5">
                                  <span className="w-4 h-4 flex items-center justify-center rounded text-[10px] font-bold" style={{ backgroundColor: `${OPPOSE_COLORS.base}30`, color: OPPOSE_COLORS.base }}>O</span>
                                  <span className="w-4 h-4 flex items-center justify-center rounded text-[10px] font-bold" style={{ backgroundColor: `${OPPOSE_COLORS.base}20`, color: OPPOSE_COLORS.base }}>P</span>
                                </span>
                              )}
                            </>
                          )}
                        </div>
                      )}

                      {/* Expanded Details - Animated open/close */}
                      {hasTrust && (
                        <div className={`overflow-hidden transition-all duration-500 ease-out ${
                          shouldExpand ? 'max-h-24 opacity-100 mt-2' : 'max-h-0 opacity-0 mt-0'
                        }`}>
                          <div className="border-t border-white/10 pt-2 space-y-1">
                            {linearSupportValue > 0 && (
                              <div className="flex justify-between items-center text-xs">
                                <span>
                                  <span className="font-medium" style={{ color: SUPPORT_COLORS.base }}>Support</span>
                                  <span className="ml-1" style={{ color: `${CURVE_COLORS.linear.text}B0` }}>Linear</span>
                                </span>
                                <span className="text-white/80 font-medium">{truncateAmount(linearSupportValue)}</span>
                              </div>
                            )}
                            {linearOpposeValue > 0 && (
                              <div className="flex justify-between items-center text-xs">
                                <span>
                                  <span className="font-medium" style={{ color: OPPOSE_COLORS.base }}>Oppose</span>
                                  <span className="ml-1" style={{ color: `${CURVE_COLORS.linear.text}B0` }}>Linear</span>
                                </span>
                                <span className="text-white/80 font-medium">{truncateAmount(linearOpposeValue)}</span>
                              </div>
                            )}
                            {progressiveSupportValue > 0 && (
                              <div className="flex justify-between items-center text-xs">
                                <span>
                                  <span className="font-medium" style={{ color: SUPPORT_COLORS.base }}>Support</span>
                                  <span className="ml-1" style={{ color: `${CURVE_COLORS.progressive.text}B0` }}>Progressive</span>
                                </span>
                                <span className="text-white/80 font-medium">{truncateAmount(progressiveSupportValue)}</span>
                              </div>
                            )}
                            {progressiveOpposeValue > 0 && (
                              <div className="flex justify-between items-center text-xs">
                                <span>
                                  <span className="font-medium" style={{ color: OPPOSE_COLORS.base }}>Oppose</span>
                                  <span className="ml-1" style={{ color: `${CURVE_COLORS.progressive.text}B0` }}>Progressive</span>
                                </span>
                                <span className="text-white/80 font-medium">{truncateAmount(progressiveOpposeValue)}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                }}
              />
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
        <div className="absolute inset-x-0 top-0 h-1/2 bg-linear-to-b from-[#0f172a]/80 to-white/5 backdrop-blur-md" />
        {/* Bottom fade: blur to transparent (blends with My Votes) */}
        <div className="absolute inset-x-0 bottom-0 h-1/2 bg-linear-to-b from-white/5 to-transparent backdrop-blur-sm" />
        {/* Drag handle indicator */}
        <div className={`relative z-10 w-10 h-1.5 rounded-full transition-colors ${
          isDragging ? 'bg-white/50' : 'bg-white/25 group-hover:bg-white/40'
        }`} />
      </div>

      {/* SECTION 2: My Votes / Best Triples */}
      <div className="flex-1 min-h-0 flex flex-col pt-1">
        {/* Section 2 Tabs - GooeySwitch */}
        <div className="flex items-center justify-between mb-3">
          <GooeySwitch
            options={[
              { id: 'myVotes', label: t('header.nav.myVotes') },
              { id: 'bestTriples', label: 'Best Triples' },
            ]}
            value={section2Tab}
            onChange={(id) => setSection2Tab(id as 'myVotes' | 'bestTriples')}
            columns={2}
            className="w-fit"
            renderOption={(option, isSelected) => (
              <div className="flex items-center justify-center px-0 py-0">
                <span className={`text-sm font-medium leading-none ${isSelected ? 'text-white' : 'text-white/60'}`}>
                  {option.label}
                </span>
              </div>
            )}
          />
        </div>

        {/* Section 2 Content */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden min-h-0 hide-scrollbar" style={{ overscrollBehavior: 'contain' }}>
          {section2Tab === 'myVotes' ? (
            // My Votes - User's votes on this founder (GooeySwitch style like totem grid)
            isConnected ? (
              votesLoading ? (
                <MyVotesSkeleton />
              ) : userVotes.length > 0 ? (
                (() => {
                  // Filter valid votes
                  const validVotes = userVotes.filter((vote) => vote.term?.object?.term_id);
                  // Find the selected vote id (first vote matching selectedTotemId)
                  const selectedVoteId = selectedTotemId
                    ? validVotes.find(v => v.term.object.term_id === selectedTotemId)?.id || ''
                    : '';
                  return (
                    <GooeySwitch
                      options={validVotes.map((vote) => ({
                        id: vote.id,
                        label: vote.term.object.label,
                        vote, // Pass full vote data for renderOption
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
                        const { term, isPositive, signedAmount, curveId } = vote;
                        const directionLabel = isPositive ? 'S' : 'O';
                        const curveLabel = curveId === 1 ? 'L' : 'P';
                        const directionColors = isPositive ? SUPPORT_COLORS : OPPOSE_COLORS;

                        // Cascade pulse effect when no totem selected
                        const cascadeClass = !selectedTotemId
                          ? `cascade-pulse cascade-delay-${Math.min(index, 7)}`
                          : '';

                        return (
                          <div className={`text-left p-2.5 rounded-lg transition-all ${
                            isSelected
                              ? 'ring-1 animate-ring-pulse'
                              : `bg-white/5 hover:bg-white/10 ${cascadeClass}`
                          }`}
                          style={isSelected ? {
                            backgroundColor: `${directionColors.base}20`,
                            boxShadow: `0 0 0 1px ${directionColors.base}50`,
                          } : undefined}
                          >
                            <div className="flex items-center justify-between gap-2">
                              {/* Triple: Subject - Predicate - Object (Tags/Bulles style) */}
                              <div className="flex items-center gap-1.5 min-w-0 flex-1 flex-wrap">
                                {/* Subject Tag */}
                                <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-white/10 rounded-full shrink-0">
                                  {term.subject.image ? (
                                    <img
                                      src={term.subject.image}
                                      alt={term.subject.label}
                                      className="w-5 h-5 rounded object-cover shrink-0"
                                      onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                                    />
                                  ) : (
                                    <div className="w-5 h-5 rounded bg-white/10 flex items-center justify-center shrink-0">
                                      <span className="text-[10px]">{term.subject.emoji || term.subject.label.charAt(0).toUpperCase()}</span>
                                    </div>
                                  )}
                                  <span className="text-xs text-white/80 truncate max-w-[60px]">
                                    {term.subject.label.split(' ')[0]}
                                  </span>
                                </div>

                                <span className="text-white/30 text-xs shrink-0">-</span>

                                {/* Predicate Tag */}
                                <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-500/30 rounded-full shrink-0">
                                  {term.predicate.image ? (
                                    <img
                                      src={term.predicate.image}
                                      alt={term.predicate.label}
                                      className="w-5 h-5 rounded object-cover shrink-0"
                                      onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                                    />
                                  ) : (
                                    <div className="w-5 h-5 rounded bg-white/10 flex items-center justify-center shrink-0">
                                      <span className="text-[10px]">{term.predicate.emoji || term.predicate.label.charAt(0).toUpperCase()}</span>
                                    </div>
                                  )}
                                  <span className="text-xs text-slate-300 truncate max-w-[70px]">
                                    {term.predicate.label}
                                  </span>
                                </div>

                                <span className="text-white/30 text-xs shrink-0">-</span>

                                {/* Object (Totem) Tag */}
                                <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-white/10 rounded-full min-w-0">
                                  {term.object.image ? (
                                    <img
                                      src={term.object.image}
                                      alt={term.object.label}
                                      className="w-5 h-5 rounded object-cover shrink-0"
                                      onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                                    />
                                  ) : (
                                    <div className="w-5 h-5 rounded bg-white/10 flex items-center justify-center shrink-0">
                                      <span className="text-[10px]">{term.object.emoji || term.object.label.charAt(0).toUpperCase()}</span>
                                    </div>
                                  )}
                                  <span className="text-xs text-white font-medium truncate">
                                    {term.object.label}
                                  </span>
                                </div>
                              </div>

                              {/* Amount + Direction/Curve badges */}
                              <div className="flex items-center gap-1 shrink-0">
                                <span className="text-sm font-medium" style={{ color: directionColors.base }}>
                                  {signedAmount}
                                </span>
                                {/* Direction badge: S (Support) or O (Oppose) */}
                                <span
                                  className="text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded"
                                  style={{ backgroundColor: `${directionColors.base}30`, color: directionColors.base }}
                                >
                                  {directionLabel}
                                </span>
                                {/* Curve badge: L (Linear) or P (Progressive) */}
                                <span
                                  className="text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded"
                                  style={{ backgroundColor: `${directionColors.base}20`, color: directionColors.base }}
                                >
                                  {curveLabel}
                                </span>
                              </div>
                            </div>
                          </div>
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
                      <div className="flex items-center justify-between gap-2">
                        {/* Triple: Subject → Predicate → Object (Tags/Bulles style with images) */}
                        <div className="flex items-center gap-1.5 min-w-0 flex-1 flex-wrap">
                          {/* Subject Tag */}
                          <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-white/10 rounded-full shrink-0">
                            {totem.subjectImage ? (
                              <img
                                src={totem.subjectImage}
                                alt={totem.subjectLabel}
                                className="w-5 h-5 rounded object-cover shrink-0"
                                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                              />
                            ) : (
                              <div className="w-5 h-5 rounded bg-white/10 flex items-center justify-center shrink-0">
                                <span className="text-[10px]">{totem.subjectEmoji || totem.subjectLabel.charAt(0).toUpperCase()}</span>
                              </div>
                            )}
                            <span className="text-xs text-white/80 truncate max-w-[60px]">
                              {totem.subjectLabel.split(' ')[0]}
                            </span>
                          </div>
                          <span className="text-white/40 text-lg shrink-0">→</span>
                          {/* Predicate Tag */}
                          <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-500/30 rounded-full shrink-0">
                            {totem.predicateImage ? (
                              <img
                                src={totem.predicateImage}
                                alt={totem.predicateLabel}
                                className="w-5 h-5 rounded object-cover shrink-0"
                                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                              />
                            ) : (
                              <div className="w-5 h-5 rounded bg-white/10 flex items-center justify-center shrink-0">
                                <span className="text-[10px]">{totem.predicateEmoji || totem.predicateLabel.charAt(0).toUpperCase()}</span>
                              </div>
                            )}
                            <span className="text-xs text-slate-300 truncate max-w-[70px]">
                              {totem.predicateLabel}
                            </span>
                          </div>
                          <span className="text-white/40 text-lg shrink-0">→</span>
                          {/* Object (Totem) Tag */}
                          <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-white/10 rounded-full min-w-0">
                            {totem.objectImage ? (
                              <img
                                src={totem.objectImage}
                                alt={totem.objectLabel}
                                className="w-5 h-5 rounded object-cover shrink-0"
                                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                              />
                            ) : (
                              <div className="w-5 h-5 rounded bg-white/10 flex items-center justify-center shrink-0">
                                <span className="text-[10px]">{totem.objectEmoji || totem.objectLabel.charAt(0).toUpperCase()}</span>
                              </div>
                            )}
                            <span className="text-xs text-white font-medium truncate">
                              {totem.objectLabel}
                            </span>
                          </div>
                        </div>
                        <span className="text-xs text-slate-400 shrink-0">
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
