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

const toPaise = (rupees) => Math.round((Number(rupees) || 0) * 100);
const PAGE = 200;

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
      const [{ data: subs }, { data: bks }] = await Promise.all([
        supabaseAdmin.from('subscription_payments').select('total_charged, paid_at').eq('vendor_id', l.profile_id),
        supabaseAdmin.from('bookings').select('platform_fee_amount, paid_at').eq('host_id', l.profile_id).eq('payment_status', 'paid'),
      ]);

      let paise = 0;
      const times = [];
      for (const s of subs || []) { paise += toPaise(s.total_charged); if (s.paid_at) times.push(s.paid_at); }
      for (const b of bks || []) { paise += toPaise(b.platform_fee_amount); if (b.paid_at) times.push(b.paid_at); }

      const patch = { revenue_paise: paise, updated_at: new Date().toISOString() };
      const firstPaid = times.sort()[0] || null;
      if (paise > 0 && firstPaid && !l.converted_at) patch.converted_at = firstPaid;
      // Advance to 'paid' once real money exists (don't regress lost/dnc).
      if (paise > 0 && !['paid', 'lost', 'do_not_contact'].includes(l.status)) patch.status = 'paid';

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
  return { linked, updated };
}

module.exports = { run, linkLeadsToProfiles, refreshRevenue, toPaise };
