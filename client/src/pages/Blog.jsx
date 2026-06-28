import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { BLOG_POSTS } from '../data/blogPosts';

// /blog — static index of progress posts (build-in-public). Content lives in
// src/data/blogPosts.js. Each card links to /blog/:slug (pages/BlogPost.jsx).
// No DB / no server yet — this is the placeholder until the real CMS lands.

const TAG_STYLES = {
  'Build log':   { bg: 'rgba(254,81,0,0.10)',  fg: '#c2410c' },
  Product:       { bg: 'rgba(37,99,235,0.10)',  fg: '#2563eb' },
  Engineering:   { bg: 'rgba(5,150,105,0.10)',  fg: '#059669' },
  Story:         { bg: 'rgba(124,58,237,0.10)',  fg: '#7c3aed' },
};

const Tag = ({ label }) => {
  const s = TAG_STYLES[label] || TAG_STYLES.Story;
  return (
    <span
      className="inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold"
      style={{ backgroundColor: s.bg, color: s.fg }}
    >
      {label}
    </span>
  );
};

const Blog = () => {
  useEffect(() => {
    const prev = document.title;
    document.title = 'Blog · Book A Sloth';
    return () => { document.title = prev; };
  }, []);

  const [featured, ...rest] = BLOG_POSTS;

  return (
    <div className="relative isolate">
      {/* Soft warm backdrop — cream base + faint peach glows. Kept low-opacity
          so cards and text stay readable (lighter than the /changelog mesh).
          Gentle drift; honours prefers-reduced-motion. */}
      <style>{`
        @keyframes blogDriftA { 0%,100% { transform: translate3d(0,0,0) scale(1); }
          50% { transform: translate3d(3%,4%,0) scale(1.08); } }
        @keyframes blogDriftB { 0%,100% { transform: translate3d(0,0,0) scale(1.05); }
          50% { transform: translate3d(-4%,3%,0) scale(0.94); } }
        @media (prefers-reduced-motion: reduce) { .blog-blob { animation: none !important; } }
      `}</style>
      <div
        aria-hidden="true"
        className="fixed inset-0 -z-10 overflow-hidden"
        style={{ backgroundImage: 'linear-gradient(180deg,#FFF7EF 0%,#FFFBF6 45%,#FFFFFF 100%)' }}
      >
        <span className="blog-blob absolute" style={{ top: '-12%', left: '-8%', width: '55%', height: '50%',
          backgroundImage: 'radial-gradient(closest-side, rgba(254,81,0,0.10) 0%, rgba(254,81,0,0) 70%)',
          animation: 'blogDriftA 22s ease-in-out infinite', willChange: 'transform' }} />
        <span className="blog-blob absolute" style={{ top: '-6%', left: '62%', width: '52%', height: '46%',
          backgroundImage: 'radial-gradient(closest-side, rgba(255,138,61,0.12) 0%, rgba(255,138,61,0) 72%)',
          animation: 'blogDriftB 26s ease-in-out -6s infinite', willChange: 'transform' }} />
        <span className="blog-blob absolute" style={{ top: '46%', left: '70%', width: '50%', height: '48%',
          backgroundImage: 'radial-gradient(closest-side, rgba(255,196,140,0.10) 0%, rgba(255,196,140,0) 70%)',
          animation: 'blogDriftA 28s ease-in-out -10s infinite', willChange: 'transform' }} />
      </div>

      <div className="app-container py-12 sm:py-16">
      <div className="mx-auto max-w-4xl">
        {/* Header */}
        <header className="text-center">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary-cta">
            Building in public
          </p>
          <h1 className="mt-2 font-heading text-3xl font-extrabold tracking-tight text-ink sm:text-5xl">
            The Book A Sloth blog
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-[15px] leading-relaxed text-gray-500 sm:text-base">
            Build logs, product thinking and engineering notes as we build a
            0% commission booking platform — in the open.
          </p>
        </header>

        {/* Featured post */}
        <Link
          to={`/blog/${featured.slug}`}
          className="page-card group mt-12 block p-6 transition-shadow hover:shadow-md hover:no-underline sm:mt-16 sm:p-8"
        >
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
            <Tag label={featured.tag} />
            <time className="text-xs font-semibold uppercase tracking-wide text-gray-400">
              {featured.date}
            </time>
            <span className="text-xs text-gray-400">· {featured.readMins} min read</span>
          </div>
          <h2 className="mt-3 font-heading text-2xl font-bold tracking-tight text-ink group-hover:text-primary-cta sm:text-3xl">
            {featured.title}
          </h2>
          <p className="mt-3 text-[15px] leading-relaxed text-gray-600">
            {featured.excerpt}
          </p>
          <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-primary-cta">
            Read post
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M5 12h14M13 6l6 6-6 6" />
            </svg>
          </span>
        </Link>

        {/* Rest of posts */}
        <div className="mt-6 grid gap-6 sm:mt-8 sm:grid-cols-2">
          {rest.map((post) => (
            <Link
              key={post.slug}
              to={`/blog/${post.slug}`}
              className="page-card group flex flex-col p-5 transition-shadow hover:shadow-md hover:no-underline sm:p-6"
            >
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
                <Tag label={post.tag} />
                <time className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                  {post.date}
                </time>
              </div>
              <h2 className="mt-2.5 font-heading text-lg font-bold tracking-tight text-ink group-hover:text-primary-cta sm:text-xl">
                {post.title}
              </h2>
              <p className="mt-2 flex-1 text-sm leading-relaxed text-gray-600">
                {post.excerpt}
              </p>
              <span className="mt-3 text-xs font-medium text-gray-400">
                {post.readMins} min read
              </span>
            </Link>
          ))}
        </div>

        {/* Footer CTA */}
        <div className="mt-12 rounded-2xl border border-black/5 bg-[#FFF8EE] px-6 py-10 text-center sm:mt-16">
          <h3 className="font-heading text-xl font-bold tracking-tight text-ink sm:text-2xl">
            Want this for your own bookings?
          </h3>
          <p className="mx-auto mt-2 max-w-md text-sm text-gray-500">
            Set up your page, sync your calendar and start getting paid — at 0% commission.
          </p>
          <Link
            to="/be-a-sloth"
            className="btn mt-5 inline-flex items-center px-5 py-2.5 text-sm font-semibold text-white bg-primary-cta hover:bg-[#d94400] transition-colors duration-150 shadow-sm hover:no-underline"
          >
            Become a host
          </Link>
        </div>
      </div>
      </div>
    </div>
  );
};

export default Blog;
