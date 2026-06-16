/**
 * subscriptionService.js — activation / renewal / lifecycle for auto-renewing
 * vendor subscriptions. Called by the Razorpay webhook (source of truth), the
 * on-return sync endpoint, and the reconciler cron. All entry points are
 * idempotent on razorpay_payment_id so layered delivery never double-charges.
 */
'use strict';

const { supabaseAdmin } = require('../config/supabase');
const planService = require('./planService');
const platformConfig = require('./platformConfig');
const NotificationEngine = require('./notificationEngine');
const { computeSubscriptionBreakdown } = require('../lib/pricingEngine');
const { normCadence } = require('../lib/subscriptionPricing');

const unixToIso = (sec) => (sec ? new Date(Number(sec) * 1000).toISOString() : null);
const ACTIVE_STATES = ['active', 'authenticated'];

/**
 * Activate or renew a vendor's plan from a Razorpay subscription (+ optional
 * payment entity). Idempotent. Grants access on every active sub; records a
 * payment row + ledger entry only when a payment entity is present (a charge).
 *
 * @param {object} p
 * @param {object} p.rzpSub       Razorpay subscription entity (notes, current_end, id)
 * @param {object} [p.rzpPayment] Razorpay payment entity (charges only)
 * @returns {Promise<{activated:boolean, reason?:string}>}
 */
