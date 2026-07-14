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
const { capture: phCapture } = require('../utils/posthog');
const { trackServer } = require('../utils/trackServer');
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

  // First charge for this subscription → initial (drives the purchase email);
  // later charges → renewal. Read before recording so the new row doesn't skew it.
  const { count: priorCount } = await supabaseAdmin
    .from('subscription_payments').select('id', { count: 'exact', head: true })
    .eq('razorpay_subscription_id', rzpSub.id);
  const isInitial = (priorCount || 0) === 0;

  let periodEndIso = unixToIso(rzpSub.current_end) ||
    new Date(Date.now() + (cadence === 'monthly' ? 30 : 365) * 24 * 3600 * 1000).toISOString();
  const nowIso = new Date().toISOString();

  // Never shrink access below what's already granted — a switch grants free
  // days up-front (deferred start_at), and the activation webhook must not claw
  // that back when Razorpay reports the first paid cycle's (earlier) end.
  const { data: existing } = await supabaseAdmin
    .from('profiles').select('plan_expires_at').eq('id', vendorId).maybeSingle();
  if (existing?.plan_expires_at && new Date(existing.plan_expires_at) > new Date(periodEndIso)) {
    periodEndIso = existing.plan_expires_at;
  }

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
  // A missing payment entity (e.g. subscription.activated) grants access but
  // books no money — recordSubscriptionCharge / the reconciler backfill handles
  // the actual charge when the invoice/payment surfaces.
  if (paymentId) {
    let fetched = null;
    // Fetch the full payment so fee/tax are present (webhook payloads may omit).
    try { fetched = await require('./razorpaySubscriptions').fetchPayment(paymentId); }
    catch (e) { console.error('subscription payment fetch failed (using webhook entity):', e.message); }
    // Merge so id/order survive even if a mock/partial fetch omits them.
    const payment = { ...(rzpPayment || {}), ...(fetched || {}), id: paymentId, order_id: fetched?.order_id || rzpPayment?.order_id || null };
    await recordSubscriptionCharge({ vendorId, planSlug, cadence, rzpSub, payment });
  }

  if (isInitial) {
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

  // Auto-renew analytics. Renewal charges flow ONLY through this path (webhook /
  // reconciler), never the verify endpoint — so a dedicated event can't overlap
  // the verify path's `subscription_purchased` and never double-counts.
  if (paymentId && !isInitial) {
    const { gstRate } = await platformConfig.getConfig();
    const planPrice = cadence === 'monthly' ? Number(plan.monthly_price) || 0 : Number(plan.annual_price) || 0;
    const total = computeSubscriptionBreakdown({ planPrice, gstRate }).totalCharged;
    trackServer(vendorId, 'subscription_renewed', {
      plan: planSlug,
      cadence,
      expires_at: periodEndIso,
    }, {
      value: Number(total) || 0,
      currency: 'INR',
      eventId: paymentId,   // de-dupe (renewals have no browser pixel, but keep stable)
    });
  }

  return { activated: true };
}

/**
 * Record a single subscription charge (idempotent on razorpay_payment_id) +
 * post its ledger entry. Shared by activateFromSubscription (webhook) and the
 * reconciler backfill so the money logic lives in exactly one place.
 *
 * @param {object} p
 * @param {string} p.vendorId
 * @param {string} p.planSlug
 * @param {string} p.cadence     'monthly' | 'annual'
 * @param {object} p.rzpSub      Razorpay subscription entity (id, current_start/end)
 * @param {object} p.payment     Razorpay payment entity (id, order_id, fee/tax in paise)
 * @returns {Promise<{recorded:boolean, reason?:string}>}
 */
