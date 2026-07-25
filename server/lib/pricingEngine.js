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
  gstRate: 0.18,     // 18% GST — applied to platform fee, commission, and subscriptions
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

// ════════════════════════════════════════════════════════════════════════════
// MERCHANT-OF-RECORD MODEL (docs/payment-model.md v3)
// ════════════════════════════════════════════════════════════════════════════
//
// A DIFFERENT model from everything above. Here Book A Sloth is the SELLER: the
// host supplies TO us, we sell TO the guest. The host states what he wants to
// EARN (E); we add our charges and GST on top to reach the guest price. This
// inverts the legacy model, where `servicePrice` was the guest-facing price and
// the fee was added visibly on top.
//
//   V = E + bookingCharge                 taxable value of OUR sale
//   G = V + gstAmount   (= V × (1+rate))  what the guest pays
//   commission = E × commissionRate       0 on paid plans
//   pgCharge   = absorbsPg ? 0 : G × pgRate
//   H = E − commission − pgCharge          what the host receives (his consideration)
//   platformMargin = bookingCharge + commission + pgCharge   (GROSS — before the
//                    ACTUAL gateway fee, which is deducted at capture like the
//                    legacy razorpayFee, so realised margin on a card booking is
//                    lower than on UPI)
//
//   Host+/Studio, E=₹1000, 18%:  guest ₹1191.80, H ₹970.20, margin ₹39.80
//   Starter,      E=₹1000, 18%:  guest ₹1191.80, H ₹950.00, margin ₹60.00
//
// RATES ARE FRACTIONS: gstRate 0.18, commissionRate 0.05, pgRate 0.025. (The
// legacy functions above take a percentage NUMBER for commission — do not mix.)
//
// gstRate is INJECTED, never hardcoded: an exempt category is simply gstRate 0.
// Category treatment (taxable / exempt / rcm), the rate, and the SAC live in
// service_categories and are resolved by the caller — this stays pure.
//
// NOT WIRED YET. The booking/payment controllers still call the legacy
// computeBreakdown until the host "target earning" UI (Phase 4) and checkout
// (Phase 5) land. ponytail: delete the legacy functions above once those callers
// move; kept side-by-side only for the transition, NOT as a permanent dual engine.

const DEFAULT_BOOKING_CHARGE = 10; // ₹ flat, overridden by subscription_plans.limits

/**
 * Full money breakdown for a merchant-of-record booking.
 *
 * @param {object}  p
 * @param {number}  p.targetEarning     E — what the host wants to earn (≥ 0)
 * @param {number}  [p.bookingCharge]   flat ₹ charge added to taxable value (default 10)
 * @param {number}  [p.commissionRate]  FRACTION, e.g. 0.05 (Starter) / 0 (paid). Default 0.
 * @param {number}  [p.pgRate]          FRACTION, e.g. 0.025. Default 0.
 * @param {boolean} [p.absorbsPg]       true → we bear processing (Starter); pgCharge = 0
 * @param {number}  [p.gstRate]         FRACTION, e.g. 0.18; 0 for an exempt category. Default 0.18.
 * @returns {{ targetEarning, bookingCharge, commission, pgCharge, hostConsideration,
 *             taxableValue, gstAmount, guestTotal, platformMargin }}
 */
function computeMorBreakdown({
  targetEarning,
  bookingCharge = DEFAULT_BOOKING_CHARGE,
  commissionRate = 0,
  pgRate = 0,
  absorbsPg = false,
  gstRate = DEFAULTS.gstRate,
}) {
  assertNonNegative(targetEarning, 'targetEarning');
  assertNonNegative(bookingCharge, 'bookingCharge');
  assertNonNegative(commissionRate, 'commissionRate');
  assertNonNegative(pgRate, 'pgRate');
  assertNonNegative(gstRate, 'gstRate');

  // Free service: no charge, no commission, no processing, no tax. Hard guard so
  // a ₹0 booking never accrues the flat booking charge (payment-model.md Scenario 5).
  if (Number(targetEarning) === 0) {
    return {
      targetEarning: 0, bookingCharge: 0, commission: 0, pgCharge: 0,
      hostConsideration: 0, taxableValue: 0, gstAmount: 0, guestTotal: 0,
      platformMargin: 0,
    };
  }

  const taxableValue = round2(Number(targetEarning) + Number(bookingCharge));
  const gstAmount    = round2(taxableValue * gstRate);
  const guestTotal   = round2(taxableValue + gstAmount);
  const commission   = round2(Number(targetEarning) * commissionRate);
  const pgCharge     = absorbsPg ? 0 : round2(guestTotal * pgRate);
  const hostConsideration = round2(Number(targetEarning) - commission - pgCharge);
  const platformMargin    = round2(Number(bookingCharge) + commission + pgCharge);

  return {
    targetEarning: round2(targetEarning),
    bookingCharge: round2(bookingCharge),
    commission,
    pgCharge,
    hostConsideration,
    taxableValue,
    gstAmount,
    guestTotal,
    // GROSS margin — the ACTUAL gateway fee is deducted at capture, so realised
    // margin on a card booking is lower than on zero-MDR UPI.
    platformMargin,
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
  computeMorBreakdown,
  computeSubscriptionBreakdown,
  round2,
};
