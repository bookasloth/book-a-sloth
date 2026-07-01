// Marketing/performance insights — owned KPI tiles for the admin dashboard.
//
// POSTGRES-FIRST: money + booking + host metrics come straight from our own
// tables (the source of truth), never from analytics events. Traffic/source and
// the visitor-side funnel live in PostHog/GA4 and are reached via launchpad links
// in the UI (a server-side PostHog query API is deferred — see docs).
//
// Auth: gated by requireAdmin('analytics.view') in adminRoutes.
const { supabaseAdmin } = require('../config/supabase');
const { safeError } = require('../utils/httpError');

const DAY = 24 * 60 * 60 * 1000;

const round2 = (n) => Math.round((Number(n) || 0) * 100) / 100;
const round1 = (n) => Math.round((Number(n) || 0) * 10) / 10;

// Gross service value of a paid booking (GMV contribution) — spec D2.
//   primary: customer_total − platform_fee − platform_fee_gst  (= service price)
//   fallback (pre-v2.2 row, customer_total NULL): vendor_amount + commission_applied
// Clamped to ≥0. Reused by BOTH gmv and activation so they cannot diverge.
const bookingGrossValue = (b) => {
  let v;
  if (b.customer_total != null) {
    v = Number(b.customer_total)
      - (Number(b.platform_fee_amount) || 0)
      - (Number(b.platform_fee_gst) || 0);
  } else {
    v = (Number(b.vendor_amount) || 0) + (Number(b.commission_applied) || 0);
  }
  return Math.max(0, round2(v));
};

// Gross value of a paid product purchase (GMV contribution) — spec D3.
const productGrossValue = (p) => Math.max(0, round2(Number(p.amount_paid) || 0));

// Median of a numeric array, 1-decimal; null when empty — spec D6.
const median = (arr) => {
  if (!arr.length) return null;
  const s = [...arr].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  const m = s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
  return round1(m);
};

// Platform revenue on a paid booking = platform fee + commission collected.
// GST is a pass-through liability, not revenue (matches getStats).
const bookingRevenue = (b) =>
  (Number(b.platform_fee_amount) || 0) + (Number(b.commission_applied) || 0);

const getKpis = async (req, res) => {
  try {
    const now = Date.now();
    const since30 = new Date(now - 30 * DAY).toISOString();
    const since60 = new Date(now - 60 * DAY).toISOString();

    // ── Bookings (one scan drives revenue, conversion + booking counts) ──
    // v1.7 fallback: commission_applied may not exist yet (see getStats).
    const FULL_COLS = 'id, host_id, payment_status, platform_fee_amount, platform_fee_gst, commission_applied, vendor_amount, customer_total, created_at';
    const CORE_COLS = 'id, host_id, payment_status, platform_fee_amount, created_at';
    let bookingsRes = await supabaseAdmin.from('bookings').select(FULL_COLS);
    if (bookingsRes.error && /Could not find the|column.*does not exist/i.test(bookingsRes.error.message)) {
      bookingsRes = await supabaseAdmin.from('bookings').select(CORE_COLS);
    }
    if (bookingsRes.error) return safeError(res, bookingsRes.error);
    const bookings = bookingsRes.data || [];
    const paid = bookings.filter((b) => b.payment_status === 'paid');
    const paid30 = paid.filter((b) => b.created_at >= since30);

    const revenueTotal = paid.reduce((s, b) => s + bookingRevenue(b), 0);
    const revenue30    = paid30.reduce((s, b) => s + bookingRevenue(b), 0);
    // Prior 30-day window [60d, 30d) for a growth delta.
    const revenuePrev30 = paid
      .filter((b) => b.created_at >= since60 && b.created_at < since30)
      .reduce((s, b) => s + bookingRevenue(b), 0);

    // ── Product purchases (GMV only; degrade to [] on any error) — spec D3/edge table ──
    let products = [];
    const prodRes = await supabaseAdmin
      .from('product_purchases')
      .select('id, payment_status, amount_paid, platform_fee, created_at');
    if (!prodRes.error) products = (prodRes.data || []).filter((p) => p.payment_status === 'paid');

    // ── GMV (spec D4/D8) ──
    const inWindow = (rows, valfn, lo, hi) =>
      rows
        .filter((x) => x.created_at >= lo && (hi ? x.created_at < hi : true))
        .reduce((s, x) => s + valfn(x), 0);
    const bookingGmvAll = paid.reduce((s, b) => s + bookingGrossValue(b), 0);
    const productGmvAll = products.reduce((s, p) => s + productGrossValue(p), 0);
    const gmvLast30 = inWindow(paid, bookingGrossValue, since30, null)
                    + inWindow(products, productGrossValue, since30, null);
    const gmvPrev30 = inWindow(paid, bookingGrossValue, since60, since30)
                    + inWindow(products, productGrossValue, since60, since30);
    const gmvTotal = round2(bookingGmvAll + productGmvAll);
    // Take-rate uses a GMV-consistent revenue base (booking fee+commission + product fee).
    const productPlatformRev = products.reduce((s, p) => s + (Number(p.platform_fee) || 0), 0);
    const gmvPlatformRevenue = revenueTotal + productPlatformRev;
    const takeRate = gmvTotal > 0 ? round1((gmvPlatformRevenue / gmvTotal) * 100) : 0;

    // ── Hosts + guests (growth tile) ──
    const [hostsRes, guestsRes] = await Promise.all([
      supabaseAdmin.from('profiles').select('id, created_at').eq('role', 'host'),
      supabaseAdmin.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'guest'),
    ]);
    const hosts = hostsRes.data || [];
    const hostsNew30 = hosts.filter((h) => h.created_at >= since30).length;

    res.json({
      // Tile 1 — Revenue + bookings (Postgres truth)
      revenue: {
        total: Math.round(revenueTotal * 100) / 100,
        last30: Math.round(revenue30 * 100) / 100,
        prev30: Math.round(revenuePrev30 * 100) / 100,
      },
      bookings: {
        total: bookings.length,
        paid: paid.length,
        last30: paid30.length,
      },
      // Tile 2 — Conversion (booking→paid, Postgres-only proxy; full visitor
      // funnel = PostHog, surfaced via launchpad until the PH query API lands)
      conversion: {
        created: bookings.length,
        paid: paid.length,
        rate: bookings.length ? Math.round((paid.length / bookings.length) * 1000) / 10 : 0, // %
      },
      gmv: {
        total: gmvTotal,
        last30: round2(gmvLast30),
        prev30: round2(gmvPrev30),
        bookings: round2(bookingGmvAll),
        products: round2(productGmvAll),
        platformRevenue: round2(gmvPlatformRevenue),
        takeRate,
      },
      // Tile 4 — Host growth
      hosts: {
        total: hosts.length,
        new30: hostsNew30,
      },
      guests: { total: guestsRes.count || 0 },
      generatedAt: new Date(now).toISOString(),
    });
  } catch (error) {
    safeError(res, error);
  }
};

module.exports = { getKpis, bookingGrossValue, productGrossValue, median };
