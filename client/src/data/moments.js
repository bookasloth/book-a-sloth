// client/src/data/moments.js
// Moments — Google-Doodle-style archive content. Single source of truth for
// pages/Moments.jsx (index), pages/MomentPage.jsx (detail), and the featured
// moment on pages/Search.jsx. Curated, dev-authored; publish = edit + deploy.
//
// Each moment:
//   slug     — URL segment (/moments/:slug). Unique, URL-safe [a-z0-9-].
//   title    — headline.
//   date     — display string; also sort order (keep array newest-first).
//   image    — art URL. Convention: CDN .../images/moments/${slug}.png
//   alt      — image alt text.
//   excerpt  — 1-2 line summary (index card + meta description, keep < 160 chars).
//   body     — array of blocks: { p } paragraph | { h2 } section heading.
//   credits  — optional attribution string.
//   cta      — optional { label, href } (internal path or external URL).

const CDN = 'https://company-assets.bookasloth.in/images/moments';

export const MOMENTS = [
  {
    slug: 'fifa-2026-winners-argentina',
    title: 'Argentina — FIFA World Cup 2026 Champions',
    date: 'July 19, 2026',
    image: `${CDN}/fifa-2026-winners-argentina.png`,
    alt: 'Illustration celebrating Argentina winning the FIFA World Cup 2026',
    excerpt: 'La Albiceleste lifts the trophy again. We are celebrating with a Book A Sloth moment for the 2026 champions.',
    body: [
      { p: 'Argentina are champions of the world once more. After a tournament that kept an entire planet on the edge of its seat, La Albiceleste lifted the FIFA World Cup 2026 trophy.' },
      { h2: 'Why we made this moment' },
      { p: 'At Book A Sloth we love the days the whole world stops to watch the same thing at the same time. A World Cup final is one of those days — so we drew a little something to mark it.' },
      { p: 'Congratulations to the champions, and to every fan who stayed up for extra time. Here is to the next four years.' },
    ],
    credits: 'Art by the Book A Sloth team.',
    cta: { label: 'Explore hosts', href: '/explore' },
  },
];

export const FEATURED = MOMENTS[0];

export function getMoment(slug) {
  return MOMENTS.find((m) => m.slug === slug);
}
