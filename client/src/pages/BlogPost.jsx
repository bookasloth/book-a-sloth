import { useEffect } from 'react';
import { Link, useParams, Navigate } from 'react-router-dom';
import { getPost, BLOG_POSTS } from '../data/blogPosts';

// /blog/:slug — static blog post detail. Content from src/data/blogPosts.js.
// Unknown slug → redirect to /blog index (friendlier than a bare 404).

const TAG_STYLES = {
  'Build log':   { bg: 'rgba(254,81,0,0.10)',  fg: '#c2410c' },
  Product:       { bg: 'rgba(37,99,235,0.10)',  fg: '#2563eb' },
  Engineering:   { bg: 'rgba(5,150,105,0.10)',  fg: '#059669' },
  Story:         { bg: 'rgba(124,58,237,0.10)',  fg: '#7c3aed' },
};

// Render one body block. Supported: { p }, { h2 }, { ul: [..] }, { quote }.
const Block = ({ block }) => {
  if (block.h2) {
    return (
      <h2 className="mt-8 font-heading text-xl font-bold tracking-tight text-ink sm:text-2xl">
        {block.h2}
      </h2>
    );
  }
  if (block.ul) {
    return (
      <ul className="mt-4 space-y-2.5">
        {block.ul.map((item, i) => (
          <li key={i} className="flex gap-2.5 text-[15px] leading-relaxed text-gray-700">
            <svg viewBox="0 0 24 24" className="mt-1.5 h-3.5 w-3.5 shrink-0 text-primary-cta" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M20 6 9 17l-5-5" />
            </svg>
            <span>{item}</span>
          </li>
        ))}
      </ul>
    );
  }
  if (block.quote) {
    return (
      <blockquote className="mt-8 border-l-4 border-primary-cta pl-5 font-heading text-lg font-semibold italic text-ink sm:text-xl">
        {block.quote}
      </blockquote>
    );
  }
  return (
    <p className="mt-5 text-[15px] leading-relaxed text-gray-700 sm:text-base">
      {block.p}
    </p>
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

  const s = TAG_STYLES[post.tag] || TAG_STYLES.Story;
  const more = BLOG_POSTS.filter((p) => p.slug !== post.slug).slice(0, 2);

  return (
    <div className="app-container py-12 sm:py-16">
      <article className="mx-auto max-w-2xl">
        {/* Back link */}
        <Link
          to="/blog"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-primary-cta"
        >
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M19 12H5M11 18l-6-6 6-6" />
          </svg>
          All posts
        </Link>

        {/* Header */}
        <header className="mt-6">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
            <span
              className="inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold"
              style={{ backgroundColor: s.bg, color: s.fg }}
            >
              {post.tag}
            </span>
            <time className="text-xs font-semibold uppercase tracking-wide text-gray-400">
              {post.date}
            </time>
            <span className="text-xs text-gray-400">· {post.readMins} min read</span>
          </div>
          <h1 className="mt-3 font-heading text-3xl font-extrabold tracking-tight text-ink sm:text-4xl">
            {post.title}
          </h1>
          <p className="mt-3 text-sm font-medium text-gray-500">By {post.author}</p>
        </header>

        {/* Body */}
        <div className="mt-8">
          {post.body.map((block, i) => <Block key={i} block={block} />)}
        </div>

        {/* More posts */}
        {more.length > 0 && (
          <div className="mt-14 border-t border-gray-200 pt-8">
            <h2 className="font-heading text-lg font-bold tracking-tight text-ink">
              Keep reading
            </h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              {more.map((p) => (
                <Link
                  key={p.slug}
                  to={`/blog/${p.slug}`}
                  className="page-card group p-4 transition-shadow hover:shadow-md hover:no-underline"
                >
                  <span className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">
                    {p.tag}
                  </span>
                  <h3 className="mt-1 font-heading text-base font-bold tracking-tight text-ink group-hover:text-primary-cta">
                    {p.title}
                  </h3>
                </Link>
              ))}
            </div>
          </div>
        )}
      </article>
    </div>
  );
};

export default BlogPost;
