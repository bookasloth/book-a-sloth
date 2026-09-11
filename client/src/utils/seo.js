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
// Static per-service OG floor (Phase 1). The final fallback below a generated
// service card / admin seo_image / host thumbnail. See v3.154.
const serviceDefaultCard = (siteUrl) => `${trimSlash(siteUrl)}/service-og-default.png`;

// ── Service ──────────────────────────────────────────────────────────────────

export const resolveServiceSeo = ({ service = {}, vendor = {}, siteUrl = SITE_URL } = {}) => {
  const site = trimSlash(siteUrl);
  const username = vendor.username;
  const baseTitle = service.title || 'Service';

  // Admin seo_title is used verbatim (full control of the tag); otherwise compose
  // progressively so the tag isn't truncated in results (Google cuts ~60 chars):
  // full → drop the " | Book A Sloth" brand suffix → drop " with {host}" → the bare
  // service title. The service title is host-authored (UGC) so we never truncate it
  // — if it alone exceeds 60, it stays as the host wrote it.
  const composeTitle = () => {
    const withName = vendor.name ? `${baseTitle} with ${vendor.name}` : baseTitle;
    const full = `${withName} | Book A Sloth`;
    if (full.length <= 60) return full;
    if (withName.length <= 60) return withName;
    return baseTitle;
  };
  const title = service.seo_title || composeTitle();
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
    // Ordered fallback: generated service card -> admin override -> host
    // thumbnail -> the static /service-og-default.png floor (Phase 1). See v3.154.
    image: service.og_image || service.seo_image || service.thumbnail_url || serviceDefaultCard(site),
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

// Identity links backing schema.org sameAs — mirrors server sameAsFrom()
// (server/services/seo/pageContentModel.js). Reads host.social_links (JSONB),
// keeping only real http(s) identity URLs (drops email/whatsapp + blanks).
const SAMEAS_SOCIALS = ['instagram', 'youtube', 'linkedin', 'facebook', 'twitter', 'website', 'github'];
const sameAsFromSocials = (social = {}) => [...new Set(
  SAMEAS_SOCIALS
    .map((k) => (typeof social[k] === 'string' ? social[k].trim() : ''))
    .filter((v) => /^https?:\/\//i.test(v)),
)];

export const profileJsonLd = ({ host = {}, siteUrl = SITE_URL, services = [], rating = null } = {}) => {
  const site = trimSlash(siteUrl);
  const url = host.username ? `${site}/${host.username}` : site;
  const sameAs = sameAsFromSocials(host.social_links);
  const person = {
    '@type': 'Person',
    name: host.name || 'Host',
    url,
    jobTitle: host.profession || undefined,
    description: host.seo_description || host.bio || undefined,
    image: host.seo_image || host.profile_image || undefined,
    ...(sameAs.length ? { sameAs } : {}),
    // Host's OWN rating only (shown on the profile). Never a platform default —
    // that would be reviews not about this person. Platform rating lives on the
    // homepage SoftwareApplication node.
    ...(rating && rating.count > 0 && rating.avg > 0 ? {
      aggregateRating: { '@type': 'AggregateRating', ratingValue: rating.avg, reviewCount: rating.count },
    } : {}),
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
    ...(host.updated_at ? { dateModified: host.updated_at } : {}),
    mainEntity: person,
  };
};

// ── Blog post ────────────────────────────────────────────────────────────────

const BLOG_SUFFIX = ' | Book A Sloth Blog';

// Blog was the one public page type without a resolver, so BlogPost built its meta
// inline: it appended BLOG_SUFFIX unconditionally (overflowing 60 chars on long
// headlines → truncated in results) and used the raw excerpt as the description
// (frequently > 160 → truncated). Both now go through here.
//   • title: admin seo_title verbatim; else the headline + brand suffix ONLY when
//     the whole thing still fits Google's ~60-char window (a long headline alone is
//     more useful than a headline whose brand tag gets cut off).
//   • description: admin seo_description; else the excerpt truncated to 160.
export const resolveBlogSeo = ({ post = {}, siteUrl = SITE_URL } = {}) => {
  const site = trimSlash(siteUrl);
  const headline = post.title || 'Book A Sloth Blog';
  const title = post.seo_title
    || (headline.length + BLOG_SUFFIX.length <= 60 ? `${headline}${BLOG_SUFFIX}` : headline);
  const description = post.seo_description
    || truncate(post.excerpt || `Read ${headline} on the Book A Sloth blog.`, 160);
  return {
    title,
    description,
    canonical: post.slug ? `${site}/blog/${post.slug}` : `${site}/blog`,
    indexable: post.is_indexable !== false,
    robots: robotsFor(post.is_indexable),
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

// Organization as a @graph node (with a stable @id and an ImageObject logo), for
// pages that build a single @graph and reference the org by @id. The standalone
// organizationJsonLd above stays as-is for pages that inline the org directly.
const LOGO_URL = (site) => `${site}/logo-512.png`;
const orgNode = (site) => ({
  '@type': 'Organization',
  '@id': `${site}/#organization`,
  name: 'Book A Sloth',
  url: `${site}/`,
  logo: { '@type': 'ImageObject', '@id': `${site}/#logo`, url: LOGO_URL(site), contentUrl: LOGO_URL(site), width: 512, height: 512 },
  description: 'Online booking and appointment scheduling platform for coaches, consultants, therapists, and small businesses.',
  sameAs: ORG_SAME_AS,
});

/**
 * articleGraphJsonLd — the ONE structured-data object an article page emits.
 *
 * Returns a single `@graph` whose nodes cross-reference by stable `@id`, so the
 * page renders exactly one <script type="application/ld+json">. Nodes: WebSite,
 * Organization (+ logo ImageObject), a primary-image ImageObject, the author
 * Person, a WebPage, the article (BlogPosting/Article) and a BreadcrumbList —
 * plus a FAQPage ONLY when the caller passes FAQs the page actually shows.
 *
 * The caller passes already-resolved headline/description/url/image/dates so the
 * meta tags and the schema come from one source (see resolveBlogSeo) and the meta
 * description equals the schema description. `mainEntityOfPage` points at the
 * article's own WebPage (never the homepage); the author is a real Person when a
 * byline exists, and only falls back to the Organization when there is none.
 *
 * Nothing is invented: width/height, dates and the author URL are emitted only
 * when the caller supplies them.
 */
export const articleGraphJsonLd = ({
  siteUrl = SITE_URL,
  url,
  type = 'BlogPosting',
  headline,
  description,
  image,
  imageWidth,
  imageHeight,
  datePublished,
  dateModified,
  author,            // { name, url, jobTitle?, image?, sameAs? } — Person node emitted only when name is set
  breadcrumb = [],   // ordered [{ name, path }]
  faqs = [],
} = {}) => {
  const site = trimSlash(siteUrl);
  const pageUrl = url || `${site}/`;
  const abs = (p) => (/^https?:/i.test(p) ? p : `${site}${String(p || '').startsWith('/') ? '' : '/'}${p || ''}`);

  const id = {
    website: `${site}/#website`,
    org: `${site}/#organization`,
    webpage: `${pageUrl}#webpage`,
    article: `${pageUrl}#article`,
    image: `${pageUrl}#primaryimage`,
    breadcrumb: `${pageUrl}#breadcrumb`,
    faq: `${pageUrl}#faq`,
    person: author && author.name ? `${author.url || pageUrl}#author` : undefined,
  };

  const graph = [
    { '@type': 'WebSite', '@id': id.website, url: `${site}/`, name: 'Book A Sloth', publisher: { '@id': id.org }, inLanguage: 'en-IN' },
    orgNode(site),
  ];

  if (image) {
    const img = { '@type': 'ImageObject', '@id': id.image, url: image, contentUrl: image };
    if (imageWidth) img.width = imageWidth;
    if (imageHeight) img.height = imageHeight;
    graph.push(img);
  }

  if (id.person) {
    const person = { '@type': 'Person', '@id': id.person, name: author.name, url: author.url || undefined };
    if (author.jobTitle) person.jobTitle = author.jobTitle;
    if (author.image) person.image = author.image;
    if (Array.isArray(author.sameAs) && author.sameAs.length) person.sameAs = author.sameAs;
    graph.push(person);
  }

  graph.push({
    '@type': 'BreadcrumbList',
    '@id': id.breadcrumb,
    itemListElement: (breadcrumb || [])
      .filter((it) => it && it.name && it.path)
      .map((it, i) => ({ '@type': 'ListItem', position: i + 1, name: it.name, item: abs(it.path) })),
  });

  const webpage = {
    '@type': 'WebPage',
    '@id': id.webpage,
    url: pageUrl,
    name: headline,
    description: description || undefined,
    isPartOf: { '@id': id.website },
    breadcrumb: { '@id': id.breadcrumb },
    datePublished: datePublished || undefined,
    dateModified: dateModified || datePublished || undefined,
    inLanguage: 'en-IN',
  };
  if (image) webpage.primaryImageOfPage = { '@id': id.image };
  graph.push(webpage);

  const article = {
    '@type': type,
    '@id': id.article,
    headline,
    description: description || undefined,
    url: pageUrl,
    mainEntityOfPage: { '@id': id.webpage },
    isPartOf: { '@id': id.webpage },
    datePublished: datePublished || undefined,
    dateModified: dateModified || datePublished || undefined,
    author: id.person ? { '@id': id.person } : { '@id': id.org },
    publisher: { '@id': id.org },
    inLanguage: 'en-IN',
  };
  if (image) article.image = { '@id': id.image };
  graph.push(article);

  if (Array.isArray(faqs) && faqs.length) {
    graph.push({
      '@type': 'FAQPage',
      '@id': id.faq,
      mainEntity: faqs
        .filter((f) => f && f.q && f.a)
        .map((f) => ({ '@type': 'Question', name: String(f.q), acceptedAnswer: { '@type': 'Answer', text: String(f.a) } })),
    });
  }

  return { '@context': 'https://schema.org', '@graph': graph };
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
