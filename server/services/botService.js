'use strict';
// Bolt 958 — Book A Sloth's in-app support bot (Phase 1: knowledge bot only).
// Retrieval is Postgres full-text search over kb_chunks (v3.83, seeded from docs/);
// answers are grounded ONLY on the retrieved chunks. On low confidence, no match,
// or a sensitive topic it escalates to a human instead of inventing an answer.
//
// ponytail: reference anthropicClient via the module object (not destructured) so
// jest.spyOn / mocked isConfigured intercept live, same as generateListing.js.

const anthropicClient = require('./ai/anthropicClient');
const { supabaseAdmin } = require('../config/supabase');

const MATCH_COUNT = 5;
// ts_rank floor a chunk must clear to count as a real match. Tuned against the
// seeded corpus: genuine hits rank ~0.3–0.95, incidental term overlap ranks well
// below this. ponytail: single constant knob — retune here if recall feels off.
const MIN_RANK = 0.02;

// Topics we deliberately never let the bot answer, however good the doc match —
// money, identity, and account-access questions go to a human every time.
const SENSITIVE_RE = /\b(refund|charge ?backs?|payments?|pay(?:ing|out|outs)?|razorpay|billing|invoices?|gst|kyc|withdraw(?:al)?s?|bank|password|log ?in|logged? out|locked out|can'?t (?:log|sign) ?in|account access|access my account|delete my account|hacked|unauthor)/i;

const HANDOFF =
  "I don't have a confident answer to that from the Book A Sloth help docs, so I'm " +
  "connecting you with a human on our team — they'll follow up over WhatsApp or email shortly.";

const SYSTEM = [
  'You are Bolt 958, the support assistant for Book A Sloth (a SaaS appointment-booking platform for creators/hosts).',
  'Answer the user ONLY using the numbered Sources provided in the user message. The sources are excerpts from our own documentation.',
  'If the sources do not clearly contain the answer, do NOT guess or use outside knowledge:',
  'set escalate=true and leave answer empty — the system will hand off to a human.',
  'When you can answer, be concise and specific, and put the 1-based numbers of the sources you used in source_numbers.',
  'Never invent prices, guarantees, links, or policy you cannot see in the sources.',
  'Always respond by calling the emit_answer tool.',
].join(' ');

const ANSWER_TOOL = {
  name: 'emit_answer',
  description: 'Return the grounded answer (or signal that a human handoff is needed).',
  input_schema: {
    type: 'object',
    properties: {
      answer: { type: 'string', description: 'The answer, drawn ONLY from the provided sources. Empty when escalating.' },
      escalate: { type: 'boolean', description: 'true when the sources do not cover the question.' },
      source_numbers: { type: 'array', items: { type: 'integer' }, description: '1-based indexes of the sources actually used.' },
    },
    required: ['answer', 'escalate', 'source_numbers'],
  },
};

const _isMissingSchema = (e) =>
  e && /Could not find the|does not exist|relation .* does not exist/i.test(e.message || '');

const dedupeSources = (arr) => {
  const seen = new Set();
  return arr.filter((s) => {
    const k = `${s.source_file}::${s.heading || ''}`;
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
};

async function retrieve(question) {
  const { data, error } = await supabaseAdmin.rpc('search_kb_chunks', {
    query_text: question,
    match_count: MATCH_COUNT,
  });
  if (error) throw error;
  return (data || []).filter((c) => (c.rank ?? 0) >= MIN_RANK);
}

function buildUserMessage(question, chunks) {
  const sources = chunks
    .map((c, i) => `[${i + 1}] ${c.source_file}${c.heading ? ` — ${c.heading}` : ''}\n${c.content}`)
    .join('\n\n');
  return `Question: ${question}\n\nSources:\n${sources}`;
}

async function callModel(question, chunks) {
  const client = anthropicClient.getClient();
  const resp = await client.messages.create({
    model: anthropicClient.MODELS.generate,
    max_tokens: 1024,
    system: SYSTEM,
    tools: [ANSWER_TOOL],
    tool_choice: { type: 'tool', name: 'emit_answer' },
    messages: [{ role: 'user', content: buildUserMessage(question, chunks) }],
  });
  return (resp.content || []).find((b) => b.type === 'tool_use' && b.name === 'emit_answer')?.input || null;
}

// Best-effort persistence — a logging failure must never break the user's reply.
async function persist({ conversationId, sessionRef, question, answer, cited_sources, escalate }) {
  try {
    let convId = conversationId;
    if (!convId) {
      const { data, error } = await supabaseAdmin
        .from('bot_conversations').insert({ session_ref: sessionRef || null }).select('id').single();
      if (error) throw error;
      convId = data.id;
    }
    await supabaseAdmin.from('bot_messages').insert({ conversation_id: convId, role: 'user', content: question });
    const { data: msg, error: mErr } = await supabaseAdmin
      .from('bot_messages')
      .insert({
        conversation_id: convId, role: 'assistant', content: answer,
        cited_sources: cited_sources.length ? cited_sources : null, escalated: escalate,
      })
      .select('id').single();
    if (mErr) throw mErr;
    return { conversationId: convId, messageId: msg.id };
  } catch (e) {
    console.error('[bot] persist failed:', e.message);
    return { conversationId: conversationId || null, messageId: null };
  }
}

/**
 * askBot({ question, conversationId?, sessionRef? })
 *   → { answer, cited_sources:[{source_file,heading}], escalate, conversationId, messageId }
 * Never throws for an expected failure (no match / sensitive / unconfigured / model
 * or DB error) — it escalates, so the caller always has a clean reply to return.
 */
async function askBot({ question, conversationId = null, sessionRef = null } = {}) {
  const q = String(question || '').trim();

  let chunks = [];
  let retrievalOk = true;
  if (q) {
    try {
      chunks = await retrieve(q);
    } catch (e) {
      retrievalOk = false;
      if (!_isMissingSchema(e)) console.error('[bot] retrieval failed:', e.message);
    }
  }

  const sensitive = SENSITIVE_RE.test(q);
  let answer = HANDOFF;
  let escalate = true;
  let cited_sources = [];

  const canAnswer = q && retrievalOk && chunks.length && !sensitive && anthropicClient.isConfigured();
  if (canAnswer) {
    try {
      const out = await callModel(q, chunks);
      if (out && !out.escalate && String(out.answer || '').trim()) {
        escalate = false;
        answer = String(out.answer).trim();
        const nums = Array.isArray(out.source_numbers) ? out.source_numbers : [];
        cited_sources = dedupeSources(
          nums.map((n) => chunks[n - 1]).filter(Boolean)
            .map((c) => ({ source_file: c.source_file, heading: c.heading || null }))
        );
        // A grounded answer with no explicit citation still shows where it came
        // from — fall back to every retrieved source so the answer is never uncited.
        if (!cited_sources.length) {
          cited_sources = dedupeSources(chunks.map((c) => ({ source_file: c.source_file, heading: c.heading || null })));
        }
      }
    } catch (e) {
      console.error('[bot] model call failed:', e.message);
      // escalate stays true — handoff.
    }
  }

  const { conversationId: convId, messageId } = await persist({
    conversationId, sessionRef, question: q, answer, cited_sources, escalate,
  });

  return { answer, cited_sources, escalate, conversationId: convId, messageId };
}

// Store 👍/👎 on an assistant message. Throws on DB error (caller maps to 4xx/5xx).
async function recordFeedback(messageId, feedback) {
  const { error } = await supabaseAdmin.from('bot_messages').update({ feedback }).eq('id', messageId);
  if (error) throw error;
}

// Recent turns for an escalation email summary (best-effort; [] on any failure).
async function getRecentMessages(conversationId, limit = 10) {
  if (!conversationId) return [];
  try {
    const { data, error } = await supabaseAdmin
      .from('bot_messages')
      .select('role, content, created_at')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true })
      .limit(limit);
    if (error) throw error;
    return data || [];
  } catch (e) {
    console.error('[bot] getRecentMessages failed:', e.message);
    return [];
  }
}

module.exports = { askBot, recordFeedback, getRecentMessages, HANDOFF, SENSITIVE_RE, MIN_RANK };
