// client/src/pages/MomentPage.jsx
// Per-moment detail page. Route: /moments/:slug. Renders art + story from the
// static moments data. Unknown slug -> ErrorPage-style 404 via <Navigate>.
import { Link, Navigate, useParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import Seo from '../components/common/Seo';
import { MOMENTS, getMoment } from '../data/moments';

function Block({ block }) {
  if (block.h2) {
    return <h2 className="mt-12 font-heading text-xl font-bold tracking-tight text-ink sm:text-2xl">{block.h2}</h2>;
  }
  // Quiet ending — one line to remember. Large, centered, hairline above.
  if (block.quote) {
    return (
      <p className="mx-auto mt-14 max-w-xl border-t-2 border-ink/10 pt-10 text-center font-heading text-xl font-semibold leading-snug tracking-tight text-ink sm:text-2xl">
        {block.quote}
      </p>
    );
  }
  return <p className="mt-6 text-base leading-relaxed text-muted sm:text-[17px]">{block.p}</p>;
}

export default function MomentPage() {
  const { slug } = useParams();
  const moment = getMoment(slug);

  if (!moment) return <Navigate to="/404" replace />;

  const idx = MOMENTS.findIndex((m) => m.slug === slug);
  const prev = MOMENTS[idx + 1]; // older
  const next = MOMENTS[idx - 1]; // newer

  return (
    <div className="mx-auto max-w-3xl px-6 py-14 sm:py-20">
      <Seo
        title={`${moment.title} — Moments · Book A Sloth`}
        ogTitle={moment.title}
        description={moment.excerpt}
        image={moment.image}
        ogType="article"
        articlePublishedTime={new Date(moment.date).toISOString()}
        canonical={`https://bookasloth.com/moments/${moment.slug}`}
        jsonLd={{
          '@context': 'https://schema.org',
          '@type': 'CreativeWork',
          name: moment.title,
          abstract: moment.excerpt,
          image: moment.image,
          url: `https://bookasloth.com/moments/${moment.slug}`,
          datePublished: moment.date,
          creator: { '@type': 'Organization', name: 'Book A Sloth' },
        }}
      />

      <Link to="/moments" className="inline-flex items-center gap-1.5 text-sm text-muted transition hover:text-primary">
        <ArrowLeft className="h-4 w-4" /> All moments
      </Link>

      <img
        src={moment.image}
        alt={moment.alt}
        className="mx-auto mt-10 h-auto w-full max-w-2xl rounded-xl object-contain shadow-sm"
      />

      <p className="mt-10 text-sm font-medium text-primary">{moment.date}</p>
      <h1 className="mt-2 font-heading text-3xl font-bold tracking-tight text-ink sm:text-4xl">{moment.title}</h1>

      <div className="mt-2">
        {moment.body.map((block, i) => <Block key={i} block={block} />)}
      </div>

      {moment.credits && <p className="mt-12 text-xs italic text-muted">{moment.credits}</p>}

      {moment.cta && (
        <Link
          to={moment.cta.href}
          className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-primary transition hover:gap-2.5"
        >
          {moment.cta.label} <ArrowRight className="h-4 w-4" />
        </Link>
      )}

      {(prev || next) && (
        <nav className="mt-12 flex items-center justify-between border-t-2 border-ink/10 pt-6 text-sm">
          {prev ? (
            <Link to={`/moments/${prev.slug}`} className="inline-flex items-center gap-1.5 text-muted transition hover:text-primary">
              <ArrowLeft className="h-4 w-4" /> {prev.title}
            </Link>
          ) : <span />}
          {next ? (
            <Link to={`/moments/${next.slug}`} className="inline-flex items-center gap-1.5 text-right text-muted transition hover:text-primary">
              {next.title} <ArrowRight className="h-4 w-4" />
            </Link>
          ) : <span />}
        </nav>
      )}
    </div>
  );
}
