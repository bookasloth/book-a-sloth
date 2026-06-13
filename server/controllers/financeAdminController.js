/**
 * financeAdminController.js — P1 ledger admin API.
 * Reads: summary metrics, chart of accounts, journal browser, per-account ledger.
 * Writes: manual journal entries ONLY (adjustment / reversal / bank transfer)
 * via postingService → RPC. No direct table writes, ever (immutability).
 */
'use strict';

const crypto = require('crypto');
const { safeError } = require('../utils/httpError');
const { supabaseAdmin } = require('../config/supabase');
const { audit } = require('../services/auditService');
const { adjustmentEntry, reversalEntry, bankTransferEntry } = require('../services/ledger/journalTemplates');
const { post } = require('../services/ledger/postingService');

const round2 = (n) => Math.round((Number(n) + Number.EPSILON) * 100) / 100;
const PAGE_LIMIT = 25;

// ── GET /admin/finance/summary ────────────────────────────────
const getSummary = async (req, res) => {
  try {
    const { data: balanceRows, error } = await supabaseAdmin
      .from('account_balances')
      .select('balance, chart_of_accounts(code, name, type)');
    if (error) return safeError(res, error);

    const balances = {};
    for (const row of balanceRows || []) {
      const acct = row.chart_of_accounts;
      if (acct) balances[acct.code] = { name: acct.name, type: acct.type, balance: Number(row.balance) };
    }
    const bal = (code) => balances[code]?.balance || 0;

    // Gross collection + order-gateway-charge metrics from snapshot rows.
    // PostgREST `.sum()` aggregate selects are fragile across versions, so we
    // fetch the columns and reduce in JS.
    // TODO(P4): move aggregation to an indexed SQL view.
    const { data: orderRows } = await supabaseAdmin
      .from('bookings')
      .select('customer_total, razorpay_fee_actual, razorpay_tax_actual')
      .eq('payment_status', 'paid');
    const { data: subRows } = await supabaseAdmin
      .from('subscription_payments')
      .select('total_charged')
      .eq('status', 'paid');

    let orderCollections = 0;
    let rzpChargesOrders = 0;
    for (const o of orderRows || []) {
      orderCollections += Number(o.customer_total || 0);
      rzpChargesOrders += Number(o.razorpay_fee_actual || 0) + Number(o.razorpay_tax_actual || 0);
    }
    let subCollections = 0;
    for (const s of subRows || []) subCollections += Number(s.total_charged || 0);

    // Order gateway charges are vendor-borne (account 5000 nets 0), so they are
    // excluded from net revenue; only subscription/settlement/refund losses bite.
    const netRevenue = round2(
      bal('4000') + bal('4100') + bal('4200')
      - bal('5100') - bal('5200') - bal('5300'),
    );
    const availableCash = round2(bal('1000') - bal('2000') - bal('2100'));

    res.json({
      balances,
      metrics: {
        gross_collections: round2(orderCollections + subCollections),
        outstanding_vendor_payables: bal('2000'),
        platform_fee_revenue: bal('4000'),
        commission_revenue: bal('4100'),
        subscription_revenue: bal('4200'),
        gst_liability: bal('2100'),
        razorpay_charges_orders: round2(rzpChargesOrders),
        razorpay_charges_subscriptions: bal('5100'),
        net_revenue: netRevenue,
        available_business_cash: availableCash,
        razorpay_receivable: bal('1100'),
        bank_balance: bal('1000'),
      },
    });
  } catch (e) {
    safeError(res, e);
  }
};

// ── GET /admin/finance/accounts ───────────────────────────────
const getAccounts = async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('chart_of_accounts')
      .select('id, code, name, type, active, account_balances(balance)')
      .order('code');
    if (error) return safeError(res, error);
    res.json({ accounts: data || [] });
  } catch (e) {
    safeError(res, e);
  }
};

// ── GET /admin/finance/journals ───────────────────────────────
const listJournals = async (req, res) => {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    let q = supabaseAdmin
      .from('journal_entries')
      .select('id, journal_number, journal_date, source_type, source_id, description, created_at', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range((page - 1) * PAGE_LIMIT, page * PAGE_LIMIT - 1);
    if (req.query.source_type) q = q.eq('source_type', req.query.source_type);
    if (req.query.from) q = q.gte('journal_date', req.query.from);
    if (req.query.to) q = q.lte('journal_date', req.query.to);
    const { data, error, count } = await q;
    if (error) return safeError(res, error);
    res.json({ journals: data || [], total: count || 0, page, limit: PAGE_LIMIT });
  } catch (e) {
    safeError(res, e);
  }
};

// ── GET /admin/finance/journals/:id ───────────────────────────
const getJournal = async (req, res) => {
  try {
    const { data: entry, error } = await supabaseAdmin
      .from('journal_entries').select('*').eq('id', req.params.id).single();
    if (error || !entry) return res.status(404).json({ message: 'Journal entry not found' });
    const { data: lines } = await supabaseAdmin
      .from('journal_lines')
      .select('id, debit, credit, vendor_id, order_item_id, subscription_payment_id, chart_of_accounts(code, name, type)')
      .eq('journal_entry_id', entry.id)
      .order('created_at');
    res.json({ entry, lines: lines || [] });
  } catch (e) {
    safeError(res, e);
  }
};

