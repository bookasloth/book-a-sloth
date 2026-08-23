'use strict';
/**
 * crmController.js — Admin Sales CRM API (/api/admin/crm).
 *
 * Thin HTTP layer over services/crm/*. View routes need `leads.view`,
 * mutations + sends need `leads.manage` (enforced in the router). Every actor is
 * req.admin.id (admin JWT), threaded into the services for the timeline.
 */
const { supabaseAdmin } = require('../config/supabase');
const { safeError } = require('../utils/httpError');
const leadService = require('../services/crm/leadService');
const timeline = require('../services/crm/timeline');
const messageService = require('../services/crm/messageService');
const followUpService = require('../services/crm/followUpService');
const sequenceService = require('../services/crm/sequenceService');
const attribution = require('../services/crm/attribution');

const actor = (req) => req.admin?.id || null;

// Fields an admin may edit directly on a lead (status/owner/tags/dnc have their own routes).
const EDITABLE = ['name', 'phone', 'whatsapp_phone', 'email', 'business_name', 'website', 'instagram', 'linkedin', 'city', 'profession', 'lost_reason', 'expected_value_paise'];

// ── Dashboard ─────────────────────────────────────────────────
const dashboard = async (req, res) => {
  try { res.json(await leadService.dashboardStats()); } catch (e) { safeError(res, e); }
};
const pipeline = async (req, res) => {
  try { res.json(await leadService.pipelineCounts()); } catch (e) { safeError(res, e); }
};

// ── Leads ─────────────────────────────────────────────────────
const listLeads = async (req, res) => {
  try {
    const { status, source, owner, tag, city, profession, q, followup, createdSince, hasValue, page, pageSize } = req.query;
    res.json(await leadService.listLeads({
      status, source, owner, tag, city, profession, q,
      followup, createdSince, hasValue: hasValue === 'true' || hasValue === '1',
      page: Number(page) || 1, pageSize: Math.min(Number(pageSize) || 25, 100),
    }));
  } catch (e) { safeError(res, e); }
};

const createLead = async (req, res) => {
  try {
    const { lead, created } = await leadService.upsertLead(req.body || {}, { source: req.body?.source, createdBy: actor(req) });
    res.status(created ? 201 : 200).json({ lead, created });
  } catch (e) { safeError(res, e); }
};

const getLead = async (req, res) => {
  try {
    const lead = await leadService.getLead(req.params.id);
    if (!lead) return res.status(404).json({ message: 'Lead not found' });
    const [{ data: notes }, followUps] = await Promise.all([
      supabaseAdmin.from('lead_notes').select('*').eq('lead_id', lead.id).order('created_at', { ascending: false }),
      followUpService.listOpen({ leadId: lead.id }),
    ]);
    res.json({ lead, notes: notes || [], followUps });
  } catch (e) { safeError(res, e); }
};

const updateLead = async (req, res) => {
  try {
    const patch = {};
    for (const k of EDITABLE) if (k in (req.body || {})) patch[k] = req.body[k];
    if (!Object.keys(patch).length) return res.status(400).json({ message: 'No editable fields' });
    patch.updated_at = new Date().toISOString();
    const { data, error } = await supabaseAdmin.from('leads').update(patch).eq('id', req.params.id).select('*').single();
    if (error) return safeError(res, error);
    res.json(data);
  } catch (e) { safeError(res, e); }
};

const getTimeline = async (req, res) => {
  try { res.json(await timeline.getTimeline(req.params.id)); } catch (e) { safeError(res, e); }
};

// Per-lead CRM message log (sends + their delivery status), newest first.
const leadMessages = async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin.from('crm_messages')
      .select('*').eq('lead_id', req.params.id).order('created_at', { ascending: false }).limit(100);
    if (error) return safeError(res, error);
    res.json(data || []);
  } catch (e) { safeError(res, e); }
};

const setStatus = async (req, res) => {
  try { res.json(await leadService.changeStatus(req.params.id, req.body?.status, actor(req))); }
  catch (e) { res.status(400).json({ message: e.message }); }
};
const setOwner = async (req, res) => {
  try { res.json(await leadService.assignOwner(req.params.id, req.body?.ownerAdminId || null, actor(req))); }
  catch (e) { safeError(res, e); }
};
const addTag = async (req, res) => {
  try { res.json(await leadService.addTag(req.params.id, req.body?.tag, actor(req))); } catch (e) { safeError(res, e); }
};
const removeTag = async (req, res) => {
  try { res.json(await leadService.removeTag(req.params.id, req.params.tag, actor(req))); } catch (e) { safeError(res, e); }
};
const setDnc = async (req, res) => {
  try { res.json(await leadService.setDnc(req.params.id, !!req.body?.value, actor(req))); } catch (e) { safeError(res, e); }
};
const addNote = async (req, res) => {
  try { res.status(201).json(await leadService.addNote(req.params.id, req.body?.body, actor(req))); }
  catch (e) { res.status(400).json({ message: e.message }); }
};
const logCall = async (req, res) => {
  try { res.json(await leadService.logCall(req.params.id, req.body || {}, actor(req))); } catch (e) { safeError(res, e); }
};

