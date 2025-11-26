import { useEffect } from 'react';
import { formatEther } from 'viem';
import type { FounderForHomePage } from '../hooks/useFoundersForHomePage';
import {
  useFounderSubscription,
  useAutoSubscriptionPause,
} from '../hooks';
import { getFounderImageUrl } from './FounderCard';
import { VotePanel } from './VotePanel';
import { RefreshIndicator } from './RefreshIndicator';

interface FounderExpandedViewProps {
  founder: FounderForHomePage;
  onClose: () => void;
}

/**
 * Full-screen overlay showing expanded founder card (left) + vote panel (right)
 * Implements V2_FONDATION split layout design
 *
 * Uses WebSocket subscription for real-time updates on founder proposals.
 * Automatically pauses subscription when tab is hidden.
 */
export function FounderExpandedView({ founder, onClose }: FounderExpandedViewProps) {
  const imageUrl = getFounderImageUrl(founder);

  // Real-time subscription for founder proposals
  // Note: proposals and loading are available for future Phase 2 integration
  const {
    // proposals,  // Will be used to pass real-time data to VotePanel
    // loading: subscriptionLoading,
    secondsSinceUpdate,
    isConnected,
    isPaused,
    pause,
    resume,
  } = useFounderSubscription(founder.name);

  // Auto-pause subscription when tab is hidden
  useAutoSubscriptionPause(pause, resume, {
    pauseOnHidden: true,
    resumeDelay: 100,
  });

  // Close on Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  // Format net score for display
  const formatScore = (score: bigint): string => {
    const ethValue = parseFloat(formatEther(score));
    if (ethValue >= 1000) {
      return `${(ethValue / 1000).toFixed(1)}k`;
    }
    if (ethValue >= 1) {
      return ethValue.toFixed(1);
    }
    return ethValue.toFixed(3);
  };

  // Handle backdrop click to close
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={handleBackdropClick}
    >
      {/* Main container - split layout */}
      <div className="w-full max-w-6xl h-[90vh] max-h-[800px] flex flex-col lg:flex-row gap-6 animate-fade-in">

        {/* Left Panel - Founder Card (1/4 on desktop, full on mobile) */}
        <div className="lg:w-1/4 flex-shrink-0">
          <div className="glass-card p-6 h-full flex flex-col relative animate-slide-in-left">
            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white/70 hover:text-white transition-colors"
              aria-label="Fermer"
            >
              ×
            </button>

            {/* Founder Photo */}
            <div className="flex justify-center mb-6">
              <img
                src={imageUrl}
                alt={founder.name}
                className="w-32 h-32 rounded-full object-cover border-4 border-purple-500/50 shadow-lg shadow-purple-500/20"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(founder.name)}`;
                }}
              />
            </div>

            {/* Founder Name */}
            <h2 className="text-2xl font-bold text-white text-center mb-2">
              {founder.name}
            </h2>

            {/* Real-time indicator */}
            <div className="flex justify-center mb-4">
              <RefreshIndicator
                secondsSinceUpdate={secondsSinceUpdate}
                isConnected={isConnected}
                isPaused={isPaused}
              />
            </div>

            {/* Short Bio */}
            {founder.shortBio && (
              <p className="text-sm text-white/60 text-center mb-6 leading-relaxed">
                {founder.shortBio}
              </p>
            )}

            {/* Divider */}
            <div className="border-t border-white/10 my-4" />

            {/* Stats */}
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-white/50">Propositions</span>
                <span className="text-white font-medium">{founder.proposalCount}</span>
              </div>

              {founder.winningTotem && (
                <>
                  <div className="flex justify-between text-sm">
                    <span className="text-white/50">Totem gagnant</span>
                    <span className="text-purple-400 font-medium">{founder.winningTotem.label}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-white/50">Score</span>
                    <span className="text-purple-400 font-medium">
                      {formatScore(founder.winningTotem.netScore)} TRUST
                    </span>
                  </div>
                </>
              )}

              {founder.atomId && (
                <div className="flex justify-between text-sm">
                  <span className="text-white/50">Atom ID</span>
                  <span className="text-white/70 font-mono text-xs">
                    {founder.atomId.slice(0, 8)}...
                  </span>
                </div>
              )}
            </div>

            {/* Spacer */}
            <div className="flex-1" />

            {/* Close button at bottom (mobile) */}
            <button
              onClick={onClose}
              className="lg:hidden mt-6 w-full py-3 rounded-lg bg-white/10 hover:bg-white/20 text-white/70 hover:text-white transition-colors"
            >
              Fermer
            </button>
          </div>
        </div>

        {/* Right Panel - Vote Panel (3/4 on desktop, full on mobile) */}
        <div className="lg:w-3/4 flex-1 min-h-0">
          <VotePanel founder={founder} />
        </div>
      </div>
    </div>
  );
}
