/**
 * sitemapService.js — data layer for the dynamic sitemap.
 *
 * Pure mappers (DB rows -> sitemap entries) are exported for unit testing;
 * the DB fetchers query Supabase for the CURRENT set of indexable hosts and
 * services. Visibility rules (single source of truth):
 *   - Host listed when: role='host' AND is_verified AND is_indexable AND NOT
 *     is_banned AND has a username. (Admin verification flips it on; is_indexable
 *     defaults TRUE so verifying is enough — matches product decision.)
 *   - Service listed when: is_active AND is_indexable AND its host is listable.
 * A noindexed host therefore drops its service pages too (the canonical lives
 * under the host path), which is the correct cascade.
 *
 * Pre-migration safety: if the seo columns don't exist yet, the is_indexable
 * filters are dropped and everything active/verified is treated as indexable.
 */
const { supabaseAdmin } = require('../config/supabase');

// ── Pure helpers ─────────────────────────────────────────────────────────────

const trimSlash = (s) => String(s || '').replace(/\/+$/, '');

const hostUrl = (siteUrl, username) => `${trimSlash(siteUrl)}/${username}`;
const serviceUrl = (siteUrl, username, slug) => `${trimSlash(siteUrl)}/${username}/${slug}`;

// ISO timestamp -> W3C date (YYYY-MM-DD). Undefined for missing/invalid input.
const toLastmod = (ts) => {
  if (!ts) return undefined;
  const d = new Date(ts);
  if (Number.isNaN(d.getTime())) return undefined;
  return d.toISOString().slice(0, 10);
};

// Public, crawlable static routes. Host/service URLs come from the DB below.
const STATIC_ROUTES = [
  { path: '/',                         changefreq: 'daily',   priority: '1.0' },
  { path: '/explore',                  changefreq: 'daily',   priority: '0.9' },
  { path: '/be-a-sloth',               changefreq: 'weekly',  priority: '0.8' },
  { path: '/pricing',                  changefreq: 'monthly', priority: '0.7' },
  { path: '/about',                    changefreq: 'monthly', priority: '0.5' },
  { path: '/careers',                  changefreq: 'weekly',  priority: '0.5' },
  { path: '/blog',                     changefreq: 'daily',   priority: '0.6' },
  { path: '/changelog',                changefreq: 'weekly',  priority: '0.4' },
  { path: '/contact',                  changefreq: 'monthly', priority: '0.4' },
  { path: '/support',                  changefreq: 'monthly', priority: '0.4' },
  { path: '/help',                     changefreq: 'monthly', priority: '0.4' },
  { path: '/privacy',                  changefreq: 'yearly',  priority: '0.3' },
  { path: '/terms',                    changefreq: 'yearly',  priority: '0.3' },
  { path: '/refund',                   changefreq: 'yearly',  priority: '0.3' },
  { path: '/lp/topmate-vs-bookasloth', changefreq: 'monthly', priority: '0.7' },
  { path: '/lp/calendly-alternative',  changefreq: 'monthly', priority: '0.7' },
];

const staticEntries = (siteUrl) =>
  STATIC_ROUTES.map((r) => ({ loc: `${trimSlash(siteUrl)}${r.path}`, changefreq: r.changefreq, priority: r.priority }));

const hostEntries = (rows, siteUrl) =>
  (rows || [])
    .filter((r) => r && r.username)
    .map((r) => ({ loc: hostUrl(siteUrl, r.username), lastmod: toLastmod(r.updated_at), changefreq: 'weekly', priority: '0.7' }));

const serviceEntries = (rows, siteUrl) =>
  (rows || [])
    .filter((r) => r && r.slug && r.profiles && r.profiles.username)
    .map((r) => ({ loc: serviceUrl(siteUrl, r.profiles.username, r.slug), lastmod: toLastmod(r.updated_at), changefreq: 'weekly', priority: '0.8' }));

