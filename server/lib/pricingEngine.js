/**
 * server/lib/pricingEngine.js
 *
 * Single source of truth for all money math. Pure functions, no DB access,
 * no side effects. Configuration (platform fee, GST rate) and the commission
 * percentage are injected by the caller — NOTHING about plans or rates is
 * hardcoded here (commission % comes from the vendor's subscription plan row).
 *
 * The money model (final, v3):
 *
 *   Customer pays  = servicePrice + platformFee + gstOnPlatformFee
 *   platformFee    = flat, admin-configurable (default ₹10); 0 for free services
 *   gst            = gstRate × platformFee   (tax liability, NOT platform revenue)
 *   razorpayFee    = ALWAYS borne by the vendor; the ACTUAL fee Razorpay charged
 *   commission     = commissionPercentage × servicePrice   (from plan record)
 *   commissionGst  = gstRate × commission   (vendor-borne GST on the platform's
 *                    commission service — PRD compliance; pass-through liability)
 *   Vendor payout  = servicePrice − commission − commissionGst − razorpayFee
 *
 *   Free plan, ₹1000:  payout = 1000 − 50 − 9 − 23.60 = 917.40 ; platform earns 50 + 10 = 60
 *   Paid plan, ₹1000:  payout = 1000 − 0 − 0 − 23.60 = 976.40 ; platform earns 10
 *   (All GST collected belongs to the government, not the platform)
 *
 *   Subscriptions (PRD §5.2): GST is charged ON TOP of the plan price —
 *   ₹999 plan → GST ₹179.82 → total charged ₹1,178.82 (computeSubscriptionBreakdown).
 */

'use strict';

const DEFAULTS = Object.freeze({
  platformFee: 10,   // ₹ flat, overridden by platform_settings.platform_fee
  gstRate: 0.18,     // 18% GST on the platform fee
});

const round2 = (n) => Math.round((Number(n) + Number.EPSILON) * 100) / 100;

const assertNonNegative = (value, label) => {
  if (typeof value !== 'number' || Number.isNaN(value) || value < 0) {
    throw new Error(`${label} cannot be negative`);
  }
};

// ─── Platform fee (charged to the customer, on top of the service price) ──────
/**
 * @param {number} servicePrice  service amount (≥ 0)
 * @param {object} [opts]        { platformFee } override (e.g. from settings)
 * @returns {number} flat platform fee in ₹ (0 for a free service)
 */
function calculatePlatformFee(servicePrice, opts = {}) {
  assertNonNegative(servicePrice, 'servicePrice');
  if (servicePrice === 0) return 0;
  const fee = opts.platformFee != null ? Number(opts.platformFee) : DEFAULTS.platformFee;
  assertNonNegative(fee, 'platformFee');
  return round2(fee);
}

// ─── GST on the platform fee (collected from customer, owed to government) ────
/**
 * @param {number} platformFee  flat platform fee (≥ 0)
 * @param {object} [opts]       { gstRate } override (e.g. from settings)
 * @returns {number} GST amount in ₹
 */
function calculateGst(platformFee, opts = {}) {
  assertNonNegative(platformFee, 'platformFee');
  const rate = opts.gstRate != null ? Number(opts.gstRate) : DEFAULTS.gstRate;
  assertNonNegative(rate, 'gstRate');
  return round2(platformFee * rate);
}

// ─── Commission (platform's cut, from the vendor's plan record) ──────────────
/**
 * @param {number} servicePrice          service amount (≥ 0)
 * @param {number} commissionPercentage  e.g. 5 for 5% (read from plan; 0 for paid)
 * @returns {number} commission in ₹
 */
function calculateCommission(servicePrice, commissionPercentage) {
  assertNonNegative(servicePrice, 'servicePrice');
  const pct = Number(commissionPercentage);
  if (Number.isNaN(pct) || pct < 0) throw new Error('commissionPercentage cannot be negative');
  return round2(servicePrice * (pct / 100));
}

