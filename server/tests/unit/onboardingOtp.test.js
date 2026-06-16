'use strict';
jest.mock('../../config/supabase', () => ({ supabaseAdmin: { from: jest.fn() }, signInWithPassword: jest.fn() }));
jest.mock('../../utils/notify', () => ({ sendWhatsAppOtp: jest.fn() }));
jest.mock('../../services/email/communicationEngine', () => ({ send: jest.fn(() => Promise.resolve()) }));
const { supabaseAdmin } = require('../../config/supabase');
const ctrl = require('../../controllers/vendorOnboardingController');
const bcrypt = require('bcryptjs');

// Helper: wire a select->maybeSingle returning `existing`, and capture upsert payloads.
const wire = (existing) => {
  const upserts = [];
  const updates = [];
  supabaseAdmin.from.mockImplementation(() => ({
    select: () => ({ eq: () => ({ maybeSingle: () => Promise.resolve({ data: existing }) }) }),
    upsert: (payload) => { upserts.push(payload); return Promise.resolve({ error: null }); },
    update: (payload) => { updates.push(payload); return { eq: () => Promise.resolve({ error: null }) }; },
  }));
  return { upserts, updates };
};
beforeEach(() => jest.clearAllMocks());

test('first send succeeds and records send_count=1', async () => {
  const { upserts } = wire(null);
  await ctrl.sendOtpBothChannels('slug1', 'v@x.com', '', 'V');
  expect(upserts[0].send_count).toBe(1);
  expect(upserts[0].first_send_at).toBeTruthy();
});

test('exceeding the hourly send cap throws and sets a 15-min send lockout', async () => {
  const now = Date.now();
  // existing: already 3 sends this hour
  const { updates } = wire({ onboarding_slug: 'slug1', send_count: 3, first_send_at: new Date(now - 5*60*1000).toISOString(), send_locked_until: null });
  await expect(ctrl.sendOtpBothChannels('slug1', 'v@x.com', '', 'V')).rejects.toThrow(/too many|try again/i);
  // a lockout timestamp ~15 min out was written
  const locked = updates.find(u => u.send_locked_until)?.send_locked_until || null;
  expect(locked).toBeTruthy();
  const mins = (new Date(locked).getTime() - now) / 60000;
  expect(mins).toBeGreaterThan(10);
});

test('a send while send_locked_until is in the future is rejected', async () => {
  wire({ onboarding_slug: 'slug1', send_count: 3, send_locked_until: new Date(Date.now() + 10*60*1000).toISOString() });
  await expect(ctrl.sendOtpBothChannels('slug1', 'v@x.com', '', 'V')).rejects.toThrow(/too many|try again/i);
});

test('verify lockout after 3 wrong attempts is ~15 minutes, not 60 seconds', async () => {
  const now = Date.now();
  const hash = await bcrypt.hash('111111', 10);
  const { updates } = wire({ onboarding_slug: 'slug1', email_otp: hash, email_attempts: 2,
    email_otp_expires_at: new Date(now + 5*60*1000).toISOString() });
  await expect(ctrl.verifyOtp('slug1', 'email', '999999')).rejects.toThrow();
  const locked = updates.find(u => u.email_locked_until)?.email_locked_until;
  expect(locked).toBeTruthy();
  const mins = (new Date(locked).getTime() - now) / 60000;
  expect(mins).toBeGreaterThan(10);
});
