import { useEffect } from 'react';
import { Link, useParams, Navigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { getPost, BLOG_POSTS } from '../data/blogPosts';

// /blog/:slug — immersive post page. A full-bleed coloured hero (theme from
// the About-hero palette) over a dark reading body, finished with a share row
// and a bottom CTA band in a second colour. Content lives in data/blogPosts.js.
// Unknown slug → redirect to /blog index.

// Hero / band themes — keys match post.color / post.bottomColor.
// `light: true` means the band is a light colour, so band text flips to ink.
const THEMES = {
  blue:   { band: '#1E63C9', accent: '#5BA8F5', light: false },
  orange: { band: '#FE5100', accent: '#FF8A3D', light: false },
  pink:   { band: '#E63B82', accent: '#FF7DAE', light: false },
  green:  { band: '#2E9D58', accent: '#5FD089', light: false },
  yellow: { band: '#FFCC1C', accent: '#B98900', light: true  },
  black:  { band: '#121214', accent: '#FF8A3D', light: false },
  white:  { band: '#F4F1EC', accent: '#FE5100', light: true  },
};
const theme = (key) => THEMES[key] || THEMES.orange;

const BODY_BG = '#0E0E10';
const BODY_TX = '#DCDCE1';
const BODY_DIM = 'rgba(220,220,225,0.55)';
const HEAD_TX = '#F5F5F7';

// Band (hero / bottom) text colours derived from light/dark.
const bandText = (t) =>
  t.light
    ? { title: '#141416', soft: 'rgba(0,0,0,0.66)', faint: 'rgba(0,0,0,0.5)', rule: 'rgba(0,0,0,0.12)' }
    : { title: '#FFFFFF', soft: 'rgba(255,255,255,0.74)', faint: 'rgba(255,255,255,0.6)', rule: 'rgba(255,255,255,0.18)' };

// ── Body block renderer ─────────────────────────────────────────────
const Block = ({ block, accent }) => {
  if (block.h2) {
    return <h2 className="mt-12 text-xl font-bold tracking-tight sm:text-2xl" style={{ color: HEAD_TX }}>{block.h2}</h2>;
  }
  if (block.ul) {
    return (
      <ul className="mt-5 space-y-3">
        {block.ul.map((item, i) => (
          <li key={i} className="flex gap-3 text-[15px] leading-relaxed sm:text-base" style={{ color: BODY_TX }}>
            <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full" style={{ backgroundColor: accent }} />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    );
  }
  if (block.ol) {
    return (
      <ol className="mt-5 space-y-3">
        {block.ol.map((item, i) => (
          <li key={i} className="flex gap-3 text-[15px] leading-relaxed sm:text-base" style={{ color: BODY_TX }}>
            <span className="shrink-0 font-semibold tabular-nums" style={{ color: accent }}>{i + 1}.</span>
            <span>{item}</span>
          </li>
        ))}
      </ol>
    );
  }
  if (block.steps) {
    return (
      <ol className="mt-6 space-y-4">
        {block.steps.map((item, i) => (
          <li key={i} className="flex gap-4 text-[15px] leading-relaxed sm:text-base" style={{ color: BODY_TX }}>
            <span className="shrink-0 pt-0.5 font-mono text-xs font-bold tabular-nums tracking-wider" style={{ color: accent }}>
              {String(i + 1).padStart(2, '0')}
            </span>
            <span>{item}</span>
          </li>
        ))}
      </ol>
    );
  }
  if (block.quote) {
    return (
      <blockquote className="mt-10 border-l-2 pl-5" style={{ borderColor: accent }}>
        <p className="text-lg font-semibold leading-snug sm:text-xl" style={{ color: HEAD_TX }}>{block.quote}</p>
        {block.cite && <cite className="mt-1.5 block text-xs not-italic" style={{ color: accent }}>— {block.cite}</cite>}
      </blockquote>
    );
  }
  if (block.info) {
    return (
      <div className="mt-8 rounded-xl border p-4 sm:p-5" style={{ borderColor: 'rgba(255,255,255,0.10)', backgroundColor: 'rgba(255,255,255,0.03)' }}>
        <div className="flex items-center gap-2">
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke={accent} strokeWidth="2" aria-hidden="true">
            <circle cx="12" cy="12" r="9" /><path d="M12 11v5M12 7.5h.01" strokeLinecap="round" />
          </svg>
          <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: HEAD_TX }}>{block.info.title}</span>
        </div>
        <p className="mt-2 text-sm leading-relaxed" style={{ color: BODY_DIM }}>{block.info.text}</p>
      </div>
    );
  }
  return <p className="mt-5 text-[15px] leading-relaxed sm:text-base" style={{ color: BODY_TX }}>{block.p}</p>;
};

// ── Share row ───────────────────────────────────────────────────────
const ShareRow = ({ title }) => {
  const url = typeof window !== 'undefined' ? window.location.href : '';
  const enc = encodeURIComponent(url);
  const encT = encodeURIComponent(title);
  const links = [
    { label: 'Share on Facebook', href: `https://www.facebook.com/sharer/sharer.php?u=${enc}`,
      d: 'M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z' },
    { label: 'Share on X', href: `https://twitter.com/intent/tweet?url=${enc}&text=${encT}`,
      d: 'M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932ZM17.61 20.644h2.039L6.486 3.24H4.298Z' },
    { label: 'Share on Telegram', href: `https://t.me/share/url?url=${enc}&text=${encT}`,
      d: 'M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z' },
  ];
  const copy = () => {
    navigator.clipboard?.writeText(url).then(
      () => toast.success('Link copied'),
      () => toast.error('Couldn’t copy'),
    );
  };
  return (
    <div className="flex items-center gap-3">
      {links.map((l) => (
        <a key={l.label} href={l.href} target="_blank" rel="noopener noreferrer" aria-label={l.label}
          className="grid h-9 w-9 place-items-center rounded-full text-white/70 transition-colors hover:text-white"
          style={{ backgroundColor: 'rgba(255,255,255,0.06)' }}>
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden="true"><path d={l.d} /></svg>
        </a>
      ))}
      <button type="button" onClick={copy} aria-label="Copy link"
        className="grid h-9 w-9 place-items-center rounded-full text-white/70 transition-colors hover:text-white"
        style={{ backgroundColor: 'rgba(255,255,255,0.06)' }}>
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M13.19 8.69a4.5 4.5 0 0 1 1.24 7.24l-4.5 4.5a4.5 4.5 0 0 1-6.36-6.36l1.76-1.76m13.34-.62 1.76-1.76a4.5 4.5 0 0 0-6.36-6.36l-4.5 4.5a4.5 4.5 0 0 0 1.24 7.24" />
        </svg>
      </button>
    </div>
  );
};

const BlogPost = () => {
  const { slug } = useParams();
  const post = getPost(slug);

  useEffect(() => {
    if (!post) return;
    const prev = document.title;
    document.title = `${post.title} · Book A Sloth`;
    window.scrollTo(0, 0);
    return () => { document.title = prev; };
  }, [post]);

  if (!post) return <Navigate to="/blog" replace />;

  const t = theme(post.color);
  const tt = bandText(t);
  const bt = theme(post.bottomColor);
  const btt = bandText(bt);
  const more = BLOG_POSTS.filter((p) => p.slug !== post.slug).slice(0, 2);

  return (
    <article style={{ backgroundColor: BODY_BG }}>
      {/* ── Hero band ── */}
      <header className="relative overflow-hidden" style={{ backgroundColor: t.band }}>
        <div className="app-container py-14 sm:py-20">
          <div className="mx-auto max-w-3xl">
            <Link to="/blog" className="inline-flex items-center gap-1.5 text-sm font-medium transition-opacity hover:opacity-80"
              style={{ color: tt.faint }}>
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M19 12H5M11 18l-6-6 6-6" />
              </svg>
              All posts
            </Link>

            <p className="mt-8 text-[11px] font-semibold uppercase tracking-[0.2em]" style={{ color: tt.faint }}>
              {post.tag}
            </p>
            <h1 className="mt-3 font-heading text-3xl font-extrabold leading-[1.08] tracking-tight sm:text-5xl" style={{ color: tt.title }}>
              {post.title}
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-relaxed sm:text-lg" style={{ color: tt.soft }}>
              {post.excerpt}
            </p>

            {/* Meta row */}
            <div className="mt-10 border-t pt-5" style={{ borderColor: tt.rule }}>
              <dl className="grid grid-cols-3 gap-4">
                {[['Published', post.date], ['Author', post.author], ['Read', `${post.readMins} min`]].map(([k, v]) => (
                  <div key={k}>
                    <dt className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: tt.faint }}>{k}</dt>
                    <dd className="mt-1 text-sm font-semibold sm:text-base" style={{ color: tt.title }}>{v}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>
        </div>
      </header>

      {/* ── Reading body ── */}
      <div className="app-container py-14 sm:py-20">
        <div className="mx-auto max-w-2xl">
          {post.body.map((block, i) => <Block key={i} block={block} accent={t.accent} />)}

          {/* Byline + share */}
          <div className="mt-14 flex flex-wrap items-center justify-between gap-4 border-t pt-6"
            style={{ borderColor: 'rgba(255,255,255,0.10)' }}>
            <p className="text-sm" style={{ color: BODY_DIM }}>
              by <span className="font-semibold" style={{ color: BODY_TX }}>{post.author}</span>
            </p>
            <ShareRow title={post.title} />
          </div>

          {/* Keep reading */}
          {more.length > 0 && (
            <div className="mt-14">
              <h2 className="text-lg font-bold tracking-tight" style={{ color: HEAD_TX }}>Keep reading</h2>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                {more.map((p) => {
                  const pt = theme(p.color);
                  return (
                    <Link key={p.slug} to={`/blog/${p.slug}`}
                      className="group rounded-xl border p-4 transition-colors hover:no-underline"
                      style={{ borderColor: 'rgba(255,255,255,0.10)', backgroundColor: 'rgba(255,255,255,0.02)' }}>
                      <span className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: pt.accent }}>{p.tag}</span>
                      <h3 className="mt-1 font-heading text-base font-bold tracking-tight" style={{ color: HEAD_TX }}>{p.title}</h3>
                    </Link>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Bottom CTA band (second colour) ── */}
      <section style={{ backgroundColor: bt.band }}>
        <div className="app-container py-16 sm:py-20">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="font-heading text-2xl font-extrabold tracking-tight sm:text-3xl" style={{ color: btt.title }}>
              Want this for your own bookings?
            </h2>
            <p className="mx-auto mt-3 max-w-md text-sm sm:text-base" style={{ color: btt.soft }}>
              Set up your page, sync your calendar and start getting paid — at 0% commission.
            </p>
            <Link to="/be-a-sloth"
              className="btn mt-6 inline-flex items-center px-6 py-3 text-sm font-semibold transition-transform hover:-translate-y-0.5 hover:no-underline"
              style={{ backgroundColor: bt.light ? '#141416' : '#FFFFFF', color: bt.light ? '#FFFFFF' : '#141416' }}>
              Become a host
            </Link>
          </div>
        </div>
      </section>
    </article>
  );
};

export default BlogPost;
