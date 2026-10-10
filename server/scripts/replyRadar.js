/**
 * replyRadar.js — find fresh Reddit + Quora posts where Book A Sloth is a
 * genuinely useful answer, and draft a reply for each. It NEVER posts.
 *
 * Flow: Reddit public search JSON (per subreddit, last N days) + Quora
 * questions via Claude's web_search tool → Claude triages each post
 * (lead | brand | skip) and drafts a reply → a dated markdown file you read,
 * edit and post by hand.
 *
 * Why draft-only: automated promotional comments break Reddit's spam /
 * content-manipulation rules and Quora's ToS (no API, no automation) — bot
 * accounts get shadowbanned and the domain can get sitewide-blocked. Same call
 * as the scrapped X autopost: posting stays MANUAL.
 *
 * Output (not committed — it's scraped third-party content):
 *   ~/OneDrive/Desktop/reply-radar/YYYY-MM-DD.md   the queue
 *   ~/OneDrive/Desktop/reply-radar/seen.json       ids already drafted (skipped next run)
 *
 * Usage (from server/):
 *   node scripts/replyRadar.js                 # last 7 days, up to 40 drafts
 *   node scripts/replyRadar.js --days 3 --limit 20
 *   node scripts/replyRadar.js --no-quora      # Reddit only
 *   node scripts/replyRadar.js --dry           # fetch + list posts, no Claude calls
 *   node scripts/replyRadar.js --out ./radar
 *
 * Needs ANTHROPIC_API_KEY in server/.env. REPLY_RADAR_MODEL overrides the model.
 *
 * ponytail: unauthenticated Reddit JSON (~10 req/min, one request per subreddit,
 * 7s apart). Reddit OAuth needs a commercial-use approval — add it only if the
 * public endpoint starts 403-ing.
 */
const fs = require('fs');
const os = require('os');
const path = require('path');

// ── Tune these ──────────────────────────────────────────────────────────────
// Leads: people asking how to take paid bookings/consultations. Brand: broader
// threads where a helpful answer earns a mention (and AI-search citations).
const SUBREDDITS = [
  'IndianEntrepreneur', 'StartUpIndia', 'india', 'indiasocial', 'freelance_forhire',
  'freelance', 'consulting', 'therapists', 'Entrepreneur', 'smallbusiness',
  'SaaS', 'coaching', 'IndiaInvestments', 'personalfinanceindia',
];
const QUERIES = [
  'booking link', 'calendly alternative', 'paid consultation', 'take appointments',
  'booking app', 'collect payment for sessions', 'scheduling tool', 'topmate',
  'charge for calls', 'online consultation',
];
const QUORA_TOPICS = [
  'best appointment booking app in India',
  'how to charge for online consultations in India',
  'Calendly alternative with UPI / Razorpay payments',
  'how coaches and therapists in India take paid bookings',
  'Topmate alternative',
];
// Skip threads already buried — a reply there won't be read.
const MAX_COMMENTS = 60;
const REDDIT_DELAY_MS = 7000;
const MODEL = process.env.REPLY_RADAR_MODEL || 'claude-opus-5-5';

// Product facts the drafter may use. Keep in sync with Pricing.jsx — a wrong
// price in a public comment is worse than no comment.
const PRODUCT_FACTS = `Book A Sloth (bookasloth.com) — booking page + payments for Indian creators,
consultants, coaches, therapists, tutors, doctors, salons.
- Hosts publish services (1:1 calls, sessions, packages, digital products) on a page like bookasloth.com/<username>.
- Guests book with WhatsApp OTP (no account/password), pay via Razorpay (UPI, cards, netbanking).
- Google Calendar sync, Google Meet links, WhatsApp + email reminders, payouts to the host's bank.
- Plans (prices include GST): Sloth = free forever, 5% commission only when you get paid.
  Sloth Active = ₹3,599/year (~₹300/month), 0% commission, adds automation + client CRM.
  ~2.4% payment-gateway fee applies on both (Razorpay's charge, not ours).
- Breakeven: above ~₹6,000/month in bookings, Sloth Active costs less than the 5%.`;

const SYSTEM = `You help the founder of Book A Sloth find online threads worth replying to,
and draft the reply they will post by hand from their own account.

${PRODUCT_FACTS}

For each post decide a route:
- "lead": the poster (or readers) need a way to take bookings/payments for their time — Book A Sloth directly solves it.
- "brand": a broader question (pricing your time, freelancing in India, tools for consultants) where a genuinely useful answer can mention Book A Sloth as one option among others.
- "skip": off-topic, a rant, a job post, already solved, hostile to self-promotion, or a mention would feel forced.

score: 1–10, how worth the founder's time this reply is (relevance × reach × buying intent).

Reply rules (only when route is not "skip"; empty string for skip):
- Answer the actual question first, with specific, practical help. The answer must be useful even with the product mention removed.
- Mention Book A Sloth at most once, near the end, with plain disclosure ("I'm building Book A Sloth, so I'm biased"). For "brand", name 1–2 alternatives too.
- No link unless route is "lead" — then at most one bare bookasloth.com.
- Reddit: casual, first person, 60–150 words, no headings, no emoji, no marketing words ("seamless", "game-changer", "unlock").
- Quora: 120–250 words, can use a short list.
- Never invent facts about the poster or the product. Only use the product facts above.`;

