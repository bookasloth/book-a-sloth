'use strict';
/**
 * coldCallService.js — admin Cold Calling tab (/api/admin/crm/cold-calls).
 *
 * Import a calling list, serve the call queue, record a call outcome (+ the
 * one-click email/WhatsApp follow-up) and set callback reminders. Built on the
 * Sales CRM: leads / lead_activities / lead_follow_ups / crm_messages.
 *
 * Calling state lives in leads.attributes.cold_call — NOT next_action_at, which
 * lifecycleEngine overwrites every tick. List membership is
 * attributes.cold_call.list_id because upsertLead never overwrites an existing
 * lead's list_id/status (a pipeline lead can still be called without regressing).
 */
const { supabaseAdmin } = require('../../config/supabase');
const leadService = require('./leadService');
const followUpService = require('./followUpService');
const messageService = require('./messageService');
const listService = require('./listService');
const rules = require('./coldCallRules');
const { rankOf } = require('./lifecycleRules');

const SENDER = 'shubham';             // founder persona — plain, hand-typed email layout
const MAX_ROWS = 50;                  // per import request; the client batches
const VALID_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const httpErr = (status, message) => Object.assign(new Error(message), { status });
const validDate = (v) => !!v && !Number.isNaN(new Date(v).getTime());

// ── Import ────────────────────────────────────────────────────
async function importRows({ rows = [], listId = null, listName = '', createdBy = '' } = {}) {
  if (!Array.isArray(rows) || rows.length > MAX_ROWS) throw httpErr(400, `send at most ${MAX_ROWS} rows per request`);
  if (!listId) {
    if (!String(listName || '').trim()) throw httpErr(400, 'listId or listName required');
    listId = (await listService.createList({
      name: listName, source: 'cold_call', consentBasis: 'b2b_legitimate_interest', createdBy,
    })).id;
  }
  let created = 0, merged = 0, skipped = 0;
  for (const r of rows) {
    const phone = rules.phone10(r.phone);
    if (!phone) { skipped++; continue; }
    const wa = rules.waPhone10(r.whatsapp) || phone;
    try {
      const { lead, created: isNew } = await leadService.upsertLead({
        name: r.name || '', phone, whatsapp_phone: `91${wa}`, email: r.email || '',
        business_name: r.business || '', profession: r.category || '', website: r.website || '',
        city: r.city || '', status: 'list', list_id: listId, tags: ['cold-call'],
      }, { source: 'cold_call', createdBy, skipMetaLead: true });
      const attrs = lead.attributes || {};
      const coldCall = {
        ...(attrs.cold_call || {}),          // keeps attempts / last_outcome / closed on re-import
        list_id: listId, day: r.day || null, priority: r.priority || null, fit: r.fit || null,
        locality: r.locality || null, pitch: r.pitch || null,
      };
      await supabaseAdmin.from('leads')
        .update({ attributes: { ...attrs, cold_call: coldCall }, updated_at: new Date().toISOString() })
        .eq('id', lead.id);
      if (isNew) created++; else merged++;
    } catch (e) {
      console.warn('[cold-call] import row skipped:', e.message);
      skipped++;
    }
  }
  return { created, merged, skipped, listId };
}

// ── Queue ─────────────────────────────────────────────────────
async function getQueue(listId, now = new Date()) {
  if (!listId) throw httpErr(400, 'listId required');
  const { data: leads, error } = await supabaseAdmin.from('leads')
    .select('id,name,business_name,phone,whatsapp_phone,email,website,city,profession,status,do_not_contact,profile_id,attributes,tags')
    .eq('attributes->cold_call->>list_id', listId)
    .limit(2000);
  if (error) throw error;
  const ids = new Set((leads || []).map((l) => l.id));
  const since = rules.istDayStart(now);
  // Filter by lead in JS — an .in() over hundreds of ids overflows the request URL.
  const [fu, calls, msgs, tpls] = await Promise.all([
    supabaseAdmin.from('lead_follow_ups').select('id,lead_id,title,due_at').eq('status', 'open').like('title', `${rules.CALLBACK_PREFIX}%`),
    supabaseAdmin.from('lead_activities').select('lead_id,meta').eq('type', 'call_logged').gte('occurred_at', since),
    supabaseAdmin.from('crm_messages').select('lead_id,status').like('idempotency_key', 'cold:%').gte('created_at', since),
    supabaseAdmin.from('crm_templates').select('id,channel,name,label,category,subject,body,variables,is_active').like('category', 'cold_call_%'),
  ]);
  const mine = (rows) => (rows || []).filter((x) => ids.has(x.lead_id));
  const outcomes = mine(calls.data).map((c) => c.meta?.outcome || null);
  return {
    ...rules.buildQueue(leads || [], mine(fu.data), now),
    today: { ...rules.todayStats(outcomes), followUpsSent: mine(msgs.data).filter((m) => m.status === 'sent').length },
    totals: rules.listTotals(leads || []),
    templates: tpls.data || [],
  };
}

