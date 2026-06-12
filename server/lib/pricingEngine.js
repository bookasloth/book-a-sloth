/**
 * server/lib/pricingEngine.js
 *
 * Single source of truth for all money math. Pure functions, no DB access,
 * no side effects. Configuration (platform fee, GST rate) and the commission
 * percentage are injected by the caller — NOTHING about plans or rates is
 * hardcoded here (commission % comes from the vendor's subscription plan row).
 *
 * The money model (final, v2.2):
 *
 *   Customer pays  = servicePrice + platformFee + gstOnPlatformFee
 *   platformFee    = flat, admin-configurable (default ₹10); 0 for free services
 *   gst            = gstRate × platformFee   (tax liability, NOT platform revenue)
 *   razorpayFee    = ALWAYS borne by the vendor; the ACTUAL fee Razorpay charged
 *   commission     = commissionPercentage × servicePrice   (from plan record)
 *   Vendor payout  = servicePrice − commission − razorpayFee
 *
 *   Free plan, ₹100:  payout = 100 − 5 − 2.34 = 92.66 ; platform earns 5 + 10 = 15
 *   Paid plan, ₹100:  payout = 100 − 0 − 2.34 = 97.66 ; platform earns 10
 *   (GST ₹1.80 collected from customer belongs to the government, not the platform)
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

// ─── Vendor payout (Razorpay fee always vendor-borne) ────────────────────────
/**
 * @param {number} servicePrice  service amount
 * @param {number} commission    platform commission (₹)
 * @param {number} [razorpayFee] ACTUAL Razorpay fee (₹), vendor-borne. 0 if unknown.
 * @returns {number} net amount the vendor receives in ₹
 */
function calculateVendorPayout(servicePrice, commission, razorpayFee = 0) {
  assertNonNegative(servicePrice, 'servicePrice');
  assertNonNegative(commission, 'commission');
  assertNonNegative(razorpayFee, 'razorpayFee');
  return round2(servicePrice - commission - razorpayFee);
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
 * @returns {{ servicePrice, platformFee, gst, commission, razorpayFee,
 *             customerTotal, vendorPayout, platformRevenue }}
 */
function computeBreakdown({ servicePrice, commissionPercentage, platformFee, gstRate, razorpayFee = 0 }) {
  const fee = calculatePlatformFee(servicePrice, { platformFee });
  const gst = calculateGst(fee, { gstRate });
  const commission = calculateCommission(servicePrice, commissionPercentage);
  const vendorPayout = calculateVendorPayout(servicePrice, commission, razorpayFee);
  const customerTotal = calculateCustomerTotal(servicePrice, fee, gst);
  return {
    servicePrice: round2(servicePrice),
    platformFee: fee,
    gst,
    commission,
    razorpayFee: round2(razorpayFee),
    customerTotal,
    vendorPayout,
    // Platform keeps the commission + platform fee. GST is a pass-through liability.
    platformRevenue: round2(commission + fee),
  };
}

module.exports = {
  DEFAULTS,
  calculatePlatformFee,
  calculateGst,
  calculateCommission,
  calculateVendorPayout,
  calculateCustomerTotal,
  computeBreakdown,
  round2,
};
