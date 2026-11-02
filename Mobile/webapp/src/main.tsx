import React, { Component, ErrorInfo, ReactNode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Sesh@ Runtime Exception caught:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#FFFBF2] text-slate-900 flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-white rounded-3xl p-6 shadow-xl border border-amber-200 text-center">
            <div className="w-12 h-12 bg-amber-100 text-amber-600 rounded-2xl flex items-center justify-center mx-auto mb-4 font-bold text-xl">
              @
            </div>
            <h2 className="text-lg font-bold text-slate-900 mb-2 font-heading">Sesh@ Workspace Recovery</h2>
            <p className="text-xs text-slate-600 mb-6 leading-relaxed">
              {this.state.error?.message || 'A temporary display issue occurred while loading notes.'}
            </p>
            <button
              onClick={() => {
                try {
                  localStorage.removeItem('sesh_cached_notes');
                } catch (_) {}
                window.location.reload();
              }}
              className="w-full py-3 px-4 bg-[#FFBF24] hover:bg-[#F59E0B] text-slate-900 font-bold rounded-xl text-sm transition shadow-sm cursor-pointer"
            >
              Refresh Sesh@ Workspace
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

// Global error logger for mobile WebViews
if (typeof window !== 'undefined') {
  window.addEventListener('error', (e) => {
    console.error('Global window error:', e.message, e.filename, e.lineno);
  });
  window.addEventListener('unhandledrejection', (e) => {
    console.warn('Unhandled Promise Rejection:', e.reason);
  });
}

createRoot(document.getElementById('root')!).render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
);
