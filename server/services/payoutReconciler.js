/**
 * payoutReconciler.js — the safety net the host payout rail never had.
 *
 * The automatic Route payout (routeAutoPayoutService) is a single fire-and-forget
 * attempt at booking capture. If it was skipped (host not yet onboarded / not
 * activated), failed, or the transfer got stuck 'pending' after a missed
 * transfer.processed webhook, nothing ever heals it — the host is simply never
 * paid. This cron periodically:
 *
 *   1. CREATE  — finds paid bookings that owe the host money but have no transfer,
 *                and (for payout-ELIGIBLE hosts only) creates the held transfer.
 *                Covers KYC-after-payment, go-live backfill, and transient failures.
 *   2. FINALIZE — finds held transfers past their hold whose completion webhook was
 *                missed, asks Razorpay their real status, and finalizes (posts the
 *                SETTLEMENT ledger entry + flips to processed) the ones now paid.
 *   3. ALERT   — if money is owed to hosts who CAN'T be paid (activation stuck, no
 *                account, KYC), or attempts are exhausted, emails the founder. This
 *                is the "pipeline is broken" signal.
 *
 * Mode (platform_settings.payout_reconciler_mode, via platformConfig):
 *   'off'     dormant — does nothing.
 *   'observe' scans + ALERTS, but moves NO money (read-only). Default.
 *   'live'    also creates/retries/finalizes transfers.
 *
 * Safety: money movement only in 'live'; per-booking creation is idempotent
 * (routeAutoPayoutService skips a booking that already has a transfer) and gated by
 * isPayoutEligible so we never attempt a doomed transfer to an unactivated account;
 * retries are capped (transfer_attempts) so a permanently-failing booking is alerted,
 * not hammered. Schema-fallback on the v3.116 columns. Never throws to the cron.
 */
'use strict';

const { supabaseAdmin } = require('../config/supabase');
const razorpayConfig = require('./razorpayConfig');
const platformConfig = require('./platformConfig');
const { isPayoutEligible } = require('./payoutEligibility');
const { createHeldTransferForBooking, finalizeReleasedTransfer } = require('./routeAutoPayoutService');
const { adminAlert } = require('../utils/adminAlert');
const { securityLog } = require('../utils/logger');

const MIN_TRANSFER_RUPEES = 1;                                    // mirrors routeAutoPayoutService
const MAX_ATTEMPTS = Number(process.env.PAYOUT_RECONCILE_MAX_ATTEMPTS || 5);
const SCAN_LIMIT = Number(process.env.PAYOUT_RECONCILE_LIMIT || 300);
const SKIP_SETTLE = new Set(['cancelled', 'not_eligible']);

const isMissingColumn = (err) => {
  const msg = (err?.message || err?.details || '').toLowerCase();
  return err?.code === '42703' || /column .* does not exist|could not find the .* column/.test(msg);
};

// Record a transfer attempt (retry cap + backoff). Swallows a missing-column error
// (v3.116 not applied yet) so the reconciler still works, just without the cap.
async function bumpAttempt(bookingId, current) {
  const { error } = await supabaseAdmin
    .from('bookings')
    .update({ transfer_attempts: (Number(current) || 0) + 1, transfer_last_attempt_at: new Date().toISOString() })
    .eq('id', bookingId);
  if (error && !isMissingColumn(error)) throw error;
}

/**
 * @returns {Promise<{mode, created, finalized, failedAttempt, blocked, owedBlocked,
 *   owedBlockedSum, candidates, stuck, skipped?}>}
 */
