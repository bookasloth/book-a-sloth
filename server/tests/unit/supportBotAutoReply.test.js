// Unit tests for Bolt auto-reply in the support-chat controller. botService and
// supportChatService are mocked — no model call, no DB.

jest.mock('../../services/botService', () => ({ askBot: jest.fn() }));
jest.mock('../../services/supportChatService', () => ({ postMessage: jest.fn(), escalate: jest.fn() }));

const bot = require('../../services/botService');
const chat = require('../../services/supportChatService');
const { botAutoReply } = require('../../controllers/supportController');

const thread = { id: 't1', reference: 'SUP-ABC123' };

beforeEach(() => jest.clearAllMocks());

test('posts Bolt answer as a bot message, no escalation on a confident answer', async () => {
  bot.askBot.mockResolvedValue({ answer: 'You get paid via Razorpay Route.', escalate: false });
  await botAutoReply(thread, 'how do payouts work?');
  expect(bot.askBot).toHaveBeenCalledWith({ question: 'how do payouts work?', sessionRef: 'SUP-ABC123' });
  expect(chat.postMessage).toHaveBeenCalledWith({ threadId: 't1', sender: 'bot', senderName: 'Bolt', body: 'You get paid via Razorpay Route.' });
  expect(chat.escalate).not.toHaveBeenCalled();
});

test('escalates to a human when Bolt returns escalate=true', async () => {
  bot.askBot.mockResolvedValue({ answer: 'Let me connect you to the team.', escalate: true });
  await botAutoReply(thread, 'my dispute is unresolved');
  expect(chat.postMessage).toHaveBeenCalledTimes(1);
  expect(chat.escalate).toHaveBeenCalledWith('t1', 'my dispute is unresolved');
});

test('stays silent (no message) on an empty answer', async () => {
  bot.askBot.mockResolvedValue({ answer: '   ', escalate: false });
  await botAutoReply(thread, 'hi');
  expect(chat.postMessage).not.toHaveBeenCalled();
  expect(chat.escalate).not.toHaveBeenCalled();
});

test('never throws when askBot fails', async () => {
  bot.askBot.mockRejectedValue(new Error('model down'));
  await expect(botAutoReply(thread, 'anything')).resolves.toBeUndefined();
  expect(chat.postMessage).not.toHaveBeenCalled();
});