// Professions that own >=1 active bookable-service category -> /services/:slug pages.
const professionEntries = (rows, siteUrl) => {
  const site = trimSlash(siteUrl);
  return [
    { loc: `${site}/services`, changefreq: 'weekly', priority: '0.6' },
    ...(rows || []).map((r) => ({
      loc: `${site}/services/${r.slug}`,
      lastmod: toLastmod(r.updated_at),
      changefreq: 'weekly',
      priority: '0.6',
    })),
  ];
};

// ── DB fetchers ──────────────────────────────────────────────────────────────

const schemaMissing = (err) => err && /Could not find the|column.*does not exist/i.test(err.message || '');

// All listable host rows (username + updated_at), newest first.
const fetchHosts = async () => {
  let r = await supabaseAdmin
    .from('profiles')
    .select('username, updated_at')
    .eq('role', 'host')
    .eq('is_verified', true)
    .eq('is_banned', false)
    .eq('is_indexable', true)
    .not('username', 'is', null)
    .order('updated_at', { ascending: false });

  if (schemaMissing(r.error)) {
    // Pre-migration: no is_indexable column — every verified host is indexable.
    r = await supabaseAdmin
      .from('profiles')
      .select('username, updated_at')
      .eq('role', 'host')
      .eq('is_verified', true)
      .eq('is_banned', false)
      .not('username', 'is', null)
      .order('updated_at', { ascending: false });
  }
  if (r.error) throw r.error;
  return r.data || [];
};

// All listable service rows joined to their host (for the username path segment),
// then filtered in JS so a noindexed/unverified host removes its services too.
const fetchServices = async () => {
  const select = 'slug, updated_at, profiles!services_host_id_fkey(username, role, is_verified, is_banned, is_indexable)';
  let r = await supabaseAdmin
    .from('services')
    .select(select)
    .eq('is_active', true)
    .eq('is_indexable', true)
    .order('updated_at', { ascending: false });

  if (schemaMissing(r.error)) {
    r = await supabaseAdmin
      .from('services')
      .select('slug, updated_at, profiles!services_host_id_fkey(username, role, is_verified, is_banned)')
      .eq('is_active', true)
      .order('updated_at', { ascending: false });
  }
  if (r.error) throw r.error;

  return (r.data || []).filter((s) => {
    const p = s.profiles;
    if (!p) return false;
    if (p.role !== 'host' || !p.is_verified || p.is_banned) return false;
    if (p.is_indexable === false) return false; // host noindex cascades; missing col => true
    return true;
  });
};

// Professions that own >=1 active bookable-service category (newest updated_at wins).
// Intersected with ACTIVE professions (categories.status): the directory endpoint
// 404s inactive/unknown professions, so emitting them here would sitemap 404 URLs.
const fetchProfessions = async () => {
  const [sc, prof] = await Promise.all([
    supabaseAdmin
      .from('service_categories')
      .select('primary_category, updated_at')
      .eq('is_active', true),
    supabaseAdmin
      .from('categories')
      .select('slug')
      .eq('status', 'active'),
  ]);
  if (sc.error) throw sc.error;
  if (prof.error) throw prof.error;
  const activeProfessions = new Set((prof.data || []).map((r) => r.slug));
  const newest = new Map();
  for (const r of sc.data || []) {
    if (!activeProfessions.has(r.primary_category)) continue;
    const prev = newest.get(r.primary_category);
    if (!prev || (r.updated_at && r.updated_at > prev)) newest.set(r.primary_category, r.updated_at);
  }
  return [...newest.entries()].map(([slug, updated_at]) => ({ slug, updated_at }));
};

module.exports = {
  // pure
  trimSlash, hostUrl, serviceUrl, toLastmod, STATIC_ROUTES, staticEntries, hostEntries, serviceEntries, professionEntries,
  // db
  fetchHosts, fetchServices, fetchProfessions,
};
