import { useMemo, useEffect, useRef } from 'react';
import { useQuery } from '@apollo/client';
import { formatEther } from 'viem';
import foundersData from '../../../../../packages/shared/src/data/founders.json';
import type { FounderData, TrendDirection, WinningTotem, FounderForHomePage, CurveWinnerInfo } from '../../types/founder';
import { GET_ATOMS_BY_LABELS, GET_ALL_PROPOSALS, GET_DEPOSITS_BY_TERM_IDS } from '../../lib/graphql/queries';
import type { Triple, GetDepositsByTermIdsResult } from '../../lib/graphql/types';
import { aggregateTriplesByObject } from '../../utils/aggregateVotes';
import type { TopTotem } from '../data/useTopTotems';
import { useAllOFCTotems } from './useAllOFCTotems';
import { getCacheFetchPolicy, FIVE_MINUTES } from '../../lib/queryCacheTTL';

// Re-export for backward compatibility
export type { TrendDirection, WinningTotem, FounderForHomePage, CurveWinnerInfo };

interface AtomResult {
  term_id: string;
  label: string;
}

interface AtomsQueryResult {
  atoms: AtomResult[];
}

interface ProposalsQueryResult {
  triples: Triple[];
}

/**
 * Convert wei string to ETH number
 */
function weiToEth(weiStr: string): number {
  return parseFloat(formatEther(BigInt(weiStr)));
}

/**
 * Hook to get all 42 founders with their atomIds, winning totems, and top totems
 *
 * Uses BATCHED queries to avoid rate limiting:
 * - 1 query for all atoms (GET_ATOMS_BY_LABELS)
 * - 1 query for all proposals (GET_ALL_PROPOSALS)
 * - 1 query for all deposits (GET_DEPOSITS_BY_TERM_IDS) - batched!
 *
 * This replaces 42 individual useTopTotems calls with a single batched approach.
 *
 * @example
 * ```tsx
 * function HomePage() {
 *   const { founders, loading, stats, topTotemsMap } = useFoundersForHomePage();
 *
 *   return (
 *     <div className="grid grid-cols-4 gap-4">
 *       {founders.map(founder => (
 *         <FounderHomeCard
 *           key={founder.id}
 *           founder={founder}
 *           topTotems={topTotemsMap.get(founder.name) || []}
 *         />
 *       ))}
 *     </div>
 *   );
 * }
 * ```
 */
