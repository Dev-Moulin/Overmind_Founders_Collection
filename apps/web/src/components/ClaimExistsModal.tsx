import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import type { Hex } from 'viem';
import { useVote } from '../hooks/useVote';
import { formatVoteAmount } from '../hooks/useFounderProposals';

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

  // Reset when modal opens
  useEffect(() => {
    if (isOpen) {
      setAmount(initialAmount);
      setDirection('for');
      setValidationError(null);
      reset();
    }
  }, [isOpen, initialAmount, reset]);

  // Close modal on success
  useEffect(() => {
    if (status === 'success') {
      setTimeout(() => {
        onVoteSuccess?.();
        onClose();
      }, 1500);
    }
  }, [status, onClose, onVoteSuccess]);

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
      <div className="bg-gradient-to-b from-gray-900 to-gray-800 rounded-xl shadow-2xl border border-white/20 max-w-lg w-full max-h-[90vh] overflow-y-auto">
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
                  {status === 'checking' && 'Vérification allowance...'}
                  {status === 'approving' && 'Approbation TRUST...'}
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
    </div>
  );
}
