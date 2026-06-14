/**
 * discoveryEvents.js
 * Lightweight, fire-and-forget capture of discovery signals — searches and
 * profile/service views — so the (deferred) Explore feature can launch on
 * real history instead of a cold start.
 *
 * The only irreplaceable Explore asset is behavioural event history: it cannot
 * be backfilled. Everything else (search index, ranking, checkout, the page)
 * is derived from current state and is built later. See the spec:
 *   docs/superpowers/specs/2026-06-14-explore-foundation-design.md
 *
 * CONTRACT: `logEvent` NEVER throws into the request path and NEVER blocks the
 * response. It is best-effort telemetry. Do not await it in hot paths.
 */
const { supabaseAdmin } = require('../config/supabase');

const VALID_TYPES = new Set(['search', 'view', 'click']);

/**
 * Pull the anon session id + best-effort source/user from a request.
 * Header `x-sloth-sid` is a first-party anonymous id set by the client; no PII.
 */
function contextFromReq(req = {}) {
  const headers = req.headers || {};
  const sid = headers['x-sloth-sid'];
  const ref = headers['referer'] || headers['referrer'];
  return {
    session_id: sid ? String(sid).slice(0, 64) : null,
    source: (ref || req.originalUrl || '') ? String(ref || req.originalUrl).slice(0, 255) : null,
    user_id: (req.user && req.user.id) || null,
  };
}

/**
 * Log one discovery event. Fire-and-forget: returns synchronously, swallows
 * every error (including a missing table before the migration is applied).
 * @param {object} evt
 * @param {'search'|'view'|'click'} evt.event_type
 * @param {string} [evt.surface]      home_search | profile | service | category_chip | (future explore_*)
 * @param {string} [evt.vendor_id]
 * @param {string} [evt.query]
 * @param {string} [evt.category]
 * @param {number} [evt.result_count]
 * @param {string} [evt.source]
 * @param {string} [evt.session_id]
 * @param {string} [evt.user_id]
 */
function logEvent(evt = {}) {
  if (!VALID_TYPES.has(evt.event_type)) return;

  const row = {
    event_type: evt.event_type,
    surface: evt.surface || null,
    vendor_id: evt.vendor_id || null,
    query: evt.query ? String(evt.query).slice(0, 200) : null,
    category: evt.category || null,
    result_count: Number.isFinite(evt.result_count) ? evt.result_count : null,
    source: evt.source || null,
    session_id: evt.session_id || null,
    user_id: evt.user_id || null,
  };

  // Fire-and-forget. Must NEVER disrupt the request path — including a
  // synchronous throw from building the query (e.g. a stubbed client without
  // `.insert`). Wrap the whole thing, swallow async errors too.
  try {
    Promise.resolve(supabaseAdmin.from('discovery_events').insert(row))
      .then((res) => {
        if (res && res.error && process.env.NODE_ENV !== 'production') {
          // eslint-disable-next-line no-console
          console.warn('[discoveryEvents] insert skipped:', res.error.message);
        }
      })
      .catch(() => {});
  } catch (_) {
    /* best-effort telemetry — never surface to the caller */
  }
}

module.exports = { logEvent, contextFromReq };
