import { formatError, type FormattedError } from '../utils/errorFormatter';

interface ErrorMessageProps {
  error: Error | unknown;
  onRetry?: () => void;
  onDismiss?: () => void;
  className?: string;
}

/**
 * Inline error message component
 *
 * Displays a formatted error message with optional retry and dismiss actions.
 *
 * @example
 * ```tsx
 * {error && (
 *   <ErrorMessage
 *     error={error}
 *     onRetry={handleRetry}
 *     onDismiss={() => setError(null)}
 *   />
 * )}
 * ```
 */
export function ErrorMessage({
  error,
  onRetry,
  onDismiss,
  className = '',
}: ErrorMessageProps) {
  const formatted: FormattedError = formatError(error);

  return (
    <div
      className={`glass-card bg-red-500/10 border-red-500/30 p-4 space-y-3 ${className}`}
      role="alert"
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 flex-1">
          {/* Icon */}
          <div className="text-2xl flex-shrink-0">⚠️</div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <h3 className="text-red-400 font-semibold mb-1">
              {formatted.title}
            </h3>
            <p className="text-white/80 text-sm">{formatted.message}</p>
            {formatted.action && (
              <p className="text-white/60 text-xs mt-2">{formatted.action}</p>
            )}
          </div>
        </div>

        {/* Dismiss Button */}
        {onDismiss && (
          <button
            onClick={onDismiss}
            className="text-white/60 hover:text-white transition-colors flex-shrink-0"
            aria-label="Fermer"
          >
            ✕
          </button>
        )}
      </div>

      {/* Actions */}
      {onRetry && formatted.canRetry && (
        <div className="flex gap-2 pt-2 border-t border-red-500/20">
          <button
            onClick={onRetry}
            className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 rounded-lg text-white text-sm transition-colors"
          >
            🔄 Réessayer
          </button>
        </div>
      )}
    </div>
  );
}