// ── Outcome ───────────────────────────────────────────────────
async function sendFollowUp(lead, channel, category, outcome, callbackAt, now, createdBy) {
  try {
    const { data: tpl } = await supabaseAdmin.from('crm_templates')
      .select('*').eq('channel', channel).eq('category', category).maybeSingle();
    if (!tpl) return { status: 'skipped', reason: 'no_template' };
    if (!tpl.is_active) return { status: 'skipped', reason: channel === 'whatsapp' ? 'pending_aisensy' : 'template_inactive' };
    // {{callback_time}} is cold-call-only, so fill it here; lead tokens
    // ({{business_name}}, {{first_name}}…) are rendered later by messageService.
    const when = callbackAt ? rules.formatIst(callbackAt) : '';
    const fill = (s) => String(s || '').replace(/\{\{\s*callback_time\s*\}\}/g, when);
    const base = {
      leadId: lead.id, channel, immediate: true, createdBy,
      idempotencyKey: `cold:${lead.id}:${outcome}:${channel}:${rules.istDate(now)}`,
    };
    const row = channel === 'email'
      ? await messageService.enqueue({ ...base, subject: fill(tpl.subject), variables: { html: fill(tpl.body) }, senderKey: SENDER })
      : await messageService.enqueue({ ...base, templateKey: tpl.name, variables: { params: (tpl.variables || []).map((v) => fill(`{{${v.key}}}`)) } });
    return { status: row?.status || 'queued', reason: row?.error || null };
  } catch (e) {
    return { status: 'failed', reason: e.message };
  }
}

async function recordOutcome(leadId, body = {}, actorAdminId = null, now = new Date()) {
  const { outcome, note = '', durationSec = null, callbackAt = null, send = {}, email = null } = body;
  const lead = await leadService.getLead(leadId);
  if (!lead) throw httpErr(404, 'lead not found');
  let step;
  try { step = rules.nextStep(outcome, lead.attributes?.cold_call || {}, now, callbackAt); }
  catch (e) { throw httpErr(400, e.message); }
  const warnings = [];
  const nowIso = now.toISOString();

  // 1. Email captured on the call (a blank or invalid value never clobbers).
  const mail = String(email || '').trim().toLowerCase();
  if (mail && VALID_EMAIL.test(mail) && mail !== lead.email) {
    await supabaseAdmin.from('leads').update({ email: mail, updated_at: nowIso }).eq('id', leadId);
    lead.email = mail;
  }

  // 2. The call log comes first — a later send failure must never lose it.
  const durationMin = durationSec ? Math.max(1, Math.round(durationSec / 60)) : null;
  await leadService.logCall(leadId, { outcome, durationMin, body: note }, actorAdminId);
  if (String(note).trim()) await leadService.addNote(leadId, note, actorAdminId);

  // 3. Calling state.
  await supabaseAdmin.from('leads')
    .update({ attributes: { ...(lead.attributes || {}), cold_call: step.cold_call }, updated_at: nowIso })
    .eq('id', leadId);

  // 4. A call happened → close open callbacks; open the new one if asked.
  const open = await followUpService.listOpen({ leadId });
  for (const f of open.filter((x) => String(x.title || '').startsWith(rules.CALLBACK_PREFIX))) {
    await followUpService.complete(f.id, actorAdminId);
  }
  if (step.callbackAt) {
    await followUpService.create({
      leadId, ownerAdminId: actorAdminId, title: `${rules.CALLBACK_PREFIX} ${String(note).trim() || 'call back'}`,
      dueAt: step.callbackAt, remind: false, createdBy: 'cold_call',
    });
  }

  // 5. Pipeline move — never regress a lead already further along; failures are warnings.
  try {
    if (step.dnc) await leadService.setDnc(leadId, true, actorAdminId);
    else if (step.status && rankOf(lead.status) < rankOf(step.status)) {
      await leadService.changeStatus(leadId, step.status, actorAdminId, { via: 'cold_call' });
    }
    if (step.tag) await leadService.addTag(leadId, step.tag, actorAdminId);
  } catch (e) { warnings.push(`status: ${e.message}`); }

  // 6. Follow-ups — per-channel result, never thrown.
  const sends = {};
  if (step.template) {
    for (const ch of ['email', 'whatsapp']) {
      if (send[ch]) sends[ch] = await sendFollowUp(lead, ch, step.template, outcome, step.callbackAt, now, actorAdminId || 'cold_call');
    }
  }
  return { ok: true, coldCall: step.cold_call, sends, warnings };
}

// ── Remind me ─────────────────────────────────────────────────
async function remind(leadId, { at, note = '' } = {}, actorAdminId = null) {
  if (!validDate(at)) throw httpErr(400, 'valid "at" date required');
  const lead = await leadService.getLead(leadId);
  if (!lead) throw httpErr(404, 'lead not found');
  return followUpService.create({
    leadId, ownerAdminId: actorAdminId, title: `${rules.CALLBACK_PREFIX} ${String(note).trim() || 'call back'}`,
    dueAt: new Date(at).toISOString(), remind: false, createdBy: 'cold_call',
  });
}

module.exports = { importRows, getQueue, recordOutcome, remind };
