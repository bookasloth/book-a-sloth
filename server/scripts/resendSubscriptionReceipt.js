/**
 * resendSubscriptionReceipt.js — re-send the receipt email (amount + GST invoice
 * PDF link) for one already-recorded subscription charge. For hosts whose
 * original email predates the receipt/invoice rollout, or a lost delivery.
 *
 * Reuses subscriptionService.sendSubscriptionReceiptEmail so the email is byte-for-
 * byte what the live charge path sends. Mints the invoice first if it's missing.
 *
 * Run (prod): node -r dotenv/config scripts/resendSubscriptionReceipt.js <razorpay_payment_id> dotenv_config_path=.env.production
 * Run (local/staging): node scripts/resendSubscriptionReceipt.js <razorpay_payment_id>
 */
'use strict';
require('dotenv').config();
const { supabaseAdmin } = require('../config/supabase');
const planService = require('../services/planService');
const subscriptionService = require('../services/subscriptionService');
const { normCadence } = require('../lib/subscriptionPricing');

async function main() {
  const paymentId = process.argv[2];
  if (!paymentId || paymentId.startsWith('dotenv_config')) {
    console.error('Usage: node scripts/resendSubscriptionReceipt.js <razorpay_payment_id>');
    process.exit(1);
  }

  const { data: sp, error } = await supabaseAdmin
    .from('subscription_payments')
    .select('id, vendor_id, plan_type, billing_cadence, kind, razorpay_payment_id, billing_period_end')
    .eq('razorpay_payment_id', paymentId)
    .maybeSingle();
  if (error) { console.error('lookup failed:', error.message); process.exit(1); }
  if (!sp) { console.error(`No subscription_payments row for ${paymentId}`); process.exit(1); }

  // Ensure the GST invoice exists so the email link resolves to the PDF (not the
  // dashboard fallback). Idempotent — no-op if already minted.
  await subscriptionService.ensureSubscriptionInvoice(sp);

  const cadence = normCadence(sp.billing_cadence) || 'monthly';
  const plan = await planService.getPlan(planService.normalizeSlug(sp.plan_type));

  // Renews-on date: the profile's live expiry wins; fall back to this charge's
  // billing period end.
  const { data: prof } = await supabaseAdmin
    .from('profiles').select('plan_expires_at').eq('id', sp.vendor_id).maybeSingle();
  const periodEndIso = prof?.plan_expires_at
    || (sp.billing_period_end ? new Date(sp.billing_period_end).toISOString() : new Date().toISOString());

  const event = sp.kind === 'renewal' ? 'SUBSCRIPTION_RENEWED' : 'SUBSCRIPTION_PURCHASED';
  await subscriptionService.sendSubscriptionReceiptEmail({
    event, vendorId: sp.vendor_id, plan, planSlug: sp.plan_type, cadence, periodEndIso,
    paymentId: sp.razorpay_payment_id,
  });

  console.log(`Re-sent ${event} for ${paymentId} (vendor ${sp.vendor_id}).`);
  process.exit(0);
}

main().catch((e) => { console.error(e); process.exit(1); });
