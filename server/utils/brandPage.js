// brandPage.js — self-contained branded HTML for the API host's browser-facing
// pages (root, 404, thrown errors). API/JSON clients never see this — see
// wantsBrandedHtml. Dependency-free + inline so it works on the API-only server
// (no view engine, no static dir). Brand: Plus Jakarta Sans headings, Poppins
// body, orange #FE5100 — matches bookasloth.com.
const SITE = 'https://bookasloth.com';

// Minimal HTML-escape for any dynamic text dropped into the template (error
// messages can contain user input). Prevents the branded page from becoming an
// XSS vector when `expose` error messages are shown.
const esc = (s) =>
  String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');

function brandPage({ code = '', title = 'Book A Sloth', heading = '', body = '', ctaLabel = 'Go to Book A Sloth', ctaHref = SITE } = {}) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex">
<title>${esc(title)} · Book A Sloth</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@800&family=Poppins:wght@400;500&display=swap" rel="stylesheet">
<style>
  :root { --orange:#FE5100; --ink:#141416; --muted:#5b5b62; --bg:#faf8f5; --card:#fff; --line:#ececec; }
  *{box-sizing:border-box}
  html,body{margin:0;height:100%}
  body{background:var(--bg);color:var(--ink);font-family:'Poppins',system-ui,-apple-system,Segoe UI,Roboto,sans-serif;display:grid;place-items:center;padding:24px}
  .card{background:var(--card);border:1px solid var(--line);border-radius:16px;max-width:460px;width:100%;padding:40px 32px;text-align:center;box-shadow:0 10px 40px rgba(20,20,22,.06)}
  .logo{display:inline-flex;align-items:center;gap:10px;margin-bottom:24px}
  .bolt{width:40px;height:40px;border-radius:12px;background:var(--orange);display:grid;place-items:center}
  .bolt svg{width:22px;height:22px}
  .brand{font-family:'Plus Jakarta Sans',sans-serif;font-weight:800;font-size:18px;letter-spacing:-.01em}
  .code{font-family:'Plus Jakarta Sans',sans-serif;font-weight:800;font-size:13px;letter-spacing:.14em;text-transform:uppercase;color:var(--orange);margin-bottom:10px}
  h1{font-family:'Plus Jakarta Sans',sans-serif;font-weight:800;font-size:26px;line-height:1.15;letter-spacing:-.02em;margin:0 0 12px}
  p{color:var(--muted);font-size:15px;line-height:1.6;margin:0 0 28px}
  a.btn{display:inline-block;background:var(--orange);color:#fff;text-decoration:none;font-weight:600;font-size:15px;padding:12px 24px;border-radius:12px;transition:opacity .15s}
  a.btn:hover{opacity:.9}
  .foot{margin-top:28px;font-size:12px;color:#9a9aa2}
  @media (prefers-color-scheme:dark){:root{--ink:#f5f5f7;--muted:#a1a1aa;--bg:#0e0e10;--card:#17171a;--line:#26262b}.card{box-shadow:0 10px 40px rgba(0,0,0,.4)}}
</style>
</head>
<body>
  <main class="card">
    <div class="logo">
      <span class="bolt"><svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M13 2 3 14h7l-1 8 10-12h-7l1-8z"/></svg></span>
      <span class="brand">Book A Sloth</span>
    </div>
    ${code ? `<div class="code">${esc(code)}</div>` : ''}
    <h1>${esc(heading)}</h1>
    <p>${esc(body)}</p>
    <a class="btn" href="${esc(ctaHref)}">${esc(ctaLabel)}</a>
    <div class="foot">book-a-sloth API · 0% commission booking</div>
  </main>
</body>
</html>`;
}

// Serve branded HTML only to browsers on non-API, non-ops paths. API clients,
// /api/*, and machine endpoints (health/ready/metrics/robots) keep JSON/plain.
// req.accepts prefers 'json' for `Accept: */*` (curl/fetch), 'html' for browsers.
function wantsBrandedHtml(req) {
  const p = (req && (req.path || req.url)) || '';
  if (p.startsWith('/api')) return false;
  if (['/health', '/ready', '/metrics', '/robots.txt'].includes(p)) return false;
  return typeof req.accepts === 'function' && req.accepts(['json', 'html']) === 'html';
}

module.exports = { brandPage, wantsBrandedHtml };
