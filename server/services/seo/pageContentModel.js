// server/services/seo/pageContentModel.js
// DB-derived content model for host & service pages (spec: content source).
//
// WHY: Cloudflare 403-blocks the crawler UA, so host/service pages can't be fetched
// as HTML — they were audited meta-only (bodyCrawled:false), leaving our most
// important pages with no content / internal-linking / GEO analysis. We own the
// source data, so we reconstruct the page's *content signals* from the same DB
// payload the public page and prerender route render from. This is more accurate for
// our own content than scraping a JS-rendered SPA; the trade-off (documented in
// docs/seo-scoring-framework.md) is that it won't catch a client-render regression.
//
// Output shape mirrors seoParse.parse() so rules + scoring treat these pages like any
// body page: { headings, links:{internal,external}, images, wordCount, bodyText,
// entity:{type,name,author,sameAs,dates}, evidence:{reviewCount,avgRating} }.

const SITE_URL = (process.env.SITE_URL || 'https://bookasloth.com').replace(/\/$/, '');

const clean = (s) => (s == null ? null : String(s).replace(/\s+/g, ' ').trim() || null);
const wc = (parts) => {
  const t = parts.filter(Boolean).join(' ').replace(/\s+/g, ' ').trim();
  return { bodyText: t, wordCount: t ? t.split(' ').length : 0 };
};

// Common social/profile fields that back schema.org sameAs (entity clarity signal).
// ponytail: reads whatever social columns exist on the row; add more keys here if the
// profiles schema grows, no other change needed.
function sameAsFrom(row = {}) {
  const keys = ['website', 'website_url', 'instagram', 'instagram_url', 'linkedin', 'twitter', 'x_url', 'youtube', 'facebook'];
  return keys.map((k) => clean(row[k])).filter(Boolean);
}

function hostContent(payload) {
  const { host = {}, services = [] } = payload || {};
  const name = clean(host.name) || 'Host';
  const headings = [{ tag: 'h1', text: name }];
  if (host.profession) headings.push({ tag: 'h2', text: clean(host.profession) });
  const internal = [`${SITE_URL}/${host.username}`];
  const images = [];
  if (host.profile_image) images.push({ src: host.profile_image, alt: name });

  for (const s of services) {
    if (!s || !s.title) continue;
    headings.push({ tag: 'h2', text: clean(s.title) });
    if (s.slug) internal.push(`${SITE_URL}/${host.username}/${s.slug}`);
    if (s.thumbnail_url) images.push({ src: s.thumbnail_url, alt: clean(s.title) || '' });
  }

  const reviews = payload?.reviews || [];
  const { bodyText, wordCount } = wc([
    host.bio, host.profession,
    ...services.flatMap((s) => [s?.title, s?.short_description, s?.description]),
    ...reviews.map((r) => r?.comment || r?.text),
  ]);

  return {
    headings, images, wordCount, bodyText,
    links: { internal: [...new Set(internal)], external: sameAsFrom(host) },
    entity: {
      type: 'Person', name, author: name, sameAs: sameAsFrom(host),
      dates: { published: null, updated: host.updated_at || null },
    },
    evidence: { reviewCount: reviews.length, avgRating: payload?.avgRating || 0 },
  };
}

function serviceContent(payload) {
  const { service = {}, vendor = {}, reviews = [], avgRating = 0 } = payload || {};
  const title = clean(service.title) || 'Service';
  const providerName = clean(vendor.name) || null;
  const headings = [{ tag: 'h1', text: title }];
  if (providerName) headings.push({ tag: 'h2', text: `With ${providerName}` });
  const internal = [];
  if (vendor.username) internal.push(`${SITE_URL}/${vendor.username}`);
  const images = [];
  const thumb = service.seo_image || service.thumbnail_url;
  if (thumb) images.push({ src: thumb, alt: title });

  const { bodyText, wordCount } = wc([
    service.short_description, service.description, providerName,
    ...reviews.map((r) => r?.comment || r?.text),
  ]);

  return {
    headings, images, wordCount, bodyText,
    links: { internal: [...new Set(internal)], external: [] },
    entity: {
      type: 'Service', name: title, author: providerName,
      sameAs: [], dates: { published: null, updated: service.updated_at || null },
    },
    evidence: { reviewCount: reviews.length, avgRating },
  };
}

// payload is the SAME object the prerender resolver returns (outcome.payload). Fail
// soft: an unknown type or empty payload returns null so the crawler falls back to
// meta-only signals rather than throwing mid-crawl.
function build(pageType, payload) {
  try {
    if (!payload) return null;
    if (pageType === 'host') return hostContent(payload);
    if (pageType === 'service') return serviceContent(payload);
    return null;
  } catch {
    return null;
  }
}

module.exports = { build };
