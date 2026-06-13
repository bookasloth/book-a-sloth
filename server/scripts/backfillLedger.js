/**
 * backfillLedger.js — one-time idempotent replay of pre-ledger history.
 * Usage:  node scripts/backfillLedger.js --dry-run   (print plan, write nothing)
 *         node scripts/backfillLedger.js              (post BACKFILL entries)
 *
 * Run MANUALLY once after deploy (NOT in tests). --dry-run first.
 *
 * Truthful-history rule: amounts come from each booking's ORIGINAL v2.2
 * snapshot (no commission GST — it did not exist then; razorpay_tax_actual
 * defaults 0). Old plan purchases post with gst_amount 0 (none was charged).
 * Idempotent: posting dedupes on (source_type, source_id); re-runs are no-ops.
 *
 * Schema verified live (project xwvciqkayammbvsidqig, 2026-06-13):
 *   payout_requests(id, host_id, amount numeric, status text, created_at, updated_at)
 *   plan_purchases(id, vendor_id, plan, amount_paid INTEGER=paise,
 *                  razorpay_order_id, razorpay_payment_id, activated_at, expires_at)
 *   bookings has all snapshot cols (customer_total, vendor_amount, commission_*, etc.)
 *
 * Each row is wrapped in try/catch: one bad row logs and is skipped (poison-pill
 * lesson) — the rest proceed. Uses the THROWING post() so a real backfill miss
 * is visible (the outer per-row catch keeps the run alive).
 */
'use strict';
require('dotenv').config();

const { supabaseAdmin } = require('../config/supabase');
const { orderPaymentEntry, subscriptionPaymentEntry } = require('../services/ledger/journalTemplates');
const { post } = require('../services/ledger/postingService');
const { ACCOUNTS } = require('../lib/ledgerAccounts');

const DRY = process.argv.includes('--dry-run');

