'use strict';

// Host/guest side of support chat. Auth is the normal `protect` bearer JWT; a
// participant may only touch their own thread. Live delivery is via the service's
// broadcast — this controller is plain REST (send + history), the app's usual shape.

const { safeError } = require('../utils/httpError');
const supportHours = require('../utils/supportHours');
const chat = require('../services/supportChatService');
const bot = require('../services/botService');
const supportContext = require('../services/supportContextService');

// Bolt auto-reply. Fired after the user's message is stored, ONLY while the thread
// is still bot-handled (status 'bot') — once a human takes over ('waiting'/'assigned')
// Bolt stays silent. Fire-and-forget: the HTTP response already returned, and the
// bot's answer reaches the client over the thread's realtime broadcast. Never throws.
// ponytail: answers each message standalone (no thread history passed to askBot);
// wire conversationId ↔ thread if follow-up context ever matters.
async function botAutoReply(thread, question) {
  try {
    // AUTHENTICATED context: the thread is tied to a verified user_id / guest_phone,
    // so Bolt may answer this person's own booking/plan/KYC/payout questions from real
    // state. Best-effort — a lookup failure just means Bolt answers without it.
    let ctx = null;
    try {
      ctx = await supportContext.getSupportContext({
        userId: thread.user_id || null,
        phone: thread.guest_phone || null,
        isHost: thread.participant_type === 'host',
      });
    } catch (e) { console.error('support context lookup failed', thread?.id, e.message); }

    const out = await bot.askBot({ question, sessionRef: thread.reference, context: ctx });
    if (!out || !String(out.answer || '').trim()) return;
    await chat.postMessage({ threadId: thread.id, sender: 'bot', senderName: 'Bolt', body: out.answer });
    // Bolt couldn't answer confidently → hand to a human (flips the banner to 'waiting').
    if (out.escalate) await chat.escalate(thread.id, question);
  } catch (e) {
    console.error('bolt auto-reply failed', thread?.id, e.message);
  }
}

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

// GET /api/support/threads — all of the caller's topics for the switcher (never
// creates one). Newest activity first.
const listThreads = async (req, res) => {
  try {
    const threads = await chat.listThreads({ userId: req.user?.id, guestPhone: req.user?.phone });
    res.json({ threads });
  } catch (e) { safeError(res, e); }
};

// POST /api/support/thread/new — "Start new topic": open a fresh thread even when
// one is already open, so a new question isn't buried in old history.
const startTopic = async (req, res) => {
  try {
    const participantType = req.user?.is_host ? 'host' : 'guest';
    const thread = await chat.createThread({
      participantType, userId: req.user?.id, guestPhone: req.user?.phone,
    });
    await chat.postMessage({
      threadId: thread.id, sender: 'system',
      body: "New topic started. Ask away — Bolt replies instantly, and our team can jump in when you need a person.",
    });
    await chat.markRead(thread.id, 'user');
    res.status(201).json({ thread, messages: await chat.listMessages(thread.id) });
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
    // Messaging a resolved thread reopens it to the bot phase — otherwise the
    // message posts into a thread the admin queue hides, and it's lost. Reopening
    // puts Bolt back on it and lets it re-escalate if needed.
    if (thread.status === 'resolved') {
      await chat.setStatus(thread.id, 'bot');
      thread.status = 'bot';
    }
    const msg = await chat.postMessage({
      threadId: thread.id, sender: 'user',
      senderId: req.user?.id, senderName: req.user?.name,
      body: req.body?.body,
    });
    res.status(201).json(msg);
    // Async Bolt reply while the thread is still bot-handled — after the response.
    if (thread.status === 'bot') botAutoReply(thread, msg.body);
  } catch (e) { safeError(res, e); }
};

// POST /api/support/thread/:id/escalate  { summary } — hand off to a human. The
// client collects a detailed problem description first (best-in-class intake), so
// the team opens the thread with context instead of a cold "user wants help".
const escalateThread = async (req, res) => {
  try {
    const thread = await chat.getThread(req.params.id);
    if (!owns(thread, req.user)) return res.status(404).json({ message: 'Thread not found' });
    const summary = (req.body?.summary || '').trim() || null;
    const open = supportHours.isOpen();
    // Honest expectation-setting: a live handoff in hours, a logged ticket after.
    const note = open
      ? 'Thanks — connecting you to the Book A Sloth team. Someone will reply here shortly.'
      : `Thanks — our team is offline right now (${supportHours.LABEL}). Your ticket ${thread.reference} is logged and we'll reply here as soon as we're back. Bolt can still help meanwhile.`;
    await chat.postMessage({ threadId: thread.id, sender: 'system', body: note });
    const updated = await chat.escalate(thread.id, summary);
    res.json({ thread: updated, open });
  } catch (e) { safeError(res, e); }
};

// GET /api/support/hours — is live support open now? Drives the client's
// "Talk to a human" vs "Raise a ticket" copy. { open, label }.
const hours = (req, res) => res.json({ open: supportHours.isOpen(), label: supportHours.LABEL });

// GET /api/support/unread — the caller's unread reply count for a sidebar/tab
// badge. Read-only: never creates a thread. { count, thread_id }.
const unread = async (req, res) => {
  try {
    const thread = await chat.getOpenThread({ userId: req.user?.id, guestPhone: req.user?.phone });
    res.json({ count: thread?.user_unread || 0, thread_id: thread?.id || null });
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

module.exports = { getMyThread, listThreads, startTopic, getMessages, sendMessage, escalateThread, markRead, unread, hours, botAutoReply };