async function recordSubscriptionCharge({ vendorId, planSlug, cadence, rzpSub, payment }) {
  const paymentId = payment?.id || null;
  if (!paymentId) return { recorded: false, reason: 'no payment id' };

  // Idempotency: skip if this exact charge already booked.
  const { data: prior } = await supabaseAdmin
    .from('subscription_payments').select('id').eq('razorpay_payment_id', paymentId).maybeSingle();
  if (prior) return { recorded: false, reason: 'already recorded' };

  const plan = await planService.getPlan(planSlug);
  const { gstRate } = await platformConfig.getConfig();
  const planPrice = cadence === 'monthly' ? Number(plan.monthly_price) || 0 : Number(plan.annual_price) || 0;
  const breakdown = computeSubscriptionBreakdown({ planPrice, gstRate });

  // Guard against UPI-AutoPay mandate-authorization token charges. When a UPI
  // AutoPay mandate is registered Razorpay captures a ₹1-2 "auth" transaction to
  // validate it — it is status=paid but is NOT a plan payment. Recording it stamps
  // the full plan_price against a ₹1 capture, inflating collected revenue (this is
  // exactly what put a never-paying admin-granted host into "Subscriptions
  // Collected"). A genuine plan charge always captures at least the plan list price;
  // an auth token captures a few rupees. Skip anything well below the plan price.
  const capturedRupees = payment?.amount != null ? Number(payment.amount) / 100 : null;
  if (capturedRupees != null && planPrice > 0 && capturedRupees + 0.01 < planPrice) {
    return { recorded: false, reason: `auth/token txn ₹${capturedRupees} < plan ₹${planPrice}` };
  }

  const periodStartIso = unixToIso(rzpSub?.current_start) || new Date().toISOString();
  const periodEndIso = unixToIso(rzpSub?.current_end) ||
    new Date(Date.now() + (cadence === 'monthly' ? 30 : 365) * 24 * 3600 * 1000).toISOString();
  // Prefer the real capture time; fall back to now.
  const paidIso = payment?.created_at ? new Date(Number(payment.created_at) * 1000).toISOString() : new Date().toISOString();

  // First charge for this subscription → initial; later → renewal.
  const { count: priorCount } = await supabaseAdmin
    .from('subscription_payments').select('id', { count: 'exact', head: true })
    .eq('razorpay_subscription_id', rzpSub.id);
  const kind = (priorCount || 0) === 0 ? 'initial' : 'renewal';

  // Gateway fee+tax — PLATFORM-borne for subscriptions (PRD §5.3). Paise → rupees.
  let feeTotal = 0, tax = 0;
  if (payment?.fee != null) feeTotal = Number(payment.fee) / 100;
  if (payment?.tax != null) tax = Number(payment.tax) / 100;
  tax = Math.min(tax, feeTotal);
  const feeExcl = Math.max(0, Math.round((feeTotal - tax) * 100) / 100);

  const { data: subPayment, error: subErr } = await supabaseAdmin
    .from('subscription_payments').insert({
      vendor_id: vendorId, plan_type: planSlug,
      plan_price: breakdown.planPrice, gst_amount: breakdown.gstAmount, total_charged: breakdown.totalCharged,
      razorpay_fee: feeExcl, razorpay_tax: tax,
      razorpay_payment_id: paymentId, razorpay_order_id: payment?.order_id || null,
      razorpay_subscription_id: rzpSub.id, billing_cadence: cadence, kind,
      paid_at: paidIso, revenue_recognized_at: paidIso,
      billing_period_start: periodStartIso.slice(0, 10),
      billing_period_end: periodEndIso.slice(0, 10),
      status: 'paid',
    }).select().single();

  if (subErr) {
    if (subErr.code === '23505' || /duplicate key|unique constraint/i.test(subErr.message || '')) {
      return { recorded: false, reason: 'duplicate (raced)' };
    }
    console.error('subscription_payments insert failed:', subErr.message);
    return { recorded: false, reason: subErr.message };
  }

  try {
    const { subscriptionPaymentEntry } = require('./ledger/journalTemplates');
    const { postSafe } = require('./ledger/postingService');
    await postSafe({
      sourceType: 'SUBSCRIPTION_PAYMENT', sourceId: subPayment.id,
      journalDate: paidIso.slice(0, 10), template: subscriptionPaymentEntry(subPayment),
    });
  } catch (e) { console.error('subscription ledger error (non-fatal):', e.message); }

  // v3.67: GST tax invoice for the subscription (best-effort, idempotent).
  try {
    const { generateInvoice } = require('./invoiceService');
    const { data: prof } = await supabaseAdmin
      .from('profiles').select('name, billing_details').eq('id', vendorId).maybeSingle();
    const bd = prof?.billing_details || {};
    await generateInvoice({
      sourceType: 'subscription',
      sourceId: subPayment.id,
      paymentId,
      issuedAt: paidIso,
      buyer: {
        name: bd.name || prof?.name || 'Customer',
        address: bd.address || null,
        stateCode: bd.state_code || null,
        stateName: bd.state || null,
        gstin: bd.gstin || null,
        pan: bd.pan || null,
      },
      taxableValue: breakdown.planPrice,
      gstAmount: breakdown.gstAmount,
    });
  } catch (e) { console.error('subscription invoice error (non-fatal):', e.message); }

  // v3.77 Refer & Earn: a real (non-token) plan charge just booked for this host.
  // If they were referred, advance the referral toward its reward. Best-effort.
  try {
    await require('./referralService').onReferredCharge({ referredId: vendorId, planSlug, cadence });
  } catch (e) { console.error('referral qualify hook failed (non-fatal):', e.message); }

  return { recorded: true };
}

/**
 * Backfill EVERY paid invoice of a subscription that isn't yet booked. Heals
 * subscriptions whose charge was never recorded (activation granted access via
 * subscription.activated, but the subscription.charged webhook that carries the
 * payment was missed). Idempotent — recordSubscriptionCharge skips existing rows.
 *
 * @param {object} rzpSub Razorpay subscription entity (notes.vendor_id/plan/cadence)
 * @returns {Promise<{recorded:number}>}
 */
async function backfillSubscriptionPayments(rzpSub) {
  const notes = rzpSub?.notes || {};
  const vendorId = notes.vendor_id;
  const planSlug = planService.normalizeSlug(notes.plan);
  const cadence = normCadence(notes.cadence) || 'monthly';
  if (!vendorId || !notes.plan) return { recorded: 0 };

  const razorpaySubscriptions = require('./razorpaySubscriptions');
  let invoices = [];
  try { invoices = await razorpaySubscriptions.fetchSubscriptionInvoices(rzpSub.id); }
  catch (e) { console.error('backfill invoices fetch failed', rzpSub.id, e.message); return { recorded: 0 }; }

  let recorded = 0;
  for (const inv of invoices) {
    if (inv.status !== 'paid' || !inv.payment_id) continue;
    let payment = { id: inv.payment_id, order_id: inv.order_id || null };
    try { payment = await razorpaySubscriptions.fetchPayment(inv.payment_id); }
    catch (e) { console.error('backfill payment fetch failed', inv.payment_id, e.message); }
    const r = await recordSubscriptionCharge({ vendorId, planSlug, cadence, rzpSub, payment });
    if (r.recorded) recorded++;
  }
  return { recorded };
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

module.exports = { activateFromSubscription, recordSubscriptionCharge, backfillSubscriptionPayments, markHalted, markCancelled, ACTIVE_STATES };
