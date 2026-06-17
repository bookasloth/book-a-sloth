// Unified analytics bus — the ONLY analytics surface components may import.
//
// Rule that prevents rebuilds: never call posthog/gtag/fbq/clarity directly in a
// component. Call analytics.track(EVENTS.X, props). Adding/removing a tool next
// year = edit one adapter file; zero call-site churn.
//
//   import { analytics } from '@/services/analytics';
//   import { EVENTS } from '@/services/analytics/events';
//   analytics.track(EVENTS.BOOKING_STARTED, { service_id });
//
// Consent model:
//   - PostHog (needsConsent:false) is always-on, inits at app boot.
//   - GA4 / Pixel / Clarity (needsConsent:true) load ONLY after the user grants
//     marketing consent. Events fired before consent are dropped for those tools
//     (not replayed) — we never backfill pre-consent activity into ad networks.
import { assertKnownEvent } from './events';
import { getConsent, onConsentChange, setConsent, isGranted, hasDecided } from './consent';
import posthog from './adapters/posthog';
import ga4 from './adapters/ga4';
import pixel from './adapters/pixel';
import clarity from './adapters/clarity';

const ADAPTERS = [posthog, ga4, pixel, clarity];

const ready = new Set();   // adapters that have run init()
let lastIdentify = null;   // re-apply identity to adapters that init after login

function initAdapter(a) {
  if (ready.has(a)) return;
  try { a.init(); ready.add(a); } catch (_) { /* never break the app for analytics */ }
  // If a user already logged in before this (gated) adapter loaded, replay identity.
  if (lastIdentify && a.identify) {
    try { a.identify(lastIdentify.id, lastIdentify.props); } catch (_) {}
  }
}

function activeAdapters() {
  return ADAPTERS.filter((a) => !a.needsConsent || isGranted());
}

// Boot: always-on adapters now; gated adapters when (and if) consent is granted.
export function initAnalytics() {
  ADAPTERS.filter((a) => !a.needsConsent).forEach(initAdapter);
  if (isGranted()) ADAPTERS.filter((a) => a.needsConsent).forEach(initAdapter);
  onConsentChange((v) => {
    if (v === 'granted') ADAPTERS.filter((a) => a.needsConsent).forEach(initAdapter);
    // 'denied' after a prior 'granted' would need a reload to fully unload SDKs;
    // we simply stop routing new events to them (activeAdapters() drops them).
  });
}

export const analytics = {
  // Link events to a known user. PostHog identity is owned by AuthContext's central
  // watcher, so this fans to the OTHER adapters only (avoids a double identify).
  identify(id, props = {}) {
    if (!id) return;
    lastIdentify = { id, props };
    activeAdapters()
      .filter((a) => a.name !== 'posthog')
      .forEach((a) => { try { a.identify?.(id, props); } catch (_) {} });
  },

  track(event, props = {}) {
    const name = assertKnownEvent(event);
    activeAdapters().forEach((a) => { try { a.track?.(name, props); } catch (_) {} });
  },

  page(props = {}) {
    activeAdapters().forEach((a) => { try { a.page?.(props); } catch (_) {} });
  },

  // re-exported so UI (consent banner) can drive consent without a second import.
  setConsent, getConsent, isGranted, hasDecided,
};

// Read the GA4 browser client_id from the _ga cookie, to forward to the backend at
// checkout so server-side GA4 Measurement Protocol events join the SAME web session
// (instead of a synthesized id). Returns undefined if GA4 hasn't set the cookie
// (no consent / not loaded) — backend then falls back to a synthesized id.
export function gaClientId() {
  try {
    const m = document.cookie.match(/_ga=GA\d\.\d\.([\d.]+)/);
    return m ? m[1] : undefined;
  } catch (_) { return undefined; }
}

export { EVENTS } from './events';
