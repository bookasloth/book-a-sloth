// Unit tests for the Explore-foundation discovery capture (fire-and-forget).
const mockInsert = jest.fn(() => Promise.resolve({ error: null }));
jest.mock('../../config/supabase', () => ({
  supabaseAdmin: { from: () => ({ insert: mockInsert }) },
  supabase: {},
}));

const { logEvent, contextFromReq } = require('../../services/discoveryEvents');

beforeEach(() => mockInsert.mockClear());

test('inserts a valid search event with a numeric result_count', () => {
  logEvent({ event_type: 'search', surface: 'home_search', query: 'yoga', result_count: 3 });
  expect(mockInsert).toHaveBeenCalledTimes(1);
  const row = mockInsert.mock.calls[0][0];
  expect(row).toMatchObject({ event_type: 'search', surface: 'home_search', query: 'yoga', result_count: 3 });
});

test('drops events with an invalid event_type', () => {
  logEvent({ event_type: 'bogus', query: 'x' });
  expect(mockInsert).not.toHaveBeenCalled();
});

test('records zero-result searches (unmet demand) — result_count 0 is kept', () => {
  logEvent({ event_type: 'search', query: 'underwater basket weaving', result_count: 0 });
  expect(mockInsert.mock.calls[0][0].result_count).toBe(0);
});

test('truncates an overlong query to 200 chars', () => {
  logEvent({ event_type: 'search', query: 'a'.repeat(500) });
  expect(mockInsert.mock.calls[0][0].query.length).toBe(200);
});

test('null-coerces missing optional fields', () => {
  logEvent({ event_type: 'view', vendor_id: 'v1' });
  const row = mockInsert.mock.calls[0][0];
  expect(row.vendor_id).toBe('v1');
  expect(row.query).toBeNull();
  expect(row.result_count).toBeNull();
  expect(row.session_id).toBeNull();
});

test('never throws even if the insert rejects', async () => {
  mockInsert.mockReturnValueOnce(Promise.reject(new Error('db down')));
  expect(() => logEvent({ event_type: 'view', vendor_id: 'v1' })).not.toThrow();
  await Promise.resolve(); // let the swallowed rejection settle
});

test('never throws even if building the query throws synchronously', () => {
  mockInsert.mockImplementationOnce(() => { throw new Error('client not ready'); });
  expect(() => logEvent({ event_type: 'view', vendor_id: 'v1' })).not.toThrow();
});

test('contextFromReq pulls session id, source and user id', () => {
  const ctx = contextFromReq({
    headers: { 'x-sloth-sid': 'sid-123', referer: 'https://bookasloth.com/' },
    user: { id: 'u9' },
  });
  expect(ctx).toEqual({ session_id: 'sid-123', source: 'https://bookasloth.com/', user_id: 'u9' });
});

test('contextFromReq truncates an overlong session id and tolerates an empty req', () => {
  const ctx = contextFromReq({ headers: { 'x-sloth-sid': 's'.repeat(100) } });
  expect(ctx.session_id.length).toBe(64);
  expect(contextFromReq()).toEqual({ session_id: null, source: null, user_id: null });
});
