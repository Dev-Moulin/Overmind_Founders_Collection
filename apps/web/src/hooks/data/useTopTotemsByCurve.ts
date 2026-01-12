/**
 * useTopTotemsByCurve - Hook to fetch top totems with curve breakdown
 *
 * Extends useTopTotems with separate stats for:
 * - Linear curve (curveId=1): Stable 1:1 ratio
 * - Progressive curve (curveId=2): Rewards early adopters
 *
 * Used for:
 * - Displaying two winners: "🏆 Linear: Lion" + "🏆 Progressive: Eagle"
 * - Stats Panel with separate FOR/AGAINST by curve
 * - HomePage cards with dual winners
 *
 * @see Phase 10 - Étape 3 in TODO_FIX_01_Discussion.md
 */

import { useMemo } from 'react';
import { useQuery } from '@apollo/client';
import { formatEther } from 'viem';
import { useFounderProposals } from './useFounderProposals';
import { filterValidTriples, type RawTriple } from '../../utils/tripleGuards';
import { GET_DEPOSITS_FOR_TERMS_BY_CURVE } from '../../lib/graphql/queries';

/** Stats for a single curve */
export interface CurveStats {
  /** Total TRUST deposited FOR */
  trustFor: number;
  /** Total TRUST deposited AGAINST */
  trustAgainst: number;
  /** Net score (FOR - AGAINST) */
  netScore: number;
  /** Number of unique wallets voting FOR */
  walletsFor: number;
  /** Number of unique wallets voting AGAINST */
  walletsAgainst: number;
  /** Net Votes (walletsFor - walletsAgainst) */
  netVotes: number;
}

/** Totem with curve breakdown */
export interface TotemWithCurves {
  id: string;
  label: string;
  image?: string;
  /** term_id of the triple (FOR vault) */
  termId: string;
  /** counter_term_id of the triple (AGAINST vault) */
  counterTermId: string;
  /** Stats for Linear curve (curveId=1) */
  linear: CurveStats;
  /** Stats for Progressive curve (curveId=2) */
  progressive: CurveStats;
  /** Combined stats (Linear + Progressive) - for backwards compatibility */
  total: CurveStats;
}

/** Winner info */
export interface CurveWinner {
  totemId: string;
  totemLabel: string;
  totemImage?: string;
  netScore: number;
  netVotes: number;
}

interface UseTopTotemsByCurveReturn {
  /** All totems with curve breakdown */
  totems: TotemWithCurves[];
  /** Winner for Linear curve (highest netScore) */
  linearWinner: CurveWinner | null;
  /** Winner for Progressive curve (highest netScore) */
  progressiveWinner: CurveWinner | null;
  /** Total TRUST deposited on Linear */
  totalLinearTrust: number;
  /** Total TRUST deposited on Progressive */
  totalProgressiveTrust: number;
  /** Loading state */
  loading: boolean;
  /** Error if any */
  error?: Error;
}

interface DepositNode {
  term_id: string;
  sender_id: string;
  curve_id: string;
  assets_after_fees: string;
  vault_type: string;
}

interface GetDepositsForTermsByCurveResult {
  deposits: DepositNode[];
}

/**
 * Hook to get top totems with Linear/Progressive breakdown
 *
 * @param founderName - The founder's name (e.g., "Joseph Lubin")
 * @returns Totems with curve stats and winners per curve
 *
 * @example
 * ```tsx
 * const { totems, linearWinner, progressiveWinner } = useTopTotemsByCurve('Joseph Lubin');
 *
 * // Display two winners
 * <div>🏆 Linear: {linearWinner?.totemLabel}</div>
 * <div>🏆 Progressive: {progressiveWinner?.totemLabel}</div>
 * ```
 */
