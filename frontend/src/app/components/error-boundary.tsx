"use client";

import React from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

interface State {
  hasError: boolean;
  error?: Error;
}

interface Props {
  children: React.ReactNode;
  /** Optional label used in the fallback so users know what failed. */
  label?: string;
}

/**
 * Error boundary that wraps high-risk regions (charts, AI chat, 3D scenes)
 * so a single render crash doesn't whitepage the entire dashboard.
 *
 * React doesn't yet support error boundaries as functional components, so
 * this is a small class component. The fallback uses our existing card +
 * button design language so it doesn't look like a system error.
 */
export class ErrorBoundary extends React.Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    // eslint-disable-next-line no-console
    console.error(`[ErrorBoundary${this.props.label ? ` :: ${this.props.label}` : ""}]`, error, info);
  }

  reset = () => this.setState({ hasError: false, error: undefined });

  render() {
    if (this.state.hasError) {
      return (
        <div className="gf-card p-6 flex items-start gap-3">
          <AlertTriangle size={20} className="mt-0.5 shrink-0" style={{ color: "#e1a44c" }} />
          <div className="flex-1">
            <div className="font-semibold mb-1">
              Something went wrong{this.props.label ? ` in ${this.props.label}` : ""}.
            </div>
            <p className="gf-muted text-sm mb-3">
              The rest of the page is fine — this section had a hiccup. Try again,
              or reload if it persists.
            </p>
            <button onClick={this.reset} className="gf-btn gf-btn-ghost">
              <RefreshCw size={14} /> Try again
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
