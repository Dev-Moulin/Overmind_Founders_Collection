/**
 * VoteCartPanel - Interface utilisateur du panier de votes
 *
 * Affiche le contenu du panier de votes et permet la validation en batch.
 *
 * @see Documentation: Claude/00_GESTION_PROJET/Projet_02_SDK_V2/TODO_Implementation.md
 */

import { formatEther } from 'viem';
import { useBatchVote } from '../../hooks/useBatchVote';
import type { VoteCart, VoteCartItem, VoteCartCostSummary } from '../../types/voteCart';

interface VoteCartPanelProps {
  /** The current cart */
  cart: VoteCart | null;
  /** Cost summary */
  costSummary: VoteCartCostSummary | null;
  /** Remove item callback */
  onRemoveItem: (itemId: string) => void;
  /** Clear cart callback */
  onClearCart: () => void;
  /** Update direction callback */
  onUpdateDirection: (itemId: string, direction: 'for' | 'against') => void;
  /** Update amount callback */
  onUpdateAmount: (itemId: string, amount: string) => void;
  /** Callback when batch is successfully executed */
  onSuccess?: () => void;
  /** Validation errors from cart */
  validationErrors: string[];
  /** Is cart valid */
  isValid: boolean;
}

/**
 * Single cart item display
 */
function CartItemRow({
  item,
  onRemove,
  onUpdateDirection,
  onUpdateAmount,
}: {
  item: VoteCartItem;
  onRemove: () => void;
  onUpdateDirection: (direction: 'for' | 'against') => void;
  onUpdateAmount: (amount: string) => void;
}) {
  const formattedAmount = Number(formatEther(item.amount)).toFixed(4);

  return (
    <div className="p-3 bg-white/5 rounded-lg border border-white/10">
      <div className="flex items-center justify-between mb-2">
        <span className="font-medium text-white">{item.totemName}</span>
        <button
          onClick={onRemove}
          className="text-white/40 hover:text-red-400 transition-colors"
          title="Retirer du panier"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div className="flex items-center gap-2 mb-2">
        {/* Direction toggle */}
        <div className="flex rounded-lg overflow-hidden border border-white/10">
          <button
            onClick={() => onUpdateDirection('for')}
            className={`px-3 py-1 text-xs font-medium transition-colors ${
              item.direction === 'for'
                ? 'bg-green-500/20 text-green-400'
                : 'bg-white/5 text-white/40 hover:text-white/60'
            }`}
          >
            FOR
          </button>
          <button
            onClick={() => onUpdateDirection('against')}
            className={`px-3 py-1 text-xs font-medium transition-colors ${
              item.direction === 'against'
                ? 'bg-red-500/20 text-red-400'
                : 'bg-white/5 text-white/40 hover:text-white/60'
            }`}
          >
            AGAINST
          </button>
        </div>

        {/* Amount input */}
        <div className="flex items-center gap-1 flex-1">
          <input
            type="number"
            min="0.001"
            step="0.001"
            value={formattedAmount}
            onChange={(e) => onUpdateAmount(e.target.value)}
            className="w-20 bg-white/5 border border-white/10 rounded px-2 py-1 text-sm text-white focus:outline-none focus:border-purple-500/50"
          />
          <span className="text-xs text-white/40">TRUST</span>
        </div>
      </div>

      {/* Warnings */}
      {item.needsWithdraw && (
        <div className="text-xs text-yellow-400/80 flex items-center gap-1">
          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          Position opposée existante - retrait automatique
        </div>
      )}

      {item.isNewTotem && (
        <div className="text-xs text-blue-400/80 flex items-center gap-1">
          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" />
          </svg>
          Nouveau totem - création incluse
        </div>
      )}
    </div>
  );
}

/**
 * Cost summary display
 */
