// Vercel Edge Middleware — two jobs:
//
// 1. BOT PRERENDER: detect social scrapers / non-JS crawlers and proxy them to
//    the server-side /prerender endpoint, which serves a lightweight HTML page
//    with correct <title>, OG tags, canonical, and JSON-LD from the DB. This
//    makes shared links on Twitter/LinkedIn/Slack show real metadata, and gives
//    non-JS search bots actual content.
//
// 2. USERNAME REDIRECT: for OLD/changed usernames, issue a 301 to the current
//    username (like Facebook/GitHub). The SPA can't emit real 301s.
//
// Requirements:
//   - Env var API_ORIGIN = your API base WITHOUT trailing /api
//     (e.g. https://book-a-sloth.onrender.com). Falls back to the live API origin.
//
// Fail-open: any error simply continues to the SPA.

import { RESERVED_FIRST_SEGMENTS } from './src/config/reservedSegments.js';

const API_ORIGIN = process.env.API_ORIGIN || 'https://book-a-sloth.onrender.com';

const SKIP = new Set(RESERVED_FIRST_SEGMENTS);

// Bot User-Agent patterns — social scrapers + major non-JS crawlers.
// Intentionally does NOT include Googlebot (renders JS fine) to avoid
// double-serving and cache-busting for the world's most important crawler.
const BOT_UA_RE = /Twitterbot|facebookexternalhit|LinkedInBot|Slackbot|Discordbot|WhatsApp|TelegramBot|Applebot|PinterestBot|Embedly|Quora Link Preview|Showyoubot|outbrain|vkShare|W3C_Validator|Baiduspider\/render|Sogou|YandexBot|PerplexityBot|ClaudeBot|GPTBot|Google-Extended|ia_archiver/i;

export const config = {
  matcher: ['/((?!api/|assets/|_next/|favicon|.*\\.).*)'],
};

function isBot(request) {
  const ua = request.headers.get('user-agent') || '';
  return BOT_UA_RE.test(ua);
}

async function fetchPrerender(pathname) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 3000);
  try {
    const res = await fetch(`${API_ORIGIN}/prerender${pathname}`, {
      headers: { accept: 'text/html' },
      signal: controller.signal,
    });
    if (!res.ok) return null;
    const html = await res.text();
    return new Response(html, {
      status: 200,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'public, max-age=120, s-maxage=300',
        'X-Prerender': 'true',
      },
    });
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

export default async function middleware(request) {
  const url = new URL(request.url);
  const segments = url.pathname.split('/').filter(Boolean);

  // ── Bot prerender for dynamic profile/service routes ──────────────────────
  // /:username (1 segment, not a reserved route)
  // /:username/:serviceSlug (2 segments, not a reserved route)
  if (isBot(request) && segments.length >= 1 && segments.length <= 2) {
    const first = segments[0].toLowerCase();
    if (!SKIP.has(first)) {
      const prerenderResponse = await fetchPrerender(url.pathname);
      if (prerenderResponse) return prerenderResponse;
      // Fall through to SPA on prerender failure
    }
  }

  // ── Username redirect (human + bot traffic) ───────────────────────────────
  if (segments.length !== 1) return;

  const slug = segments[0].toLowerCase();
  if (SKIP.has(slug)) return;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 2000);
    let res;
    try {
      res = await fetch(`${API_ORIGIN}/api/username/resolve/${encodeURIComponent(slug)}`, {
        headers: { accept: 'application/json' },
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timeout);
    }
    if (!res.ok) return;
    const data = await res.json();
    if (data.found && data.current && data.current !== slug) {
      url.pathname = `/${data.current}`;
      return Response.redirect(url.toString(), 301);
    }
  } catch (_) {
    // fail open
  }
}
