import { useState, useEffect, useCallback, useMemo } from 'react';

/**
 * Hook return type
 */
interface UseWindowFocusResult {
  /** True if window/tab is currently visible and focused */
  isFocused: boolean;
  /** True if document is visible (tab not hidden) */
  isVisible: boolean;
  /** Timestamp when focus was last gained */
  lastFocusedAt: Date | null;
  /** Timestamp when focus was last lost */
  lastBlurredAt: Date | null;
  /** Time in ms since last focus (0 if currently focused) */
  timeSinceBlur: number;
}

/**
 * Hook to detect if the browser tab/window is focused
 *
 * Useful for:
 * - Pausing WebSocket subscriptions when tab is hidden (save battery/bandwidth)
 * - Refreshing data when user returns to tab
 * - Showing "tab inactive" indicators
 *
 * Uses both:
 * - `document.visibilityState` for tab visibility
 * - `window.focus/blur` events for window focus
 *
 * @returns Object with focus state and timestamps
 *
 * @example
 * ```tsx
 * const { isFocused, isVisible } = useWindowFocus();
 *
 * // Pause subscription when tab is hidden
 * useEffect(() => {
 *   if (!isVisible) {
 *     subscription.pause();
 *   } else {
 *     subscription.resume();
 *   }
 * }, [isVisible]);
 * ```
 */
export function useWindowFocus(): UseWindowFocusResult {
  const [isFocused, setIsFocused] = useState(() => {
    if (typeof document === 'undefined') return true;
    return document.hasFocus();
  });

  const [isVisible, setIsVisible] = useState(() => {
    if (typeof document === 'undefined') return true;
    return document.visibilityState === 'visible';
  });

  const [lastFocusedAt, setLastFocusedAt] = useState<Date | null>(() => {
    if (typeof document === 'undefined') return null;
    return document.hasFocus() ? new Date() : null;
  });

  const [lastBlurredAt, setLastBlurredAt] = useState<Date | null>(null);
  const [timeSinceBlur, setTimeSinceBlur] = useState(0);

  // Handle focus event
  const handleFocus = useCallback(() => {
    setIsFocused(true);
    setLastFocusedAt(new Date());
    setTimeSinceBlur(0);
  }, []);

  // Handle blur event
  const handleBlur = useCallback(() => {
    setIsFocused(false);
    setLastBlurredAt(new Date());
  }, []);

  // Handle visibility change
  const handleVisibilityChange = useCallback(() => {
    const visible = document.visibilityState === 'visible';
    setIsVisible(visible);

    if (visible) {
      setLastFocusedAt(new Date());
      setTimeSinceBlur(0);
    } else {
      setLastBlurredAt(new Date());
    }
  }, []);

  // Set up event listeners
  useEffect(() => {
    if (typeof window === 'undefined') return;

    window.addEventListener('focus', handleFocus);
    window.addEventListener('blur', handleBlur);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('blur', handleBlur);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [handleFocus, handleBlur, handleVisibilityChange]);

  // Update time since blur
  useEffect(() => {
    if (!lastBlurredAt || isFocused) return;

    const interval = setInterval(() => {
      const ms = Date.now() - lastBlurredAt.getTime();
      setTimeSinceBlur(ms);
    }, 1000);

    return () => clearInterval(interval);
  }, [lastBlurredAt, isFocused]);

  // Memoize return value to prevent unnecessary re-renders
  return useMemo(() => ({
    isFocused,
    isVisible,
    lastFocusedAt,
    lastBlurredAt,
    timeSinceBlur,
  }), [isFocused, isVisible, lastFocusedAt, lastBlurredAt, timeSinceBlur]);
}

/**
 * Hook to automatically pause/resume a subscription based on window visibility
 *
 * @param pause - Function to pause subscription
 * @param resume - Function to resume subscription
 * @param options - Configuration options
 *
 * @example
 * ```tsx
 * const { pause, resume } = useFounderSubscription('Joseph Lubin');
 *
 * useAutoSubscriptionPause(pause, resume, {
 *   pauseOnHidden: true,
 *   resumeDelay: 100, // small delay to avoid flicker
 * });
 * ```
 */
export function useAutoSubscriptionPause(
  pause: () => void,
  resume: () => void,
  options: {
    /** Pause when tab is hidden (default: true) */
    pauseOnHidden?: boolean;
    /** Delay in ms before resuming (default: 0) */
    resumeDelay?: number;
    /** Also pause when window loses focus (not just hidden) (default: false) */
    pauseOnBlur?: boolean;
  } = {}
) {
  const { pauseOnHidden = true, resumeDelay = 0, pauseOnBlur = false } = options;
  const { isFocused, isVisible } = useWindowFocus();

  useEffect(() => {
    const shouldPause =
      (pauseOnHidden && !isVisible) || (pauseOnBlur && !isFocused);

    if (shouldPause) {
      pause();
    } else {
      if (resumeDelay > 0) {
        const timeout = setTimeout(resume, resumeDelay);
        return () => clearTimeout(timeout);
      } else {
        resume();
      }
    }
  }, [isVisible, isFocused, pause, resume, pauseOnHidden, pauseOnBlur, resumeDelay]);
}
