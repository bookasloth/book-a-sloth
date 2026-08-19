'use strict';
// Owns the Anthropic SDK instance + model ids. Key-optional: returns null when
// ANTHROPIC_API_KEY is unset so the feature degrades gracefully (no import crash).

// generate/regenerate = the shared workhorse model, used by the Bolt support bot,
// abuseGuard, pills, and escalationService as well as listing generation. Keep it
// on Haiku (cheap, high volume) — do NOT bump it to move one feature, or every
// bot call moves with it. "Write with Bolt" listing generation uses `listing`
// (Sonnet 5) instead — set separately so the bot's cost/behaviour stays put.
const MODELS = {
  generate: 'claude-haiku-4-5-20251001',
  regenerate: 'claude-haiku-4-5-20251001',
  // Dated GA id, not the bare `claude-sonnet-5` alias: prod's key rejected the
  // alias (SDK threw → 502 "AI writing failed"; zero listings logged since the
  // #589 switch). Env override lets prod repoint without a redeploy if the org's
  // Sonnet access differs. ponytail: one string + escape hatch, no model registry.
  listing: process.env.BOLT_LISTING_MODEL || 'claude-sonnet-4-5-20250929',
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
