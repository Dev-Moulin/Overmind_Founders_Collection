import { Component, type ReactNode } from 'react';
import { formatError } from '../utils/errorFormatter';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

/**
 * Error Boundary component to catch and handle React rendering errors
 *
 * Wraps components to catch errors that occur during rendering, in lifecycle methods,
 * and in constructors of the whole tree below them.
 *
 * @example
 * ```tsx
 * <ErrorBoundary fallback={<div>Something went wrong</div>}>
 *   <MyComponent />
 * </ErrorBoundary>
 * ```
 */
export class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    // Log error to console
    console.error('[ErrorBoundary] Caught error:', error, errorInfo);

    // Call custom error handler if provided
    this.props.onError?.(error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError && this.state.error) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      const formatted = formatError(this.state.error);

      return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-purple-900 via-blue-900 to-black">
          <div className="glass-card p-8 max-w-lg w-full space-y-6">
            {/* Error Icon */}
            <div className="text-center">
              <div className="text-6xl mb-4">⚠️</div>
              <h1 className="text-3xl font-bold text-red-400 mb-2">
                {formatted.title}
              </h1>
              <p className="text-white/70">{formatted.message}</p>
              {formatted.action && (
                <p className="text-white/60 text-sm mt-2">{formatted.action}</p>
              )}
            </div>

            {/* Error Details (collapsed by default) */}
            <details className="glass-card bg-white/5 p-4">
              <summary className="cursor-pointer text-white/60 text-sm hover:text-white/80 transition-colors">
                Détails techniques
              </summary>
              <pre className="mt-3 text-xs text-red-300 overflow-x-auto">
                {this.state.error.message}
                {'\n\n'}
                {this.state.error.stack}
              </pre>
            </details>

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={this.handleReset}
                className="glass-button flex-1"
              >
                Réessayer
              </button>
              <button
                onClick={() => window.location.reload()}
                className="glass-button flex-1 bg-purple-500/20 hover:bg-purple-500/30"
              >
                Recharger la page
              </button>
            </div>

            {/* Support Link */}
            <div className="text-center">
              <a
                href="https://github.com/Dev-Moulin/intuition-founders-totem/issues"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-purple-400 hover:text-purple-300 transition-colors"
              >
                Signaler un problème →
              </a>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
