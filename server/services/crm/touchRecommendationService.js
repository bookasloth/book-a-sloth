'use strict';
/**
 * touchRecommendationService.js — persistence for relationship touch recommendations
 * (relationship engine PR-3). Pure rules live in relationshipTouch.js; this owns the
 * `touch_recommendations` table.
 *
 * upsertOpen is the write path the lifecycle tick calls. It is idempotent and humane:
 *   - one OPEN/snoozed rec per dedupe_key (the partial unique index guards the race),
 *   - after a human ACTS or DISMISSES a rec, the same reason is suppressed for a
 *     cooldown window so the Desk never immediately re-nags the same thing.
 *
 * Schema fallback: flips `tableReady=false` on the first "table/column missing" error
 * (pre-v3.136 DB) and no-ops thereafter, so a tick never breaks on an un-migrated DB.
 * Best-effort throughout — a recommendation write must never break the lifecycle run.
 */
const { supabaseAdmin } = require('../../config/supabase');

const COOLDOWN_DAYS = 14;   // after done/dismissed, don't re-surface the same reason for this long
let tableReady = true;

const isMissing = (err) =>
  !!err && /relation .* does not exist|column .* does not exist|Could not find|schema cache/i.test(err.message || '');

const iso = (ms) => new Date(ms).toISOString();

/**
 * Insert new open recs, skipping any dedupe_key that already has an open/snoozed rec
 * or was acted/dismissed within the cooldown window.
 * @param {object[]} recs  rows from relationshipTouch.recommendationsFor
 * @returns {Promise<{inserted:number}>}
 */
async function upsertOpen(recs, now = Date.now()) {
  if (!tableReady || !Array.isArray(recs) || !recs.length) return { inserted: 0 };
  try {
    const keys = [...new Set(recs.map((r) => r.dedupe_key))];
    const cutoff = iso(now - COOLDOWN_DAYS * 864e5);

    const { data: existing, error } = await supabaseAdmin
      .from('touch_recommendations')
      .select('dedupe_key, status, updated_at')
      .in('dedupe_key', keys);
    if (error) { if (isMissing(error)) tableReady = false; return { inserted: 0 }; }

    const suppressed = new Set(
      (existing || [])
        .filter((r) =>
          r.status === 'open' || r.status === 'snoozed' ||
          ((r.status === 'done' || r.status === 'dismissed') && r.updated_at && r.updated_at > cutoff))
        .map((r) => r.dedupe_key),
    );

    const rows = recs
      .filter((r) => !suppressed.has(r.dedupe_key))
      .map((r) => ({ ...r, status: 'open', created_at: iso(now), updated_at: iso(now) }));
    if (!rows.length) return { inserted: 0 };

    const { error: insErr } = await supabaseAdmin.from('touch_recommendations').insert(rows);
    if (insErr) {
      if (isMissing(insErr)) { tableReady = false; return { inserted: 0 }; }
      // A concurrent tick may have inserted the same open dedupe_key first (unique
      // partial index) — that's the idempotency working, not an error to surface.
      if (!/duplicate key|unique/i.test(insErr.message || '')) {
        console.error('[crm] touchRec upsertOpen:', insErr.message);
      }
      return { inserted: 0 };
    }
    return { inserted: rows.length };
  } catch (e) {
    console.error('[crm] touchRec upsertOpen error:', e.message);
    return { inserted: 0 };
  }
}

const patch = (id, vals) =>
  supabaseAdmin.from('touch_recommendations')
    .update({ ...vals, updated_at: new Date().toISOString() }).eq('id', id);

/** Snooze an open rec until `until` (ISO). It stops appearing on the Desk until then. */
async function snooze(id, until) {
  const { error } = await patch(id, { status: 'snoozed', snoozed_until: until });
  return { ok: !error };
}

/** Dismiss a rec (the human judged it not worth a touch). Suppressed for the cooldown. */
async function dismiss(id) {
  const { error } = await patch(id, { status: 'dismissed' });
  return { ok: !error };
}

/**
 * Mark a rec done after a human made the touch. Records who / channel / outcome.
 * The activity write + meaningful-interaction stamp is wired in PR-4 (the controller
 * path); this just closes the rec.
 */
async function markDone(id, { adminId = null, outcome = null } = {}) {
  const { error } = await patch(id, {
    status: 'done', acted_by_admin_id: adminId, acted_at: new Date().toISOString(), outcome,
  });
  return { ok: !error };
}

module.exports = { upsertOpen, snooze, dismiss, markDone, COOLDOWN_DAYS };
