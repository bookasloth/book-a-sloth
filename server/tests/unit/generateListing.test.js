jest.mock('../../services/ai/anthropicClient', () => {
  const create = jest.fn();
  return { __create: create, MODELS: { generate: 'gen-id', regenerate: 'regen-id', listing: 'listing-id' }, getClient: () => ({ messages: { create } }) };
});
const client = require('../../services/ai/anthropicClient');
const { generateListing } = require('../../services/ai/generateListing');

const toolReply = (input) => ({ content: [{ type: 'tool_use', name: 'emit_listing', input }] });

beforeEach(() => client.__create.mockReset());

test('returns sanitized fields from tool output (generate → sonnet listing model)', async () => {
  client.__create.mockResolvedValueOnce(toolReply({
    title: 'SEO Consultancy', short_description: 'Grow organic traffic fast.',
    long_description: 'SEO consultancy is a service...', included_items: ['Audit'],
    excluded_items: ['Ads'], faqs: [{ question: 'How long?', answer: 'Weeks.' }],
  }));
  const out = await generateListing({ title: 'SEO', allowedCategorySlugs: [] });
  expect(out.model).toBe('listing-id');
  expect(out.fields.title).toBe('SEO Consultancy');
  expect(client.__create).toHaveBeenCalledWith(expect.objectContaining({
    model: 'listing-id', tool_choice: { type: 'tool', name: 'emit_listing' },
    // thinking must stay disabled — sonnet-5 defaults thinking on, and a forced
    // tool_choice 400s while thinking is on (regression: every regenerate failed).
    thinking: { type: 'disabled' },
  }));
});

test('regenerate uses the same listing model (variety comes from the tweak prompt)', async () => {
  client.__create.mockResolvedValueOnce(toolReply({
    title: 'T', short_description: 'S', long_description: 'L',
    included_items: ['a'], excluded_items: ['b'], faqs: [{ question: 'q', answer: 'a' }],
  }));
  const out = await generateListing({ title: 'X', regenerate: true });
  expect(out.model).toBe('listing-id');
});

test('retries once then throws AI_INVALID on no tool output', async () => {
  client.__create.mockResolvedValue({ content: [{ type: 'text', text: 'sorry' }] });
  await expect(generateListing({ title: 'X' })).rejects.toThrow('AI_INVALID');
  expect(client.__create).toHaveBeenCalledTimes(2);
});

test('throws AI_UNAVAILABLE when client null', async () => {
  const spy = jest.spyOn(client, 'getClient').mockReturnValueOnce(null);
  await expect(generateListing({ title: 'X' })).rejects.toThrow('AI_UNAVAILABLE');
  spy.mockRestore();
});
