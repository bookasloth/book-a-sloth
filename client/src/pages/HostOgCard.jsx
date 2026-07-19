import { useSearchParams } from 'react-router-dom';
import { useHideChrome } from '../context/ChromeContext';
import Seo from '../components/common/Seo';

// /og/host/:username?name=&profession=&bio=&rating=&reviews=&bookings=&since=&avatar=&verified=&online=&meet=
//
// A render target for scripts/generateHostOgImages.mjs — NOT a page for humans.
// Draws a host's 1200x630 social card so puppeteer can screenshot it, exactly as
// /og/blog/:slug does for posts. All data arrives via the query string (the
// generator has DB access; a localhost page fetching the prod API is CORS-blocked
// — the same lesson the blog generator learned).
//
// noindex (Seo below + robots.txt /og/ disallow + absent from sitemap/prerender).

const OG_W = 1200;
const OG_H = 630;

// Design tokens — kept in sync with the OG family (see the founder card spec).
const C = {
  orange: '#FE5100',
  orangeSoft: '#FF9A42',
  ink: '#131317',
  panel: '#1A1A1F',
  panel2: '#2A2A33',
  white: '#F5F5F7',
  grey: '#A1A1AA',
  line: 'rgba(255,255,255,0.08)',
};

// Booking/review counts read nicer rounded: 247 stays 247, 820 -> "820+",
// 1240 -> "1.2k+". Exact reviews, compact bookings.
const compact = (n) => {
  const v = Number(n) || 0;
  if (v >= 1000) return `${(Math.floor(v / 100) / 10).toString().replace(/\.0$/, '')}k+`;
  if (v >= 10) return `${Math.floor(v / 10) * 10}+`;
  return String(v);
};

// A single verified check — one authoritative mark, not a pill repeated elsewhere.
const VerifiedTick = () => (
  <span style={{
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
    width: 40, height: 40, borderRadius: '50%', background: C.orange,
    color: '#fff', fontSize: 22, fontWeight: 700, flexShrink: 0,
  }}>✓</span>
);

export default function HostOgCard() {
  const [params] = useSearchParams();
  useHideChrome();

  const name = params.get('name') || 'Book A Sloth Host';
  const profession = params.get('profession') || '';
  const username = params.get('username') || '';
  const avatar = params.get('avatar') || '';
  const verified = params.get('verified') === '1';

  const reviews = Number(params.get('reviews')) || 0;
  const rating = Number(params.get('rating')) || 0;
  const bookings = Number(params.get('bookings')) || 0;
  const since = params.get('since') || '';

  // A brand-new host has no rating/bookings yet — show honest "New" states rather
  // than a hollow "0.0 / 0 bookings" that reads worse than saying nothing.
  const hasRating = reviews > 0 && rating > 0;

  return (
    <div
      data-og-ready="true"
      style={{
        width: OG_W, height: OG_H, position: 'relative', overflow: 'hidden',
        background: `radial-gradient(1100px 700px at 78% 8%, rgba(254,81,0,0.16), transparent 60%), linear-gradient(150deg, ${C.ink} 0%, #0E0E12 100%)`,
        fontFamily: "'Poppins', system-ui, sans-serif",
      }}
    >
      <Seo robots="noindex" />

      {/* One soft orange bloom behind the portrait — the only texture. Restraint
          is the authority here; the old dotted grid + frame + panels competed. */}

      {/* Brand — quiet, top-left */}
      <div style={{ position: 'absolute', top: 56, left: 72, display: 'flex', alignItems: 'center', gap: 13 }}>
        <img src="/favicon.svg" alt="" style={{ width: 40, height: 40, borderRadius: 9 }}
             onError={(e) => { e.currentTarget.style.display = 'none'; }} />
        <span style={{ fontSize: 23, fontWeight: 700, color: 'rgba(245,245,247,0.85)', letterSpacing: -0.3 }}>Book A Sloth</span>
      </div>

      {/* URL — the single call to action, bottom-left */}
      {username && (
        <div style={{ position: 'absolute', bottom: 56, left: 72, fontSize: 27, fontWeight: 700, color: C.orange, letterSpacing: -0.3 }}>
          bookasloth.com/{username}
        </div>
      )}

      {/* Centre band: identity (left) + portrait (right) */}
      <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', padding: '0 72px', gap: 56 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Name + one verified mark */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
            <span style={{
              fontSize: name.length > 20 ? 58 : name.length > 13 ? 66 : 78, fontWeight: 800,
              color: C.white, lineHeight: 1.0, letterSpacing: -2,
            }}>{name}</span>
            {verified && <VerifiedTick />}
          </div>

          {/* Profession */}
          {profession && (
            <div style={{ marginTop: 14, fontSize: 32, fontWeight: 600, color: C.orange, letterSpacing: -0.3 }}>
              {profession}
            </div>
          )}

          {/* One proof line — real numbers, or an honest new-host line. No stat grid. */}
          <div style={{ marginTop: 26, display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
            {hasRating && (
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: 8, padding: '9px 16px',
                borderRadius: 999, background: 'rgba(254,81,0,0.14)', color: C.white,
                fontSize: 22, fontWeight: 700,
              }}>
                <span style={{ color: C.orangeSoft }}>★</span> {rating.toFixed(1)}
              </span>
            )}
            <span style={{ fontSize: 21, color: C.grey, fontWeight: 500 }}>
              {[
                hasRating ? `${reviews} review${reviews === 1 ? '' : 's'}` : null,
                bookings > 0 ? `${compact(bookings)} booked` : null,
                (!hasRating && bookings === 0 && since) ? `New host · since ${since}` : null,
              ].filter(Boolean).join('  ·  ')}
            </span>
          </div>
        </div>

        {/* Portrait — the anchor. Large, glowing, nothing stacked under it. */}
        <div style={{
          width: 300, height: 300, flexShrink: 0, borderRadius: '50%', padding: 5,
          background: `conic-gradient(from 140deg, ${C.orange}, ${C.orangeSoft}, ${C.orange})`,
          boxShadow: '0 0 90px -10px rgba(254,81,0,0.5)',
        }}>
          <div style={{ width: '100%', height: '100%', borderRadius: '50%', overflow: 'hidden', background: C.panel2 }}>
            {avatar
              ? <img src={avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              : <div style={{ width: '100%', height: '100%', display: 'grid', placeItems: 'center', fontSize: 110, fontWeight: 800, color: C.grey }}>{name.charAt(0)}</div>}
          </div>
        </div>
      </div>
    </div>
  );
}