// ── GET /admin/finance/ledger/:accountId ──────────────────────
const getLedger = async (req, res) => {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const { data, error, count } = await supabaseAdmin
      .from('ledger_entries')
      .select('id, created_at, ledger_type, debit, credit, balance_after_account, vendor_id, order_item_id, journal_entries(journal_number, description, source_type)', { count: 'exact' })
      .eq('account_id', req.params.accountId)
      .order('created_at', { ascending: false })
      .range((page - 1) * PAGE_LIMIT, page * PAGE_LIMIT - 1);
    if (error) return safeError(res, error);
    res.json({ entries: data || [], total: count || 0, page, limit: PAGE_LIMIT });
  } catch (e) {
    safeError(res, e);
  }
};

// ── Manual entry validation ───────────────────────────────────
const validateLines = (lines) => {
  if (!Array.isArray(lines) || lines.length < 2) return 'At least 2 lines required';
  let d = 0, c = 0;
  for (const l of lines) {
    const debit = Number(l.debit) || 0, credit = Number(l.credit) || 0;
    if (debit < 0 || credit < 0) return 'Amounts cannot be negative';
    if ((debit > 0) === (credit > 0)) return 'Each line needs exactly one of debit/credit';
    if (!l.account_code) return 'Each line needs an account_code';
    d += debit; c += credit;
  }
  if (round2(d) !== round2(c)) return `Lines do not balance (debits ₹${round2(d)} vs credits ₹${round2(c)})`;
  return null;
};

// ── POST /admin/finance/adjustment ────────────────────────────
const postAdjustment = async (req, res) => {
  try {
    const { description, lines } = req.body || {};
    const invalid = validateLines(lines);
    if (invalid) return res.status(400).json({ message: invalid });
    const sourceId = crypto.randomUUID();
    const entryId = await post({
      sourceType: 'ADJUSTMENT', sourceId, createdBy: req.admin?.id || null,
      template: adjustmentEntry({ description, lines }),
    });
    await audit(req, {
      action: 'FINANCE_ADJUSTMENT_POSTED',
      resource_type: 'journal_entry',
      resource_id: entryId,
      after: { description: description || 'Manual adjustment' },
    });
    res.json({ id: entryId });
  } catch (e) {
    safeError(res, e);
  }
};

// ── POST /admin/finance/reversal ──────────────────────────────
const postReversal = async (req, res) => {
  try {
    const { journal_entry_id } = req.body || {};
    if (!journal_entry_id) return res.status(400).json({ message: 'journal_entry_id is required' });
    const { data: entry } = await supabaseAdmin
      .from('journal_entries').select('id, journal_number').eq('id', journal_entry_id).single();
    if (!entry) return res.status(404).json({ message: 'Journal entry not found' });
    const { data: lines } = await supabaseAdmin
      .from('journal_lines')
      .select('debit, credit, vendor_id, order_item_id, subscription_payment_id, chart_of_accounts(code)')
      .eq('journal_entry_id', entry.id);
    const flat = (lines || []).map((l) => ({
      account_code: l.chart_of_accounts.code,
      debit: Number(l.debit), credit: Number(l.credit),
      vendor_id: l.vendor_id, order_item_id: l.order_item_id,
      subscription_payment_id: l.subscription_payment_id,
    }));
    const entryId = await post({
      sourceType: 'REVERSAL', sourceId: entry.id, createdBy: req.admin?.id || null,
      template: reversalEntry({ journal_number: entry.journal_number, lines: flat }),
    });
    await audit(req, {
      action: 'FINANCE_REVERSAL_POSTED',
      resource_type: 'journal_entry',
      resource_id: entryId,
      after: { reversed: entry.journal_number },
    });
    res.json({ id: entryId });
  } catch (e) {
    safeError(res, e);
  }
};

// ── POST /admin/finance/bank-transfer ─────────────────────────
const postBankTransfer = async (req, res) => {
  try {
    const amount = Number(req.body?.amount);
    const reference = (req.body?.reference || '').trim();
    if (!(amount > 0)) return res.status(400).json({ message: 'amount must be > 0' });
    const sourceId = crypto.randomUUID();
    const entryId = await post({
      sourceType: 'BANK_TRANSFER', sourceId, createdBy: req.admin?.id || null,
      template: bankTransferEntry({ amount, reference }),
    });
    await audit(req, {
      action: 'FINANCE_BANK_TRANSFER_POSTED',
      resource_type: 'journal_entry',
      resource_id: entryId,
      after: { amount, reference },
    });
    res.json({ id: entryId });
  } catch (e) {
    safeError(res, e);
  }
};

module.exports = {
  getSummary, getAccounts, listJournals, getJournal, getLedger,
  postAdjustment, postReversal, postBankTransfer,
};
