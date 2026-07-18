// server/controllers/botAdminController.js
// Admin console for Bolt's learning loop (SIE phase D-lite):
//   - review the knowledge_gaps queue (what Bolt couldn't answer / got 👎),
//   - promote a gap into a bot_faqs answer (served without the model next time),
//   - manage the FAQ list (add / edit / enable-disable / delete).
// Reads gate on support.view; writes on support.assign (see adminRoutes.js).
'use strict';

const { supabaseAdmin } = require('../config/supabase');
const { safeError } = require('../utils/httpError');

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const MAX_PATTERN = 200;
const MAX_ANSWER = 4000;

// GET /api/admin/bot/gaps?status=open|resolved|all
// Newest-first, open before resolved. For a 👎 (question is null, message_id set)
// we attach the downvoted assistant answer so the admin has context.
const listGaps = async (req, res) => {
  try {
    const status = req.query?.status || 'open';
    let q = supabaseAdmin
      .from('knowledge_gaps')
      .select('id, question, reason, resolved, conversation_id, message_id, created_at')
      .order('created_at', { ascending: false })
      .limit(300);
    if (status === 'open') q = q.eq('resolved', false);
    else if (status === 'resolved') q = q.eq('resolved', true);

    const { data: gaps, error } = await q;
    if (error) return safeError(res, error);

    // Attach the downvoted answer text for thumbs-down rows (one batched read).
    const msgIds = [...new Set((gaps || []).filter((g) => g.message_id).map((g) => g.message_id))];
    let msgMap = {};
    if (msgIds.length) {
      const { data: msgs } = await supabaseAdmin
        .from('bot_messages').select('id, content').in('id', msgIds);
      msgMap = Object.fromEntries((msgs || []).map((m) => [m.id, m.content]));
    }

    const out = (gaps || []).map((g) => ({
      ...g,
      downvoted_answer: g.message_id ? (msgMap[g.message_id] || null) : null,
    }));
    res.json({ gaps: out });
  } catch (error) {
    safeError(res, error);
  }
};

// PATCH /api/admin/bot/gaps/:id  { resolved: boolean }
const updateGap = async (req, res) => {
  try {
    if (!UUID_RE.test(req.params.id)) return res.status(400).json({ message: 'Invalid gap id.' });
    const resolved = !!req.body?.resolved;
    const { data, error } = await supabaseAdmin
      .from('knowledge_gaps').update({ resolved }).eq('id', req.params.id)
      .select('id, resolved').single();
    if (error) return safeError(res, error);
    if (!data) return res.status(404).json({ message: 'Gap not found.' });
    res.json(data);
  } catch (error) {
    safeError(res, error);
  }
};

// GET /api/admin/bot/faqs — the deterministic FAQ layer, newest first.
const listFaqs = async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('bot_faqs').select('id, pattern, answer, enabled, created_at')
      .order('created_at', { ascending: false });
    if (error) return safeError(res, error);
    res.json({ faqs: data || [] });
  } catch (error) {
    safeError(res, error);
  }
};

// POST /api/admin/bot/faqs  { pattern, answer }
// Optional gapId: mark that gap resolved in the same step (promote flow).
const createFaq = async (req, res) => {
  try {
    const pattern = String(req.body?.pattern || '').trim();
    const answer = String(req.body?.answer || '').trim();
    if (!pattern || !answer) return res.status(400).json({ message: 'pattern and answer are required.' });
    if (pattern.length > MAX_PATTERN) return res.status(400).json({ message: 'Pattern is too long.' });
    if (answer.length > MAX_ANSWER) return res.status(400).json({ message: 'Answer is too long.' });

    const { data, error } = await supabaseAdmin
      .from('bot_faqs').insert({ pattern, answer }).select('id, pattern, answer, enabled, created_at').single();
    if (error) return safeError(res, error);

    const gapId = req.body?.gapId;
    if (gapId && UUID_RE.test(gapId)) {
      await supabaseAdmin.from('knowledge_gaps').update({ resolved: true }).eq('id', gapId);
    }
    res.status(201).json(data);
  } catch (error) {
    safeError(res, error);
  }
};

// PATCH /api/admin/bot/faqs/:id  { pattern?, answer?, enabled? }
const updateFaq = async (req, res) => {
  try {
    if (!UUID_RE.test(req.params.id)) return res.status(400).json({ message: 'Invalid FAQ id.' });
    const patch = {};
    if (req.body?.pattern !== undefined) {
      const pattern = String(req.body.pattern).trim();
      if (!pattern || pattern.length > MAX_PATTERN) return res.status(400).json({ message: 'Invalid pattern.' });
      patch.pattern = pattern;
    }
    if (req.body?.answer !== undefined) {
      const answer = String(req.body.answer).trim();
      if (!answer || answer.length > MAX_ANSWER) return res.status(400).json({ message: 'Invalid answer.' });
      patch.answer = answer;
    }
    if (req.body?.enabled !== undefined) patch.enabled = !!req.body.enabled;
    if (!Object.keys(patch).length) return res.status(400).json({ message: 'Nothing to update.' });

    const { data, error } = await supabaseAdmin
      .from('bot_faqs').update(patch).eq('id', req.params.id)
      .select('id, pattern, answer, enabled, created_at').single();
    if (error) return safeError(res, error);
    if (!data) return res.status(404).json({ message: 'FAQ not found.' });
    res.json(data);
  } catch (error) {
    safeError(res, error);
  }
};

// DELETE /api/admin/bot/faqs/:id
const deleteFaq = async (req, res) => {
  try {
    if (!UUID_RE.test(req.params.id)) return res.status(400).json({ message: 'Invalid FAQ id.' });
    const { error } = await supabaseAdmin.from('bot_faqs').delete().eq('id', req.params.id);
    if (error) return safeError(res, error);
    res.json({ ok: true });
  } catch (error) {
    safeError(res, error);
  }
};

module.exports = { listGaps, updateGap, listFaqs, createFaq, updateFaq, deleteFaq };
