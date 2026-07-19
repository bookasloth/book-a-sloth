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

      <Seo robots="noindex" />

      {/* Brand — quiet, top-left (the domain, not a wordmark) */}
      <div style={{ position: 'absolute', top: 54, left: 72, display: 'flex', alignItems: 'center', gap: 13 }}>
        <img src="/favicon.svg" alt="" style={{ width: 40, height: 40, borderRadius: 9 }}
             onError={(e) => { e.currentTarget.style.display = 'none'; }} />
        <span style={{ fontSize: 24, fontWeight: 700, color: 'rgba(245,245,247,0.9)', letterSpacing: -0.3 }}>bookasloth.com</span>
      </div>

      {/* Centre band: identity (left) + portrait stack (right) */}
      <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', padding: '86px 72px 56px', gap: 60 }}>
        {/* ── Left: identity + branding ─────────────────── */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Name + verified mark. Inline (not a flex sibling) so the tick flows
              right after the last word — a 2-line name otherwise left it floating
              in the middle. verticalAlign keeps it on the name's line. */}
          <div style={{
            fontSize: name.length > 21 ? 48 : name.length > 14 ? 56 : name.length > 10 ? 66 : 76,
            fontWeight: 800, color: C.white, lineHeight: 1.06, letterSpacing: -2,
          }}>
            {name}
            {verified && (
              <span style={{ display: 'inline-flex', verticalAlign: 'middle', marginLeft: 18, transform: 'translateY(-3px)' }}>
                <VerifiedTick />
              </span>
            )}
          </div>

          {/* Profession + rating chip, one row */}
          <div style={{ marginTop: 16, display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
            {profession && (
              <span style={{ fontSize: 31, fontWeight: 600, color: C.orange, letterSpacing: -0.3 }}>{profession}</span>
            )}
            {hasRating && (
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: 7, padding: '6px 14px',
                borderRadius: 999, background: 'rgba(254,81,0,0.14)', color: C.white,
                fontSize: 20, fontWeight: 700,
              }}>
                <span style={{ color: C.orangeSoft }}>★</span> {rating.toFixed(1)}
              </span>
            )}
          </div>

          {/* Branding line — fills the space under the profession */}
          <div style={{ marginTop: 30, maxWidth: 560, fontSize: 22, lineHeight: 1.55, color: 'rgba(245,245,247,0.6)', fontWeight: 400 }}>
            Meet, book, and connect with people worth your time. Powered by{' '}
            <span style={{ color: 'rgba(245,245,247,0.92)', fontWeight: 600 }}>Book A Sloth</span>, where great bookings begin.
          </div>
        </div>

        {/* ── Right: portrait → @username → stats → CTA ──── */}
        <div style={{ width: 360, flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div style={{
            width: 268, height: 268, borderRadius: '50%', padding: 5,
            background: `conic-gradient(from 140deg, ${C.orange}, ${C.orangeSoft}, ${C.orange})`,
            boxShadow: '0 0 90px -10px rgba(254,81,0,0.5)',
          }}>
            <div style={{ width: '100%', height: '100%', borderRadius: '50%', overflow: 'hidden', background: C.panel2 }}>
              {avatar
                ? <img src={avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : <div style={{ width: '100%', height: '100%', display: 'grid', placeItems: 'center', fontSize: 100, fontWeight: 800, color: C.grey }}>{name.charAt(0)}</div>}
            </div>
          </div>

          {/* @username with sloth mark */}
          {username && (
            <div style={{ marginTop: 20, display: 'flex', alignItems: 'center', gap: 9 }}>
              <img src="/favicon.svg" alt="" style={{ width: 26, height: 26, borderRadius: 6 }}
                   onError={(e) => { e.currentTarget.style.display = 'none'; }} />
              <span style={{ fontSize: 24, fontWeight: 700, color: C.white, letterSpacing: -0.2 }}>@{username}</span>
            </div>
          )}

          {/* Stats / honest new-host line */}
          <div style={{ marginTop: 10, fontSize: 18, color: C.grey, fontWeight: 500 }}>
            {[
              hasRating ? `${reviews} review${reviews === 1 ? '' : 's'}` : null,
              bookings > 0 ? `${compact(bookings)} booked` : null,
              (!hasRating && bookings === 0 && since) ? `New host · since ${since}` : null,
            ].filter(Boolean).join('  ·  ')}
          </div>

          {/* CTA */}
          <div style={{
            marginTop: 22, padding: '15px 30px', borderRadius: 12, background: C.orange,
            color: '#fff', fontSize: 20, fontWeight: 700, letterSpacing: -0.2,
            boxShadow: '0 16px 40px -14px rgba(254,81,0,0.6)',
          }}>Book an Appointment Now</div>
        </div>
      </div>
    </div>
  );
}