// ─── GST on the commission (vendor-borne; platform's GST on its service) ─────
/**
 * @param {number} commission  commission amount (₹)
 * @param {object} [opts]      { gstRate } override (default 18%)
 * @returns {number} commission GST in ₹
 */
function calculateCommissionGst(commission, opts = {}) {
  assertNonNegative(commission, 'commission');
  const rate = opts.gstRate != null ? Number(opts.gstRate) : DEFAULTS.gstRate;
  assertNonNegative(rate, 'gstRate');
  return round2(commission * rate);
}

// ─── Vendor payout (commission GST + Razorpay fee always vendor-borne) ───────
/**
 * @param {number} servicePrice   service amount
 * @param {number} commission     platform commission (₹)
 * @param {number} [commissionGst] 18% GST on the commission (₹), vendor-borne
 * @param {number} [razorpayFee]  ACTUAL Razorpay fee+tax total (₹), vendor-borne
 * @returns {number} net amount the vendor receives in ₹
 */
function calculateVendorPayout(servicePrice, commission, commissionGst = 0, razorpayFee = 0) {
  assertNonNegative(servicePrice, 'servicePrice');
  assertNonNegative(commission, 'commission');
  assertNonNegative(commissionGst, 'commissionGst');
  assertNonNegative(razorpayFee, 'razorpayFee');
  return round2(servicePrice - commission - commissionGst - razorpayFee);
}

// ─── Customer total (what is actually charged) ───────────────────────────────
/**
 * @param {number} servicePrice  service amount
 * @param {number} platformFee   flat platform fee (₹)
 * @param {number} gst           GST on the platform fee (₹)
 * @returns {number} total charged to the customer in ₹
 */
function calculateCustomerTotal(servicePrice, platformFee, gst) {
  assertNonNegative(servicePrice, 'servicePrice');
  assertNonNegative(platformFee, 'platformFee');
  assertNonNegative(gst, 'gst');
  return round2(servicePrice + platformFee + gst);
}

/**
 * Convenience: compute the full money breakdown for a booking in one call.
 * razorpayFee defaults to 0 (unknown until payment capture).
 *
 * @returns {{ servicePrice, platformFee, gst, commission, commissionGst,
 *             razorpayFee, customerTotal, vendorPayout, platformRevenue }}
 */
function computeBreakdown({ servicePrice, commissionPercentage, platformFee, gstRate, razorpayFee = 0 }) {
  const fee = calculatePlatformFee(servicePrice, { platformFee });
  const gst = calculateGst(fee, { gstRate });
  const commission = calculateCommission(servicePrice, commissionPercentage);
  const commissionGst = calculateCommissionGst(commission, { gstRate });
  const vendorPayout = calculateVendorPayout(servicePrice, commission, commissionGst, razorpayFee);
  const customerTotal = calculateCustomerTotal(servicePrice, fee, gst);
  return {
    servicePrice: round2(servicePrice),
    platformFee: fee,
    gst,
    commission,
    commissionGst,
    razorpayFee: round2(razorpayFee),
    customerTotal,
    vendorPayout,
    // Platform keeps commission + platform fee. All GST is pass-through liability.
    platformRevenue: round2(commission + fee),
  };
}

// ─── Subscription breakdown (GST charged ON TOP of plan price — PRD §5.2) ────
function computeSubscriptionBreakdown({ planPrice, gstRate }) {
  assertNonNegative(planPrice, 'planPrice');
  const rate = gstRate != null ? Number(gstRate) : DEFAULTS.gstRate;
  assertNonNegative(rate, 'gstRate');
  const gstAmount = round2(planPrice * rate);
  return {
    planPrice: round2(planPrice),
    gstAmount,
    totalCharged: round2(planPrice + gstAmount),
  };
}

module.exports = {
  DEFAULTS,
  calculatePlatformFee,
  calculateGst,
  calculateCommission,
  calculateCommissionGst,
  calculateVendorPayout,
  calculateCustomerTotal,
  computeBreakdown,
  computeSubscriptionBreakdown,
  round2,
};
