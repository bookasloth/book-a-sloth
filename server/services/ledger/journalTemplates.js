/**
 * journalTemplates.js — pure builders of balanced journal lines.
 * No DB, no side effects. Output shape consumed by postingService:
 *   { description, lines: [{ account_code, debit, credit, vendor_id?, order_item_id?, subscription_payment_id? }] }
 *
 * Order-payment template (deviation from PRD §11.1, documented in the plan):
 * gross receivable + same-entry gateway-fee relief, so Razorpay Receivable
 * always equals the net cash Razorpay will remit, gateway charges are visible
 * on the 5000 debit side, and the expense nets 0 (vendor bears the fee).
 */
'use strict';

const { ACCOUNTS } = require('../../lib/ledgerAccounts');
const { round2 } = require('../../lib/pricingEngine');

const line = (account_code, side, amount, tags = {}) => ({
  account_code,
  debit:  side === 'debit'  ? round2(amount) : 0,
  credit: side === 'credit' ? round2(amount) : 0,
  ...tags,
});

/** ORDER_PAYMENT — from the booking's immutable snapshot (v2.8 columns). */
function orderPaymentEntry(snapshot) {
  const tags = { vendor_id: snapshot.host_id, order_item_id: snapshot.booking_id };
  const gatewayTotal = round2(Number(snapshot.razorpay_fee_actual || 0) + Number(snapshot.razorpay_tax_actual || 0));
  const gstTotal = round2(Number(snapshot.platform_fee_gst || 0) + Number(snapshot.commission_gst || 0));

  const lines = [
    line(ACCOUNTS.RAZORPAY_RECEIVABLE, 'debit', snapshot.customer_total, tags),
    line(ACCOUNTS.VENDOR_PAYABLES, 'credit', snapshot.vendor_amount, tags),
  ];
  if (Number(snapshot.platform_fee_amount) > 0) {
    lines.push(line(ACCOUNTS.PLATFORM_FEE_REVENUE, 'credit', snapshot.platform_fee_amount, tags));
  }
  if (gstTotal > 0) lines.push(line(ACCOUNTS.GST_PAYABLE, 'credit', gstTotal, tags));
  if (Number(snapshot.commission_applied) > 0) {
    lines.push(line(ACCOUNTS.COMMISSION_REVENUE, 'credit', snapshot.commission_applied, tags));
  }
  if (gatewayTotal > 0) {
    // Gateway deducts its fee from the remittance (relieve receivable)…
    lines.push(line(ACCOUNTS.RZP_CHARGES_ORDERS, 'debit', gatewayTotal, tags));
    lines.push(line(ACCOUNTS.RAZORPAY_RECEIVABLE, 'credit', gatewayTotal, tags));
    // …and the vendor bears it (already netted out of vendor_amount).
    lines.push(line(ACCOUNTS.RZP_CHARGES_ORDERS, 'credit', gatewayTotal, tags));
  }
  return {
    description: `Order payment — booking ${snapshot.booking_id}`,
    lines,
  };
}

/** SUBSCRIPTION_PAYMENT — gateway fee is a PLATFORM expense (PRD §5.3/§11.3). */
function subscriptionPaymentEntry(payment) {
  const tags = { vendor_id: payment.vendor_id, subscription_payment_id: payment.id };
  const gatewayTotal = round2(Number(payment.razorpay_fee || 0) + Number(payment.razorpay_tax || 0));

  const lines = [
    line(ACCOUNTS.RAZORPAY_RECEIVABLE, 'debit', payment.total_charged, tags),
    line(ACCOUNTS.SUBSCRIPTION_REVENUE, 'credit', payment.plan_price, tags),
  ];
  if (Number(payment.gst_amount) > 0) lines.push(line(ACCOUNTS.GST_PAYABLE, 'credit', payment.gst_amount, tags));
  if (gatewayTotal > 0) {
    lines.push(line(ACCOUNTS.RZP_CHARGES_SUBS, 'debit', gatewayTotal, tags));
    lines.push(line(ACCOUNTS.RAZORPAY_RECEIVABLE, 'credit', gatewayTotal, tags));
  }
  return {
    description: `Subscription payment — ${payment.plan_type || 'plan'} by vendor ${payment.vendor_id}`,
    lines,
  };
}

/** BANK_TRANSFER — Razorpay settlement remitted to the bank (PRD §11.6). */
function bankTransferEntry({ amount, reference }) {
  return {
    description: `Razorpay → bank transfer ${reference || ''}`.trim(),
    lines: [
      line(ACCOUNTS.BANK, 'debit', amount),
      line(ACCOUNTS.RAZORPAY_RECEIVABLE, 'credit', amount),
    ],
  };
}

/** ADJUSTMENT — admin-supplied balanced lines (validated again by the RPC). */
function adjustmentEntry({ description, lines }) {
  return { description: description || 'Manual adjustment', lines };
}

/** REVERSAL — mirror of an existing entry's lines. */
function reversalEntry(original) {
  return {
    description: `Reversal of ${original.journal_number}`,
    lines: original.lines.map((l) => ({
      ...l,
      debit: l.credit,
      credit: l.debit,
    })),
  };
}

module.exports = {
  orderPaymentEntry,
  subscriptionPaymentEntry,
  bankTransferEntry,
  adjustmentEntry,
  reversalEntry,
};
