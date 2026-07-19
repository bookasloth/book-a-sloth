/**
 * prerender.mjs — Post-build static prerender for marketing routes + blog posts.
 *
 * Renders each route in PRERENDER_ROUTES (plus every published /blog/:slug, which
 * blogRoutes() pulls from the API at build time) using Puppeteer against the built SPA,
 * captures the final HTML (with Seo.jsx-injected meta/OG/JSON-LD), and writes
 * it as the static .html for that path. Vercel serves these directly to social
 * scrapers and non-JS crawlers.
 *
 * Run: node scripts/prerender.mjs (after vite build)
 * Requires: puppeteer (devDependency)
 */

import { createServer } from 'http';
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { loadEnv } from 'vite';
import { FEATURES } from '../src/pages/features/featureData.js';
import { HELP_SLUGS } from '../src/content/helpDocsList.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DIST = join(__dirname, '..', 'dist');

// The SPA fallback served for every route WITHOUT its own prerendered file
// (vercel.json rewrites them to /spa-shell.html). It must be the BARE vite
// shell: the prerender overwrites dist/index.html with the fully-rendered
// homepage, and serving THAT as the fallback stamped `canonical=/` + homepage
// JSON-LD on every unrendered route's raw HTML (the 2026-07-19 audit's top
// finding). Copy the bare shell aside BEFORE any rendering — and before the
// preview-deploy early-exit below, because previews skip rendering but still
// need the fallback file to exist or the rewrite 404s every route.
writeFileSync(join(DIST, 'spa-shell.html'), readFileSync(join(DIST, 'index.html')));
console.log('[prerender] bare shell → dist/spa-shell.html (SPA fallback)');

// Preview deploys already get the real regression gates from vercel-build
// (vitest, then the vite build). The prerendered HTML only matters for what
// PRODUCTION serves to crawlers and link scrapers — rendering all ~77 routes
// on every PR preview was minutes of pure waste per push.
if (process.env.VERCEL && process.env.VERCEL_ENV !== 'production') {
  console.log(`[prerender] ${process.env.VERCEL_ENV} deploy — skipped (prerender is production-only)`);
  process.exit(0);
}
const PORT = 4173;
const ORIGIN = `http://localhost:${PORT}`;

const DEFAULT_TITLE = 'Book A Sloth — booked & paid at 0% commission';

// 15s was enough locally and timed out on a cold Vercel builder. A first pass at
// 30s runs 4-wide; anything that misses is retried serially at 60s on a now-idle
// builder (see the two passes below). The retry number is generous on purpose:
// by then nothing else competes for the builder, so a failure there is a
// genuinely broken page, not an unlucky one.
const NAV_TIMEOUT_MS = 30000;
const RETRY_TIMEOUT_MS = 60000;

const PRERENDER_ROUTES = [
  '/',
  '/pricing',
  '/enterprise',
  '/about',
  '/help',
  '/help/docs',
  ...HELP_SLUGS.map((s) => `/help/docs/${s}`),
  '/contact',
  '/support',
  '/blog',
  '/careers',
  '/changelog',
  '/privacy',
  '/terms',
  '/refund',
  '/wall-of-love',
  // KEEP IN SYNC with careersContent.js `jobs` slugs (it imports lucide-react,
  // so this node script can't import it the way it does featureData/helpDocsList).
  // Without prerender, a job page's raw HTML has no JobPosting JSON-LD at all.
  '/careers/digital-marketeer',
  '/careers/mern-stack-developer',
  '/careers/sales-associate',
  '/services',
  '/explore',
  '/for/lawyers',
  '/for/doctors',
  '/for/doctors-india',
  '/for/business-consultant',
  '/for/salon',
  '/for/freelancers',
  '/for/fitness',
  '/for/tutors',
  '/for/photographers',
  '/for/events',
  '/for/agencies',
  '/lp/calendly-alternative',
  '/lp/topmate-vs-bookasloth',
  '/lp/setmore-alternative',
  '/lp/acuity-alternative',
  '/lp/simplybook-alternative',
  '/lp/zoho-bookings-alternative',
  ...FEATURES.map((f) => `/features/${f.slug}`),
];

/**
 * Blog posts live in the DB, so their routes can't be a static list — ask the
 * same public API the SPA uses.
 *
 * On Vercel an unreachable API is FATAL. This function is fail-open by nature,
 * and a silent fallback there would ship a "successful" deploy that quietly
 * dropped every blog post from the prerender — the exact failure we spent a night
 * chasing, wearing a green tick. Locally it stays a warning: a dev without the API
 * running still wants a build.
 */
