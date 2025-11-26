import { useState, useEffect } from 'react';
import { useQuery } from '@apollo/client';
import { useAccount } from 'wagmi';
import { formatEther, type Hex } from 'viem';
import { useWithdraw, estimateWithdrawAmount } from '../hooks/useWithdraw';
import { GET_USER_POSITION } from '../lib/graphql/queries';

interface UserPosition {
  id: string;
  account_id: string;
  term_id: string;
  shares: string;
  total_deposit_assets_after_total_fees: string;
  total_redeem_assets_for_receiver: string;
}

interface WithdrawModalProps {
  isOpen: boolean;
  /** Triple ID to withdraw from */
  termId: string;
  /** Label for the claim (e.g., "Joseph Lubin represented_by Lion") */
  claimLabel: string;
  /** True if withdrawing from FOR vault, false for AGAINST */
  isPositive: boolean;
  /** Total shares in the vault (for estimation) */
  vaultTotalShares?: string;
  /** Total assets in the vault (for estimation) */
  vaultTotalAssets?: string;
  /** Called when modal should close */
  onClose: () => void;
  /** Called after successful withdrawal */
  onSuccess?: (txHash: string) => void;
}

/**
 * Modal for withdrawing TRUST from a claim vault
 *
 * Uses useWithdraw hook to handle the blockchain transaction.
 * Queries user's position to show available shares.
 */
export function WithdrawModal({
  isOpen,
  termId,
  claimLabel,
  isPositive,
  vaultTotalShares = '0',
  vaultTotalAssets = '0',
  onClose,
  onSuccess,
}: WithdrawModalProps) {
  const { address } = useAccount();
  const { withdraw, status, error, isLoading, reset } = useWithdraw();

  const [shareAmount, setShareAmount] = useState('');

  // Query user's position on this claim
  const { data: positionData, loading: positionLoading } = useQuery<{
    positions: UserPosition[];
  }>(GET_USER_POSITION, {
    variables: {
      walletAddress: address?.toLowerCase(),
      termId,
    },
    skip: !address || !isOpen,
    fetchPolicy: 'network-only',
  });

  const userPosition = positionData?.positions?.[0];
  const userShares = userPosition ? BigInt(userPosition.shares) : 0n;
  const hasShares = userShares > 0n;

  // Calculate estimated withdrawal amount
  const sharesToWithdraw = shareAmount ? BigInt(Math.floor(parseFloat(shareAmount) * 1e18)) : 0n;
  const preview = estimateWithdrawAmount(
    sharesToWithdraw,
    BigInt(vaultTotalShares || '0'),
    BigInt(vaultTotalAssets || '0')
  );

  // Reset on open
  useEffect(() => {
    if (isOpen) {
      reset();
      setShareAmount('');
    }
  }, [isOpen, reset]);

  // Handle successful withdrawal
  useEffect(() => {
    if (status === 'success') {
      const timer = setTimeout(() => {
        onClose();
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [status, onClose]);

  const handleWithdraw = async () => {
    if (!sharesToWithdraw || sharesToWithdraw <= 0n) return;

    const txHash = await withdraw(
      termId as Hex,
      sharesToWithdraw,
      isPositive,
      0n // minAssets - slippage protection
    );

    if (txHash && onSuccess) {
      onSuccess(txHash);
    }
  };

  const handleSetMax = () => {
    if (userShares > 0n) {
      setShareAmount(formatEther(userShares));
    }
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget && !isLoading) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={handleBackdropClick}
    >
      <div className="bg-gradient-to-b from-gray-900 to-gray-800 rounded-xl shadow-2xl border border-white/20 max-w-md w-full">
        {/* Header */}
        <div className="p-6 border-b border-white/10">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-white">Retirer TRUST</h2>
            {!isLoading && (
              <button
                onClick={onClose}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white/70 hover:text-white transition-colors"
              >
                ×
              </button>
            )}
          </div>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          {/* Claim info */}
          <div className="bg-purple-500/10 rounded-lg p-3 border border-purple-500/20">
            <p className="text-sm text-white/60 mb-1">Claim</p>
            <p className="text-white font-medium">{claimLabel}</p>
            <p className="text-xs text-white/40 mt-1">
              Position : {isPositive ? 'FOR' : 'AGAINST'}
            </p>
          </div>

          {/* Loading state */}
          {positionLoading && (
            <div className="text-center py-4">
              <div className="animate-spin w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full mx-auto mb-2" />
              <p className="text-white/60 text-sm">Chargement de votre position...</p>
            </div>
          )}

          {/* No shares state */}
          {!positionLoading && !hasShares && (
            <div className="text-center py-4">
              <p className="text-white/60">Vous n'avez pas de TRUST dans ce vault.</p>
              <button
                onClick={onClose}
                className="mt-4 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-white transition-colors"
              >
                Fermer
              </button>
            </div>
          )}

          {/* Has shares - show withdrawal form */}
          {!positionLoading && hasShares && (
            <>
              {/* User's position */}
              <div className="bg-green-500/10 rounded-lg p-3 border border-green-500/20">
                <p className="text-sm text-white/60 mb-1">Vos shares</p>
                <p className="text-green-400 font-bold text-lg">
                  {formatEther(userShares)} shares
                </p>
              </div>

              {/* Amount input */}
              <div>
                <label className="block text-sm text-white/60 mb-2">
                  Montant à retirer (shares)
                </label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    value={shareAmount}
                    onChange={(e) => setShareAmount(e.target.value)}
                    placeholder="0.0"
                    min="0"
                    step="0.001"
                    disabled={isLoading}
                    className="flex-1 bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white placeholder-white/40 focus:outline-none focus:border-purple-500 disabled:opacity-50"
                  />
                  <button
                    onClick={handleSetMax}
                    disabled={isLoading}
                    className="px-3 py-2 bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                  >
                    MAX
                  </button>
                </div>
              </div>

              {/* Estimation */}
              {sharesToWithdraw > 0n && (
                <div className="bg-white/5 rounded-lg p-3">
                  <p className="text-sm text-white/60 mb-1">Estimation (après frais ~7%)</p>
                  <p className="text-white font-medium">
                    ~{preview.formattedAssets} TRUST
                  </p>
                </div>
              )}

              {/* Error display */}
              {error && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3">
                  <p className="text-red-400 text-sm">{error.message}</p>
                </div>
              )}

              {/* Success display */}
              {status === 'success' && (
                <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3">
                  <p className="text-green-400 text-sm">Retrait effectué avec succès !</p>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        {!positionLoading && hasShares && (
          <div className="p-6 border-t border-white/10 flex gap-3">
            <button
              onClick={onClose}
              disabled={isLoading}
              className="flex-1 py-3 rounded-lg bg-white/10 hover:bg-white/20 text-white/70 hover:text-white transition-colors disabled:opacity-50"
            >
              Annuler
            </button>
            <button
              onClick={handleWithdraw}
              disabled={isLoading || sharesToWithdraw <= 0n || sharesToWithdraw > userShares}
              className="flex-1 py-3 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                  Retrait...
                </span>
              ) : (
                'Retirer'
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default WithdrawModal;
