/**
 * VoteTotemPanel - Right panel for voting action
 *
 * Simplified vote panel focusing on the action:
 * - Selected totem display
 * - Predicate selector
 * - Amount input with presets
 * - FOR/AGAINST toggle
 * - Add to cart or direct vote
 *
 * @see Phase 9 in TODO_Implementation.md
 */

import { useState, useEffect, useMemo } from 'react';
import { useAccount, useBalance } from 'wagmi';
import { useQuery } from '@apollo/client';
import { useTranslation } from 'react-i18next';
import type { Hex, Address } from 'viem';
import type { FounderForHomePage } from '../../hooks';
import { useProtocolConfig } from '../../hooks';
import { useVoteCartContext } from '../../hooks/cart/useVoteCart';
import { useProactiveClaimCheck } from '../../hooks';
import { usePositionBothSides } from '../../hooks/blockchain/usePositionFromContract';
import { useWithdraw } from '../../hooks/blockchain/useWithdraw';
import { GET_ATOMS_BY_LABELS } from '../../lib/graphql/queries';
import { PresetButtonsCompact } from '../vote/PresetButtons';
import { PositionModifier } from '../vote/PositionModifier';
import { SuccessNotification } from '../common/SuccessNotification';
import { ErrorNotification } from '../common/ErrorNotification';
import predicatesData from '../../../../../packages/shared/src/data/predicates.json';
import type { Predicate } from '../../types/predicate';

interface VoteTotemPanelProps {
  founder: FounderForHomePage;
  selectedTotemId?: string;
  selectedTotemLabel?: string;
  onClearSelection?: () => void;
  onOpenCart?: () => void;
}