async function reconcile() {
  const { payoutReconcilerMode: mode } = await platformConfig.getConfig();
  if (mode === 'off') return { skipped: 'off', mode };
  const live = mode === 'live';

  const s = {
    mode, created: 0, finalized: 0, failedAttempt: 0,
    blocked: 0, owedBlocked: 0, owedBlockedSum: 0, candidates: 0, stuck: 0,
  };
  const reasonCounts = {};

  // ---- 1. Bookings owed money with no transfer yet (never attempted OR failed) ----
  const { data: owed, error: owedErr } = await supabaseAdmin
    .from('bookings')
    .select('id, host_id, scheduled_at, service_id, razorpay_payment_id, vendor_amount, settlement_status, transfer_status, transfer_attempts, services(duration)')
    .eq('payment_status', 'paid')
    .is('razorpay_transfer_id', null)
    .limit(SCAN_LIMIT);
  if (owedErr) throw new Error(`payoutReconciler: owed query failed: ${owedErr.message}`);

  const eligByHost = new Map();
  for (const b of owed || []) {
    const amt = Number(b.vendor_amount) || 0;
    if (amt < MIN_TRANSFER_RUPEES) continue;                 // below Razorpay's ₹1 reversal floor
    if (SKIP_SETTLE.has(b.settlement_status)) continue;      // cancelled / not eligible
    if ((Number(b.transfer_attempts) || 0) >= MAX_ATTEMPTS) { s.blocked++; continue; }
    if (!b.razorpay_payment_id) continue;                    // can't create a payment-linked transfer without it
    s.candidates++;

    let elig = eligByHost.get(b.host_id);
    if (!elig) { elig = await isPayoutEligible(b.host_id); eligByHost.set(b.host_id, elig); }
    if (!elig.eligible) {
      s.owedBlocked++; s.owedBlockedSum += amt;
      for (const r of elig.reasons) reasonCounts[r] = (reasonCounts[r] || 0) + 1;
      continue;                                              // can't pay — surfaced in the alert
    }

    if (!live) continue;                                     // observe: count only, move nothing
    try {
      await bumpAttempt(b.id, b.transfer_attempts);
      const r = await createHeldTransferForBooking(b, { paymentId: b.razorpay_payment_id, vendorAmount: amt });
      if (r.ok && r.transferId) s.created++;
      else s.failedAttempt++;                                // service recorded transfer_status='failed'
    } catch (e) {
      s.failedAttempt++;
      securityLog('payout_reconcile_create_error', { bookingId: b.id, reason: e.message });
    }
  }

  // ---- 2. Held transfers past their hold whose completion webhook was missed ----
  const { data: stuck, error: stuckErr } = await supabaseAdmin
    .from('bookings')
    .select('id, host_id, vendor_amount, razorpay_transfer_id, transfer_status, transfer_hold_until')
    .eq('transfer_status', 'pending')
    .not('razorpay_transfer_id', 'is', null)
    .lt('transfer_hold_until', new Date().toISOString())
    .limit(SCAN_LIMIT);
  if (stuckErr && !isMissingColumn(stuckErr)) throw new Error(`payoutReconciler: stuck query failed: ${stuckErr.message}`);
  s.stuck = (stuck || []).length;

  if (live && stuck && stuck.length) {
    let rz = null;
    try { rz = await razorpayConfig.getClient(); } catch (e) { securityLog('payout_reconcile_no_client', { reason: e.message }); }
    for (const b of rz ? stuck : []) {
      try {
        const t = await rz.transfers.fetch(b.razorpay_transfer_id);   // read-only
        if (t?.status === 'processed') { await finalizeReleasedTransfer(b, null); s.finalized++; }
        else if (t?.status === 'failed' || t?.status === 'reversed') {
          await supabaseAdmin.from('bookings')
            .update({ transfer_status: t.status, transfer_error: t.error?.description || t.status, updated_at: new Date().toISOString() })
            .eq('id', b.id);
        }
      } catch (e) {
        securityLog('payout_reconcile_stuck_error', { bookingId: b.id, reason: e.message });
      }
    }
  }

  // ---- 3. Alert if money is owed that we cannot pay ----
  if (s.owedBlocked > 0 || s.blocked > 0) {
    const reasonStr = Object.entries(reasonCounts).map(([k, v]) => `${k}=${v}`).join(', ') || 'n/a';
    adminAlert({
      subject: `Payouts blocked — ₹${s.owedBlockedSum.toFixed(2)} owed to hosts can't be paid`,
      lines: [
        `The payout reconciler (${mode}) found host money it could not pay out.`,
        `Blocked bookings: ${s.owedBlocked}`,
        `Amount owed (blocked): ₹${s.owedBlockedSum.toFixed(2)}`,
        `Reasons: ${reasonStr}`,
        `Retry-capped bookings: ${s.blocked}`,
        `Fix: resolve Razorpay Route activation (needs_clarification) for the affected linked accounts, then this clears automatically.`,
      ],
      key: 'payout_reconcile_blocked',
      category: 'Payment Receipt',
      link: '/admin/payouts',
    }).catch(() => { /* adminAlert never throws; ignore */ });
  }

  return s;
}

module.exports = { reconcile };