export function useTopTotemsByCurve(founderName: string): UseTopTotemsByCurveReturn {
  const { proposals, loading: proposalsLoading, error: proposalsError } = useFounderProposals(founderName);

  // Filter valid proposals
  const validProposals = useMemo(() => {
    if (!proposals || proposals.length === 0) return [];
    return filterValidTriples(proposals as RawTriple[], 'useTopTotemsByCurve');
  }, [proposals]);

  // Collect all term_ids and counter_term_ids for deposits query
  const termIds = useMemo(() => {
    const ids: string[] = [];
    validProposals.forEach((p) => {
      ids.push(p.term_id);
      if (p.counter_term?.id) {
        ids.push(p.counter_term.id);
      }
    });
    return ids;
  }, [validProposals]);

  // Query deposits with curve breakdown
  const { data: depositsData, loading: depositsLoading, error: depositsError } =
    useQuery<GetDepositsForTermsByCurveResult>(GET_DEPOSITS_FOR_TERMS_BY_CURVE, {
      variables: { termIds },
      skip: termIds.length === 0,
      fetchPolicy: 'cache-and-network',
    });

  // Process deposits into totem stats
  const result = useMemo((): Omit<UseTopTotemsByCurveReturn, 'loading' | 'error'> => {
    if (validProposals.length === 0 || !depositsData) {
      return {
        totems: [],
        linearWinner: null,
        progressiveWinner: null,
        totalLinearTrust: 0,
        totalProgressiveTrust: 0,
      };
    }

    // Build a map of termId -> totem info
    const totemMap = new Map<string, TotemWithCurves>();

    // Initialize totems from proposals
    validProposals.forEach((p) => {
      const totemId = p.object.term_id;
      if (!totemMap.has(totemId)) {
        totemMap.set(totemId, {
          id: totemId,
          label: p.object.label,
          image: p.object.image,
          termId: p.term_id,
          counterTermId: p.counter_term?.id || '',
          linear: createEmptyStats(),
          progressive: createEmptyStats(),
          total: createEmptyStats(),
        });
      }
    });

    // Create reverse map: termId/counterTermId -> totemId
    const termToTotemMap = new Map<string, { totemId: string; isFor: boolean }>();
    validProposals.forEach((p) => {
      const totemId = p.object.term_id;
      termToTotemMap.set(p.term_id, { totemId, isFor: true });
      if (p.counter_term?.id) {
        termToTotemMap.set(p.counter_term.id, { totemId, isFor: false });
      }
    });

    // Track unique wallets per curve per direction per totem
    const walletTracker = new Map<string, Set<string>>();
    const getWalletKey = (totemId: string, curveId: string, isFor: boolean) =>
      `${totemId}-${curveId}-${isFor ? 'for' : 'against'}`;

    // Process deposits
    let totalLinear = 0;
    let totalProgressive = 0;

    depositsData.deposits.forEach((deposit) => {
      const termInfo = termToTotemMap.get(deposit.term_id);
      if (!termInfo) return;

      const { totemId, isFor } = termInfo;
      const totem = totemMap.get(totemId);
      if (!totem) return;

      const assets = parseFloat(formatEther(BigInt(deposit.assets_after_fees || '0')));
      const curveId = deposit.curve_id || '1'; // Default to Linear if not specified
      const isLinear = curveId === '1';
      const isProgressive = curveId === '2';

      // Track total by curve
      if (isLinear) totalLinear += assets;
      if (isProgressive) totalProgressive += assets;

      // Update stats for the appropriate curve
      const stats = isLinear ? totem.linear : isProgressive ? totem.progressive : null;
      if (!stats) return;

      if (isFor) {
        stats.trustFor += assets;
      } else {
        stats.trustAgainst += assets;
      }

      // Track unique wallets
      const walletKey = getWalletKey(totemId, curveId, isFor);
      if (!walletTracker.has(walletKey)) {
        walletTracker.set(walletKey, new Set());
      }
      walletTracker.get(walletKey)!.add(deposit.sender_id.toLowerCase());
    });

    // Calculate netScore, netVotes, and total for each totem
    totemMap.forEach((totem, totemId) => {
      // Linear
      totem.linear.netScore = totem.linear.trustFor - totem.linear.trustAgainst;
      totem.linear.walletsFor = walletTracker.get(getWalletKey(totemId, '1', true))?.size || 0;
      totem.linear.walletsAgainst = walletTracker.get(getWalletKey(totemId, '1', false))?.size || 0;
      totem.linear.netVotes = totem.linear.walletsFor - totem.linear.walletsAgainst;

      // Progressive
      totem.progressive.netScore = totem.progressive.trustFor - totem.progressive.trustAgainst;
      totem.progressive.walletsFor = walletTracker.get(getWalletKey(totemId, '2', true))?.size || 0;
      totem.progressive.walletsAgainst = walletTracker.get(getWalletKey(totemId, '2', false))?.size || 0;
      totem.progressive.netVotes = totem.progressive.walletsFor - totem.progressive.walletsAgainst;

      // Total (Linear + Progressive combined)
      totem.total.trustFor = totem.linear.trustFor + totem.progressive.trustFor;
      totem.total.trustAgainst = totem.linear.trustAgainst + totem.progressive.trustAgainst;
      totem.total.netScore = totem.total.trustFor - totem.total.trustAgainst;
      totem.total.walletsFor = totem.linear.walletsFor + totem.progressive.walletsFor;
      totem.total.walletsAgainst = totem.linear.walletsAgainst + totem.progressive.walletsAgainst;
      totem.total.netVotes = totem.total.walletsFor - totem.total.walletsAgainst;
    });

    // Convert to array and sort by total netScore
    const totems = Array.from(totemMap.values()).sort(
      (a, b) => b.total.netScore - a.total.netScore
    );

    // Find winners for each curve
    const linearWinner = findWinner(totems, 'linear');
    const progressiveWinner = findWinner(totems, 'progressive');

    return {
      totems,
      linearWinner,
      progressiveWinner,
      totalLinearTrust: totalLinear,
      totalProgressiveTrust: totalProgressive,
    };
  }, [validProposals, depositsData]);

  // Memoize loading and error
  const loading = proposalsLoading || depositsLoading;
  const errorObj = useMemo(
    () => (proposalsError || depositsError) as Error | undefined,
    [proposalsError, depositsError]
  );

  // Memoize return value to prevent unnecessary re-renders
  return useMemo(() => ({
    ...result,
    loading,
    error: errorObj,
  }), [result, loading, errorObj]);
}

