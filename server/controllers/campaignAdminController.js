/**
 * campaignAdminController — Super Admin → Campaigns (Phase 1: email).
 * Contacts (list/sync/suppress), segments (list/preview), campaigns (CRUD + launch).
 */
'use strict';
const { supabaseAdmin } = require('../config/supabase');
const { safeError } = require('../utils/httpError');
const { sanitizeLikeTerm } = require('../utils/searchSanitize');
const contactsService = require('../services/contactsService');
const segmentService = require('../services/segmentService');
const campaignService = require('../services/campaignService');
const campaignCompiler = require('../services/email/campaignCompiler');
const communicationEngine = require('../services/email/communicationEngine');
const { audit } = require('../services/auditService');

// ── Contacts ──
const listContacts = async (req, res) => {
  try {
    const { type, search, limit = 100 } = req.query;
    let q = supabaseAdmin.from('contacts').select('*').order('updated_at', { ascending: false }).limit(Math.min(parseInt(limit) || 100, 500));
    if (type) q = q.eq('contact_type', type);
    const safeSearch = sanitizeLikeTerm(search);
    // Manual/single audience picker searches by name, email, or phone.
    if (safeSearch) q = q.or(`email.ilike.%${safeSearch}%,name.ilike.%${safeSearch}%,phone.ilike.%${safeSearch}%`);
    const { data, error } = await q;
    if (error) return safeError(res, error);
    res.json(data || []);
  } catch (e) { safeError(res, e); }
};
const syncContacts = async (_req, res) => {
  try { const r = await contactsService.sync(); res.json(r); }
  catch (e) { safeError(res, e); }
};
const suppressContact = async (req, res) => {
  try {
    const allowed = ['email_opt_in', 'whatsapp_opt_in', 'email_suppressed', 'whatsapp_suppressed'];
    const updates = { updated_at: new Date().toISOString() };
    for (const k of allowed) if (k in req.body) updates[k] = !!req.body[k];
    const { data, error } = await supabaseAdmin.from('contacts').update(updates).eq('id', req.params.id).select().single();
    if (error || !data) return res.status(404).json({ message: error?.message || 'Contact not found' });
    res.json(data);
  } catch (e) { safeError(res, e); }
};

// ── Segments ──
const listSegments = async (_req, res) => {
  try { const { data, error } = await supabaseAdmin.from('segments').select('*').order('name');
    if (error) return safeError(res, error); res.json(data || []);
  } catch (e) { safeError(res, e); }
};
const previewSegment = async (req, res) => {
  try { const n = await segmentService.count(req.body?.definition || {}, req.body?.channel || 'email'); res.json({ count: n }); }
  catch (e) { safeError(res, e); }
};

/**
 * Resolve an audience to the actual recipient list (name/email/type) so the
 * admin can SEE who receives before launching. Segment (definition) or an
 * explicit pick (audience_ref). Consent/suppression already applied.
 */
const resolveAudience = async (req, res) => {
  try {
    const { audience_type = 'segment', definition, audience_ref, channel = 'email' } = req.body || {};
    const rows = ['manual', 'single'].includes(audience_type)
      ? await segmentService.resolveRefs(audience_ref || {}, channel)
      : await segmentService.resolve(definition || {}, channel);
    const recipients = rows.slice(0, 1000).map((c) => ({ id: c.id, name: c.name || '', email: c.email || '', contact_type: c.contact_type || '' }));
    res.json({ count: rows.length, recipients, truncated: rows.length > recipients.length });
  } catch (e) { safeError(res, e); }
};

// ── Campaigns ──
const listCampaigns = async (_req, res) => {
  try { const { data, error } = await supabaseAdmin.from('email_campaigns').select('*').order('created_at', { ascending: false });
    if (error) return safeError(res, error); res.json(data || []);
  } catch (e) { safeError(res, e); }
};
const createCampaign = async (req, res) => {
  try {
    if (!req.body?.name) return res.status(400).json({ message: 'name is required' });
    // A composer campaign ships a design_json block model → compile to the
    // chrome-less html_content the send path wraps per recipient.
    const input = { ...req.body, created_by: req.admin?.email || '' };
    if (input.design_json) input.html_content = campaignCompiler.compile(input.design_json).bodyHtml;
    const r = await campaignService.create(input);
    if (r.error) return res.status(500).json({ message: r.error });
    res.status(201).json(r);
  } catch (e) { safeError(res, e); }
};

