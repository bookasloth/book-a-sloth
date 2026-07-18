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

// Pull a generous top-N so the authoritative chunk survives noisier docs (specs,
// plans, blog posts) that share the same keywords; the model still answers only
// from what's relevant and escalates when none of them actually cover the question.
const MATCH_COUNT = 8;
// ts_rank floor a chunk must clear to count as a real match. Tuned against the
// seeded corpus: genuine hits rank ~0.3–0.95, incidental term overlap ranks well
// below this. ponytail: single constant knob — retune here if recall feels off.
const MIN_RANK = 0.02;

// Topics we always send to a human, however good the doc match — money REVERSALS
// and account-COMPROMISE, where a wrong-but-confident answer does real harm.
// Deliberately NOT here: informational money/account questions ("how do payouts
// work", "how does billing work", "how do I log in", "what is KYC") — those now
// have help articles and should be answered, not handed off. This regex is the
// narrow "a human must handle this" set: refunds, chargebacks/disputes, being
// wrongly charged, fraud/hacked/locked-out, and account access/deletion.
const SENSITIVE_RE = /\b(refunds?|charge ?backs?|disputes?|charged (?:me )?(?:twice|again|wrong|extra)|double ?charged?|fraud|hacked|stolen|compromis|locked out|can'?t (?:log|sign) ?in|account access|access my account|delete (?:my )?account|close (?:my )?account|unauthor)/i;

const HANDOFF =
  "I don't have a confident answer to that from the Book A Sloth help docs, so I'm " +
  "connecting you with a human on our team — they'll follow up over WhatsApp or email shortly.";

// Greetings, thanks, and sign-offs are not questions — they retrieve no chunks and
// used to fall straight into the escalation path, which handed the user to a human
// AND emailed support on every "hi". Match a message that is ENTIRELY small talk
// (a greeting in front of a real question — "hi, how do I book?" — still falls
// through to the normal answer path) and reply warmly without escalating.
const SMALLTALK = [
  { re: /^(hi+|he+y+|hello+|hiya|yo+|namaste|hola|sup|wass?up|greetings|good\s*(morning|afternoon|evening|day)|how\s*(are|r)\s*(you|u|ya)|how'?s\s*it\s*going)(\s+(there|bolt|team|guys))?[\s!.,?]*$/i,
    reply: "Hey! I'm Bolt, the Book A Sloth assistant. Ask me about booking a service, payments, plans, or becoming a host — happy to help." },
  { re: /^(thanks?|thank\s*(you|u)|thx|tysm|ty|cheers|appreciate\s*(it|you)|much\s*appreciated)[\s!.,]*$/i,
    reply: "You're welcome! Anything else about Book A Sloth I can help with?" },
  { re: /^(ok(ay)?|k+|cool|great|nice|awesome|perfect|got\s*it|understood|alright|right|sounds\s*good|makes\s*sense)[\s!.,]*$/i,
    reply: "Glad that helps! If anything else about Book A Sloth comes up, just ask." },
  { re: /^(bye+|goodbye|good\s*night|see\s*(ya|you)|take\s*care|later|gtg|catch\s*you\s*later)[\s!.,]*$/i,
    reply: "Take care! Come back any time you need a hand with Book A Sloth." },
];

// Returns a canned reply for a pure-small-talk message, else null.
const smalltalkReply = (q) => {
  for (const s of SMALLTALK) if (s.re.test(q)) return s.reply;
  return null;
};

const SYSTEM = [
  'You are Bolt 958, the friendly support assistant for Book A Sloth — a SaaS appointment-booking platform where creators ("hosts") publish services and guests book them.',
  'You are given numbered Sources: excerpts from Book A Sloth\'s own documentation. Answer the user\'s question using the facts in those Sources, and ONLY those Sources — do not add outside knowledge.',
  'Default to answering. If the Sources contain the relevant information, write a clear, concise answer (a couple of sentences) and put the 1-based numbers of the Sources you used in source_numbers.',
  'Earlier turns of this conversation may be included before the current question. Use them to interpret follow-ups ("what about the other plan?", "and cancelling?"), but still answer ONLY from the Sources given for the current turn.',
  'Only set escalate=true when the Sources genuinely do not address the question at all. Do NOT escalate merely because the wording differs, the detail is partial, or you are being cautious — a partial but grounded answer is better than a handoff.',
  'Never invent prices, guarantees, links, dates, or policy that is not written in the Sources. When (and only when) you escalate, leave answer empty.',
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

async function retrieve(queryText) {
  const { data, error } = await supabaseAdmin.rpc('search_kb_chunks', {
    query_text: queryText,
    match_count: MATCH_COUNT,
  });
  if (error) throw error;
  return (data || []).filter((c) => (c.rank ?? 0) >= MIN_RANK);
}

// Follow-ups like "what about the other plan?" carry no keywords of their own, so
// FTS on the bare question retrieves nothing useful. Prepend the last couple of
// user turns to seed the query with their subject. ponytail: plain concatenation,
// no extra model call — upgrade to a model-based query rewrite only if this proves
// too weak in practice.
function buildRetrievalQuery(question, history) {
  const priorUserTurns = (history || [])
    .filter((m) => m.role === 'user')
    .slice(-2)
    .map((m) => m.content);
  return [...priorUserTurns, question].join(' ').trim();
}

// Prior turns as alternating messages for model context (persist() always writes a
// user+assistant pair, so history stays well-formed). Capped so long chats don't
// blow the token budget.
const HISTORY_TURNS = 6;
function toModelHistory(history) {
  return (history || [])
    .slice(-HISTORY_TURNS)
    .map((m) => ({ role: m.role === 'assistant' ? 'assistant' : 'user', content: String(m.content || '') }))
    .filter((m) => m.content.trim());
}

function buildUserMessage(question, chunks) {
  const sources = chunks
    .map((c, i) => `[${i + 1}] ${c.source_file}${c.heading ? ` — ${c.heading}` : ''}\n${c.content}`)
    .join('\n\n');
  return `Question: ${question}\n\nSources:\n${sources}`;
}

async function callModel(question, chunks, history = []) {
  const client = anthropicClient.getClient();
  const resp = await client.messages.create({
    model: anthropicClient.MODELS.generate,
    max_tokens: 1024,
    system: SYSTEM,
    tools: [ANSWER_TOOL],
    tool_choice: { type: 'tool', name: 'emit_answer' },
    messages: [
      ...toModelHistory(history),
      { role: 'user', content: buildUserMessage(question, chunks) },
    ],
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

  // Small talk ("hi", "thanks", "bye") is not a question — answer it warmly and
  // never escalate, so a greeting doesn't hand the user to a human or email support.
  const small = q && smalltalkReply(q);
  if (small) {
    const { conversationId: convId, messageId } = await persist({
      conversationId, sessionRef, question: q, answer: small, cited_sources: [], escalate: false,
    });
    return { answer: small, cited_sources: [], escalate: false, conversationId: convId, messageId };
  }

  // Prior turns of this conversation (best-effort). Used both to seed the FTS
  // query for follow-ups and to give the model context. Empty for a first turn.
  const history = conversationId ? await getRecentMessages(conversationId, HISTORY_TURNS) : [];

  let chunks = [];
  let retrievalOk = true;
  if (q) {
    try {
      chunks = await retrieve(buildRetrievalQuery(q, history));
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
      const out = await callModel(q, chunks, history);
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

module.exports = {
  askBot, recordFeedback, getRecentMessages, HANDOFF, SENSITIVE_RE, MIN_RANK,
  buildRetrievalQuery, toModelHistory,
};
