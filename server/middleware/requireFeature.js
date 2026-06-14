/**
 * requireFeature(key) — route guard that 503s when an admin kill-switch is off.
 *
 * Usage:  router.post('/', requireFeature('guest_booking'), createBooking)
 *
 * Fail-OPEN: if the flag is unknown or the lookup errors, the request proceeds
 * (see services/featureFlags.isFeatureEnabled). A missing migration or DB blip
 * must never brick a live feature. Only an explicit `enabled = false` row blocks.
 */

const { isFeatureEnabled } = require('../services/featureFlags');

const requireFeature = (key) => async (req, res, next) => {
  try {
    if (await isFeatureEnabled(key)) return next();
    return res.status(503).json({
      message: 'This feature is currently turned off. Please try again later.',
      feature_disabled: key,
    });
  } catch (_) {
    return next(); // fail-open
  }
};

module.exports = { requireFeature };
