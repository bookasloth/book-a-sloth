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
const { askBot, buildRetrievalQuery, toModelHistory } = require('../../services/botService');

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

test.each(['Hi', 'hello', 'hey there', 'thanks!', 'thank you', 'ok', 'bye'])(
  'small talk %p replies warmly without escalating or calling the model',
  async (msg) => {
    sb.__rpc.mockResolvedValue({ data: [chunk()], error: null });
    const out = await askBot({ question: msg });
    expect(out.escalate).toBe(false);
    expect(out.cited_sources).toEqual([]);
    expect(out.answer.length).toBeGreaterThan(0);
    expect(out.answer).not.toMatch(/connecting you with a human/);
    expect(client.__create).not.toHaveBeenCalled(); // no retrieval/model work for a greeting
  },
);

test('a greeting in front of a real question is NOT swallowed as small talk', async () => {
  // "hi, how do I book?" must fall through to the normal answer path, not the
  // greeting shortcut. With no chunks it escalates — but via retrieval, proving
  // it was not short-circuited as small talk.
  sb.__rpc.mockResolvedValue({ data: [], error: null });
  const out = await askBot({ question: 'hi, how do I book a service?' });
  expect(out.escalate).toBe(true);
  expect(out.answer).toMatch(/connecting you with a human/);
});

test('informational money question is NOT sensitive — it gets answered', async () => {
  // Narrowed SENSITIVE_RE: "how do payouts work" no longer hard-escalates; only
  // reversals/compromise (refund, chargeback, hacked, account access) do.
  sb.__rpc.mockResolvedValue({ data: [chunk()], error: null });
  client.__create.mockResolvedValueOnce(answerReply({
    answer: 'Request a payout from Earnings; the minimum is ₹100.', escalate: false, source_numbers: [1],
  }));
  const out = await askBot({ question: 'how do payouts work?' });
  expect(out.escalate).toBe(false);
  expect(client.__create).toHaveBeenCalled();
});

test('buildRetrievalQuery seeds a follow-up with the last user turns', () => {
  const history = [
    { role: 'user', content: 'how much is Host+?' },
    { role: 'assistant', content: 'Host+ is a paid plan; see the pricing page.' },
  ];
  // The bare follow-up has no keywords of its own; the prior user turn supplies them.
  expect(buildRetrievalQuery('what about the other plan?', history))
    .toBe('how much is Host+? what about the other plan?');
  // First turn (no history) is just the question.
  expect(buildRetrievalQuery('how do I book?', [])).toBe('how do I book?');
});

test('toModelHistory maps roles, drops empties, and caps length', () => {
  const long = Array.from({ length: 10 }, (_, i) => ({ role: i % 2 ? 'assistant' : 'user', content: `m${i}` }));
  const out = toModelHistory(long);
  expect(out).toHaveLength(6);                 // capped to HISTORY_TURNS
  expect(out.every((m) => m.role === 'user' || m.role === 'assistant')).toBe(true);
  expect(toModelHistory([{ role: 'user', content: '  ' }])).toEqual([]); // blank dropped
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