async function activateFromSubscription({ rzpSub, rzpPayment = null }) {
  const notes = rzpSub?.notes || {};
  const vendorId = notes.vendor_id;
  const planSlug = planService.normalizeSlug(notes.plan);
  const cadence = normCadence(notes.cadence) || 'monthly';
  if (!vendorId || !notes.plan) return { activated: false, reason: 'missing subscription notes' };

  const paymentId = rzpPayment?.id || null;

  // Idempotency: a recorded payment means this charge already posted.
  if (paymentId) {
    const { data: prior } = await supabaseAdmin
      .from('subscription_payments').select('id').eq('razorpay_payment_id', paymentId).maybeSingle();
    if (prior) return { activated: false, reason: 'payment already processed' };
  }

  const plan = await planService.getPlan(planSlug);
  const { gstRate } = await platformConfig.getConfig();
  const planPrice = cadence === 'monthly' ? Number(plan.monthly_price) || 0 : Number(plan.annual_price) || 0;
  const breakdown = computeSubscriptionBreakdown({ planPrice, gstRate });

  let periodEndIso = unixToIso(rzpSub.current_end) ||
    new Date(Date.now() + (cadence === 'monthly' ? 30 : 365) * 24 * 3600 * 1000).toISOString();
  const periodStartIso = unixToIso(rzpSub.current_start) || new Date().toISOString();
  const nowIso = new Date().toISOString();

  // Never shrink access below what's already granted — a switch grants free
  // days up-front (deferred start_at), and the activation webhook must not claw
  // that back when Razorpay reports the first paid cycle's (earlier) end.
  const { data: existing } = await supabaseAdmin
    .from('profiles').select('plan_expires_at').eq('id', vendorId).maybeSingle();
  if (existing?.plan_expires_at && new Date(existing.plan_expires_at) > new Date(periodEndIso)) {
    periodEndIso = existing.plan_expires_at;
  }

  // First charge for this subscription → initial; later charges → renewal.
  const { count: priorCount } = await supabaseAdmin
    .from('subscription_payments').select('id', { count: 'exact', head: true })
    .eq('razorpay_subscription_id', rzpSub.id);
  const kind = (priorCount || 0) === 0 ? 'initial' : 'renewal';

  // Grant / extend access (idempotent — safe to repeat).
  await supabaseAdmin.from('profiles').update({
    plan: planSlug,
    billing_cadence: cadence,
    subscription_status: 'active',
    razorpay_subscription_id: rzpSub.id,
    current_period_end: periodEndIso,
    plan_expires_at: periodEndIso,
    plan_updated_at: nowIso,
    plan_activated_at: nowIso,
    updated_at: nowIso,
  }).eq('id', vendorId);

  // Record the charge + ledger entry (only when a payment entity is present).
  if (paymentId) {
    // Gateway fee+tax — PLATFORM-borne for subscriptions (PRD §5.3).
    let feeTotal = 0, tax = 0;
    try {
      const razorpay = await require('./razorpaySubscriptions').getClient();
      const pmt = await razorpay.payments.fetch(paymentId);
      if (pmt?.fee != null) feeTotal = Number(pmt.fee) / 100;
      if (pmt?.tax != null) tax = Number(pmt.tax) / 100;
    } catch (e) { console.error('subscription fee fetch failed (recorded 0):', e.message); }
    tax = Math.min(tax, feeTotal);
    const feeExcl = Math.max(0, Math.round((feeTotal - tax) * 100) / 100);

    const { data: subPayment, error: subErr } = await supabaseAdmin
      .from('subscription_payments').insert({
        vendor_id: vendorId, plan_type: planSlug,
        plan_price: breakdown.planPrice, gst_amount: breakdown.gstAmount, total_charged: breakdown.totalCharged,
        razorpay_fee: feeExcl, razorpay_tax: tax,
        razorpay_payment_id: paymentId, razorpay_order_id: rzpPayment?.order_id || null,
        razorpay_subscription_id: rzpSub.id, billing_cadence: cadence, kind,
        paid_at: nowIso, revenue_recognized_at: nowIso,
        billing_period_start: periodStartIso.slice(0, 10),
        billing_period_end: periodEndIso.slice(0, 10),
        status: 'paid',
      }).select().single();

    if (subErr) {
      if (subErr.code === '23505' || /duplicate key|unique constraint/i.test(subErr.message || '')) {
        return { activated: true, reason: 'duplicate payment (raced)' };
      }
      console.error('subscription_payments insert failed:', subErr.message);
    } else {
      try {
        const { subscriptionPaymentEntry } = require('./ledger/journalTemplates');
        const { postSafe } = require('./ledger/postingService');
        await postSafe({
          sourceType: 'SUBSCRIPTION_PAYMENT', sourceId: subPayment.id,
          journalDate: nowIso.slice(0, 10), template: subscriptionPaymentEntry(subPayment),
        });
      } catch (e) { console.error('subscription ledger error (non-fatal):', e.message); }
    }
  }

  if (kind === 'initial') {
    try {
      const { data: prof } = await supabaseAdmin.from('profiles').select('name, email').eq('id', vendorId).single();
      NotificationEngine.send({
        event: 'SUBSCRIPTION_PURCHASED',
        data: {
          email: prof?.email, emailUser: { name: prof?.name, email: prof?.email },
          emailData: {
            plan_name: plan?.name || planSlug,
            expiry_date: new Date(periodEndIso).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }),
          },
          recipientUserId: vendorId,
        },
      }).catch((e) => console.error('subscription email error:', e.message));
    } catch (_) { /* non-fatal */ }
  }

  return { activated: true };
}

/** subscription.halted — repeated charge failure. Keep plan flag, mark halted. */
async function markHalted(rzpSub) {
  if (!rzpSub?.id) return;
  await supabaseAdmin.from('profiles')
    .update({ subscription_status: 'halted', updated_at: new Date().toISOString() })
    .eq('razorpay_subscription_id', rzpSub.id);
}

/**
 * subscription.cancelled — access is retained until current_period_end;
 * resolveVendorPlan() downgrades to starter once plan_expires_at passes.
 */
async function markCancelled(rzpSub) {
  if (!rzpSub?.id) return;
  await supabaseAdmin.from('profiles')
    .update({ subscription_status: 'cancelled', updated_at: new Date().toISOString() })
    .eq('razorpay_subscription_id', rzpSub.id);
}

module.exports = { activateFromSubscription, markHalted, markCancelled, ACTIVE_STATES };
