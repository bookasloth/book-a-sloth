jest.mock('../../utils/otpStore');
jest.mock('../../utils/notify');
jest.mock('../../config/supabase', () => ({
  supabaseAdmin: { from: jest.fn() },
}));

const otpStore = require('../../utils/otpStore');
const notify = require('../../utils/notify');
const { supabaseAdmin } = require('../../config/supabase');
const { sendOtp, verifyOtp } = require('../../controllers/whatsappController');

const mockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe('whatsappController.sendOtp', () => {
  beforeEach(() => jest.clearAllMocks());

  it('rejects an invalid phone with 400', async () => {
    const res = mockRes();
    await sendOtp({ user: { id: 'u1' }, body: { phone: 'abc' } }, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(otpStore.set).not.toHaveBeenCalled();
  });

  it('generates+stores OTP and sends WhatsApp for a valid phone', async () => {
    otpStore.generate.mockReturnValue('123456');
    otpStore.set.mockResolvedValue({ ok: true });
    notify.sendWhatsAppVerifyOtp.mockResolvedValue(true);
    const res = mockRes();
    await sendOtp({ user: { id: 'u1', name: 'Sam' }, body: { phone: '+919876543210' } }, res);
    expect(otpStore.set).toHaveBeenCalledWith('wa:919876543210', '123456');
    expect(notify.sendWhatsAppVerifyOtp).toHaveBeenCalledWith({ phone: '919876543210', otp: '123456', name: 'Sam' });
    expect(res.json).toHaveBeenCalledWith({ success: true });
  });

  it('surfaces a rate-limit reason with 429', async () => {
    otpStore.generate.mockReturnValue('123456');
    otpStore.set.mockResolvedValue({ ok: false, reason: 'Too many OTP requests. Try again in 15 minutes.' });
    const res = mockRes();
    await sendOtp({ user: { id: 'u1' }, body: { phone: '+919876543210' } }, res);
    expect(res.status).toHaveBeenCalledWith(429);
    expect(notify.sendWhatsAppVerifyOtp).not.toHaveBeenCalled();
  });
});

describe('whatsappController.verifyOtp', () => {
  beforeEach(() => jest.clearAllMocks());

  it('rejects a bad OTP with success:false', async () => {
    otpStore.verify.mockResolvedValue({ valid: false, reason: 'Invalid OTP. 2 attempt(s) left.' });
    const res = mockRes();
    await verifyOtp({ user: { id: 'u1' }, body: { phone: '+919876543210', otp: '000000' } }, res);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ success: false, verified: false })
    );
  });

  it('persists profile + returns verified on a good OTP', async () => {
    otpStore.verify.mockResolvedValue({ valid: true });
    const eq = jest.fn().mockResolvedValue({ error: null });
    const update = jest.fn().mockReturnValue({ eq });
    supabaseAdmin.from.mockReturnValue({ update });
    const res = mockRes();
    await verifyOtp({ user: { id: 'u1' }, body: { phone: '+919876543210', otp: '123456' } }, res);
    expect(supabaseAdmin.from).toHaveBeenCalledWith('profiles');
    expect(update).toHaveBeenCalledWith(expect.objectContaining({
      whatsapp_number: '+919876543210',
      whatsapp_verified: true,
    }));
    expect(eq).toHaveBeenCalledWith('id', 'u1');
    expect(res.json).toHaveBeenCalledWith({ success: true, verified: true });
  });
});
