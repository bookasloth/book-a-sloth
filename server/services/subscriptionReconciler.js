/**
 * subscriptionReconciler.js — safety net for missed subscription webhooks.
 *
 * Scans vendors stuck in 'pending' (mandate authorized but activation webhook
 * never arrived) and reconciles their state against the live Razorpay
 * subscription. Idempotent via subscriptionService — mirrors the ledger
 * reconciler pattern. Wired to a setInterval in server.js.
 */
'use strict';

const { supabaseAdmin } = require('../config/supabase');
const razorpaySubscriptions = require('./razorpaySubscriptions');
const subscriptionService = require('./subscriptionService');

async function reconcile() {
  const { data: pending } = await supabaseAdmin
    .from('profiles')
    .select('id, razorpay_subscription_id')
    .eq('subscription_status', 'pending')
    .not('razorpay_subscription_id', 'is', null)
    .limit(100);

  let healed = 0;
  for (const p of pending || []) {
    try {
      const rzpSub = await razorpaySubscriptions.fetchSubscription(p.razorpay_subscription_id);
      if (subscriptionService.ACTIVE_STATES.includes(rzpSub.status)) {
        const r = await subscriptionService.activateFromSubscription({ rzpSub });
        if (r.activated) healed++;
      } else if (rzpSub.status === 'halted') {
        await subscriptionService.markHalted(rzpSub);
      } else if (['cancelled', 'expired', 'completed'].includes(rzpSub.status)) {
        await subscriptionService.markCancelled(rzpSub);
      }
    } catch (e) {
      console.error('subscription reconcile error', p.id, e.message);
    }
  }
  return { healed };
}

module.exports = { reconcile };
