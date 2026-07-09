jest.mock('../../services/ai/generateListing', () => ({ generateListing: jest.fn() }));
jest.mock('../../services/planService', () => ({ getLimit: jest.fn() }));

// Chainable supabase mock: from().select().eq().gte() → { count }, and from().insert() ok.
const state = { count: 0, insertErr: null };
jest.mock('../../config/supabase', () => {
  const q = () => {
    const o = {};
    ['select', 'eq', 'gte'].forEach((m) => { o[m] = jest.fn(() => o); });
    o.then = (res) => res({ count: state.count, error: null });
    o.insert = jest.fn(() => Promise.resolve({ error: state.insertErr }));
    return o;
  };
  return { supabaseAdmin: { from: jest.fn(q) } };
});

const { generateListing } = require('../../services/ai/generateListing');
const planService = require('../../services/planService');
const { generateAiListing } = require('../../controllers/aiController');

const mkRes = () => { const r = {}; r.status = jest.fn(() => r); r.json = jest.fn(() => r); return r; };
const okFields = { title: 'T', short_description: 'S', long_description: 'L', included_items: [], excluded_items: [], faqs: [] };

beforeEach(() => { state.count = 0; state.insertErr = null; generateListing.mockReset(); planService.getLimit.mockReset(); });

test('503 when generation unavailable (no key)', async () => {
  planService.getLimit.mockResolvedValue(1);
  generateListing.mockRejectedValue(new Error('AI_UNAVAILABLE'));
  const res = mkRes();
  await generateAiListing({ user: { id: 'h1' }, vendorPlan: 'starter', body: { title: 'X' } }, res);
  expect(res.status).toHaveBeenCalledWith(503);
  expect(res.json.mock.calls[0][0].ai_unavailable).toBe(true);
});

test('429 when generate quota exhausted', async () => {
  planService.getLimit.mockResolvedValue(1);
  state.count = 1; // already used the 1 allowed
  const res = mkRes();
  await generateAiListing({ user: { id: 'h1' }, vendorPlan: 'starter', body: { title: 'X' } }, res);
  expect(res.status).toHaveBeenCalledWith(429);
  const payload = res.json.mock.calls[0][0];
  expect(payload.current_plan).toBe('starter');
  expect(payload.limit).toBe(1);
  expect(payload.unlock_at).toBeTruthy();
});

test('200 generate returns fields + new session_id, consumes quota', async () => {
  planService.getLimit.mockResolvedValue(2);
  generateListing.mockResolvedValue({ fields: okFields, model: 'claude-haiku-4-5-20251001' });
  const res = mkRes();
  await generateAiListing({ user: { id: 'h1' }, vendorPlan: 'professional', body: { title: 'X' } }, res);
  expect(res.status).toHaveBeenCalledWith(200);
  const payload = res.json.mock.calls[0][0];
  expect(payload.ai_generated).toBe(true);
  expect(payload.session_id).toBeTruthy();
  expect(payload.fields.title).toBe('T');
});

test('regenerate (session_id present) does not check quota', async () => {
  planService.getLimit.mockResolvedValue(1);
  state.count = 5; // over limit, but regenerate must ignore it
  generateListing.mockResolvedValue({ fields: okFields, model: 'claude-sonnet-5' });
  const res = mkRes();
  await generateAiListing({ user: { id: 'h1' }, vendorPlan: 'starter', body: { title: 'X', session_id: 'sess-1' } }, res);
  expect(res.status).toHaveBeenCalledWith(200);
  expect(generateListing).toHaveBeenCalledWith(expect.objectContaining({ regenerate: true }));
});

test('unlimited plan (-1) skips quota', async () => {
  planService.getLimit.mockResolvedValue(-1);
  state.count = 99;
  generateListing.mockResolvedValue({ fields: okFields, model: 'claude-haiku-4-5-20251001' });
  const res = mkRes();
  await generateAiListing({ user: { id: 'h1' }, vendorPlan: 'supreme', body: { title: 'X' } }, res);
  expect(res.status).toHaveBeenCalledWith(200);
});

test('422 on AI_INVALID', async () => {
  planService.getLimit.mockResolvedValue(2);
  generateListing.mockRejectedValue(new Error('AI_INVALID'));
  const res = mkRes();
  await generateAiListing({ user: { id: 'h1' }, vendorPlan: 'professional', body: { title: 'X' } }, res);
  expect(res.status).toHaveBeenCalledWith(422);
});

test('502 on an unmapped/raw error (network/SDK failure), never an unhandled 500', async () => {
  planService.getLimit.mockResolvedValue(2);
  generateListing.mockRejectedValue(new Error('ECONNRESET'));
  const res = mkRes();
  await generateAiListing({ user: { id: 'h1' }, vendorPlan: 'professional', body: { title: 'X' } }, res);
  expect(res.status).toHaveBeenCalledWith(502);
  const payload = res.json.mock.calls[0][0];
  expect(payload.message).not.toMatch(/ECONNRESET/);
});
