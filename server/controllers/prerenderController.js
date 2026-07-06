/**
 * prerenderController.js — Renders minimal HTML meta-tag pages for bot traffic.
 *
 * Reuses the same DB builders (buildHostProfile, buildPublicServiceByProfileAndSlug)
 * as the public API, so admin SEO overrides are always respected. Output is a
 * self-contained HTML document with:
 *   - <title>, meta description, robots
 *   - Open Graph + Twitter Card tags
 *   - Canonical URL
 *   - JSON-LD structured data
 *   - A <noscript> redirect to the real SPA page
 *
 * No React, no JS bundle — just the tags social scrapers and non-JS bots need.
 */

const SITE_URL = process.env.PUBLIC_SITE_URL || 'https://bookasloth.com';

const trimSlash = (s) => String(s || '').replace(/\/+$/, '');
const esc = (s) => String(s || '').replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const truncate = (s, n = 160) => {
  const str = String(s || '').trim();
  return str.length <= n ? str : str.slice(0, n - 1).trimEnd() + '…';
};

function buildHtml({ title, description, canonical, ogTitle, ogDescription, image, robots, jsonLd }) {
  const site = trimSlash(SITE_URL);
  const img = image || `${site}/og-image.png`;
  const rob = robots || 'index,follow';

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}">
<meta name="robots" content="${rob}">
<link rel="canonical" href="${esc(canonical)}">
<meta property="og:type" content="website">
<meta property="og:site_name" content="Book A Sloth">
<meta property="og:title" content="${esc(ogTitle || title)}">
<meta property="og:description" content="${esc(ogDescription || description)}">
<meta property="og:url" content="${esc(canonical)}">
<meta property="og:image" content="${esc(img)}">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${esc(ogTitle || title)}">
<meta name="twitter:description" content="${esc(ogDescription || description)}">
<meta name="twitter:image" content="${esc(img)}">
${jsonLd ? `<script type="application/ld+json">${JSON.stringify(jsonLd)}</script>` : ''}
<noscript><meta http-equiv="refresh" content="0;url=${esc(canonical)}"></noscript>
</head>
<body>
<p>Redirecting to <a href="${esc(canonical)}">${esc(title)}</a>...</p>
</body>
</html>`;
}

// ── Profile ─────────────────────────────────────────────────────────────────

const renderProfileMeta = async (req, res) => {
  try {
    const { buildHostProfile } = require('./hostController');
    const username = req.params.username;
    const outcome = await buildHostProfile(username);

    if (outcome.notFound || outcome.redirect) {
      if (outcome.redirect) {
        return res.redirect(301, `${trimSlash(SITE_URL)}/${outcome.username}`);
      }
      return res.status(404).send('Not found');
    }

    const { host, services } = outcome.payload;
    const site = trimSlash(SITE_URL);
    const name = host.name || 'Host';

    const title = host.seo_title
      || `${name}${host.profession ? ` — ${host.profession}` : ''} | Book A Sloth`;
    const description = host.seo_description
      || truncate(host.bio || `Book sessions with ${name} on Book A Sloth.`);
    const canonical = `${site}/${host.username}`;

    const jsonLd = {
      '@context': 'https://schema.org',
      '@type': 'ProfilePage',
      url: canonical,
      mainEntity: {
        '@type': 'Person',
        name,
        url: canonical,
        jobTitle: host.profession || undefined,
        description: host.seo_description || host.bio || undefined,
        image: host.seo_image || host.profile_image || undefined,
        ...(Array.isArray(services) && services.length ? {
          makesOffer: services.filter(s => s && s.title).map(s => ({
            '@type': 'Offer',
            itemOffered: { '@type': 'Service', name: s.title, url: s.slug ? `${canonical}/${s.slug}` : undefined },
          })),
        } : {}),
      },
    };

    const html = buildHtml({
      title,
      description,
      canonical,
      ogTitle: host.og_title || host.seo_title || name,
      ogDescription: host.og_description || description,
      image: host.seo_image || host.profile_image,
      robots: host.is_indexable === false ? 'noindex,nofollow' : 'index,follow',
      jsonLd,
    });

    res.set('Content-Type', 'text/html');
    res.set('Cache-Control', 'public, max-age=120, s-maxage=300');
    res.send(html);
  } catch (err) {
    console.error('[prerender] profile error:', err.message);
    res.status(500).send('Error');
  }
};

// ── Service ─────────────────────────────────────────────────────────────────

const renderServiceMeta = async (req, res) => {
  try {
    const { buildPublicServiceByProfileAndSlug } = require('./serviceController');
    const { username, serviceSlug } = req.params;
    const outcome = await buildPublicServiceByProfileAndSlug(username, serviceSlug);

    if (outcome.hostNotFound || outcome.notFound) {
      return res.status(404).send('Not found');
    }

    const { service, vendor } = outcome.payload;
    const site = trimSlash(SITE_URL);
    const baseTitle = service.title || 'Service';

    const title = service.seo_title
      || `${baseTitle}${vendor.name ? ` with ${vendor.name}` : ''} | Book A Sloth`;
    const description = service.seo_description
      || truncate(service.short_description || service.description || `Book ${baseTitle} on Book A Sloth.`);
    const canonical = vendor.username && service.slug
      ? `${site}/${vendor.username}/${service.slug}`
      : site;

    const avgRating = outcome.payload.avgRating || 0;
    const reviewCount = (outcome.payload.reviews || []).length;

    const jsonLd = {
      '@context': 'https://schema.org',
      '@type': 'Service',
      name: baseTitle,
      description: service.seo_description || service.short_description || service.description || undefined,
      url: canonical,
      provider: vendor.name
        ? { '@type': 'Person', name: vendor.name, url: vendor.username ? `${site}/${vendor.username}` : undefined }
        : undefined,
      offers: {
        '@type': 'Offer',
        price: String(service.price ?? 0),
        priceCurrency: service.currency || 'INR',
        availability: 'https://schema.org/InStock',
        url: canonical,
      },
      ...(service.seo_image || service.thumbnail_url ? { image: service.seo_image || service.thumbnail_url } : {}),
      ...(reviewCount > 0 && avgRating > 0 ? {
        aggregateRating: { '@type': 'AggregateRating', ratingValue: avgRating, reviewCount },
      } : {}),
    };

    const html = buildHtml({
      title,
      description,
      canonical,
      ogTitle: service.og_title || service.seo_title || baseTitle,
      ogDescription: service.og_description || description,
      image: service.seo_image || service.thumbnail_url,
      robots: service.is_indexable === false ? 'noindex,nofollow' : 'index,follow',
      jsonLd,
    });

    res.set('Content-Type', 'text/html');
    res.set('Cache-Control', 'public, max-age=120, s-maxage=300');
    res.send(html);
  } catch (err) {
    console.error('[prerender] service error:', err.message);
    res.status(500).send('Error');
  }
};

module.exports = { renderProfileMeta, renderServiceMeta };
