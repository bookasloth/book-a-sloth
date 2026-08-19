'use strict';
// Owns the Anthropic SDK instance + model ids. Key-optional: returns null when
// ANTHROPIC_API_KEY is unset so the feature degrades gracefully (no import crash).

// generate/regenerate = the shared workhorse model, used by the Bolt support bot,
// abuseGuard, pills, and escalationService as well as listing generation. Keep it
// on Haiku (cheap, high volume) — do NOT bump it to move one feature, or every
// bot call moves with it. `listing` is set separately so the bot's cost/behaviour
// stays put if you ever move listing to a different model.
const MODELS = {
  generate: 'claude-haiku-4-5-20251001',
  regenerate: 'claude-haiku-4-5-20251001',
  // Haiku 4.5 — the ONLY model prod's Anthropic key can actually reach. #589 moved
  // listing to `claude-sonnet-5` and #634 to `claude-sonnet-4-5-20250929`; the key
  // rejects BOTH Sonnet ids (SDK throws → 502 "AI writing failed"), so listings
  // logged ZERO successes from 2026-07-20 (last Haiku success) until this revert.
  // BOLT_LISTING_MODEL lets prod repoint to a Sonnet id WITHOUT a redeploy the day
  // the org's key gains Sonnet access. ponytail: one string + escape hatch.
  listing: process.env.BOLT_LISTING_MODEL || 'claude-haiku-4-5-20251001',
};

let _client;

const isConfigured = () => Boolean(process.env.ANTHROPIC_API_KEY);

const getClient = () => {
  if (!isConfigured()) return null;
  if (!_client) {
    const Anthropic = require('@anthropic-ai/sdk');
    _client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  }
  return _client;
};

module.exports = { MODELS, isConfigured, getClient };
