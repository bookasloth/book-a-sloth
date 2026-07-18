'use strict';
// botAdminController — Bolt support console (gaps queue + FAQ layer).
// Covers the things a green build won't: the downvoted-answer join, FAQ input
// validation, the promote-resolves-the-gap step, and uuid guards.
jest.mock('../../config/supabase', () => ({ supabaseAdmin: { from: jest.fn() } }));
jest.mock('../../utils/httpError', () => ({ safeError: (res, e) => res.status(500).json({ message: e.message }) }));

const { supabaseAdmin } = require('../../config/supabase');
const ctrl = require('../../controllers/botAdminController');

const mockRes = () => { const r = {}; r.status = jest.fn(() => r); r.json = jest.fn(() => r); return r; };

const chainFor = (result) => {
  const c = {};
  const self = () => c;
  for (const m of ['select', 'eq', 'in', 'order', 'limit', 'update', 'insert', 'delete']) c[m] = jest.fn(self);
  c.single = jest.fn(() => Promise.resolve(result));
  c.then = (resolve, reject) => Promise.resolve(result).then(resolve, reject);
  return c;
};
let tables = {};
const setTables = (map) => {
  tables = map;
  supabaseAdmin.from.mockImplementation((t) => chainFor(tables[t] || { data: [], error: null }));
};

const UUID = '11111111-1111-4111-8111-111111111111';
beforeEach(() => jest.clearAllMocks());

test('listGaps attaches the downvoted answer to a thumbs-down row', async () => {
  setTables({
    knowledge_gaps: { data: [{ id: 'g1', question: null, reason: 'thumbs_down', message_id: 'm1', resolved: false }], error: null },
    bot_messages: { data: [{ id: 'm1', content: 'a bad answer' }], error: null },
  });
  const res = mockRes();
  await ctrl.listGaps({ query: { status: 'open' } }, res);
  const arg = res.json.mock.calls[0][0];
  expect(arg.gaps[0].downvoted_answer).toBe('a bad answer');
});

test('createFaq rejects empty pattern/answer', async () => {
  setTables({});
  const res = mockRes();
  await ctrl.createFaq({ body: { pattern: '', answer: 'x' } }, res);
  expect(res.status).toHaveBeenCalledWith(400);
});

test('createFaq inserts and resolves the promoted gap', async () => {
  setTables({
    bot_faqs: { data: { id: 'f1', pattern: 'reset password', answer: 'Go to settings.', enabled: true }, error: null },
    knowledge_gaps: { data: null, error: null },
  });
  const res = mockRes();
  await ctrl.createFaq({ body: { pattern: 'reset password', answer: 'Go to settings.', gapId: UUID } }, res);
  expect(res.status).toHaveBeenCalledWith(201);
  // gap resolve happened on the knowledge_gaps table
  expect(supabaseAdmin.from).toHaveBeenCalledWith('bot_faqs');
  expect(supabaseAdmin.from).toHaveBeenCalledWith('knowledge_gaps');
});

test('updateGap and deleteFaq reject a malformed id', async () => {
  setTables({});
  const res1 = mockRes(); await ctrl.updateGap({ params: { id: 'nope' }, body: {} }, res1);
  const res2 = mockRes(); await ctrl.deleteFaq({ params: { id: 'nope' } }, res2);
  expect(res1.status).toHaveBeenCalledWith(400);
  expect(res2.status).toHaveBeenCalledWith(400);
});
