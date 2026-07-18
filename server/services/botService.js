'use strict';
// Bolt — Book A Sloth's in-app support assistant (SIE phase A).
//
// Layered, cheapest-first pipeline (the confidence ladder):
//   small talk  → canned reply, no retrieval, no LLM
//   FAQ layer   → deterministic canned answer for high-frequency Qs, no LLM
//   retrieval   → Postgres full-text search over kb_chunks (docs/help/*)
//   Claude      → grounded ONLY on the retrieved chunks; streams its answer
//   escalate    → honest human handoff (email + a reviewable knowledge gap)
//
// Claude is the LAST reasoning layer, not the first response layer. Every layer
// short-circuits when it can answer, so most turns never reach the model.
//
// ponytail: reference anthropicClient via the module object (not destructured) so
// jest.spyOn / mocked isConfigured intercept live, same as generateListing.js.

const anthropicClient = require('./ai/anthropicClient');
const voyageClient = require('./ai/voyageClient');
const { supabaseAdmin } = require('../config/supabase');

// Pull a generous top-N so the authoritative chunk survives noisier docs; the
// model still answers only from what's relevant and escalates when none cover it.
const MATCH_COUNT = 8;
// ts_rank floor a chunk must clear to count as a real match. Kept low so genuine
// paraphrases aren't dropped before the model even sees them — the model is the
// real relevance judge, MIN_RANK only sheds pure noise. ponytail: single knob.
const MIN_RANK = 0.01;

// Vector retrieval (SIE phase B, hybrid). How many nearest chunks to pull and the
// cosine-similarity floor a vector hit must clear. Only exercised when VOYAGE_API_KEY
// is set AND kb_chunks has embeddings; otherwise retrieval is FTS-only (graceful).
const VEC_MATCH_COUNT = 6;
const MIN_SIMILARITY = 0.4;

// Semantic answer cache (SIE phase B part 2): a near-identical past question reuses
// its grounded answer with NO model call — the core "reduce AI dependency" lever.
// Threshold is deliberately high so a subtly different question can't be served a
// stale/wrong cached answer; below it, the question falls through to retrieval+model.
const CACHE_THRESHOLD = 0.93;

// Topics we always send to a human, however good the doc match — money REVERSALS
// and account-COMPROMISE, where a wrong-but-confident answer does real harm.
// Ordinary login trouble ("how do I log in", "I can't log in") is NOT here — the
// sign-in / OTP articles answer it and route to support if unresolved, so a plain
// login question shouldn't email a human. Informational money/account questions
// ("how do payouts work", "what is KYC") are likewise handled by help articles.
const SENSITIVE_RE = /\b(refunds?|charge ?backs?|disputes?|charged (?:me )?(?:twice|again|wrong|extra)|double ?charged?|fraud|hacked|stolen|compromis|locked out|account access|access my account|delete (?:my )?account|close (?:my )?account|unauthor)/i;

// The handoff line the user hears — in voice, honest, calm (money/frustrated
// contexts land here too, so no jokes). The visual "async handoff card" is the
// client's job; this is just the spoken line.
const HANDOFF =
  "Yeah — I don't have a solid answer for that one from the help docs, and I'm not " +
  "going to guess and risk getting it wrong. I'm pulling in a human from the team; " +
  "they'll follow up over WhatsApp or email.";

// Escalation sentinel the streaming model emits (and nothing else) when the Sources
// genuinely don't cover the question. Never shown to the user.
const ESCALATE_TOKEN = '[[ESCALATE]]';

