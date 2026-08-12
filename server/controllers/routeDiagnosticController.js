'use strict';
/**
 * routeDiagnosticController.js — TEMPORARY diagnostic (Phase 2 pre-check).
 *
 * Answers one question: is the Razorpay "payment-linked HELD transfer" capability
 * (POST /payments/:id/transfers with on_hold) enabled on this merchant account?
 * The direct transfer-from-balance API is NOT enabled; this checks the *other*
 * mechanism, which the auto-payout-on-completion model would use.
 *
 * Uses the server's already-configured LIVE keys (razorpayConfig) — no secret
 * handling by anyone. Writes NOTHING to the DB. Creates at most one small HELD
 * transfer (₹5, held ~26h) to a linked account you own, which is reversible.
 *
 * DELETE this file + its route after the check. It is not part of the product.
 */
const razorpayConfig = require('../services/razorpayConfig');

// POST /api/admin/route/test-held-transfer
// body (all optional): { payment_id, account_id, amount_paise }
const testHeldTransfer = async (req, res) => {
  const paymentId = String(req.body?.payment_id || 'pay_TOpOatknquNHOP').trim();
  const account = String(req.body?.account_id || 'acc_TOoIj6KzqkdYaO').trim();
  const amountPaise = Number(req.body?.amount_paise) > 0 ? Math.floor(Number(req.body.amount_paise)) : 500;
  const onHoldUntil = Math.floor(Date.now() / 1000) + 26 * 3600; // ~+26h

  try {
    const razorpay = await razorpayConfig.getClient();
    const result = await razorpay.payments.transfer(paymentId, {
      transfers: [{
        account, amount: amountPaise, currency: 'INR',
        on_hold: true, on_hold_until: onHoldUntil,
        notes: { diagnostic: 'held-transfer-enablement-check' },
      }],
    });
    const t = result?.items?.[0] || result;
    return res.json({
      enabled: true,
      transfer_id: t?.id || null,
      on_hold: t?.on_hold,
      status: t?.status,
      recipient: t?.recipient || account,
      message: 'ENABLED — payment-linked held transfers work on this account. Auto-payout model is viable.',
    });
  } catch (e) {
    return res.json({
      enabled: false,
      statusCode: e?.statusCode || null,
      description: e?.error?.description || e?.message || 'unknown error',
      code: e?.error?.code || null,
      field: e?.error?.field || null,
      message: 'Not created — see description (e.g. "feature not enabled" = capability gated too).',
    });
  }
};

module.exports = { testHeldTransfer };
