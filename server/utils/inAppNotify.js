const { supabaseAdmin } = require("../config/supabase");
const { runInBackground } = require("./background");
const { broadcastTopic } = require("./realtimeBroadcast");

// Fire-and-forget in-app notification. Never throws into the request path —
// a feed write must not break a booking/review/payout mutation.
// role = which space the notification belongs to ('guest' | 'host').
//
// dedupeKey (optional): when set, skip the insert if a row with the same
// (user_id, dedupe_key) already exists. Stops re-runs (e.g. the confirmation
// reconciler re-firing a booking) from stacking duplicate bell rows. Callers
// that WANT a fresh note each period vary the key (include a date/week).
//
// After a successful insert, broadcast to the recipient's realtime topic so an
// open bell updates live instead of only on next poll/open (display-only ping —
// the client refetches the feed, the DB row stays the source of truth).
function inAppNotify({ userId, role = "guest", type, title, body = null, link = null, data = {}, dedupeKey = null }) {
  if (!userId || !type || !title) return;
  runInBackground("inAppNotify", async () => {
    if (dedupeKey) {
      const { data: existing } = await supabaseAdmin
        .from("in_app_notifications")
        .select("id")
        .eq("user_id", userId)
        .eq("dedupe_key", dedupeKey)
        .limit(1)
        .maybeSingle();
      if (existing) return; // already notified — no-op
    }
    const { error } = await supabaseAdmin
      .from("in_app_notifications")
      .insert({ user_id: userId, role, type, title, body, link, data, dedupe_key: dedupeKey });
    if (error) {
      // Unique-index race: another emit inserted the same (user_id, dedupe_key)
      // first. Dedupe worked at the DB level — benign no-op, not a failure.
      if (error.code === "23505") return;
      // Schema fallback: a pre-v3.131 DB has no dedupe_key column. Retry the insert
      // without it so the notification still lands (dedupe just no-ops until migrated).
      if (dedupeKey && /dedupe_key|column .* does not exist|Could not find/i.test(error.message || "")) {
        const { error: retryErr } = await supabaseAdmin
          .from("in_app_notifications")
          .insert({ user_id: userId, role, type, title, body, link, data });
        if (retryErr) { console.error("inAppNotify insert failed:", retryErr.message); return; }
      } else {
        console.error("inAppNotify insert failed:", error.message);
        return;
      }
    }
    broadcastTopic(`notif:user:${userId}`, "notification", { role, type });
  });
}

module.exports = { inAppNotify };
