/**
 * PositionModifier - Component to modify an existing position
 *
 * Shows current position and allows:
 * - Adding more to current direction
 * - Withdrawing (partial or full)
 * - Switching direction (withdraw + deposit opposite)
 *
 * @see Phase 4.5 in TODO_Implementation.md
 */

import { useState, useMemo } from 'react';
import { formatEther } from 'viem';
import type { Hex } from 'viem';
import { PresetButtons } from './PresetButtons';
import { usePreviewRedeem } from '../../hooks';
import { truncateAmount } from '../../utils/formatters';
import { SUPPORT_COLORS, OPPOSE_COLORS } from '../../config/colors';

interface Position {
  direction: 'for' | 'against';
  shares: bigint;
  /** Formatted shares for display */
  formattedShares?: string;
}

interface PositionModifierProps {
  /** Term ID for the triple */
  termId: Hex;
  /** Current user position */
  position: Position;
  /** Protocol minimum deposit */
  minDeposit?: string;
  /** User's available balance */
  balance?: string;
  /** Callback when user wants to add more */
  onAddMore: (amount: string, direction: 'for' | 'against') => void;
  /** Callback when user wants to withdraw */
  onWithdraw: (shares: bigint, percentage: number) => void;
  /** Callback when user wants to switch sides */
  onSwitchSide: (newDirection: 'for' | 'against') => void;
  /** Whether actions are disabled */
  disabled?: boolean;
  /** Optional className */
  className?: string;
}

type ModifyAction = 'add' | 'withdraw' | 'switch';

/**
 * PositionModifier component
 *
 * @example
 * ```tsx
 * function VoteCard({ termId, position }) {
 *   return (
 *     <PositionModifier
 *       termId={termId}
 *       position={position}
 *       minDeposit="0.0001"
 *       balance="1.5"
 *       onAddMore={(amount, direction) => {
 *         // Add to cart or execute directly
 *       }}
 *       onWithdraw={(shares, pct) => {
 *         // Execute withdrawal
 *       }}
 *       onSwitchSide={(newDirection) => {
 *         // Withdraw current + deposit opposite
 *       }}
 *     />
 *   );
 * }
 * ```
 */
