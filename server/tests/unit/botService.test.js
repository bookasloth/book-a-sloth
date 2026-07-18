// Unit tests for the Bolt 958 support bot service — retrieval gating + grounded
// answering + the "never a dead end" escalation paths. The Anthropic SDK and
// Supabase are mocked; no live API is hit (mirrors generateListing.test.js).

jest.mock('../../services/ai/anthropicClient', () => {
  const create = jest.fn();
  const stream = jest.fn();
  return {
    __create: create,
    __stream: stream,
    MODELS: { generate: 'gen', regenerate: 'regen' },
    isConfigured: jest.fn(() => true),
    getClient: () => ({ messages: { create, stream } }),
  };
});

// A fake Anthropic streaming response: async-iterates text_delta events.
const streamOf = (pieces) => ({
  async *[Symbol.asyncIterator]() {
    for (const text of pieces) yield { type: 'content_block_delta', delta: { type: 'text_delta', text } };
  },
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

jest.mock('../../lib/botBudget', () => ({ tryConsume: jest.fn().mockResolvedValue({ allowed: true, reason: null }) }));

const client = require('../../services/ai/anthropicClient');
const sb = require('../../config/supabase');
const botBudget = require('../../lib/botBudget');
const { askBot, askBotStream, buildRetrievalQuery, toModelHistory, smalltalkReply, SMALLTALK_REPLIES, mergeChunks, isUnsupportedInput, UNSUPPORTED_INPUT_MSG, OVER_BUDGET_MSG } = require('../../services/botService');

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

test.each([
  'Hi', 'hello', 'hey there', 'hii', 'yo', 'sup', 'good morning', 'gm', 'namaste',
  'how are you?', 'thanks!', 'thank you', 'thank you so much', 'thanks a lot',
  'ok thank you', 'great thanks', 'ok', 'okay cool', 'perfect', 'got it thanks',
  'bye', 'see you later', 'take care', '👋',
])(
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

test('smalltalkReply picks the right category and ignores real questions', () => {
  expect(smalltalkReply('thank you so much')).toBe(SMALLTALK_REPLIES.thanks);
  expect(smalltalkReply('ok thank you')).toBe(SMALLTALK_REPLIES.thanks); // thanks beats affirm
  expect(smalltalkReply('see you later')).toBe(SMALLTALK_REPLIES.bye);
  expect(smalltalkReply('good morning')).toBe(SMALLTALK_REPLIES.greeting);
  expect(smalltalkReply('okay cool')).toBe(SMALLTALK_REPLIES.affirm);
  // Real questions (a content word present) are NOT small talk.
  for (const q of ['hi how do I book?', 'how much is host+', 'can I cancel', 'great plan', 'is it free']) {
    expect(smalltalkReply(q)).toBeNull();
  }
});

test('a greeting in front of a real question is NOT swallowed as small talk', async () => {
  // "hi, how do I book?" must fall through to the normal answer path, not the
  // greeting shortcut. With no chunks it escalates — but via retrieval, proving
  // it was not short-circuited as small talk.
  sb.__rpc.mockResolvedValue({ data: [], error: null });
  const out = await askBot({ question: 'hi, how do I book a service?' });
  expect(out.escalate).toBe(true);
  expect(out.answer.length).toBeGreaterThan(0);
  expect(out.answer).not.toBe(SMALLTALK_REPLIES.greeting); // proves it wasn't the small-talk shortcut
});

describe('isUnsupportedInput (non-Latin / hidden-char guard)', () => {
  test.each([
    'बुकिंग कैसे करें',   // Devanagari
    '你好，怎么预订',       // Chinese
    'Привет как дела',    // Cyrillic
    'مرحبا كيف احجز',      // Arabic
    'hi​there',      // zero-width space
    'book‮me',       // right-to-left override
  ])('rejects %p', (s) => expect(isUnsupportedInput(s)).toBe(true));

  test.each([
    'how do I book a service?',
    'booking kaise kare',        // romanized Hindi = Latin letters, allowed
    'café José Zürich',          // accented Latin, allowed
    'how much 💰 for host+ 🦥',  // emoji are symbols, not letters
    '₹100 minimum payout',
    'ok thanks!',
  ])('allows %p', (s) => expect(isUnsupportedInput(s)).toBe(false));
});

test('non-Latin input replies with a rephrase message, no escalation or model call', async () => {
  sb.__rpc.mockResolvedValue({ data: [chunk()], error: null });
  const out = await askBot({ question: 'बुकिंग कैसे करें' });
  expect(out.escalate).toBe(false);
  expect(out.answer).toBe(UNSUPPORTED_INPUT_MSG);
  expect(out.source).toBe('unsupported');
  expect(out.cited_sources).toEqual([]);
  expect(client.__create).not.toHaveBeenCalled();
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

test('FAQ layer answers a matching question without retrieval or the model', async () => {
  // bot_faqs read (the first .eq call in askBot) yields one row whose pattern is
  // contained in the question → served verbatim, no LLM, no retrieval.
  sb.__chain.eq.mockResolvedValueOnce({ data: [{ pattern: 'contact support', answer: 'Email support@bookasloth.' }], error: null });
  const out = await askBot({ question: 'how do I contact support?' });
  expect(out.escalate).toBe(false);
  expect(out.source).toBe('faq');
  expect(out.answer).toBe('Email support@bookasloth.');
  expect(client.__create).not.toHaveBeenCalled();
  expect(sb.__rpc).not.toHaveBeenCalled(); // short-circuits before FTS
});

test('askBotStream streams deltas and cites the retrieved sources', async () => {
  sb.__rpc.mockResolvedValue({ data: [chunk()], error: null });
  client.__stream.mockReturnValue(streamOf(['Go to ', 'Dashboard → ', 'Google Calendar.']));
  const deltas = [];
  const out = await askBotStream({ question: 'How do I connect Google Calendar?', onDelta: (t) => deltas.push(t) });
  expect(out.escalate).toBe(false);
  expect(deltas.join('')).toBe('Go to Dashboard → Google Calendar.');
  expect(out.answer).toBe('Go to Dashboard → Google Calendar.');
  expect(out.cited_sources.length).toBeGreaterThan(0);
});

test('mergeChunks dedupes by id, keeps vector hits first, caps the total', () => {
  const vec = [{ id: 'a', content: 'va' }, { id: 'b', content: 'vb' }];
  const fts = [{ id: 'b', content: 'fb' }, { id: 'c' }, { id: 'd' }, { id: 'e' }, { id: 'f' }, { id: 'g' }, { id: 'h' }, { id: 'i' }, { id: 'j' }];
  const out = mergeChunks(vec, fts);
  expect(out[0].id).toBe('a');                                   // vector first
  expect(out.find((c) => c.id === 'b').content).toBe('vb');      // vector 'b' wins over fts 'b'
  expect(new Set(out.map((c) => c.id)).size).toBe(out.length);   // no dupes
  expect(out.length).toBeLessThanOrEqual(8);                     // MATCH_COUNT cap
});

test('askBotStream escalates on the sentinel and never leaks it to the user', async () => {
  sb.__rpc.mockResolvedValue({ data: [chunk()], error: null });
  client.__stream.mockReturnValue(streamOf(['[[ESCALATE]]']));
  const deltas = [];
  const out = await askBotStream({ question: 'something the docs do not cover', onDelta: (t) => deltas.push(t) });
  expect(out.escalate).toBe(true);
  expect(deltas.join('')).not.toMatch(/ESCALATE/); // sentinel withheld
  expect(out.answer.length).toBeGreaterThan(0);     // spoken handoff line instead
});

test('over-budget serves the busy message, does not escalate or call the model', async () => {
  sb.__rpc.mockResolvedValue({ data: [chunk()], error: null }); // retrieval finds chunks
  botBudget.tryConsume.mockResolvedValueOnce({ allowed: false, reason: 'minute' });
  const out = await askBot({ question: 'How do I add a service?' });
  expect(out.escalate).toBe(false);
  expect(out.source).toBe('over_budget');
  expect(out.answer).toBe(OVER_BUDGET_MSG);
  expect(out.cited_sources).toEqual([]);
  expect(client.__create).not.toHaveBeenCalled(); // model was NOT called
});

test('over-budget in the streaming path emits the busy message, does not escalate or call the model', async () => {
  sb.__rpc.mockResolvedValue({ data: [chunk()], error: null });
  botBudget.tryConsume.mockResolvedValueOnce({ allowed: false, reason: 'minute' });
  const deltas = [];
  const out = await askBotStream({ question: 'How do I add a service?', onDelta: (t) => deltas.push(t) });
  expect(out.escalate).toBe(false);
  expect(out.source).toBe('over_budget');
  expect(out.answer).toBe(OVER_BUDGET_MSG);
  expect(deltas.join('')).toBe(OVER_BUDGET_MSG); // the busy line is streamed, NOT the HANDOFF escalation line
  expect(client.__create).not.toHaveBeenCalled();
});
