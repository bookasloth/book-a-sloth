'use strict';

// Admin/support side of support chat — the ops console. Gated by requireAdmin
// (support.view for reads, support.assign for writes) on the isolated admin token.

const { safeError } = require('../utils/httpError');
const chat = require('../services/supportChatService');

const adminId = (req) => req.admin?.id || req.admin?.email || 'admin';
const adminName = (req) => req.admin?.name || req.admin?.email || 'Support';

// GET /api/admin/support/queue?filter=waiting|mine|all
const queue = async (req, res) => {
  try {
    const threads = await chat.listQueue({ filter: req.query?.filter || 'waiting', adminId: adminId(req) });
    res.json({ threads });
  } catch (e) { safeError(res, e); }
};

// GET /api/admin/support/thread/:id
const getThread = async (req, res) => {
  try {
    const thread = await chat.getThread(req.params.id);
    if (!thread) return res.status(404).json({ message: 'Thread not found' });
    await chat.markRead(thread.id, 'admin');
    res.json({ thread, messages: await chat.listMessages(thread.id) });
  } catch (e) { safeError(res, e); }
};

// POST /api/admin/support/thread/:id/reply  { body } — replying also claims an
// unassigned/waiting thread for this admin.
const reply = async (req, res) => {
  try {
    const thread = await chat.getThread(req.params.id);
    if (!thread) return res.status(404).json({ message: 'Thread not found' });
    if (thread.status === 'waiting' || thread.status === 'bot') {
      await chat.assign(thread.id, adminId(req));
    }
    const msg = await chat.postMessage({
      threadId: thread.id, sender: 'admin',
      senderId: adminId(req), senderName: adminName(req),
      body: req.body?.body,
    });
    res.status(201).json(msg);
  } catch (e) { safeError(res, e); }
};

// POST /api/admin/support/thread/:id/assign
const assign = async (req, res) => {
  try {
    const thread = await chat.getThread(req.params.id);
    if (!thread) return res.status(404).json({ message: 'Thread not found' });
    const updated = await chat.assign(thread.id, req.body?.admin_id || adminId(req));
    res.json({ thread: updated });
  } catch (e) { safeError(res, e); }
};

// POST /api/admin/support/thread/:id/resolve
const resolve = async (req, res) => {
  try {
    const thread = await chat.getThread(req.params.id);
    if (!thread) return res.status(404).json({ message: 'Thread not found' });
    await chat.postMessage({ threadId: thread.id, sender: 'system', body: 'This conversation was marked resolved.' });
    const updated = await chat.resolve(thread.id);
    res.json({ thread: updated });
  } catch (e) { safeError(res, e); }
};

module.exports = { queue, getThread, reply, assign, resolve };