async function run() {
  let planned = 0, posted = 0, skipped = 0;
  console.log(`${DRY ? '=== DRY RUN (no writes) ===' : '=== BACKFILL (writing entries) ==='}\n`);

  // ── 1. Historical paid bookings (original snapshots; source BACKFILL) ──
  const { data: bookings, error: bErr } = await supabaseAdmin
    .from('bookings')
    .select('id, host_id, paid_at, created_at, updated_at, customer_total, vendor_amount, platform_fee_amount, platform_fee_gst, commission_applied, commission_gst, razorpay_fee_actual, razorpay_tax_actual, services(price)')
    .eq('payment_status', 'paid')
    .gt('customer_total', 0)
    .order('created_at', { ascending: true });
  if (bErr) throw bErr;

  console.log(`-- Section 1: paid bookings (${(bookings || []).length}) --`);
  for (const b of bookings || []) {
    try {
      // Guard: can't balance an entry with no customer total.
      if (!(Number(b.customer_total) > 0)) { skipped += 1; continue; }
      const journalDate = (b.paid_at || b.updated_at || b.created_at || '').slice(0, 10) || null;
      planned += 1;
      console.log(`[booking ${b.id}] ${journalDate} customer_total=${b.customer_total} vendor=${b.vendor_amount}`);
      if (DRY) continue;
      await post({
        sourceType: 'BACKFILL', sourceId: b.id, journalDate,
        template: orderPaymentEntry({
          booking_id: b.id, host_id: b.host_id,
          service_price: b.services?.price || 0,
          platform_fee_amount: b.platform_fee_amount, platform_fee_gst: b.platform_fee_gst,
          commission_applied: b.commission_applied, commission_gst: b.commission_gst || 0,
          razorpay_fee_actual: b.razorpay_fee_actual, razorpay_tax_actual: b.razorpay_tax_actual || 0,
          vendor_amount: b.vendor_amount, customer_total: b.customer_total,
        }),
      });
      posted += 1;
    } catch (rowErr) {
      skipped += 1;
      console.error(`  ! booking ${b.id} failed: ${rowErr.message}`);
    }
  }

  // ── 2. Historical plan purchases (amount_paid is INTEGER paise — verified) ──
  const { data: purchases, error: pErr } = await supabaseAdmin
    .from('plan_purchases')
    .select('id, vendor_id, plan, amount_paid, activated_at, expires_at, razorpay_payment_id, razorpay_order_id')
    .order('activated_at', { ascending: true });
  if (pErr) throw pErr;

  console.log(`\n-- Section 2: plan purchases (${(purchases || []).length}) --`);
  for (const p of purchases || []) {
    try {
      const planPrice = Math.round(Number(p.amount_paid || 0)) / 100; // paise → ₹
      if (!(planPrice > 0)) { skipped += 1; continue; }
      // Dedup relies on razorpay_payment_id; a row without one can't be matched
      // on a re-run (would insert a duplicate subscription_payments row). Skip.
      if (!p.razorpay_payment_id) {
        skipped += 1;
        console.warn(`  ! plan_purchase ${p.id} has no razorpay_payment_id — skipped (not backfillable safely)`);
        continue;
      }
      const journalDate = (p.activated_at || '').slice(0, 10) || null;
      planned += 1;
      console.log(`[plan_purchase ${p.id}] ${journalDate} ${p.plan} ₹${planPrice}`);
      if (DRY) continue;

      // Retroactive subscription_payments row (gst 0 — none was charged then).
      let subRow;
      const { data: existing } = await supabaseAdmin
        .from('subscription_payments').select('*').eq('razorpay_payment_id', p.razorpay_payment_id).maybeSingle();
      if (existing) {
        subRow = existing;
      } else {
        const { data: inserted, error: insErr } = await supabaseAdmin
          .from('subscription_payments').insert({
            vendor_id: p.vendor_id, plan_type: p.plan,
            plan_price: planPrice, gst_amount: 0, total_charged: planPrice,
            razorpay_fee: 0, razorpay_tax: 0,
            razorpay_payment_id: p.razorpay_payment_id, razorpay_order_id: p.razorpay_order_id,
            paid_at: p.activated_at, revenue_recognized_at: p.activated_at,
            billing_period_start: (p.activated_at || '').slice(0, 10) || null,
            billing_period_end: (p.expires_at || '').slice(0, 10) || null,
            status: 'paid',
          }).select().single();
        if (insErr) throw insErr;
        subRow = inserted;
      }

      await post({
        sourceType: 'BACKFILL', sourceId: subRow.id, journalDate,
        template: subscriptionPaymentEntry(subRow),
      });
      posted += 1;
    } catch (rowErr) {
      skipped += 1;
      console.error(`  ! plan_purchase ${p.id} failed: ${rowErr.message}`);
    }
  }

  // ── 3. Already-executed payouts → relieve Vendor Payables, credit Bank ──
  // payout_requests(host_id, amount numeric, status). Statuses meaning money left
  // the bank. Verify live status vocabulary before a REAL run if rows exist.
  const { data: payouts, error: poErr } = await supabaseAdmin
    .from('payout_requests')
    .select('id, host_id, amount, status, created_at, updated_at')
    .in('status', ['approved', 'paid', 'completed'])
    .order('created_at', { ascending: true });
  if (poErr) throw poErr;

  console.log(`\n-- Section 3: executed payouts (${(payouts || []).length}) --`);
  for (const po of payouts || []) {
    try {
      const amount = Number(po.amount) || 0;
      if (!(amount > 0)) { skipped += 1; continue; }
      const journalDate = (po.updated_at || po.created_at || '').slice(0, 10) || null;
      planned += 1;
      console.log(`[payout ${po.id}] ${journalDate} vendor=${po.host_id} ₹${amount}`);
      if (DRY) continue;
      await post({
        sourceType: 'BACKFILL_SETTLEMENT', sourceId: po.id, journalDate,
        template: {
          description: `Backfill: historical payout ${po.id}`,
          lines: [
            { account_code: ACCOUNTS.VENDOR_PAYABLES, debit: amount, credit: 0, vendor_id: po.host_id },
            { account_code: ACCOUNTS.BANK, debit: 0, credit: amount, vendor_id: po.host_id },
          ],
        },
      });
      posted += 1;
    } catch (rowErr) {
      skipped += 1;
      console.error(`  ! payout ${po.id} failed: ${rowErr.message}`);
    }
  }

  console.log(
    `\n${DRY ? 'DRY RUN — planned' : 'planned'} ${planned} entries` +
    (DRY ? '' : `, posted ${posted}`) +
    `, skipped ${skipped}.`
  );

  if (!DRY) {
    const { data: balances } = await supabaseAdmin
      .from('account_balances').select('balance, chart_of_accounts(code, name)');
    console.log('\nClosing balances:');
    for (const row of balances || []) {
      console.log(`  ${row.chart_of_accounts.code} ${row.chart_of_accounts.name}: ₹${row.balance}`);
    }
  }
}

run().then(() => process.exit(0)).catch((e) => { console.error('Backfill failed:', e.message); process.exit(1); });
