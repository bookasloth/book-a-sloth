// Server-side conversion fan-out: PostHog + GA4 Measurement Protocol + Meta CAPI.
//
// WHY server-side: browser pixels degrade (ad-blockers, Safari ITP, third-party
// cookie death). Money events (booking_paid, product_purchased, subscription_started,
// user_registered) MUST be reported server-side so conversion counts survive past
// 1 year of platform changes. The browser-side pixel still fires for retargeting;
// Meta/GA4 de-dupe browser vs server on a shared event_id.
//
// This wraps the existing PostHog capture() so PostHog behaviour is unchanged —
// call sites move from capture() to trackServer() and additionally feed GA4 + Meta
// when configured. Every network path is fire-and-forget and never throws: analytics
// must never break a payment.
//
// Disabled per-tool when its env keys are unset → safe in dev/test/local.
const crypto = require('crypto');
const { capture: phCapture } = require('./posthog');

const GA4_ID     = process.env.GA4_MEASUREMENT_ID;     // G-XXXXXXXXXX
const GA4_SECRET = process.env.GA4_API_SECRET;          // GA4 → Data Streams → MP API secret
const FB_PIXEL   = process.env.FB_PIXEL_ID;             // numeric pixel id
const FB_TOKEN   = process.env.FB_CAPI_ACCESS_TOKEN;    // Events Manager → Conversions API token
const FB_TEST    = process.env.FB_TEST_EVENT_CODE;      // optional: route to Test Events tab
const FB_API_VER = process.env.FB_API_VERSION || 'v19.0';

const isTest = process.env.NODE_ENV === 'test';
const canFetch = typeof fetch === 'function'; // Node 18+ global fetch

// Internal event name → { ga4: GA4 event name, meta: Meta standard event }.
// Only events listed here fan out to ad networks; everything else is PostHog-only.
const CONVERSIONS = {
  booking_paid:          { ga4: 'purchase',       meta: 'Purchase' },
  product_purchased:     { ga4: 'purchase',       meta: 'Purchase' },
  subscription_purchased:{ ga4: 'purchase',       meta: 'Subscribe' },
  subscription_renewed:  { ga4: 'purchase',       meta: 'Subscribe' },
  booking_created:       { ga4: 'begin_checkout', meta: 'InitiateCheckout' },
  // user_registered: add the event emit first, then a row here (not fired yet).
};

const sha256 = (v) =>
  v ? crypto.createHash('sha256').update(String(v).trim().toLowerCase()).digest('hex') : undefined;

// GA4 Measurement Protocol requires a client_id. The browser's _ga client_id is
// ideal (joins the web session) — pass it via conversion.gaClientId. When absent
// (pure server context like a webhook), we synthesize a stable id from distinctId
// so the same person maps consistently, accepting it won't stitch to their web hits.
function ga4ClientId(distinctId, gaClientId) {
  if (gaClientId) return gaClientId;
  const h = crypto.createHash('md5').update(String(distinctId || 'anon')).digest('hex');
  return `${parseInt(h.slice(0, 8), 16)}.${parseInt(h.slice(8, 16), 16)}`;
}

function sendGA4(distinctId, map, { value, currency = 'INR', gaClientId, eventId }) {
  if (!GA4_ID || !GA4_SECRET || !canFetch) return;
  const body = {
    client_id: ga4ClientId(distinctId, gaClientId),
    user_id: distinctId ? String(distinctId) : undefined,
    events: [{
      name: map.ga4,
      params: {
        currency,
        value: Number(value) || 0,
        transaction_id: eventId,
        engagement_time_msec: 1,
      },
    }],
  };
  fetch(`https://www.google-analytics.com/mp/collect?measurement_id=${GA4_ID}&api_secret=${GA4_SECRET}`,
    { method: 'POST', body: JSON.stringify(body) })
    .catch((e) => console.error('ga4 MP error (non-fatal):', e.message));
}

function sendMetaCapi(map, { value, currency = 'INR', email, phone, eventId }) {
  if (!FB_PIXEL || !FB_TOKEN || !canFetch) return;
  const user_data = {};
  if (email) user_data.em = [sha256(email)];
  if (phone) user_data.ph = [sha256(phone)];
  const payload = {
    data: [{
      event_name: map.meta,
      event_time: Math.floor(Date.now() / 1000),
      action_source: 'website',
      event_id: eventId, // de-dupe vs browser pixel
      user_data,
      custom_data: { value: Number(value) || 0, currency },
    }],
    ...(FB_TEST ? { test_event_code: FB_TEST } : {}),
  };
  fetch(`https://graph.facebook.com/${FB_API_VER}/${FB_PIXEL}/events?access_token=${FB_TOKEN}`,
    { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
    .catch((e) => console.error('meta CAPI error (non-fatal):', e.message));
}

// trackServer(distinctId, event, properties, conversion?)
//   - distinctId/event/properties: identical contract to posthog capture()
//   - conversion (optional): { value, currency, email, phone, gaClientId, eventId }
//     supplied for money/acquisition events so GA4 MP + Meta CAPI get amount + match keys.
//     eventId should be stable+unique per conversion (e.g. razorpay_payment_id) so the
//     browser pixel and this server hit de-dupe into one conversion.
function trackServer(distinctId, event, properties = {}, conversion = {}) {
  phCapture(distinctId, event, properties); // PostHog — unchanged behaviour
  if (isTest) return;
  const map = CONVERSIONS[event];
  if (!map) return;
  try { sendGA4(distinctId, map, conversion); } catch (e) { console.error('ga4 fanout error:', e.message); }
  try { sendMetaCapi(map, conversion); } catch (e) { console.error('meta fanout error:', e.message); }
}

module.exports = { trackServer, CONVERSIONS, _internal: { sha256, ga4ClientId } };
