/**
 * tests/unit/becomeHost.test.js — guest→host opt-in.
 */
jest.mock('../../config/supabase', () => ({
  supabaseAdmin: { from: jest.fn() },
}));
jest.mock('../../utils/sendEmail', () => jest.fn().mockResolvedValue(true));
jest.mock('../../utils/notify',    () => ({ sendOtpNotification: jest.fn().mockResolvedValue({ emailSent: true }) }));
jest.mock('../../utils/otpStore',  () => ({ set: jest.fn(), verify: jest.fn(), generate: jest.fn(() => '123456') }));
jest.mock('../../services/usernameService', () => ({
  createInitialUsername: jest.fn(), recordInitialUsername: jest.fn(),
}));

const { supabaseAdmin } = require('../../config/supabase');
const { becomeHost } = require('../../controllers/authController');

const res = () => {
  const r = {};
  r.status = jest.fn().mockReturnValue(r);
  r.json   = jest.fn().mockReturnValue(r);
  return r;
};
beforeEach(() => jest.clearAllMocks());

test('guest is flipped to host with onboarding seeded', async () => {
  // 1st from(): read role+username (guest). 2nd from(): update → returns host row.
  supabaseAdmin.from
    .mockReturnValueOnce({
      select: jest.fn().mockReturnThis(), eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({ data: { id: 'g1', role: 'guest', username: 'cool-otter-7' }, error: null }),
    })
    .mockReturnValueOnce({
      update: jest.fn().mockReturnThis(), eq: jest.fn().mockReturnThis(), select: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({ data: { id: 'g1', role: 'host', username: 'cool-otter-7', plan: 'explorer', onboarding_slug: 'cool-otter-7', onboarding_step_completed: 3 }, error: null }),
    });
  const r = res();
  await becomeHost({ user: { id: 'g1' } }, r);
  expect(r.status).toHaveBeenCalledWith(200);
  expect(r.json.mock.calls[0][0].role).toBe('host');
});

test('already a host → idempotent 200, no update issued', async () => {
  const updateSpy = jest.fn().mockReturnThis();
  supabaseAdmin.from
    .mockReturnValueOnce({
      select: jest.fn().mockReturnThis(), eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({ data: { id: 'h1', role: 'host', username: 'h' }, error: null }),
    })
    .mockReturnValueOnce({
      update: updateSpy,
      select: jest.fn().mockReturnThis(), eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({ data: { id: 'h1', role: 'host', username: 'h', plan: 'creator' }, error: null }),
    });
  const r = res();
  await becomeHost({ user: { id: 'h1' } }, r);
  expect(r.json.mock.calls[0][0].role).toBe('host');
  expect(updateSpy).not.toHaveBeenCalled();
});

test('profile not found → 404', async () => {
  supabaseAdmin.from.mockReturnValueOnce({
    select: jest.fn().mockReturnThis(), eq: jest.fn().mockReturnThis(),
    single: jest.fn().mockResolvedValue({ data: null, error: null }),
  });
  const r = res();
  await becomeHost({ user: { id: 'nope' } }, r);
  expect(r.status).toHaveBeenCalledWith(404);
});
