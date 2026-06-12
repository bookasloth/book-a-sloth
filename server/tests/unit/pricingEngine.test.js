/**
 * tests/unit/pricingEngine.test.js
 *
 * Final commission/fees/payout model (v2.2):
 *   Customer pays  = servicePrice + platformFee + GST(platformFee)
 *   platformFee    = flat configurable (default ₹10), 0 for free services
 *   Razorpay fee   = always vendor-borne (actual recorded fee)
 *   commission     = commissionPercentage % of servicePrice (from plan record)
 *   Vendor payout  = servicePrice − commission − razorpayFee
 */

'use strict';

const {
  calculatePlatformFee,
  calculateGst,
  calculateCommission,
  calculateVendorPayout,
  calculateCustomerTotal,
  computeBreakdown,
} = require('../../lib/pricingEngine');

// ─── calculatePlatformFee ─────────────────────────────────────────────────────
describe('calculatePlatformFee', () => {
  test('flat ₹10 default for any paid service', () => {
    expect(calculatePlatformFee(100)).toBe(10);
    expect(calculatePlatformFee(1)).toBe(10);
    expect(calculatePlatformFee(5000)).toBe(10);
  });
  test('₹0 for a free service', () => {
    expect(calculatePlatformFee(0)).toBe(0);
  });
  test('admin-configurable override is honoured', () => {
    expect(calculatePlatformFee(100, { platformFee: 15 })).toBe(15);
    expect(calculatePlatformFee(100, { platformFee: 0 })).toBe(0);
  });
  test('negative service price throws', () => {
    expect(() => calculatePlatformFee(-1)).toThrow('servicePrice cannot be negative');
  });
});

// ─── calculateGst ─────────────────────────────────────────────────────────────
describe('calculateGst', () => {
  test('18% of ₹10 platform fee = ₹1.80', () => {
    expect(calculateGst(10)).toBe(1.8);
  });
  test('₹0 fee → ₹0 GST', () => {
    expect(calculateGst(0)).toBe(0);
  });
  test('configurable rate', () => {
    expect(calculateGst(10, { gstRate: 0.05 })).toBe(0.5);
  });
});

// ─── calculateCommission ──────────────────────────────────────────────────────
describe('calculateCommission', () => {
  test('5% of ₹100 = ₹5 (free plan)', () => {
    expect(calculateCommission(100, 5)).toBe(5);
  });
  test('0% = ₹0 (paid plans)', () => {
    expect(calculateCommission(100, 0)).toBe(0);
    expect(calculateCommission(5000, 0)).toBe(0);
  });
  test('percentage is flat on full price (no floor, no grace)', () => {
    expect(calculateCommission(500, 5)).toBe(25);
    expect(calculateCommission(1000, 5)).toBe(50);
    expect(calculateCommission(150, 5)).toBe(7.5);
  });
  test('arbitrary admin-set percentage', () => {
    expect(calculateCommission(200, 12.5)).toBe(25);
  });
  test('free service → ₹0', () => {
    expect(calculateCommission(0, 5)).toBe(0);
  });
  test('negative inputs throw', () => {
    expect(() => calculateCommission(-1, 5)).toThrow('servicePrice cannot be negative');
    expect(() => calculateCommission(100, -5)).toThrow('commissionPercentage cannot be negative');
  });
});

// ─── calculateVendorPayout ────────────────────────────────────────────────────
describe('calculateVendorPayout', () => {
  test('free plan ₹100: 100 − 5 − 2.34 = ₹92.66', () => {
    expect(calculateVendorPayout(100, 5, 2.34)).toBe(92.66);
  });
  test('paid plan ₹100: 100 − 0 − 2.34 = ₹97.66', () => {
    expect(calculateVendorPayout(100, 0, 2.34)).toBe(97.66);
  });
  test('razorpay fee defaults to 0 when unknown', () => {
    expect(calculateVendorPayout(500, 25)).toBe(475);
  });
  test('negative fee throws', () => {
    expect(() => calculateVendorPayout(100, 0, -1)).toThrow('razorpayFee cannot be negative');
  });
});

// ─── calculateCustomerTotal ───────────────────────────────────────────────────
describe('calculateCustomerTotal', () => {
  test('₹100 + ₹10 + ₹1.80 = ₹111.80', () => {
    expect(calculateCustomerTotal(100, 10, 1.8)).toBe(111.8);
  });
  test('free service totals ₹0', () => {
    expect(calculateCustomerTotal(0, 0, 0)).toBe(0);
  });
});

// ─── computeBreakdown (end-to-end, matches the spec tables) ───────────────────
describe('computeBreakdown — worked examples from the spec', () => {
  test('Free plan, ₹100 booking, ₹2.34 actual Razorpay fee', () => {
    const b = computeBreakdown({ servicePrice: 100, commissionPercentage: 5, razorpayFee: 2.34 });
    expect(b.platformFee).toBe(10);
    expect(b.gst).toBe(1.8);
    expect(b.commission).toBe(5);
    expect(b.customerTotal).toBe(111.8);
    expect(b.vendorPayout).toBe(92.66);
    expect(b.platformRevenue).toBe(15);   // ₹5 commission + ₹10 platform fee
  });

  test('Paid plan, ₹100 booking, ₹2.34 actual Razorpay fee', () => {
    const b = computeBreakdown({ servicePrice: 100, commissionPercentage: 0, razorpayFee: 2.34 });
    expect(b.commission).toBe(0);
    expect(b.customerTotal).toBe(111.8);
    expect(b.vendorPayout).toBe(97.66);
    expect(b.platformRevenue).toBe(10);   // platform fee only
  });

  test('Razorpay fee unknown at booking time → payout excludes it (finalised later)', () => {
    const b = computeBreakdown({ servicePrice: 100, commissionPercentage: 5 });
    expect(b.razorpayFee).toBe(0);
    expect(b.vendorPayout).toBe(95);      // 100 − 5 − 0; PG fee deducted at capture
  });

  test('Custom platform fee + GST rate flows through', () => {
    const b = computeBreakdown({ servicePrice: 200, commissionPercentage: 5, platformFee: 20, gstRate: 0.18, razorpayFee: 4.72 });
    expect(b.platformFee).toBe(20);
    expect(b.gst).toBe(3.6);
    expect(b.commission).toBe(10);
    expect(b.customerTotal).toBe(223.6);
    expect(b.vendorPayout).toBe(185.28);  // 200 − 10 − 4.72
    expect(b.platformRevenue).toBe(30);
  });
});
