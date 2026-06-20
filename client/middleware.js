// Vercel Edge Middleware — SEO-grade 301 redirect for OLD/changed usernames.
//
// Public profiles live at the ROOT path (/:slug). When a host changes their
// username, the old URL must permanently redirect to the current one (like
// Facebook/GitHub). A React SPA cannot emit a real HTTP 301, so we do it here at
// the edge: resolve the slug via the API and, if it points to a DIFFERENT
// current username, issue a 301. Everything else passes through to the SPA.
//
// Requirements:
//   - Env var API_ORIGIN = your API base WITHOUT trailing /api
//     (e.g. https://book-a-sloth.onrender.com). Falls back to the live API origin.
//
// Fail-open: any error (network, non-200) simply continues to the SPA, so a
// flaky API never takes down profile pages — at worst the client-side fallback
// in HostProfile.jsx self-corrects the URL.

const API_ORIGIN = process.env.API_ORIGIN || 'https://book-a-sloth.onrender.com';

// High-traffic app routes — skip the API round-trip for these. Not exhaustive
// (the resolve API returns 404 for any non-username anyway); this is just to
// avoid needless lookups on the busiest non-profile paths.
const SKIP = new Set([
  'login', 'dashboard', 'super-dashboard', 'admin', 'explore', 'about', 'help',
  'privacy', 'unsubscribe', 'signup', 'vendor', 'vendor-register', 'hello-sloth',
  'my-bookings', 'profile', 'reviews', 'loyalty', 'be-a-sloth', 'login-as-vendor',
]);

export const config = {
  // Run only on first-segment paths. Exclude API, Vite assets, and any path with
  // a file extension (.js, .css, .png, …) or the SPA's own internal routes.
  matcher: ['/((?!api/|assets/|_next/|favicon|.*\\.).*)'],
};

export default async function middleware(request) {
  const url = new URL(request.url);
  const segments = url.pathname.split('/').filter(Boolean);

  // Only single-segment paths can be a profile slug (/:slug).
  if (segments.length !== 1) return;

  const slug = segments[0].toLowerCase();
  if (SKIP.has(slug)) return;

  try {
    // Hard timeout so a slow/cold backend fails OPEN fast (continue to the SPA)
    // rather than hanging until Vercel kills the edge invocation with a 504
    // MIDDLEWARE_INVOCATION_TIMEOUT — which would take the whole page down.
    // Username resolve is sub-200ms when the API is warm; 2s is ample headroom.
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
    if (!res.ok) return; // 404 (not a username) or error → continue to SPA
    const data = await res.json();
    if (data.found && data.current && data.current !== slug) {
      url.pathname = `/${data.current}`;
      return Response.redirect(url.toString(), 301);
    }
  } catch (_) {
    // fail open — timeout/abort, network error, or non-200 all continue to the SPA
  }
}
