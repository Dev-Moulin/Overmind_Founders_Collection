import { useEffect, useState, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { type Hex } from 'viem';
import type { FounderForHomePage } from '../../hooks';
import {
  useFounderSubscription,
  useAutoSubscriptionPause,
} from '../../hooks';
import { useVoteCart, useVoteCartContext, VoteCartContext } from '../../hooks/cart/useVoteCart';
import { FounderInfoPanel, FounderCenterPanel, VoteTotemPanel } from './index';
import { VoteCartPanel } from '../vote/VoteCartPanel';
import type { NewTotemData } from './TotemCreationForm';

interface FounderExpandedViewProps {
  founder: FounderForHomePage;
  onClose: () => void;
}

/**
 * Inner component that uses the cart context
 */
function FounderExpandedViewInner({ founder, onClose }: FounderExpandedViewProps) {
  const { t } = useTranslation();

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

  // Vote Cart - from context (shared with VoteTotemPanel)
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
  } = useVoteCartContext();

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

  // Lock body scroll when modal is open
  useEffect(() => {
    const originalStyle = window.getComputedStyle(document.body).overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = originalStyle;
    };
  }, []);

  // Handle backdrop click to close
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  // Selected totem state (from center panel - existing totems)
  const [selectedTotemId, setSelectedTotemId] = useState<string | undefined>();
  const [selectedTotemLabel, setSelectedTotemLabel] = useState<string | undefined>();

  // New totem data (from creation form in center panel)
  const [newTotemData, setNewTotemData] = useState<NewTotemData | null>(null);

  const handleSelectTotem = useCallback((totemId: string, totemLabel: string) => {
    setSelectedTotemId(totemId);
    setSelectedTotemLabel(totemLabel);
    // Clear new totem data when selecting an existing totem
    setNewTotemData(null);
  }, []);

  const handleClearSelection = useCallback(() => {
    setSelectedTotemId(undefined);
    setSelectedTotemLabel(undefined);
    setNewTotemData(null);
  }, []);

  // Handle new totem data from creation form
  const handleNewTotemChange = useCallback((data: NewTotemData | null) => {
    setNewTotemData(data);
    // Clear existing totem selection when creating a new one
    if (data) {
      setSelectedTotemId(undefined);
      setSelectedTotemLabel(undefined);
    }
  }, []);

  // Cart panel state
  const [isCartPanelOpen, setIsCartPanelOpen] = useState(false);

  // Trigger to refetch user votes after cart validation
  const [refetchTrigger, setRefetchTrigger] = useState(0);

  return (
    <div
      className="fixed inset-0 z-50 m-0 bg-black/40 backdrop-blur-md flex items-center justify-center p-4 overflow-hidden"
      onClick={handleBackdropClick}
      style={{ margin: 0, overscrollBehavior: 'contain' }}
    >
      {/* Main container - 3-panel layout responsive */}
      <div className="w-full max-w-[1600px] h-[95vh] max-h-[95vh] flex flex-col lg:flex-row gap-3 xl:gap-4 animate-fade-in overflow-hidden">

        {/* Left Panel - Founder Info (+20% wider for graphs) */}
        <div className="lg:w-[384px] xl:w-[432px] 2xl:w-[480px] shrink-0 h-full min-h-0">
          <FounderInfoPanel
            founder={founder}
            onClose={onClose}
            secondsSinceUpdate={secondsSinceUpdate}
            isConnected={isConnected}
            isPaused={isPaused}
            isLoading={isLoading}
            hasNewData={hasNewData}
            onSelectTotem={handleSelectTotem}
          />
        </div>

        {/* Center Panel - Totems Grid (flexible) */}
        <div className="flex-1 min-w-0 min-h-0 h-full">
          <FounderCenterPanel
            founder={founder}
            onSelectTotem={handleSelectTotem}
            selectedTotemId={selectedTotemId}
            refetchTrigger={refetchTrigger}
            onNewTotemChange={handleNewTotemChange}
          />
        </div>

        {/* Right Panel - Vote Action (adaptive width) */}
        <div className="lg:w-[320px] xl:w-[360px] 2xl:w-[400px] shrink-0 h-full min-h-0">
          <VoteTotemPanel
            founder={founder}
            selectedTotemId={selectedTotemId}
            selectedTotemLabel={selectedTotemLabel}
            newTotemData={newTotemData}
            onClearSelection={handleClearSelection}
            onOpenCart={() => setIsCartPanelOpen(true)}
          />
        </div>
      </div>

      {/* Cart Panel Slide-over */}
      {isCartPanelOpen && (
        <div className="fixed inset-0 z-60 overflow-hidden">
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
                  {t('founderExpanded.voteCart')} ({itemCount})
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
              <div className="flex-1 overflow-y-auto p-4" style={{ overscrollBehavior: 'contain' }}>
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
                    // Trigger refetch of user votes in FounderCenterPanel
                    setRefetchTrigger(prev => prev + 1);
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
 *
 * Wraps content in VoteCartContext.Provider to share cart state
 * between VoteTotemPanel and VoteCartPanel.
 */
export function FounderExpandedView({ founder, onClose }: FounderExpandedViewProps) {
  const cartState = useVoteCart();

  return (
    <VoteCartContext.Provider value={cartState}>
      <FounderExpandedViewInner founder={founder} onClose={onClose} />
    </VoteCartContext.Provider>
  );
}
