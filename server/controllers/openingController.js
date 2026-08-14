/**
 * openingController.js — "The Opening" launch event (Independence Day, 15→16 Aug).
 * Mounted at /api/opening. Public, no auth; write path IP rate-limited at the route.
 *
 * Visitors cut the ribbon and place a permanent named stone on the Inaugurators
 * Wall. The opener `number` is a hidden ordering key — allocated by the DB, never
 * returned to the client (founder call: no visible numbers, no per-opener links).
 *
 * Window is server-authoritative: opens_at / closes_at live in platform_settings
 * (admin-adjustable). The client countdown is cosmetic; POST /open enforces the
 * real gate. In non-prod, OPENING_PREVIEW=true forces the window open for QA so we
 * don't have to wait for Aug 15.
 *
 * All DB access is via supabaseAdmin (openers is RLS-on / no-policy / service-role
 * only). supabase-js never throws — always check `error` (see memory audit #488).
 */
'use strict';

const { supabaseAdmin } = require('../config/supabase');
const { getClientIp } = require('../lib/clientIp');

// Stone asset variants the client renders. Keep in sync with client stone assets.
const SHADES = 6; // colour variants (brand palette)
const SHAPES = 4; // SVG shape variants
const WALL_PAGE = 60; // stones per wall page
const WALL_MAX = 200; // hard cap on ?limit

const PREVIEW = process.env.OPENING_PREVIEW === 'true' && process.env.NODE_ENV !== 'production';

const clamp = (n, lo, hi) => Math.max(lo, Math.min(hi, n));
const rand = (n) => Math.floor(Math.random() * n);

// Read the window from platform_settings. Values are JSONB strings (ISO UTC).
// Returns {opensAt, closesAt} as Date|null; null means "unset" (treated as closed
// in prod, open under PREVIEW).
async function readWindow() {
  const { data, error } = await supabaseAdmin
    .from('platform_settings')
    .select('key, value')
    .in('key', ['opening_opens_at', 'opening_closes_at']);
  if (error) return { opensAt: null, closesAt: null };

  const pick = (key) => {
    const row = (data || []).find((r) => r.key === key);
    if (!row || row.value == null) return null;
    // value may be a raw string or a JSON-stringified string.
    let v = row.value;
    if (typeof v === 'string') { try { v = JSON.parse(v); } catch { /* raw string */ } }
    const d = new Date(v);
    return Number.isNaN(d.getTime()) ? null : d;
  };
  return { opensAt: pick('opening_opens_at'), closesAt: pick('opening_closes_at') };
}

function windowState({ opensAt, closesAt }, now = new Date()) {
  if (PREVIEW) return 'open';
  if (!opensAt || !closesAt) return 'closed';
  if (now < opensAt) return 'pending';
  if (now >= closesAt) return 'closed';
  return 'open';
}

// GET /api/opening/status — drives the countdown + live counter.
exports.getStatus = async (_req, res) => {
  const win = await readWindow();
  const { count } = await supabaseAdmin
    .from('openers')
    .select('id', { count: 'exact', head: true });

  const state = windowState(win);
  return res.json({
    opens_at: win.opensAt ? win.opensAt.toISOString() : null,
    closes_at: win.closesAt ? win.closesAt.toISOString() : null,
    state,               // 'pending' | 'open' | 'closed'
    open: state === 'open',
    count: count || 0,
    preview: PREVIEW,
  });
};

// POST /api/opening/open — cut the ribbon + place a stone.
exports.open = async (req, res) => {
  const name = (req.body?.name || '').trim();
  const message = (req.body?.message || '').trim();

  if (name.length < 2 || name.length > 40) {
    return res.status(400).json({ message: 'Please enter your name (2–40 characters).' });
  }
  if (message.length > 80) {
    return res.status(400).json({ message: 'Your message is a bit long — keep it under 80 characters.' });
  }

  const state = windowState(await readWindow());
  if (state === 'pending') {
    return res.status(403).json({ message: 'The doors are not open yet. Come back on 15 August.' });
  }
  if (state === 'closed') {
    return res.status(410).json({ message: 'The doors have closed. The wall is sealed forever — but you can still explore.' });
  }

  const stone = { shade: rand(SHADES), shape: rand(SHAPES) };
  const { data, error } = await supabaseAdmin
    .from('openers')
    .insert({
      name,
      message: message || null,
      shade: stone.shade,
      shape: stone.shape,
      ip: getClientIp(req) || null,
      user_agent: (req.headers['user-agent'] || '').slice(0, 400) || null,
    })
    .select('name, message, shade, shape, created_at')
    .single();

  if (error || !data) {
    console.error('[opening] insert failed:', error?.message);
    return res.status(500).json({ message: 'Could not place your stone. Please try again.' });
  }
  // number intentionally omitted from the response — it is a hidden ordering key.
  return res.status(201).json({ opener: data });
};

// GET /api/opening/wall?cursor=&limit= — public Inaugurators Wall, oldest first.
// cursor is an opaque pagination token (the hidden number of the last stone seen);
// it is never surfaced as an opener's identity.
exports.getWall = async (req, res) => {
  const limit = clamp(parseInt(req.query.limit, 10) || WALL_PAGE, 1, WALL_MAX);
  const cursor = parseInt(req.query.cursor, 10);

  let q = supabaseAdmin
    .from('openers')
    .select('number, name, message, shade, shape, created_at')
    .order('number', { ascending: true })
    .limit(limit);
  if (Number.isFinite(cursor)) q = q.gt('number', cursor);

  const { data, error } = await q;
  if (error) {
    console.error('[opening] wall read failed:', error.message);
    return res.status(500).json({ message: 'Could not load the wall right now.' });
  }

  const rows = data || [];
  const next_cursor = rows.length === limit ? rows[rows.length - 1].number : null;
  // strip the hidden number before it leaves the server.
  const openers = rows.map(({ number, ...rest }) => rest);
  return res.json({ openers, next_cursor });
};

// exported for unit tests (pure window logic)
exports._windowState = windowState;
