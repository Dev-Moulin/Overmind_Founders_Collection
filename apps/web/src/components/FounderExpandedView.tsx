import { useEffect, useState, useRef, useCallback } from 'react';
import { type Hex } from 'viem';
import type { FounderForHomePage } from '../hooks/useFoundersForHomePage';
import {
  useFounderSubscription,
  useAutoSubscriptionPause,
} from '../hooks';
import { useVoteCart } from '../hooks/useVoteCart';
import { FounderInfoPanel, FounderCenterPanel, VoteTotemPanel } from './founder';
import { VoteCartPanel } from './vote/VoteCartPanel';

interface FounderExpandedViewProps {
  founder: FounderForHomePage;
  onClose: () => void;
}

/**
 * Full-screen overlay showing 3-panel layout:
 * - Left: Founder info + Vote Market stats
 * - Center: Totems grid + user positions
 * - Right: Vote action panel
 *
 * Implements V2_FONDATION Phase 9 three-panel design
 *
 * Uses WebSocket subscription for real-time updates on founder proposals.
 * Automatically pauses subscription when tab is hidden.
 */
export function FounderExpandedView({ founder, onClose }: FounderExpandedViewProps) {
  // Real-time subscription for founder proposals
  const {
    secondsSinceUpdate,
    isConnected,
    isPaused,
    isLoading,
    pause,
    resume,
  } = useFounderSubscription(founder.name);

  // Auto-pause subscription when tab is hidden
  useAutoSubscriptionPause(pause, resume, {
    pauseOnHidden: true,
    resumeDelay: 100,
  });

  // Vote Cart
  const {
    cart,
    itemCount,
    costSummary,
    initCart,
    removeItem,
    updateAmount,
    updateDirection,
    clearCart,
    validationErrors,
    isValid: isCartValid,
  } = useVoteCart();

  // Initialize cart for this founder
  useEffect(() => {
    if (founder.atomId) {
      initCart(founder.atomId as Hex, founder.name);
    }
  }, [founder.atomId, founder.name, initCart]);

  // Track when new data arrives for animation
  const [hasNewData, setHasNewData] = useState(false);
  const prevSecondsRef = useRef(secondsSinceUpdate);

  useEffect(() => {
    // Detect when secondsSinceUpdate resets to 0 (new data received)
    if (prevSecondsRef.current > 0 && secondsSinceUpdate === 0) {
      setHasNewData(true);
      // Remove animation class after 1 second
      const timer = setTimeout(() => setHasNewData(false), 1000);
      return () => clearTimeout(timer);
    }
    prevSecondsRef.current = secondsSinceUpdate;
  }, [secondsSinceUpdate]);

  // Close on Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isCartPanelOpen) {
          setIsCartPanelOpen(false);
        } else {
          onClose();
        }
      }
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  // Handle backdrop click to close
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  // Selected totem state (from center panel)
  const [selectedTotemId, setSelectedTotemId] = useState<string | undefined>();
  const [selectedTotemLabel, setSelectedTotemLabel] = useState<string | undefined>();

  const handleSelectTotem = useCallback((totemId: string, totemLabel: string) => {
    setSelectedTotemId(totemId);
    setSelectedTotemLabel(totemLabel);
  }, []);

  const handleClearSelection = useCallback(() => {
    setSelectedTotemId(undefined);
    setSelectedTotemLabel(undefined);
  }, []);

  // Cart panel state
  const [isCartPanelOpen, setIsCartPanelOpen] = useState(false);

  return (
    <div
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={handleBackdropClick}
    >
      {/* Main container - 3-panel layout */}
      <div className="w-full max-w-7xl h-[90vh] max-h-[850px] flex flex-col lg:flex-row gap-4 animate-fade-in">

        {/* Left Panel - Founder Info (1/5 on desktop) */}
        <div className="lg:w-1/5 shrink-0 min-w-[220px]">
          <FounderInfoPanel
            founder={founder}
            onClose={onClose}
            secondsSinceUpdate={secondsSinceUpdate}
            isConnected={isConnected}
            isPaused={isPaused}
            isLoading={isLoading}
            hasNewData={hasNewData}
          />
        </div>

        {/* Center Panel - Totems Grid (2/5 on desktop) */}
        <div className="lg:w-2/5 flex-1 min-h-0">
          <FounderCenterPanel
            founder={founder}
            onSelectTotem={handleSelectTotem}
            selectedTotemId={selectedTotemId}
          />
        </div>

        {/* Right Panel - Vote Action (2/5 on desktop) */}
        <div className="lg:w-2/5 shrink-0">
          <VoteTotemPanel
            founder={founder}
            selectedTotemId={selectedTotemId}
            selectedTotemLabel={selectedTotemLabel}
            onClearSelection={handleClearSelection}
            onOpenCart={() => setIsCartPanelOpen(true)}
          />
        </div>
      </div>

      {/* Cart Panel Slide-over */}
      {isCartPanelOpen && (
        <div className="fixed inset-0 z-[60] overflow-hidden">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setIsCartPanelOpen(false)}
          />

          {/* Panel */}
          <div className="absolute right-0 top-0 h-full w-full max-w-md">
            <div className="h-full bg-gray-900/95 border-l border-white/10 shadow-xl flex flex-col">
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-white/10">
                <h2 className="text-lg font-semibold text-white">
                  Panier de votes ({itemCount})
                </h2>
                <button
                  onClick={() => setIsCartPanelOpen(false)}
                  className="p-2 text-white/60 hover:text-white transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto p-4">
                <VoteCartPanel
                  cart={cart}
                  costSummary={costSummary}
                  onRemoveItem={removeItem}
                  onClearCart={clearCart}
                  onUpdateDirection={updateDirection}
                  onUpdateAmount={updateAmount}
                  onSuccess={() => {
                    setIsCartPanelOpen(false);
                    clearCart();
                  }}
                  validationErrors={validationErrors}
                  isValid={isCartValid}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
