'use strict';

/**
 * routeService.js — Razorpay Route per-booking split, hold, and release.
 *
 * MODEL (marketplace v4, post-Route go-live):
 *   At payment capture we create a Route transfer of the host's net payout to the
 *   host's LINKED ACCOUNT, put ON HOLD. Money settles host↔linked-account via
 *   Razorpay (a licensed PA) and NEVER touches a Book A Sloth account — that is
 *   what keeps this clear of the RBI payment-aggregator requirement. Book A Sloth
 *   only retains its own fee + commission + the TDS/TCS it withholds and remits.
 *
 *   The transfer is held INDEFINITELY at creation (on_hold=true, no on_hold_until);
 *   we release it OURSELVES via the releaseDueRoutePayouts cron once the service is
 *   completed AND the dispute window (ROUTE_HOLD_HOURS, default 48h) has passed and
 *   no refund/dispute is open. Controlling release (vs Razorpay's timer) handles
 *   reschedules, no-shows, and disputes correctly. A dispute before release →
 *   reverseTransfer → guest refunded, nothing clawed back from the host.
 *
 * DORMANT until BOTH: platform_settings.fee_only_mode = false AND the host has a
 * razorpay_route_account_id. While fee-only mode is on (the current state) every
 * function here is a guarded no-op — no Route call is ever made.
 *
 * ⚠️ SANDBOX-VERIFY BEFORE ENABLING. Razorpay Route is pending approval, so the
 * API calls below (payments.transfer / transfers.edit / transfers.reverse) are
 * written to the documented contract but have NOT been run against a live or
 * sandbox Route account. Validate the payloads, SDK method names, and response
 * shapes in the Razorpay dashboard sandbox before flipping fee_only_mode to false.
 * Refs: https://razorpay.com/docs/api/payments/route/create-transfers-payments/
 *       https://razorpay.com/docs/api/payments/route/modify-settlement-hold/
 *       https://razorpay.com/docs/api/payments/route/reverse-a-transfer/
 */

const { supabaseAdmin } = require('../config/supabase');
const platformConfig = require('./platformConfig');
const razorpayConfig = require('./razorpayConfig');
const { securityLog } = require('../utils/logger');

const ROUTE_HOLD_HOURS = Number(process.env.ROUTE_HOLD_HOURS) || 48;
const round2 = (n) => Math.round(Number(n) * 100) / 100;

// ─── Pure: the split ─────────────────────────────────────────────────────────
/**
 * What settles to the host's linked account vs what Book A Sloth retains.
 *   hostTransfer = vendor_amount  (host net: price − commission − PG − TDS − TCS)
 *   basRetained  = customerTotal − hostTransfer − razorpayFee
 *                = platform fee + commission + GST + TDS + TCS withheld
 * @returns {{ hostTransfer:number, hostTransferPaise:number, basRetained:number }}
 */
function computeRouteSplit({ customerTotal, vendorAmount, razorpayFee = 0 }) {
  const hostTransfer = round2(vendorAmount);
  const basRetained = round2(Number(customerTotal) - hostTransfer - Number(razorpayFee));
  return { hostTransfer, hostTransferPaise: Math.round(hostTransfer * 100), basRetained };
}

// ─── Pure: is a held payout due for release? ─────────────────────────────────
/**
 * A held Route payout is releasable once the service is completed and the dispute
 * window has elapsed, with no open refund/dispute.
 * @returns {boolean}
 */
function isReleaseDue({ completedAtMs, nowMs, holdHours = ROUTE_HOLD_HOURS, disputeOpen = false }) {
  if (disputeOpen) return false;
  if (!completedAtMs) return false;
  return completedAtMs + holdHours * 3600 * 1000 <= nowMs;
}

// ─── Guard: is Route active for this host? ───────────────────────────────────
async function routeActiveForHost(hostId) {
  const { feeOnlyMode } = await platformConfig.getConfig();
  if (feeOnlyMode) return { active: false, reason: 'fee_only_mode' };
  const { data: host } = await supabaseAdmin
    .from('profiles').select('razorpay_route_account_id').eq('id', hostId).single();
  const acct = host?.razorpay_route_account_id || null;
  if (!acct) return { active: false, reason: 'host_not_onboarded' };
  return { active: true, account: acct };
}

// ─── Create the held transfer at capture (non-fatal) ─────────────────────────
/**
 * Create a Route transfer of the host's net to their linked account, ON HOLD.
 * No-op (returns null) while fee-only mode is on or the host isn't onboarded.
 * NEVER throws to the caller — a Route failure must not break a captured payment;
 * it marks route_payout_status='failed' for the retry cron and logs.
 * @param {object} booking  row with id, host_id, razorpay_payment_id,
 *   vendor_amount, customer_total, razorpay_fee_actual, razorpay_tax_actual
 */