// Greetings, thanks, and sign-offs are not questions — they retrieve no chunks and
// used to fall straight into escalation. Detect small talk by VOCABULARY, not fixed
// phrases: a message is small talk iff every word is a known greeting / thanks /
// affirmation / sign-off (or harmless filler) and it is short. Catches combos a
// phrase list misses ("ok thank you", "great thanks") while any real content word
// ("book", "cancel", "plan", "payout") falls through to the answer path.
// (Preserved from #417 — token-based detection; voice on the replies is Bolt's.)
const SMALLTALK_REPLIES = {
  greeting: "Hey! I'm Bolt. Ask me about booking a service, payments, plans, or becoming a host — I'll get you sorted.",
  thanks: "Anytime. Shout if anything else comes up.",
  affirm: "Nice. I'm around if you need anything else.",
  bye: "Take care! Come back any time you need a hand.",
};
const _GREET = new Set(['hi', 'hii', 'hiii', 'hiya', 'hey', 'heyy', 'heyyy', 'hello', 'helloo', 'hellooo', 'yo', 'yoo', 'sup', 'wassup', 'wasup', 'whatsup', 'namaste', 'hola', 'greetings', 'morning', 'afternoon', 'evening', 'gm', 'ge', 'howdy', 'how', 'hows']);
const _THANKS = new Set(['thanks', 'thanx', 'thank', 'thankyou', 'thx', 'tysm', 'ty', 'tq', 'cheers', 'appreciate', 'appreciated']);
const _AFFIRM = new Set(['ok', 'okay', 'okey', 'k', 'kk', 'cool', 'great', 'nice', 'awesome', 'perfect', 'fine', 'got', 'understood', 'alright', 'right', 'sounds', 'makes', 'sense', 'noted', 'done', 'yep', 'yeah', 'yes', 'sure']);
const _BYE = new Set(['bye', 'byee', 'byeee', 'goodbye', 'gtg', 'gn', 'goodnight', 'night', 'see', 'later', 'ttyl', 'cya']);
// Harmless connective/filler words that may sit inside small talk. NO content words.
const _FILLER = new Set(['you', 'u', 'ya', 'yaa', 'r', 'are', 'is', 'it', 'im', 'so', 'much', 'a', 'an', 'the', 'lot', 'very', 'really', 'quite', 'there', 'bolt', 'team', 'guys', 'and', 'to', 'for', 'going', 'doing', 'up', 'all', 'good', 'take', 'care', 'catch']);
const _VOCAB = new Set([..._GREET, ..._THANKS, ..._AFFIRM, ..._BYE, ..._FILLER]);

// Returns a canned reply for a pure-small-talk message, else null.
const smalltalkReply = (q) => {
  const cleaned = String(q).toLowerCase().replace(/[^a-z\s]/g, ' ').trim();
  if (!cleaned) return String(q).trim().length <= 4 ? SMALLTALK_REPLIES.greeting : null;
  const tokens = cleaned.split(/\s+/);
  if (tokens.length > 6 || !tokens.every((t) => _VOCAB.has(t))) return null;
  if (tokens.some((t) => _THANKS.has(t))) return SMALLTALK_REPLIES.thanks;
  if (tokens.some((t) => _BYE.has(t))) return SMALLTALK_REPLIES.bye;
  if (tokens.some((t) => _GREET.has(t))) return SMALLTALK_REPLIES.greeting;
  if (tokens.some((t) => _AFFIRM.has(t))) return SMALLTALK_REPLIES.affirm;
  return SMALLTALK_REPLIES.greeting; // only-filler ("you there") — default to hello
};

// Input hardening. The bot serves English — romanized Hindi/Hinglish ("booking
// kaise kare") works because those are Latin letters. We reject any letter from a
// NON-Latin script (Devanagari, CJK, Cyrillic, Arabic, Greek, Thai…) and invisible
// bidi/format characters (zero-width, right-to-left override). This shrinks the
// prompt-injection surface — homoglyph and RTL-override tricks that hide
// instructions from a human reviewer — and stops non-Latin questions from silently
// escalating to a human. Accented Latin (café, José, Zürich) stays allowed.
// ponytail: per-code-point \p{L}/\p{Script=Latin} test, NOT the `v`-flag set
// difference — the v-flag regex literal throws at module load on Node < 20 and
// would take the whole bot down; this form is safe on every modern Node.
const _LETTER_RE = /\p{L}/u;
const _LATIN_RE = /\p{Script=Latin}/u;
const _HIDDEN_RE = /\p{Cf}/u; // zero-width space, LRO/RLO bidi overrides, etc.
const isUnsupportedInput = (s) => {
  if (_HIDDEN_RE.test(s)) return true;
  for (const ch of String(s)) if (_LETTER_RE.test(ch) && !_LATIN_RE.test(ch)) return true;
  return false;
};
const UNSUPPORTED_INPUT_MSG =
  "I can only help in English right now. You can type Hindi and other Indian " +
  'languages using English letters (for example "booking kaise kare") — please ' +
  "rephrase that way and I'll help.";

