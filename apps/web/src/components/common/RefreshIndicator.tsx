import React from 'react';
import { useTranslation } from 'react-i18next';

interface RefreshIndicatorProps {
  /** Seconds since last update */
  secondsSinceUpdate: number;
  /** True if subscription is connected */
  isConnected: boolean;
  /** True if subscription is paused */
  isPaused: boolean;
  /** True if still loading initial data */
  isLoading?: boolean;
  /** Optional className for styling */
  className?: string;
}

/**
 * Visual indicator showing subscription status and time since last update
 *
 * Shows:
 * - Blue dot + "Connexion..." when loading initial data
 * - Green dot + "à l'instant" when just updated
 * - Green dot + "il y a Xs" when connected
 * - Yellow dot + "En pause" when paused
 * - Red dot + "Déconnecté" when not connected (error state)
 *
 * @example
 * ```tsx
 * const { secondsSinceUpdate, isConnected, isPaused, isLoading } = useFounderSubscription('...');
 *
 * <RefreshIndicator
 *   secondsSinceUpdate={secondsSinceUpdate}
 *   isConnected={isConnected}
 *   isPaused={isPaused}
 *   isLoading={isLoading}
 * />
 * ```
 */
export const RefreshIndicator: React.FC<RefreshIndicatorProps> = ({
  secondsSinceUpdate,
  isConnected,
  isPaused,
  isLoading = false,
  className = '',
}) => {
  const { t } = useTranslation();

  // Format time since update with i18n
  const formatTime = (seconds: number): string => {
    if (seconds < 5) return t('refreshIndicator.justNow');
    if (seconds < 60) return t('refreshIndicator.secondsAgo', { seconds });
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}min`;
    const hours = Math.floor(minutes / 60);
    return `${hours}h`;
  };

  // Determine status
  let statusColor: string;
  let statusText: string;
  let pulseAnimation = false;

  if (isPaused) {
    statusColor = 'bg-yellow-500';
    statusText = t('refreshIndicator.paused');
  } else if (isLoading) {
    statusColor = 'bg-blue-500';
    statusText = t('refreshIndicator.connecting');
    pulseAnimation = true;
  } else if (!isConnected) {
    statusColor = 'bg-red-500';
    statusText = t('refreshIndicator.disconnected');
  } else {
    statusColor = 'bg-green-500';
    statusText = formatTime(secondsSinceUpdate);
    // Pulse animation when just updated (< 3 seconds)
    pulseAnimation = secondsSinceUpdate < 3;
  }

  return (
    <div
      className={`flex items-center gap-2 text-xs text-gray-400 ${className}`}
      title={isPaused ? t('refreshIndicator.pausedTooltip') :
             isLoading ? t('refreshIndicator.connectingTooltip') :
             !isConnected ? t('refreshIndicator.disconnectedTooltip') :
             t('refreshIndicator.activeTooltip')}
    >
      {/* Status dot */}
      <span className="relative flex h-2 w-2">
        {pulseAnimation && (
          <span
            className={`absolute inline-flex h-full w-full animate-ping rounded-full ${statusColor} opacity-75`}
          />
        )}
        <span
          className={`relative inline-flex h-2 w-2 rounded-full ${statusColor}`}
        />
      </span>

      {/* Status text */}
      <span>{statusText}</span>

      {/* Connection indicator - shows "Intuition" when connected */}
      {isConnected && !isPaused && (
        <span className="text-slate-400 font-medium">Intuition</span>
      )}
    </div>
  );
};

/**
 * Compact version of RefreshIndicator (dot only with tooltip)
 */
export const RefreshIndicatorCompact: React.FC<
  Omit<RefreshIndicatorProps, 'className'> & { className?: string }
> = ({ secondsSinceUpdate, isConnected, isPaused, isLoading = false, className = '' }) => {
  const { t } = useTranslation();

  // Format time since update with i18n
  const formatTime = (seconds: number): string => {
    if (seconds < 5) return t('refreshIndicator.justNow');
    if (seconds < 60) return t('refreshIndicator.secondsAgo', { seconds });
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}min`;
    const hours = Math.floor(minutes / 60);
    return `${hours}h`;
  };

  let statusColor: string;
  let title: string;
  let pulseAnimation = false;

  if (isPaused) {
    statusColor = 'bg-yellow-500';
    title = t('refreshIndicator.pausedTooltip');
  } else if (isLoading) {
    statusColor = 'bg-blue-500';
    title = t('refreshIndicator.connectingTooltip');
    pulseAnimation = true;
  } else if (!isConnected) {
    statusColor = 'bg-red-500';
    title = t('refreshIndicator.disconnectedTooltip');
  } else {
    statusColor = 'bg-green-500';
    title = t('refreshIndicator.updatedAt', { time: formatTime(secondsSinceUpdate) });
    pulseAnimation = secondsSinceUpdate < 3;
  }

  return (
    <span
      className={`relative flex h-2 w-2 cursor-help ${className}`}
      title={title}
    >
      {pulseAnimation && (
        <span
          className={`absolute inline-flex h-full w-full animate-ping rounded-full ${statusColor} opacity-75`}
        />
      )}
      <span
        className={`relative inline-flex h-2 w-2 rounded-full ${statusColor}`}
      />
    </span>
  );
};

export default RefreshIndicator;