/** Create empty stats object */
function createEmptyStats(): CurveStats {
  return {
    trustFor: 0,
    trustAgainst: 0,
    netScore: 0,
    walletsFor: 0,
    walletsAgainst: 0,
    netVotes: 0,
  };
}

/** Find winner for a specific curve */
function findWinner(
  totems: TotemWithCurves[],
  curve: 'linear' | 'progressive'
): CurveWinner | null {
  if (totems.length === 0) return null;

  // Find totem with highest netScore for this curve
  const sorted = [...totems].sort((a, b) => b[curve].netScore - a[curve].netScore);
  const winner = sorted[0];

  // Only return a winner if there's actual activity on this curve
  if (winner[curve].trustFor === 0 && winner[curve].trustAgainst === 0) {
    return null;
  }

  return {
    totemId: winner.id,
    totemLabel: winner.label,
    totemImage: winner.image,
    netScore: winner[curve].netScore,
    netVotes: winner[curve].netVotes,
  };
}

/**
 * Get winner label with emoji
 *
 * @example
 * formatWinnerLabel(linearWinner, 'Linear') // "🏆 Linear: Lion"
 */
export function formatWinnerLabel(winner: CurveWinner | null, curveLabel: string): string {
  if (!winner) return `🏆 ${curveLabel}: -`;
  return `🏆 ${curveLabel}: ${winner.totemLabel}`;
}
