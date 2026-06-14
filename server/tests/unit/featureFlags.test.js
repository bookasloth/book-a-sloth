const mockFrom = jest.fn();
jest.mock('../../config/supabase', () => ({ supabaseAdmin: { from: (...a) => mockFrom(...a) } }));
const featureFlags = require('../../services/featureFlags');

const wire = (rows, error = null) =>
  mockFrom.mockImplementation(() => ({ select: jest.fn().mockResolvedValue({ data: rows, error }) }));

beforeEach(() => { jest.clearAllMocks(); featureFlags.clearCache(); });

test('returns the stored enabled value', async () => {
  wire([{ key: 'reschedule', enabled: false }]);
  expect(await featureFlags.isFeatureEnabled('reschedule')).toBe(false);
});

test('fail-open: unknown key defaults to enabled', async () => {
  wire([]);
  expect(await featureFlags.isFeatureEnabled('nope')).toBe(true);
});

test('fail-open: on DB error defaults to enabled', async () => {
  wire(null, { message: 'boom' });
  expect(await featureFlags.isFeatureEnabled('reschedule')).toBe(true);
});

test('caches within TTL (one DB read for two calls)', async () => {
  wire([{ key: 'reschedule', enabled: true }]);
  await featureFlags.isFeatureEnabled('reschedule');
  await featureFlags.isFeatureEnabled('reschedule');
  expect(mockFrom).toHaveBeenCalledTimes(1);
});