async function blogRoutes() {
  // This is a standalone node process, so Vite has not put .env into process.env
  // for us — loadEnv reads the .env files AND real env vars (how Vercel sets it).
  const env = loadEnv(process.env.NODE_ENV || 'production', join(__dirname, '..'), '');
  const base = (env.VITE_API_URL || process.env.VITE_API_URL || '').replace(/\/+$/, '');
  if (!base) {
    if (process.env.VERCEL) throw new Error('VITE_API_URL unset — cannot resolve blog posts');
    console.warn('[prerender] VITE_API_URL unset — skipping blog posts');
    return [];
  }
  try {
    const res = await fetch(`${base}/blogs`, { signal: AbortSignal.timeout(15000) });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const { posts } = await res.json();
    const routes = (posts || []).map((p) => p && p.slug).filter(Boolean).map((s) => `/blog/${s}`);
    console.log(`[prerender] ${routes.length} blog posts from ${base}`);

    // A published post without its generated card ships the generic site-wide
    // og:image — invisible to humans, identical to a good deploy in the logs,
    // and exactly how the two 2026-07-18 posts went out with the wrong card.
    // Same philosophy as the render-failure guard below: fail the PROD build
    // loudly with the fix in the message, warn-only everywhere else.
    const missingCards = (posts || []).filter((p) => p && p.slug && !p.ogImage).map((p) => p.slug);
    if (missingCards.length > 0) {
      const msg = `${missingCards.length} published post(s) have no og_image card: ${missingCards.join(', ')}. ` +
        'Run `npm run build:no-prerender && node --env-file=../server/.env.production scripts/generateBlogOgImages.mjs`, then redeploy.';
      if (process.env.VERCEL) throw new Error(msg);
      console.warn(`[prerender] WARNING: ${msg}`);
    }
    return routes;
  } catch (err) {
    if (process.env.VERCEL) throw new Error(`blog posts unresolvable (${err.message})`);
    console.warn(`[prerender] blog posts skipped (${err.message}) — static routes still render`);
    return [];
  }
}

/**
 * Vercel's build image ships no Chrome and none of its system libraries, so a
 * downloaded Chrome installs fine and then dies on launch:
 *
 *   Failed to launch the browser process: Code: 127
 *   chrome: error while loading shared libraries: libnspr4.so: cannot open shared object file
 *
 * That is why the prerender silently produced nothing there for weeks, and no
 * amount of fixing the *download* helped. @sparticuz/chromium is a Chromium build
 * that carries its own libraries and points LD_LIBRARY_PATH at them, which is the
 * standard answer for this environment. Pinned to 148 to match puppeteer's own
 * Chrome major — a protocol mismatch between the two is a genuinely confusing bug.
 *
 * Locally we use puppeteer's normal Chrome: sparticuz ships a Linux binary and is
 * useless on a dev machine.
 */
async function launchOptions() {
  if (!process.env.VERCEL) {
    return { headless: 'new', args: ['--no-sandbox', '--disable-setuid-sandbox'] };
  }
  const chromium = (await import('@sparticuz/chromium')).default;
  const executablePath = await chromium.executablePath();
  console.log(`[prerender] Vercel — @sparticuz/chromium at ${executablePath}`);
  return { args: chromium.args, executablePath, headless: chromium.headless };
}

function createStaticServer() {
  const mime = {
    '.html': 'text/html',
    '.js': 'application/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.svg': 'image/svg+xml',
    '.woff2': 'font/woff2',
    '.woff': 'font/woff',
    '.webp': 'image/webp',
    '.ico': 'image/x-icon',
    '.webmanifest': 'application/manifest+json',
    '.txt': 'text/plain',
  };

  // SPA fallback is the BARE shell (spa-shell.html), never dist/index.html:
  // once the '/' route has rendered, index.html is the full homepage with its
  // JSON-LD baked in — and every route rendered after it through that fallback
  // captured the homepage's SoftwareApplication/WebSite blocks alongside its
  // own (found by the 2026-07-19 rich-results validation, live on all 67
  // prerendered pages). Seo.jsx can't remove them: it only cleans up nodes it
  // created at runtime, not ones baked into the served HTML.
  return createServer((req, res) => {
    let filePath = join(DIST, req.url === '/' ? 'index.html' : req.url);

    if (!existsSync(filePath)) {
      filePath = join(DIST, 'spa-shell.html');
    }

    const ext = '.' + filePath.split('.').pop();
    const contentType = mime[ext] || 'application/octet-stream';

    try {
      const content = readFileSync(filePath);
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content);
    } catch {
      const fallback = readFileSync(join(DIST, 'spa-shell.html'));
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(fallback);
    }
  });
}

