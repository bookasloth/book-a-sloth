'use strict';

/**
 * routeOnboardingService.js — host "Set up payouts" onboarding to a Razorpay
 * Route LINKED ACCOUNT. DORMANT until fee_only_mode is false.
 *
 * Razorpay owns the payout KYC (it settles the money, so by law it must verify the
 * recipient). We don't build/hold payout KYC ourselves — we create the host's Route
 * linked account and Razorpay does the verification.
 *
 * Onboarding is MULTI-STEP on Razorpay's side:
 *   1. Create the linked account        POST /v2/accounts (type:'route')   ← THIS FILE
 *   2. Add stakeholder(s)               POST /v2/accounts/:id/stakeholders  ← TODO
 *   3. Product config + bank account    POST /v2/accounts/:id/products      ← TODO
 * The account only becomes usable ('active' here) once KYC + bank are done. We store
 * razorpay_route_status='created' after step 1, and flip to 'active' via
 * syncOnboardingStatus once Razorpay reports the account ready. Paid bookings +
 * payouts are gated on 'active' (routeService.routeActiveForHost), so a half-onboarded
 * host can never take a paid booking.
 *
 * ⚠️ SANDBOX-VERIFY. Route is pending approval — the /v2/accounts payload, the
 * stakeholder/product steps, the SDK method names, and the status→active mapping
 * have NOT been run against a live/sandbox Route account. Validate in the Razorpay
 * sandbox and wire steps 2-3 before flipping fee_only_mode false.
 * Ref: https://razorpay.com/docs/api/payments/route/create-linked-account/
 */

const { supabaseAdmin } = require('../config/supabase');
const platformConfig = require('./platformConfig');
const razorpayConfig = require('./razorpayConfig');
const { securityLog } = require('../utils/logger');

// Host-facing onboarding state.
//   coming_soon — fee-only mode on (payouts not live yet)
//   not_started — Route on, no linked account yet
//   created     — account created, KYC/bank pending (can't receive money yet)
//   active      — fully onboarded, can take paid bookings
async function getOnboardingStatus(hostId) {
  const { feeOnlyMode } = await platformConfig.getConfig();
  if (feeOnlyMode) return { state: 'coming_soon', accountId: null };
  const { data: p } = await supabaseAdmin
    .from('profiles').select('razorpay_route_account_id, razorpay_route_status').eq('id', hostId).single();
  const accountId = p?.razorpay_route_account_id || null;
  if (!accountId) return { state: 'not_started', accountId: null };
  return { state: p?.razorpay_route_status === 'active' ? 'active' : 'created', accountId };
}

// Step 1: create the linked account from the host's profile + our KYC record.
// Returns { accountId, state } or { error }. Idempotent — returns existing if present.
async function createLinkedAccountForHost(hostId) {
  const { feeOnlyMode } = await platformConfig.getConfig();
  if (feeOnlyMode) return { skipped: 'fee_only_mode' };

  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('name, email, phone, profession, razorpay_route_account_id, razorpay_route_status')
    .eq('id', hostId).single();
  if (!profile) return { error: 'host_not_found' };
  if (profile.razorpay_route_account_id) {
    return { accountId: profile.razorpay_route_account_id, state: profile.razorpay_route_status === 'active' ? 'active' : 'created' };
  }

  // Pre-fill legal details from the KYC we already collected (v3.68), so the host
  // doesn't re-enter what we have. PAN drives Razorpay's verification.
  const { data: kyc } = await supabaseAdmin
    .from('kyc_submissions').select('pan_number, holder_name').eq('user_id', hostId).maybeSingle();

  try {
    const rzp = await razorpayConfig.getClient();
    // POST /v2/accounts — business profile only; bank + stakeholder are steps 2-3.
    const payload = {
      email: profile.email,
      phone: profile.phone || undefined,
      type: 'route',
      reference_id: hostId,
      legal_business_name: kyc?.holder_name || profile.name || 'Host',
      business_type: 'individual', // ⚠️ SANDBOX-VERIFY: map real business_type per host
      contact_name: profile.name || kyc?.holder_name || 'Host',
      customer_facing_business_name: profile.name || 'Host',
      profile: {
        category: 'others', // ⚠️ SANDBOX-VERIFY: map profile.profession → a Razorpay category
      },
      legal_info: kyc?.pan_number ? { pan: kyc.pan_number } : undefined,
    };
    const acct = await rzp.accounts.create(payload);
    const accountId = acct?.id || null;
    await supabaseAdmin.from('profiles')
      .update({ razorpay_route_account_id: accountId, razorpay_route_status: 'created', updated_at: new Date().toISOString() })
      .eq('id', hostId);
    return { accountId, state: 'created' };
  } catch (err) {
    securityLog('route_onboarding_create_failed', { host_id: hostId, error: err?.message });
    return { error: err?.message || 'onboarding_failed' };
  }
}

// Poll Razorpay for the account's readiness and flip to 'active' when ready.
// ⚠️ SANDBOX-VERIFY the exact "ready" signal (status/activation fields differ by
// onboarding path). Non-fatal.
async function syncOnboardingStatus(hostId) {
  const { feeOnlyMode } = await platformConfig.getConfig();
  if (feeOnlyMode) return { state: 'coming_soon' };
  const { data: p } = await supabaseAdmin
    .from('profiles').select('razorpay_route_account_id, razorpay_route_status').eq('id', hostId).single();
  if (!p?.razorpay_route_account_id) return { state: 'not_started' };
  if (p.razorpay_route_status === 'active') return { state: 'active', accountId: p.razorpay_route_account_id };
  try {
    const rzp = await razorpayConfig.getClient();
    const acct = await rzp.accounts.fetch(p.razorpay_route_account_id); // GET /v2/accounts/:id
    // ⚠️ SANDBOX-VERIFY: confirm which field(s) signal a fully-onboarded, payable
    // account. Using `status === 'activated'` as the placeholder signal.
    const ready = acct?.status === 'activated';
    if (ready) {
      await supabaseAdmin.from('profiles')
        .update({ razorpay_route_status: 'active', updated_at: new Date().toISOString() })
        .eq('id', hostId);
      return { state: 'active', accountId: p.razorpay_route_account_id };
    }
    return { state: 'created', accountId: p.razorpay_route_account_id };
  } catch (err) {
    securityLog('route_onboarding_sync_failed', { host_id: hostId, error: err?.message });
    return { state: 'created', accountId: p.razorpay_route_account_id, error: err?.message };
  }
}

module.exports = { getOnboardingStatus, createLinkedAccountForHost, syncOnboardingStatus };
