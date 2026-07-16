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

const __dirname = dirname(fileURLToPath(import.meta.url));
const DIST = join(__dirname, '..', 'dist');
const PORT = 4173;
const ORIGIN = `http://localhost:${PORT}`;

const DEFAULT_TITLE = 'Book A Sloth — booked & paid at 0% commission';

const PRERENDER_ROUTES = [
  '/',
  '/pricing',
  '/enterprise',
  '/about',
  '/help',
  '/contact',
  '/support',
  '/blog',
  '/careers',
  '/changelog',
  '/privacy',
  '/terms',
  '/refund',
  '/badges',
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
 * same public API the SPA uses. Best-effort by design: a build with no reachable
 * API still ships every static route above, and posts fall back to SPA rendering
 * (which humans see fine, but crawlers and AI answer engines largely don't).
 */
async function blogRoutes() {
  // This is a standalone node process, so Vite has not put .env into process.env
  // for us — loadEnv reads the .env files AND real env vars (how Vercel sets it).
  const env = loadEnv(process.env.NODE_ENV || 'production', join(__dirname, '..'), '');
  const base = (env.VITE_API_URL || process.env.VITE_API_URL || '').replace(/\/+$/, '');
  if (!base) {
    console.warn('[prerender] VITE_API_URL unset — skipping blog posts');
    return [];
  }
  try {
    const res = await fetch(`${base}/blogs`, { signal: AbortSignal.timeout(15000) });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const { posts } = await res.json();
    const routes = (posts || []).map((p) => p && p.slug).filter(Boolean).map((s) => `/blog/${s}`);
    console.log(`[prerender] ${routes.length} blog posts from ${base}`);
    return routes;
  } catch (err) {
    console.warn(`[prerender] blog posts skipped (${err.message}) — static routes still render`);
    return [];
  }
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

  return createServer((req, res) => {
    let filePath = join(DIST, req.url === '/' ? 'index.html' : req.url);

    if (!existsSync(filePath)) {
      filePath = join(DIST, 'index.html');
    }

    const ext = '.' + filePath.split('.').pop();
    const contentType = mime[ext] || 'application/octet-stream';

    try {
      const content = readFileSync(filePath);
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content);
    } catch {
      const fallback = readFileSync(join(DIST, 'index.html'));
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

  const browser = await puppeteer.default.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  let rendered = 0;
  let failed = 0;

  for (const route of routes) {
    try {
      const page = await browser.newPage();

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

      await page.goto(`${ORIGIN}${route}`, { waitUntil: 'networkidle0', timeout: 15000 });

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
      await page.close();

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
      rendered++;
      console.log(`[prerender] ${route} → ${outPath.replace(DIST, 'dist')}`);
    } catch (err) {
      failed++;
      console.warn(`[prerender] SKIP ${route}: ${err.message}`);
    }
  }

  await browser.close();
  server.close();

  console.log(`[prerender] Done: ${rendered} rendered, ${failed} skipped`);
}

prerender().catch((err) => {
  console.error('[prerender] Fatal error (build continues):', err.message);
  process.exit(0); // Non-blocking — SPA fallback works without prerender
});
