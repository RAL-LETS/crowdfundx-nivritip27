import React from 'react';
import { captureError } from '../lib/monitoring';

interface Props {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

/**
 * ErrorBoundary
 * Catches uncaught render errors in child components.
 * Sends the error to Sentry (if configured) and shows a graceful fallback UI.
 */
class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    captureError(error, { componentStack: info.componentStack ?? '' });
  }

  handleReset = () => {
    this.setState({ hasError: false, error: undefined });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] px-6 text-center">
          <span className="material-symbols-outlined text-6xl text-outline-variant mb-4">
            error_outline
          </span>
          <h2 className="font-headline-md text-headline-md text-primary mb-2">
            Something went wrong
          </h2>
          <p className="font-body-md text-body-md text-on-surface-variant max-w-md mb-6">
            An unexpected error occurred. The error has been reported automatically.
            {this.state.error?.message && (
              <span className="block mt-2 font-mono-data text-label-md text-outline break-all">
                {this.state.error.message}
              </span>
            )}
          </p>
          <div className="flex gap-3">
            <button
              onClick={this.handleReset}
              className="bg-primary text-on-primary px-6 py-2 font-label-md font-bold rounded hover:opacity-90 active:scale-[0.98] transition-all"
            >
              Try Again
            </button>
            <button
              onClick={() => window.location.reload()}
              className="border border-outline-variant text-primary px-6 py-2 font-label-md rounded hover:bg-surface-container-highest transition-all"
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
