/**
 * tests/unit/notificationEngine.test.js
 * Notification engine unit tests — mocked Supabase, sendEmail and AiSensy.
 */

const mockTables = {
  notification_events: [],
  notification_providers: [],
  notification_logs: [],
};

jest.mock('../../config/supabase', () => {
  const admin = {
    from(table) {
      return {
        select() {
          return Promise.resolve({ data: mockTables[table] || [], error: null });
        },
        insert(row) {
          (mockTables.notification_logs ||= []).push(row);
          return Promise.resolve({ error: null });
        },
      };
    },
  };
  return { supabaseAdmin: admin, supabase: admin };
});

// The email path now delegates to the Communication Engine (DB templates + queue).
jest.mock('../../services/email/communicationEngine', () => ({
  send: jest.fn().mockResolvedValue({ ok: true, status: 'queued', logId: 'log1' }),
}));
jest.mock('../../services/aisensyService', () => ({
  sendCampaign: jest.fn().mockResolvedValue({ success: true, response: { ok: true } }),
  testConnection: jest.fn(),
}));

const communicationEngine = require('../../services/email/communicationEngine');
const aisensy = require('../../services/aisensyService');
const NotificationEngine = require('../../services/notificationEngine');

const CONFIRMED_EVENT = {
  event_key: 'BOOKING_CONFIRMED_CUSTOMER',
  whatsapp_enabled: true,
  email_enabled: true,
  campaign_name: 'booking_confirmation_user',
  email_subject: 'Booking confirmed',
  is_active: true,
};
const AISENSY_PROVIDER = { provider: 'aisensy', api_key: 'k-123', is_active: true, settings_json: {} };