// ── Sends (queued through the gated MessageService) ───────────
const sendWhatsApp = async (req, res) => {
  try {
    const { templateKey, params = [] } = req.body || {};
    if (!templateKey) return res.status(400).json({ message: 'templateKey required' });
    const row = await messageService.enqueue({
      leadId: req.params.id, channel: 'whatsapp', templateKey,
      variables: { params }, createdBy: actor(req), immediate: true,
    });
    res.status(202).json(row);
  } catch (e) { safeError(res, e); }
};

const sendEmail = async (req, res) => {
  try {
    const { subject, html, text } = req.body || {};
    if (!subject || !html) return res.status(400).json({ message: 'subject and html required' });
    const row = await messageService.enqueue({
      leadId: req.params.id, channel: 'email', subject,
      variables: { html, text }, createdBy: actor(req), immediate: true,
    });
    res.status(202).json(row);
  } catch (e) { safeError(res, e); }
};

// ── Follow-ups ────────────────────────────────────────────────
const listFollowUps = async (req, res) => {
  try { res.json(await followUpService.listOpen({ ownerAdminId: req.query.owner, before: req.query.before })); }
  catch (e) { safeError(res, e); }
};
const createFollowUp = async (req, res) => {
  try {
    const { title, dueAt, remind, ownerAdminId } = req.body || {};
    res.status(201).json(await followUpService.create({
      leadId: req.params.id, ownerAdminId: ownerAdminId || actor(req), title, dueAt, remind, createdBy: actor(req),
    }));
  } catch (e) { res.status(400).json({ message: e.message }); }
};
const completeFollowUp = async (req, res) => {
  try { res.json(await followUpService.complete(req.params.id, actor(req))); } catch (e) { safeError(res, e); }
};
const cancelFollowUp = async (req, res) => {
  try { res.json(await followUpService.cancel(req.params.id)); } catch (e) { safeError(res, e); }
};

// ── Sequences ─────────────────────────────────────────────────
const listSequences = async (req, res) => {
  try {
    const { data } = await supabaseAdmin.from('crm_sequences').select('*, crm_sequence_steps(*)').order('created_at', { ascending: false });
    res.json(data || []);
  } catch (e) { safeError(res, e); }
};
const createSequence = async (req, res) => {
  try {
    const { name, description, steps = [], stop_on_reply, stop_on_convert } = req.body || {};
    if (!name) return res.status(400).json({ message: 'name required' });
    const { data: seq, error } = await supabaseAdmin.from('crm_sequences')
      .insert({ name, description: description || '', stop_on_reply: stop_on_reply !== false, stop_on_convert: stop_on_convert !== false, created_by: actor(req) })
      .select('*').single();
    if (error) return safeError(res, error);
    if (steps.length) {
      const rows = steps.map((s, i) => ({
        sequence_id: seq.id, step_no: i + 1, delay_hours: Number(s.delay_hours) || 0,
        channel: s.channel, template_key: s.template_key || null, subject: s.subject || null, body: s.body || null,
      }));
      await supabaseAdmin.from('crm_sequence_steps').insert(rows);
    }
    res.status(201).json(seq);
  } catch (e) { safeError(res, e); }
};
const enroll = async (req, res) => {
  try {
    const { sequenceId } = req.body || {};
    if (!sequenceId) return res.status(400).json({ message: 'sequenceId required' });
    res.status(201).json(await sequenceService.enroll(sequenceId, req.params.id, actor(req)));
  } catch (e) { res.status(400).json({ message: e.message }); }
};

