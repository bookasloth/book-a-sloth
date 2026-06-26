import { Component } from 'react';

/**
 * Catches errors thrown while rendering lazy route chunks so a failed dynamic
 * import() degrades to a recover-able message instead of a blank white screen
 * (React unmounts the whole tree on an uncaught render error).
 *
 * lazyWithRetry already handles the common stale-chunk-after-deploy case with a
 * one-shot reload, so anything that reaches this boundary is either a genuine
 * runtime error in the page, or a chunk that stayed broken even after a reload.
 * Either way we show a manual recovery path rather than dying silently.
 */
class RouteErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    // Surface for PostHog/console; keep it cheap and non-throwing.
    // eslint-disable-next-line no-console
    console.error('[RouteErrorBoundary]', error, info?.componentStack);
  }

  handleReload = () => {
    // Clear the lazy-retry guard so the reload gets a clean shot at fresh chunks.
    try {
      sessionStorage.removeItem('bas:chunk-reload');
    } catch {
      /* sessionStorage unavailable — ignore */
    }
    window.location.reload();
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white px-6 text-center">
        <div className="w-12 h-12 mb-5 rounded-full border-4 border-[#FE5100] border-t-transparent" />
        <h1 className="text-xl font-semibold text-gray-900">This page didn’t load</h1>
        <p className="mt-2 max-w-sm text-sm text-gray-500">
          Something interrupted the page. This usually fixes itself with a reload.
        </p>
        <button
          type="button"
          onClick={this.handleReload}
          className="mt-6 rounded-lg bg-[#FE5100] px-5 py-2.5 text-sm font-medium text-white hover:opacity-90"
        >
          Reload page
        </button>
      </div>
    );
  }
}

export default RouteErrorBoundary;