describe('NotificationEngine', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockTables.notification_events = [CONFIRMED_EVENT];
    mockTables.notification_providers = [AISENSY_PROVIDER];
    mockTables.notification_logs = [];
    NotificationEngine.clearCache();
  });

  test('sends WhatsApp + email when both channels enabled', async () => {
    const result = await NotificationEngine.send({
      event: 'BOOKING_CONFIRMED_CUSTOMER',
      data: {
        phone: '919876543210', name: 'Shubham',
        templateParams: ['Shubham', 'SEO Consultation', 'Book A Sloth', '21/10 10:00'],
        email: 'guest@example.com', emailData: { service_name: 'SEO Consultation' },
      },
    });
    expect(result.whatsapp.success).toBe(true);
    expect(result.email.success).toBe(true);
    // Engine, not caller, resolves the campaign name from config
    expect(aisensy.sendCampaign).toHaveBeenCalledWith(
      expect.objectContaining({ campaignName: 'booking_confirmation_user', apiKey: 'k-123' })
    );
    // Email delegated to the Communication Engine by event (no inline HTML)
    expect(communicationEngine.send).toHaveBeenCalledWith(
      expect.objectContaining({ event: 'BOOKING_CONFIRMED_CUSTOMER', to: 'guest@example.com' })
    );
    // Both channels logged in notification_logs (cross-channel summary)
    expect(mockTables.notification_logs).toHaveLength(2);
    expect(mockTables.notification_logs.map((l) => l.channel).sort()).toEqual(['email', 'whatsapp']);
  });

  test('skips WhatsApp when event has whatsapp_enabled=false', async () => {
    mockTables.notification_events = [{ ...CONFIRMED_EVENT, whatsapp_enabled: false }];
    const result = await NotificationEngine.send({
      event: 'BOOKING_CONFIRMED_CUSTOMER',
      data: { phone: '919876543210', email: 'a@b.com' },
    });
    expect(result.whatsapp.attempted).toBe(false);
    expect(aisensy.sendCampaign).not.toHaveBeenCalled();
    expect(result.email.success).toBe(true);
  });

  test('skips WhatsApp when provider is inactive', async () => {
    mockTables.notification_providers = [{ ...AISENSY_PROVIDER, is_active: false }];
    const result = await NotificationEngine.send({
      event: 'BOOKING_CONFIRMED_CUSTOMER',
      data: { phone: '919876543210', email: 'a@b.com' },
    });
    expect(result.whatsapp.attempted).toBe(false);
  });

  test('skips email when event has email_enabled=false', async () => {
    mockTables.notification_events = [{ ...CONFIRMED_EVENT, email_enabled: false }];
    const result = await NotificationEngine.send({
      event: 'BOOKING_CONFIRMED_CUSTOMER',
      data: { phone: '919876543210', email: 'a@b.com' },
    });
    expect(result.email.attempted).toBe(false);
    expect(communicationEngine.send).not.toHaveBeenCalled();
    expect(result.whatsapp.success).toBe(true);
  });

  test('inactive event sends nothing', async () => {
    mockTables.notification_events = [{ ...CONFIRMED_EVENT, is_active: false }];
    const result = await NotificationEngine.send({
      event: 'BOOKING_CONFIRMED_CUSTOMER',
      data: { phone: '919876543210', email: 'a@b.com' },
    });
    expect(result.whatsapp.attempted).toBe(false);
    expect(result.email.attempted).toBe(false);
  });

  test('unknown event falls back to email-only defaults', async () => {
    const result = await NotificationEngine.send({
      event: 'SOME_FUTURE_EVENT',
      data: { phone: '919876543210', email: 'a@b.com' },
    });
    expect(result.whatsapp.attempted).toBe(false);
    expect(result.email.success).toBe(true);
  });

  test('logs a failed WhatsApp delivery with the error', async () => {
    aisensy.sendCampaign.mockResolvedValueOnce({ success: false, error: 'Template not found' });
    const result = await NotificationEngine.send({
      event: 'BOOKING_CONFIRMED_CUSTOMER',
      data: { phone: '919876543210', name: 'X', templateParams: ['a'] },
    });
    expect(result.whatsapp.success).toBe(false);
    const log = mockTables.notification_logs.find((l) => l.channel === 'whatsapp');
    expect(log.status).toBe('failed');
    expect(log.error).toBe('Template not found');
  });

  test('email failure from the engine is captured, not thrown', async () => {
    communicationEngine.send.mockResolvedValueOnce({ ok: false, status: 'failed', error: 'no_template' });
    const result = await NotificationEngine.send({
      event: 'BOOKING_CONFIRMED_CUSTOMER',
      data: { email: 'a@b.com' },
    });
    expect(result.email.success).toBe(false);
    expect(result.email.error).toBe('no_template');
  });

  test('forwards inferred vendor audience to the communication engine (_VENDOR event)', async () => {
    mockTables.notification_events = [{ ...CONFIRMED_EVENT, event_key: 'BOOKING_CONFIRMED_VENDOR' }];
    await NotificationEngine.send({ event: 'BOOKING_CONFIRMED_VENDOR', data: { email: 'host@x.com' } });
    expect(communicationEngine.send).toHaveBeenCalledWith(expect.objectContaining({ audience: 'vendor' }));
  });

  test('explicit data.audience overrides inference', async () => {
    await NotificationEngine.send({ event: 'BOOKING_CONFIRMED_CUSTOMER', data: { email: 'a@b.com', audience: 'vendor' } });
    expect(communicationEngine.send).toHaveBeenCalledWith(expect.objectContaining({ audience: 'vendor' }));
  });
});

describe('NotificationEngine.inferAudience', () => {
  const { inferAudience } = NotificationEngine;
  test('explicit wins', () => expect(inferAudience('BOOKING_CONFIRMED_CUSTOMER', 'vendor')).toBe('vendor'));
  test('_VENDOR suffix → vendor', () => expect(inferAudience('BOOKING_REMINDER_VENDOR')).toBe('vendor'));
  test('_CUSTOMER suffix → customer', () => expect(inferAudience('BOOKING_REMINDER_CUSTOMER')).toBe('customer'));
  test('vendor-lifecycle event → vendor', () => {
    expect(inferAudience('VENDOR_WELCOME')).toBe('vendor');
    expect(inferAudience('PROFILE_VERIFIED')).toBe('vendor');
    expect(inferAudience('SUBSCRIPTION_PURCHASED')).toBe('vendor');
  });
  test('auth/security/generic → all (customer shell)', () => {
    expect(inferAudience('BOOKING_OTP')).toBe('all');
    expect(inferAudience('PASSWORD_RESET')).toBe('all');
    expect(inferAudience('SECURITY_PASSWORD_CHANGED')).toBe('all');
  });
});
