/**
 * subscriptionService.test.js — activation / renewal / idempotency for
 * auto-renewing subscriptions. Supabase, Razorpay, ledger, plan/config and
 * notifications are mocked; assertions target the profile-activation update,
 * the payment record, and the idempotency guard.
 */
'use strict';

jest.mock('../../config/supabase', () => ({ supabaseAdmin: { from: jest.fn() } }));
jest.mock('../../services/planService', () => ({
  normalizeSlug: (s) => (s || '').toLowerCase(),
  getPlan: jest.fn(() => Promise.resolve({ slug: 'creator', name: 'Creator', monthly_price: 99, annual_price: 999 })),
}));
jest.mock('../../services/platformConfig', () => ({ getConfig: jest.fn(() => Promise.resolve({ gstRate: 0.18 })) }));
jest.mock('../../services/notificationEngine', () => ({ send: jest.fn(() => Promise.resolve()) }));
jest.mock('../../services/razorpaySubscriptions', () => ({
  getClient: jest.fn(() => Promise.resolve({ payments: { fetch: jest.fn(() => Promise.resolve({ fee: 2360, tax: 360 })) } })),
  fetchPayment: jest.fn(() => Promise.resolve({ fee: 2360, tax: 360 })),
  fetchSubscriptionInvoices: jest.fn(() => Promise.resolve([])),
}));
jest.mock('../../services/ledger/journalTemplates', () => ({ subscriptionPaymentEntry: jest.fn(() => ({ lines: [] })) }));
jest.mock('../../services/ledger/postingService', () => ({ postSafe: jest.fn(() => Promise.resolve()) }));
jest.mock('../../utils/posthog', () => ({ capture: jest.fn(), resolveGuestId: jest.fn() }));

const { supabaseAdmin } = require('../../config/supabase');
const { capture: phCapture } = require('../../utils/posthog');
const svc = require('../../services/subscriptionService');

const RZP_SUB = {
  id: 'sub_123',
  status: 'active',
  current_start: 1735689600, // 2025-01-01
  current_end: 1738368000,   // 2025-02-01
  notes: { vendor_id: 'vendor-1', plan: 'creator', cadence: 'monthly' },
};

// Build a per-table mock. priorPayment toggles the idempotency branch.
const wireSupabase = ({ priorPayment = null, priorCount = 0 } = {}) => {
  const profileUpdate = jest.fn(() => ({ eq: jest.fn(() => Promise.resolve({ data: null, error: null })) }));
  const insert = jest.fn(() => ({ select: () => ({ single: () => Promise.resolve({ data: { id: 'pay-row-1' }, error: null }) }) }));

  supabaseAdmin.from.mockImplementation((table) => {
    if (table === 'subscription_payments') {
      const c = {};
      c.select = jest.fn(() => c);
      c.eq = jest.fn(() => c);
      c.maybeSingle = jest.fn(() => Promise.resolve({ data: priorPayment, error: null })); // idempotency
      c.then = (resolve) => resolve({ count: priorCount, data: [], error: null });          // count query
      c.insert = insert;
      return c;
    }
    if (table === 'profiles') {
      const c = {};
      c.update = profileUpdate;
      c.select = jest.fn(() => c);
      c.eq = jest.fn(() => c);
      c.single = jest.fn(() => Promise.resolve({ data: { name: 'Vendor', email: 'v@x.com' }, error: null }));
      c.maybeSingle = jest.fn(() => Promise.resolve({ data: { plan_expires_at: null }, error: null }));
      return c;
    }
    return { select: jest.fn(() => ({ eq: jest.fn() })) };
  });
  return { profileUpdate, insert };
};

beforeEach(() => jest.clearAllMocks());

describe('activateFromSubscription', () => {
  test('missing notes → no activation', async () => {
    wireSupabase();
    const r = await svc.activateFromSubscription({ rzpSub: { id: 'x', notes: {} } });
    expect(r.activated).toBe(false);
    expect(r.reason).toMatch(/missing/);
  });

  test('already-processed payment is idempotent — no profile update', async () => {
    const { profileUpdate, insert } = wireSupabase({ priorPayment: { id: 'pay-row-1' } });
    const r = await svc.activateFromSubscription({ rzpSub: RZP_SUB, rzpPayment: { id: 'pay_dup' } });
    expect(r.activated).toBe(false);
    expect(r.reason).toMatch(/already processed/);
    expect(profileUpdate).not.toHaveBeenCalled();
    expect(insert).not.toHaveBeenCalled();
  });

  test('first charge activates plan + records payment as initial', async () => {
    const { profileUpdate, insert } = wireSupabase({ priorPayment: null, priorCount: 0 });
    const r = await svc.activateFromSubscription({ rzpSub: RZP_SUB, rzpPayment: { id: 'pay_new', order_id: 'order_1' } });
    expect(r.activated).toBe(true);

    const update = profileUpdate.mock.calls[0][0];
    expect(update.plan).toBe('creator');
    expect(update.billing_cadence).toBe('monthly');
    expect(update.subscription_status).toBe('active');
    expect(update.razorpay_subscription_id).toBe('sub_123');
    // current_period_end mirrors the access gate
    expect(update.current_period_end).toBe(update.plan_expires_at);

    const row = insert.mock.calls[0][0];
    expect(row.kind).toBe('initial');
    expect(row.plan_price).toBe(99);
    expect(row.total_charged).toBe(116.82);      // 99 + 18% GST
    expect(row.razorpay_fee).toBe(20);           // (2360 − 360)/100
    expect(row.razorpay_tax).toBe(3.6);          // 360/100
    expect(row.razorpay_subscription_id).toBe('sub_123');
    // initial purchase is captured by the verify path — not here (no double-count)
    expect(phCapture).not.toHaveBeenCalled();
  });

  test('subsequent charge records as renewal + captures subscription_renewed', async () => {
    const { insert } = wireSupabase({ priorPayment: null, priorCount: 1 });
    await svc.activateFromSubscription({ rzpSub: RZP_SUB, rzpPayment: { id: 'pay_renew' } });
    expect(insert.mock.calls[0][0].kind).toBe('renewal');
    expect(phCapture).toHaveBeenCalledWith('vendor-1', 'subscription_renewed', {
      plan: 'creator', cadence: 'monthly', expires_at: expect.any(String),
    });
  });

  test('UPI mandate-auth token charge (amount << plan price) grants access but books no charge', async () => {
    const { profileUpdate, insert } = wireSupabase({ priorPayment: null, priorCount: 0 });
    // amount is in paise: ₹1.18 auth token, well below the ₹99 monthly plan price.
    const r = await svc.activateFromSubscription({ rzpSub: RZP_SUB, rzpPayment: { id: 'pay_auth', amount: 118 } });
    expect(r.activated).toBe(true);
    expect(profileUpdate).toHaveBeenCalled();
    expect(insert).not.toHaveBeenCalled();   // no phantom plan-price row from a ₹1 token
  });

  test('activation without a payment entity grants access but records no charge', async () => {
    const { profileUpdate, insert } = wireSupabase({ priorPayment: null, priorCount: 0 });
    const r = await svc.activateFromSubscription({ rzpSub: RZP_SUB }); // no rzpPayment
    expect(r.activated).toBe(true);
    expect(profileUpdate).toHaveBeenCalled();
    expect(insert).not.toHaveBeenCalled();
  });
});