const OUTPUT_SCHEMA = {
  type: 'object',
  properties: {
    route: { type: 'string', enum: ['lead', 'brand', 'skip'] },
    score: { type: 'integer' },
    why: { type: 'string', description: 'one line: why this route/score' },
    reply: { type: 'string' },
  },
  required: ['route', 'score', 'why', 'reply'],
  additionalProperties: false,
};

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function parseArgs(argv) {
  const get = (flag, dflt) => {
    const i = argv.indexOf(flag);
    return i >= 0 && argv[i + 1] ? argv[i + 1] : dflt;
  };
  return {
    days: Number(get('--days', 7)),
    limit: Number(get('--limit', 40)),
    out: get('--out', path.join(os.homedir(), 'OneDrive', 'Desktop', 'reply-radar')),
    quora: !argv.includes('--no-quora'),
    dry: argv.includes('--dry'),
  };
}

// Reddit search ORs quoted phrases: ("a" OR "b").
const redditQuery = (queries) => `(${queries.map((q) => `"${q}"`).join(' OR ')})`;

// Reddit listing child → post, or null when it's not worth a reply.
function toRedditPost(child, sinceSec) {
  const d = child && child.data;
  if (!d || d.stickied || d.locked || d.archived || d.over_18) return null;
  if (d.created_utc < sinceSec || d.num_comments > MAX_COMMENTS) return null;
  return {
    id: `reddit:${d.id}`,
    platform: 'reddit',
    where: `r/${d.subreddit}`,
    title: d.title,
    body: d.selftext || '',
    url: `https://www.reddit.com${d.permalink}`,
    comments: d.num_comments,
    created: new Date(d.created_utc * 1000).toISOString().slice(0, 10),
  };
}

async function fetchReddit({ days }) {
  const sinceSec = Date.now() / 1000 - days * 86400;
  const t = days <= 1 ? 'day' : days <= 7 ? 'week' : 'month';
  const q = encodeURIComponent(redditQuery(QUERIES));
  const posts = [];
  for (const [i, sub] of SUBREDDITS.entries()) {
    if (i) await sleep(REDDIT_DELAY_MS);
    const url = `https://www.reddit.com/r/${sub}/search.json?q=${q}&restrict_sr=1&sort=new&t=${t}&limit=25`;
    try {
      const res = await fetch(url, { headers: { 'User-Agent': 'bookasloth-reply-radar/1.0 (manual review tool)' } });
      if (!res.ok) { console.warn(`  r/${sub}: HTTP ${res.status}`); continue; }
      const json = await res.json();
      const found = (json.data?.children || []).map((c) => toRedditPost(c, sinceSec)).filter(Boolean);
      console.log(`  r/${sub}: ${found.length}`);
      posts.push(...found);
    } catch (e) {
      console.warn(`  r/${sub}: ${e.message}`);
    }
  }
  return posts;
}

// Quora question URL → canonical question URL (drop /answer/..., query, hash),
// or null for profiles/topics/spaces.
function quoraQuestionUrl(raw) {
  let u;
  try { u = new URL(raw); } catch { return null; }
  if (!/(^|\.)quora\.com$/.test(u.hostname)) return null;
  const slug = u.pathname.split('/').filter(Boolean)[0];
  if (!slug || ['profile', 'topic', 'q', 'search', 'answer', 'spaces'].includes(slug)) return null;
  return `https://www.quora.com/${slug}`;
}

// No Quora API — let Claude's web_search find questions, then read the result
// URLs/titles straight off the tool-result blocks (no JSON parsing of prose).
async function fetchQuora(client) {
  const messages = [{
    role: 'user',
    content: `Find recent Quora questions (ideally from the last few months) on each of these topics. Run one search per topic.\n- ${QUORA_TOPICS.join('\n- ')}`,
  }];
  const byUrl = new Map();
  for (let turn = 0; turn < 4; turn++) {
    const res = await client.messages.create({
      model: MODEL,
      max_tokens: 4000,
      tools: [{ type: 'web_search_20260209', name: 'web_search', max_uses: QUORA_TOPICS.length, allowed_domains: ['quora.com'] }],
      messages,
    });
    for (const block of res.content) {
      // Error results come back as an object, successes as a list.
      if (block.type !== 'web_search_tool_result' || !Array.isArray(block.content)) continue;
      for (const r of block.content) {
        const url = quoraQuestionUrl(r.url);
        if (url && !byUrl.has(url)) {
          byUrl.set(url, {
            id: `quora:${url}`,
            platform: 'quora',
            where: 'Quora',
            title: (r.title || '').replace(/\s*-\s*Quora\s*$/, ''),
            body: '',
            url,
            comments: null,
            created: r.page_age || '',
          });
        }
      }
    }
    if (res.stop_reason !== 'pause_turn') break;
    messages.push({ role: 'assistant', content: res.content }); // resume a paused server-tool turn
  }
  console.log(`  quora: ${byUrl.size}`);
  return [...byUrl.values()];
}

