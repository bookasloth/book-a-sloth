// Weekly support digest — gating + send. supabase / email / insights mocked.

jest.mock('../../config/supabase', () => ({ supabaseAdmin: { from: jest.fn() } }));
jest.mock('../../utils/sendEmail', () => jest.fn(() => Promise.resolve()));
jest.mock('../../services/supportInsightsService', () => ({ computeInsights: jest.fn() }));

const sendEmail = require('../../utils/sendEmail');
const { computeInsights } = require('../../services/supportInsightsService');
const { supabaseAdmin } = require('../../config/supabase');
const { sendWeeklyInsightsDigest, renderDigest } = require('../../services/supportInsightsDigest');

// platform_settings marker mock — maybeSingle returns `marker`, upsert is a no-op.
let marker = null;
function wireMarker() {
  supabaseAdmin.from.mockImplementation(() => ({
    select: () => ({ eq: () => ({ maybeSingle: () => Promise.resolve({ data: marker ? { value: marker } : null }) }) }),
    upsert: () => Promise.resolve({}),
  }));
}

const INS = { window_days: 7, total_resolved: 12, product_caused_rate: 0.5, csat: 4.2, csat_responses: 5,
  by_reason: [{ label: 'Refund status', type: 'expected', count: 6 }, { label: "Listing isn't live", type: 'ux', count: 4 }], by_category: [] };

const OLD_ENV = process.env;
beforeEach(() => {
  jest.clearAllMocks();
  marker = null;
  process.env = { ...OLD_ENV };
  computeInsights.mockResolvedValue(INS);
  wireMarker();
});
afterAll(() => { process.env = OLD_ENV; });

test('OFF by default — never sends without the flag', async () => {
  delete process.env.SUPPORT_DIGEST_ENABLED;
  const r = await sendWeeklyInsightsDigest();
  expect(r).toEqual({ sent: false, skipped: 'disabled' });
  expect(sendEmail).not.toHaveBeenCalled();
});

test('enabled but no recipient → skips', async () => {
  process.env.SUPPORT_DIGEST_ENABLED = 'true';
  delete process.env.SUPPORT_DIGEST_EMAIL; delete process.env.ADMIN_ALERT_EMAIL;
  const r = await sendWeeklyInsightsDigest();
  expect(r.skipped).toBe('no_recipient');
});

test('enabled + due → computes, emails, and marks sent', async () => {
  process.env.SUPPORT_DIGEST_ENABLED = 'true';
  process.env.SUPPORT_DIGEST_EMAIL = 'founder@bookasloth.in, product@bookasloth.in';
  const r = await sendWeeklyInsightsDigest();
  expect(computeInsights).toHaveBeenCalledWith(7);
  expect(sendEmail).toHaveBeenCalledTimes(1);
  const call = sendEmail.mock.calls[0][0];
  expect(call.to).toBe('founder@bookasloth.in,product@bookasloth.in');
  expect(call.subject).toMatch(/12 resolved/);
  expect(r).toEqual({ sent: true, recipients: 2 });
});

test('within 7 days of last send → too_soon', async () => {
  process.env.SUPPORT_DIGEST_ENABLED = 'true';
  process.env.SUPPORT_DIGEST_EMAIL = 'founder@bookasloth.in';
  marker = new Date(Date.now() - 2 * 86400000).toISOString(); // 2 days ago
  const r = await sendWeeklyInsightsDigest();
  expect(r.skipped).toBe('too_soon');
  expect(sendEmail).not.toHaveBeenCalled();
});

test('renderDigest shows the headline numbers + a preventable flag', () => {
  const html = renderDigest(INS);
  expect(html).toMatch(/12/);       // resolved
  expect(html).toMatch(/50%/);      // product-caused
  expect(html).toMatch(/4\.2\/5/);  // csat
  expect(html).toMatch(/🔴/);       // ux row flagged preventable
});
