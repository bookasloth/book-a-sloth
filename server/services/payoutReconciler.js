/**
 * payoutReconciler.js — the safety net the host payout rail never had.
 *
 * The automatic Route payout (routeAutoPayoutService) is a single fire-and-forget
 * attempt at booking capture. If it was skipped (host not yet onboarded / not
 * activated), failed, or the transfer got stuck 'pending' after a missed
 * transfer.processed webhook, nothing ever heals it — the host is simply never
 * paid. This cron periodically:
 *
 *   0. REFRESH  — re-reads Razorpay Route product activation for hosts whose
 *                 account is not yet 'activated', so a needs_clarification →
 *                 activated transition is picked up (the code writes activation at
 *                 onboarding and otherwise never re-reads it — so without this a
 *                 host stays payout-ineligible forever even after Razorpay approves).
 *   1. CREATE   — finds paid bookings that owe the host money but have no transfer,
 *                 and (for payout-ELIGIBLE hosts only) creates the held transfer.
 *                 Covers KYC-after-payment, go-live backfill, transient failures.
 *   2. FINALIZE — finds held transfers past their hold whose completion webhook was
 *                 missed, asks Razorpay their real status, and finalizes the ones now
 *                 paid (posts the SETTLEMENT ledger entry + flips to processed). A
 *                 CANCELLED booking is never finalized — if its transfer released
 *                 anyway it's flagged for manual clawback.
 *   3. ALERT    — if money is owed to hosts who CAN'T be paid (activation stuck, no
 *                 account, KYC), attempts are exhausted, or a clawback is needed,
 *                 emails the founder. This is the "pipeline is broken" signal.
 *
 * Mode (platform_settings.payout_reconciler_mode, via platformConfig):
 *   'off'     dormant — does nothing.
 *   'observe' scans + REFRESHES activation + ALERTS, but moves NO money. Default.
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
 * Step 0 — re-read Route product activation from Razorpay for accounts not yet
 * 'activated' and persist any change. Read-only against our money (only updates a
 * status column), so it runs in 'observe' too. Returns how many newly activated.
 */
async function refreshActivations(rz) {
  if (!rz) return { refreshed: 0, activated: 0 };
  const { data: rows, error } = await supabaseAdmin
    .from('kyc_submissions')
    .select('id, razorpay_account_id, razorpay_product_id, route_activation_status')
    .not('razorpay_account_id', 'is', null)
    .not('razorpay_product_id', 'is', null)
    .limit(100);
  if (error) { if (!isMissingColumn(error)) securityLog('payout_reconcile_activation_query', { reason: error.message }); return { refreshed: 0, activated: 0 }; }

  let refreshed = 0, activated = 0;
  for (const r of (rows || []).filter((x) => x.route_activation_status !== 'activated')) {
    try {
      const prod = await rz.products.fetch(r.razorpay_account_id, r.razorpay_product_id); // read-only
      const status = prod?.activation_status;
      if (status && status !== r.route_activation_status) {
        await supabaseAdmin.from('kyc_submissions')
          .update({ route_activation_status: status, route_synced_at: new Date().toISOString() })
          .eq('id', r.id);
        refreshed++;
        if (status === 'activated') activated++;
      }
    } catch (e) {
      securityLog('payout_reconcile_activation_error', { kycId: r.id, reason: e.message });
    }
  }
  return { refreshed, activated };
}

/**
 * @returns {Promise<object>} run summary
 */
async function reconcile() {
  const { payoutReconcilerMode: mode } = await platformConfig.getConfig();
  if (mode === 'off') return { skipped: 'off', mode };
  const live = mode === 'live';

  const s = {
    mode, refreshed: 0, activated: 0, created: 0, finalized: 0, failedAttempt: 0,
    blocked: 0, owedBlocked: 0, owedBlockedSum: 0, candidates: 0, stuck: 0, clawbackNeeded: 0,
  };
  const reasonCounts = {};

  // A single Razorpay client for activation refresh + finalize (best-effort).
  let rz = null;
  try { rz = await razorpayConfig.getClient(); } catch (e) { securityLog('payout_reconcile_no_client', { reason: e.message }); }

  // ---- 0. Refresh Route activation so eligibility unblocks itself ----
  const act = await refreshActivations(rz);
  s.refreshed = act.refreshed; s.activated = act.activated;

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
    .select('id, host_id, vendor_amount, razorpay_transfer_id, transfer_status, transfer_hold_until, settlement_status')
    .eq('transfer_status', 'pending')
    .not('razorpay_transfer_id', 'is', null)
    .lt('transfer_hold_until', new Date().toISOString())
    .limit(SCAN_LIMIT);
  if (stuckErr && !isMissingColumn(stuckErr)) throw new Error(`payoutReconciler: stuck query failed: ${stuckErr.message}`);
  s.stuck = (stuck || []).length;

  if (live && rz && stuck && stuck.length) {
    for (const b of stuck) {
      try {
        const t = await rz.transfers.fetch(b.razorpay_transfer_id);   // read-only
        const cancelled = SKIP_SETTLE.has(b.settlement_status);
        if (t?.status === 'processed') {
          if (cancelled) {
            // The transfer released (Razorpay auto-release) on a CANCELLED booking —
            // the host was paid money they shouldn't keep. Never post a SETTLEMENT for
            // it; flag for manual clawback (reversal window is likely closed).
            s.clawbackNeeded++;
            securityLog('payout_reconcile_clawback_needed', { bookingId: b.id, transferId: b.razorpay_transfer_id });
          } else {
            await finalizeReleasedTransfer(b, null); s.finalized++;
          }
        } else if (t?.status === 'failed' || t?.status === 'reversed') {
          await supabaseAdmin.from('bookings')
            .update({ transfer_status: t.status, transfer_error: t.error?.description || t.status, updated_at: new Date().toISOString() })
            .eq('id', b.id);
        }
      } catch (e) {
        securityLog('payout_reconcile_stuck_error', { bookingId: b.id, reason: e.message });
      }
    }
  }

  // ---- 3. Alert if money is owed that we cannot pay, or a clawback is needed ----
  if (s.owedBlocked > 0 || s.blocked > 0 || s.clawbackNeeded > 0) {
    const reasonStr = Object.entries(reasonCounts).map(([k, v]) => `${k}=${v}`).join(', ') || 'n/a';
    adminAlert({
      subject: `Payouts need attention — ₹${s.owedBlockedSum.toFixed(2)} owed can't be paid`,
      lines: [
        `The payout reconciler (${mode}) found host money it could not pay out.`,
        `Blocked bookings: ${s.owedBlocked}`,
        `Amount owed (blocked): ₹${s.owedBlockedSum.toFixed(2)}`,
        `Reasons: ${reasonStr}`,
        `Retry-capped bookings: ${s.blocked}`,
        `Clawbacks needed (paid on a cancelled booking): ${s.clawbackNeeded}`,
        `Fix: resolve Razorpay Route activation (needs_clarification) for the affected linked accounts — this clears automatically once they are 'activated'.`,
      ],
      key: 'payout_reconcile_blocked',
      category: 'Payment Receipt',
      link: '/admin/payouts',
    }).catch(() => { /* adminAlert never throws; ignore */ });
  }

  return s;
}

module.exports = { reconcile, refreshActivations };
