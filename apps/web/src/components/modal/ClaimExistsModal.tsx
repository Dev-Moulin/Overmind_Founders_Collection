import { useState, useEffect, useRef } from 'react';
import { useAccount } from 'wagmi';
import { useQuery } from '@apollo/client';
import { formatEther, type Hex, type Address } from 'viem';
import { useTranslation } from 'react-i18next';
import { useVote } from '../../hooks';
import { formatVoteAmount } from '../../hooks';
import { usePositionBothSides } from '../../hooks';
import { GET_USER_POSITION } from '../../lib/graphql/queries';
import { WithdrawModal } from './WithdrawModal';
import type { ExistingClaimInfo } from '../../types/claim';
import { SUPPORT_COLORS, OPPOSE_COLORS } from '../../config/colors';
import { getCacheFetchPolicy, TWO_MINUTES } from '../../lib/queryCacheTTL';

// Re-export for backward compatibility
export type { ExistingClaimInfo } from '../../types/claim';

interface UserPosition {
  id: string;
  shares: string;
}

type UserVoteDirection = 'for' | 'against' | null;

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
  const { t } = useTranslation();
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

  // Read user's positions directly from the contract (source of truth)
  // This is more reliable than GraphQL which can have indexer delays
  const {
    forShares,
    againstShares,
    positionDirection: contractPositionDirection,
    hasAnyPosition: hasContractPosition,
  } = usePositionBothSides(
    isOpen ? (address as Address | undefined) : undefined,
    isOpen ? (claim?.termId as Hex | undefined) : undefined,
    isOpen ? (claim?.counterTermId as Hex | undefined) : undefined
  );

  // TTL-based cache policy: only fetch if data is older than 5 minutes
  const positionFetchPolicy = getCacheFetchPolicy(
    'GetUserPosition',
    { walletAddress: address?.toLowerCase(), termId: claim?.termId?.toLowerCase() },
    TWO_MINUTES
  );

  // Also query GraphQL as fallback (for display purposes)
  const { data: forPositionData } = useQuery<{ positions: UserPosition[] }>(
    GET_USER_POSITION,
    {
      variables: {
        walletAddress: address?.toLowerCase(),
        termId: claim?.termId?.toLowerCase(),
      },
      skip: !address || !claim?.termId || !isOpen,
      // TTL-based: 'cache-first' if fresh, 'cache-and-network' if stale
      fetchPolicy: positionFetchPolicy,
      nextFetchPolicy: 'cache-first',
    }
  );

  // Use contract data (source of truth) for position direction
  // Fall back to GraphQL only if contract shows no position but GraphQL does
  const graphqlForShares = forPositionData?.positions?.[0]
    ? BigInt(forPositionData.positions[0].shares)
    : 0n;

  const userExistingDirection: UserVoteDirection =
    contractPositionDirection ??
    (graphqlForShares > 0n ? 'for' : null);
  const userShares = userExistingDirection === 'for' ? forShares : againstShares;
  const hasUserPosition = hasContractPosition || graphqlForShares > 0n;

  // Debug: Log position detection results
  useEffect(() => {
    if (isOpen && claim) {
      console.log('[ClaimExistsModal] Position detection (contract + graphql):', {
        termId: claim.termId,
        counterTermId: claim.counterTermId,
        contract: {
          forShares: forShares.toString(),
          againstShares: againstShares.toString(),
          direction: contractPositionDirection,
          hasPosition: hasContractPosition,
        },
        graphql: {
          forShares: graphqlForShares.toString(),
        },
        final: {
          direction: userExistingDirection,
          hasPosition: hasUserPosition,
        },
      });
    }
  }, [isOpen, claim, forShares, againstShares, contractPositionDirection, hasContractPosition, graphqlForShares, userExistingDirection, hasUserPosition]);

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

  // Check if user is trying to vote in opposite direction of existing position
  const isVotingOppositeDirection = hasUserPosition && userExistingDirection !== direction;

  const handleSubmit = async () => {
    setValidationError(null);

    if (!claim?.termId) {
      setValidationError(t('errors.claimIdMissing'));
      return;
    }

    if (!amount || parseFloat(amount) <= 0) {
      setValidationError(t('errors.invalidAmount'));
      return;
    }

    if (!address) {
      setValidationError(t('errors.connectWallet'));
      return;
    }

    // Prevent voting in opposite direction - must withdraw first
    if (isVotingOppositeDirection) {
      setValidationError(t('claimExists.cannotVoteOpposite', {
        currentDirection: userExistingDirection === 'for' ? t('vote.support') : t('vote.oppose'),
        targetDirection: direction === 'for' ? t('vote.support') : t('vote.oppose'),
      }));
      return;
    }

    try {
      console.log('[ClaimExistsModal] Vote submission:', {
        termId: claim.termId,
        counterTermId: claim.counterTermId,
        amount,
        isFor: direction === 'for',
        direction,
        userExistingDirection,
        hasUserPosition,
      });
      await vote({
        termId: claim.termId as Hex,
        counterTermId: claim.counterTermId as Hex | undefined,
        amount,
        isFor: direction === 'for',
      });
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
                  {t('claimExists.title')}
                </h2>
              </div>
              <p className="text-white/60 text-sm">
                {t('claimExists.subtitle')}
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
          <div className="p-4 rounded-lg bg-slate-500/10 border border-slate-500/30">
            <p className="text-white font-medium text-center">
              <span className="text-slate-400">{claim.subjectLabel}</span>
              {' '}
              <span className="text-white/70">{claim.predicateLabel}</span>
              {' '}
              <span className="text-slate-400">{claim.objectLabel}</span>
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
            <div
              className="p-4 rounded-lg border"
              style={{
                backgroundColor: `${userExistingDirection === 'for' ? SUPPORT_COLORS.base : OPPOSE_COLORS.base}1a`,
                borderColor: `${userExistingDirection === 'for' ? SUPPORT_COLORS.base : OPPOSE_COLORS.base}4d`,
              }}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-white/60">{t('claimExists.currentPosition')}</p>
                  <p
                    className="font-bold"
                    style={{ color: userExistingDirection === 'for' ? SUPPORT_COLORS.base : OPPOSE_COLORS.base }}
                  >
                    {formatEther(userShares)} {t('common.shares')} ({userExistingDirection === 'for' ? t('vote.support') : t('vote.oppose')})
                  </p>
                </div>
                <button
                  onClick={() => setShowWithdrawModal(true)}
                  disabled={isLoading}
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
                >
                  {t('claimExists.withdrawButton')}
                </button>
              </div>
              {/* Warning if user tries to vote in opposite direction */}
              {userExistingDirection && direction !== userExistingDirection && (
                <div className="mt-3 p-3 rounded bg-amber-500/20 border border-amber-500/40">
                  <p className="text-amber-400 text-sm mb-2">
                    {t('claimExists.cannotVoteOpposite', {
                      currentDirection: userExistingDirection === 'for' ? t('vote.support') : t('vote.oppose'),
                      targetDirection: direction === 'for' ? t('vote.support') : t('vote.oppose'),
                    })}
                  </p>
                  <button
                    onClick={() => setShowWithdrawModal(true)}
                    disabled={isLoading}
                    className="w-full px-3 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded font-medium text-sm transition-colors disabled:opacity-50"
                  >
                    {t('claimExists.withdrawFirst')}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Vote Direction Selection */}
          <div>
            <label className="block text-sm font-medium text-white/80 mb-3">
              {t('vote.direction')}
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
                {t('vote.for')}
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
                {t('vote.against')}
              </button>
            </div>
          </div>

          {/* Amount Input */}
          <div>
            <label className="block text-sm font-medium text-white/80 mb-2">
              {t('vote.amount')}
            </label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.0"
              min="0"
              step="0.01"
              disabled={isLoading}
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white text-lg placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-slate-500 disabled:opacity-50"
            />
            <p className="mt-2 text-sm text-white/60">
              {t('vote.amountHelper')}
            </p>
          </div>

          {/* Progress Indicator */}
          {isLoading && (
            <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/30">
              <div className="flex items-center justify-between mb-2">
                <span className="text-blue-400 font-medium">
                  {status === 'checking' && t('vote.checking')}
                  {status === 'depositing' && t('vote.depositing')}
                </span>
                <span className="text-blue-400 text-sm">
                  {t('vote.step')} {currentStep}/{totalSteps}
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
                {t('vote.success')}
              </p>
            </div>
          )}

          {/* Error Message */}
          {error && status !== 'success' && (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30">
              <p className="text-red-400 text-sm">{error}</p>
              {/* Show withdraw button if HasCounterStake error */}
              {(voteError?.code === 'HAS_COUNTER_STAKE' || error.includes('position')) && (
                <button
                  onClick={() => setShowWithdrawModal(true)}
                  className="mt-3 w-full px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-lg font-medium transition-colors"
                >
                  {t('claimExists.withdrawFirst')}
                </button>
              )}
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
            {t('common.cancel')}
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
            {isLoading ? `${t('vote.step')} ${currentStep}/${totalSteps}...` : `${t('vote.voteButton')} ${direction === 'for' ? t('vote.for') : t('vote.against')}`}
          </button>
        </div>
      </div>

      {/* Withdraw Modal - use correct termId based on user's position direction */}
      {/* If userExistingDirection is null but we got HAS_COUNTER_STAKE error,
          the user's position is OPPOSITE to the direction they tried to vote */}
      {claim && (() => {
        // Determine the actual position direction
        // If GraphQL query found a position, use that
        // Otherwise, if we got HAS_COUNTER_STAKE error, it's opposite to vote direction
        const actualPositionDirection = userExistingDirection ??
          (voteError?.code === 'HAS_COUNTER_STAKE' ? (direction === 'for' ? 'against' : 'for') : 'for');
        const isPositionAgainst = actualPositionDirection === 'against';

        return (
          <WithdrawModal
            isOpen={showWithdrawModal}
            termId={isPositionAgainst && claim.counterTermId ? claim.counterTermId : claim.termId}
            claimLabel={`${claim.subjectLabel} ${claim.predicateLabel} ${claim.objectLabel}`}
            isPositive={!isPositionAgainst}
            vaultTotalShares={isPositionAgainst ? claim.againstVotes : claim.forVotes}
            vaultTotalAssets={isPositionAgainst ? claim.againstVotes : claim.forVotes}
            onClose={() => setShowWithdrawModal(false)}
            onSuccess={() => {
              setShowWithdrawModal(false);
              onVoteSuccess?.();
            }}
          />
        );
      })()}
    </div>
  );
}
