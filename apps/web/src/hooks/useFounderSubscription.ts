import { useSubscription } from '@apollo/client';
import { useState, useEffect, useCallback, useRef } from 'react';
import { SUBSCRIBE_FOUNDER_PROPOSALS } from '../lib/graphql/subscriptions';
import type { Triple, ProposalWithVotes } from '../lib/graphql/types';
import { enrichTripleWithVotes } from '../utils/voteCalculations';

/**
 * Subscription result type from GraphQL
 */
interface SubscriptionData {
  triples: Triple[];
}

/**
 * Hook return type
 */
interface UseFounderSubscriptionResult {
  /** Proposals with vote counts, updated in real-time */
  proposals: ProposalWithVotes[];
  /** True while waiting for first data */
  loading: boolean;
  /** Error if subscription failed */
  error: Error | undefined;
  /** Timestamp of last update */
  lastUpdated: Date | null;
  /** Time since last update in seconds */
  secondsSinceUpdate: number;
  /** True if subscription is active and connected */
  isConnected: boolean;
  /** True if still loading initial data */
  isLoading: boolean;
  /** Manually pause the subscription */
  pause: () => void;
  /** Resume a paused subscription */
  resume: () => void;
  /** True if subscription is paused */
  isPaused: boolean;
}

/**
 * Hook for real-time founder proposals via WebSocket subscription
 *
 * Automatically receives updates when:
 * - New totem is proposed for the founder
 * - Someone votes FOR or AGAINST
 * - Someone withdraws their vote
 *
 * @param founderName - Name of the founder to subscribe to
 * @returns Real-time proposals with loading/error states
 *
 * @example
 * ```tsx
 * const {
 *   proposals,
 *   loading,
 *   lastUpdated,
 *   secondsSinceUpdate,
 *   isConnected
 * } = useFounderSubscription('Joseph Lubin');
 *
 * if (loading) return <Loading />;
 *
 * return (
 *   <div>
 *     <span>Actualisé il y a {secondsSinceUpdate}s</span>
 *     {proposals.map(p => <ProposalCard key={p.term_id} proposal={p} />)}
 *   </div>
 * );
 * ```
 */
export function useFounderSubscription(
  founderName: string
): UseFounderSubscriptionResult {
  const [proposals, setProposals] = useState<ProposalWithVotes[]>([]);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [secondsSinceUpdate, setSecondsSinceUpdate] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  // Track if we should skip subscription
  const shouldSkip = !founderName || isPaused;

  // Subscription
  const { data, loading, error } = useSubscription<SubscriptionData>(
    SUBSCRIBE_FOUNDER_PROPOSALS,
    {
      variables: { founderName },
      skip: shouldSkip,
      onData: ({ data: subscriptionData }) => {
        if (subscriptionData?.data?.triples) {
          const enriched = subscriptionData.data.triples.map(enrichTripleWithVotes);
          setProposals(enriched);
          setLastUpdated(new Date());
          setSecondsSinceUpdate(0);
        }
      },
      onError: (err) => {
        console.error('[useFounderSubscription] Error:', err);
      },
    }
  );

  // Update proposals when data changes (initial load)
  useEffect(() => {
    if (data?.triples) {
      const enriched = data.triples.map(enrichTripleWithVotes);
      setProposals(enriched);
      setLastUpdated(new Date());
    }
  }, [data]);

  // Timer to update "seconds since update"
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (lastUpdated && !isPaused) {
      intervalRef.current = setInterval(() => {
        const seconds = Math.floor((Date.now() - lastUpdated.getTime()) / 1000);
        setSecondsSinceUpdate(seconds);
      }, 1000);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [lastUpdated, isPaused]);

  // Pause/Resume functions
  const pause = useCallback(() => {
    setIsPaused(true);
  }, []);

  const resume = useCallback(() => {
    setIsPaused(false);
  }, []);

  // Determine if connected (has received data at least once, no error, not paused)
  // Note: loading is true until first data arrives, so we check lastUpdated instead
  const isConnected = !error && !isPaused && !!founderName && lastUpdated !== null;

  // isLoading: true while waiting for first data
  const isLoading = loading && lastUpdated === null && !isPaused && !!founderName;

  return {
    proposals,
    loading,
    error,
    lastUpdated,
    secondsSinceUpdate,
    isConnected,
    isLoading,
    pause,
    resume,
    isPaused,
  };
}

/**
 * Format seconds since update for display
 *
 * @param seconds - Number of seconds
 * @returns Formatted string (e.g., "il y a 5s", "il y a 2min")
 */
export function formatTimeSinceUpdate(seconds: number): string {
  if (seconds < 5) return 'à l\'instant';
  if (seconds < 60) return `il y a ${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `il y a ${minutes}min`;
  const hours = Math.floor(minutes / 60);
  return `il y a ${hours}h`;
}