async function createHeldTransferForBooking(booking) {
  try {
    if (!booking?.id || !booking.host_id) return null;
    // Already has a transfer → idempotent skip.
    if (booking.route_transfer_id) return { skipped: 'already_transferred' };
    const gate = await routeActiveForHost(booking.host_id);
    if (!gate.active) return { skipped: gate.reason };

    const paymentId = booking.razorpay_payment_id;
    if (!paymentId) return { skipped: 'no_payment_id' };

    const razorpayFee = (Number(booking.razorpay_fee_actual) || 0) + (Number(booking.razorpay_tax_actual) || 0);
    const { hostTransferPaise } = computeRouteSplit({
      customerTotal: Number(booking.customer_total) || 0,
      vendorAmount: Number(booking.vendor_amount) || 0,
      razorpayFee,
    });
    if (hostTransferPaise < 100) return { skipped: 'below_min_transfer' }; // Route min ₹1

    const rzp = await razorpayConfig.getClient();
    // POST /v1/payments/:id/transfers — hold indefinitely; we release via cron.
    const resp = await rzp.payments.transfer(paymentId, {
      transfers: [{
        account: gate.account,
        amount: hostTransferPaise,
        currency: 'INR',
        on_hold: true,
        notes: { booking_id: booking.id, host_id: booking.host_id },
      }],
    });
    const transferId = resp?.items?.[0]?.id || resp?.id || null;

    await supabaseAdmin.from('bookings')
      .update({ route_transfer_id: transferId, route_payout_status: 'held', updated_at: new Date().toISOString() })
      .eq('id', booking.id);
    return { transferId, status: 'held' };
  } catch (err) {
    securityLog('route_transfer_create_failed', { booking_id: booking?.id, error: err?.message });
    try {
      await supabaseAdmin.from('bookings')
        .update({ route_payout_status: 'failed', updated_at: new Date().toISOString() })
        .eq('id', booking.id);
    } catch (_) { /* best-effort */ }
    return { error: err?.message };
  }
}

// ─── Release one held transfer (PATCH on_hold=false) ─────────────────────────
async function releaseTransfer(bookingId, transferId) {
  const rzp = await razorpayConfig.getClient();
  await rzp.transfers.edit(transferId, { on_hold: false }); // PATCH /v1/transfers/:id
  await supabaseAdmin.from('bookings')
    .update({ route_payout_status: 'released', settled_at: new Date().toISOString(), settlement_status: 'settled', updated_at: new Date().toISOString() })
    .eq('id', bookingId);
}

// ─── Reverse a held transfer (dispute/refund before release) ─────────────────
async function reverseTransfer(bookingId, transferId) {
  const rzp = await razorpayConfig.getClient();
  await rzp.transfers.reverse(transferId, {}); // full reversal — funds back to BAS balance
  await supabaseAdmin.from('bookings')
    .update({ route_payout_status: 'reversed', updated_at: new Date().toISOString() })
    .eq('id', bookingId);
}

// ─── Cron: release all held transfers whose window has elapsed ───────────────
/**
 * Mirror of referralService.releaseDue / autoCompleteBookings. Releases held Route
 * payouts for completed + paid bookings past the dispute window with no open
 * refund. Non-fatal per booking; returns a summary.
 */
async function releaseDueRoutePayouts(nowMs = Date.now()) {
  const { feeOnlyMode } = await platformConfig.getConfig();
  if (feeOnlyMode) return { skipped: 'fee_only_mode', released: 0 };

  const cutoffIso = new Date(nowMs - ROUTE_HOLD_HOURS * 3600 * 1000).toISOString();
  const { data: due, error } = await supabaseAdmin
    .from('bookings')
    .select('id, route_transfer_id, completed_at, payment_status, status')
    .eq('route_payout_status', 'held')
    .eq('status', 'completed')
    .eq('payment_status', 'paid')
    .lte('completed_at', cutoffIso)
    .limit(500);
  if (error) { securityLog('route_release_query_failed', { error: error.message }); return { error: error.message, released: 0 }; }

  let released = 0, failed = 0;
  for (const b of due || []) {
    if (!b.route_transfer_id) continue;
    try { await releaseTransfer(b.id, b.route_transfer_id); released++; }
    catch (err) { failed++; securityLog('route_release_failed', { booking_id: b.id, error: err?.message }); }
  }
  return { released, failed, considered: (due || []).length };
}

module.exports = {
  ROUTE_HOLD_HOURS,
  computeRouteSplit,
  isReleaseDue,
  routeActiveForHost,
  createHeldTransferForBooking,
  releaseTransfer,
  reverseTransfer,
  releaseDueRoutePayouts,
};
