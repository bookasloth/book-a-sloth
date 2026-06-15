/**
 * tests/unit/communicationEngine.test.js
 * Engine queue/immediate/test/retry — mocked Supabase + provider.
 */
'use strict';

const db = {
  email_settings: { id: 1, provider: 'smtp', from_name: 'Book A Sloth', support_email: 's@x.test', website_url: 'https://x.test', brand_color: '#FE5100' },
  email_templates: [
    { id: 't1', event_key: 'BOOKING_CONFIRMED_CUSTOMER', audience: 'all', status: 'active',
      subject: 'Confirmed: {{service_name}}', preview_text: 'hi', html_content: '<p>Hi {{first_name}}</p>', cta_label: '', cta_url: '' },
    { id: 't2', event_key: 'BOOKING_OTP', audience: 'all', status: 'active',
      subject: 'Code {{otp}}', preview_text: '', html_content: '<p>{{otp}}</p>', cta_label: '', cta_url: '' },
    { id: 't3', event_key: 'BADGE_UNLOCKED', audience: 'all', status: 'active',
      subject: 'Badge!', preview_text: '', html_content: '<p>nice</p>', cta_label: '', cta_url: '' },
  ],
  email_logs: [],
  email_unsubscribes: [], // list of opted-out emails
};

let mockProviderState = { success: true };

jest.mock('../../config/supabase', () => {
  const make = (table) => {
    const filters = [];
    const api = {
      select() { return api; },
      eq(c, v) { filters.push(['eq', c, v]); return api; },
      lte(c, v) { filters.push(['lte', c, v]); return api; },
      order() { return api; },
      limit() { return api; },
      maybeSingle() {
        if (table === 'email_settings') return Promise.resolve({ data: db.email_settings, error: null });
        if (table === 'email_unsubscribes') {
          const f = filters.find((x) => x[0] === 'eq' && x[1] === 'email');
          const email = f && f[2];
          const hit = db.email_unsubscribes.includes(email);
          return Promise.resolve({ data: hit ? { email } : null, error: null });
        }
        return Promise.resolve({ data: null, error: null });
      },
      single() {
        return Promise.resolve({ data: null, error: null });
      },
      insert(row) {
        const rows = [].concat(row).map((r, i) => ({ id: `log${db.email_logs.length + i + 1}`, ...r }));
        db.email_logs.push(...rows);
        return { select: () => ({ single: () => Promise.resolve({ data: { id: rows[0].id }, error: null }) }) };
      },
      update(changes) {
        return { eq: (c, v) => { const row = db.email_logs.find((r) => r[c] === v); if (row) Object.assign(row, changes); return Promise.resolve({ error: null }); } };
      },
      then(resolve) {
        // terminal: used for .select() list reads
        if (table === 'email_templates') return resolve({ data: db.email_templates, error: null });
        if (table === 'email_logs') {
          // queue read: status=queued and next_attempt_at<=now
          const due = db.email_logs.filter((r) => r.status === 'queued');
          return resolve({ data: due, error: null });
        }
        return resolve({ data: [], error: null });
      },
    };
    return api;
  };
  return { supabaseAdmin: { from: (t) => make(t) }, supabase: {} };
});

jest.mock('../../services/email/providers', () => ({
  getProvider: () => ({ name: 'smtp', sendEmail: async () => (mockProviderState.success ? { success: true, id: 'm1' } : { success: false, error: 'smtp down' }) }),
}));

const engine = require('../../services/email/communicationEngine');

beforeEach(() => { db.email_logs = []; db.email_unsubscribes = []; mockProviderState = { success: true }; engine.clearCache(); });

describe('communicationEngine.send', () => {
  test('queues a normal email (status queued, not yet sent)', async () => {
    const r = await engine.send({ event: 'BOOKING_CONFIRMED_CUSTOMER', to: 'a@x.test', data: { service_name: 'SEO' }, user: { name: 'Asha Verma' } });
    expect(r.status).toBe('queued');
    expect(db.email_logs).toHaveLength(1);
    expect(db.email_logs[0].status).toBe('queued');
    expect(db.email_logs[0].subject).toBe('Confirmed: SEO');
    expect(db.email_logs[0].html).toContain('Hi Asha');
  });

  test('OTP sends immediately (status sent)', async () => {
    const r = await engine.send({ event: 'BOOKING_OTP', to: 'a@x.test', immediate: true, data: { otp: '123456' } });
    expect(r.status).toBe('sent');
    expect(db.email_logs[0].status).toBe('sent');
    expect(db.email_logs[0].subject).toBe('Code 123456');
  });

  test('immediate send failure falls back to queued for retry', async () => {
    mockProviderState.success = false;
    const r = await engine.send({ event: 'BOOKING_OTP', to: 'a@x.test', immediate: true, data: { otp: '1' } });
    expect(r.status).toBe('queued');
    expect(db.email_logs[0].status).toBe('queued');
  });

  test('test send is marked TEST and delivered', async () => {
    const r = await engine.send({ event: 'BOOKING_OTP', to: 'a@x.test', isTest: true, data: { otp: '1' } });
    expect(r.status).toBe('test');
    expect(db.email_logs[0].is_test).toBe(true);
    expect(db.email_logs[0].status).toBe('test');
  });

  test('unknown event → no template, nothing logged', async () => {
    const r = await engine.send({ event: 'NOPE', to: 'a@x.test' });
    expect(r.ok).toBe(false);
    expect(r.reason).toBe('no_template');
    expect(db.email_logs).toHaveLength(0);
  });
});

