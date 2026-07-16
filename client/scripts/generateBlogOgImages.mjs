/**
 * generateBlogOgImages.mjs — render a per-post OG card and store its URL on the post.
 *
 * Without this every post shares /og-image.png, so 22 different articles produce
 * one identical card in WhatsApp, LinkedIn, Slack and AI answer surfaces.
 *
 * Lives in client/ because both dependencies it needs are already here: puppeteer
 * (the prerender's) and @supabase/supabase-js. Adding a rasteriser to server/
 * would have made Render download Chromium on every deploy — its build is `npm ci`,
 * which installs devDependencies.
 *
 * Run once per DB with that DB's credentials. Uses node's built-in --env-file
 * rather than dotenv, which client/ doesn't depend on and doesn't need to:
 *   node --env-file=../server/.env scripts/generateBlogOgImages.mjs              # staging
 *   node --env-file=../server/.env.production scripts/generateBlogOgImages.mjs   # prod
 *
 * Idempotent: re-running overwrites each card at a stable path. Pass --only=<slug>
 * to redo a single post, --dry to render into scripts/.og-preview/ without uploading.
 */
import { createClient } from '@supabase/supabase-js';
import { mkdirSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { themeFor } from '../src/data/blogPosts.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

const W = 1200;
const H = 630;
const BUCKET = 'images';
const PREFIX = 'blog-og';

const args = process.argv.slice(2);
const only = (args.find((a) => a.startsWith('--only=')) || '').split('=')[1] || null;
const dry = args.includes('--dry');

const esc = (s) => String(s || '').replace(/[&<>"]/g, (c) => (
  { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]
));

// Title-only card. Deliberately NOT a reuse of BlogHeroThumbnail: those are
// text-free geometry sized for a card, this has to stay legible as a 1200x630
// thumbnail in a chat app. Same band colour, so the two still read as one system.
const cardHtml = ({ title, category, author, readMins }) => {
  const t = themeFor(category);
  const ink = t.light ? '#1a1a1a' : '#ffffff';
  const dim = t.light ? 'rgba(0,0,0,0.62)' : 'rgba(255,255,255,0.72)';
  // Long headlines shrink rather than overflow the card.
  const size = title.length > 90 ? 52 : title.length > 60 ? 62 : 72;
  return `<!doctype html><html><head><meta charset="utf-8">
<style>
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@700;800&family=Poppins:wght@400;600&display=swap');
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { width: ${W}px; height: ${H}px; background: ${t.band}; color: ${ink};
         font-family: 'Poppins', system-ui, sans-serif; display: flex; flex-direction: column;
         justify-content: space-between; padding: 72px; overflow: hidden; }
  .cat { font-size: 20px; font-weight: 600; letter-spacing: .14em; text-transform: uppercase; color: ${dim}; }
  h1 { font-family: 'Plus Jakarta Sans', system-ui, sans-serif; font-weight: 800;
       font-size: ${size}px; line-height: 1.12; letter-spacing: -.02em;
       display: -webkit-box; -webkit-line-clamp: 4; -webkit-box-orient: vertical; overflow: hidden; }
  .foot { display: flex; align-items: center; justify-content: space-between; font-size: 22px; color: ${dim}; }
  .brand { font-family: 'Plus Jakarta Sans', system-ui, sans-serif; font-weight: 800; font-size: 26px; color: ${ink}; }
</style></head><body>
  <div class="cat">${esc(category || 'Book A Sloth')}</div>
  <h1>${esc(title)}</h1>
  <div class="foot">
    <span>by ${esc(author || 'Book A Sloth')}${readMins ? ` · ${readMins} min read` : ''}</span>
    <!-- Wordmark only: an emoji here rasterises to whatever font the rendering
         machine happens to have, which is a mangled glyph or tofu, not a sloth. -->
    <span class="brand">Book A Sloth</span>
  </div>
</body></html>`;
};

async function main() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    console.error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set. See the header for the dotenv invocation.');
    process.exit(1);
  }
  const db = createClient(url, key, { auth: { persistSession: false } });

  let q = db.from('blogs').select('slug,title,category,author,read_mins').eq('status', 'published');
  if (only) q = q.eq('slug', only);
  const { data: posts, error } = await q;
  if (error) throw error;
  if (!posts.length) {
    console.error(only ? `No published post with slug "${only}"` : 'No published posts.');
    process.exit(1);
  }

  const puppeteer = await import('puppeteer');
  const browser = await puppeteer.default.launch({ headless: 'new', args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  await page.setViewport({ width: W, height: H, deviceScaleFactor: 1 });

  const outDir = join(__dirname, '.og-preview');
  if (dry) mkdirSync(outDir, { recursive: true });

  let ok = 0;
  for (const p of posts) {
    try {
      await page.setContent(cardHtml({ title: p.title, category: p.category, author: p.author, readMins: p.read_mins }), { waitUntil: 'networkidle0' });
      const png = await page.screenshot({ type: 'png' });

      if (dry) {
        writeFileSync(join(outDir, `${p.slug}.png`), png);
        console.log('dry ', p.slug);
        ok += 1;
        continue;
      }

      const path = `${PREFIX}/${p.slug}.png`;
      const up = await db.storage.from(BUCKET).upload(path, png, { contentType: 'image/png', upsert: true });
      if (up.error) throw up.error;

      const { data: { publicUrl } } = db.storage.from(BUCKET).getPublicUrl(path);
      // Cache-bust: the path is stable across re-runs, so a title edit would
      // otherwise keep serving the old card from the CDN and every scraper cache.
      const imageUrl = `${publicUrl}?v=${Date.now()}`;
      const upd = await db.from('blogs').update({ image: imageUrl }).eq('slug', p.slug);
      if (upd.error) throw upd.error;

      console.log('ok  ', p.slug, '→', imageUrl);
      ok += 1;
    } catch (err) {
      console.error('FAIL', p.slug, '-', err.message);
      process.exitCode = 1;
    }
  }

  await browser.close();
  console.log(`\n${dry ? 'rendered' : 'generated + uploaded'} ${ok}/${posts.length} cards${dry ? ` → ${outDir}` : ''}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
