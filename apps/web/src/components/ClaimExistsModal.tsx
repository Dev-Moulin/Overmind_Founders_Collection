import { useState, useEffect, useRef } from 'react';
import { useAccount } from 'wagmi';
import { useQuery } from '@apollo/client';
import { formatEther, type Hex } from 'viem';
import { useVote } from '../hooks/useVote';
import { formatVoteAmount } from '../hooks/useFounderProposals';
import { GET_USER_POSITION } from '../lib/graphql/queries';
import { WithdrawModal } from './WithdrawModal';

interface UserPosition {
  id: string;
  shares: string;
}

export interface ExistingClaimInfo {
  termId: string;
  subjectLabel: string;
  predicateLabel: string;
  objectLabel: string;
  forVotes?: string;
  againstVotes?: string;
}

interface ClaimExistsModalProps {
  isOpen: boolean;
  onClose: () => void;
  claim: ExistingClaimInfo | null;
  initialAmount?: string;
  onVoteSuccess?: () => void;
}

/**
 * Modal that appears when a claim already exists.
 * Allows user to vote FOR or AGAINST the existing claim instead of creating a new one.
 */
export function ClaimExistsModal({
  isOpen,
  onClose,
  claim,
  initialAmount = '',
  onVoteSuccess,
}: ClaimExistsModalProps) {
  const { address } = useAccount();
  const { vote, status, error: voteError, isLoading, currentStep, totalSteps, reset } = useVote();

  const [amount, setAmount] = useState(initialAmount);
  const [direction, setDirection] = useState<'for' | 'against'>('for');
  const [validationError, setValidationError] = useState<string | null>(null);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const hasClosedRef = useRef(false); // Prevent multiple close attempts

  // Store callbacks in refs to avoid useEffect re-runs
  const onVoteSuccessRef = useRef(onVoteSuccess);
  const onCloseRef = useRef(onClose);

  // Update refs when props change
  useEffect(() => {
    onVoteSuccessRef.current = onVoteSuccess;
    onCloseRef.current = onClose;
  }, [onVoteSuccess, onClose]);

  // Query user's position on this claim
  const { data: positionData } = useQuery<{ positions: UserPosition[] }>(
    GET_USER_POSITION,
    {
      variables: {
        walletAddress: address?.toLowerCase(),
        termId: claim?.termId,
      },
      skip: !address || !claim?.termId || !isOpen,
      fetchPolicy: 'cache-and-network',
    }
  );

  const userPosition = positionData?.positions?.[0];
  const userShares = userPosition ? BigInt(userPosition.shares) : 0n;
  const hasUserPosition = userShares > 0n;

  // Reset when modal opens
  useEffect(() => {
    if (isOpen) {
      setAmount(initialAmount);
      setDirection('for');
      setValidationError(null);
      hasClosedRef.current = false; // Reset close flag when modal opens
      reset();
    }
  }, [isOpen, initialAmount, reset]);

  // Close modal on success (with cleanup and single-close protection)
  useEffect(() => {
    if (status === 'success' && !hasClosedRef.current) {
      hasClosedRef.current = true; // Prevent multiple closes
      const timeoutId = setTimeout(() => {
        onVoteSuccessRef.current?.();
        onCloseRef.current();
      }, 2000); // 2 seconds to see the success message

      return () => {
        clearTimeout(timeoutId);
      };
    }
  }, [status]); // Only depend on status, callbacks are stored in refs

  const handleSubmit = async () => {
    setValidationError(null);

    if (!claim?.termId) {
      setValidationError('Claim ID manquant');
      return;
    }

    if (!amount || parseFloat(amount) <= 0) {
      setValidationError('Veuillez entrer un montant valide');
      return;
    }

    if (!address) {
      setValidationError('Veuillez connecter votre wallet');
      return;
    }

    try {
      await vote(claim.termId as Hex, amount, direction === 'for');
    } catch (err) {
      console.error('Vote submission error:', err);
    }
  };

  if (!isOpen || !claim) return null;

  const error = validationError || voteError?.message;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-linear-to-b from-gray-900 to-gray-800 rounded-xl shadow-2xl border border-white/20 max-w-lg w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b border-white/10">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-2xl">!</span>
                <h2 className="text-xl font-bold text-amber-400">
                  Ce claim existe déjà
                </h2>
              </div>
              <p className="text-white/60 text-sm">
                Voulez-vous voter sur ce claim existant ?
              </p>
            </div>
            <button
              onClick={onClose}
              disabled={isLoading}
              className="text-white/60 hover:text-white transition-colors disabled:opacity-50"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6">
          {/* Claim Info */}
          <div className="p-4 rounded-lg bg-purple-500/10 border border-purple-500/30">
            <p className="text-white font-medium text-center">
              <span className="text-purple-400">{claim.subjectLabel}</span>
              {' '}
              <span className="text-white/70">{claim.predicateLabel}</span>
              {' '}
              <span className="text-purple-400">{claim.objectLabel}</span>
            </p>
            {(claim.forVotes || claim.againstVotes) && (
              <div className="flex justify-center gap-4 mt-3 text-sm">
                <span className="text-green-400">
                  {formatVoteAmount(claim.forVotes || '0')} FOR
                </span>
                <span className="text-red-400">
                  {formatVoteAmount(claim.againstVotes || '0')} AGAINST
                </span>
              </div>
            )}
          </div>

          {/* User's existing position */}
          {hasUserPosition && (
            <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/30">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-white/60">Votre position actuelle</p>
                  <p className="text-green-400 font-bold">
                    {formatEther(userShares)} shares
                  </p>
                </div>
                <button
                  onClick={() => setShowWithdrawModal(true)}
                  disabled={isLoading}
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
                >
                  Retirer
                </button>
              </div>
            </div>
          )}

          {/* Vote Direction Selection */}
          <div>
            <label className="block text-sm font-medium text-white/80 mb-3">
              Direction du vote :
            </label>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setDirection('for')}
                disabled={isLoading}
                className={`flex-1 py-3 px-4 rounded-lg font-medium transition-all ${
                  direction === 'for'
                    ? 'bg-green-600 text-white border-2 border-green-400'
                    : 'bg-white/10 text-white/60 border-2 border-transparent hover:bg-white/20'
                }`}
              >
                FOR
              </button>
              <button
                type="button"
                onClick={() => setDirection('against')}
                disabled={isLoading}
                className={`flex-1 py-3 px-4 rounded-lg font-medium transition-all ${
                  direction === 'against'
                    ? 'bg-red-600 text-white border-2 border-red-400'
                    : 'bg-white/10 text-white/60 border-2 border-transparent hover:bg-white/20'
                }`}
              >
                AGAINST
              </button>
            </div>
          </div>

          {/* Amount Input */}
          <div>
            <label className="block text-sm font-medium text-white/80 mb-2">
              Montant (TRUST)
            </label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.0"
              min="0"
              step="0.01"
              disabled={isLoading}
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white text-lg placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50"
            />
            <p className="mt-2 text-sm text-white/60">
              Montant de TRUST à déposer pour ce vote
            </p>
          </div>

          {/* Progress Indicator */}
          {isLoading && (
            <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/30">
              <div className="flex items-center justify-between mb-2">
                <span className="text-blue-400 font-medium">
                  {status === 'checking' && 'Vérification balance...'}
                  {status === 'depositing' && 'Envoi du vote...'}
                </span>
                <span className="text-blue-400 text-sm">
                  Étape {currentStep}/{totalSteps}
                </span>
              </div>
              <div className="w-full bg-white/10 rounded-full h-2">
                <div
                  className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${(currentStep / totalSteps) * 100}%` }}
                />
              </div>
            </div>
          )}

          {/* Success Message */}
          {status === 'success' && (
            <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/30">
              <p className="text-green-400 font-medium text-center">
                Vote enregistré avec succès ! Fermeture...
              </p>
            </div>
          )}

          {/* Error Message */}
          {error && status !== 'success' && (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-white/10 flex gap-3">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="flex-1 px-4 py-3 bg-white/10 hover:bg-white/20 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Annuler
          </button>
          <button
            onClick={handleSubmit}
            disabled={isLoading || !address || status === 'success'}
            className={`flex-1 px-4 py-3 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
              direction === 'for'
                ? 'bg-green-600 hover:bg-green-700 text-white'
                : 'bg-red-600 hover:bg-red-700 text-white'
            }`}
          >
            {isLoading ? `Étape ${currentStep}/${totalSteps}...` : `Voter ${direction === 'for' ? 'FOR' : 'AGAINST'}`}
          </button>
        </div>
      </div>

      {/* Withdraw Modal */}
      {claim && (
        <WithdrawModal
          isOpen={showWithdrawModal}
          termId={claim.termId}
          claimLabel={`${claim.subjectLabel} ${claim.predicateLabel} ${claim.objectLabel}`}
          isPositive={true}
          vaultTotalShares={claim.forVotes}
          vaultTotalAssets={claim.forVotes}
          onClose={() => setShowWithdrawModal(false)}
          onSuccess={() => {
            setShowWithdrawModal(false);
            onVoteSuccess?.();
          }}
        />
      )}
    </div>
  );
}
