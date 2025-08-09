import { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen flex items-center justify-center bg-black">
          <div className="text-center space-y-6 p-8">
            <div className="flex justify-center">
              <div className="p-4 bg-red-500/20 rounded-full border border-red-500/30">
                <AlertTriangle className="h-12 w-12 text-red-400" />
              </div>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white mb-2">Something went wrong</h1>
              <p className="text-white/70 mb-6">
                We encountered an unexpected error. Please try refreshing the page.
              </p>
              <button
                onClick={() => window.location.reload()}
                className="inline-flex items-center space-x-2 px-6 py-3 bg-nova-purple/20 hover:bg-nova-purple/30 text-white rounded-xl border border-nova-purple/30 transition-all duration-300 hover:scale-105"
              >
                <RefreshCw className="h-5 w-5" />
                <span>Refresh Page</span>
              </button>
            </div>
            {import.meta.env.DEV && this.state.error && (
              <details className="text-left bg-white/5 rounded-lg p-4 border border-white/10">
                <summary className="text-white/70 cursor-pointer mb-2">Error Details</summary>
                <pre className="text-red-400 text-sm overflow-auto">
                  {this.state.error.toString()}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
