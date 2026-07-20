// client/src/pages/Moments.jsx
// Moments archive index. Route: /moments. Featured moment large on top, then a
// responsive grid of the rest. Renders from the static moments data.
import { Link } from 'react-router-dom';
import Seo from '../components/common/Seo';
import { MOMENTS, FEATURED } from '../data/moments';

// Fixed share card for the archive index — constant, unlike the featured
// moment's art which changes as moments are added. Upload once to the CDN.
const OG_IMAGE = 'https://company-assets.bookasloth.in/images/moments/moments-og.png';

export default function Moments() {
  const rest = MOMENTS.slice(1);

  return (
    <div className="mx-auto max-w-5xl px-6 py-14 sm:py-20">
      <Seo
        title="Moments — Book A Sloth"
        description="A little archive of the days the world stopped to watch. Book A Sloth moments, doodle-style."
        canonical="https://bookasloth.com/moments"
        image={OG_IMAGE}
      />

      <header className="text-center">
        <h1 className="font-heading text-4xl font-bold tracking-tight text-ink sm:text-5xl">Moments</h1>
        <p className="mt-4 text-lg text-muted">The days worth marking.</p>
      </header>

      {/* Featured */}
      <Link
        to={`/moments/${FEATURED.slug}`}
        className="group mt-16 block overflow-hidden rounded-xl transition"
      >
        <img src={FEATURED.image} alt={FEATURED.alt} className="h-auto w-full rounded-xl object-contain shadow-sm transition group-hover:shadow-md" />
        <div className="pt-6 text-center">
          <p className="text-sm font-medium text-primary">{FEATURED.date}</p>
          <h2 className="mt-1 font-heading text-2xl font-bold text-ink sm:text-3xl">{FEATURED.title}</h2>
          <p className="mx-auto mt-3 max-w-xl text-muted">{FEATURED.excerpt}</p>
        </div>
      </Link>

      {/* Grid */}
      {rest.length > 0 && (
        <div className="mt-16 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {rest.map((m) => (
            <Link
              key={m.slug}
              to={`/moments/${m.slug}`}
              className="group block overflow-hidden rounded-xl border-2 border-ink/10 transition hover:border-primary/40"
            >
              <img src={m.image} alt={m.alt} className="h-40 w-full object-cover" />
              <div className="p-4">
                <p className="text-xs font-medium text-primary">{m.date}</p>
                <h3 className="mt-1 font-heading text-base font-semibold text-ink">{m.title}</h3>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
