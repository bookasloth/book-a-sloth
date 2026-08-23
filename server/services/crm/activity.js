'use strict';
/**
 * activity.js — CRM timeline writes.
 *
 * logActivity() appends one row to lead_activities and bumps the lead's
 * last_activity_at (and, for outbound touches, last_contacted_at). Every CRM
 * mutation that should show in a lead's timeline goes through here so the
 * write and the denormalized stamps never drift.
 *
 * Fire-and-forget friendly: a timeline write must never break the action that
 * triggered it, so failures are swallowed (logged) rather than thrown.
 */
const { supabaseAdmin } = require('../../config/supabase');

// Activity types that also count as "we contacted the lead" (moves last_contacted_at).
const CONTACT_TYPES = new Set(['whatsapp_sent', 'email_sent', 'call_logged']);

async function logActivity(leadId, type, opts = {}) {
  if (!leadId || !type) return null;
  const now = new Date().toISOString();
  try {
    const { data } = await supabaseAdmin
      .from('lead_activities')
      .insert({
        lead_id: leadId,
        type,
        actor_admin_id: opts.actorAdminId || null,
        title: opts.title || null,
        body: opts.body || null,
        meta: opts.meta || {},
        occurred_at: opts.occurredAt || now,
      })
      .select('id')
      .single();

    const patch = { last_activity_at: now, updated_at: now };
    if (CONTACT_TYPES.has(type)) patch.last_contacted_at = now;
    await supabaseAdmin.from('leads').update(patch).eq('id', leadId);

    return data?.id || null;
  } catch (err) {
    console.error('[crm] logActivity failed:', err.message);
    return null;
  }
}

module.exports = { logActivity };
