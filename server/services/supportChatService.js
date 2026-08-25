'use strict';

/**
 * supportChatService — the thread/message engine behind Host↔Admin + Guest↔Admin
 * support chat. All DB access is via supabaseAdmin (service_role); the tables are
 * RLS-on/no-policy, so nothing reads them directly from the browser.
 *
 * Live updates go out over a Supabase Realtime BROADCAST channel per thread
 * (`support:thread:<id>`). The broadcast is DISPLAY-ONLY — the row written here
 * (through an authz-checked API) is the source of truth; clients reconcile against
 * a REST history fetch. No RLS/Supabase-auth needed (no role has a Supabase Auth
 * session in this app).
 */

const crypto = require('crypto');
const { supabaseAdmin } = require('../config/supabase');
const adminAlert = require('../utils/adminAlert');

// Human-friendly reference from a uuid, e.g. SUP-8F92AB.
const refFrom = (id) => `SUP-${String(id).replace(/-/g, '').slice(0, 6).toUpperCase()}`;

// Fire-and-forget broadcast to any realtime topic. Never throws.
async function broadcastTopic(topic, event, payload) {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return;
  try {
    await fetch(`${url}/realtime/v1/api/broadcast`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', apikey: key, Authorization: `Bearer ${key}` },
      body: JSON.stringify({ messages: [{ topic, event, payload }] }),
    });
  } catch (e) {
    console.error('support broadcast failed', topic, e.message);
  }
}

// Per-thread channel — the guest/host/admin chat panels each subscribe to their
// open thread. `support:admin` is a single station channel every admin console
// subscribes to, used to ring on new escalations.
const broadcast = (threadId, event, payload) => broadcastTopic(`support:thread:${threadId}`, event, payload);

// The participant's current (non-resolved) thread, or a fresh one. One open thread
// per host/guest keeps the UX a single continuous conversation.
async function getOrCreateOpenThread({ participantType, userId, guestPhone, subject }) {
  let q = supabaseAdmin
    .from('support_threads')
    .select('*')
    .neq('status', 'resolved')
    .order('created_at', { ascending: false })
    .limit(1);
  q = userId ? q.eq('user_id', userId) : q.eq('guest_phone', guestPhone || '');
  const { data: existing } = await q;
  if (existing && existing[0]) return existing[0];

  const id = crypto.randomUUID();
  const { data, error } = await supabaseAdmin
    .from('support_threads')
    .insert({
      id,
      reference: refFrom(id),
      participant_type: participantType,
      user_id: userId || null,
      guest_phone: guestPhone || null,
      subject: subject || null,
      status: 'bot',
      last_message_at: new Date().toISOString(),
    })
    .select('*')
    .single();
  if (error) throw error;
  return data;
}

const getThread = async (threadId) => {
  const { data } = await supabaseAdmin.from('support_threads').select('*').eq('id', threadId).maybeSingle();
  return data || null;
};

const listMessages = async (threadId) => {
  const { data } = await supabaseAdmin
    .from('support_messages')
    .select('*')
    .eq('thread_id', threadId)
    .order('created_at', { ascending: true });
  return data || [];
};

/**
 * Persist a message, advance the thread (last_message_at + the OTHER side's unread),
 * then broadcast it. sender ∈ user|bot|admin|system.
 */
async function postMessage({ threadId, sender, senderId, senderName, body }) {
  const text = (body || '').trim();
  if (!text) throw new Error('empty message');

  const { data: msg, error } = await supabaseAdmin
    .from('support_messages')
    .insert({ thread_id: threadId, sender, sender_id: senderId || null, sender_name: senderName || null, body: text })
    .select('*')
    .single();
  if (error) throw error;

  const thread = await getThread(threadId);
  const patch = { last_message_at: msg.created_at, updated_at: new Date().toISOString() };
  // Unread accrues to whoever is NOT the author. system messages notify no one.
  if (sender === 'user') patch.admin_unread = (thread?.admin_unread || 0) + 1;
  else if (sender === 'admin' || sender === 'bot') patch.user_unread = (thread?.user_unread || 0) + 1;
  await supabaseAdmin.from('support_threads').update(patch).eq('id', threadId);

  await broadcast(threadId, 'message', msg);
  return msg;
}

// Status transitions. Each broadcasts a `status` event so open panels update live.
async function setStatus(threadId, status, extra = {}) {
  const patch = { status, updated_at: new Date().toISOString(), ...extra };
  const { data } = await supabaseAdmin.from('support_threads').update(patch).eq('id', threadId).select('*').single();
  await broadcast(threadId, 'status', { status, ...extra });
  return data;
}

// Escalate to a human: flip to 'waiting', then (best-effort, never blocking) ring
// every open admin console over the `support:admin` channel AND email the team.
// Both callers — the manual "Talk to a human" button and Bolt's auto-handoff —
// route through here, so the alert lives in one place.
async function escalate(threadId, aiSummary) {
  const updated = await setStatus(threadId, 'waiting', aiSummary ? { ai_summary: aiSummary } : {});
  const t = updated || (await getThread(threadId));
  if (t) {
    const who = t.participant_type === 'host' ? 'Host' : 'Guest';
    const contact = t.guest_phone ? ` · ${t.guest_phone}` : '';
    // Ring: one event on the station channel; each admin dashboard plays the tone.
    broadcastTopic('support:admin', 'escalation', {
      thread_id: t.id, reference: t.reference, participant_type: t.participant_type, summary: aiSummary || null,
    });
    // Email: throttled per-thread so re-escalation of the same thread sends once.
    adminAlert({
      subject: `Support escalation — ${t.reference}`,
      key: `support-escalation:${t.id}`,
      lines: [
        `${who}${contact} needs a human on support chat.`,
        aiSummary ? `Reason: ${aiSummary}` : 'They tapped “Talk to a human”.',
      ],
      link: `${process.env.CLIENT_URL || 'https://bookasloth.com'}/admin/support/chat`,
      category: 'Support Alert',
    }).catch(() => {});
  }
  return t;
}
const assign   = (threadId, adminId) => setStatus(threadId, 'assigned', { assigned_admin: adminId || null });
const resolve  = (threadId, rating) => setStatus(threadId, 'resolved', rating ? { rating } : {});

// Zero the unread counter for one side after they've read the thread.
async function markRead(threadId, side) {
  const col = side === 'admin' ? 'admin_unread' : 'user_unread';
  await supabaseAdmin.from('support_threads').update({ [col]: 0 }).eq('id', threadId);
}

// Admin inbox. filter: 'waiting' (needs a human), 'mine' (assigned to me), 'all'.
async function listQueue({ filter = 'waiting', adminId } = {}) {
  let q = supabaseAdmin
    .from('support_threads')
    .select('*')
    .order('last_message_at', { ascending: false, nullsFirst: false })
    .limit(100);
  if (filter === 'waiting') q = q.eq('status', 'waiting');
  else if (filter === 'mine') q = q.eq('assigned_admin', adminId || '').neq('status', 'resolved');
  else q = q.neq('status', 'resolved'); // 'all' open threads
  const { data } = await q;
  return data || [];
}

module.exports = {
  refFrom, broadcast, getOrCreateOpenThread, getThread, listMessages,
  postMessage, setStatus, escalate, assign, resolve, markRead, listQueue,
};