async function prerender() {
  const puppeteer = await import('puppeteer');

  const routes = [...PRERENDER_ROUTES, ...(await blogRoutes())];

  const server = createStaticServer();
  await new Promise((resolve) => server.listen(PORT, resolve));
  console.log(`[prerender] Static server on ${ORIGIN}`);

  const browser = await puppeteer.default.launch(await launchOptions());

  let rendered = 0;
  let failed = 0;

  const renderOnce = async (route, navTimeout = NAV_TIMEOUT_MS) => {
    const page = await browser.newPage();
    try {
      // Block analytics/tracking requests — avoids phantom pageviews and speeds up render
      await page.setRequestInterception(true);
      page.on('request', (req) => {
        const url = req.url();
        if (url.includes('posthog') || url.includes('clarity') || url.includes('google-analytics') || url.includes('facebook')) {
          req.abort();
        } else {
          req.continue();
        }
      });

      await page.goto(`${ORIGIN}${route}`, { waitUntil: 'networkidle0', timeout: navTimeout });

      // Wait for Seo.jsx useEffect to fire (title changes from default)
      await page.waitForFunction(
        (defaultTitle) => document.title !== defaultTitle,
        { timeout: 3000 },
        DEFAULT_TITLE,
      ).catch(() => {
        // Some pages keep default title — that's fine
      });

      // Strip runtime-injected external scripts (PostHog, analytics, etc.)
      // that got captured during render — they'll reload on hydration anyway.
      await page.evaluate(() => {
        document.querySelectorAll('script[src*="posthog"], script[src*="clarity"], script[src*="google"]').forEach(el => el.remove());
      });

      const html = await page.content();

      // Write to dist/<route>/index.html (or dist/index.html for /)
      let outPath;
      if (route === '/') {
        outPath = join(DIST, 'index.html');
      } else {
        const dir = join(DIST, route.slice(1));
        mkdirSync(dir, { recursive: true });
        outPath = join(dir, 'index.html');
      }

      writeFileSync(outPath, html, 'utf-8');
      return outPath;
    } finally {
      // Always close, including on a timeout — an orphaned page holds memory for
      // the rest of the run, and there are 77 of them.
      await page.close().catch(() => {});
    }
  };

  // First pass, 4-wide. Routes are independent and most of a route's wall clock
  // is `networkidle0` waiting on its own requests — overlapped across a pool that
  // wait mostly disappears. NO in-place retry: a timeout here is almost always
  // the 4 tabs saturating the ~4-vCPU builder (and/or a backend the page fetches
  // from being cold), and an immediate retry just re-enters the same jam — which
  // is exactly how a run of adjacent /lp/ routes failed a deploy. Defer the
  // stragglers to the serial pass below instead.
  // ponytail: fixed pool of 4, sized for the ~4-vCPU Vercel builder — lower it
  // first if prerender starts OOMing there, raise it if the builder grows.
  const POOL = 4;
  const deferred = [];
  const queue = [...routes];
  await Promise.all(
    Array.from({ length: POOL }, async () => {
      while (queue.length > 0) {
        const route = queue.shift();
        try {
          const outPath = await renderOnce(route);
          rendered++;
          console.log(`[prerender] ${route} → ${outPath.replace(DIST, 'dist')}`);
        } catch (err) {
          console.warn(`[prerender] defer ${route}: ${err.message}`);
          deferred.push(route);
        }
      }
    }),
  );

  // Second pass: the deferred stragglers, one at a time on a now-idle builder
  // (pool drained, any cold backend long since warm) with a longer timeout.
  // Usually empty. A route that fails HERE is a real, reproducible failure and
  // stops the release. Counters stay exact: one event loop, no data races.
  if (deferred.length > 0) {
    console.log(`[prerender] serial retry of ${deferred.length} deferred: ${deferred.join(', ')}`);
    for (const route of deferred) {
      try {
        const outPath = await renderOnce(route, RETRY_TIMEOUT_MS);
        rendered++;
        console.log(`[prerender] ${route} → ${outPath.replace(DIST, 'dist')} (deferred retry)`);
      } catch (err) {
        failed++;
        console.error(`[prerender] FAIL ${route}: ${err.message}`);
      }
    }
  }

  await browser.close();
  server.close();

  console.log(`[prerender] Done: ${rendered} rendered, ${failed} failed (${routes.length} routes)`);

  // A route that failed to render ships as the bare SPA shell: 200 OK, no title,
  // no og:image, no JSON-LD. Crawlers and WhatsApp see nothing. That is invisible
  // to humans and is precisely how this went unnoticed for weeks, so it fails the
  // build rather than deploying quietly.
  //
  // Deliberately NOT a check for exactly 77: the count is 43 static + however many
  // posts are published, so it moves every time you publish. "Nothing failed" is
  // the invariant that actually matters and it does not need maintaining.
  if (failed > 0) {
    console.error(`[prerender] FAILED: ${failed} of ${routes.length} route(s) did not render — refusing to ship a partially-rendered build.`);
    process.exit(1);
  }
}

prerender().catch((err) => {
  console.error('[prerender] FAILED:', err.message);
  process.exit(1);
});
