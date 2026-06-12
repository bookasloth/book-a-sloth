/**
 * campaignAdminController — Super Admin → Campaigns (Phase 1: email).
 * Contacts (list/sync/suppress), segments (list/preview), campaigns (CRUD + launch).
 */
'use strict';
const { supabaseAdmin } = require('../config/supabase');
const contactsService = require('../services/contactsService');
const segmentService = require('../services/segmentService');
const campaignService = require('../services/campaignService');

// ── Contacts ──
const listContacts = async (req, res) => {
  try {
    const { type, search, limit = 100 } = req.query;
    let q = supabaseAdmin.from('contacts').select('*').order('updated_at', { ascending: false }).limit(Math.min(parseInt(limit) || 100, 500));
    if (type) q = q.eq('contact_type', type);
    if (search) q = q.ilike('email', `%${search}%`);
    const { data, error } = await q;
    if (error) return res.status(500).json({ message: error.message });
    res.json(data || []);
  } catch (e) { res.status(500).json({ message: e.message }); }
};
const syncContacts = async (_req, res) => {
  try { const r = await contactsService.sync(); res.json(r); }
  catch (e) { res.status(500).json({ message: e.message }); }
};
const suppressContact = async (req, res) => {
  try {
    const allowed = ['email_opt_in', 'whatsapp_opt_in', 'email_suppressed', 'whatsapp_suppressed'];
    const updates = { updated_at: new Date().toISOString() };
    for (const k of allowed) if (k in req.body) updates[k] = !!req.body[k];
    const { data, error } = await supabaseAdmin.from('contacts').update(updates).eq('id', req.params.id).select().single();
    if (error || !data) return res.status(404).json({ message: error?.message || 'Contact not found' });
    res.json(data);
  } catch (e) { res.status(500).json({ message: e.message }); }
};

// ── Segments ──
const listSegments = async (_req, res) => {
  try { const { data, error } = await supabaseAdmin.from('segments').select('*').order('name');
    if (error) return res.status(500).json({ message: error.message }); res.json(data || []);
  } catch (e) { res.status(500).json({ message: e.message }); }
};
const previewSegment = async (req, res) => {
  try { const n = await segmentService.count(req.body?.definition || {}, 'email'); res.json({ count: n }); }
  catch (e) { res.status(500).json({ message: e.message }); }
};

// ── Campaigns ──
const listCampaigns = async (_req, res) => {
  try { const { data, error } = await supabaseAdmin.from('email_campaigns').select('*').order('created_at', { ascending: false });
    if (error) return res.status(500).json({ message: error.message }); res.json(data || []);
  } catch (e) { res.status(500).json({ message: e.message }); }
};
const createCampaign = async (req, res) => {
  try {
    if (!req.body?.name) return res.status(400).json({ message: 'name is required' });
    const r = await campaignService.create({ ...req.body, created_by: req.admin?.email || '' });
    if (r.error) return res.status(500).json({ message: r.error });
    res.status(201).json(r);
  } catch (e) { res.status(500).json({ message: e.message }); }
};
const getCampaign = async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin.from('email_campaigns').select('*').eq('id', req.params.id).single();
    if (error || !data) return res.status(404).json({ message: 'Campaign not found' });
    const stats = await campaignService.stats(req.params.id);
    res.json({ ...data, live_stats: stats });
  } catch (e) { res.status(500).json({ message: e.message }); }
};
const updateCampaign = async (req, res) => {
  try {
    const allowed = ['name', 'segment_id', 'template_id', 'subject_override', 'scheduled_at', 'throttle_per_min', 'status'];
    const updates = { updated_at: new Date().toISOString() };
    for (const k of allowed) if (k in req.body) updates[k] = req.body[k];
    const { data, error } = await supabaseAdmin.from('email_campaigns').update(updates).eq('id', req.params.id).select().single();
    if (error || !data) return res.status(404).json({ message: error?.message || 'Campaign not found' });
    res.json(data);
  } catch (e) { res.status(500).json({ message: e.message }); }
};
const launchCampaign = async (req, res) => {
  try {
    const r = await campaignService.launch(req.params.id);
    if (r.error) return res.status(400).json({ message: r.error });
    res.json({ message: `Launched — ${r.recipients} recipients queued`, recipients: r.recipients });
  } catch (e) { res.status(500).json({ message: e.message }); }
};

module.exports = {
  listContacts, syncContacts, suppressContact,
  listSegments, previewSegment,
  listCampaigns, createCampaign, getCampaign, updateCampaign, launchCampaign,
};
