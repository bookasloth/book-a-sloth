// parseSearchQuery: LLM query parse with soft fallback + memoisation.
let mockConfigured = true;
jest.mock('../../services/ai/anthropicClient', () => {
  const create = jest.fn();
  return {
    __create: create,
    MODELS: { generate: 'gen-id' },
    isConfigured: () => mockConfigured,
    getClient: () => ({ messages: { create } }),
  };
});
const client = require('../../services/ai/anthropicClient');
const { parseSearchQuery, _CACHE } = require('../../services/ai/parseSearchQuery');

const toolReply = (input) => ({ content: [{ type: 'tool_use', name: 'emit_query', input }] });

beforeEach(() => { client.__create.mockReset(); _CACHE.clear(); mockConfigured = true; });

test('no API key → falls back to raw text, no API call', async () => {
  mockConfigured = false;
  const out = await parseSearchQuery('Resume Review Nagpur');
  expect(out).toEqual({ text: 'Resume Review Nagpur', location: '', mode: '' });
  expect(client.__create).not.toHaveBeenCalled();
});

test('peels location + mode off the topic; normalises unknown mode to empty', async () => {
  client.__create.mockResolvedValueOnce(toolReply({ text: 'Mock Interview', location: 'Nagpur', mode: 'OFFLINE' }));
  const out = await parseSearchQuery('Mock Interview Offline Nagpur');
  expect(out).toEqual({ text: 'Mock Interview', location: 'Nagpur', mode: 'offline' });
});

test('bogus mode value is dropped', async () => {
  client.__create.mockResolvedValueOnce(toolReply({ text: 'Yoga', location: '', mode: 'weekends' }));
  const out = await parseSearchQuery('Yoga weekends');
  expect(out.mode).toBe('');
});

test('memoises: identical query hits cache, not the API twice', async () => {
  client.__create.mockResolvedValueOnce(toolReply({ text: 'Career Guidance', location: 'Chandrapur', mode: '' }));
  const a = await parseSearchQuery('Career Guidance Chandrapur');
  const b = await parseSearchQuery('career guidance chandrapur'); // case-insensitive key
  expect(a).toEqual(b);
  expect(client.__create).toHaveBeenCalledTimes(1);
});

test('API error → soft fallback to raw text, uncached (can retry)', async () => {
  client.__create.mockRejectedValueOnce(new Error('boom'));
  const out = await parseSearchQuery('Pune coaching');
  expect(out).toEqual({ text: 'Pune coaching', location: '', mode: '' });
  // uncached: a later successful call replaces the fallback
  client.__create.mockResolvedValueOnce(toolReply({ text: 'coaching', location: 'Pune', mode: '' }));
  const out2 = await parseSearchQuery('Pune coaching');
  expect(out2.location).toBe('Pune');
});
