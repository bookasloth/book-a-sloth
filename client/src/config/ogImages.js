// Social share cards (og:image / twitter:image).
//
// Hand-made 1200x630 JPEGs on the company CDN, one per marketing page, uploaded
// by hand. This helper is the single place that knows the host and the naming
// convention, so every page's <Seo image> agrees by construction and a rename
// is one edit, not forty.
//
// Blog posts do NOT use this — their cards are generated per post and stored on
// Supabase (blogs.og_image); see scripts/generateBlogOgImages.mjs.
//
// The file must exist on the CDN before the ref ships, or the page serves a
// dead card. scripts/checkOgImages.mjs HEADs every URL this produces and fails
// if one 404s — run it after uploading, before deploy.
const OG_BASE = 'https://company-assets.bookasloth.in/images/seo';

export const ogCard = (name) => `${OG_BASE}/${name}-og-1200x630.jpg`;