// ── Voice (shared by the streamed + structured paths) ──────────────────────────
// The "how would Shubham explain this in a WhatsApp chat" system prompt. Grounding
// is non-negotiable; personality rides on top of it.
const VOICE = [
  'You are Bolt, the support assistant for Book A Sloth — a booking platform where creators ("hosts") publish services and guests book them.',
  'You speak in the voice of the founder, Shubham: sharp, direct, a little witty, unmistakably human. You are NOT Shubham — never say you built or designed the product, never say "my company", never claim to be him. You carry his style, not his identity.',
  'Voice: talk like a real person in a WhatsApp chat. Short sentences. Fragments are fine. Lead with the answer — no throat-clearing. Helpful first, personality second; humor is seasoning, not the meal. Simple words over corporate ones.',
  'Never use canned support phrases — "I understand your concern", "We apologize for the inconvenience", "Thank you for reaching out", "I\'d be happy to assist", "Please note that", "Rest assured", "Is there anything else I can help you with". They read as copy-paste. Say the human version instead.',
  'Match the mood: relaxed and playful for normal questions; clear and precise for technical ones; drop the jokes and move fast when someone is frustrated; stay calm and exact for anything about money or account access — never joke about someone\'s money or data.',
  'Keep it to 1–3 short paragraphs. Bullets only when they genuinely make it clearer. Do not repeat the question back. Do not end every message with a generic "anything else?". Emojis are rare and only when they fit.',
  'Grounding (non-negotiable): answer using ONLY the facts in the provided Sources. Do not add outside knowledge. Never invent prices, limits, guarantees, links, dates, or policy that is not in the Sources. Earlier turns may appear before the question — use them to read follow-ups, but answer only from the current Sources.',
].join(' ');

// Streaming path: plain text out, sentinel to escalate.
const SYSTEM_STREAM = [
  VOICE,
  `If the Sources genuinely do not cover the question, do NOT guess — reply with exactly "${ESCALATE_TOKEN}" and nothing else; the app hands off to a human. Only escalate when the Sources truly do not address it: a partial-but-grounded answer beats a handoff.`,
  'Otherwise write the answer in your natural voice. You may use light markdown: **bold**, `code`, "- " bullets, and [text](/internal-link). No headings.',
].join(' ');

