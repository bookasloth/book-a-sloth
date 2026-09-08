'use strict';
// parseSearchQuery — turn a free-text Explore query into structured search
// controls: { text, location, mode }. Lets a guest type "Mock Interview Offline
// Nagpur" and have the location + mode peeled off the topic terms.
//
// Cheap-by-default: Haiku (MODELS.generate), forced single tool call, results
// memoised per normalised query so a repeated/popular search never re-hits the
// API. Fails SOFT — no key, an SDK error, or a malformed reply all degrade to
// "treat the whole query as topic text" (the pre-LLM behaviour), so search is
// never worse than it was, only better when the model answers.
const anthropicClient = require('./anthropicClient');

// Only these modes exist as filters. 'hybrid' is accepted (guests say it) but
// no service is stored hybrid, so the controller treats it as "no mode filter"
// rather than a value that would match nothing.
const MODES = new Set(['online', 'offline', 'hybrid']);

// Bounded in-memory cache. Parses are stable for a given query string, so a
// plain Map with an LRU-ish cap is enough — no TTL needed (process restarts
// clear it). ponytail: Map + size cap; swap for a shared cache only if multiple
// server instances make the per-process hit rate too low to matter.
const CACHE = new Map();
const CACHE_CAP = 500;
function cacheGet(k) {
  if (!CACHE.has(k)) return undefined;
  const v = CACHE.get(k);
  CACHE.delete(k); CACHE.set(k, v); // bump to MRU
  return v;
}
function cacheSet(k, v) {
  CACHE.set(k, v);
  if (CACHE.size > CACHE_CAP) CACHE.delete(CACHE.keys().next().value); // evict LRU
}

const PARSE_TOOL = {
  name: 'emit_query',
  description: 'Break a marketplace search query into its topic, location and delivery-mode parts.',
  input_schema: {
    type: 'object',
    properties: {
      text: {
        type: 'string',
        description: "The service/topic terms only, with any city and mode words removed. E.g. for 'Mock Interview Offline Nagpur' this is 'Mock Interview'. Empty string if the query is purely a location and/or mode.",
      },
      location: {
        type: 'string',
        description: "The city or place mentioned, if any (e.g. 'Nagpur', 'Pune', 'Mumbai'). Empty string if none. Bare city name only — no state/country.",
      },
      mode: {
        type: 'string',
        enum: ['online', 'offline', 'hybrid', ''],
        description: "Delivery mode if the query names one, else empty string. 'in person'/'at venue' => offline; 'virtual'/'remote' => online.",
      },
    },
    required: ['text', 'location', 'mode'],
  },
};

const SYSTEM =
  'You parse short search queries for a services marketplace in India. Extract the topic text, an optional city, and an optional delivery mode. Never invent a location or mode that is not implied by the query. Always call emit_query.';

const fallback = (q) => ({ text: q || '', location: '', mode: '' });

async function parseSearchQuery(rawQ) {
  const q = String(rawQ || '').trim();
  if (!q) return fallback('');
  if (!anthropicClient.isConfigured()) return fallback(q);

  const key = q.toLowerCase();
  const hit = cacheGet(key);
  if (hit) return hit;

  let parsed;
  try {
    const client = anthropicClient.getClient();
    const resp = await client.messages.create({
      model: anthropicClient.MODELS.generate,
      max_tokens: 256,
      system: SYSTEM,
      tools: [PARSE_TOOL],
      tool_choice: { type: 'tool', name: 'emit_query' },
      messages: [{ role: 'user', content: q }],
    });
    const block = (resp.content || []).find((b) => b.type === 'tool_use' && b.name === 'emit_query');
    if (!block || !block.input) return fallback(q); // don't cache a miss — next call can retry
    const inp = block.input;
    const mode = String(inp.mode || '').toLowerCase();
    parsed = {
      // If the model stripped everything into location/mode, text is '' — that's
      // valid (a pure "Nagpur" or "Online" query filters without a topic match).
      text: String(inp.text || '').trim(),
      location: String(inp.location || '').trim(),
      mode: MODES.has(mode) ? mode : '',
    };
  } catch (e) {
    console.warn('[parseSearchQuery] fell back to raw text:', e.message);
    return fallback(q); // soft fail, uncached
  }

  cacheSet(key, parsed);
  return parsed;
}

module.exports = { parseSearchQuery, _CACHE: CACHE };
