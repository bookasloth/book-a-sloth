/**
 * ledgerReconciler.js — self-heal cron. Finds paid bookings and subscription
 * payments that have NO journal entry (posting failed at capture time) and
 * reposts them. Safe to run repeatedly: posting is idempotent on
 * (source_type, source_id). Scans a bounded recent window each run.
 */
'use strict';

const { supabaseAdmin } = require('../../config/supabase');
const { orderPaymentEntry, subscriptionPaymentEntry } = require('./journalTemplates');
const { postSafe } = require('./postingService');

const SCAN_LIMIT = 200;

async function missingSourceIds(sourceType, ids) {
  if (!ids.length) return new Set();
  const { data, error } = await supabaseAdmin
    .from('journal_entries')
    .select('source_id')
    .in('source_id', ids)
    .eq('source_type', sourceType);
  if (error) throw new Error(`reconciler journal lookup failed: ${error.message}`);
  const posted = new Set((data || []).map((r) => r.source_id));
  return new Set(ids.filter((id) => !posted.has(id)));
}

async function reconcile() {
  let reposted = 0;

  // ── Paid bookings without an ORDER_PAYMENT entry ──
  const { data: bookings, error: bErr } = await supabaseAdmin
    .from('bookings')
    .select('id, host_id, paid_at, customer_total, vendor_amount, platform_fee_amount, platform_fee_gst, commission_applied, commission_gst, razorpay_fee_actual, razorpay_tax_actual, services(price)')
    .eq('payment_status', 'paid')
    .gt('customer_total', 0)
    .not('paid_at', 'is', null)
    .order('paid_at', { ascending: false })
    .limit(SCAN_LIMIT);
  if (bErr) throw new Error(`reconciler booking scan failed: ${bErr.message}`);

  const missingBookings = await missingSourceIds('ORDER_PAYMENT', (bookings || []).map((b) => b.id));
  for (const b of bookings || []) {
    if (!missingBookings.has(b.id)) continue;
    const id = await postSafe({
      sourceType: 'ORDER_PAYMENT',
      sourceId: b.id,
      journalDate: (b.paid_at || '').slice(0, 10) || null,
      template: orderPaymentEntry({
        booking_id: b.id, host_id: b.host_id,
        service_price: b.services?.price || 0,
        platform_fee_amount: b.platform_fee_amount, platform_fee_gst: b.platform_fee_gst,
        commission_applied: b.commission_applied, commission_gst: b.commission_gst,
        razorpay_fee_actual: b.razorpay_fee_actual, razorpay_tax_actual: b.razorpay_tax_actual,
        vendor_amount: b.vendor_amount, customer_total: b.customer_total,
      }),
    });
    if (id) reposted += 1;
  }

  // ── Subscription payments without a SUBSCRIPTION_PAYMENT entry ──
  const { data: subs, error: sErr } = await supabaseAdmin
    .from('subscription_payments')
    .select('*')
    .eq('status', 'paid')
    .order('paid_at', { ascending: false })
    .limit(SCAN_LIMIT);
  if (sErr) throw new Error(`reconciler subscription scan failed: ${sErr.message}`);

  const missingSubs = await missingSourceIds('SUBSCRIPTION_PAYMENT', (subs || []).map((s) => s.id));
  for (const s of subs || []) {
    if (!missingSubs.has(s.id)) continue;
    const id = await postSafe({
      sourceType: 'SUBSCRIPTION_PAYMENT',
      sourceId: s.id,
      journalDate: (s.paid_at || '').slice(0, 10) || null,
      template: subscriptionPaymentEntry(s),
    });
    if (id) reposted += 1;
  }

  return { reposted };
}

module.exports = { reconcile };
