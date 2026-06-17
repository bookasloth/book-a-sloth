// PostHog adapter. PostHog is already booted in main.jsx via PostHogProvider, so
// init() is a no-op — we just talk to the posthog-js singleton. identify() is
// owned by AuthContext (one central watcher); we expose it here only so the bus
// has a uniform interface, but the bus does NOT call it for PostHog (see index.js).
//
// PostHog is first-party product analytics and stays always-on (not gated behind
// the marketing-consent banner), mirroring current behaviour.
import posthog from 'posthog-js';

export default {
  name: 'posthog',
  needsConsent: false, // always-on, first-party
  init() { /* booted in main.jsx */ },
  identify(id, props) { try { posthog?.identify?.(String(id), props); } catch (_) {} },
  track(event, props) { try { posthog?.capture?.(event, props); } catch (_) {} },
  page(props) { try { posthog?.capture?.('$pageview', props); } catch (_) {} },
};
