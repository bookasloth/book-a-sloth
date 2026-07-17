import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { themeFor } from '../data/blogPosts';
import { getBlogBySlug } from '../services/api';
import { useHideChrome } from '../context/ChromeContext';
import BlogHeroThumbnail from '../components/blog/BlogHeroThumbnail';

// /og/blog/:slug — a render target for scripts/generateBlogOgImages.mjs, not a
// page for humans. It draws the post's real BlogHeroThumbnail at exactly
// 1200x630 so puppeteer can screenshot it into a social card.
//
// The point of rendering the actual component (rather than re-drawing the art in
// the script) is that the card cannot drift from the site: it IS the site's
// thumbnail. Change the icons or the palette and the cards follow on the next run.
//
// noindex, and left out of the sitemap + prerender lists on purpose.
const OG_W = 1200;
const OG_H = 630;

// BlogHeroThumbnail's patterns use fixed pixel sizes (72-100px icon cards, an
// 80px grid) tuned for a card roughly this size. Handing it a 1200x630 canvas
// leaves those icons marooned in a huge empty field, so instead draw it at its
// natural size and scale the whole thing up — the art keeps its proportions.
const BASE_W = 480;
const BASE_H = 252; // same 1.905 aspect as 1200x630, so the scale is uniform
const SCALE = OG_W / BASE_W;

const OgCard = () => {
  const { slug } = useParams();
  const [post, setPost] = useState(null);
  const [failed, setFailed] = useState(false);
  useHideChrome(); // no navbar/footer — this is a render target, not a page

  useEffect(() => {
    let alive = true;
    getBlogBySlug(slug)
      .then((res) => { if (alive) setPost(res.data.post); })
      .catch(() => { if (alive) setFailed(true); });
    return () => { alive = false; };
  }, [slug]);

  useEffect(() => {
    const m = document.createElement('meta');
    m.name = 'robots';
    m.content = 'noindex,nofollow';
    document.head.appendChild(m);
    return () => { document.head.removeChild(m); };
  }, []);

  // The screenshot script waits for [data-og-ready]; a failed load marks itself
  // ready="error" so the run reports a real failure instead of hanging to timeout.
  if (failed) return <div data-og-ready="error" />;
  if (!post) return null;

  const theme = themeFor(post.category);

  return (
    <div
      data-og-ready="true"
      style={{
        width: OG_W, height: OG_H, overflow: 'hidden', position: 'relative',
        backgroundColor: theme.band,
      }}
    >
      <div style={{ width: BASE_W, height: BASE_H, transform: `scale(${SCALE})`, transformOrigin: 'top left' }}>
        <BlogHeroThumbnail post={post} theme={theme} w={BASE_W} h={BASE_H} />
      </div>
    </div>
  );
};

export default OgCard;