export function useFoundersForHomePage() {
  const startTime = useRef(performance.now());
  const hasLogged = useRef(false);

  const founders = foundersData as FounderData[];
  const founderNames = founders.map((f) => f.name);

  // Query 1: Get atomIds for all founders
  const {
    data: atomsData,
    loading: atomsLoading,
    error: atomsError,
  } = useQuery<AtomsQueryResult>(GET_ATOMS_BY_LABELS, {
    variables: { labels: founderNames },
    fetchPolicy: 'cache-first',
  });

  // TTL-based cache policy: only fetch if data is older than 5 minutes
  const proposalsFetchPolicy = getCacheFetchPolicy(
    'GetAllProposals',
    {}, // No variables
    FIVE_MINUTES
  );

  // Query 2: Get all proposals (triples)
  const {
    data: proposalsData,
    loading: proposalsLoading,
    error: proposalsError,
  } = useQuery<ProposalsQueryResult>(GET_ALL_PROPOSALS, {
    // TTL-based: 'cache-first' if fresh, 'cache-and-network' if stale
    fetchPolicy: proposalsFetchPolicy,
    nextFetchPolicy: 'cache-first',
  });

  // Get OFC category map for filtering
  const { categoryMap, loading: categoryLoading } = useAllOFCTotems();

  // Filter triples to only include OFC totems
  const filteredTriples = useMemo(() => {
    if (!proposalsData?.triples) return [];
    return proposalsData.triples.filter((t) => {
      // Only keep triples where the totem (object) has an OFC category
      return t.object?.term_id && categoryMap.has(t.object.term_id);
    });
  }, [proposalsData?.triples, categoryMap]);

  // Extract all term_ids AND counter_term_ids from filtered OFC proposals for batched deposits query
  // We need BOTH to properly track FOR (term_id) and AGAINST (counter_term_id) votes
  const allTermIds = useMemo(() => {
    if (filteredTriples.length === 0) return [];
    const ids: string[] = [];
    filteredTriples.forEach((t) => {
      ids.push(t.term_id);
      if (t.counter_term?.id) {
        ids.push(t.counter_term.id);
      }
    });
    return ids;
  }, [filteredTriples]);

  // Create a map: termId/counterTermId -> { tripleTermId, isFor }
  // This allows us to know if a deposit is FOR or AGAINST based on which term_id it's on
  const termToTripleMap = useMemo(() => {
    const map = new Map<string, { tripleTermId: string; isFor: boolean }>();
    if (filteredTriples.length === 0) return map;
    filteredTriples.forEach((t) => {
      map.set(t.term_id, { tripleTermId: t.term_id, isFor: true });
      if (t.counter_term?.id) {
        map.set(t.counter_term.id, { tripleTermId: t.term_id, isFor: false });
      }
    });
    return map;
  }, [filteredTriples]);

  // TTL-based cache policy for deposits (batched for all founders)
  const depositsFetchPolicy = getCacheFetchPolicy(
    'GetDepositsByTermIds_AllFounders',
    {}, // No variables needed - batched for all founders
    FIVE_MINUTES
  );

  // Query 3: BATCHED deposits query - ONE query for ALL triples (term_id + counter_term_id)
  // This replaces 42 individual queries that caused 429 rate limiting
  const {
    data: depositsData,
    loading: depositsLoading,
  } = useQuery<GetDepositsByTermIdsResult>(GET_DEPOSITS_BY_TERM_IDS, {
    variables: { termIds: allTermIds },
    skip: allTermIds.length === 0,
    // TTL-based: 'cache-first' if fresh, 'cache-and-network' if stale
    fetchPolicy: depositsFetchPolicy,
    nextFetchPolicy: 'cache-first',
  });

  // Process data
  const result = useMemo(() => {
    // Create atomId map
    const atomIdMap = new Map<string, string>();
    if (atomsData?.atoms) {
      atomsData.atoms.forEach((atom) => {
        atomIdMap.set(atom.label, atom.term_id);
      });
    }

    // Create winning totem map by founder name
    const winningTotemMap = new Map<string, WinningTotem>();
    const proposalCountMap = new Map<string, number>();
    const recentActivityMap = new Map<string, number>();

    // NEW: Map of founder name -> TopTotem[] for batched top totems
    const topTotemsMap = new Map<string, TopTotem[]>();

    // NEW: Curve winners per founder
    const linearWinnerMap = new Map<string, CurveWinnerInfo>();
    const progressiveWinnerMap = new Map<string, CurveWinnerInfo>();

    // Build wallet counts map from batched deposits: term_id -> { forWallets: Set, againstWallets: Set }
    const walletCountsMap = new Map<string, { forWallets: Set<string>; againstWallets: Set<string> }>();

    // NEW: Build curve-specific stats map: tripleTermId -> { linear: {...}, progressive: {...} }
    // IMPORTANT: We use termToTripleMap to:
    // 1. Find the original triple term_id for both term_id and counter_term_id deposits
    // 2. Determine if a deposit is FOR (term_id) or AGAINST (counter_term_id)
    interface CurveDepositStats {
      trustFor: number;
      trustAgainst: number;
      walletsFor: Set<string>;
      walletsAgainst: Set<string>;
    }
    const curveStatsMap = new Map<string, { linear: CurveDepositStats; progressive: CurveDepositStats }>();

    if (depositsData?.deposits) {
      depositsData.deposits.forEach((deposit) => {
        // Use termToTripleMap to find the original triple and determine FOR/AGAINST
        const termInfo = termToTripleMap.get(deposit.term_id);
        if (!termInfo) return; // Deposit doesn't belong to any known triple

        const { tripleTermId, isFor } = termInfo;

        // Standard wallet counts (backwards compatibility) - keyed by original triple term_id
        if (!walletCountsMap.has(tripleTermId)) {
          walletCountsMap.set(tripleTermId, { forWallets: new Set(), againstWallets: new Set() });
        }
        const counts = walletCountsMap.get(tripleTermId)!;
        if (isFor) {
          counts.forWallets.add(deposit.sender_id.toLowerCase());
        } else {
          counts.againstWallets.add(deposit.sender_id.toLowerCase());
        }

        // NEW: Curve-specific stats - keyed by original triple term_id
        if (!curveStatsMap.has(tripleTermId)) {
          curveStatsMap.set(tripleTermId, {
            linear: { trustFor: 0, trustAgainst: 0, walletsFor: new Set(), walletsAgainst: new Set() },
            progressive: { trustFor: 0, trustAgainst: 0, walletsFor: new Set(), walletsAgainst: new Set() },
          });
        }
        const curveStats = curveStatsMap.get(tripleTermId)!;
        const curveId = deposit.curve_id || '1'; // Default to Linear
        const isLinear = curveId === '1';
        const stats = isLinear ? curveStats.linear : curveStats.progressive;
        const assets = weiToEth(deposit.assets_after_fees || '0');

        if (isFor) {
          stats.trustFor += assets;
          stats.walletsFor.add(deposit.sender_id.toLowerCase());
        } else {
          stats.trustAgainst += assets;
          stats.walletsAgainst.add(deposit.sender_id.toLowerCase());
        }
      });
    }

    // Calculate 24 hours ago timestamp
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    if (filteredTriples.length > 0) {
      // Group triples by founder (subject.label)
      const founderTriples = new Map<string, Triple[]>();
      filteredTriples.forEach((triple) => {
        const founderName = triple.subject.label;
        if (!founderTriples.has(founderName)) {
          founderTriples.set(founderName, []);
        }
        founderTriples.get(founderName)!.push(triple);
      });

      // For each founder, calculate winning totem, recent activity, and top totems
      founderTriples.forEach((triples, founderName) => {
        // Count recent triples (created in last 24h)
        const recentCount = triples.filter((t) => {
          if (!t.created_at) return false;
          const createdAt = new Date(t.created_at);
          return createdAt > twentyFourHoursAgo;
        }).length;
        recentActivityMap.set(founderName, recentCount);

        // Convert to format expected by aggregateTriplesByObject
        const formattedTriples = triples.map((t) => ({
          term_id: t.term_id,
          predicate: { term_id: t.predicate?.term_id || '', label: t.predicate?.label || '' },
          object: t.object,
          triple_vault: { total_assets: t.triple_vault?.total_assets || '0' },
          counter_term: { id: '', total_assets: t.counter_term?.total_assets || '0' },
        }));

        // Aggregate by totem
        const aggregatedTotems = aggregateTriplesByObject(formattedTriples);

        // Store proposal count (unique totems)
        proposalCountMap.set(founderName, aggregatedTotems.length);

        // Calculate TopTotems with wallet counts from batched deposits
        const topTotems: TopTotem[] = [];

        // Build a map of totemId -> wallet counts by aggregating from triples
        const totemWalletsMap = new Map<string, { forWallets: Set<string>; againstWallets: Set<string> }>();

        // For each triple of this founder, aggregate wallet counts by totem (object)
        triples.forEach((triple) => {
          if (!triple.object) return;
          const totemId = triple.object.term_id;
          const tripleWallets = walletCountsMap.get(triple.term_id);

          if (!totemWalletsMap.has(totemId)) {
            totemWalletsMap.set(totemId, { forWallets: new Set(), againstWallets: new Set() });
          }

          const totemWallets = totemWalletsMap.get(totemId)!;
          if (tripleWallets) {
            tripleWallets.forWallets.forEach((w) => totemWallets.forWallets.add(w));
            tripleWallets.againstWallets.forEach((w) => totemWallets.againstWallets.add(w));
          }
        });

        // Convert aggregated totems to TopTotem format
        aggregatedTotems.forEach((agg) => {
          const trustFor = weiToEth(agg.totalFor.toString());
          const trustAgainst = weiToEth(agg.totalAgainst.toString());
          const totemWallets = totemWalletsMap.get(agg.objectId);
          const walletsFor = totemWallets?.forWallets.size || 0;
          const walletsAgainst = totemWallets?.againstWallets.size || 0;
          // Calculate unique wallets (same wallet voting FOR and AGAINST = 1)
          const uniqueWallets = totemWallets
            ? new Set([...totemWallets.forWallets, ...totemWallets.againstWallets]).size
            : 0;

          topTotems.push({
            id: agg.objectId,
            label: agg.object.label,
            image: agg.object.image,
            trustFor,
            trustAgainst,
            totalTrust: trustFor + trustAgainst,
            netScore: trustFor - trustAgainst,
            walletsFor,
            walletsAgainst,
            totalWallets: uniqueWallets,
            netVotes: walletsFor - walletsAgainst,
          });
        });

        // Sort by totalTrust and take top 5
        const sortedTopTotems = topTotems
          .sort((a, b) => b.totalTrust - a.totalTrust)
          .slice(0, 5);

        topTotemsMap.set(founderName, sortedTopTotems);

        // NEW: Calculate curve-specific winners for this founder
        // Aggregate curve stats by totem (object)
        interface TotemCurveStats {
          totemId: string;
          label: string;
          image?: string;
          linear: { netScore: number; netVotes: number };
          progressive: { netScore: number; netVotes: number };
        }
        const totemCurveStatsMap = new Map<string, TotemCurveStats>();

        triples.forEach((triple) => {
          if (!triple.object) return;
          const totemId = triple.object.term_id;
          const tripleStats = curveStatsMap.get(triple.term_id);

          if (!totemCurveStatsMap.has(totemId)) {
            totemCurveStatsMap.set(totemId, {
              totemId,
              label: triple.object.label,
              image: triple.object.image,
              linear: { netScore: 0, netVotes: 0 },
              progressive: { netScore: 0, netVotes: 0 },
            });
          }

          const totemStats = totemCurveStatsMap.get(totemId)!;
          if (tripleStats) {
            // Linear
            totemStats.linear.netScore += tripleStats.linear.trustFor - tripleStats.linear.trustAgainst;
            totemStats.linear.netVotes += tripleStats.linear.walletsFor.size - tripleStats.linear.walletsAgainst.size;
            // Progressive
            totemStats.progressive.netScore += tripleStats.progressive.trustFor - tripleStats.progressive.trustAgainst;
            totemStats.progressive.netVotes += tripleStats.progressive.walletsFor.size - tripleStats.progressive.walletsAgainst.size;
          }
        });

        // Find Linear winner (highest netScore on Linear curve)
        const totemCurveStatsList = Array.from(totemCurveStatsMap.values());
        const linearSorted = [...totemCurveStatsList].sort((a, b) => b.linear.netScore - a.linear.netScore);
        if (linearSorted.length > 0 && (linearSorted[0].linear.netScore !== 0 || linearSorted[0].linear.netVotes !== 0)) {
          linearWinnerMap.set(founderName, {
            totemId: linearSorted[0].totemId,
            label: linearSorted[0].label,
            image: linearSorted[0].image,
            netScore: linearSorted[0].linear.netScore,
            netVotes: linearSorted[0].linear.netVotes,
          });
        }

        // Find Progressive winner (highest netScore on Progressive curve)
        const progressiveSorted = [...totemCurveStatsList].sort((a, b) => b.progressive.netScore - a.progressive.netScore);
        if (progressiveSorted.length > 0 && (progressiveSorted[0].progressive.netScore !== 0 || progressiveSorted[0].progressive.netVotes !== 0)) {
          progressiveWinnerMap.set(founderName, {
            totemId: progressiveSorted[0].totemId,
            label: progressiveSorted[0].label,
            image: progressiveSorted[0].image,
            netScore: progressiveSorted[0].progressive.netScore,
            netVotes: progressiveSorted[0].progressive.netVotes,
          });
        }

        // Winning totem is the one with highest NET score (already sorted in aggregatedTotems)
        if (aggregatedTotems.length > 0) {
          const winner = aggregatedTotems[0];

          // Calculate trend based on FOR/AGAINST ratio
          const total = winner.totalFor + winner.totalAgainst;
          let trend: TrendDirection = 'neutral';
          if (total > 0n) {
            const forPercentage = Number((winner.totalFor * 100n) / total);
            if (forPercentage > 60) {
              trend = 'up';
            } else if (forPercentage < 40) {
              trend = 'down';
            }
          }

          winningTotemMap.set(founderName, {
            objectId: winner.objectId,
            label: winner.object.label,
            image: winner.object.image,
            netScore: winner.netScore,
            totalFor: winner.totalFor,
            totalAgainst: winner.totalAgainst,
            claimCount: winner.claimCount,
            trend,
          });
        }
      });
    }

    // Combine all data for each founder
    const enrichedFounders: FounderForHomePage[] = founders.map((founder) => ({
      ...founder,
      atomId: atomIdMap.get(founder.name),
      winningTotem: winningTotemMap.get(founder.name) || null,
      proposalCount: proposalCountMap.get(founder.name) || 0,
      recentActivityCount: recentActivityMap.get(founder.name) || 0,
      // NEW: Curve-specific winners
      linearWinner: linearWinnerMap.get(founder.name) || null,
      progressiveWinner: progressiveWinnerMap.get(founder.name) || null,
    }));

    // Sort alphabetically by last name for carousel navigation
    enrichedFounders.sort((a, b) => {
      const getLastName = (name: string) => {
        const parts = name.split(' ');
        return parts.length > 1 ? parts[parts.length - 1] : parts[0];
      };
      return getLastName(a.name).localeCompare(getLastName(b.name));
    });

    // Calculate stats
    const foundersWithTotems = enrichedFounders.filter((f) => f.winningTotem).length;
    const totalProposals = Array.from(proposalCountMap.values()).reduce((sum, count) => sum + count, 0);

    // Total $TRUST voted across all totems
    let totalTrustVoted = 0;
    topTotemsMap.forEach((totems) => {
      totems.forEach((t) => { totalTrustVoted += t.totalTrust; });
    });

    // Unique voters across all deposits
    const allVoters = new Set<string>();
    walletCountsMap.forEach((wallets) => {
      wallets.forWallets.forEach((w) => allVoters.add(w));
      wallets.againstWallets.forEach((w) => allVoters.add(w));
    });

    return {
      founders: enrichedFounders,
      stats: {
        totalTrustVoted,
        uniqueVoters: allVoters.size,
        foundersWithTotems,
        totalProposals,
      },
      topTotemsMap,
    };
  }, [founders, atomsData, filteredTriples, depositsData, termToTripleMap]);

  // Memoize combined loading and error states (includes category loading for OFC filtering)
  const loading = atomsLoading || proposalsLoading || categoryLoading || depositsLoading;
  const error = useMemo(() => atomsError || proposalsError || null, [atomsError, proposalsError]);

  // Performance measurement: log total loading time once
  useEffect(() => {
    if (!loading && !hasLogged.current) {
      hasLogged.current = true;
      const elapsed = performance.now() - startTime.current;
      console.log(
        `%c[PERF] useFoundersForHomePage loaded in ${elapsed.toFixed(0)}ms`,
        'color: #00ff88; font-weight: bold; font-size: 14px'
      );
      console.log(`  Atoms: ${atomsLoading ? 'loading' : 'done'}, Proposals: ${proposalsLoading ? 'loading' : 'done'}, Categories: ${categoryLoading ? 'loading' : 'done'}, Deposits: ${depositsLoading ? 'loading' : 'done'}`);
    }
  }, [loading, atomsLoading, proposalsLoading, categoryLoading, depositsLoading]);

  // Memoize return value to prevent unnecessary re-renders
  return useMemo(() => ({
    founders: result.founders,
    loading,
    error,
    stats: result.stats,
    // NEW: Batched top totems map - avoids 42 individual queries
    topTotemsMap: result.topTotemsMap,
  }), [result.founders, loading, error, result.stats, result.topTotemsMap]);
}
