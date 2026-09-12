'use strict';
// Marketing SMTP transport for bulk / sales-automation mail (kept off Resend).
// The load-bearing behaviour: it sends AS the authenticated mailbox no matter what
// persona From is passed — Gmail/Workspace SMTP rewrites or rejects anything else —
// while keeping the persona display name and routing replies sensibly.

const mockSendMail = jest.fn(async () => ({ messageId: 'm1', accepted: ['x@y.com'], response: '250 OK' }));
jest.mock('nodemailer', () => ({ createTransport: () => ({ sendMail: mockSendMail }) }));

beforeEach(() => {
  jest.clearAllMocks();
  process.env.MARKETING_SMTP_USER = 'aastha@bookasloth.in';
});

test('the marketing provider is registered and named', () => {
  const { getProvider, MARKETING_PROVIDER } = require('../../services/email/providers');
  expect(MARKETING_PROVIDER).toBe('marketing_smtp');
  expect(getProvider('marketing_smtp').name).toBe('marketing_smtp');
});

test('From is forced to the authenticated mailbox, persona name kept, reply routed to persona', async () => {
  const provider = require('../../services/email/providers/marketingSmtpProvider');
  const r = await provider.sendEmail({
    to: 'lead@gmail.com', subject: 'Hi', html: '<p>x</p>',
    fromName: 'Shubham | Founder', fromEmail: 'shubham@bookasloth.in', // off-marketing persona
  });
  expect(r.success).toBe(true);
  const arg = mockSendMail.mock.calls[0][0];
  // Envelope From = authed mailbox (NOT shubham@), display name preserved.
  expect(arg.from).toBe('"Shubham | Founder" <aastha@bookasloth.in>');
  // A reply reaches the persona's own inbox when it has one.
  expect(arg.replyTo).toBe('shubham@bookasloth.in');
});

test('a send failure returns success:false and never throws (no provider fallback)', async () => {
  mockSendMail.mockRejectedValueOnce(new Error('550 relay denied'));
  const provider = require('../../services/email/providers/marketingSmtpProvider');
  const r = await provider.sendEmail({ to: 'lead@gmail.com', subject: 'Hi', html: 'x' });
  expect(r).toMatchObject({ success: false, error: '550 relay denied' });
});
