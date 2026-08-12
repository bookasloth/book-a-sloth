/**
 * routeAutoPayoutService.js — Razorpay Route Phase 2: automatic host payout.
 *
 * On booking capture we create a payment-linked HELD transfer of the host's
 * vendor_amount to their Route linked account, held until the service is over + a
 * buffer. It is later RELEASED (customer marks complete → instant, or Razorpay
 * auto-releases at on_hold_until) or REVERSED (refund / cancel / dispute). This
 * file owns creating the held transfer; release/reversal live in later slices.
 *
 * Guardrails:
 *   • DORMANT while fee_only_mode is true (the safe default). No transfer created.
 *   • Only fires when the host has an ACTIVATED linked account; otherwise the money
 *     stays owed (tracked via bookings.vendor_amount) and the host is nudged to
 *     finish KYC — nothing is lost.
 *   • Idempotent — a booking that already has a transfer id is skipped.
 *   • Never throws to its caller — the capture hook is fire-and-forget; a transfer
 *     failure must never break (or delay) payment finalisation.
 *   • Schema-fallback — the v3.99 columns may not be applied yet; a missing column
 *     degrades to a logged no-op on the bookkeeping write, never a crash.
 */
'use strict';

const razorpayConfig = require('./razorpayConfig');
const platformConfig = require('./platformConfig');
const { supabaseAdmin } = require('../config/supabase');
const { securityLog } = require('../utils/logger');

const toPaise = (rupees) => Math.round(Number(rupees) * 100);
const HOLD_BUFFER_MS = 24 * 60 * 60 * 1000; // +24h after the service ends

const isMissingColumn = (err) => {
  const msg = (err?.message || err?.details || '').toLowerCase();
  return err?.code === '42703' || /column .* does not exist|could not find the .* column/.test(msg);
};

// The host's activated Route linked account id (set by routeAccountService onboarding).
async function getLinkedAccountId(hostId) {
  const { data } = await supabaseAdmin
    .from('kyc_submissions').select('razorpay_account_id').eq('user_id', hostId).maybeSingle();
  return data?.razorpay_account_id || null;
}

// Unix seconds at which Razorpay auto-releases the hold: service end + 24h,
// never in the past (Razorpay rejects a non-future on_hold_until).
async function computeHoldUntil(booking) {
  const startMs = new Date(booking.scheduled_at).getTime();
  let durationMin = Number(booking.services?.duration);
  if (!Number.isFinite(durationMin)) {
    const { data: svc } = await supabaseAdmin
      .from('services').select('duration').eq('id', booking.service_id).maybeSingle();
    durationMin = Number(svc?.duration) || 0;
  }
  const endMs = (Number.isFinite(startMs) ? startMs : Date.now()) + durationMin * 60000;
  const holdMs = Math.max(endMs + HOLD_BUFFER_MS, Date.now() + 60 * 60 * 1000); // ≥ +1h
  return Math.floor(holdMs / 1000);
}

// Patch the booking's transfer bookkeeping, swallowing a missing-column error.
async function patchBooking(bookingId, patch) {
  const { error } = await supabaseAdmin
    .from('bookings').update({ ...patch, updated_at: new Date().toISOString() }).eq('id', bookingId);
  if (error) {
    if (isMissingColumn(error)) { securityLog('route_auto_payout_schema_fallback', { bookingId }); return; }
    throw error;
  }
}

/**
 * Create a held Route transfer for a freshly-captured booking.
 * @param {object} booking  the captured booking row (needs id, host_id, scheduled_at, service_id).
 * @param {object} opts     { paymentId, vendorAmount }
 * @returns {Promise<{ ok, transferId?, status?, onHoldUntil?, skipped?, error? }>}
 */
async function createHeldTransferForBooking(booking, { paymentId, vendorAmount } = {}) {
  try {
    if (!booking?.id) return { ok: false, skipped: 'no_booking' };
    if (booking.razorpay_transfer_id) return { ok: true, transferId: booking.razorpay_transfer_id, skipped: 'already_transferred' };
    const amount = Number(vendorAmount);
    if (!(amount > 0)) return { ok: false, skipped: 'no_payout_due' };
    if (!paymentId) return { ok: false, skipped: 'no_payment_id' };

    const { feeOnlyMode } = await platformConfig.getConfig();
    if (feeOnlyMode) return { ok: false, skipped: 'fee_only_mode' };
    if (!(await razorpayConfig.isConfigured())) return { ok: false, skipped: 'razorpay_unconfigured' };

    // No linked account → money stays owed (host nudged to finish KYC). Not an error.
    const account = await getLinkedAccountId(booking.host_id);
    if (!account) return { ok: false, skipped: 'no_linked_account' };

    const onHoldUntil = await computeHoldUntil(booking);
    const razorpay = await razorpayConfig.getClient();
    const result = await razorpay.payments.transfer(paymentId, {
      transfers: [{
        account, amount: toPaise(amount), currency: 'INR',
        on_hold: true, on_hold_until: onHoldUntil,
        notes: { booking_id: String(booking.id), host_id: String(booking.host_id) },
      }],
    });
    const t = result?.items?.[0] || result;
    const transferId = t?.id;
    if (!transferId) throw new Error('Razorpay transfer returned no id');

    await patchBooking(booking.id, {
      razorpay_transfer_id: transferId,
      transfer_status: t?.status || 'pending',
      transfer_error: null,
      transfer_hold_until: new Date(onHoldUntil * 1000).toISOString(),
    });
    return { ok: true, transferId, status: t?.status || 'pending', onHoldUntil };
  } catch (err) {
    const reason = err?.error?.description || err?.message || 'unknown error';
    securityLog('route_auto_payout_error', { bookingId: booking?.id, reason });
    try { await patchBooking(booking.id, { transfer_status: 'failed', transfer_error: reason.slice(0, 500) }); } catch (_) { /* logged */ }
    return { ok: false, error: reason };
  }
}

module.exports = { createHeldTransferForBooking, computeHoldUntil, toPaise };
