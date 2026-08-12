/**
 * routeAccountService.js — Razorpay Route Phase 0: create a host LINKED ACCOUNT
 * from an approved KYC submission.
 *
 * Scope (Phase 0 ONLY):
 *   • Bridge host KYC → a Razorpay Route linked account (`acc_...`), so a later
 *     phase can pay hosts via TRANSFER-FROM-BALANCE. This file creates the
 *     destination account; it never moves money and never creates a transfer.
 *
 * Guardrails:
 *   • DORMANT while fee_only_mode is true. fee_only_mode defaults true and fails
 *     safe (platformConfig), so nothing here runs until an admin flips it false on
 *     payout go-live. This mirrors every other host-money path in the codebase.
 *   • Idempotent — a row that already has razorpay_account_id is left untouched.
 *   • Never throws to its caller. The KYC-approval hook is fire-and-forget; a
 *     Route failure must never fail (or roll back) an admin's approval decision.
 *   • Schema-fallback — the v3.95 columns (razorpay_account_id / route_status /
 *     route_error / route_synced_at) may not be applied yet on a given DB. A
 *     "column not found" degrades to a logged no-op, never a crash.
 *
 * The linked account carries IDENTITY only (name / email / phone / PAN). Bank
 * settlement details are configured against the account's Route product in a
 * later step — deliberately out of Phase 0 scope. See docs / PR for the map.
 */
'use strict';

const razorpayConfig = require('./razorpayConfig');
const platformConfig = require('./platformConfig');
const { supabaseAdmin } = require('../config/supabase');
const { decrypt } = require('../utils/kycCrypto');
const { securityLog } = require('../utils/logger');

// Route account defaults. Individual hosts (not registered businesses) are the
// norm on the platform; category/subcategory are Razorpay's MCC-style taxonomy.
// Kept here as constants so Phase 0 has no new admin surface; promote to
// platform_settings later if hosts need per-account business types.
const ACCOUNT_DEFAULTS = Object.freeze({
  type: 'route',
  business_type: 'individual',
  category: 'services',
  subcategory: 'consulting',
});

// Postgres "column does not exist" — the v3.95 migration isn't applied on this DB.
const isMissingColumn = (err) => {
  const msg = (err?.message || err?.details || '').toLowerCase();
  return err?.code === '42703' || /column .* does not exist|could not find the .* column/.test(msg);
};

// Build the Razorpay v2 Accounts create payload from a KYC row. PAN is decrypted
// here (never logged); the caller passes the raw stored row.
function buildAccountPayload(kyc) {
  const contactName = (kyc.full_name || kyc.holder_name || '').trim();
  const pan = decrypt(kyc.pan_number) || undefined;
  const payload = {
    email: kyc.email,
    phone: kyc.phone ? String(kyc.phone) : undefined,
    type: ACCOUNT_DEFAULTS.type,
    // Correlate the linked account back to our host without leaking PII.
    reference_id: `host_${kyc.user_id}`,
    legal_business_name: contactName || kyc.email,
    business_type: ACCOUNT_DEFAULTS.business_type,
    contact_name: contactName || kyc.email,
    profile: {
      category: ACCOUNT_DEFAULTS.category,
      subcategory: ACCOUNT_DEFAULTS.subcategory,
    },
  };
  if (pan) payload.legal_info = { pan };
  return payload;
}

// Persist Route bookkeeping onto the KYC row. Swallows a missing-column error
// (migration not yet applied) so Phase 0 degrades gracefully.
async function persistRouteState(kycId, patch) {
  const { error } = await supabaseAdmin
    .from('kyc_submissions')
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq('id', kycId);
  if (error) {
    if (isMissingColumn(error)) {
      securityLog('route_schema_fallback', { kycId, reason: 'v3.95 columns missing' });
      return;
    }
    throw error;
  }
}

/**
 * Create a Razorpay Route linked account for an approved KYC submission.
 * No-op (returns a reason) when disabled, already linked, or ineligible.
 *
 * @param {object} kyc  the full kyc_submissions row (approved).
 * @returns {Promise<{ ok: boolean, accountId?: string, skipped?: string, error?: string }>}
 */
async function createLinkedAccount(kyc) {
  try {
    if (!kyc || !kyc.id) return { ok: false, skipped: 'no_kyc' };
    if (kyc.status !== 'approved') return { ok: false, skipped: 'not_approved' };
    if (kyc.razorpay_account_id) return { ok: true, accountId: kyc.razorpay_account_id, skipped: 'already_linked' };

    // Dormant until payout go-live. fee_only_mode true → no host money infra runs.
    const { feeOnlyMode } = await platformConfig.getConfig();
    if (feeOnlyMode) return { ok: false, skipped: 'fee_only_mode' };

    if (!(await razorpayConfig.isConfigured())) return { ok: false, skipped: 'razorpay_unconfigured' };
    if (!kyc.email) return { ok: false, skipped: 'missing_email' };

    await persistRouteState(kyc.id, { route_status: 'pending', route_error: null });

    const razorpay = await razorpayConfig.getClient();
    const account = await razorpay.accounts.create(buildAccountPayload(kyc));
    const accountId = account?.id;
    if (!accountId) throw new Error('Razorpay account create returned no id');

    await persistRouteState(kyc.id, {
      razorpay_account_id: accountId,
      route_status: 'created',
      route_error: null,
      route_synced_at: new Date().toISOString(),
    });
    return { ok: true, accountId };
  } catch (err) {
    // Razorpay surfaces a structured { error: { description } }; fall back to message.
    const reason = err?.error?.description || err?.message || 'unknown error';
    securityLog('route_linked_account_error', { kycId: kyc?.id, reason });
    try {
      await persistRouteState(kyc.id, { route_status: 'error', route_error: reason.slice(0, 500) });
    } catch (_) { /* best effort; original error already logged */ }
    return { ok: false, error: reason };
  }
}

module.exports = { createLinkedAccount, buildAccountPayload, ACCOUNT_DEFAULTS };
