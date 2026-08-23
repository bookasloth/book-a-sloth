'use strict';
/**
 * attribution.js — connect a lead to its Book A Sloth account and revenue.
 *
 * Two passes (run hourly by cron, or on demand):
 *   1. link  — leads with no profile_id are matched to a profiles row by phone
 *              then email, so a lead we cold-outreached and who later signed up
 *              gets stitched to their account.
 *   2. refresh — for linked leads, compute BAS revenue attributable to that
 *              account (paid subscription charges + platform fee on their paid
 *              bookings) into leads.revenue_paise, stamp converted_at on first
 *              money, and advance status to 'paid' once revenue exists.
 *
 * Revenue is stored in paise (integer minor units) to avoid float drift.
 */
const { supabaseAdmin } = require('../../config/supabase');
const { normalizePhone } = require('../aisensyService');
const contactsService = require('../contactsService');

const toPaise = (rupees) => Math.round((Number(rupees) || 0) * 100);
const PAGE = 200;

// Non-paying base tiers. Anything else is a paid subscription plan.
const FREE_PLANS = new Set(['free', 'starter', 'starter_legacy', 'explorer']);

// WON = the host signed up AND paid for a subscription. Detected robustly: a
// successful subscription payment, an active Razorpay mandate, OR a paid-tier
// plan. The plan check is essential — most paying hosts here are legacy/annual
// subscribers (v3.8 backfill) with NO subscription_payments row, so a
// payment-row-only test would miss them. Guest-booking commission is revenue
// but NOT a subscription, so it never wins a lead on its own.
function isPaidSubscriber(profile, hasSubPayment) {
  if (hasSubPayment) return true;
  if (!profile) return false;
  if (profile.razorpay_subscription_id) return true;
  const plan = String(profile.plan || '').toLowerCase();
  return !!plan && !FREE_PLANS.has(plan);
}

// Pure: the status/converted_at patch for a lead given the win signal + current
// state. Promotes to 'paid' when won; demotes a lead wrongly marked 'paid' by
// the old any-revenue rule back to 'activated' (an active host who never
// subscribed). Never regresses lost / do_not_contact.
function conversionPatch({ won, status, convertedAt, wonAt }) {
  const patch = {};
  if (won) {
    if (!['paid', 'lost', 'do_not_contact'].includes(status)) {
      patch.status = 'paid';                                   // promote to Won
      if (!convertedAt && wonAt) patch.converted_at = wonAt;
    } else if (status === 'paid' && !convertedAt && wonAt) {
      patch.converted_at = wonAt;                              // backfill on an already-won lead
    }
    // lost / do_not_contact are deliberate dispositions — never auto-regress.
  } else if (status === 'paid') {
    patch.status = 'activated';                                // demote wrongly-won (booking-only)
    patch.converted_at = null;
  }
  return patch;
}

// Pass 1 — stitch unlinked leads to profiles.
async function linkLeadsToProfiles() {
  let linked = 0, from = 0;
  for (;;) {
    const { data: leads } = await supabaseAdmin.from('leads')
      .select('id, phone, email').is('profile_id', null)
      .range(from, from + PAGE - 1);
    if (!leads?.length) break;

    for (const l of leads) {
      let profile = null;
      const phone = normalizePhone(l.phone);
      if (phone) {
        const last10 = phone.slice(-10);
        ({ data: profile } = await supabaseAdmin.from('profiles').select('id, created_at').ilike('phone', `%${last10}%`).limit(1).maybeSingle());
      }
      if (!profile && l.email) {
        ({ data: profile } = await supabaseAdmin.from('profiles').select('id, created_at').eq('email', l.email).limit(1).maybeSingle());
      }
      if (profile) {
        await supabaseAdmin.from('leads').update({ profile_id: profile.id, updated_at: new Date().toISOString() }).eq('id', l.id);
        linked++;
      }
    }
    if (leads.length < PAGE) break;
    from += PAGE;
  }
  return linked;
}

// Pass 2 — recompute revenue for linked leads.
async function refreshRevenue() {
  let updated = 0, from = 0;
  for (;;) {
    const { data: leads } = await supabaseAdmin.from('leads')
      .select('id, profile_id, status, converted_at').not('profile_id', 'is', null)
      .range(from, from + PAGE - 1);
    if (!leads?.length) break;

    for (const l of leads) {
      const [{ data: subs }, { data: bks }, { data: profile }] = await Promise.all([
        supabaseAdmin.from('subscription_payments').select('total_charged, paid_at').eq('vendor_id', l.profile_id),
        supabaseAdmin.from('bookings').select('platform_fee_amount').eq('host_id', l.profile_id).eq('payment_status', 'paid'),
        supabaseAdmin.from('profiles').select('plan, razorpay_subscription_id, plan_activated_at').eq('id', l.profile_id).maybeSingle(),
      ]);

      // Total attributed revenue (subscriptions + booking commission) — kept for
      // pipeline value. The WIN, though, is gated on subscription only (below).
      let paise = 0;
      const subTimes = [];
      for (const s of subs || []) { paise += toPaise(s.total_charged); if (s.paid_at) subTimes.push(s.paid_at); }
      for (const b of bks || []) { paise += toPaise(b.platform_fee_amount); }

      const won = isPaidSubscriber(profile, subTimes.length > 0);
      const wonAt = subTimes.sort()[0] || profile?.plan_activated_at || null;

      const patch = {
        revenue_paise: paise,
        updated_at: new Date().toISOString(),
        ...conversionPatch({ won, status: l.status, convertedAt: l.converted_at, wonAt }),
      };

      await supabaseAdmin.from('leads').update(patch).eq('id', l.id);
      updated++;
    }
    if (leads.length < PAGE) break;
    from += PAGE;
  }
  return updated;
}

async function run() {
  const linked = await linkLeadsToProfiles();
  const updated = await refreshRevenue();
  // Mirror email-bearing leads into the marketing contacts table so campaigns
  // can reach them. Best-effort — never let it fail the attribution pass.
  let contacts = { upserted: 0, linked: 0 };
  try { contacts = await contactsService.syncLeads(); }
  catch (e) { console.error('[crm] leads→contacts sync failed:', e.message); }
  return { linked, updated, contactsUpserted: contacts.upserted, contactsLinked: contacts.linked };
}

module.exports = { run, linkLeadsToProfiles, refreshRevenue, toPaise, isPaidSubscriber, conversionPatch };
