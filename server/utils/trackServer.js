// Analytics fan-out (PostHog + GA4 + Meta CAPI) REMOVED in the growth-stack scrape.
// This is a no-op shim kept ONLY so existing call sites (authController,
// bookingController, paymentController, bookingPaymentReconciler, subscriptionService)
// keep importing without edits — telemetry no longer fires.
// ponytail: shim, not full deletion. To rip it out entirely, delete this file and the
// ~5 `require('../utils/trackServer')` sites that import it.
function trackServer() {}
function sendMetaCrmLead() {}

module.exports = { trackServer, sendMetaCrmLead, CONVERSIONS: {} };