function CostSummarySection({ summary }: { summary: VoteCartCostSummary }) {
  return (
    <div className="p-3 bg-purple-500/10 border border-purple-500/20 rounded-lg">
      <h4 className="text-xs font-semibold text-purple-400 mb-2">Récapitulatif</h4>
      <div className="space-y-1 text-sm">
        <div className="flex justify-between text-white/60">
          <span>Dépôts</span>
          <span>{Number(formatEther(summary.totalDeposits)).toFixed(4)} TRUST</span>
        </div>
        {summary.estimatedEntryFees > 0n && (
          <div className="flex justify-between text-white/40 text-xs">
            <span>Frais d'entrée (estimés)</span>
            <span>+{Number(formatEther(summary.estimatedEntryFees)).toFixed(4)} TRUST</span>
          </div>
        )}
        {summary.atomCreationCosts > 0n && (
          <div className="flex justify-between text-white/40 text-xs">
            <span>Création atoms ({summary.newTotemCount})</span>
            <span>+{Number(formatEther(summary.atomCreationCosts)).toFixed(4)} TRUST</span>
          </div>
        )}
        {summary.totalWithdrawable > 0n && (
          <div className="flex justify-between text-green-400/80 text-xs">
            <span>Retraits ({summary.withdrawCount})</span>
            <span>-{Number(formatEther(summary.totalWithdrawable)).toFixed(4)} TRUST</span>
          </div>
        )}
        <div className="border-t border-white/10 pt-1 mt-2">
          <div className="flex justify-between text-white font-medium">
            <span>Coût net</span>
            <span>{Number(formatEther(summary.netCost)).toFixed(4)} TRUST</span>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Main VoteCartPanel component
 */
export function VoteCartPanel({
  cart,
  costSummary,
  onRemoveItem,
  onClearCart,
  onUpdateDirection,
  onUpdateAmount,
  onSuccess,
  validationErrors,
  isValid,
}: VoteCartPanelProps) {
  const { executeBatch, status, error, isLoading, currentStep, totalSteps } = useBatchVote();

  const handleSubmit = async () => {
    if (!cart || !isValid) return;

    const result = await executeBatch(cart);
    if (result && onSuccess) {
      onSuccess();
    }
  };

  if (!cart || cart.items.length === 0) {
    return (
      <div className="p-4 bg-white/5 border border-white/10 rounded-lg text-center">
        <p className="text-white/40 text-sm">Votre panier de votes est vide</p>
        <p className="text-white/30 text-xs mt-1">
          Ajoutez des votes pour les soumettre en batch
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-white/70">
          Panier de votes ({cart.items.length})
        </h3>
        <button
          onClick={onClearCart}
          disabled={isLoading}
          className="text-xs text-white/40 hover:text-red-400 transition-colors disabled:opacity-50"
        >
          Vider le panier
        </button>
      </div>

      {/* Founder name */}
      <div className="text-xs text-white/50">
        Pour: <span className="text-white/70">{cart.founderName}</span>
      </div>

      {/* Cart items */}
      <div className="space-y-2 max-h-60 overflow-y-auto">
        {cart.items.map((item) => (
          <CartItemRow
            key={item.id}
            item={item}
            onRemove={() => onRemoveItem(item.id)}
            onUpdateDirection={(dir) => onUpdateDirection(item.id, dir)}
            onUpdateAmount={(amount) => onUpdateAmount(item.id, amount)}
          />
        ))}
      </div>

      {/* Cost summary */}
      {costSummary && <CostSummarySection summary={costSummary} />}

      {/* Validation errors */}
      {validationErrors.length > 0 && (
        <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
          <h4 className="text-xs font-semibold text-red-400 mb-1">Erreurs</h4>
          <ul className="text-xs text-red-300/80 space-y-1">
            {validationErrors.map((err, i) => (
              <li key={i}>{err}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Error from execution */}
      {error && (
        <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
          <p className="text-xs text-red-400">{error.message}</p>
        </div>
      )}

      {/* Submit button */}
      <button
        onClick={handleSubmit}
        disabled={!isValid || isLoading}
        className={`w-full py-3 px-4 rounded-lg font-medium transition-colors ${
          isValid && !isLoading
            ? 'bg-purple-600 hover:bg-purple-700 text-white'
            : 'bg-white/10 text-white/40 cursor-not-allowed'
        }`}
      >
        {isLoading ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
                fill="none"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            Étape {currentStep}/{totalSteps}...
          </span>
        ) : status === 'success' ? (
          <span className="flex items-center justify-center gap-2 text-green-400">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            Votes enregistrés !
          </span>
        ) : (
          `Valider ${cart.items.length} vote${cart.items.length > 1 ? 's' : ''}`
        )}
      </button>

      {/* Transaction info */}
      {costSummary && costSummary.withdrawCount > 0 && !isLoading && status !== 'success' && (
        <p className="text-xs text-white/40 text-center">
          {costSummary.withdrawCount > 0 ? '2' : '1'} transaction{costSummary.withdrawCount > 0 ? 's' : ''} à signer
        </p>
      )}
    </div>
  );
}
