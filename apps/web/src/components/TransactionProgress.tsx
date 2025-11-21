import { useEffect, useState } from 'react';

export type TransactionStatus =
  | 'idle'
  | 'preparing'
  | 'signature'
  | 'submitting'
  | 'confirming'
  | 'success'
  | 'error';

export interface TransactionStep {
  label: string;
  status: 'pending' | 'current' | 'complete' | 'error';
}

export interface TransactionProgressProps {
  isOpen: boolean;
  onClose: () => void;
  status: TransactionStatus;
  txHash?: string;
  error?: Error;
  steps?: TransactionStep[];
  currentStep?: number;
  onRetry?: () => void;
}

const STATUS_CONFIG: Record<
  TransactionStatus,
  {
    label: string;
    icon: string;
    color: string;
    description: string;
  }
> = {
  idle: {
    label: 'Prêt',
    icon: '⚡',
    color: 'text-white/60',
    description: 'En attente...',
  },
  preparing: {
    label: 'Préparation',
    icon: '⚙️',
    color: 'text-purple-400',
    description: 'Préparation de la transaction...',
  },
  signature: {
    label: 'Signature',
    icon: '✍️',
    color: 'text-yellow-400',
    description: 'Veuillez signer la transaction dans votre wallet',
  },
  submitting: {
    label: 'Envoi',
    icon: '📤',
    color: 'text-blue-400',
    description: 'Envoi de la transaction au réseau...',
  },
  confirming: {
    label: 'Confirmation',
    icon: '⏳',
    color: 'text-orange-400',
    description: 'En attente de confirmation sur la blockchain...',
  },
  success: {
    label: 'Succès',
    icon: '✅',
    color: 'text-green-400',
    description: 'Transaction confirmée avec succès !',
  },
  error: {
    label: 'Erreur',
    icon: '❌',
    color: 'text-red-400',
    description: 'Une erreur est survenue',
  },
};

export function TransactionProgress({
  isOpen,
  onClose,
  status,
  txHash,
  error,
  steps,
  currentStep: _currentStep,
  onRetry,
}: TransactionProgressProps) {
  const [dots, setDots] = useState('');

  // Animated dots for loading states
  useEffect(() => {
    if (
      status === 'preparing' ||
      status === 'submitting' ||
      status === 'confirming'
    ) {
      const interval = setInterval(() => {
        setDots((prev) => (prev.length >= 3 ? '' : prev + '.'));
      }, 500);
      return () => clearInterval(interval);
    } else {
      setDots('');
    }
  }, [status]);

  if (!isOpen) return null;

  const config = STATUS_CONFIG[status];
  const canClose = status === 'success' || status === 'error' || status === 'idle';
  const isPending =
    status === 'preparing' ||
    status === 'signature' ||
    status === 'submitting' ||
    status === 'confirming';

  const blockExplorerUrl = txHash
    ? `https://sepolia.basescan.org/tx/${txHash}`
    : undefined;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div
        className="glass-card p-8 max-w-lg w-full space-y-6 relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button (only when allowed) */}
        {canClose && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-white/60 hover:text-white transition-colors"
            aria-label="Fermer"
          >
            ✕
          </button>
        )}

        {/* Status Icon & Label */}
        <div className="text-center space-y-4">
          <div className="text-6xl animate-pulse">{config.icon}</div>
          <h2 className={`text-2xl font-bold ${config.color}`}>
            {config.label}
            {isPending && dots}
          </h2>
          <p className="text-white/70">{config.description}</p>
        </div>

        {/* Progress Spinner (for pending states) */}
        {isPending && (
          <div className="flex justify-center">
            <div className="w-16 h-16 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin"></div>
          </div>
        )}

        {/* Steps Progress (if provided) */}
        {steps && steps.length > 0 && (
          <div className="space-y-3">
            {steps.map((step, index) => (
              <div
                key={index}
                className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${
                  step.status === 'current'
                    ? 'bg-purple-500/20'
                    : step.status === 'complete'
                      ? 'bg-green-500/10'
                      : step.status === 'error'
                        ? 'bg-red-500/10'
                        : 'bg-white/5'
                }`}
              >
                {/* Step Indicator */}
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 font-bold text-sm ${
                    step.status === 'complete'
                      ? 'bg-green-500 text-white'
                      : step.status === 'current'
                        ? 'bg-purple-500 text-white animate-pulse'
                        : step.status === 'error'
                          ? 'bg-red-500 text-white'
                          : 'bg-white/10 text-white/60'
                  }`}
                >
                  {step.status === 'complete'
                    ? '✓'
                    : step.status === 'error'
                      ? '✕'
                      : index + 1}
                </div>

                {/* Step Label */}
                <span
                  className={`flex-1 ${
                    step.status === 'complete'
                      ? 'text-green-400'
                      : step.status === 'current'
                        ? 'text-white font-semibold'
                        : step.status === 'error'
                          ? 'text-red-400'
                          : 'text-white/60'
                  }`}
                >
                  {step.label}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Transaction Hash */}
        {txHash && (
          <div className="space-y-2">
            <div className="text-xs text-white/60">Transaction Hash</div>
            <div className="flex items-center gap-2">
              <code className="text-xs text-purple-300 bg-purple-900/20 px-3 py-2 rounded font-mono truncate flex-1">
                {txHash}
              </code>
              {blockExplorerUrl && (
                <a
                  href={blockExplorerUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-purple-400 hover:text-purple-300 text-sm whitespace-nowrap transition-colors"
                >
                  Voir ↗
                </a>
              )}
            </div>
          </div>
        )}

        {/* Error Message */}
        {status === 'error' && error && (
          <div className="glass-card bg-red-500/10 border-red-500/20 p-4 space-y-2">
            <div className="text-red-400 font-semibold text-sm">
              Erreur détaillée:
            </div>
            <div className="text-white/80 text-sm">
              {error.message || 'Une erreur inconnue est survenue'}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3">
          {status === 'error' && onRetry && (
            <button onClick={onRetry} className="glass-button flex-1">
              🔄 Réessayer
            </button>
          )}
          {canClose && (
            <button
              onClick={onClose}
              className={`glass-button flex-1 ${
                status === 'success'
                  ? 'bg-green-500/20 hover:bg-green-500/30 border-green-500/30'
                  : ''
              }`}
            >
              {status === 'success' ? '✓ Fermer' : 'Fermer'}
            </button>
          )}
        </div>

        {/* Pending Notice */}
        {isPending && (
          <div className="text-center text-xs text-white/40">
            Ne fermez pas cette fenêtre pendant le traitement...
          </div>
        )}
      </div>
    </div>
  );
}
