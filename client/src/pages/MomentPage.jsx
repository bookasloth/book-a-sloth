// client/src/pages/MomentPage.jsx
// Per-moment detail page. Route: /moments/:slug. Renders art + story from the
// static moments data. Unknown slug -> ErrorPage-style 404 via <Navigate>.
import { Link, Navigate, useParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import Seo from '../components/common/Seo';
import { MOMENTS, getMoment } from '../data/moments';

function Block({ block }) {
  if (block.h2) {
    return <h2 className="mt-10 font-heading text-xl font-bold tracking-tight text-ink sm:text-2xl">{block.h2}</h2>;
  }
  return <p className="mt-5 text-[15px] leading-relaxed text-muted sm:text-base">{block.p}</p>;
}

export default function MomentPage() {
  const { slug } = useParams();
  const moment = getMoment(slug);

  if (!moment) return <Navigate to="/404" replace />;

  const idx = MOMENTS.findIndex((m) => m.slug === slug);
  const prev = MOMENTS[idx + 1]; // older
  const next = MOMENTS[idx - 1]; // newer

  return (
    <div className="mx-auto max-w-3xl px-6 py-10 sm:py-14">
      <Seo
        title={`${moment.title} — Moments · Book A Sloth`}
        description={moment.excerpt}
        image={moment.image}
        ogType="article"
        canonical={`https://bookasloth.com/moments/${moment.slug}`}
      />

      <Link to="/moments" className="inline-flex items-center gap-1.5 text-sm text-muted transition hover:text-primary">
        <ArrowLeft className="h-4 w-4" /> All moments
      </Link>

      <img
        src={moment.image}
        alt={moment.alt}
        className="mx-auto mt-6 h-auto w-full max-w-2xl rounded-xl border-2 border-ink/10 object-contain"
      />

      <p className="mt-6 text-sm font-medium text-primary">{moment.date}</p>
      <h1 className="mt-1 font-heading text-2xl font-bold tracking-tight text-ink sm:text-3xl">{moment.title}</h1>

      <div className="mt-2">
        {moment.body.map((block, i) => <Block key={i} block={block} />)}
      </div>

      {moment.credits && <p className="mt-8 text-xs italic text-muted">{moment.credits}</p>}

      {moment.cta && (
        <Link
          to={moment.cta.href}
          className="mt-8 inline-flex rounded-xl border-2 border-primary bg-primary px-6 py-2.5 text-sm font-semibold text-surface transition hover:brightness-95"
        >
          {moment.cta.label}
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
