'use strict';
/**
 * payoutAdminController.js — admin payout approval workflow.
 * Statuses: pending -> approved -> paid (terminal) | pending -> rejected.
 * approve = authorization only (no money/ledger). pay = records the payment
 * reference AND posts a SETTLEMENT journal entry (Vendor Payables -> Bank)
 * BEFORE flipping to paid, so a ledger failure leaves the row approved for an
 * idempotent retry. reject reuses admin_note for the reason.
 */
const { safeError } = require('../utils/httpError');
const { supabaseAdmin } = require('../config/supabase');
const { audit } = require('../services/auditService');
const { post } = require('../services/ledger/postingService');
const { payoutEntry } = require('../services/ledger/journalTemplates');

const now = () => new Date().toISOString();

const fetchPayout = async (id) => {
  const { data } = await supabaseAdmin.from('payout_requests').select('*').eq('id', id).maybeSingle();
  return data;
};

// GET /admin/payouts?status=
const listPayouts = async (req, res) => {
  try {
    const { status } = req.query || {};
    let q = supabaseAdmin
      .from('payout_requests')
      .select('*, profiles:host_id(name, username, email)')
      .order('created_at', { ascending: false });
    if (status && status !== 'all') q = q.eq('status', status);
    const { data, error } = await q;
    if (error) return safeError(res, error);
    res.json(data || []);
  } catch (e) { safeError(res, e); }
};

// POST /admin/payouts/:id/approve
const approvePayout = async (req, res) => {
  try {
    const p = await fetchPayout(req.params.id);
    if (!p) return res.status(404).json({ message: 'Payout request not found' });
    if (p.status !== 'pending') return res.status(409).json({ message: `Cannot approve a ${p.status} request` });
    const { data, error } = await supabaseAdmin.from('payout_requests')
      .update({ status: 'approved', approved_by: req.admin.id, approved_at: now(), updated_at: now() })
      .eq('id', p.id).eq('status', 'pending').select().single();
    if (error) return safeError(res, error);
    await audit(req, { action: 'payout.approve', resource_type: 'payout_request', resource_id: p.id, before: { status: p.status }, after: { status: 'approved' } });
    res.json(data);
  } catch (e) { safeError(res, e); }
};

// POST /admin/payouts/:id/reject  { reason }
const rejectPayout = async (req, res) => {
  try {
    const reason = ((req.body && req.body.reason) || '').trim();
    if (!reason) return res.status(400).json({ message: 'A rejection reason is required' });
    const p = await fetchPayout(req.params.id);
    if (!p) return res.status(404).json({ message: 'Payout request not found' });
    if (p.status !== 'pending') return res.status(409).json({ message: `Cannot reject a ${p.status} request` });
    const { data, error } = await supabaseAdmin.from('payout_requests')
      .update({ status: 'rejected', admin_note: reason, rejected_at: now(), updated_at: now() })
      .eq('id', p.id).eq('status', 'pending').select().single();
    if (error) return safeError(res, error);
    await audit(req, { action: 'payout.reject', resource_type: 'payout_request', resource_id: p.id, before: { status: p.status }, after: { status: 'rejected', reason } });
    res.json(data);
  } catch (e) { safeError(res, e); }
};

// POST /admin/payouts/:id/pay  { payment_reference }
const markPayoutPaid = async (req, res) => {
  try {
    const reference = ((req.body && req.body.payment_reference) || '').trim();
    if (!reference) return res.status(400).json({ message: 'A payment reference is required' });
    const p = await fetchPayout(req.params.id);
    if (!p) return res.status(404).json({ message: 'Payout request not found' });
    if (p.status !== 'approved') return res.status(409).json({ message: `Cannot pay a ${p.status} request` });

    // Post the ledger entry FIRST (throwing). If it fails, the row stays
    // approved and the admin can retry — idempotent on (SETTLEMENT, p.id).
    await post({
      sourceType: 'SETTLEMENT', sourceId: p.id,
      journalDate: now().slice(0, 10), createdBy: req.admin.id,
      template: payoutEntry({ host_id: p.host_id, amount: Number(p.amount), reference }),
    });

    const { data, error } = await supabaseAdmin.from('payout_requests')
      .update({ status: 'paid', payment_reference: reference, paid_by: req.admin.id, paid_at: now(), updated_at: now() })
      .eq('id', p.id).eq('status', 'approved').select().single();
    if (error) return safeError(res, error);
    await audit(req, { action: 'payout.pay', resource_type: 'payout_request', resource_id: p.id, before: { status: p.status }, after: { status: 'paid', reference } });
    res.json(data);
  } catch (e) { safeError(res, e); }
};

module.exports = { listPayouts, approvePayout, rejectPayout, markPayoutPaid };
