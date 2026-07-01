/**
 * responseCache.js — a tiny read-through TTL cache for assembled public API
 * responses (host profile, service detail). These endpoints each fire 6+ DB
 * queries and are the highest-traffic, most crawler-hit surface, so caching the
 * finished payload for a short window collapses repeated identical work.
 *
 * WHY in-process (for now): the API runs as a single Render instance today, so a
 * per-process Map is the zero-infra win. The public surface is `getOrSet` /
 * `bust` / `clear`; Phase 3 swaps the backend to Redis behind these same three
 * functions without touching any caller. Keep callers backend-agnostic — never
 * reach into the Map directly.
 *
 * Bounded: entries carry a TTL and the store is capped (MAX_ENTRIES). On insert
 * past the cap we drop expired entries first, then evict oldest-inserted (Map
 * preserves insertion order) so a flood of unique keys (e.g. a crawler walking
 * every username) can't grow memory without bound.
 *
 * Staleness: a write busts by key prefix, but the TTL is the real guarantee —
 * after a mutation, viewers may see up to TTL of staleness on any instance whose
 * cache wasn't the one busted (matches the 120s HTTP Cache-Control on the same
 * endpoints; documented, acceptable for public pages).
 */

const MAX_ENTRIES = Number(process.env.RESPONSE_CACHE_MAX_ENTRIES) || 2000;
const ENABLED = process.env.RESPONSE_CACHE_ENABLED !== 'false'; // kill-switch

const store = new Map(); // key -> { value, exp }

function _evictIfNeeded() {
  if (store.size <= MAX_ENTRIES) return;
  const now = Date.now();
  // Drop expired first — cheap and often enough.
  for (const [k, v] of store) {
    if (v.exp <= now) store.delete(k);
  }
  // Still over cap → evict oldest-inserted until under.
  while (store.size > MAX_ENTRIES) {
    const oldest = store.keys().next().value;
    if (oldest === undefined) break;
    store.delete(oldest);
  }
}

/**
 * Return the cached value for `key`, or run `producer()`, cache its result for
 * `ttlMs`, and return it. A producer that throws is NOT cached (the error
 * propagates so the caller's normal error path runs).
 */
async function getOrSet(key, ttlMs, producer) {
  if (!ENABLED) return producer();
  const now = Date.now();
  const hit = store.get(key);
  if (hit && hit.exp > now) return hit.value;
  if (hit) store.delete(key); // expired — drop before repopulating
  const value = await producer();
  store.set(key, { value, exp: now + ttlMs });
  _evictIfNeeded();
  return value;
}

/** Delete every entry whose key starts with `prefix`. Called on mutations. */
function bust(prefix) {
  let n = 0;
  for (const k of store.keys()) {
    if (k.startsWith(prefix)) { store.delete(k); n++; }
  }
  return n;
}

/** Wipe everything (tests / admin). */
function clear() {
  const n = store.size;
  store.clear();
  return n;
}

function _size() { return store.size; }

module.exports = { getOrSet, bust, clear, _size };
