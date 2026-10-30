// Server-side PostHog analytics REMOVED in the growth-stack removal. No-op shim kept
// so existing callers keep importing without edits — no events are sent.
// resolveGuestId stays real: callers pass its return value as the distinct-id arg
// into trackServer(), so it must still compute an id.
// ponytail: shim, not full deletion. posthog-node can be dropped from package.json
// once this file and its require sites are removed.
const resolveGuestId = ({ guestId, guestEmail } = {}) =>
  guestId || (guestEmail ? String(guestEmail).toLowerCase().trim() : null);

function capture() {}
async function shutdown() {}

module.exports = { client: null, capture, resolveGuestId, shutdown };
