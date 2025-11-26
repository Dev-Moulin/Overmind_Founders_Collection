import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import type { Hex } from 'viem';
import type { AggregatedTotem } from '../hooks/useAllTotems';
import { formatVoteAmount } from '../hooks/useFounderProposals';
import { useVote } from '../hooks/useVote';

interface VoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  totem: AggregatedTotem;
  direction: 'for' | 'against';
}

export function VoteModal({
  isOpen,
  onClose,
  totem,
  direction,
}: VoteModalProps) {
  const { address } = useAccount();
  const { vote, status, error: voteError, isLoading, currentStep, totalSteps, reset } = useVote();

  const [selectedClaimId, setSelectedClaimId] = useState<string>(
    totem.claims[0]?.tripleId || ''
  );
  const [amount, setAmount] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);

  // Reset when modal closes or totem changes
  useEffect(() => {
    if (isOpen) {
      setSelectedClaimId(totem.claims[0]?.tripleId || '');
      setAmount('');
      setValidationError(null);
      reset();
    }
  }, [totem, isOpen, reset]);

  // Close modal on success
  useEffect(() => {
    if (status === 'success') {
      setTimeout(() => {
        onClose();
      }, 1000);
    }
  }, [status, onClose]);

  const handleSubmit = async () => {
    setValidationError(null);

    if (!selectedClaimId) {
      setValidationError('Please select a claim');
      return;
    }

    if (!amount || parseFloat(amount) <= 0) {
      setValidationError('Please enter a valid amount');
      return;
    }

    if (!address) {
      setValidationError('Please connect your wallet');
      return;
    }

    try {
      await vote(selectedClaimId as Hex, amount, direction === 'for');
    } catch (err) {
      // Errors are handled by the useVote hook
      console.error('Vote submission error:', err);
    }
  };

  if (!isOpen) return null;

  const error = validationError || voteError?.message;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-linear-to-b from-gray-900 to-gray-800 rounded-xl shadow-2xl border border-white/20 max-w-lg w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b border-white/10">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-2xl font-bold text-white mb-2">
                Vote {direction === 'for' ? 'FOR' : 'AGAINST'}
              </h2>
              <div className="flex items-center gap-3">
                {totem.totemImage && (
                  <img
                    src={totem.totemImage}
                    alt={totem.totemLabel}
                    className="w-10 h-10 rounded-lg object-cover"
                  />
                )}
                <div>
                  <p className="text-lg font-semibold text-white">
                    {totem.totemLabel}
                  </p>
                  <p className="text-sm text-white/60">for {totem.founder.name}</p>
                </div>
              </div>
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
          {/* Claim Selection */}
          {totem.claims.length > 1 ? (
            <div>
              <label className="block text-sm font-medium text-white/80 mb-3">
                Select a specific claim to vote on:
              </label>
              <div className="space-y-2">
                {totem.claims.map((claim) => (
                  <label
                    key={claim.tripleId}
                    className={`block p-4 rounded-lg border transition-all cursor-pointer ${
                      selectedClaimId === claim.tripleId
                        ? 'border-blue-500 bg-blue-500/10'
                        : 'border-white/20 bg-white/5 hover:border-white/40'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <input
                        type="radio"
                        name="claim"
                        value={claim.tripleId}
                        checked={selectedClaimId === claim.tripleId}
                        onChange={(e) => setSelectedClaimId(e.target.value)}
                        disabled={isLoading}
                        className="mt-1"
                      />
                      <div className="flex-1">
                        <p className="text-white font-medium mb-1">
                          "{claim.predicate}"
                        </p>
                        <div className="flex gap-4 text-sm text-white/60">
                          <span className="text-green-400">
                            {formatVoteAmount(claim.forVotes.toString())} FOR
                          </span>
                          <span className="text-red-400">
                            {formatVoteAmount(claim.againstVotes.toString())} AGAINST
                          </span>
                          <span className="text-white/80">
                            {formatVoteAmount(claim.netScore.toString())} NET
                          </span>
                        </div>
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-lg border border-white/20 bg-white/5">
              <p className="text-white font-medium mb-1">
                Voting on: "{totem.claims[0]?.predicate}"
              </p>
              <div className="flex gap-4 text-sm text-white/60">
                <span className="text-green-400">
                  {formatVoteAmount((totem.claims[0]?.forVotes || 0n).toString())} FOR
                </span>
                <span className="text-red-400">
                  {formatVoteAmount((totem.claims[0]?.againstVotes || 0n).toString())} AGAINST
                </span>
                <span className="text-white/80">
                  {formatVoteAmount((totem.claims[0]?.netScore || 0n).toString())} NET
                </span>
              </div>
            </div>
          )}

          {/* Amount Input */}
          <div>
            <label className="block text-sm font-medium text-white/80 mb-2">
              Amount (TRUST)
            </label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.0"
              min="0"
              step="0.01"
              disabled={isLoading}
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white text-lg placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
            />
            <p className="mt-2 text-sm text-white/60">
              Enter the amount of TRUST tokens to vote with
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
                Vote successfully recorded! Closing...
              </p>
            </div>
          )}

          {/* Error Message */}
          {error && status !== 'success' && (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          {/* Vote Direction Indicator */}
          {!isLoading && status !== 'success' && (
            <div
              className={`p-4 rounded-lg border ${
                direction === 'for'
                  ? 'bg-green-500/10 border-green-500/30'
                  : 'bg-red-500/10 border-red-500/30'
              }`}
            >
              <p
                className={`text-center font-medium ${
                  direction === 'for' ? 'text-green-400' : 'text-red-400'
                }`}
              >
                You are voting {direction === 'for' ? 'FOR' : 'AGAINST'} this totem
              </p>
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
            Cancel
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
            {isLoading ? `Step ${currentStep}/${totalSteps}...` : 'Confirm Vote'}
          </button>
        </div>
      </div>
    </div>
  );
}
