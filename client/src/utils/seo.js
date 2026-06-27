/**
 * seo.js — pure SEO resolution for public pages.
 *
 * Single source of truth for how a service/profile turns into the page's
 * title, meta description, OG tags, canonical URL, robots directive, and
 * JSON-LD. Admin-managed overrides (seo_*, og_*, is_indexable) win; otherwise
 * we fall back to the vendor-controlled title/description/image.
 *
 * Canonical is ALWAYS derived from the current public URL (siteUrl + current
 * username [+ slug]) — never stored — so an alias/301 can't split link equity.
 */

// Production base for canonical/OG. Pages pass import.meta.env.VITE_PUBLIC_SITE_URL
// (Vercel) through; falls back to the apex so previews still emit sane tags.
export const SITE_URL = 'https://bookasloth.com';

const trimSlash = (s) => String(s || '').replace(/\/+$/, '');
const truncate = (s, n = 160) => {
  const str = String(s || '').trim();
  return str.length <= n ? str : str.slice(0, n - 1).trimEnd() + '…';
};

const robotsFor = (indexable) => (indexable === false ? 'noindex,nofollow' : 'index,follow');

const brandCard = (siteUrl) => `${trimSlash(siteUrl)}/og-image.png`;

// ── Service ──────────────────────────────────────────────────────────────────

export const resolveServiceSeo = ({ service = {}, vendor = {}, siteUrl = SITE_URL } = {}) => {
  const site = trimSlash(siteUrl);
  const username = vendor.username;
  const baseTitle = service.title || 'Service';

  // Admin seo_title is used verbatim (full control of the tag); otherwise compose.
  const title = service.seo_title
    || `${baseTitle}${vendor.name ? ` with ${vendor.name}` : ''} | Book A Sloth`;
  const description = service.seo_description
    || truncate(service.short_description || service.description || `Book ${baseTitle} on Book A Sloth.`);

  const canonical = username && service.slug
    ? `${site}/${username}/${service.slug}`
    : site;

  return {
    title,
    description,
    ogTitle: service.og_title || service.seo_title || baseTitle,
    ogDescription: service.og_description || description,
    image: service.seo_image || service.thumbnail_url || brandCard(site),
    canonical,
    indexable: service.is_indexable !== false,
    robots: robotsFor(service.is_indexable),
  };
};

export const serviceJsonLd = ({ service = {}, vendor = {}, siteUrl = SITE_URL, avgRating, reviewCount } = {}) => {
  const site = trimSlash(siteUrl);
  const url = vendor.username && service.slug ? `${site}/${vendor.username}/${service.slug}` : site;
  const ld = {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: service.title || 'Service',
    description: service.seo_description || service.short_description || service.description || undefined,
    url,
    provider: vendor.name
      ? { '@type': 'Person', name: vendor.name, url: vendor.username ? `${site}/${vendor.username}` : undefined }
      : undefined,
    offers: {
      '@type': 'Offer',
      price: String(service.price ?? 0),
      priceCurrency: service.currency || 'INR',
      availability: 'https://schema.org/InStock',
      url,
    },
  };
  if (service.seo_image || service.thumbnail_url) ld.image = service.seo_image || service.thumbnail_url;
  if (reviewCount > 0 && avgRating > 0) {
    ld.aggregateRating = { '@type': 'AggregateRating', ratingValue: avgRating, reviewCount };
  }
  return ld;
};

// ── Profile (host) ───────────────────────────────────────────────────────────

export const resolveProfileSeo = ({ host = {}, siteUrl = SITE_URL } = {}) => {
  const site = trimSlash(siteUrl);
  const name = host.name || 'Host';

  const title = host.seo_title
    || `${name}${host.profession ? ` — ${host.profession}` : ''} | Book A Sloth`;
  const description = host.seo_description
    || truncate(host.bio || `Book sessions with ${name} on Book A Sloth.`);

  return {
    title,
    description,
    ogTitle: host.og_title || host.seo_title || name,
    ogDescription: host.og_description || description,
    image: host.seo_image || host.profile_image || brandCard(site),
    canonical: host.username ? `${site}/${host.username}` : site,
    indexable: host.is_indexable !== false,
    robots: robotsFor(host.is_indexable),
  };
};

export const profileJsonLd = ({ host = {}, siteUrl = SITE_URL, services = [] } = {}) => {
  const site = trimSlash(siteUrl);
  const url = host.username ? `${site}/${host.username}` : site;
  const person = {
    '@type': 'Person',
    name: host.name || 'Host',
    url,
    jobTitle: host.profession || undefined,
    description: host.seo_description || host.bio || undefined,
    image: host.seo_image || host.profile_image || undefined,
  };
  if (Array.isArray(services) && services.length) {
    person.makesOffer = services
      .filter((s) => s && s.title)
      .map((s) => ({
        '@type': 'Offer',
        itemOffered: { '@type': 'Service', name: s.title, url: s.slug ? `${url}/${s.slug}` : undefined },
      }));
  }
  return {
    '@context': 'https://schema.org',
    '@type': 'ProfilePage',
    url,
    mainEntity: person,
  };
};