async function triage(client, post) {
  // ponytail: cap long self-posts; the title + first 4k chars carry the ask.
  const body = post.body.length > 4000 ? `${post.body.slice(0, 4000)}\n[…truncated]` : post.body;
  const res = await client.beta.messages.create({
    model: MODEL,
    max_tokens: 4000,
    betas: ['server-side-fallback-2026-07-01'],
    fallbacks: 'default',
    system: SYSTEM,
    output_config: { format: { type: 'json_schema', schema: OUTPUT_SCHEMA } },
    messages: [{
      role: 'user',
      content: `Platform: ${post.platform} (${post.where})\nTitle: ${post.title}\n\n${body || '(no body — title only)'}`,
    }],
  });
  if (res.stop_reason === 'refusal' || res.stop_reason === 'max_tokens') {
    return { route: 'skip', score: 0, why: `model stop: ${res.stop_reason}`, reply: '' };
  }
  const text = res.content.find((b) => b.type === 'text');
  return JSON.parse(text.text);
}

function toMarkdown(rows, date) {
  const section = (route, heading) => {
    const items = rows.filter((r) => r.route === route).sort((a, b) => b.score - a.score);
    if (!items.length) return '';
    return `## ${heading} (${items.length})\n\n${items.map((r) => [
      `### [${r.score}/10] ${r.title}`,
      `${r.where} · ${r.created}${r.comments != null ? ` · ${r.comments} comments` : ''} · ${r.url}`,
      `_Why:_ ${r.why}`,
      '',
      '```text',
      r.reply,
      '```',
      '- [ ] posted',
    ].join('\n')).join('\n\n')}\n`;
  };
  const skipped = rows.filter((r) => r.route === 'skip').length;
  return [
    `# Reply Radar — ${date}`,
    '',
    'Drafts only. Read the thread, edit the reply in your own voice, then post it yourself.',
    '',
    section('lead', 'Leads'),
    section('brand', 'Brand / helpful answers'),
    `_${skipped} posts skipped as off-topic or not worth a reply._`,
    '',
  ].join('\n');
}

async function main() {
  require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
  const args = parseArgs(process.argv.slice(2));
  fs.mkdirSync(args.out, { recursive: true });
  const seenFile = path.join(args.out, 'seen.json');
  const seen = new Set(fs.existsSync(seenFile) ? JSON.parse(fs.readFileSync(seenFile, 'utf8')) : []);

  const client = args.dry && !args.quora ? null : require('../services/ai/anthropicClient').getClient();
  if (!client && !args.dry) throw new Error('ANTHROPIC_API_KEY missing in server/.env');

  console.log('Reddit…');
  const posts = await fetchReddit(args);
  if (args.quora && client) {
    console.log('Quora…');
    posts.push(...await fetchQuora(client));
  }
  const fresh = [...new Map(posts.map((p) => [p.id, p])).values()].filter((p) => !seen.has(p.id)).slice(0, args.limit);
  console.log(`${fresh.length} new posts to triage (${posts.length} found, ${seen.size} seen before).`);

  if (args.dry) {
    for (const p of fresh) console.log(`- ${p.where} · ${p.title}\n  ${p.url}`);
    return;
  }

  const rows = [];
  for (const [i, post] of fresh.entries()) {
    try {
      rows.push({ ...post, ...await triage(client, post) });
      seen.add(post.id);
      process.stdout.write(`\r  drafted ${i + 1}/${fresh.length}`);
    } catch (e) {
      console.warn(`\n  ${post.url}: ${e.message}`); // not marked seen → retried next run
    }
  }
  const date = new Date().toISOString().slice(0, 10);
  const file = path.join(args.out, `${date}.md`);
  fs.writeFileSync(file, toMarkdown(rows, date));
  fs.writeFileSync(seenFile, JSON.stringify([...seen]));
  const n = (r) => rows.filter((x) => x.route === r).length;
  console.log(`\nWrote ${file} — ${n('lead')} leads, ${n('brand')} brand, ${n('skip')} skipped.`);
}

if (require.main === module) {
  main().catch((e) => { console.error(e); process.exit(1); });
}

module.exports = { redditQuery, toRedditPost, quoraQuestionUrl, toMarkdown };
