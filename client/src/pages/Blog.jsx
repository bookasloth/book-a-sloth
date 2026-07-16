import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { themeFor } from '../data/blogPosts';
import { getBlogs } from '../services/api';
import Seo from "../components/common/Seo";
import { SITE_URL } from "../utils/seo";
import BlogHeroThumbnail from '../components/blog/BlogHeroThumbnail';

// /blog — index of posts. Content now lives in the `blogs` table and is served
// by GET /api/blogs (see server/controllers/blogController.js). Presentation
// (category colours via themeFor) still comes from src/data/blogPosts.js.
// Card art reuses the same visual the post hero uses, so index and post agree.

const Tag = ({ label }) => {
  const s = themeFor(label);
  return (
    <span
      className="inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold"
      style={{ backgroundColor: s.chipBg, color: s.chipFg }}
    >
      {label}
    </span>
  );
};

// Card art: the post's own image if it has one, else the generated hero
// thumbnail (same component the post page uses — see BlogHeroThumbnail).
const CardVisual = ({ post, className, w, h }) => {
  const t = themeFor(post.category);
  return (
    <div className={`relative overflow-hidden ${className}`} style={{ backgroundColor: t.band }}>
      {post.image ? (
        <img src={post.image} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover" />
      ) : (
        <BlogHeroThumbnail post={post} theme={t} w={w} h={h} />
      )}
    </div>
  );
};

const Blog = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const prev = document.title;
    document.title = 'Blog · Book A Sloth';
    return () => { document.title = prev; };
  }, []);

  useEffect(() => {
    getBlogs()
      .then((res) => setPosts(res.data.posts || []))
      .catch(() => setPosts([]))
      .finally(() => setLoading(false));
  }, []);

  const [featured, ...rest] = posts;

  return (
    <div className="app-container blog-page py-12 sm:py-16">
      <Seo
        title="Book A Sloth Blog — Booking & Business Growth Tips"
        description="Guides on appointment scheduling, reducing no-shows, online payments, and growing your booking business. Practical tips from Book A Sloth."
        canonical={`${SITE_URL}/blog`}
      />
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

        {loading ? (
          <div className="mt-12 space-y-6 sm:mt-16">
            <div className="page-card h-40 animate-pulse bg-black/[0.03]" />
            <div className="grid gap-6 sm:grid-cols-2">
              <div className="page-card h-32 animate-pulse bg-black/[0.03]" />
              <div className="page-card h-32 animate-pulse bg-black/[0.03]" />
            </div>
          </div>
        ) : posts.length === 0 ? (
          <p className="mt-16 text-center text-[15px] text-gray-500">
            No posts yet — check back soon. 🦥
          </p>
        ) : (
          <>
            {/* Featured post */}
            <Link
              to={`/blog/${featured.slug}`}
              style={{ '--card-hov': themeFor(featured.category).chipFg }}
              className="page-card group mt-12 grid overflow-hidden transition-shadow hover:shadow-md sm:mt-16 sm:grid-cols-2"
            >
              <CardVisual post={featured} w={600} h={440} className="h-44 sm:order-last sm:h-full sm:min-h-[16rem]" />
              <div className="p-6 sm:p-8">
                <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                  <Tag label={featured.category} />
                  <time className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                    {featured.date}
                  </time>
                  <span className="text-xs text-gray-400">· {featured.readMins} min read</span>
                </div>
                <h2 className="mt-3 font-heading text-2xl font-bold tracking-tight text-ink transition-colors duration-150 group-hover:[color:var(--card-hov)] sm:text-3xl">
                  {featured.title}
                </h2>
                <p className="mt-3 text-[15px] leading-relaxed text-gray-600">
                  {featured.excerpt}
                </p>
                <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-primary-cta">
                  Read post
                  <svg viewBox="0 0 24 24" className="h-4 w-4 transition-transform duration-150 group-hover:translate-x-0.5" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M5 12h14M13 6l6 6-6 6" />
                  </svg>
                </span>
              </div>
            </Link>

            {/* Rest of posts */}
            {rest.length > 0 && (
              <div className="mt-6 grid gap-6 sm:mt-8 sm:grid-cols-2">
                {rest.map((post) => (
                  <Link
                    key={post.slug}
                    to={`/blog/${post.slug}`}
                    style={{ '--card-hov': themeFor(post.category).chipFg }}
                    className="page-card group flex flex-col overflow-hidden transition-shadow hover:shadow-md"
                  >
                    <CardVisual post={post} w={600} h={240} className="h-36" />
                    <div className="flex flex-1 flex-col p-5 sm:p-6">
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
                        <Tag label={post.category} />
                        <time className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                          {post.date}
                        </time>
                      </div>
                      <h2 className="mt-2.5 font-heading text-lg font-bold tracking-tight text-ink transition-colors duration-150 group-hover:[color:var(--card-hov)] sm:text-xl">
                        {post.title}
                      </h2>
                      <p className="mt-2 flex-1 text-sm leading-relaxed text-gray-600">
                        {post.excerpt}
                      </p>
                      <span className="mt-3 text-xs font-medium text-gray-400">
                        {post.readMins} min read
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </>
        )}

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
  );
};

export default Blog;
