// "Start new topic" + topic list — supportChatService mocked (no DB).

jest.mock('../../services/supportChatService', () => ({
  createThread: jest.fn(), postMessage: jest.fn(), markRead: jest.fn(),
  listMessages: jest.fn(), listThreads: jest.fn(),
}));
jest.mock('../../services/botService', () => ({ askBot: jest.fn() }));
jest.mock('../../services/supportContextService', () => ({ getSupportContext: jest.fn() }));

const chat = require('../../services/supportChatService');
const { startTopic, listThreads } = require('../../controllers/supportController');

const mkRes = () => { const r = {}; r.json = jest.fn(() => r); r.status = jest.fn(() => r); return r; };
const req = { user: { id: 'u1', phone: '+9199', is_host: true } };

beforeEach(() => jest.clearAllMocks());

test('startTopic creates a fresh thread, seeds a system greeting, and returns it with messages', async () => {
  const fresh = { id: 't-new', reference: 'SUP-NEW', status: 'bot' };
  chat.createThread.mockResolvedValue(fresh);
  chat.listMessages.mockResolvedValue([{ id: 'm1', sender: 'system' }]);
  const res = mkRes();

  await startTopic(req, res);

  expect(chat.createThread).toHaveBeenCalledWith({ participantType: 'host', userId: 'u1', guestPhone: '+9199' });
  const greeting = chat.postMessage.mock.calls[0][0];
  expect(greeting).toMatchObject({ threadId: 't-new', sender: 'system' });
  expect(greeting.body).toMatch(/new topic/i);
  expect(res.status).toHaveBeenCalledWith(201);
  expect(res.json).toHaveBeenCalledWith({ thread: fresh, messages: [{ id: 'm1', sender: 'system' }] });
});

test('startTopic keys a guest by phone (participantType guest)', async () => {
  chat.createThread.mockResolvedValue({ id: 't2' });
  chat.listMessages.mockResolvedValue([]);
  await startTopic({ user: { id: null, phone: '+9188', is_host: false } }, mkRes());
  expect(chat.createThread).toHaveBeenCalledWith({ participantType: 'guest', userId: null, guestPhone: '+9188' });
});

test('listThreads returns the caller topics without creating one', async () => {
  chat.listThreads.mockResolvedValue([{ id: 'a' }, { id: 'b' }]);
  const res = mkRes();
  await listThreads(req, res);
  expect(chat.listThreads).toHaveBeenCalledWith({ userId: 'u1', guestPhone: '+9199' });
  expect(chat.createThread).not.toHaveBeenCalled();
  expect(res.json).toHaveBeenCalledWith({ threads: [{ id: 'a' }, { id: 'b' }] });
});
