'use strict';
/**
 * routeOnboardingService.test.js — host payout onboarding state machine + the
 * fee-only dormancy guarantee. Razorpay's account API is sandbox-verified
 * separately; here we prove state mapping and that nothing fires under fee-only.
 */

const mockGetConfig = jest.fn();
const mockCreate = jest.fn();
const mockFetch = jest.fn();
const mockFrom = jest.fn();

jest.mock('../../config/supabase', () => ({ supabaseAdmin: { from: (...a) => mockFrom(...a) } }));
jest.mock('../../services/platformConfig', () => ({ getConfig: (...a) => mockGetConfig(...a) }));
jest.mock('../../services/razorpayConfig', () => ({
  getClient: async () => ({ accounts: { create: (...a) => mockCreate(...a), fetch: (...a) => mockFetch(...a) } }),
}));
jest.mock('../../utils/logger', () => ({ securityLog: jest.fn() }));

const svc = require('../../services/routeOnboardingService');

// profiles.single() → given row; kyc_submissions.maybeSingle() → given kyc.
const wire = (profileRow, kycRow = null, updateSpy = jest.fn(() => ({ eq: async () => ({}) }))) => {
  mockFrom.mockImplementation((table) => {
    if (table === 'kyc_submissions') return { select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: kycRow }) }) }) };
    return {
      select: () => ({ eq: () => ({ single: async () => ({ data: profileRow }) }) }),
      update: updateSpy,
    };
  });
  return updateSpy;
};

beforeEach(() => jest.clearAllMocks());

describe('getOnboardingStatus', () => {
  test('coming_soon while fee-only mode is on', async () => {
    mockGetConfig.mockResolvedValue({ feeOnlyMode: true });
    expect(await svc.getOnboardingStatus('h1')).toEqual({ state: 'coming_soon', accountId: null });
  });
  test('not_started when Route on but no account', async () => {
    mockGetConfig.mockResolvedValue({ feeOnlyMode: false });
    wire({ razorpay_route_account_id: null, razorpay_route_status: 'none' });
    expect(await svc.getOnboardingStatus('h1')).toEqual({ state: 'not_started', accountId: null });
  });
  test('created when account exists but not active', async () => {
    mockGetConfig.mockResolvedValue({ feeOnlyMode: false });
    wire({ razorpay_route_account_id: 'acc_1', razorpay_route_status: 'created' });
    expect(await svc.getOnboardingStatus('h1')).toEqual({ state: 'created', accountId: 'acc_1' });
  });
  test('active when fully onboarded', async () => {
    mockGetConfig.mockResolvedValue({ feeOnlyMode: false });
    wire({ razorpay_route_account_id: 'acc_1', razorpay_route_status: 'active' });
    expect(await svc.getOnboardingStatus('h1')).toEqual({ state: 'active', accountId: 'acc_1' });
  });
});

describe('createLinkedAccountForHost', () => {
  test('no-op under fee-only mode (no Razorpay call)', async () => {
    mockGetConfig.mockResolvedValue({ feeOnlyMode: true });
    expect(await svc.createLinkedAccountForHost('h1')).toEqual({ skipped: 'fee_only_mode' });
    expect(mockCreate).not.toHaveBeenCalled();
  });

  test('idempotent: returns existing account, no duplicate create', async () => {
    mockGetConfig.mockResolvedValue({ feeOnlyMode: false });
    wire({ name: 'A', email: 'a@x.com', razorpay_route_account_id: 'acc_1', razorpay_route_status: 'created' });
    const r = await svc.createLinkedAccountForHost('h1');
    expect(r).toEqual({ accountId: 'acc_1', state: 'created' });
    expect(mockCreate).not.toHaveBeenCalled();
  });

  test('creates a route linked account from profile + KYC, stores created', async () => {
    mockGetConfig.mockResolvedValue({ feeOnlyMode: false });
    const updateSpy = wire(
      { name: 'Gaurav', email: 'g@x.com', phone: '9000090000', razorpay_route_account_id: null, razorpay_route_status: 'none' },
      { pan_number: 'AAACL1234C', holder_name: 'Gaurav Kumar' },
    );
    mockCreate.mockResolvedValue({ id: 'acc_NEW' });
    const r = await svc.createLinkedAccountForHost('h1');
    expect(mockCreate).toHaveBeenCalledWith(expect.objectContaining({
      email: 'g@x.com', type: 'route', reference_id: 'h1', legal_info: { pan: 'AAACL1234C' },
    }));
    expect(r).toEqual({ accountId: 'acc_NEW', state: 'created' });
    expect(updateSpy).toHaveBeenCalledWith(expect.objectContaining({ razorpay_route_account_id: 'acc_NEW', razorpay_route_status: 'created' }));
  });

  test('Razorpay failure is non-fatal (returns error, no throw)', async () => {
    mockGetConfig.mockResolvedValue({ feeOnlyMode: false });
    wire({ name: 'A', email: 'a@x.com', razorpay_route_account_id: null, razorpay_route_status: 'none' }, null);
    mockCreate.mockRejectedValue(new Error('rzp down'));
    const r = await svc.createLinkedAccountForHost('h1');
    expect(r).toEqual({ error: 'rzp down' });
  });
});