export function VoteTotemPanel({
  founder,
  selectedTotemId,
  selectedTotemLabel,
  onClearSelection,
  onOpenCart,
}: VoteTotemPanelProps) {
  const { t } = useTranslation();
  const { isConnected, address } = useAccount();
  const predicates = predicatesData as Predicate[];

  const { config: protocolConfig, loading: configLoading, isDepositValid } = useProtocolConfig();
  const { data: balanceData } = useBalance({ address });

  const {
    itemCount,
    formattedNetCost,
    addItem,
  } = useVoteCartContext();
  // Note: initCart is called by FounderExpandedView which provides the context

  // Fetch predicate atomIds from chain
  const predicateLabels = predicates.map(p => p.label);
  const { data: predicatesAtomData } = useQuery<{ atoms: Array<{ term_id: string; label: string }> }>(
    GET_ATOMS_BY_LABELS,
    {
      variables: { labels: predicateLabels },
      fetchPolicy: 'cache-first',
    }
  );

  // Map predicates with their atomIds
  const predicatesWithAtomIds = useMemo(() => {
    if (!predicatesAtomData?.atoms) return predicates.map(p => ({ ...p, atomId: null, isOnChain: false }));

    const atomIdMap = new Map<string, string>();
    predicatesAtomData.atoms.forEach((atom) => {
      atomIdMap.set(atom.label, atom.term_id);
    });

    return predicates.map(p => ({
      ...p,
      atomId: atomIdMap.get(p.label) || null,
      isOnChain: atomIdMap.has(p.label),
    }));
  }, [predicates, predicatesAtomData]);

  // Form state
  const [selectedPredicateId, setSelectedPredicateId] = useState<string>(predicates[0]?.id || '');
  const [voteDirection, setVoteDirection] = useState<'for' | 'against' | 'withdraw'>('for');
  const [trustAmount, setTrustAmount] = useState<string>('');
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const selectedPredicate = useMemo(
    () => predicates.find((p) => p.id === selectedPredicateId),
    [predicates, selectedPredicateId]
  );

  // Get selected predicate with atomId
  const selectedPredicateWithAtom = useMemo(
    () => predicatesWithAtomIds.find((p) => p.id === selectedPredicateId),
    [predicatesWithAtomIds, selectedPredicateId]
  );

  // Check if triple already exists (to get termId/counterTermId)
  const {
    proactiveClaimInfo,
  } = useProactiveClaimCheck({
    founderAtomId: founder.atomId,
    selectedPredicateWithAtom,
    selectedTotemId: selectedTotemId || '',
    totemMode: 'existing', // VoteTotemPanel only handles existing totems
  });

  // Compute if this is a new triple (no proactiveClaimInfo means triple doesn't exist yet)
  const isNewTotem = !proactiveClaimInfo;

  // Check user's position on this triple (FOR and AGAINST sides)
  const {
    forShares,
    againstShares,
    hasAnyPosition,
    positionDirection,
    isLoading: positionLoading,
    refetch: refetchPosition,
  } = usePositionBothSides(
    address as Address | undefined,
    proactiveClaimInfo?.termId as Hex | undefined,
    proactiveClaimInfo?.counterTermId as Hex | undefined
  );

  // Withdraw hook
  const {
    withdraw,
    isLoading: withdrawLoading,
    reset: resetWithdraw,
  } = useWithdraw();

  // Calculate minimum required amount based on whether it's a new triple
  const minRequiredAmount = useMemo(() => {
    if (!protocolConfig) return '0.001';
    if (isNewTotem) {
      // New triple: tripleCost + minDeposit
      const total = parseFloat(protocolConfig.formattedTripleCost) + parseFloat(protocolConfig.formattedMinDeposit);
      return total.toFixed(4);
    }
    // Existing triple: just minDeposit
    return protocolConfig.formattedMinDeposit;
  }, [protocolConfig, isNewTotem]);

  // Initialize amount with minimum required
  useEffect(() => {
    if (minRequiredAmount && trustAmount === '') {
      setTrustAmount(minRequiredAmount);
    }
  }, [minRequiredAmount]);

  // Update amount if it's below minimum when switching to a new totem
  useEffect(() => {
    if (protocolConfig && trustAmount) {
      const currentAmount = parseFloat(trustAmount);
      const minAmount = parseFloat(minRequiredAmount);
      if (currentAmount < minAmount) {
        setTrustAmount(minRequiredAmount);
      }
    }
  }, [minRequiredAmount, protocolConfig]);

  // Reset amount to minimum when totem changes AND we know if it's new or existing
  // This ensures the correct minimum is used after proactiveClaimCheck completes
  useEffect(() => {
    if (selectedTotemId && minRequiredAmount) {
      const currentAmount = parseFloat(trustAmount || '0');
      const minAmount = parseFloat(minRequiredAmount);
      // Only update if current amount is below minimum
      if (currentAmount < minAmount) {
        setTrustAmount(minRequiredAmount);
      }
    }
  }, [selectedTotemId, selectedPredicateId, minRequiredAmount]);

  const isFormValid = useMemo(() => {
    if (!selectedTotemId) return false;
    if (!selectedPredicateId) return false;
    if (!trustAmount || parseFloat(trustAmount) <= 0) return false;
    if (!isDepositValid(trustAmount)) return false;
    if (voteDirection === 'withdraw') return true; // Withdraw doesn't need predicate atomId
    if (!selectedPredicateWithAtom?.atomId) return false; // Need predicate atomId for votes
    return true;
  }, [selectedTotemId, selectedPredicateId, trustAmount, isDepositValid, voteDirection, selectedPredicateWithAtom]);

  // Get current user shares based on position direction
  const currentUserShares = positionDirection === 'for' ? forShares : againstShares;

  // Handle withdraw from PositionModifier
  const handleWithdraw = async (shares: bigint, _percentage: number) => {
    if (!proactiveClaimInfo) {
      setError('Position non trouvée');
      setTimeout(() => setError(null), 3000);
      return;
    }

    // Determine which termId to use based on position direction
    const termIdToUse = positionDirection === 'for'
      ? proactiveClaimInfo.termId
      : proactiveClaimInfo.counterTermId;

    console.log('[VoteTotemPanel] Withdraw:', {
      termId: termIdToUse,
      shares: shares.toString(),
      isPositive: positionDirection === 'for',
    });

    const txHash = await withdraw(
      termIdToUse as Hex,
      shares,
      positionDirection === 'for',
      0n // minAssets (slippage protection)
    );

    if (txHash) {
      setSuccess(t('withdraw.success') || 'Retrait effectué !');
      setTimeout(() => setSuccess(null), 3000);
      // Refetch position after successful withdraw
      refetchPosition();
      resetWithdraw();
    }
  };

  // Handle add more from PositionModifier (adds to cart)
  const handleAddMore = (amount: string, direction: 'for' | 'against') => {
    if (!selectedTotemId || !selectedPredicateWithAtom?.atomId || !proactiveClaimInfo) {
      setError('Données manquantes');
      setTimeout(() => setError(null), 3000);
      return;
    }

    const cartItem = {
      totemId: selectedTotemId as Hex,
      totemName: selectedTotemLabel || 'Unknown',
      predicateId: selectedPredicateWithAtom.atomId as Hex,
      termId: proactiveClaimInfo.termId as Hex,
      counterTermId: proactiveClaimInfo.counterTermId as Hex,
      direction,
      amount,
      isNewTotem: false,
    };

    try {
      addItem(cartItem);
      setSuccess(t('founderExpanded.addedToCart') || 'Ajouté au panier !');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error('[VoteTotemPanel] Error adding to cart:', err);
      setError('Erreur lors de l\'ajout au panier');
      setTimeout(() => setError(null), 3000);
    }
  };

  // Handle switch side from PositionModifier
  const handleSwitchSide = async (newDirection: 'for' | 'against') => {
    // First withdraw current position, then add opposite to cart
    if (!proactiveClaimInfo || currentUserShares <= 0n) {
      setError('Pas de position à changer');
      setTimeout(() => setError(null), 3000);
      return;
    }

    // Withdraw 100% of current position
    await handleWithdraw(currentUserShares, 100);

    // Then the user can vote in the new direction via the normal flow
    setVoteDirection(newDirection);
    setSuccess(`Position retirée. Vous pouvez maintenant voter ${newDirection.toUpperCase()}`);
    setTimeout(() => setSuccess(null), 5000);
  };

  // Handle add to cart - Full integration with useVoteCart
  const handleAddToCart = () => {
    console.log('[VoteTotemPanel] ========== ADD TO CART START ==========');
    console.log('[VoteTotemPanel] Form state:', {
      isFormValid,
      selectedTotemId,
      selectedTotemLabel,
      selectedPredicateId,
      selectedPredicateLabel: selectedPredicateWithAtom?.label,
      selectedPredicateAtomId: selectedPredicateWithAtom?.atomId,
      voteDirection,
      trustAmount,
      founderName: founder.name,
      founderAtomId: founder.atomId,
    });
    console.log('[VoteTotemPanel] Proactive claim info:', proactiveClaimInfo);

    if (!isFormValid) {
      console.log('[VoteTotemPanel] Form NOT valid, aborting');
      return;
    }
    if (voteDirection === 'withdraw') {
      // Withdraw not supported in cart mode yet
      setError(t('founderExpanded.withdrawNotInCart') || 'Withdraw non disponible dans le panier');
      setTimeout(() => setError(null), 3000);
      return;
    }

    if (!selectedTotemId || !selectedPredicateWithAtom?.atomId) {
      console.log('[VoteTotemPanel] Missing data:', { selectedTotemId, predicateAtomId: selectedPredicateWithAtom?.atomId });
      setError('Données manquantes pour ajouter au panier');
      setTimeout(() => setError(null), 3000);
      return;
    }

    // For new triples (no proactiveClaimInfo), we need to create termId on-chain
    // For existing triples, we use the existing termId/counterTermId
    const isNewTotem = !proactiveClaimInfo;

    const cartItem = {
      totemId: selectedTotemId as Hex,
      totemName: selectedTotemLabel || 'Unknown',
      predicateId: selectedPredicateWithAtom.atomId as Hex,
      termId: (proactiveClaimInfo?.termId || selectedTotemId) as Hex,
      counterTermId: (proactiveClaimInfo?.counterTermId || selectedTotemId) as Hex,
      direction: voteDirection as 'for' | 'against',
      amount: trustAmount,
      isNewTotem,
    };

    console.log('[VoteTotemPanel] Cart item to add:', cartItem);
    console.log('[VoteTotemPanel] isNewTotem:', isNewTotem, '(triple exists on chain:', !!proactiveClaimInfo, ')');

    try {
      addItem(cartItem);

      console.log('[VoteTotemPanel] Item added to cart successfully!');
      setSuccess(t('founderExpanded.addedToCart') || 'Ajouté au panier !');
      setTimeout(() => setSuccess(null), 3000);

      // Reset amount after adding
      if (protocolConfig?.formattedMinDeposit) {
        setTrustAmount(protocolConfig.formattedMinDeposit);
      }
    } catch (err) {
      console.error('[VoteTotemPanel] Error adding to cart:', err);
      setError('Erreur lors de l\'ajout au panier');
      setTimeout(() => setError(null), 3000);
    }
    console.log('[VoteTotemPanel] ========== ADD TO CART END ==========');
  };

  if (!isConnected) {
    return (
      <div className="glass-card p-4 h-full flex flex-col items-center justify-center">
        <div className="w-16 h-16 rounded-full bg-slate-500/20 flex items-center justify-center mb-4">
          <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
          </svg>
        </div>
        <p className="text-white/60 text-sm text-center">{t('common.connectWalletToVote')}</p>
      </div>
    );
  }

  return (
    <div className="glass-card p-4 h-full flex flex-col overflow-y-auto overflow-x-hidden scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent" style={{ overscrollBehavior: 'contain' }}>
      {/* Header with cart button */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-white">Vote Totem</h3>
        {itemCount > 0 && (
          <button
            onClick={onOpenCart}
            className="flex items-center gap-2 px-3 py-1.5 bg-slate-500/20 hover:bg-slate-500/30 rounded-lg transition-colors"
          >
            <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <span className="text-sm text-slate-300">{itemCount}</span>
          </button>
        )}
      </div>

      {/* Notifications */}
      {success && <SuccessNotification message={success} onClose={() => setSuccess(null)} />}
      {error && <ErrorNotification message={error} onClose={() => setError(null)} />}

      {/* Content */}
      <div className="flex-1 overflow-y-auto space-y-4" style={{ overscrollBehavior: 'contain' }}>
        {/* Selected Totem */}
        <div>
          <label className="block text-xs text-white/60 mb-1">{t('founderExpanded.selectedTotem')}</label>
          {selectedTotemLabel ? (
            <div className="flex items-center justify-between bg-slate-500/20 rounded-lg p-3">
              <span className="text-white font-medium">{selectedTotemLabel}</span>
              <button
                onClick={onClearSelection}
                className="text-white/60 hover:text-white"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ) : (
            <div className="bg-white/5 rounded-lg p-3 text-white/40 text-sm text-center">
              {t('founderExpanded.selectTotemFromCenter')}
            </div>
          )}
        </div>

        {/* Predicate Selector */}
        <div>
          <label className="block text-xs text-white/60 mb-1">{t('founderExpanded.relationType')}</label>
          <div className="grid grid-cols-2 gap-2">
            {predicates.slice(0, 2).map((predicate) => (
              <button
                key={predicate.id}
                onClick={() => setSelectedPredicateId(predicate.id)}
                className={`p-2 rounded-lg text-sm transition-colors ${
                  selectedPredicateId === predicate.id
                    ? 'bg-slate-500/30 text-slate-300 ring-1 ring-slate-500/50'
                    : 'bg-white/5 text-white/70 hover:bg-white/10'
                }`}
              >
                {predicate.label}
              </button>
            ))}
          </div>
        </div>

        {/* Vote Direction */}
        <div>
          <label className="block text-xs text-white/60 mb-1">Action</label>
          <div className="flex gap-2">
            <button
              onClick={() => setVoteDirection('for')}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                voteDirection === 'for'
                  ? 'bg-green-500/30 text-green-300 ring-1 ring-green-500/50'
                  : 'bg-white/5 text-white/60 hover:bg-white/10'
              }`}
            >
              FOR
            </button>
            <button
              onClick={() => setVoteDirection('against')}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                voteDirection === 'against'
                  ? 'bg-red-500/30 text-red-300 ring-1 ring-red-500/50'
                  : 'bg-white/5 text-white/60 hover:bg-white/10'
              }`}
            >
              AGAINST
            </button>
            <button
              onClick={() => setVoteDirection('withdraw')}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                voteDirection === 'withdraw'
                  ? 'bg-orange-500/30 text-orange-300 ring-1 ring-orange-500/50'
                  : 'bg-white/5 text-white/60 hover:bg-white/10'
              }`}
            >
              {t('founderExpanded.withdraw')}
            </button>
          </div>
        </div>

        {/* Show PositionModifier when in withdraw mode AND user has a position */}
        {voteDirection === 'withdraw' && hasAnyPosition && proactiveClaimInfo && positionDirection ? (
          <PositionModifier
            termId={proactiveClaimInfo.termId as Hex}
            position={{
              direction: positionDirection,
              shares: currentUserShares,
            }}
            minDeposit={protocolConfig?.formattedMinDeposit || '0.0001'}
            balance={balanceData?.formatted}
            onAddMore={handleAddMore}
            onWithdraw={handleWithdraw}
            onSwitchSide={handleSwitchSide}
            disabled={withdrawLoading || positionLoading}
          />
        ) : voteDirection === 'withdraw' && !hasAnyPosition && !positionLoading ? (
          /* No position to withdraw */
          <div className="bg-orange-500/10 border border-orange-500/30 rounded-lg p-4 text-center">
            <p className="text-orange-300 text-sm mb-2">
              {t('founderExpanded.noPositionToWithdraw') || 'Vous n\'avez pas de position sur ce totem'}
            </p>
            <p className="text-white/50 text-xs">
              {t('founderExpanded.voteFirstToWithdraw') || 'Votez FOR ou AGAINST d\'abord pour pouvoir retirer'}
            </p>
          </div>
        ) : (
          /* Normal vote flow - Amount Input */
          <>
            <div>
              <label className="block text-xs text-white/60 mb-1">
                {t('founderExpanded.amountTrust')}
              </label>
              <input
                type="text"
                value={trustAmount}
                onChange={(e) => setTrustAmount(e.target.value)}
                placeholder={protocolConfig?.formattedMinDeposit || '0.0001'}
                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm placeholder-white/30 focus:outline-none focus:border-slate-500"
              />
              {!configLoading && balanceData && (
                <PresetButtonsCompact
                  onChange={setTrustAmount}
                  minAmount={protocolConfig?.formattedMinDeposit || '0.0001'}
                  maxAmount={balanceData.formatted}
                  className="mt-2"
                />
              )}
            </div>

            {/* Preview */}
            {selectedTotemLabel && (
              <div className="bg-white/5 rounded-lg p-3">
                <div className="text-xs text-white/60 mb-1">
                  {t('founderExpanded.votePreview')}
                </div>
                <p className="text-sm text-white">
                  <span className="text-slate-400">{founder.name}</span>
                  {' '}{selectedPredicate?.label || '...'}{' '}
                  <span className="text-slate-400">{selectedTotemLabel}</span>
                </p>
                <p className="text-xs text-white/50 mt-1">
                  {voteDirection === 'for' ? '👍 FOR' : '👎 AGAINST'} - {trustAmount || '0'} TRUST
                </p>
              </div>
            )}
          </>
        )}
      </div>

      {/* Action Button - only show for FOR/AGAINST, not withdraw (PositionModifier has its own buttons) */}
      {voteDirection !== 'withdraw' && (
        <div className="mt-4 pt-4 border-t border-white/10">
          <button
            onClick={handleAddToCart}
            disabled={!isFormValid}
            className={`w-full py-3 rounded-lg font-medium transition-colors ${
              isFormValid
                ? 'bg-slate-600 hover:bg-slate-700 text-white'
                : 'bg-white/10 text-white/40 cursor-not-allowed'
            }`}
          >
            {t('founderExpanded.addToCart')}
          </button>
          {itemCount > 0 && (
            <p className="text-center text-xs text-white/50 mt-2">
              {itemCount} {t('founderExpanded.votesInCart')} ({formattedNetCost} TRUST)
            </p>
          )}
        </div>
      )}
    </div>
  );
}
