const db = {
  email_settings: { id: 1, provider: 'resend', from_name: 'BAS', support_email: 's@x', website_url: 'https://x', brand_color: '#FE5100' },
  email_templates: [{ id: 'tA', event_key: 'CAMPAIGN_PROMO', audience: 'all', status: 'active', subject: 'Hi {{first_name}}', html_content: '<p>{{first_name}}</p>', preview_text: '', cta_label: '', cta_url: '' }],
  email_logs: [],
};
jest.mock('../../config/supabase', () => {
  const make = (table) => ({
    select() { return this; }, eq() { return this; }, order() { return this; }, limit() { return this; },
    maybeSingle() { return Promise.resolve({ data: table === 'email_settings' ? db.email_settings : null, error: null }); },
    single() { return Promise.resolve({ data: db.email_templates[0], error: null }); },
    insert(row) { const r = { id: `log${db.email_logs.length + 1}`, ...row }; db.email_logs.push(r); return { select: () => ({ single: () => Promise.resolve({ data: { id: r.id }, error: null }) }) }; },
    then(res) { if (table === 'email_templates') return res({ data: db.email_templates, error: null }); return res({ data: [], error: null }); },
  });
  return { supabaseAdmin: { from: (t) => make(t) }, supabase: {} };
});
jest.mock('../../services/email/providers', () => ({ getProvider: () => ({ name: 'resend', sendEmail: async () => ({ success: true }) }) }));

const engine = require('../../services/email/communicationEngine');
beforeEach(() => { db.email_logs = []; engine.clearCache(); });

test('enqueues a campaign email as a queued log tagged with campaign_id', async () => {
  const r = await engine.enqueueCampaignEmail({
    templateId: 'tA', to: 'a@x.test', data: { first_name: 'Asha' },
    user: { name: 'Asha', email: 'a@x.test' }, campaignId: 'camp1',
  });
  expect(r.ok).toBe(true);
  expect(r.status).toBe('queued');
  expect(db.email_logs).toHaveLength(1);
  expect(db.email_logs[0].campaign_id).toBe('camp1');
  expect(db.email_logs[0].status).toBe('queued');
  expect(db.email_logs[0].subject).toBe('Hi Asha');
  expect(db.email_logs[0].html).toContain('Asha');
});
