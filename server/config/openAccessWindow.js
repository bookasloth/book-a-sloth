'use strict';

/**
 * Temporary "open access" window — a launch/event kill-switch that lifts ALL
 * per-IP / per-contact rate limits AND IP-ban enforcement while active.
 *
 * Set OPEN_ACCESS_UNTIL to a future epoch-ms timestamp to open the gates; every
 * limiter is skipped and ipGuard stops enforcing bans until that moment passes,
 * then everything auto re-gates with no revert deploy. Unset / blank / non-numeric
 * / past → returns false, so normal limits apply. Read live so the env can be
 * flipped without a restart.
 *
 * Unlike load-test mode this is honoured in production ON PURPOSE (that's the
 * point). It only relaxes abuse limits — it does NOT touch payment signature
 * checks or any correctness path.
 */
function isOpenAccess() {
  const until = Number(process.env.OPEN_ACCESS_UNTIL);
  return Number.isFinite(until) && until > Date.now();
}

module.exports = { isOpenAccess };
