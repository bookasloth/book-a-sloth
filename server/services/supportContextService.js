'use strict';

/**
 * supportContextService — the "give support eyes" layer.
 *
 * Read-only join from a support thread's participant (user_id for hosts,
 * guest_phone for guests) to the customer's live record: profile, recent bookings,
 * and — for hosts — listing/activation, KYC STATUS (never PII), and payout state.
 *
 * One place both the admin conversation rail AND (later) the bot call, so nobody
 * has to page-hop to answer "where's my booking / why isn't my listing live".
 *
 * SAFETY:
 *  - Returns KYC status ONLY. The encrypted PAN/Aadhaar/account fields never enter
 *    this payload.
 *  - supabase-js resolves { data, error } and does NOT throw — every read checks
 *    error and degrades that section to null rather than failing the whole rail.
 */

const { supabaseAdmin } = require('../config/supabase');

const shortRef = (id) => (id ? `#${String(id).replace(/-/g, '').slice(0, 8).toUpperCase()}` : null);

// Recent bookings for either side, newest first. Guests key by phone, hosts by id.
async function recentBookings({ userId, phone, isHost }) {
  let q = supabaseAdmin
    .from('bookings')
    .select('id, service_id, scheduled_at, status, payment_status, guest_name')
    .order('scheduled_at', { ascending: false, nullsFirst: false })
    .limit(5);
  q = isHost ? q.eq('host_id', userId || '') : q.eq('guest_phone', phone || '');
  const { data, error } = await q;
  if (error || !data) return [];

  // Best-effort service titles in one follow-up query.
  const ids = [...new Set(data.map((b) => b.service_id).filter(Boolean))];
  let titles = {};
  if (ids.length) {
    const { data: svc } = await supabaseAdmin.from('services').select('id, title').in('id', ids);
    (svc || []).forEach((s) => { titles[s.id] = s.title; });
  }
  return data.map((b) => ({
    ref: shortRef(b.id),
    service: titles[b.service_id] || null,
    guest: b.guest_name || null,
    when: b.scheduled_at || null,
    status: b.status || null,
    payment_status: b.payment_status || null,
  }));
}

// Host-only: listing/activation, KYC status, payout linkage.
async function hostState(userId) {
  const out = { listingActive: null, kyc: null, payoutLinked: null };

  const { data: svc, error: se } = await supabaseAdmin
    .from('services').select('id').eq('host_id', userId).eq('is_active', true).limit(1);
  if (!se) out.listingActive = !!(svc && svc[0]);

  const { data: kyc, error: ke } = await supabaseAdmin
    .from('kyc_submissions')
    .select('status, route_activation_status, razorpay_account_id')
    .eq('user_id', userId).maybeSingle();
  if (!ke && kyc) {
    out.kyc = { status: kyc.status || 'none', activation: kyc.route_activation_status || null };
    out.payoutLinked = !!kyc.razorpay_account_id;
  } else if (!ke) {
    out.kyc = { status: 'none', activation: null };
    out.payoutLinked = false;
  }
  return out;
}

/**
 * @param {{ userId?:string, phone?:string, isHost?:boolean }} p
 * @returns compact, render-ready context — sections degrade to null on error.
 */
async function getSupportContext({ userId, phone, isHost } = {}) {
  const kind = isHost ? 'host' : 'guest';

  let profile = null;
  if (userId) {
    const { data, error } = await supabaseAdmin
      .from('profiles')
      .select('name, plan, plan_expires_at, is_verified, onboarding_completed, phone')
      .eq('id', userId).maybeSingle();
    if (!error && data) {
      profile = {
        name: data.name || null,
        plan: data.plan || null,
        planExpiresAt: data.plan_expires_at || null,
        isVerified: !!data.is_verified,
        onboardingCompleted: !!data.onboarding_completed,
        phone: data.phone || phone || null,
      };
    }
  }
  if (!profile) profile = { name: null, phone: phone || null };

  const bookings = await recentBookings({ userId, phone, isHost });
  const host = isHost && userId ? await hostState(userId) : null;

  return { kind, profile, bookings, host };
}

module.exports = { getSupportContext };
