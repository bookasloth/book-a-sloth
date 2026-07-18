// Unit tests for the Bolt 958 support bot service — retrieval gating + grounded
// answering + the "never a dead end" escalation paths. The Anthropic SDK and
// Supabase are mocked; no live API is hit (mirrors generateListing.test.js).

jest.mock('../../services/ai/anthropicClient', () => {
  const create = jest.fn();
  return {
    __create: create,
    MODELS: { generate: 'gen', regenerate: 'regen' },
    isConfigured: jest.fn(() => true),
    getClient: () => ({ messages: { create } }),
  };
});

jest.mock('../../config/supabase', () => {
  const single = jest.fn().mockResolvedValue({ data: { id: 'row-id' }, error: null });
  const rpc = jest.fn().mockResolvedValue({ data: [], error: null });
  const chain = {
    insert: jest.fn(() => chain),
    select: jest.fn(() => chain),
    update: jest.fn(() => chain),
    eq: jest.fn(() => Promise.resolve({ error: null })),
    single,
  };
  return { __rpc: rpc, __single: single, __chain: chain, supabaseAdmin: { rpc, from: jest.fn(() => chain) } };
});

const client = require('../../services/ai/anthropicClient');
const sb = require('../../config/supabase');
const { askBot } = require('../../services/botService');

const answerReply = (input) => ({ content: [{ type: 'tool_use', name: 'emit_answer', input }] });
const chunk = (over = {}) => ({ id: 'c1', source_file: 'docs/architecture.md', heading: 'Google Calendar Integration', content: 'Connect via /api/auth/google.', rank: 0.9, ...over });

beforeEach(() => {
  client.__create.mockReset();
  client.isConfigured.mockReturnValue(true);
  sb.__rpc.mockResolvedValue({ data: [], error: null });
});

test('grounded answer cites its source and does not escalate', async () => {
  sb.__rpc.mockResolvedValue({ data: [chunk()], error: null });
  client.__create.mockResolvedValueOnce(answerReply({
    answer: 'Go to Dashboard → connect Google Calendar.', escalate: false, source_numbers: [1],
  }));

  const out = await askBot({ question: 'How do I connect Google Calendar?' });

  expect(out.escalate).toBe(false);
  expect(out.answer).toMatch(/Google Calendar/);
  expect(out.cited_sources).toEqual([{ source_file: 'docs/architecture.md', heading: 'Google Calendar Integration' }]);
  expect(client.__create).toHaveBeenCalledWith(expect.objectContaining({
    model: 'gen', tool_choice: { type: 'tool', name: 'emit_answer' },
  }));
});

test('no retrieved chunks escalates without calling the model', async () => {
  sb.__rpc.mockResolvedValue({ data: [], error: null });
  const out = await askBot({ question: 'What is the airspeed of an unladen swallow?' });
  expect(out.escalate).toBe(true);
  expect(out.cited_sources).toEqual([]);
  expect(client.__create).not.toHaveBeenCalled();
});

test('below-threshold rank is treated as no match and escalates', async () => {
  sb.__rpc.mockResolvedValue({ data: [chunk({ rank: 0.001 })], error: null });
  const out = await askBot({ question: 'something vaguely on topic' });
  expect(out.escalate).toBe(true);
  expect(client.__create).not.toHaveBeenCalled();
});

test('sensitive topic escalates even when chunks match', async () => {
  sb.__rpc.mockResolvedValue({ data: [chunk()], error: null });
  const out = await askBot({ question: 'I need a refund for my payment' });
  expect(out.escalate).toBe(true);
  expect(client.__create).not.toHaveBeenCalled();
});

test('escalates when the API key is not configured', async () => {
  sb.__rpc.mockResolvedValue({ data: [chunk()], error: null });
  client.isConfigured.mockReturnValue(false);
  const out = await askBot({ question: 'How do I add a service?' });
  expect(out.escalate).toBe(true);
  expect(client.__create).not.toHaveBeenCalled();
});

test('model-signalled escalate returns the handoff message, no citations', async () => {
  sb.__rpc.mockResolvedValue({ data: [chunk()], error: null });
  client.__create.mockResolvedValueOnce(answerReply({ answer: '', escalate: true, source_numbers: [] }));
  const out = await askBot({ question: 'How do I add a service?' });
  expect(out.escalate).toBe(true);
  expect(out.cited_sources).toEqual([]);
  expect(out.answer.length).toBeGreaterThan(0);
});

test('persists the exchange and returns conversation + message ids', async () => {
  sb.__rpc.mockResolvedValue({ data: [chunk()], error: null });
  client.__create.mockResolvedValueOnce(answerReply({ answer: 'Yes.', escalate: false, source_numbers: [1] }));
  const out = await askBot({ question: 'How do I add a service?' });
  expect(out.conversationId).toBe('row-id');
  expect(out.messageId).toBe('row-id');
  expect(sb.supabaseAdmin.from).toHaveBeenCalledWith('bot_conversations');
  expect(sb.supabaseAdmin.from).toHaveBeenCalledWith('bot_messages');
});
