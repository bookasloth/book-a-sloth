/**
 * settlementService.js — vendor settlement balance (Financial Ledger P2).
 *
 * Single source of truth for a vendor's withdrawable balance. Withdrawable
 * money is gated on service COMPLETION plus a clearing window:
 *   pending_completion -> clearing (completed, in window) -> available (matured)
 * Cancelled / not_eligible bookings are excluded. The P1 ledger remains the
 * accounting record (Vendor Payables credited at payment); this derives
 * eligibility from bookings, which is authoritative for what is truly owed
 * (a cancelled paid booking still credits the ledger until P3 refunds reverse it).
 */
'use strict';

const { supabaseAdmin } = require('../config/supabase');

const round2 = (n) => Math.round((Number(n) || 0) * 100) / 100;

/**
 * @param {string} hostId
 * @param {number} clearingDays  days after completion before money matures
 * @param {number} [nowMs]       injectable clock for tests
 * // lifetimeEarned is GROSS eligible+pending (sum of non-cancelled booking amounts); it is NOT net of payouts.
 * @returns {Promise<{available:number, clearing:number, pendingCompletion:number,
 *                     inflight:number, paidOut:number, lifetimeEarned:number}>}
 */
async function computeSettlementBalance(hostId, clearingDays, nowMs = Date.now()) {
  const cutoff = nowMs - (Number(clearingDays) || 0) * 86400000;

  const { data: bookings, error: bErr } = await supabaseAdmin
    .from('bookings')
    .select('vendor_amount, settlement_status, completed_at, payment_status')
    .eq('host_id', hostId);
  if (bErr) throw new Error(`settlementService: bookings query failed: ${bErr.message}`);

  let matured = 0, clearing = 0, pendingCompletion = 0;
  for (const b of bookings || []) {
    const amt = Number(b.vendor_amount) || 0;
    const ss = b.settlement_status;
    if (ss === 'cancelled' || ss === 'not_eligible') continue;
    if (ss === 'eligible_for_settlement' && b.completed_at) {
      const completedMs = new Date(b.completed_at).getTime();
      if (Number.isFinite(completedMs) && completedMs <= cutoff) matured += amt;
      else clearing += amt;
    } else if (b.payment_status === 'paid' && ss === 'pending_completion') {
      pendingCompletion += amt;
    }
  }

  const { data: payouts, error: pErr } = await supabaseAdmin
    .from('payout_requests')
    .select('amount, status')
    .eq('host_id', hostId);
  if (pErr) throw new Error(`settlementService: payout_requests query failed: ${pErr.message}`);

  let claimed = 0, inflight = 0, paidOut = 0;
  for (const p of payouts || []) {
    const amt = Number(p.amount) || 0;
    if (p.status === 'paid') { claimed += amt; paidOut += amt; }
    else if (p.status === 'approved' || p.status === 'pending') { claimed += amt; inflight += amt; }
  }

  const available = Math.max(0, matured - claimed);
  return {
    available: round2(available),
    clearing: round2(clearing),
    pendingCompletion: round2(pendingCompletion),
    inflight: round2(inflight),
    paidOut: round2(paidOut),
    lifetimeEarned: round2(matured + clearing + pendingCompletion),
  };
}

module.exports = { computeSettlementBalance };
