/**
 * tests/integration/bot.test.js — /api/bot HTTP layer.
 * botService + sendEmail are mocked; the service's retrieval/grounding logic is
 * covered in tests/unit/botService.test.js. Here we verify validation, the
 * escalation → support-email wiring, and feedback delegation.
 */
jest.mock('../../services/botService', () => ({
  askBot: jest.fn(),
  recordFeedback: jest.fn().mockResolvedValue(undefined),
  getRecentMessages: jest.fn().mockResolvedValue([]),
  redactPii: (s) => String(s ?? ''), // controller redacts the escalation email; identity in tests
}));
jest.mock('../../utils/sendEmail', () => jest.fn().mockResolvedValue(undefined));

const request = require('supertest');
const express = require('express');
const botService = require('../../services/botService');
const sendEmail = require('../../utils/sendEmail');
const botRoutes = require('../../routes/botRoutes');

const app = express();
app.use(express.json());
app.use('/api/bot', botRoutes);

const UUID = '11111111-1111-4111-8111-111111111111';

afterEach(() => jest.clearAllMocks());

describe('POST /api/bot/ask', () => {
  it('400s on an empty question', async () => {
    const res = await request(app).post('/api/bot/ask').send({ question: '   ' });
    expect(res.status).toBe(400);
    expect(botService.askBot).not.toHaveBeenCalled();
  });

  it('400s on an over-long question', async () => {
    const res = await request(app).post('/api/bot/ask').send({ question: 'x'.repeat(2001) });
    expect(res.status).toBe(400);
  });

  it('400s on a malformed conversationId', async () => {
    const res = await request(app).post('/api/bot/ask').send({ question: 'hi', conversationId: 'not-a-uuid' });
    expect(res.status).toBe(400);
  });

  it('returns a grounded answer and does NOT email support', async () => {
    botService.askBot.mockResolvedValue({
      answer: 'Connect it from Dashboard → Calendar.',
      cited_sources: [{ source_file: 'docs/architecture.md', heading: 'Google Calendar' }],
      escalate: false, conversationId: UUID, messageId: UUID,
    });
    const res = await request(app).post('/api/bot/ask').send({ question: 'How do I connect Google Calendar?' });
    expect(res.status).toBe(200);
    expect(res.body.escalate).toBe(false);
    expect(res.body.cited_sources).toHaveLength(1);
    expect(res.body.messageId).toBe(UUID);
    expect(sendEmail).not.toHaveBeenCalled();
  });

  it('emails support when the answer escalates', async () => {
    botService.askBot.mockResolvedValue({
      answer: 'connecting you to a human', cited_sources: [], escalate: true,
      conversationId: UUID, messageId: UUID,
    });
    const res = await request(app).post('/api/bot/ask').send({ question: 'I want a refund' });
    expect(res.status).toBe(200);
    expect(res.body.escalate).toBe(true);
    // notifySupport is now fire-and-forget (not awaited before the response), so
    // flush the pending microtasks before asserting the background email fired.
    await new Promise((r) => setImmediate(r));
    expect(sendEmail).toHaveBeenCalledTimes(1);
    expect(sendEmail.mock.calls[0][0].to).toBeTruthy();
    expect(sendEmail.mock.calls[0][0].subject).toMatch(/Bolt 958/);
  });

  it('still 200s even if the support email throws', async () => {
    botService.askBot.mockResolvedValue({ answer: 'x', cited_sources: [], escalate: true, conversationId: UUID, messageId: UUID });
    sendEmail.mockRejectedValueOnce(new Error('smtp down'));
    const res = await request(app).post('/api/bot/ask').send({ question: 'refund please' });
    expect(res.status).toBe(200);
  });
});

describe('POST /api/bot/feedback', () => {
  it('400s on an invalid feedback value', async () => {
    const res = await request(app).post('/api/bot/feedback').send({ messageId: UUID, feedback: 'meh' });
    expect(res.status).toBe(400);
    expect(botService.recordFeedback).not.toHaveBeenCalled();
  });

  it('400s on a missing/invalid messageId', async () => {
    const res = await request(app).post('/api/bot/feedback').send({ messageId: 'nope', feedback: 'up' });
    expect(res.status).toBe(400);
  });

  it('persists a valid up-vote', async () => {
    const res = await request(app).post('/api/bot/feedback').send({ messageId: UUID, feedback: 'up' });
    expect(res.status).toBe(200);
    expect(botService.recordFeedback).toHaveBeenCalledWith(UUID, 'up');
  });
});
