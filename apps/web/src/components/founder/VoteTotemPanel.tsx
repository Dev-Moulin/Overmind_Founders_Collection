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
import type { Hex } from 'viem';
import type { FounderForHomePage } from '../../hooks';
import { useProtocolConfig } from '../../hooks';
import { useVoteCartContext } from '../../hooks/cart/useVoteCart';
import { useProactiveClaimCheck } from '../../hooks';
import { GET_ATOMS_BY_LABELS } from '../../lib/graphql/queries';
import { PresetButtonsCompact } from '../vote/PresetButtons';
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

  // Initialize amount with min deposit
  useEffect(() => {
    if (protocolConfig?.formattedMinDeposit && trustAmount === '') {
      setTrustAmount(protocolConfig.formattedMinDeposit);
    }
  }, [protocolConfig?.formattedMinDeposit]);

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

  const isFormValid = useMemo(() => {
    if (!selectedTotemId) return false;
    if (!selectedPredicateId) return false;
    if (!trustAmount || parseFloat(trustAmount) <= 0) return false;
    if (!isDepositValid(trustAmount)) return false;
    if (voteDirection === 'withdraw') return true; // Withdraw doesn't need predicate atomId
    if (!selectedPredicateWithAtom?.atomId) return false; // Need predicate atomId for votes
    return true;
  }, [selectedTotemId, selectedPredicateId, trustAmount, isDepositValid, voteDirection, selectedPredicateWithAtom]);

  // Handle add to cart - Full integration with useVoteCart
  const handleAddToCart = () => {
    if (!isFormValid) return;
    if (voteDirection === 'withdraw') {
      // Withdraw not supported in cart mode yet
      setError(t('founderExpanded.withdrawNotInCart') || 'Withdraw non disponible dans le panier');
      setTimeout(() => setError(null), 3000);
      return;
    }

    if (!selectedTotemId || !selectedPredicateWithAtom?.atomId) {
      setError('Données manquantes pour ajouter au panier');
      setTimeout(() => setError(null), 3000);
      return;
    }

    // For new triples (no proactiveClaimInfo), we need to create termId on-chain
    // For existing triples, we use the existing termId/counterTermId
    const isNewTotem = !proactiveClaimInfo;

    try {
      addItem({
        totemId: selectedTotemId as Hex,
        totemName: selectedTotemLabel || 'Unknown',
        predicateId: selectedPredicateWithAtom.atomId as Hex,
        termId: (proactiveClaimInfo?.termId || selectedTotemId) as Hex, // Use termId if exists, else totemId as placeholder
        counterTermId: (proactiveClaimInfo?.counterTermId || selectedTotemId) as Hex, // Same logic
        direction: voteDirection as 'for' | 'against',
        amount: trustAmount,
        isNewTotem,
      });

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
    <div className="glass-card p-4 h-full flex flex-col">
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
      <div className="flex-1 overflow-y-auto space-y-4">
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

        {/* Amount Input */}
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
              {voteDirection === 'withdraw' ? t('founderExpanded.withdrawPreview') : t('founderExpanded.votePreview')}
            </div>
            <p className="text-sm text-white">
              <span className="text-slate-400">{founder.name}</span>
              {' '}{selectedPredicate?.label || '...'}{' '}
              <span className="text-slate-400">{selectedTotemLabel}</span>
            </p>
            <p className="text-xs text-white/50 mt-1">
              {voteDirection === 'for' ? '👍 FOR' : voteDirection === 'against' ? '👎 AGAINST' : `🔄 ${t('founderExpanded.withdraw').toUpperCase()}`} - {trustAmount || '0'} TRUST
            </p>
          </div>
        )}
      </div>

      {/* Action Button */}
      <div className="mt-4 pt-4 border-t border-white/10">
        <button
          onClick={handleAddToCart}
          disabled={!isFormValid}
          className={`w-full py-3 rounded-lg font-medium transition-colors ${
            isFormValid
              ? voteDirection === 'withdraw'
                ? 'bg-orange-600 hover:bg-orange-700 text-white'
                : 'bg-slate-600 hover:bg-slate-700 text-white'
              : 'bg-white/10 text-white/40 cursor-not-allowed'
          }`}
        >
          {voteDirection === 'withdraw' ? t('founderExpanded.withdrawMyPosition') : t('founderExpanded.addToCart')}
        </button>
        {itemCount > 0 && (
          <p className="text-center text-xs text-white/50 mt-2">
            {itemCount} {t('founderExpanded.votesInCart')} ({formattedNetCost} TRUST)
          </p>
        )}
      </div>
    </div>
  );
}
