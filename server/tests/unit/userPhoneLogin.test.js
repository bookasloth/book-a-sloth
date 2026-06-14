/**
 * tests/unit/userPhoneLogin.test.js
 * Phone-primary user login: loginWithPhone, verifyOtpLogin, setPassword.
 */
jest.mock('../../config/supabase', () => ({
  supabaseAdmin: {
    auth: {
      admin: {
        createUser:      jest.fn(),
        updateUserById:  jest.fn(),
        generateLink:    jest.fn(),
      },
    },
    from: jest.fn(),
  },
  signInWithPassword:  jest.fn(),
  mintSessionForEmail: jest.fn(),
}));

jest.mock('../../utils/sendEmail', () => jest.fn().mockResolvedValue(true));
jest.mock('../../utils/notify',    () => ({ sendOtpNotification: jest.fn().mockResolvedValue({ emailSent: true }) }));
jest.mock('../../utils/otpStore',  () => ({
  set:      jest.fn().mockResolvedValue({ ok: true }),
  verify:   jest.fn(),
  generate: jest.fn(() => '123456'),
}));

const supa      = require('../../config/supabase');
const { supabaseAdmin, signInWithPassword, mintSessionForEmail } = supa;
const otpStore  = require('../../utils/otpStore');
const {
  loginWithPhone, verifyOtpLogin, setPassword,
} = require('../../controllers/authController');

// ── helpers ──────────────────────────────────────────────────────────────────

const req = (body = {}, user = null) => ({ body, user });
const res = () => {
  const r = {};
  r.status = jest.fn().mockReturnValue(r);
  r.json   = jest.fn().mockReturnValue(r);
  return r;
};

// A Supabase query chain whose terminal (single/maybeSingle) resolves to `result`.
const chain = (result = { data: null, error: null }) => ({
  select: jest.fn().mockReturnThis(),
  insert: jest.fn().mockReturnThis(),
  update: jest.fn().mockReturnThis(),
  upsert: jest.fn().mockReturnThis(),
  delete: jest.fn().mockReturnThis(),
  eq:     jest.fn().mockReturnThis(),
  neq:    jest.fn().mockReturnThis(),
  not:    jest.fn().mockReturnThis(),
  is:     jest.fn().mockReturnThis(),
  order:  jest.fn().mockReturnThis(),
  limit:  jest.fn().mockReturnThis(),
  single:      jest.fn().mockResolvedValue(result),
  maybeSingle: jest.fn().mockResolvedValue(result),
});

// Queue the chains `from()` returns, in call order.
const queueFrom = (...chains) => {
  let i = 0;
  supabaseAdmin.from.mockImplementation(() => chains[i++] || chain());
};

const GUEST = {
  id: 'guest-uuid', name: 'Bob', email: 'p919876543210@users.bookasloth.app',
  role: 'guest', plan: 'explorer', username: 'bob', phone: '+919876543210',
  password_set: true, bio: '', tagline: '', profession: '', location: '',
  profile_image: '', cover_image: '', social_links: {}, theme_color: null,
  google_calendar_connected: false, is_verified: false, badges: [],
};

beforeEach(() => {
  jest.clearAllMocks();
  signInWithPassword.mockReset();
  mintSessionForEmail.mockReset();
});

// ── loginWithPhone ─────────────────────────────────────────────────────────────

describe('loginWithPhone', () => {
  test('400 when phone or password missing', async () => {
    const r = res();
    await loginWithPhone(req({ phone: '+919876543210' }), r);
    expect(r.status).toHaveBeenCalledWith(400);
  });

  test('404 when no profile for the phone', async () => {
    queueFrom(chain({ data: null }));
    const r = res();
    await loginWithPhone(req({ phone: '+919876543210', password: 'secret12' }), r);
    expect(r.status).toHaveBeenCalledWith(404);
  });

  test('409 when phone belongs to a vendor', async () => {
    queueFrom(chain({ data: { ...GUEST, role: 'host' } }));
    const r = res();
    await loginWithPhone(req({ phone: '+919876543210', password: 'secret12' }), r);
    expect(r.status).toHaveBeenCalledWith(409);
    expect(r.json.mock.calls[0][0].message).toMatch(/vendor/i);
  });

  test('409 needsPassword when password not yet set', async () => {
    queueFrom(chain({ data: { ...GUEST, password_set: false } }));
    const r = res();
    await loginWithPhone(req({ phone: '+919876543210', password: 'secret12' }), r);
    expect(r.status).toHaveBeenCalledWith(409);
    expect(r.json.mock.calls[0][0].needsPassword).toBe(true);
  });

  test('401 on wrong password', async () => {
    queueFrom(chain({ data: GUEST }));
    signInWithPassword.mockResolvedValue({ data: null, error: { message: 'Invalid' } });
    const r = res();
    await loginWithPhone(req({ phone: '+919876543210', password: 'wrongpas' }), r);
    expect(r.status).toHaveBeenCalledWith(401);
  });

  test('returns profile + session token on success', async () => {
    queueFrom(chain({ data: GUEST }));
    signInWithPassword.mockResolvedValue({
      data: { user: { id: GUEST.id }, session: { access_token: 'tok', refresh_token: 'ref' } },
      error: null,
    });
    const r = res();
    await loginWithPhone(req({ phone: '+919876543210', password: 'secret12' }), r);
    const payload = r.json.mock.calls[0][0];
    expect(payload.token).toBe('tok');
    expect(payload.role).toBe('guest');
    expect(payload.phone).toBe('+919876543210');
    expect(signInWithPassword).toHaveBeenCalledWith(GUEST.email, 'secret12');
  });
});

