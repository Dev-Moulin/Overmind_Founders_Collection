import { AlertCircle, WifiOff, Wallet, RefreshCw } from 'lucide-react';
import type { VoteError } from '../hooks/useVote';

/**
 * Props for VoteErrorAlert component
 */
interface VoteErrorAlertProps {
  error: VoteError;
  onRetry?: () => void;
  onDismiss?: () => void;
}

/**
 * Get error configuration based on error code
 */
function getErrorConfig(code: string) {
  switch (code) {
    case 'WALLET_NOT_CONNECTED':
      return {
        icon: Wallet,
        title: 'Wallet non connecté',
        color: 'text-orange-400',
        bgColor: 'bg-orange-500/10',
        borderColor: 'border-orange-500/30',
      };
    case 'INSUFFICIENT_BALANCE':
      return {
        icon: Wallet,
        title: 'Solde insuffisant',
        color: 'text-red-400',
        bgColor: 'bg-red-500/10',
        borderColor: 'border-red-500/30',
      };
    case 'INSUFFICIENT_GAS':
      return {
        icon: Wallet,
        title: 'Gas insuffisant',
        color: 'text-red-400',
        bgColor: 'bg-red-500/10',
        borderColor: 'border-red-500/30',
      };
    case 'USER_REJECTED':
      return {
        icon: AlertCircle,
        title: 'Transaction annulée',
        color: 'text-yellow-400',
        bgColor: 'bg-yellow-500/10',
        borderColor: 'border-yellow-500/30',
      };
    case 'NETWORK_ERROR':
      return {
        icon: WifiOff,
        title: 'Erreur réseau',
        color: 'text-blue-400',
        bgColor: 'bg-blue-500/10',
        borderColor: 'border-blue-500/30',
      };
    default:
      return {
        icon: AlertCircle,
        title: 'Erreur',
        color: 'text-red-400',
        bgColor: 'bg-red-500/10',
        borderColor: 'border-red-500/30',
      };
  }
}

/**
 * Alert component for vote errors
 *
 * Displays error messages with contextual styling and retry options.
 *
 * @example
 * ```tsx
 * function VoteModal() {
 *   const { error, reset } = useVote();
 *
 *   if (error) {
 *     return <VoteErrorAlert error={error} onRetry={reset} />;
 *   }
 * }
 * ```
 */
export function VoteErrorAlert({ error, onRetry, onDismiss }: VoteErrorAlertProps) {
  const config = getErrorConfig(error.code);
  const Icon = config.icon;

  return (
    <div
      className={`
        rounded-lg border p-4
        ${config.bgColor} ${config.borderColor}
        backdrop-blur-sm
      `}
    >
      <div className="flex items-start gap-3">
        <Icon className={`w-5 h-5 mt-0.5 ${config.color}`} />

        <div className="flex-1 min-w-0">
          <h4 className={`font-medium ${config.color}`}>
            {config.title}
          </h4>
          <p className="mt-1 text-sm text-white/70">
            {error.message}
          </p>

          {error.step && (
            <p className="mt-1 text-xs text-white/50">
              Étape: {error.step === 'checking' ? 'Vérification' : 'Dépôt'}
            </p>
          )}
        </div>

        {onDismiss && (
          <button
            onClick={onDismiss}
            className="text-white/50 hover:text-white/80 transition-colors"
          >
            <span className="sr-only">Fermer</span>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {onRetry && (
        <div className="mt-3 flex gap-2">
          <button
            onClick={onRetry}
            className={`
              flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium
              ${config.bgColor} ${config.color}
              hover:bg-white/10 transition-colors
            `}
          >
            <RefreshCw className="w-4 h-4" />
            Réessayer
          </button>
        </div>
      )}
    </div>
  );
}
