/**
 * subscriptionReconciler.js — safety net + cleanup for pending subscriptions.
 *
 * Scans vendors stuck in 'pending' (mandate authorized but activation webhook
 * never arrived) and reconciles their state against the live Razorpay
 * subscription. Idempotent via subscriptionService — mirrors the ledger
 * reconciler pattern. Wired to a setInterval in server.js.
 *
 * Also RELEASES orphaned pending mandates so they don't poll forever:
 *   • the subscription never authorized within the grace window (abandoned
 *     checkout) → cancel the dangling mandate + free the vendor to retry;
 *   • Razorpay can't find the subscription at all (minted against a plan id
 *     from a since-rotated key/mode) → release without a cancel call.
 * "Pending age" is read from profiles.updated_at — a stuck pending row isn't
 * touched after creation, so updated_at is a reliable proxy and needs no new
 * column (schema-fallback discipline).
 */
'use strict';

const { supabaseAdmin } = require('../config/supabase');
const razorpaySubscriptions = require('./razorpaySubscriptions');
const subscriptionService = require('./subscriptionService');

// How long a mandate may sit un-authorized before it's treated as abandoned.
// UPI AutoPay authorization completes within minutes, so an hour is generous.
const PENDING_TTL_MIN = Number(process.env.SUBSCRIPTION_PENDING_TTL_MIN || 60);
const PRE_AUTH_STATES = ['created', 'authenticated', 'pending'];

// Razorpay's "this id doesn't exist under this account" signal. Matched
// conservatively so transient/auth/network errors never release a live mandate.
const isNotFound = (e) => {
  const desc = (e?.error?.description || e?.message || '').toLowerCase();
  return /does not exist|not found|no such|the id provided/.test(desc);
};

/**
 * Move an orphaned pending profile out of 'pending' so the vendor can retry,
 * optionally cancelling the dangling Razorpay mandate first. Any access already
 * granted (e.g. switch credit) is retained via plan_expires_at — this mirrors
 * subscriptionService.markCancelled.
 */
async function releaseOrphan(profileId, subId, { cancel }) {
  if (cancel && subId) {
    try {
      await razorpaySubscriptions.cancelSubscription(subId, false);
    } catch (e) {
      const msg = e?.error?.description || e?.message || '';
      if (!isNotFound(e) && !/already cancelled|already canceled|completed/i.test(msg)) {
        console.error('releaseOrphan: cancel failed', subId, msg);
      }
    }
  }
  await supabaseAdmin.from('profiles').update({
    subscription_status: 'cancelled',
    razorpay_subscription_id: null,
    updated_at: new Date().toISOString(),
  }).eq('id', profileId);
}

async function reconcile() {
  const { data: pending } = await supabaseAdmin
    .from('profiles')
    .select('id, razorpay_subscription_id, updated_at')
    .eq('subscription_status', 'pending')
    .not('razorpay_subscription_id', 'is', null)
    .limit(100);

  const ttlMs = PENDING_TTL_MIN * 60 * 1000;
  const now = Date.now();
  let healed = 0, released = 0;

  for (const p of pending || []) {
    const ageMs = now - new Date(p.updated_at || now).getTime();
    try {
      const rzpSub = await razorpaySubscriptions.fetchSubscription(p.razorpay_subscription_id);
      if (subscriptionService.ACTIVE_STATES.includes(rzpSub.status)) {
        const r = await subscriptionService.activateFromSubscription({ rzpSub });
        if (r.activated) healed++;
      } else if (rzpSub.status === 'halted') {
        await subscriptionService.markHalted(rzpSub);
      } else if (['cancelled', 'expired', 'completed'].includes(rzpSub.status)) {
        await subscriptionService.markCancelled(rzpSub);
      } else if (PRE_AUTH_STATES.includes(rzpSub.status) && ageMs > ttlMs) {
        // Mandate never authorized within the grace window → abandoned. Cancel
        // the dangling mandate and free the vendor to retry.
        await releaseOrphan(p.id, p.razorpay_subscription_id, { cancel: true });
        released++;
      }
      // else: still inside the grace window → leave pending for a later pass.
    } catch (e) {
      // A subscription Razorpay can't find (minted under a since-rotated key /
      // different mode) will never reconcile — release it instead of erroring
      // every pass forever. Other errors are transient: log and retry next pass.
      if (isNotFound(e)) {
        await releaseOrphan(p.id, p.razorpay_subscription_id, { cancel: false });
        released++;
      } else {
        console.error('subscription reconcile error', p.id, e.message);
      }
    }
  }
  return { healed, released };
}

module.exports = { reconcile };
