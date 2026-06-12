/**
 * Verifies the payment-bug fix: createBooking must NOT create a Google Calendar
 * event for PAID services (deferred to verifyPayment). Free services still do.
 */
jest.mock('../../config/google', () => ({
  createCalendarEvent: jest.fn().mockResolvedValue({ meetLink: 'https://meet.google.com/x' }),
}));
jest.mock('../../utils/cryptoTokens', () => ({ decrypt: (v) => v }));
jest.mock('../../services/availabilityService', () => ({
  validateSlot: jest.fn().mockResolvedValue({ ok: true }),
}));
jest.mock('../../middleware/planMiddleware', () => ({
  checkBookingReceiveLimit: jest.fn().mockResolvedValue({ allowed: true }),
}));
jest.mock('../../services/planService', () => ({
  resolveVendorPlan: () => 'explorer',
  getPlan: jest.fn().mockResolvedValue({ commission_percentage: 0 }),
}));
jest.mock('../../services/platformConfig', () => ({
  getConfig: jest.fn().mockResolvedValue({ platformFee: 10, gstRate: 0.18 }),
}));
jest.mock('../../services/notificationEngine', () => ({ send: jest.fn().mockResolvedValue() }));
jest.mock('../../utils/sendEmail', () => jest.fn().mockResolvedValue());
jest.mock('../../lib/pricingEngine', () => ({
  computeBreakdown: () => ({ platformFee: 10, commission: 0, vendorPayout: 100, gst: 1.8, customerTotal: 111.8 }),
}));

const mockFrom = jest.fn();
jest.mock('../../config/supabase', () => ({ supabaseAdmin: { from: (...a) => mockFrom(...a) } }));

const { createCalendarEvent } = require('../../config/google');
const { createBooking } = require('../../controllers/bookingController');

const res = () => { const r = {}; r.status = jest.fn(() => r); r.json = jest.fn(() => r); return r; };

const wireSupabase = ({ service, host, avail }) => {
  mockFrom.mockImplementation((table) => {
    const chain = {
      select: jest.fn(() => chain), eq: jest.fn(() => chain), neq: jest.fn(() => chain),
      insert: jest.fn(() => chain),
      single: jest.fn().mockResolvedValue(
        table === 'services' ? { data: service } :
        table === 'profiles' ? { data: host } :
        { data: { id: 'bkg-1', ...service }, error: null }),
      maybeSingle: jest.fn().mockResolvedValue({ data: avail }),
    };
    return chain;
  });
};

beforeEach(() => jest.clearAllMocks());

test('paid online service does NOT create a calendar event at booking time', async () => {
  wireSupabase({
    service: { id: 's1', title: 'SEO', duration: 30, price: 500, meeting_mode: 'online' },
    host: { id: 'h1', email: 'h@x.com', google_calendar_connected: true, google_refresh_token: 'r', google_access_token: 'a' },
    avail: { timezone: 'Asia/Kolkata' },
  });
  const req = { body: { service_id: 's1', host_id: 'h1', guest_name: 'G', guest_email: 'g@x.com', scheduled_at: '2099-01-01T05:00:00.000Z' } };
  await createBooking(req, res());
  expect(createCalendarEvent).not.toHaveBeenCalled();
});

test('free online service STILL creates a calendar event at booking time', async () => {
  wireSupabase({
    service: { id: 's1', title: 'Intro', duration: 30, price: 0, meeting_mode: 'online' },
    host: { id: 'h1', email: 'h@x.com', google_calendar_connected: true, google_refresh_token: 'r', google_access_token: 'a' },
    avail: { timezone: 'Asia/Kolkata' },
  });
  const req = { body: { service_id: 's1', host_id: 'h1', guest_name: 'G', guest_email: 'g@x.com', scheduled_at: '2099-01-01T05:00:00.000Z' } };
  await createBooking(req, res());
  expect(createCalendarEvent).toHaveBeenCalledTimes(1);
});
