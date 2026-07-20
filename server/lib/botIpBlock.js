'use strict';

// ponytail: single-instance in-memory block store for the Bolt bot threat lockout.
// Single Render instance, so a Map is enough — no Redis/external store. If the bot
// ever runs multi-instance, back this with the shared rate-limit store or Redis.
// Async signatures so callers can `await` and that swap won't change the interface.

const blocks = new Map(); // ip -> expiresAtMs

async function isBlocked(ip) {
  if (!ip) return false;
  const expiresAt = blocks.get(ip);
  if (!expiresAt) return false;
  if (Date.now() >= expiresAt) {
    blocks.delete(ip);
    return false;
  }
  return true;
}

async function block(ip, ttlSeconds) {
  if (!ip || !(ttlSeconds > 0)) return;
  blocks.set(ip, Date.now() + ttlSeconds * 1000);
}

function _reset() {
  blocks.clear();
}

module.exports = { isBlocked, block, _reset };
