// PostHog adapter — first-party product analytics, always-on (not consent-gated).
//
// posthog-js (~67 kB gzip) is DYNAMICALLY imported here so it stays OUT of the
// initial bundle that loads on every page. init() is triggered on first idle by
// the analytics bus (AnalyticsBridge), so the SDK never competes with first paint.
// Calls made before the SDK finishes loading are queued and flushed on load, so no
// events are dropped during the gap.
//
// Identity is driven through the bus (AuthContext → analytics.identify/reset),
// matching the "never call posthog directly in a component" rule.
let ph = null;        // posthog-js singleton, once loaded
let loading = null;   // in-flight import promise — makes init() idempotent
const queue = [];     // calls made before the SDK is ready

function flush() {
  while (queue.length) {
    const { fn, args } = queue.shift();
    try { ph?.[fn]?.(...args); } catch (_) { /* analytics never breaks the app */ }
  }
}

function call(fn, args) {
  if (ph) { try { ph[fn](...args); } catch (_) {} }
  else queue.push({ fn, args });
}

export default {
  name: 'posthog',
  needsConsent: false, // always-on, first-party

  init() {
    if (loading) return loading;
    const token = import.meta.env.VITE_POSTHOG_PROJECT_TOKEN;
    if (!token || typeof window === 'undefined') { loading = Promise.resolve(); return loading; }
    loading = import('posthog-js')
      .then(({ default: posthog }) => {
        posthog.init(token, {
          api_host: import.meta.env.VITE_POSTHOG_HOST,
          defaults: '2026-01-30',
        });
        ph = posthog;
        flush();
      })
      .catch(() => { /* offline / blocked — never break the app for analytics */ });
    return loading;
  },

  identify(id, props) { call('identify', [String(id), props]); },
  track(event, props) { call('capture', [event, props]); },
  page(props) { call('capture', ['$pageview', props]); },
  reset() { call('reset', []); },
};