// Structured path (kept for /ask + tests): same voice, emit via tool.
const SYSTEM_STRUCTURED = [
  VOICE,
  'Default to answering. If the Sources contain the relevant information, write the answer and put the 1-based numbers of the Sources you used in source_numbers.',
  'Only set escalate=true when the Sources genuinely do not address the question at all — not because the wording differs or the detail is partial. When (and only when) you escalate, leave answer empty.',
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

// All retrieved chunks as citation objects — the fallback when the model doesn't
// call out specific sources, so a grounded answer is never shown uncited.
const sourcesFromChunks = (chunks) =>
  dedupeSources(chunks.map((c) => ({ source_file: c.source_file, heading: c.heading || null })));

// Normalize for the FAQ substring match: lowercase, collapse whitespace, drop
// punctuation. Keeps the match dumb + explainable.
const normalize = (s) => String(s || '').toLowerCase().replace(/[^\w\s]/g, ' ').replace(/\s+/g, ' ').trim();

// ── FAQ layer: deterministic canned answer, no LLM. Best-effort — a missing table
// or DB hiccup just skips the layer (returns null → pipeline continues). ─────────
async function matchFaq(question) {
  const nq = normalize(question);
  if (!nq) return null;
  try {
    const { data, error } = await supabaseAdmin
      .from('bot_faqs').select('pattern, answer').eq('enabled', true);
    if (error) throw error;
    // First pattern contained in the question wins. Longest pattern first so a
    // specific one beats a generic overlap.
    const rows = (data || []).slice().sort((a, b) => b.pattern.length - a.pattern.length);
    for (const r of rows) {
      const p = normalize(r.pattern);
      if (p && nq.includes(p)) return r.answer;
    }
  } catch (e) {
    if (!_isMissingSchema(e)) console.error('[bot] faq lookup failed:', e.message);
  }
  return null;
}

// Keyword retrieval (Postgres FTS). Throws on a hard error so the caller can flag
// retrieval as failed; a missing RPC/table surfaces as an error the caller handles.
async function ftsRetrieve(queryText) {
  const { data, error } = await supabaseAdmin.rpc('search_kb_chunks', {
    query_text: queryText,
    match_count: MATCH_COUNT,
  });
  if (error) throw error;
  return (data || []).filter((c) => (c.rank ?? 0) >= MIN_RANK);
}

// Semantic retrieval (pgvector cosine). Best-effort: any failure (RPC not deployed,
// no embeddings yet, Voyage error upstream) returns [] so hybrid degrades to FTS.
async function vectorRetrieve(queryEmbedding) {
  if (!queryEmbedding) return [];
  try {
    const { data, error } = await supabaseAdmin.rpc('match_kb_chunks', {
      query_embedding: queryEmbedding,
      match_count: VEC_MATCH_COUNT,
    });
    if (error) throw error;
    return (data || []).filter((c) => (c.similarity ?? 0) >= MIN_SIMILARITY);
  } catch (e) {
    if (!_isMissingSchema(e)) console.error('[bot] vector retrieval failed:', e.message);
    return [];
  }
}

// Merge vector + FTS candidates: vector hits first (semantic match usually beats
// keyword overlap), then FTS, deduped by id and capped so the model's token budget
// stays bounded. The model is still the relevance judge over whatever survives.
function mergeChunks(vec, fts, cap = MATCH_COUNT) {
  const seen = new Set();
  const out = [];
  for (const c of [...vec, ...fts]) {
    if (!c || seen.has(c.id)) continue;
    seen.add(c.id);
    out.push(c);
    if (out.length >= cap) break;
  }
  return out;
}

// Hybrid retrieve. FTS errors propagate (caller flags retrieval failed); vector is
// additive + best-effort. queryEmbedding is null when Voyage is unconfigured.
async function retrieve(queryText, queryEmbedding = null) {
  const [fts, vec] = await Promise.all([
    ftsRetrieve(queryText),
    vectorRetrieve(queryEmbedding),
  ]);
  return mergeChunks(vec, fts);
}

// Embed the retrieval query for the vector leg. Best-effort + null when Voyage is
// off, so a slow/failed embed never blocks the answer — retrieval just goes FTS-only.
async function embedRetrievalQuery(text) {
  if (!voyageClient.isConfigured()) return null;
  try {
    return await voyageClient.embedQuery(text);
  } catch (e) {
    console.error('[bot] query embed failed:', e.message);
    return null;
  }
}

// Semantic cache lookup — best-effort. Returns { id, answer, cited_sources } for a
// near-identical prior question (>= CACHE_THRESHOLD), else null. Bumps the hit count
// in the background. Any failure (RPC/table missing, etc.) returns null → the normal
// retrieval+model path runs.
async function semanticCacheLookup(embedding) {
  if (!embedding) return null;
  try {
    const { data, error } = await supabaseAdmin.rpc('match_semantic_cache', {
      query_embedding: embedding, similarity_threshold: CACHE_THRESHOLD,
    });
    if (error) throw error;
    const hit = (data || [])[0];
    if (!hit) return null;
    bumpCacheHit(hit.id); // fire-and-forget
    return { id: hit.id, answer: hit.answer, cited_sources: Array.isArray(hit.cited_sources) ? hit.cited_sources : [] };
  } catch (e) {
    if (!_isMissingSchema(e)) console.error('[bot] cache lookup failed:', e.message);
    return null;
  }
}

// Store a fresh grounded answer for future reuse. Best-effort, never awaited on the
// response path. Only non-escalated model answers are cached (callers gate this).
async function semanticCacheStore(question, embedding, answer, cited_sources) {
  if (!embedding || !String(answer || '').trim()) return;
  try {
    await supabaseAdmin.from('bot_semantic_cache').insert({
      question, embedding, answer, cited_sources: cited_sources.length ? cited_sources : null,
    });
  } catch (e) {
    if (!_isMissingSchema(e)) console.error('[bot] cache store failed:', e.message);
  }
}

function bumpCacheHit(id) {
  supabaseAdmin.rpc('bump_cache_hit', { cache_id: id }).then(() => {}, () => {}); // best-effort
}

// Follow-ups ("what about the other plan?") carry no keywords of their own — seed
// the FTS query with the last couple of user turns. ponytail: plain concat, no
// rewrite model call.
function buildRetrievalQuery(question, history) {
  const priorUserTurns = (history || [])
    .filter((m) => m.role === 'user')
    .slice(-2)
    .map((m) => m.content);
  return [...priorUserTurns, question].join(' ').trim();
}

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

// Structured (non-streaming) model call — used by askBot / /ask.
async function callModel(question, chunks, history = []) {
  const client = anthropicClient.getClient();
  const resp = await client.messages.create({
    model: anthropicClient.MODELS.generate,
    max_tokens: 1024,
    system: SYSTEM_STRUCTURED,
    tools: [ANSWER_TOOL],
    tool_choice: { type: 'tool', name: 'emit_answer' },
    messages: [
      ...toModelHistory(history),
      { role: 'user', content: buildUserMessage(question, chunks) },
    ],
  });
  return (resp.content || []).find((b) => b.type === 'tool_use' && b.name === 'emit_answer')?.input || null;
}

// Streaming model call — emits text deltas via onDelta as they arrive, holding the
// first few chars back until it can tell an answer from the escalation sentinel
// (so the sentinel is never shown). Returns { text, escalate }.
async function streamGrounded(question, chunks, history, onDelta) {
  const client = anthropicClient.getClient();
  const stream = client.messages.stream({
    model: anthropicClient.MODELS.generate,
    max_tokens: 1024,
    system: SYSTEM_STREAM,
    messages: [
      ...toModelHistory(history),
      { role: 'user', content: buildUserMessage(question, chunks) },
    ],
  });

  let full = '';
  let gateOpen = false; // once open, deltas flow straight through
  let escalate = false;

  const emit = (t) => { if (t) onDelta(t); };

  for await (const ev of stream) {
    if (ev.type !== 'content_block_delta' || ev.delta?.type !== 'text_delta') continue;
    const piece = ev.delta.text;
    full += piece;
    if (escalate) continue;
    if (gateOpen) { emit(piece); continue; }

    // Gate closed: decide whether this is an escalation before showing anything.
    const t = full.trimStart();
    if (/^\[/.test(t)) {
      // Might be the sentinel "[[ESCALATE]]". Wait until we can be sure.
      if (/^\[\[escalate/i.test(t)) { escalate = true; continue; }
      if (t.length < ESCALATE_TOKEN.length) continue; // not enough chars to decide
    }
    gateOpen = true;
    emit(full); // flush everything buffered so far
  }

  // Answer shorter than the sentinel that never opened the gate — flush it.
  if (!gateOpen && !escalate && full.trim()) { gateOpen = true; emit(full); }

  return { text: escalate ? '' : full.trim(), escalate };
}

// Best-effort persistence — a logging failure must never break the user's reply.
// `source` names the layer that answered (analytics); tolerated-absent so this stays
// safe before the v3.87 column exists.
async function persist({ conversationId, sessionRef, question, answer, cited_sources, escalate, source = null }) {
  try {
    let convId = conversationId;
    if (!convId) {
      const { data, error } = await supabaseAdmin
        .from('bot_conversations').insert({ session_ref: sessionRef || null }).select('id').single();
      if (error) throw error;
      convId = data.id;
    }
    await supabaseAdmin.from('bot_messages').insert({ conversation_id: convId, role: 'user', content: question });
    const row = {
      conversation_id: convId, role: 'assistant', content: answer,
      cited_sources: cited_sources.length ? cited_sources : null, escalated: escalate, source,
    };
    let ins = await supabaseAdmin.from('bot_messages').insert(row).select('id').single();
    if (ins.error && _isMissingSchema(ins.error) && /source/.test(ins.error.message || '')) {
      delete row.source; // pre-v3.87 DB — retry without the new column
      ins = await supabaseAdmin.from('bot_messages').insert(row).select('id').single();
    }
    if (ins.error) throw ins.error;
    return { conversationId: convId, messageId: ins.data.id };
  } catch (e) {
    console.error('[bot] persist failed:', e.message);
    return { conversationId: conversationId || null, messageId: null };
  }
}

// Learning seed: record what Bolt couldn't answer. Best-effort; a missing table or
// error is swallowed so it never affects the reply. reason: 'escalated'|'thumbs_down'.
async function logGap({ question = null, reason, conversationId = null, messageId = null }) {
  try {
    await supabaseAdmin.from('knowledge_gaps').insert({
      question, reason, conversation_id: conversationId, message_id: messageId,
    });
  } catch (e) {
    if (!_isMissingSchema(e)) console.error('[bot] logGap failed:', e.message);
  }
}

/**
 * askBot({ question, conversationId?, sessionRef? })  — non-streaming, structured.
 * Kept for POST /api/bot/ask (backward-compatible) and unit/integration tests.
 * Never throws for an expected failure — it escalates so the caller always has a
 * clean reply. Returns { answer, cited_sources, escalate, conversationId, messageId, source }.
 * `source` names the layer that answered: 'smalltalk'|'faq'|'model'|'escalation'.
 */
async function askBot({ question, conversationId = null, sessionRef = null } = {}) {
  const q = String(question || '').trim();

  // Reject non-Latin scripts / hidden characters before any retrieval or model
  // call — never escalates (no support email), just asks for a rephrase.
  if (q && isUnsupportedInput(q)) {
    const { conversationId: convId, messageId } = await persist({
      conversationId, sessionRef, question: q, answer: UNSUPPORTED_INPUT_MSG, cited_sources: [], escalate: false, source: 'unsupported',
    });
    return { answer: UNSUPPORTED_INPUT_MSG, cited_sources: [], escalate: false, conversationId: convId, messageId, source: 'unsupported' };
  }

  const small = q && smalltalkReply(q);
  if (small) {
    const { conversationId: convId, messageId } = await persist({
      conversationId, sessionRef, question: q, answer: small, cited_sources: [], escalate: false, source: 'smalltalk',
    });
    return { answer: small, cited_sources: [], escalate: false, conversationId: convId, messageId, source: 'smalltalk' };
  }

  const faq = q && await matchFaq(q);
  if (faq) {
    const { conversationId: convId, messageId } = await persist({
      conversationId, sessionRef, question: q, answer: faq, cited_sources: [], escalate: false, source: 'faq',
    });
    return { answer: faq, cited_sources: [], escalate: false, conversationId: convId, messageId, source: 'faq' };
  }

  const history = conversationId ? await getRecentMessages(conversationId, HISTORY_TURNS) : [];
  const sensitive = SENSITIVE_RE.test(q);

  // Embed the query once (Voyage) — reused by the semantic cache AND hybrid retrieval.
  const retrievalQuery = q ? buildRetrievalQuery(q, history) : '';
  const queryEmbedding = q ? await embedRetrievalQuery(retrievalQuery) : null;

  // Semantic cache: a near-identical past question reuses its answer, no model call.
  // Never for sensitive topics — those must escalate, never serve a cached answer.
  if (queryEmbedding && !sensitive) {
    const cached = await semanticCacheLookup(queryEmbedding);
    if (cached) {
      const { conversationId: convId, messageId } = await persist({
        conversationId, sessionRef, question: q, answer: cached.answer, cited_sources: cached.cited_sources, escalate: false, source: 'cache',
      });
      return { answer: cached.answer, cited_sources: cached.cited_sources, escalate: false, conversationId: convId, messageId, source: 'cache' };
    }
  }

  let chunks = [];
  let retrievalOk = true;
  if (q) {
    try {
      chunks = await retrieve(retrievalQuery, queryEmbedding);
    } catch (e) {
      retrievalOk = false;
      if (!_isMissingSchema(e)) console.error('[bot] retrieval failed:', e.message);
    }
  }

  let answer = HANDOFF;
  let escalate = true;
  let cited_sources = [];
  let source = 'escalation';

  const canAnswer = q && retrievalOk && chunks.length && !sensitive && anthropicClient.isConfigured();
  if (canAnswer) {
    try {
      const out = await callModel(q, chunks, history);
      if (out && !out.escalate && String(out.answer || '').trim()) {
        escalate = false;
        source = 'model';
        answer = String(out.answer).trim();
        const nums = Array.isArray(out.source_numbers) ? out.source_numbers : [];
        cited_sources = dedupeSources(
          nums.map((n) => chunks[n - 1]).filter(Boolean)
            .map((c) => ({ source_file: c.source_file, heading: c.heading || null }))
        );
        if (!cited_sources.length) cited_sources = sourcesFromChunks(chunks);
        // Cache this grounded answer for near-identical future questions (best-effort).
        semanticCacheStore(q, queryEmbedding, answer, cited_sources);
      }
    } catch (e) {
      console.error('[bot] model call failed:', e.message);
    }
  }

  const { conversationId: convId, messageId } = await persist({
    conversationId, sessionRef, question: q, answer, cited_sources, escalate, source,
  });
  if (escalate) await logGap({ question: q, reason: 'escalated', conversationId: convId });

  return { answer, cited_sources, escalate, conversationId: convId, messageId, source };
}

/**
 * askBotStream({ question, conversationId?, sessionRef?, onDelta })
 * Same pipeline as askBot but streams the answer text through onDelta(text) as it
 * is produced (small-talk / FAQ arrive as a single delta; the model path streams
 * token-by-token). Resolves to the same shape as askBot once persistence is done.
 */
async function askBotStream({ question, conversationId = null, sessionRef = null, onDelta = () => {} } = {}) {
  const q = String(question || '').trim();

  // Reject non-Latin scripts / hidden characters (see isUnsupportedInput). Streams
  // the rephrase message as a single delta; never escalates.
  if (q && isUnsupportedInput(q)) {
    onDelta(UNSUPPORTED_INPUT_MSG);
    const { conversationId: convId, messageId } = await persist({
      conversationId, sessionRef, question: q, answer: UNSUPPORTED_INPUT_MSG, cited_sources: [], escalate: false, source: 'unsupported',
    });
    return { answer: UNSUPPORTED_INPUT_MSG, cited_sources: [], escalate: false, conversationId: convId, messageId, source: 'unsupported' };
  }

  const small = q && smalltalkReply(q);
  if (small) {
    onDelta(small);
    const { conversationId: convId, messageId } = await persist({
      conversationId, sessionRef, question: q, answer: small, cited_sources: [], escalate: false, source: 'smalltalk',
    });
    return { answer: small, cited_sources: [], escalate: false, conversationId: convId, messageId, source: 'smalltalk' };
  }

  const faq = q && await matchFaq(q);
  if (faq) {
    onDelta(faq);
    const { conversationId: convId, messageId } = await persist({
      conversationId, sessionRef, question: q, answer: faq, cited_sources: [], escalate: false, source: 'faq',
    });
    return { answer: faq, cited_sources: [], escalate: false, conversationId: convId, messageId, source: 'faq' };
  }

  const history = conversationId ? await getRecentMessages(conversationId, HISTORY_TURNS) : [];
  const sensitive = SENSITIVE_RE.test(q);

  // Embed the query once (Voyage) — reused by the semantic cache AND hybrid retrieval.
  const retrievalQuery = q ? buildRetrievalQuery(q, history) : '';
  const queryEmbedding = q ? await embedRetrievalQuery(retrievalQuery) : null;

  // Semantic cache hit → stream the cached answer as one delta, no model call.
  if (queryEmbedding && !sensitive) {
    const cached = await semanticCacheLookup(queryEmbedding);
    if (cached) {
      onDelta(cached.answer);
      const { conversationId: convId, messageId } = await persist({
        conversationId, sessionRef, question: q, answer: cached.answer, cited_sources: cached.cited_sources, escalate: false, source: 'cache',
      });
      return { answer: cached.answer, cited_sources: cached.cited_sources, escalate: false, conversationId: convId, messageId, source: 'cache' };
    }
  }

  let chunks = [];
  let retrievalOk = true;
  if (q) {
    try {
      chunks = await retrieve(retrievalQuery, queryEmbedding);
    } catch (e) {
      retrievalOk = false;
      if (!_isMissingSchema(e)) console.error('[bot] retrieval failed:', e.message);
    }
  }

  let answer = '';
  let escalate = true;
  let cited_sources = [];
  let source = 'escalation';

  const canAnswer = q && retrievalOk && chunks.length && !sensitive && anthropicClient.isConfigured();
  if (canAnswer) {
    try {
      const out = await streamGrounded(q, chunks, history, onDelta);
      if (!out.escalate && out.text) {
        escalate = false;
        source = 'model';
        answer = out.text;
        cited_sources = sourcesFromChunks(chunks); // streamed prose → cite all retrieved
        semanticCacheStore(q, queryEmbedding, answer, cited_sources); // best-effort
      }
    } catch (e) {
      console.error('[bot] stream model call failed:', e.message);
    }
  }

  if (escalate) {
    answer = HANDOFF;
    onDelta(HANDOFF); // the spoken handoff line; the client also shows the async card
  }

  const { conversationId: convId, messageId } = await persist({
    conversationId, sessionRef, question: q, answer, cited_sources, escalate, source,
  });
  if (escalate) await logGap({ question: q, reason: 'escalated', conversationId: convId });

  return { answer, cited_sources, escalate, conversationId: convId, messageId, source };
}

// Store 👍/👎 on an assistant message. On 👎, seed a knowledge gap. On 👍, auto-suggest
// a FAQ from the Q&A (disabled — an admin enables it in the console). Both best-effort;
// throws only on the primary update error.
async function recordFeedback(messageId, feedback) {
  const { error } = await supabaseAdmin.from('bot_messages').update({ feedback }).eq('id', messageId);
  if (error) throw error;
  if (feedback === 'down') await logGap({ reason: 'thumbs_down', messageId });
  if (feedback === 'up') await autopromoteFromFeedback(messageId);
}

// Learning loop: a 👍'd grounded answer becomes a *disabled* FAQ suggestion, keyed on
// the question that earned it. An admin reviews + enables it in the Bolt console; it is
// never served automatically (enabled=false) and never duplicates an existing pattern.
// Best-effort — never let a suggestion failure surface to the user.
async function autopromoteFromFeedback(messageId) {
  try {
    const { data: msg } = await supabaseAdmin
      .from('bot_messages').select('content, conversation_id, created_at, escalated').eq('id', messageId).single();
    if (!msg || msg.escalated || !String(msg.content || '').trim()) return;

    // The user question this answer replied to = the last user turn before it.
    const { data: prior } = await supabaseAdmin
      .from('bot_messages').select('content')
      .eq('conversation_id', msg.conversation_id).eq('role', 'user').lt('created_at', msg.created_at)
      .order('created_at', { ascending: false }).limit(1);
    const question = prior && prior[0] && prior[0].content;
    const pattern = normalize(question).slice(0, 120);
    if (!pattern) return;

    const { data: existing } = await supabaseAdmin.from('bot_faqs').select('id').eq('pattern', pattern).limit(1);
    if (existing && existing.length) return; // already covered
    await supabaseAdmin.from('bot_faqs').insert({ pattern, answer: msg.content, enabled: false });
  } catch (e) {
    if (!_isMissingSchema(e)) console.error('[bot] autopromote failed:', e.message);
  }
}

// Recent turns (best-effort; [] on any failure).
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
  askBot, askBotStream, recordFeedback, getRecentMessages, matchFaq, logGap,
  HANDOFF, SENSITIVE_RE, MIN_RANK, ESCALATE_TOKEN, buildRetrievalQuery, toModelHistory,
  smalltalkReply, SMALLTALK_REPLIES, mergeChunks,
  isUnsupportedInput, UNSUPPORTED_INPUT_MSG,
};
