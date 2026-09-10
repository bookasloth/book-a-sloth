// server/scripts/scoreBlogDraft.mjs
// Score a draft blog post (blogPosts.js shape) with the live v2 scorer, no crawl.
// Pure analyzer + row builder here; scorer wiring added in the next task.
import assert from 'node:assert/strict';

export const LINK_RE = /\[([^\]]+)\]\(([^)]+)\)/g;

export function analyzeBody(body = []) {
  const headings = [];
  const textParts = [];
  const internal = new Set();
  const external = new Set();
  const images = [];

  const harvestLinks = (s) => {
    for (const m of String(s || '').matchAll(LINK_RE)) {
      const href = m[2].trim();
      if (href.startsWith('/')) internal.add(href);
      else if (/^https?:/i.test(href)) external.add(href);
    }
  };
  const pushText = (s) => { if (s) { textParts.push(String(s)); harvestLinks(s); } };

  for (const block of body) {
    if (!block || typeof block !== 'object') continue;
    if ('h2' in block) { headings.push({ tag: 'h2', text: String(block.h2) }); pushText(block.h2); }
    else if ('p' in block) pushText(block.p);
    else if ('ul' in block) (block.ul || []).forEach(pushText);
    else if ('ol' in block) (block.ol || []).forEach(pushText);
    else if ('steps' in block) (block.steps || []).forEach(pushText);
    else if ('quote' in block) { pushText(block.quote); pushText(block.cite); }
    else if ('info' in block) { pushText(block.info?.title); pushText(block.info?.text); }
    else if ('table' in block) {
      (block.table?.head || []).forEach(pushText);
      (block.table?.rows || []).forEach((r) => (r || []).forEach(pushText));
    } else if ('faq' in block) {
      (block.faq || []).forEach((f) => { pushText(f?.q); pushText(f?.a); });
    }
  }
  const bodyText = textParts.join('\n');
  const wordCount = bodyText.split(/\s+/).filter(Boolean).length;
  return {
    bodyText,
    headings,
    links: { internal: [...internal], external: [...external] },
    images,
    wordCount,
  };
}

export function buildPageRow(post, { siteUrl = 'https://bookasloth.com', jsonLdGraph = [] } = {}) {
  const a = analyzeBody(post.body || []);
  const images = post.image ? [{ src: post.image, alt: post.imageAlt || '' }] : [];
  return {
    url: `${siteUrl}/blog/${post.slug}`,
    page_type: 'blog',
    http_status: 200,
    indexable: true,
    robots: 'index,follow',
    canonical: `${siteUrl}/blog/${post.slug}`,
    title: post.title || '',
    meta_description: post.excerpt || '',
    h1: [post.title || ''],
    word_count: a.wordCount,
    raw_signals: {
      headings: a.headings,
      links: a.links,
      images,
      bodyText: a.bodyText,
      jsonLd: jsonLdGraph,
    },
  };
}

function selfcheck() {
  const body = [
    { h2: 'How booking works' },
    { p: 'Guests book via [our pricing](/pricing) and read [Razorpay docs](https://razorpay.com/docs).' },
    { ul: ['Fast [setup](/blog/setup)', 'OTP login'] },
    { faq: [{ q: 'Is it free?', a: 'Starter is free.' }] },
  ];
  const a = analyzeBody(body);
  assert.equal(a.headings.length, 1, 'one h2 heading');
  assert.deepEqual(a.links.internal.sort(), ['/blog/setup', '/pricing'], 'internal links');
  assert.deepEqual(a.links.external, ['https://razorpay.com/docs'], 'external link');
  assert.ok(a.wordCount > 5, 'word count counted');
  assert.ok(a.bodyText.includes('Is it free?'), 'faq text included in body');

  const row = buildPageRow({ slug: 's', title: 'T', excerpt: 'E', body }, { siteUrl: 'https://bookasloth.com', jsonLdGraph: [{ '@type': 'BlogPosting' }] });
  assert.equal(row.page_type, 'blog');
  assert.equal(row.http_status, 200);
  assert.equal(row.canonical, 'https://bookasloth.com/blog/s');
  assert.deepEqual(row.h1, ['T']);
  assert.equal(row.raw_signals.jsonLd[0]['@type'], 'BlogPosting');
  assert.equal(row.raw_signals.headings.length, 1);
  console.log('selfcheck (analyze+row): PASS');
}

if (process.argv.includes('--selfcheck')) selfcheck();
