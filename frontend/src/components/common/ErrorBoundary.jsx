import React from 'react';
import { AlertTriangle, RotateCcw, Home } from 'lucide-react';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an unhandled rendering error:', error, errorInfo);
    this.setState({ errorInfo });
  }

  handleReset = () => {
    const msg = String(this.state.error?.message || '');
    const isChunkError =
      msg.includes('Failed to fetch dynamically imported module') ||
      msg.includes('Importing a module script failed') ||
      msg.includes('Loading chunk');
    if (isChunkError && typeof window !== 'undefined') {
      sessionStorage.removeItem('brandlens_chunk_reloaded');
      window.location.reload();
      return;
    }
    this.setState({ hasError: false, error: null, errorInfo: null });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[50vh] flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-white rounded-3xl border border-rose-200/80 p-8 shadow-xl text-center space-y-5 animate-in fade-in zoom-in-95 duration-200">
            <div className="w-14 h-14 rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center mx-auto shadow-sm">
              <AlertTriangle className="w-7 h-7 stroke-[2.2]" />
            </div>

            <div className="space-y-2">
              <h3 className="text-base font-bold text-slate-900 tracking-tight">
                Something went wrong rendering this section
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                BrandLens AI encountered an unexpected client error. Your saved data and workspace rules remain secure.
              </p>
              {this.state.error?.message && (
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-left">
                  <p className="text-[11px] font-mono text-rose-600 break-words line-clamp-3">
                    {this.state.error.message}
                  </p>
                </div>
              )}
            </div>

            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={this.handleReset}
                className="px-4 py-2 bg-gradient-to-r from-brand-600 to-brand-700 hover:from-brand-700 hover:to-brand-800 text-white rounded-xl text-xs font-bold shadow-sm flex items-center gap-2 transition-all"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Retry Section</span>
              </button>
              {this.props.onGoHome && (
                <button
                  type="button"
                  onClick={() => {
                    this.handleReset();
                    this.props.onGoHome();
                  }}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold flex items-center gap-2 transition-colors"
                >
                  <Home className="w-3.5 h-3.5" />
                  <span>Dashboard</span>
                </button>
              )}
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
