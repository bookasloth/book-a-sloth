'use strict';

/**
 * Single source of truth for load-test mode.
 * Fail-safe: the flag is NEVER trusted when NODE_ENV=production.
 * Read live at call time so tests and runtime can toggle env freely.
 */
function isLoadTestMode() {
  if (process.env.NODE_ENV === 'production') {
    if (process.env.LOAD_TEST_MODE === 'true') {
      console.warn('[loadTestMode] LOAD_TEST_MODE ignored: NODE_ENV=production');
    }
    return false;
  }
  return process.env.LOAD_TEST_MODE === 'true';
}

module.exports = { isLoadTestMode };
