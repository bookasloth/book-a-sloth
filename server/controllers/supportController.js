'use strict';

// Host/guest side of support chat. Auth is the normal `protect` bearer JWT; a
// participant may only touch their own thread. Live delivery is via the service's
// broadcast — this controller is plain REST (send + history), the app's usual shape.

const { safeError } = require('../utils/httpError');
const chat = require('../services/supportChatService');

// A participant owns a thread if the user_id matches, or (guest, no profile) the phone.
const owns = (thread, user) =>
  !!thread && (
    (thread.user_id && thread.user_id === user?.id) ||
    (!!thread.guest_phone && thread.guest_phone === user?.phone)
  );

// GET /api/support/thread — the caller's open thread (created on first use).
const getMyThread = async (req, res) => {
  try {
    const participantType = req.user?.is_host ? 'host' : 'guest';
    const existingCount = null; // (reserved) — could return unread here later
    const thread = await chat.getOrCreateOpenThread({
      participantType,
      userId: req.user?.id,
      guestPhone: req.user?.phone,
    });
    // Seed a one-time greeting so a brand-new thread isn't empty.
    const messages = await chat.listMessages(thread.id);
    if (messages.length === 0) {
      await chat.postMessage({
        threadId: thread.id, sender: 'system',
        body: "Hi! Ask us anything — the Bolt assistant answers instantly, and our team can jump in when you need a person.",
      });
    }
    await chat.markRead(thread.id, 'user');
    res.json({ thread, messages: await chat.listMessages(thread.id), unused: existingCount });
  } catch (e) { safeError(res, e); }
};

// GET /api/support/thread/:id/messages
const getMessages = async (req, res) => {
  try {
    const thread = await chat.getThread(req.params.id);
    if (!owns(thread, req.user)) return res.status(404).json({ message: 'Thread not found' });
    await chat.markRead(thread.id, 'user');
    res.json({ thread, messages: await chat.listMessages(thread.id) });
  } catch (e) { safeError(res, e); }
};

// POST /api/support/thread/:id/messages  { body }
const sendMessage = async (req, res) => {
  try {
    const thread = await chat.getThread(req.params.id);
    if (!owns(thread, req.user)) return res.status(404).json({ message: 'Thread not found' });
    const msg = await chat.postMessage({
      threadId: thread.id, sender: 'user',
      senderId: req.user?.id, senderName: req.user?.name,
      body: req.body?.body,
    });
    res.status(201).json(msg);
  } catch (e) { safeError(res, e); }
};

// POST /api/support/thread/:id/escalate  { summary? } — "Talk to a human".
const escalateThread = async (req, res) => {
  try {
    const thread = await chat.getThread(req.params.id);
    if (!owns(thread, req.user)) return res.status(404).json({ message: 'Thread not found' });
    await chat.postMessage({ threadId: thread.id, sender: 'system', body: 'Connecting you to the Book A Sloth team…' });
    const updated = await chat.escalate(thread.id, (req.body?.summary || '').trim() || null);
    res.json({ thread: updated });
  } catch (e) { safeError(res, e); }
};

// POST /api/support/thread/:id/read
const markRead = async (req, res) => {
  try {
    const thread = await chat.getThread(req.params.id);
    if (!owns(thread, req.user)) return res.status(404).json({ message: 'Thread not found' });
    await chat.markRead(thread.id, 'user');
    res.json({ ok: true });
  } catch (e) { safeError(res, e); }
};

module.exports = { getMyThread, getMessages, sendMessage, escalateThread, markRead };
