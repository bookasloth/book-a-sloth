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

/**
 * Google profile photos come back as `=s96-c` — 96px. Facebook's minimum for a
 * link card is 200x200, so a host's own avatar was UNDER the floor and Facebook
 * and WhatsApp rendered no card at all, rather than a small one. The size is just
 * a URL parameter, so ask for one that clears it. Only touches Google's
 * `=s<N>-c` suffix; every other image URL passes through untouched.
 */
const upscaleAvatar = (url) => String(url || '').replace(/=s\d+-c$/, '=s512-c');

function buildHtml({ title, description, canonical, ogTitle, ogDescription, image, robots, jsonLd, cardImage }) {
  const site = trimSlash(SITE_URL);
  const img = image || `${site}/og-image.png`;
  const rob = robots || 'index,follow';
  // Emit 1200x630 size hints only when we KNOW the image is that size: the site
  // fallback card, and (now) a generated host card — both are exactly 1200x630.
  // A service thumbnail is whatever the host uploaded, so declaring a size over
  // it would be a lie scrapers act on; omit the hint and let them measure.
  const knownCard = cardImage || !image;
  const sizeHints = knownCard
    ? '\n<meta property="og:image:width" content="1200">\n<meta property="og:image:height" content="630">'
    : '';

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
<meta property="og:image" content="${esc(img)}">${sizeHints}
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
    // Resolved once: the OG tag and the JSON-LD both point at the host's photo,
    // and upscaling only one of them is how you get a card that works next to
    // structured data that still says 96px.
    const avatar = upscaleAvatar(host.seo_image || host.profile_image) || undefined;

    // og:image is a SHARE CARD, not the avatar. A square Google photo letterboxes
    // inside a summary_large_image card, so we serve the generated 1200x630 host
    // card whenever one EXISTS — including a 'dirty' one (a visible field changed
    // and a regen is queued): a slightly-stale personal card beats dropping to the
    // generic site card, which is exactly the design's "dirty => serve old image".
    // Only a host with no card yet ('none') gets the site-wide default.
    // The avatar still feeds JSON-LD Person.image below, which is correct there.
    // ponytail: default = the existing site card; swap for a host-flavoured
    // default 1200x630 when one's designed.
    const ogCard = host.og_image || `${site}/og-image.png`;

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
        image: avatar,
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
      // Share-card copy is its own fixed voice — the SAME line across every host
      // profile, deliberately NOT derived from bio/profession. The <title>/meta
      // description above stay SEO-flavoured for Google; these OG tags carry the
      // brand share line. Explicit og_/seo_ fields still override when set.
      ogTitle: host.og_title || host.seo_title || `${name} — now taking bookings on Book A Sloth.`,
      ogDescription: host.og_description || host.seo_description
        || `Skip the back-and-forth — ${name}'s calendar is open. Book a slot with them.`,
      image: ogCard,
      cardImage: true, // ogCard is always a known 1200x630 card (generated or site default)
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