// ── Bulk ──────────────────────────────────────────────────────
const bulk = async (req, res) => {
  try {
    const { ids = [], action, value, payload = {} } = req.body || {};
    if (!Array.isArray(ids) || !ids.length || !action) return res.status(400).json({ message: 'ids[] and action required' });

    // Validate send/enrol payloads once, up front, so a bad request fails fast
    // instead of half-processing the batch.
    if (action === 'whatsapp' && !payload.templateKey) return res.status(400).json({ message: 'payload.templateKey required' });
    if (action === 'email' && (!payload.subject || !payload.html)) return res.status(400).json({ message: 'payload.subject and payload.html required' });
    if (action === 'enroll' && !payload.sequenceId) return res.status(400).json({ message: 'payload.sequenceId required' });

    const who = actor(req);
    let done = 0;
    for (const id of ids) {
      try {
        if (action === 'status') await leadService.changeStatus(id, value, who);
        else if (action === 'owner') await leadService.assignOwner(id, value || null, who);
        else if (action === 'tag_add') await leadService.addTag(id, value, who);
        else if (action === 'tag_remove') await leadService.removeTag(id, value, who);
        else if (action === 'dnc') await leadService.setDnc(id, true, who);
        // Bulk sends are QUEUED (immediate:false) — the send worker drains them
        // through the gate (kill-switch + DNC + opt-out + frequency cap), so a
        // bulk blast can't bypass the coordinated-conversation limits.
        else if (action === 'whatsapp') {
          await messageService.enqueue({ leadId: id, channel: 'whatsapp', templateKey: payload.templateKey, variables: { params: payload.params || [] }, createdBy: who, immediate: false });
        } else if (action === 'email') {
          await messageService.enqueue({ leadId: id, channel: 'email', subject: payload.subject, variables: { html: payload.html }, createdBy: who, immediate: false });
        } else if (action === 'enroll') {
          await sequenceService.enroll(payload.sequenceId, id, who);
        } else return res.status(400).json({ message: `unknown action: ${action}` });
        done++;
      } catch (_) { /* skip individual failures */ }
    }
    res.json({ done, total: ids.length });
  } catch (e) { safeError(res, e); }
};

// ── Import / Export ───────────────────────────────────────────
const validEmail = (e) => !e || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);

const importPreview = async (req, res) => {
  try {
    const rows = Array.isArray(req.body?.rows) ? req.body.rows : [];
    const seen = new Set();
    const preview = rows.map((r, i) => {
      const phone = (r.phone || '').trim();
      const email = (r.email || '').trim().toLowerCase();
      const key = phone || email;
      const errors = [];
      if (!phone && !email) errors.push('no phone or email');
      if (email && !validEmail(email)) errors.push('bad email');
      const dupInBatch = key && seen.has(key);
      if (key) seen.add(key);
      return { row: i + 1, name: r.name || '', phone, email, business: r.business || '', errors, dupInBatch };
    });
    res.json({ total: rows.length, valid: preview.filter((p) => !p.errors.length).length, preview });
  } catch (e) { safeError(res, e); }
};

const importCommit = async (req, res) => {
  try {
    const rows = Array.isArray(req.body?.rows) ? req.body.rows : [];
    let created = 0, merged = 0, skipped = 0;
    for (const r of rows) {
      if (!r.phone && !r.email) { skipped++; continue; }
      try {
        const { created: isNew } = await leadService.upsertLead({
          name: r.name || '', phone: r.phone || '', whatsapp_phone: r.whatsapp || r.phone || '',
          email: r.email || '', business_name: r.business || '', profession: r.profession || '',
          city: r.city || '', tags: Array.isArray(r.tags) ? r.tags : (r.tags ? String(r.tags).split(',').map((t) => t.trim()) : []),
        }, { source: r.source || 'import', createdBy: actor(req) });
        if (isNew) created++; else merged++;
      } catch (_) { skipped++; }
    }
    res.json({ created, merged, skipped });
  } catch (e) { safeError(res, e); }
};

const exportCsv = async (req, res) => {
  try {
    const { rows } = await leadService.listLeads({ ...req.query, page: 1, pageSize: 5000 });
    const cols = ['id', 'name', 'phone', 'email', 'business_name', 'profession', 'city', 'source', 'status', 'revenue_paise', 'created_at'];
    const esc = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
    const csv = [cols.join(',')].concat((rows || []).map((r) => cols.map((c) => esc(r[c])).join(','))).join('\n');
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="leads.csv"');
    res.send(csv);
  } catch (e) { safeError(res, e); }
};

// ── Message templates (approved WhatsApp + reusable email) ────
const listTemplates = async (req, res) => {
  try {
    let q = supabaseAdmin.from('crm_templates').select('*').eq('is_active', true);
    if (req.query.channel) q = q.eq('channel', req.query.channel);
    const { data, error } = await q.order('label', { ascending: true });
    if (error) return safeError(res, error);
    res.json(data || []);
  } catch (e) { safeError(res, e); }
};