describe('communicationEngine — marketing unsubscribe', () => {
  test('marketing event to an opted-out address is suppressed (not queued)', async () => {
    db.email_unsubscribes = ['opted@x.test'];
    const r = await engine.send({ event: 'BADGE_UNLOCKED', to: 'opted@x.test', data: {}, user: {} });
    expect(r.status).toBe('suppressed');
    expect(db.email_logs[0].status).toBe('suppressed');
  });

  test('marketing event to a subscribed address still queues', async () => {
    const r = await engine.send({ event: 'BADGE_UNLOCKED', to: 'ok@x.test', data: {}, user: {} });
    expect(r.status).toBe('queued');
    expect(db.email_logs[0].status).toBe('queued');
  });

  test('transactional event to an opted-out address still sends (carve-out)', async () => {
    db.email_unsubscribes = ['opted@x.test'];
    const r = await engine.send({ event: 'BOOKING_CONFIRMED_CUSTOMER', to: 'opted@x.test', data: { service_name: 'X' }, user: {} });
    expect(r.status).toBe('queued');
    expect(db.email_logs[0].status).toBe('queued');
  });

  test('isMarketing flags lifecycle + campaigns, not transactional', () => {
    expect(engine.isMarketing('BADGE_UNLOCKED')).toBe(true);
    expect(engine.isMarketing('CAMPAIGN:abc')).toBe(true);
    expect(engine.isMarketing('BOOKING_CONFIRMED_CUSTOMER')).toBe(false);
    expect(engine.isMarketing('BOOKING_OTP')).toBe(false);
  });

  test('queued marketing email embeds an unsubscribe token in the customer footer', async () => {
    const r = await engine.send({ event: 'BADGE_UNLOCKED', to: 'ok@x.test', audience: 'customer', data: {}, user: {} });
    expect(r.status).toBe('queued');
    expect(db.email_logs[0].html).toMatch(/\/unsubscribe\?u=[\w.\-]+/);
  });
});

describe('communicationEngine.renderEmail — recipient-driven layout', () => {
  const settings = { brand_color: '#FE5100', website_url: 'https://x.test', support_email: 's@x.test', from_name: 'Book A Sloth', logo_url: 'https://cdn.test/bas.png' };
  const template = { subject: 'Hi', html_content: '<p>body {{first_name}}</p>', cta_label: '', cta_url: '', email_category: 'Booking', preview_text: '' };

  test("audience 'vendor' → host-branded vendor shell", () => {
    const { html } = engine.renderEmail(template, {
      settings, audience: 'vendor', user: { name: 'Asha' },
      data: { company_logo: 'https://cdn.test/host.png', company_name: 'Asha Studio' },
    });
    expect(html).toContain('https://cdn.test/host.png');
    expect(html).toMatch(/Powered by/i);
    expect(html).not.toMatch(/My Bookings/i);
    expect(html).toContain('body Asha'); // same body resolves regardless of shell
  });

  test("audience 'customer' and 'all' → Book A Sloth customer shell with unsubscribe", () => {
    for (const audience of ['customer', 'all', undefined]) {
      const { html } = engine.renderEmail(template, { settings, audience, user: { name: 'Asha' }, data: {} });
      expect(html).toContain('https://cdn.test/bas.png');
      expect(html).toMatch(/My Bookings/i);
      expect(html).toMatch(/Unsubscribe/i);
      expect(html).not.toMatch(/Powered by/i);
    }
  });
});

describe('communicationEngine.processQueue — retry backoff', () => {
  test('successful send marks the row sent', async () => {
    await engine.send({ event: 'BOOKING_CONFIRMED_CUSTOMER', to: 'a@x.test', data: { service_name: 'X' }, user: { name: 'A' } });
    const r = await engine.processQueue();
    expect(r.sent).toBe(1);
    expect(db.email_logs[0].status).toBe('sent');
  });

  test('failures retry 3 times (5m/30m/2h) then fail permanently', async () => {
    await engine.send({ event: 'BOOKING_CONFIRMED_CUSTOMER', to: 'a@x.test', data: {}, user: {} });
    mockProviderState.success = false;

    // try #1 → attempts 1, requeued
    let r = await engine.processQueue();
    expect(r.retried).toBe(1);
    expect(db.email_logs[0].attempts).toBe(1);
    expect(db.email_logs[0].status).toBe('queued');

    // try #2 → attempts 2, requeued
    r = await engine.processQueue();
    expect(db.email_logs[0].attempts).toBe(2);
    expect(db.email_logs[0].status).toBe('queued');

    // try #3 → attempts 3, requeued (last retry slot)
    r = await engine.processQueue();
    expect(db.email_logs[0].attempts).toBe(3);
    expect(db.email_logs[0].status).toBe('queued');

    // try #4 → exhausted, permanent fail
    r = await engine.processQueue();
    expect(r.failed).toBe(1);
    expect(db.email_logs[0].attempts).toBe(4);
    expect(db.email_logs[0].status).toBe('failed');
  });
});
