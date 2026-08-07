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
  // Input-sensitive so the calendar branch (keyed off customerTotal) is exercised:
  // a genuinely-free booking (price 0, no fee) totals 0; a paid one totals > 0.
  computeBreakdown: ({ servicePrice = 0, chargeFeeOnFree = false }) => {
    const fee = servicePrice === 0 && !chargeFeeOnFree ? 0 : 10;
    const gst = Math.round(fee * 0.18 * 100) / 100;
    return { platformFee: fee, commission: 0, vendorPayout: servicePrice, commissionGst: 0, commissionTaxable: 0, tds: 0, tcs: 0, gst, customerTotal: servicePrice + fee + gst };
  },
}));

const mockFrom = jest.fn();
jest.mock('../../config/supabase', () => ({ supabaseAdmin: { from: (...a) => mockFrom(...a) } }));

const { createCalendarEvent } = require('../../config/google');
const { createBooking } = require('../../controllers/bookingController');
const guestGrant = require('../../utils/bookingGrant');

const res = () => { const r = {}; r.status = jest.fn(() => r); r.json = jest.fn(() => r); return r; };

const wireSupabase = ({ service, host, avail, panOnFile = true }) => {
  mockFrom.mockImplementation((table) => {
    const chain = {
      select: jest.fn(() => chain), eq: jest.fn(() => chain), neq: jest.fn(() => chain),
      not: jest.fn(() => chain), insert: jest.fn(() => chain),
      single: jest.fn().mockResolvedValue(
        table === 'services' ? { data: service } :
        table === 'profiles' ? { data: host } :
        { data: { id: 'bkg-1', ...service }, error: null }),
      maybeSingle: jest.fn().mockResolvedValue(
        table === 'kyc_submissions' ? { data: panOnFile ? { user_id: host?.id } : null } :
        { data: avail }),
    };
    return chain;
  });
};

beforeEach(() => jest.clearAllMocks());

test('paid online service does NOT create a calendar event at booking time', async () => {
  wireSupabase({
    service: { id: 's1', title: 'SEO', duration: 30, price: 500, meeting_mode: 'online' },
    host: { id: 'h1', email: 'h@x.com', google_calendar_connected: true, google_refresh_token: 'r', google_access_token: 'a', razorpay_route_account_id: 'acc_test', razorpay_route_status: 'active' },
    avail: { timezone: 'Asia/Kolkata' },
  });
  const req = { body: { service_id: 's1', host_id: 'h1', guest_name: 'G', guest_email: 'g@x.com', scheduled_at: '2099-01-01T05:00:00.000Z', booking_grant: guestGrant.issue({ email: 'g@x.com' }) } };
  await createBooking(req, res());
  expect(createCalendarEvent).not.toHaveBeenCalled();
});

test('free online service STILL creates a calendar event at booking time', async () => {
  wireSupabase({
    service: { id: 's1', title: 'Intro', duration: 30, price: 0, meeting_mode: 'online' },
    host: { id: 'h1', email: 'h@x.com', google_calendar_connected: true, google_refresh_token: 'r', google_access_token: 'a' },
    avail: { timezone: 'Asia/Kolkata' },
  });
  const req = { body: { service_id: 's1', host_id: 'h1', guest_name: 'G', guest_email: 'g@x.com', scheduled_at: '2099-01-01T05:00:00.000Z', booking_grant: guestGrant.issue({ email: 'g@x.com' }) } };
  await createBooking(req, res());
  expect(createCalendarEvent).toHaveBeenCalledTimes(1);
});

// ── Security audit H-1: server-side OTP gate ──
test('anonymous booking WITHOUT a valid OTP grant is rejected 401', async () => {
  wireSupabase({
    service: { id: 's1', title: 'SEO', duration: 30, price: 500, meeting_mode: 'online' },
    host: { id: 'h1', email: 'h@x.com' },
    avail: { timezone: 'Asia/Kolkata' },
  });
  const r = res();
  // No req.user, no booking_grant — the OTP gate must block before any insert.
  const req = { body: { service_id: 's1', guest_name: 'G', guest_email: 'g@x.com', scheduled_at: '2099-01-01T05:00:00.000Z' } };
  await createBooking(req, r);
  expect(r.status).toHaveBeenCalledWith(401);
  expect(createCalendarEvent).not.toHaveBeenCalled();
});

test('anonymous booking with a grant for a DIFFERENT contact is rejected 401', async () => {
  wireSupabase({
    service: { id: 's1', title: 'SEO', duration: 30, price: 500, meeting_mode: 'online' },
    host: { id: 'h1', email: 'h@x.com' },
    avail: { timezone: 'Asia/Kolkata' },
  });
  const r = res();
  const req = { body: { service_id: 's1', guest_name: 'G', guest_email: 'victim@x.com', scheduled_at: '2099-01-01T05:00:00.000Z', booking_grant: guestGrant.issue({ email: 'attacker@x.com' }) } };
  await createBooking(req, r);
  expect(r.status).toHaveBeenCalledWith(401);
});

test('logged-in booking needs no OTP grant (reaches insert → 201)', async () => {
  wireSupabase({
    service: { id: 's1', title: 'SEO', duration: 30, price: 500, meeting_mode: 'online' },
    host: { id: 'h1', email: 'h@x.com', razorpay_route_account_id: 'acc_test', razorpay_route_status: 'active' },
    avail: { timezone: 'Asia/Kolkata' },
  });
  const r = res();
  const req = { user: { id: 'u1' }, body: { service_id: 's1', guest_name: 'G', guest_email: 'g@x.com', scheduled_at: '2099-01-01T05:00:00.000Z' } };
  await createBooking(req, r);
  expect(r.status).toHaveBeenCalledWith(201);
});

// ── v4 TDS 194-O: PAN mandatory for PAID bookings ──
test('paid booking is rejected 409 when the host has no PAN on file', async () => {
  wireSupabase({
    service: { id: 's1', title: 'SEO', duration: 30, price: 500, meeting_mode: 'online' },
    host: { id: 'h1', email: 'h@x.com' },
    avail: { timezone: 'Asia/Kolkata' },
    panOnFile: false,
  });
  const r = res();
  const req = { user: { id: 'u1' }, body: { service_id: 's1', guest_name: 'G', guest_email: 'g@x.com', scheduled_at: '2099-01-01T05:00:00.000Z' } };
  await createBooking(req, r);
  expect(r.status).toHaveBeenCalledWith(409);
  expect(createCalendarEvent).not.toHaveBeenCalled();
});

test('free booking is allowed even when the host has no PAN (no TDS on ₹0)', async () => {
  wireSupabase({
    service: { id: 's1', title: 'Intro', duration: 30, price: 0, meeting_mode: 'online' },
    host: { id: 'h1', email: 'h@x.com', google_calendar_connected: true, google_refresh_token: 'r', google_access_token: 'a' },
    avail: { timezone: 'Asia/Kolkata' },
    panOnFile: false,
  });
  const r = res();
  const req = { user: { id: 'u1' }, body: { service_id: 's1', guest_name: 'G', guest_email: 'g@x.com', scheduled_at: '2099-01-01T05:00:00.000Z' } };
  await createBooking(req, r);
  expect(r.status).toHaveBeenCalledWith(201);
});
