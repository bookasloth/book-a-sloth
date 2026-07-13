// config/supabase.js fail-fasts at require-time if SUPABASE_SERVICE_ROLE_KEY
// isn't set (missing in CI/local shells without server/.env loaded). This test
// only exercises the pure validateLead/buildLeadEmail helpers, never
// supabaseAdmin, so mock it out — same pattern as tests/unit/adminController.test.js.
jest.mock('../../config/supabase', () => ({ supabaseAdmin: { from: jest.fn() } }));

const { validateLead, buildLeadEmail } = require('../../controllers/enterpriseLeadController');

describe('enterprise lead validation', () => {
  const valid = { orgName: 'Acme Health', email: 'ops@acme.com', phone: '9876543210' };

  test('accepts a valid lead', () => {
    expect(validateLead(valid)).toEqual({ ok: true });
  });
  test('rejects missing org name', () => {
    expect(validateLead({ ...valid, orgName: '' }).ok).toBe(false);
  });
  test('rejects invalid email', () => {
    expect(validateLead({ ...valid, email: 'not-an-email' }).ok).toBe(false);
  });
  test('rejects missing phone', () => {
    expect(validateLead({ ...valid, phone: '' }).ok).toBe(false);
  });
  test('escapes HTML in the email body', () => {
    const html = buildLeadEmail({ ...valid, requirements: '<script>x</script>' });
    expect(html).not.toContain('<script>');
    expect(html).toContain('&lt;script&gt;');
  });
});