const createTemplate = async (req, res) => {
  try {
    const { channel, name, label, category, variables, subject, body } = req.body || {};
    if (!['whatsapp', 'email'].includes(channel)) return res.status(400).json({ message: 'channel must be whatsapp|email' });
    if (!name || !label) return res.status(400).json({ message: 'name and label required' });
    const row = {
      channel, name: String(name).trim(), label: String(label).trim(),
      category: category || 'custom',
      variables: Array.isArray(variables) ? variables : [],
      subject: subject || null, body: body || null, created_by: actor(req),
    };
    const { data, error } = await supabaseAdmin.from('crm_templates').insert(row).select('*').single();
    if (error) return res.status(error.code === '23505' ? 409 : 500).json({ message: error.code === '23505' ? 'A template with this name already exists' : 'Could not save' });
    res.status(201).json(data);
  } catch (e) { safeError(res, e); }
};

const updateTemplate = async (req, res) => {
  try {
    const allowed = ['name', 'label', 'category', 'variables', 'subject', 'body', 'is_active'];
    const patch = {};
    for (const k of allowed) if (k in (req.body || {})) patch[k] = req.body[k];
    patch.updated_at = new Date().toISOString();
    const { data, error } = await supabaseAdmin.from('crm_templates').update(patch).eq('id', req.params.id).select('*').single();
    if (error) return safeError(res, error);
    res.json(data);
  } catch (e) { safeError(res, e); }
};

const deleteTemplate = async (req, res) => {
  try {
    // Soft-delete: keep the row (message history references names) but drop it
    // from the picker.
    await supabaseAdmin.from('crm_templates').update({ is_active: false, updated_at: new Date().toISOString() }).eq('id', req.params.id);
    res.json({ ok: true });
  } catch (e) { safeError(res, e); }
};

// ── Tag catalog (Notion-style coloured tags) ─────────────────
const TAG_COLORS = ['gray', 'brown', 'orange', 'yellow', 'green', 'blue', 'purple', 'pink', 'red', 'teal'];

const listTags = async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin.from('crm_tags').select('*').order('name', { ascending: true });
    if (error) return safeError(res, error);
    res.json(data || []);
  } catch (e) { safeError(res, e); }
};

const createTag = async (req, res) => {
  try {
    let { name, color } = req.body || {};
    name = String(name || '').trim();
    if (!name) return res.status(400).json({ message: 'name required' });
    color = TAG_COLORS.includes(color) ? color : 'gray';
    const { data, error } = await supabaseAdmin.from('crm_tags')
      .insert({ name, color, created_by: actor(req) || '' }).select('*').single();
    if (error) return res.status(error.code === '23505' ? 409 : 500).json({ message: error.code === '23505' ? 'Tag already exists' : 'Could not save' });
    res.status(201).json(data);
  } catch (e) { safeError(res, e); }
};

const updateTag = async (req, res) => {
  try {
    const patch = {};
    if ('name' in (req.body || {})) patch.name = String(req.body.name).trim();
    if ('color' in (req.body || {})) patch.color = TAG_COLORS.includes(req.body.color) ? req.body.color : 'gray';
    if (!Object.keys(patch).length) return res.status(400).json({ message: 'nothing to update' });
    patch.updated_at = new Date().toISOString();
    const { data, error } = await supabaseAdmin.from('crm_tags').update(patch).eq('id', req.params.id).select('*').single();
    if (error) return safeError(res, error);
    res.json(data);
  } catch (e) { safeError(res, e); }
};

const deleteTag = async (req, res) => {
  try {
    // Remove from the catalog only; leads keep the tag string (renders default colour).
    await supabaseAdmin.from('crm_tags').delete().eq('id', req.params.id);
    res.json({ ok: true });
  } catch (e) { safeError(res, e); }
};

// Manual attribution refresh (link + revenue).
const refreshAttribution = async (req, res) => {
  try { res.json(await attribution.run()); } catch (e) { safeError(res, e); }
};

module.exports = {
  dashboard, pipeline,
  listLeads, createLead, getLead, updateLead, getTimeline, leadMessages,
  setStatus, setOwner, addTag, removeTag, setDnc, addNote, logCall,
  sendWhatsApp, sendEmail,
  listFollowUps, createFollowUp, completeFollowUp, cancelFollowUp,
  listSequences, createSequence, enroll,
  bulk, importPreview, importCommit, exportCsv, refreshAttribution,
  listTemplates, createTemplate, updateTemplate, deleteTemplate,
  listTags, createTag, updateTag, deleteTag,
};
