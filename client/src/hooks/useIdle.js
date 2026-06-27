// useIdle — run a one-shot callback when the browser is idle after first paint.
//
// Wraps requestIdleCallback (with a setTimeout fallback for Safari/older browsers)
// so non-critical boot work — analytics, prefetching, warm-up — never competes with
// rendering the page. Reusable across every public page.
//
//   useIdle(() => initAnalytics());            // fire once on first idle
//   useIdle(warmUp, { timeout: 3000 });        // guarantee it runs within 3s
import { useEffect } from 'react';

const ric =
  typeof window !== 'undefined' && window.requestIdleCallback
    ? window.requestIdleCallback
    : (cb) => setTimeout(() => cb({ didTimeout: false, timeRemaining: () => 0 }), 1);

const cic =
  typeof window !== 'undefined' && window.cancelIdleCallback
    ? window.cancelIdleCallback
    : clearTimeout;

export default function useIdle(callback, { timeout = 2000 } = {}) {
  useEffect(() => {
    const handle = ric(() => callback(), { timeout });
    return () => cic(handle);
    // Run once on mount — callers pass a stable callback.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
