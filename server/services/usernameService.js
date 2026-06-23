// Username resolution + change, backed by the username_history table.
// History is the source of truth; profiles.username is a denormalized cache.

const { supabaseAdmin } = require('../config/supabase');
const { generateUnique } = require('../utils/usernameGenerator');

// True if a username has EVER been used (current or historical) — enforces
// global non-reuse and feeds the generator's uniqueness loop.
// Uses an exact match on the stored lower-cased value so that SQL wildcard
// characters (% and _) in the slug are treated literally. isValidSlug()
// already blocks those characters upstream; this is defence-in-depth.
async function usernameExists(slug) {
  const normalized = String(slug).toLowerCase().trim();
  const { data } = await supabaseAdmin
    .from('username_history')
    .select('id')
    .eq('username', normalized)
    .maybeSingle();
  return !!data;
}

// Returns the user_id that owns a given username (current OR historical),
// or null if the name has never been used. Used by claimSlug to distinguish
// "taken by someone else" from "taken by me — idempotent re-claim".
async function usernameOwner(slug) {
  const normalized = String(slug).toLowerCase().trim();
  const { data } = await supabaseAdmin
    .from('username_history')
    .select('user_id')
    .eq('username', normalized)
    .maybeSingle();
  return data?.user_id ?? null;
}

// Resolve a slug to its owner + the owner's CURRENT username.
// Returns null if the slug was never used.
//   { userId, currentUsername, isCurrent }
async function resolve(slug) {
  const s = String(slug || '').toLowerCase();
  if (!s) return null;

  const { data: row } = await supabaseAdmin
    .from('username_history')
    .select('user_id, is_current')
    .ilike('username', s)
    .maybeSingle();
  if (!row) return null;

  const { data: current } = await supabaseAdmin
    .from('username_history')
    .select('username')
    .eq('user_id', row.user_id)
    .eq('is_current', true)
    .maybeSingle();

  return {
    userId: row.user_id,
    currentUsername: current?.username || null,
    isCurrent: !!row.is_current,
  };
}

// Generate a unique auto username and record it as the initial ('auto') alias.
// Idempotent-ish: callers use this once at account creation.
async function createInitialUsername() {
  return generateUnique(usernameExists);
}

// Record an initial/auto alias in history. Safe to call repeatedly — the global
// unique index + ON CONFLICT DO NOTHING make a duplicate a no-op. Best-effort:
// a history hiccup must NEVER break account creation, so errors are swallowed.
async function recordInitialUsername(userId, username) {
  if (!userId || !username) return;
  try {
    await supabaseAdmin
      .from('username_history')
      .upsert(
        { user_id: userId, username: String(username).toLowerCase(), is_current: true, source: 'auto' },
        { onConflict: 'username', ignoreDuplicates: true },
      );
  } catch (_) {
    // non-fatal
  }
}

// Claim a username during onboarding — replaces the throwaway auto name with
// the host's first real choice. Intentionally bypasses the change_username RPC's
// gating rules (WhatsApp gate, 2/365-day cap, 6-month gap) because:
//   a) The host hasn't had a chance to verify WhatsApp yet (that's step 5+).
//   b) This is not a "change" — it's the host's initial brand identity claim.
//      The auto name recorded by upsertProfile was a placeholder, not a choice.
//
// Delegates to the set_onboarding_username Postgres RPC (v3.32), which executes
// the retire→insert→update sequence inside a single function body (one implicit
// transaction). This eliminates the partial-failure window that existed when the
// three steps were separate Supabase client calls.
//
// The RPC raises EXCEPTION 'username_taken' on unique-index conflict; Supabase
// surfaces this as error.message containing 'username_taken'. We map that to the
// { ok: false, reason: 'taken' } contract that claimSlug already handles.
//
// Returns { ok: true, username } or { ok: false, reason, detail? }.
async function setOnboardingUsername(userId, newSlug) {
  const clean = String(newSlug).toLowerCase().trim();

  const { data, error } = await supabaseAdmin.rpc('set_onboarding_username', {
    p_user_id: userId,
    p_username: clean,
  });

  if (error) {
    // The RPC raises EXCEPTION 'username_taken' on unique-index conflict.
    // Supabase wraps this as error.message = 'username_taken'.
    if (error.message && error.message.includes('username_taken')) {
      return { ok: false, reason: 'taken' };
    }
    return { ok: false, reason: 'error', detail: error.message };
  }

  // RPC returns jsonb: { ok: true, username } or { ok: false, reason }.
  return data;
}

// Atomic, race-safe change via the change_username RPC (all rule enforcement
// lives in SQL). Returns the RPC's jsonb verdict:
//   { ok: true, username } | { ok: false, reason, next_eligible? }
async function changeUsername(userId, newSlug) {
  const { data, error } = await supabaseAdmin.rpc('change_username', {
    p_user_id: userId,
    p_new: String(newSlug).toLowerCase(),
  });
  if (error) return { ok: false, reason: 'error' };
  return data;
}

module.exports = {
  usernameExists,
  usernameOwner,
  resolve,
  createInitialUsername,
  recordInitialUsername,
  setOnboardingUsername,
  changeUsername,
};
