jest.mock('../../config/google', () => ({
  updateCalendarEvent: jest.fn().mockResolvedValue({}),
  createCalendarEvent: jest.fn(),
}));
jest.mock('../../services/featureFlags', () => ({ isFeatureEnabled: jest.fn() }));
jest.mock('../../services/notificationEngine', () => ({ send: jest.fn().mockResolvedValue() }));
jest.mock('../../utils/cryptoTokens', () => ({ decryptToken: (v) => v, decrypt: (v) => v }));

const mockFrom = jest.fn();
jest.mock('../../config/supabase', () => ({ supabaseAdmin: { from: (...a) => mockFrom(...a) } }));

const featureFlags = require('../../services/featureFlags');
const { updateCalendarEvent } = require('../../config/google');
const { rescheduleBooking } = require('../../controllers/bookingController');

const res = () => { const r = {}; r.status = jest.fn(() => r); r.json = jest.fn(() => r); return r; };
const futureISO = '2099-01-01T05:00:00.000Z';
const baseBooking = {
  id: 'b1', host_id: 'h1', guest_id: 'g1', status: 'confirmed', reschedule_count: 0,
  scheduled_at: '2098-12-01T05:00:00.000Z', services: { duration: 30, grace_period_minutes: 10 },
  google_event_id: 'evt1',
  'profiles!bookings_host_id_fkey': { id: 'h1', google_calendar_connected: true, google_refresh_token: 'r', google_access_token: 'a', reschedule_fee: 0 },
};

// Supabase mock: the FIRST .single() returns the booking; conflict query (await on
// the chain after .lte) resolves to { data: [], error: null }; the update().select().single()
// returns the updated row. Make the chain awaitable (thenable) resolving to empty conflicts.
const wire = (booking) => mockFrom.mockImplementation(() => {
  const chain = {
    select: jest.fn(() => chain), eq: jest.fn(() => chain), neq: jest.fn(() => chain),
    gte: jest.fn(() => chain), lte: jest.fn(() => chain), order: jest.fn(() => chain),
    update: jest.fn(() => chain),
    single: jest.fn().mockResolvedValue({ data: booking, error: null }),
    maybeSingle: jest.fn().mockResolvedValue({ data: { timezone: 'Asia/Kolkata', buffer_minutes: 0 } }),
    then: (resolve) => resolve({ data: [], error: null }), // conflict query awaits to empty
  };
  return chain;
});

beforeEach(() => jest.clearAllMocks());

test('403 when reschedule flag is off', async () => {
  featureFlags.isFeatureEnabled.mockResolvedValue(false);
  wire(baseBooking);
  const r = res();
  await rescheduleBooking({ params: { id: 'b1' }, user: { id: 'g1' }, body: { scheduled_at: futureISO } }, r);
  expect(r.status).toHaveBeenCalledWith(403);
});

test('guest reschedule patches the calendar event when flag on', async () => {
  featureFlags.isFeatureEnabled.mockResolvedValue(true);
  wire(baseBooking);
  const r = res();
  await rescheduleBooking({ params: { id: 'b1' }, user: { id: 'g1' }, body: { scheduled_at: futureISO } }, r);
  expect(updateCalendarEvent).toHaveBeenCalledWith('a', 'r', 'evt1', expect.objectContaining({ timezone: 'Asia/Kolkata' }));
});
