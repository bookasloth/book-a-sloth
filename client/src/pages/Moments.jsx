// client/src/pages/Moments.jsx
// Moments archive index. Route: /moments. Featured moment large on top, then a
// responsive grid of the rest. Renders from the static moments data.
import { Link } from 'react-router-dom';
import Seo from '../components/common/Seo';
import { MOMENTS, FEATURED } from '../data/moments';

export default function Moments() {
  const rest = MOMENTS.slice(1);

  return (
    <div className="mx-auto max-w-5xl px-6 py-10 sm:py-14">
      <Seo
        title="Moments — Book A Sloth"
        description="A little archive of the days the world stopped to watch. Book A Sloth moments, doodle-style."
        canonical="https://bookasloth.com/moments"
      />

      <header className="text-center">
        <h1 className="font-heading text-3xl font-bold tracking-tight text-ink sm:text-4xl">Moments</h1>
        <p className="mt-3 text-muted">The days worth marking, drawn by the Book A Sloth team.</p>
      </header>

      {/* Featured */}
      <Link
        to={`/moments/${FEATURED.slug}`}
        className="group mt-10 block overflow-hidden rounded-xl border-2 border-ink/10 transition hover:border-primary/40"
      >
        <img src={FEATURED.image} alt={FEATURED.alt} className="h-auto w-full object-contain" />
        <div className="p-6">
          <p className="text-sm font-medium text-primary">{FEATURED.date}</p>
          <h2 className="mt-1 font-heading text-xl font-bold text-ink sm:text-2xl">{FEATURED.title}</h2>
          <p className="mt-2 text-sm text-muted">{FEATURED.excerpt}</p>
        </div>
      </Link>

      {/* Grid */}
      {rest.length > 0 && (
        <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
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
