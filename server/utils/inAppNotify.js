const { supabaseAdmin } = require("../config/supabase");
const { runInBackground } = require("./background");

// Fire-and-forget in-app notification. Never throws into the request path —
// a feed write must not break a booking/review/payout mutation.
// role = which space the notification belongs to ('guest' | 'host').
function inAppNotify({ userId, role = "guest", type, title, body = null, link = null, data = {} }) {
  if (!userId || !type || !title) return;
  runInBackground("inAppNotify", async () => {
    const { error } = await supabaseAdmin
      .from("in_app_notifications")
      .insert({ user_id: userId, role, type, title, body, link, data });
    if (error) console.error("inAppNotify insert failed:", error.message);
  });
}

module.exports = { inAppNotify };