/** Preview: compile a design → full email HTML (dummy unsubscribe token). */
const previewCampaign = async (req, res) => {
  try {
    const design = req.body?.design_json || { blocks: req.body?.blocks || [] };
    const audience = req.body?.audience === 'vendor' ? 'vendor' : 'customer';
    const { bodyHtml } = campaignCompiler.compile(design);
    const settings = await communicationEngine.loadSettings();
    const pseudo = {
      subject: req.body?.subject || '', html_content: bodyHtml,
      preview_text: req.body?.preview_text || '', cta_label: '', cta_url: '', email_category: '', audience,
    };
    const { html } = communicationEngine.renderEmail(pseudo, {
      data: { unsubscribe_token: 'preview', first_name: 'there', name: 'there' },
      user: {}, settings, audience,
    });
    res.json({ html });
  } catch (e) { safeError(res, e); }
};
const getCampaign = async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin.from('email_campaigns').select('*').eq('id', req.params.id).single();
    if (error || !data) return res.status(404).json({ message: 'Campaign not found' });
    const stats = await campaignService.stats(req.params.id);
    res.json({ ...data, live_stats: stats });
  } catch (e) { safeError(res, e); }
};
const updateCampaign = async (req, res) => {
  try {
    const allowed = ['name', 'channel', 'segment_id', 'template_id', 'whatsapp_template_id', 'subject_override', 'scheduled_at', 'throttle_per_min', 'status',
      'audience_type', 'audience_ref', 'design_json', 'subject', 'preview_text', 'sender_key'];
    const updates = { updated_at: new Date().toISOString() };
    for (const k of allowed) if (k in req.body) updates[k] = req.body[k];
    // Recompile the body whenever the design changes.
    if ('design_json' in req.body) updates.html_content = campaignCompiler.compile(req.body.design_json || {}).bodyHtml;
    let { data, error } = await supabaseAdmin.from('email_campaigns').update(updates).eq('id', req.params.id).select().single();
    if (error && /Could not find the|does not exist|column .* does not exist/i.test(error.message || '')) {
      const { audience_type, audience_ref, design_json, subject, preview_text, sender_key, html_content, ...safe } = updates;
      ({ data, error } = await supabaseAdmin.from('email_campaigns').update(safe).eq('id', req.params.id).select().single());
    }
    if (error || !data) return res.status(404).json({ message: error?.message || 'Campaign not found' });
    res.json(data);
  } catch (e) { safeError(res, e); }
};
const launchCampaign = async (req, res) => {
  try {
    const r = await campaignService.launch(req.params.id);
    if (r.error) return res.status(400).json({ message: r.error });
    audit(req, { action: 'campaign.launch', resource_type: 'campaign', resource_id: req.params.id, after: { recipients: r.recipients } });
    res.json({ message: `Launched — ${r.recipients} recipients queued`, recipients: r.recipients });
  } catch (e) { safeError(res, e); }
};

// ── WhatsApp templates (AiSensy approved-template registry + variable map) ──
const listWaTemplates = async (_req, res) => {
  try { const { data, error } = await supabaseAdmin.from('whatsapp_templates').select('*').order('name');
    if (error) return safeError(res, error); res.json(data || []);
  } catch (e) { safeError(res, e); }
};
const createWaTemplate = async (req, res) => {
  try {
    const { name, aisensy_campaign_name } = req.body || {};
    if (!name || !aisensy_campaign_name) return res.status(400).json({ message: 'name and aisensy_campaign_name are required' });
    const row = {
      name, aisensy_campaign_name, language: req.body.language || 'en',
      body_preview: req.body.body_preview || '', variable_map: req.body.variable_map || {},
      param_count: req.body.param_count || 0, approval_status: req.body.approval_status || 'pending',
      is_active: req.body.is_active !== undefined ? !!req.body.is_active : true,
    };
    const { data, error } = await supabaseAdmin.from('whatsapp_templates').insert(row).select().single();
    if (error) return safeError(res, error);
    res.status(201).json(data);
  } catch (e) { safeError(res, e); }
};
const updateWaTemplate = async (req, res) => {
  try {
    const allowed = ['name', 'aisensy_campaign_name', 'language', 'body_preview', 'variable_map', 'param_count', 'approval_status', 'is_active'];
    const updates = { updated_at: new Date().toISOString() };
    for (const k of allowed) if (k in req.body) updates[k] = req.body[k];
    const { data, error } = await supabaseAdmin.from('whatsapp_templates').update(updates).eq('id', req.params.id).select().single();
    if (error || !data) return res.status(404).json({ message: error?.message || 'Template not found' });
    res.json(data);
  } catch (e) { safeError(res, e); }
};

module.exports = {
  listContacts, syncContacts, suppressContact,
  listSegments, previewSegment, resolveAudience,
  listCampaigns, createCampaign, previewCampaign, getCampaign, updateCampaign, launchCampaign,
  listWaTemplates, createWaTemplate, updateWaTemplate,
};
