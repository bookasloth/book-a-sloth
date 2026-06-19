/**
 * bookingPaymentReconciler.js — safety net for missed one-off booking webhooks.
 *
 * The Razorpay webhook flips a booking unpaid→paid, and on a processing error it
 * returns 500 so Razorpay retries. But if every retry exhausts (or the webhook
 * was never delivered) a genuinely-paid booking is left stuck `unpaid` — money
 * taken, slot not confirmed, guest in limbo. This scans such bookings and asks
 * Razorpay directly whether their order was actually captured, then completes
 * the same idempotent transition the webhook does.
 *
 * Mirrors subscriptionReconciler. Idempotent (only the unpaid→paid row matches),
 * so it is safe to run repeatedly and safe alongside a late webhook. Wired to a
 * setInterval in server.js.
 */
'use strict';

const { supabaseAdmin } = require('../config/supabase');
const razorpayConfig = require('./razorpayConfig');
const { trackServer } = require('../utils/trackServer');
const { resolveGuestId } = require('../utils/posthog');

// Only touch bookings whose order is old enough that the normal capture→webhook
// path should already have completed — avoids racing a webhook that's in flight.
const GRACE_MIN = Number(process.env.BOOKING_RECONCILE_GRACE_MIN || 15);
// Don't chase abandoned checkouts forever; cap how far back we look.
const LOOKBACK_HOURS = Number(process.env.BOOKING_RECONCILE_LOOKBACK_HOURS || 48);

async function reconcile() {
  const now = Date.now();
  const upper = new Date(now - GRACE_MIN * 60 * 1000).toISOString();
  const lower = new Date(now - LOOKBACK_HOURS * 60 * 60 * 1000).toISOString();

  const { data: stuck } = await supabaseAdmin
    .from('bookings')
    .select('id, razorpay_order_id, host_id, guest_id, guest_email, customer_total, services(title)')
    .eq('payment_status', 'unpaid')
    .not('razorpay_order_id', 'is', null)
    .neq('status', 'cancelled')
    .lt('updated_at', upper)
    .gt('updated_at', lower)
    .limit(100);

  let checked = 0;
  let healed = 0;
  if (!stuck || !stuck.length) return { checked, healed };

  let client;
  try {
    client = await razorpayConfig.getClient();
  } catch (e) {
    console.error('booking reconcile: razorpay client unavailable —', e.message);
    return { checked, healed };
  }

  for (const b of stuck) {
    checked++;
    try {
      const res = await client.orders.fetchPayments(b.razorpay_order_id);
      const captured = (res.items || []).find((p) => p.status === 'captured');
      if (!captured) continue; // not actually paid — leave it

      // Idempotent: only the unpaid→paid transition matches, so a late webhook
      // that already flipped this row yields zero rows here (no double-fire).
      const { data: paidRows } = await supabaseAdmin
        .from('bookings')
        .update({
          payment_status: 'paid',
          status: 'confirmed',
          razorpay_payment_id: captured.id,
          updated_at: new Date().toISOString(),
        })
        .eq('id', b.id)
        .eq('payment_status', 'unpaid')
        .select('id, host_id, guest_id, guest_email, customer_total, services(title)');

      const paid = paidRows && paidRows[0];
      if (!paid) continue; // someone else won the transition

      healed++;
      // Mirror the webhook's analytics so booking_paid fires exactly once.
      try {
        trackServer(
          resolveGuestId({ guestId: paid.guest_id, guestEmail: paid.guest_email }),
          'booking_paid',
          {
            booking_id: paid.id,
            service_title: paid.services?.title,
            host_id: paid.host_id,
            amount: Number(paid.customer_total) || 0,
            currency: 'INR',
            razorpay_payment_id: captured.id,
            source: 'reconciler',
          },
          {
            value: Number(paid.customer_total) || 0,
            currency: 'INR',
            email: paid.guest_email,
            eventId: captured.id, // same id the pixel/webhook used → de-dupe
          },
        );
      } catch (trackErr) {
        console.error('booking reconcile: analytics error (non-fatal)', paid.id, trackErr.message);
      }
    } catch (e) {
      console.error('booking reconcile error', b.id, e.message);
    }
  }

  return { checked, healed };
}

module.exports = { reconcile };