// ── verifyOtpLogin ──────────────────────────────────────────────────────────────

describe('verifyOtpLogin', () => {
  test('400 when phone or otp missing', async () => {
    const r = res();
    await verifyOtpLogin(req({ phone: '+919876543210' }), r);
    expect(r.status).toHaveBeenCalledWith(400);
  });

  test('400 on invalid OTP', async () => {
    otpStore.verify.mockResolvedValue({ valid: false, reason: 'Invalid OTP.' });
    const r = res();
    await verifyOtpLogin(req({ phone: '+919876543210', otp: '000000' }), r);
    expect(r.status).toHaveBeenCalledWith(400);
  });

  test('existing-by-phone: mints a session and returns token', async () => {
    otpStore.verify.mockResolvedValue({ valid: true });
    queueFrom(chain({ data: GUEST }));            // profiles lookup by phone
    mintSessionForEmail.mockResolvedValue({ access_token: 'tok', refresh_token: 'ref' });
    const r = res();
    await verifyOtpLogin(req({ phone: '+919876543210', otp: '123456' }), r);
    const payload = r.json.mock.calls[0][0];
    expect(payload.token).toBe('tok');
    expect(payload.role).toBe('guest');
    expect(mintSessionForEmail).toHaveBeenCalledWith(GUEST.email);
  });

  test('new phone: creates account, mints session', async () => {
    otpStore.verify.mockResolvedValue({ valid: true });
    const newProfile = { ...GUEST, id: 'new-uuid', password_set: false };
    queueFrom(
      chain({ data: null }),     // profiles lookup by phone → none
      chain({ data: null }),     // bookings lookup by guest_phone → none
      chain({ data: newProfile, error: null }), // upsertProfile → new profile
    );
    supabaseAdmin.auth.admin.createUser.mockResolvedValue({
      data: { user: { id: 'new-uuid', email: newProfile.email } }, error: null,
    });
    mintSessionForEmail.mockResolvedValue({ access_token: 'tok', refresh_token: 'ref' });
    const r = res();
    await verifyOtpLogin(req({ phone: '+919876543210', otp: '123456' }), r);
    const payload = r.json.mock.calls[0][0];
    expect(supabaseAdmin.auth.admin.createUser).toHaveBeenCalled();
    expect(payload.token).toBe('tok');
    expect(payload.password_set).toBe(false);
  });

  test('existing-by-booking: links phone to the prior guest profile', async () => {
    otpStore.verify.mockResolvedValue({ valid: true });
    const linked = { ...GUEST, phone: null, password_set: false };
    queueFrom(
      chain({ data: null }),                     // profiles by phone → none
      chain({ data: { guest_id: GUEST.id } }),   // bookings → guest_id
      chain({ data: linked }),                   // profiles by id → linked
      chain({ data: null }),                     // profiles update phone
    );
    mintSessionForEmail.mockResolvedValue({ access_token: 'tok', refresh_token: 'ref' });
    const r = res();
    await verifyOtpLogin(req({ phone: '+919876543210', otp: '123456' }), r);
    const payload = r.json.mock.calls[0][0];
    expect(payload.token).toBe('tok');
    expect(payload.phone).toBe('+919876543210');
  });

  test('409 when phone resolves to a vendor profile', async () => {
    otpStore.verify.mockResolvedValue({ valid: true });
    queueFrom(chain({ data: { ...GUEST, role: 'host' } }));
    const r = res();
    await verifyOtpLogin(req({ phone: '+919876543210', otp: '123456' }), r);
    expect(r.status).toHaveBeenCalledWith(409);
  });
});

// ── setPassword ─────────────────────────────────────────────────────────────────

describe('setPassword', () => {
  test('400 when password too short', async () => {
    const r = res();
    await setPassword(req({ password: 'short' }, { id: GUEST.id }), r);
    expect(r.status).toHaveBeenCalledWith(400);
  });

  test('flips password_set and returns ok on success', async () => {
    supabaseAdmin.auth.admin.updateUserById.mockResolvedValue({ data: { user: { id: GUEST.id } }, error: null });
    queueFrom(chain({ data: { id: GUEST.id }, error: null })); // profiles update
    const r = res();
    await setPassword(req({ password: 'secret12' }, { id: GUEST.id }), r);
    expect(supabaseAdmin.auth.admin.updateUserById).toHaveBeenCalledWith(GUEST.id, { password: 'secret12' });
    expect(r.json.mock.calls[0][0].ok).toBe(true);
  });

  test('400 when Supabase rejects the password update', async () => {
    supabaseAdmin.auth.admin.updateUserById.mockResolvedValue({ data: null, error: { message: 'weak' } });
    const r = res();
    await setPassword(req({ password: 'secret12' }, { id: GUEST.id }), r);
    expect(r.status).toHaveBeenCalledWith(400);
  });
});