export function PositionModifier({
  termId,
  position,
  minDeposit = '0.0001',
  balance,
  onAddMore,
  onWithdraw,
  onSwitchSide,
  disabled = false,
  className = '',
}: PositionModifierProps) {
  const [action, setAction] = useState<ModifyAction | null>(null);
  const [addAmount, setAddAmount] = useState(minDeposit);
  const [withdrawPercent, setWithdrawPercent] = useState(100);

  const { preview, currentPreview, loading: previewLoading } = usePreviewRedeem();

  // Format current position
  const formattedPosition = useMemo(() => {
    const shares = position.formattedShares || formatEther(position.shares);
    return truncateAmount(parseFloat(shares));
  }, [position]);

  // Calculate shares to withdraw based on percentage
  const sharesToWithdraw = useMemo(() => {
    return (position.shares * BigInt(withdrawPercent)) / 100n;
  }, [position.shares, withdrawPercent]);

  // Preview withdrawal when percentage changes
  const handleWithdrawPercentChange = async (percent: number) => {
    setWithdrawPercent(percent);
    const shares = (position.shares * BigInt(percent)) / 100n;
    if (shares > 0n) {
      await preview(termId, shares);
    }
  };

  const handleAddSubmit = () => {
    if (addAmount && parseFloat(addAmount) > 0) {
      onAddMore(addAmount, position.direction);
      setAction(null);
    }
  };

  const handleWithdrawSubmit = () => {
    if (sharesToWithdraw > 0n) {
      onWithdraw(sharesToWithdraw, withdrawPercent);
      setAction(null);
    }
  };

  const handleSwitchSubmit = () => {
    const newDirection = position.direction === 'for' ? 'against' : 'for';
    onSwitchSide(newDirection);
    setAction(null);
  };

  const directionLabel = position.direction === 'for' ? 'Support' : 'Oppose';
  const directionColorValue = position.direction === 'for' ? SUPPORT_COLORS.base : OPPOSE_COLORS.base;
  const oppositeLabel = position.direction === 'for' ? 'Oppose' : 'Support';

  return (
    <div className={`bg-white/5 border border-white/10 rounded-lg p-4 ${className}`}>
      {/* Current Position Display */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <span className="text-xs text-white/50">Position actuelle</span>
          <div className="flex items-center gap-2 mt-1">
            <span className="font-semibold" style={{ color: directionColorValue }}>{directionLabel}</span>
            <span className="text-white">{formattedPosition} shares</span>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      {!action && (
        <div className="flex gap-2">
          <button
            onClick={() => setAction('add')}
            disabled={disabled}
            className="flex-1 px-3 py-2 text-sm bg-slate-500/20 text-slate-300 rounded-lg hover:bg-slate-500/30 transition-colors disabled:opacity-50"
          >
            + Ajouter
          </button>
          <button
            onClick={() => {
              setAction('withdraw');
              handleWithdrawPercentChange(100);
            }}
            disabled={disabled}
            className="flex-1 px-3 py-2 text-sm bg-white/10 text-white/70 rounded-lg hover:bg-white/20 transition-colors disabled:opacity-50"
          >
            Retirer
          </button>
          <button
            onClick={() => setAction('switch')}
            disabled={disabled}
            className="flex-1 px-3 py-2 text-sm bg-orange-500/20 text-orange-300 rounded-lg hover:bg-orange-500/30 transition-colors disabled:opacity-50"
          >
            Changer
          </button>
        </div>
      )}

      {/* Add More Panel */}
      {action === 'add' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-white/70">Ajouter à la position {directionLabel}</span>
            <button
              onClick={() => setAction(null)}
              className="text-xs text-white/50 hover:text-white"
            >
              Annuler
            </button>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="number"
              value={addAmount}
              onChange={(e) => setAddAmount(e.target.value)}
              min={minDeposit}
              step="0.0001"
              className="flex-1 px-3 py-2 bg-black/30 border border-white/20 rounded-lg text-white text-sm"
              placeholder="Montant TRUST"
            />
            <span className="text-sm text-white/50">TRUST</span>
          </div>

          <PresetButtons
            value={addAmount}
            onChange={setAddAmount}
            balance={balance}
            minAmount={minDeposit}
          />

          <button
            onClick={handleAddSubmit}
            disabled={disabled || !addAmount || parseFloat(addAmount) <= 0}
            className="w-full px-4 py-2 bg-slate-500 text-white rounded-lg hover:bg-slate-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Ajouter au panier
          </button>
        </div>
      )}

      {/* Withdraw Panel */}
      {action === 'withdraw' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-white/70">Retirer de la position</span>
            <button
              onClick={() => setAction(null)}
              className="text-xs text-white/50 hover:text-white"
            >
              Annuler
            </button>
          </div>

          {/* Percentage Slider */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-white/70">Pourcentage</span>
              <span className="text-white font-medium">{withdrawPercent}%</span>
            </div>
            <input
              type="range"
              min="10"
              max="100"
              step="10"
              value={withdrawPercent}
              onChange={(e) => handleWithdrawPercentChange(parseInt(e.target.value))}
              className="w-full accent-slate-500"
            />
            <div className="flex justify-between text-xs text-white/50">
              <span>10%</span>
              <span>50%</span>
              <span>100%</span>
            </div>
          </div>

          {/* Preview */}
          {previewLoading ? (
            <div className="text-sm text-white/50">Calcul...</div>
          ) : currentPreview ? (
            <div className="bg-black/30 rounded-lg p-3 space-y-1">
              <div className="flex justify-between text-sm">
                <span className="text-white/70">Shares à retirer</span>
                <span className="text-white">{currentPreview.sharesFormatted}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-white/70">Vous recevrez</span>
                <span className="text-green-400">{currentPreview.netAmountFormatted} TRUST</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-white/50">Frais de sortie ({currentPreview.exitFeePercent})</span>
                <span className="text-red-400">-{currentPreview.exitFeeFormatted} TRUST</span>
              </div>
            </div>
          ) : null}

          <button
            onClick={handleWithdrawSubmit}
            disabled={disabled || sharesToWithdraw <= 0n}
            className="w-full px-4 py-2 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Confirmer le retrait
          </button>
        </div>
      )}

      {/* Switch Side Panel */}
      {action === 'switch' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-white/70">Changer de côté</span>
            <button
              onClick={() => setAction(null)}
              className="text-xs text-white/50 hover:text-white"
            >
              Annuler
            </button>
          </div>

          <div className="bg-orange-500/10 border border-orange-500/30 rounded-lg p-3">
            <p className="text-sm text-orange-300">
              Cette action va retirer votre position {directionLabel} et voter {oppositeLabel} avec le même montant.
            </p>
            <p className="text-xs text-white/50 mt-2">
              Des frais de sortie et d'entrée s'appliqueront.
            </p>
          </div>

          <button
            onClick={handleSwitchSubmit}
            disabled={disabled}
            className="w-full px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Changer pour {oppositeLabel}
          </button>
        </div>
      )}
    </div>
  );
}
