// src/components/ErrorBoundary.jsx
// React ErrorBoundary: catches JavaScript errors anywhere in the component tree
// so the whole app doesn't crash. Shows a friendly fallback UI instead.
//
// ErrorBoundary must be a CLASS component — React hooks don't support
// componentDidCatch / getDerivedStateFromError yet.

import { Component } from 'react';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    // hasError = true means a child component threw an error
    this.state = { hasError: false, errorMessage: '' };
  }

  // Called when a child throws — updates state to show fallback UI
  static getDerivedStateFromError(error) {
    return { hasError: true, errorMessage: error.message };
  }

  // Called after getDerivedStateFromError — good place to log errors
  componentDidCatch(error, info) {
    // In production you'd send this to a service like Sentry
    console.error('[ErrorBoundary] Caught an error:', error, info);
  }

  render() {
    if (this.state.hasError) {
      // Friendly fallback UI — shown when any child component crashes
      return (
        <div className="min-h-screen bg-gray-950 flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-gray-900 border border-red-500/30 rounded-2xl p-8 text-center">
            <div className="text-6xl mb-4">💥</div>
            <h1 className="text-2xl font-bold text-white mb-2">
              Something went wrong
            </h1>
            <p className="text-gray-400 mb-2">
              An unexpected error occurred in this part of the application.
            </p>
            {/* Show the technical message in development to help debugging */}
            {this.state.errorMessage && (
              <p className="text-xs text-red-400 bg-red-900/20 border border-red-800/30 
                            rounded-lg px-3 py-2 mb-6 font-mono text-left break-all">
                {this.state.errorMessage}
              </p>
            )}
            <button
              onClick={() => window.location.reload()}
              className="bg-purple-600 hover:bg-purple-700 text-white font-semibold
                         px-6 py-2.5 rounded-xl transition"
            >
              🔄 Reload Page
            </button>
          </div>
        </div>
      );
    }

    // No error — render children normally
    return this.props.children;
  }
}

export default ErrorBoundary;
