'use strict';
/**
 * routeAccountService — Razorpay Route Phase 0 linked-account bridge.
 *
 * Guarantees under test (from the service header):
 *   • DORMANT while fee_only_mode is true (the safe default) — no Razorpay call.
 *   • Idempotent — an already-linked KYC row is never re-created.
 *   • Never throws — a Razorpay failure returns { ok:false } and marks route_status
 *     'error' without bubbling up (KYC approval must never roll back).
 *   • PAN is decrypted into the payload (real AES round-trip, kycCrypto not mocked).
 */
jest.mock('../../config/supabase', () => ({ supabaseAdmin: { from: jest.fn() } }));
jest.mock('../../services/razorpayConfig', () => ({
  isConfigured: jest.fn(() => Promise.resolve(true)),
  getClient: jest.fn(),
}));
jest.mock('../../services/platformConfig', () => ({ getConfig: jest.fn() }));
jest.mock('../../utils/logger', () => ({ securityLog: jest.fn() }));

const { supabaseAdmin } = require('../../config/supabase');
const razorpayConfig = require('../../services/razorpayConfig');
const platformConfig = require('../../services/platformConfig');
const { encrypt } = require('../../utils/kycCrypto');
const svc = require('../../services/routeAccountService');

const USER = 'aaaaaaaa-1111-4111-8111-aaaaaaaaaaaa';

// Capture the last update() patch so tests can assert on persisted route state.
let lastUpdate;
const wireUpdateChain = ({ error = null } = {}) => {
  lastUpdate = null;
  supabaseAdmin.from.mockImplementation(() => {
    const c = {};
    c.update = jest.fn((patch) => { lastUpdate = patch; return c; });
    c.eq = jest.fn(() => Promise.resolve({ error }));
    return c;
  });
};

const approvedKyc = (over = {}) => ({
  id: 'kyc-1',
  user_id: USER,
  status: 'approved',
  full_name: 'Asha Rao',
  email: 'asha@example.com',
  phone: '9876543210',
  pan_number: encrypt('ABCDE1234F'),
  holder_name: 'Asha Rao',
  razorpay_account_id: null,
  ...over,
});

beforeEach(() => {
  jest.clearAllMocks();
  platformConfig.getConfig.mockResolvedValue({ feeOnlyMode: false });
  wireUpdateChain();
});

describe('createLinkedAccount gating', () => {
  test('no-ops while fee_only_mode is true — never calls Razorpay', async () => {
    platformConfig.getConfig.mockResolvedValue({ feeOnlyMode: true });
    const res = await svc.createLinkedAccount(approvedKyc());
    expect(res).toEqual({ ok: false, skipped: 'fee_only_mode' });
    expect(razorpayConfig.getClient).not.toHaveBeenCalled();
  });

  test('skips a non-approved submission', async () => {
    const res = await svc.createLinkedAccount(approvedKyc({ status: 'pending' }));
    expect(res.skipped).toBe('not_approved');
    expect(razorpayConfig.getClient).not.toHaveBeenCalled();
  });

  test('is idempotent — already-linked row is left untouched', async () => {
    const res = await svc.createLinkedAccount(approvedKyc({ razorpay_account_id: 'acc_existing' }));
    expect(res).toEqual({ ok: true, accountId: 'acc_existing', skipped: 'already_linked' });
    expect(razorpayConfig.getClient).not.toHaveBeenCalled();
  });
});

describe('createLinkedAccount happy path', () => {
  test('creates the account, stores the id, marks route_status created', async () => {
    const create = jest.fn(() => Promise.resolve({ id: 'acc_NEW123' }));
    razorpayConfig.getClient.mockResolvedValue({ accounts: { create } });

    const res = await svc.createLinkedAccount(approvedKyc());

    expect(res).toEqual({ ok: true, accountId: 'acc_NEW123' });
    // Payload maps KYC → Razorpay, with PAN decrypted and a PII-free reference_id.
    const payload = create.mock.calls[0][0];
    expect(payload.email).toBe('asha@example.com');
    expect(payload.type).toBe('route');
    expect(payload.reference_id).toBe(`host_${USER}`);
    expect(payload.legal_info.pan).toBe('ABCDE1234F');
    // Final persisted patch records the created account.
    expect(lastUpdate).toMatchObject({ razorpay_account_id: 'acc_NEW123', route_status: 'created' });
  });
});

describe('createLinkedAccount failure handling', () => {
  test('a Razorpay error is swallowed and recorded as route_status error', async () => {
    const create = jest.fn(() => Promise.reject({ error: { description: 'PAN invalid' } }));
    razorpayConfig.getClient.mockResolvedValue({ accounts: { create } });

    const res = await svc.createLinkedAccount(approvedKyc());

    expect(res).toEqual({ ok: false, error: 'PAN invalid' });
    expect(lastUpdate).toMatchObject({ route_status: 'error', route_error: 'PAN invalid' });
  });

  test('missing v3.95 columns degrade to a no-op, still no throw', async () => {
    wireUpdateChain({ error: { code: '42703', message: 'column "route_status" does not exist' } });
    const create = jest.fn(() => Promise.resolve({ id: 'acc_NEW' }));
    razorpayConfig.getClient.mockResolvedValue({ accounts: { create } });

    const res = await svc.createLinkedAccount(approvedKyc());
    expect(res).toEqual({ ok: true, accountId: 'acc_NEW' });
  });
});
