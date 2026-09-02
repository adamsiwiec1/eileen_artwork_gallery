'use client';

import { Component, type ErrorInfo, type ReactNode } from 'react';

type Props = { children: ReactNode };
type State = { error: Error | null };

/**
 * Keeps a render error inside the routed content instead of unmounting the whole
 * app, so a customer still has the header, footer and a way out.
 *
 * Class component because React exposes no hook equivalent for
 * componentDidCatch.
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // Replace with your error reporter (Sentry et al) before launch.
    console.error('[boundary]', error, info.componentStack);
  }

  render() {
    if (!this.state.error) return this.props.children;

    return (
      <div className="mx-auto grid min-h-[70vh] max-w-xl place-items-center px-6 text-center">
        <div>
          <p className="text-[0.65rem] tracking-[0.3em] text-gilt uppercase">Something broke</p>
          <h1 className="mt-5 font-display text-3xl text-ink sm:text-4xl">
            We dropped a brush.
          </h1>
          <p className="mt-4 text-base leading-relaxed text-ink-muted">
            This part of the page failed to load. Your work in the studio is kept on the server, so
            reloading should pick it back up.
          </p>

          <div className="mt-9 flex flex-wrap justify-center gap-3">
            <button
              onClick={() => window.location.reload()}
              className="rounded-full bg-gilt px-7 py-3 text-sm font-medium text-canvas transition-all hover:bg-gilt-bright"
            >
              Reload the page
            </button>
            <a
              href="/"
              className="rounded-full border border-white/[0.12] px-7 py-3 text-sm text-ink-muted transition-all hover:border-white/30 hover:text-ink"
            >
              Back to the gallery
            </a>
          </div>

          {process.env.NODE_ENV === 'development' && (
            <pre className="scrollbar-slim mt-8 max-h-48 overflow-auto rounded-sm border border-rose/25 bg-rose/[0.06] p-4 text-left text-xs whitespace-pre-wrap text-ink-muted">
              {this.state.error.stack ?? this.state.error.message}
            </pre>
          )}
        </div>
      </div>
    );
  }
}
