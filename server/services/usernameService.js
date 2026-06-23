// Username resolution + change, backed by the username_history table.
// History is the source of truth; profiles.username is a denormalized cache.

const { supabaseAdmin } = require('../config/supabase');
const { generateUnique } = require('../utils/usernameGenerator');

// True if a username has EVER been used (current or historical) — enforces
// global non-reuse and feeds the generator's uniqueness loop.
async function usernameExists(slug) {
  const { data } = await supabaseAdmin
    .from('username_history')
    .select('id')
    .ilike('username', String(slug))
    .maybeSingle();
  return !!data;
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
// Atomically: retires the existing current row (is_current=false), inserts the
// new row (source='onboarding', is_current=true), and updates profiles.username.
// Returns { ok: true, username } or { ok: false, reason }.
async function setOnboardingUsername(userId, newSlug) {
  const clean = String(newSlug).toLowerCase().trim();

  // Race-safe: if the name is already taken by someone else, the unique index on
  // username_history will reject the INSERT and we catch unique_violation.
  try {
    // 1. Retire the current username_history row for this user (if any).
    await supabaseAdmin
      .from('username_history')
      .update({ is_current: false, released_at: new Date().toISOString() })
      .eq('user_id', userId)
      .eq('is_current', true);

    // 2. Insert the new current row (source='onboarding' does NOT count toward
    //    the 2/365-day user-initiated change allowance tracked by source='user').
    const { error: insertErr } = await supabaseAdmin
      .from('username_history')
      .insert({ user_id: userId, username: clean, is_current: true, source: 'onboarding' });

    if (insertErr) {
      // Likely a unique_violation (name taken in history) — return structured error.
      if (insertErr.code === '23505') return { ok: false, reason: 'taken' };
      return { ok: false, reason: 'error', detail: insertErr.message };
    }

    // 3. Update the denormalized cache on profiles.
    const { error: profileErr } = await supabaseAdmin
      .from('profiles')
      .update({ username: clean, updated_at: new Date().toISOString() })
      .eq('id', userId);

    if (profileErr) return { ok: false, reason: 'error', detail: profileErr.message };

    return { ok: true, username: clean };
  } catch (err) {
    return { ok: false, reason: 'error', detail: err.message };
  }
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
  resolve,
  createInitialUsername,
  recordInitialUsername,
  setOnboardingUsername,
  changeUsername,
};
