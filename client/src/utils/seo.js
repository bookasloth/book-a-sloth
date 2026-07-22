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

// ── Shared brand / page builders ─────────────────────────────────────────────

// Official brand profiles — used for Organization.sameAs (entity disambiguation
// for SEO/GEO). Source of truth mirrors client/src/components/about/TeamSocials.jsx.
export const ORG_SAME_AS = [
  'https://www.linkedin.com/company/book-a-sloth/',
  'https://www.instagram.com/bookasloth',
  'https://www.facebook.com/bookasloth',
  'https://x.com/bookasloth',
];

// Canonical Organization node. Pages that need it inline it into their JSON-LD
// so the brand entity is consistent everywhere (never hand-roll a second one).
export const organizationJsonLd = ({ siteUrl = SITE_URL } = {}) => {
  const site = trimSlash(siteUrl);
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Book A Sloth',
    url: `${site}/`,
    logo: `${site}/logo-512.png`,
    description: 'Online booking and appointment scheduling platform for coaches, consultants, therapists, and small businesses.',
    sameAs: ORG_SAME_AS,
  };
};

// BreadcrumbList from an ordered [{ name, path }] trail. Paths are site-relative
// ('/x') or absolute; the crawler shows the trail and can render breadcrumb rich
// results. Home is the caller's responsibility (pass it first).
export const breadcrumbJsonLd = ({ items = [], siteUrl = SITE_URL } = {}) => {
  const site = trimSlash(siteUrl);
  const abs = (p) => (/^https?:/i.test(p) ? p : `${site}${p.startsWith('/') ? '' : '/'}${p}`);
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: (items || [])
      .filter((it) => it && it.name && it.path)
      .map((it, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        name: it.name,
        item: abs(it.path),
      })),
  };
};

// CollectionPage for a public list/index page. `items` (optional [{ url, name }])
// becomes an embedded ItemList so the crawler sees the page's members; omit it
// and no mainEntity is emitted.
export const collectionPageJsonLd = ({ name, description, url, siteUrl = SITE_URL, items = [] } = {}) => {
  const site = trimSlash(siteUrl);
  const abs = (p) => (/^https?:/i.test(p) ? p : `${site}${String(p || '').startsWith('/') ? '' : '/'}${p || ''}`);
  const ld = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name,
    description,
    url: url ? abs(url) : `${site}/`,
  };
  if (Array.isArray(items) && items.length) {
    ld.mainEntity = {
      '@type': 'ItemList',
      itemListElement: items
        .filter((it) => it && it.url && it.name)
        .map((it, i) => ({ '@type': 'ListItem', position: i + 1, url: abs(it.url), name: it.name })),
    };
  }
  return ld;
};

// FAQPage from [{ q, a }]. `a` may contain plain text; strip to a safe string.
export const faqJsonLd = ({ faqs = [] } = {}) => ({
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: (faqs || [])
    .filter((f) => f && f.q && f.a)
    .map((f) => ({
      '@type': 'Question',
      name: String(f.q),
      acceptedAnswer: { '@type': 'Answer', text: String(f.a) },
    })),
});

// BlogPosting for a single article. Pass the loaded post record.
export const articleJsonLd = ({ post = {}, siteUrl = SITE_URL } = {}) => {
  const site = trimSlash(siteUrl);
  const url = post.slug ? `${site}/blog/${post.slug}` : `${site}/blog`;
  const ld = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.seo_title || post.title || 'Book A Sloth Blog',
    description: post.seo_description || post.excerpt || undefined,
    url,
    mainEntityOfPage: url,
    datePublished: post.published_at || post.created_at || undefined,
    dateModified: post.updated_at || post.published_at || post.created_at || undefined,
    author: { '@type': 'Organization', name: post.author || 'Book A Sloth' },
    publisher: organizationJsonLd({ siteUrl: site }),
  };
  if (post.seo_image || post.cover_image || post.image) {
    ld.image = post.seo_image || post.cover_image || post.image;
  }
  return ld;
};

// ContactPage node with the support contact point.
export const contactPageJsonLd = ({ siteUrl = SITE_URL, email = 'bolt@bookasloth.in' } = {}) => {
  const site = trimSlash(siteUrl);
  return {
    '@context': 'https://schema.org',
    '@type': 'ContactPage',
    url: `${site}/contact`,
    mainEntity: {
      '@type': 'Organization',
      name: 'Book A Sloth',
      url: `${site}/`,
      contactPoint: {
        '@type': 'ContactPoint',
        contactType: 'customer support',
        email,
        availableLanguage: ['en', 'hi'],
      },
    },
  };
};
