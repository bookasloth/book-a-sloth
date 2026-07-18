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

// The injection tripwire and output guard log into knowledge_gaps too, but they are
// NOT coverage gaps — excluding them keeps attack noise out of the gap-review queue
// and the "open gaps" KPI so real "Bolt couldn't answer this" rows aren't buried.
const NON_GAP_REASONS = '("injection_attempt","blocked_output")';

// GET /api/admin/bot/gaps?status=open|resolved|all
// Newest-first, open before resolved. For a 👎 (question is null, message_id set)
// we attach the downvoted assistant answer so the admin has context.
const listGaps = async (req, res) => {
  try {
    const status = req.query?.status || 'open';
    let q = supabaseAdmin
      .from('knowledge_gaps')
      .select('id, question, reason, resolved, conversation_id, message_id, created_at')
      .not('reason', 'in', NON_GAP_REASONS)
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

// GET /api/admin/bot/analytics — engine health over the last 30 days: how each
// layer is pulling its weight (the whole point is Claude carrying LESS over time).
const analytics = async (req, res) => {
  try {
    const since = new Date(Date.now() - 30 * 864e5).toISOString();
    const LAYERS = ['smalltalk', 'faq', 'cache', 'model', 'escalation'];
    const bySource = {};
    await Promise.all(LAYERS.map(async (s) => {
      const { count } = await supabaseAdmin
        .from('bot_messages').select('id', { count: 'exact', head: true })
        .eq('role', 'assistant').eq('source', s).gte('created_at', since);
      bySource[s] = count || 0;
    }));
    const answered = LAYERS.reduce((a, s) => a + bySource[s], 0);
    const pct = (n) => (answered ? Math.round((n / answered) * 1000) / 10 : 0);

    const [{ count: cacheSize }, { count: openGaps }, { count: faqCount }] = await Promise.all([
      supabaseAdmin.from('bot_semantic_cache').select('id', { count: 'exact', head: true }),
      supabaseAdmin.from('knowledge_gaps').select('id', { count: 'exact', head: true }).eq('resolved', false).not('reason', 'in', NON_GAP_REASONS),
      supabaseAdmin.from('bot_faqs').select('id', { count: 'exact', head: true }).eq('enabled', true),
    ]);

    res.json({
      since, answered,
      bySource,
      // Deflection = solved WITHOUT Claude (smalltalk + faq + cache). ai = model.
      pct: {
        ai: pct(bySource.model),
        cache: pct(bySource.cache),
        faq: pct(bySource.faq),
        smalltalk: pct(bySource.smalltalk),
        escalation: pct(bySource.escalation),
        deflected: pct(bySource.smalltalk + bySource.faq + bySource.cache),
      },
      cacheSize: cacheSize || 0,
      openGaps: openGaps || 0,
      liveFaqs: faqCount || 0,
    });
  } catch (error) {
    safeError(res, error);
  }
};

// GET /api/admin/bot/graph — the lightweight knowledge graph: which docs answer the
// most questions (edges = assistant answers → the docs they cited). A relational
// view over recent traffic, not a heavy graph engine.
const graph = async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('bot_messages').select('cited_sources')
      .eq('role', 'assistant').not('cited_sources', 'is', null)
      .order('created_at', { ascending: false }).limit(1000);
    if (error) return safeError(res, error);

    const counts = new Map();
    for (const m of data || []) {
      for (const s of m.cited_sources || []) {
        const key = s.source_file;
        if (!key) continue;
        counts.set(key, (counts.get(key) || 0) + 1);
      }
    }
    const topDocs = [...counts.entries()]
      .map(([source_file, answers]) => ({ source_file, answers }))
      .sort((a, b) => b.answers - a.answers).slice(0, 20);
    res.json({ topDocs, sampled: (data || []).length });
  } catch (error) {
    safeError(res, error);
  }
};

// GET /api/admin/bot/cache — cached answers, most-reused first.
const listCache = async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('bot_semantic_cache').select('id, question, answer, hits, created_at, last_used_at')
      .order('hits', { ascending: false }).order('created_at', { ascending: false }).limit(200);
    if (error) return safeError(res, error);
    res.json({ cache: data || [] });
  } catch (error) {
    safeError(res, error);
  }
};

// DELETE /api/admin/bot/cache/:id — evict one entry. :id="all" clears the cache.
const deleteCache = async (req, res) => {
  try {
    const id = req.params.id;
    if (id === 'all') {
      const { error } = await supabaseAdmin.from('bot_semantic_cache').delete().not('id', 'is', null);
      if (error) return safeError(res, error);
      return res.json({ ok: true, cleared: 'all' });
    }
    if (!UUID_RE.test(id)) return res.status(400).json({ message: 'Invalid cache id.' });
    const { error } = await supabaseAdmin.from('bot_semantic_cache').delete().eq('id', id);
    if (error) return safeError(res, error);
    res.json({ ok: true });
  } catch (error) {
    safeError(res, error);
  }
};

module.exports = { listGaps, updateGap, listFaqs, createFaq, updateFaq, deleteFaq, analytics, graph, listCache, deleteCache };
