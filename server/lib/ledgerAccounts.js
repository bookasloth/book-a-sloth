/**
 * ledgerAccounts.js — account CODE constants, mirrors the v2.8 seed.
 * Codes (not uuids) cross the JS↔SQL boundary; the RPC resolves code → id.
 */
'use strict';

const ACCOUNTS = Object.freeze({
  BANK:                 '1000',
  RAZORPAY_RECEIVABLE:  '1100',
  VENDOR_PAYABLES:      '2000',
  GST_PAYABLE:          '2100',
  REFUND_LIABILITY:     '2200',
  PLATFORM_FEE_REVENUE: '4000',
  COMMISSION_REVENUE:   '4100',
  SUBSCRIPTION_REVENUE: '4200',
  RZP_CHARGES_ORDERS:   '5000',
  RZP_CHARGES_SUBS:     '5100',
  SETTLEMENT_CHARGES:   '5200',
  REFUND_LOSSES:        '5300',
  REFERRAL_EXPENSE:     '5400',
});

module.exports = { ACCOUNTS };
