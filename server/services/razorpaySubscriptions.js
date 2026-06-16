/**
 * razorpaySubscriptions.js — thin wrapper around the Razorpay Subscriptions API.
 *
 * Owns: lazy creation of Razorpay Plan objects (one per tier × cadence) and the
 * subscription lifecycle (create / cancel / fetch). All money math comes from
 * lib/subscriptionPricing.js; this file only talks to Razorpay + persists ids.
 */
'use strict';

const planService = require('./planService');
const platformConfig = require('./platformConfig');
const razorpayConfig = require('./razorpayConfig');
const { supabaseAdmin } = require('../config/supabase');
const { cadenceAmountPaise, razorpayInterval, normCadence } = require('../lib/subscriptionPricing');

const PLAN_ID_COLUMN = { monthly: 'razorpay_plan_id_monthly', annual: 'razorpay_plan_id_annual' };
// total_count is required by Razorpay; cap cycles high enough to be effectively
// "until cancelled" (monthly → ~10 years, annual → 100 years).
const TOTAL_COUNT = { monthly: 120, annual: 100 };

/**
 * Ensure a Razorpay Plan exists for (planRow, cadence). Creates + persists the
 * plan id the first time; returns the cached id afterwards.
 * @returns {Promise<string>} razorpay plan id
 */
async function ensureRazorpayPlan(planRow, cadence) {
  const c = normCadence(cadence);
  const col = PLAN_ID_COLUMN[c];
  if (!col) throw new Error(`unknown cadence: ${cadence}`);
  if (planRow[col]) return planRow[col];

  const { gstRate } = await platformConfig.getConfig();
  const amount = cadenceAmountPaise(planRow, c, gstRate);
  if (!(amount > 0)) throw new Error(`plan "${planRow.slug}" has no ${c} price set`);

  const { period, interval } = razorpayInterval(c);
  const razorpay = await razorpayConfig.getClient();
  const rzpPlan = await razorpay.plans.create({
    period,
    interval,
    item: {
      name: `${planRow.name} (${c})`,
      amount,
      currency: 'INR',
      description: `Book A Sloth ${planRow.name} — ${c} billing (incl. GST)`,
    },
    notes: { plan_slug: planRow.slug, cadence: c },
  });

  await supabaseAdmin
    .from('subscription_plans')
    .update({ [col]: rzpPlan.id })
    .eq('id', planRow.id);
  planService.clearCache();
  return rzpPlan.id;
}

/**
 * Create a Razorpay subscription against an existing plan id.
 * @param {object} p
 * @param {string} p.planId      razorpay plan id
 * @param {string} p.cadence     'monthly' | 'annual'
 * @param {object} [p.notes]     vendor_id, plan slug, etc. (echoed in webhooks)
 * @param {number} [p.startAt]   unix seconds — defer first charge (proration switch)
 */
async function createSubscription({ planId, cadence, notes = {}, startAt }) {
  const c = normCadence(cadence);
  const razorpay = await razorpayConfig.getClient();
  return razorpay.subscriptions.create({
    plan_id: planId,
    total_count: TOTAL_COUNT[c] || 120,
    customer_notify: 1,
    ...(startAt ? { start_at: startAt } : {}),
    notes,
  });
}

/** Cancel a subscription (at cycle end by default; immediate when atCycleEnd=false). */
async function cancelSubscription(subscriptionId, atCycleEnd = true) {
  const razorpay = await razorpayConfig.getClient();
  return razorpay.subscriptions.cancel(subscriptionId, atCycleEnd);
}

async function fetchSubscription(subscriptionId) {
  const razorpay = await razorpayConfig.getClient();
  return razorpay.subscriptions.fetch(subscriptionId);
}

module.exports = {
  getClient: razorpayConfig.getClient,
  PLAN_ID_COLUMN,
  ensureRazorpayPlan,
  createSubscription,
  cancelSubscription,
  fetchSubscription,
};
