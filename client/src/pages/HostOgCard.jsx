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
    width: 38, height: 38, borderRadius: '50%', background: C.orange,
    color: '#fff', fontSize: 21, fontWeight: 700,
  }}>✓</span>
);

// Faint booking-themed backdrop: a big grid + scattered product icons (calendar,
// clock, WhatsApp, rupee, video) at very low opacity — a whisper of branding
// behind the content, never competing with it.
const BrandBackdrop = () => {
  const S = { fill: 'none', stroke: 'rgba(255,255,255,0.05)', strokeWidth: 4, strokeLinecap: 'round', strokeLinejoin: 'round' };
  return (
    <svg width={OG_W} height={OG_H} viewBox={`0 0 ${OG_W} ${OG_H}`} style={{ position: 'absolute', inset: 0 }} aria-hidden="true">
      {/* big grid */}
      <g stroke="rgba(255,255,255,0.022)" strokeWidth="2">
        {[210, 420, 630, 840, 1050].map((x) => <line key={`v${x}`} x1={x} y1="0" x2={x} y2={OG_H} />)}
        {[157, 314, 471].map((y) => <line key={`h${y}`} x1="0" y1={y} x2={OG_W} y2={y} />)}
      </g>
      {/* calendar */}
      <g transform="translate(96 92) scale(1.1)" {...S}>
        <rect x="0" y="10" width="96" height="82" rx="10" />
        <line x1="0" y1="34" x2="96" y2="34" /><line x1="26" y1="0" x2="26" y2="20" /><line x1="70" y1="0" x2="70" y2="20" />
        <rect x="16" y="48" width="16" height="14" rx="3" /><rect x="42" y="48" width="16" height="14" rx="3" /><rect x="68" y="48" width="14" height="14" rx="3" />
      </g>
      {/* clock */}
      <g transform="translate(520 430) scale(1.15)" {...S}>
        <circle cx="48" cy="48" r="46" /><line x1="48" y1="48" x2="48" y2="20" /><line x1="48" y1="48" x2="70" y2="56" />
      </g>
      {/* WhatsApp-ish chat bubble */}
      <g transform="translate(1000 96) scale(1.05)" {...S}>
        <path d="M18 20 h64 a12 12 0 0 1 12 12 v30 a12 12 0 0 1 -12 12 h-42 l-18 16 v-16 a12 12 0 0 1 -6 -10 v-32 a12 12 0 0 1 12 -12 z" />
      </g>
      {/* rupee */}
      <text x="250" y="520" fontFamily="Poppins, sans-serif" fontSize="120" fontWeight="700" fill="rgba(255,255,255,0.045)">₹</text>
      {/* video camera */}
      <g transform="translate(690 74) scale(1.0)" {...S}>
        <rect x="0" y="18" width="70" height="54" rx="10" /><path d="M74 34 L100 18 V72 L74 56 Z" />
      </g>
      {/* small clock, lower-left */}
      <g transform="translate(60 350) scale(0.8)" {...S}>
        <circle cx="40" cy="40" r="38" /><line x1="40" y1="40" x2="40" y2="18" /><line x1="40" y1="40" x2="56" y2="46" />
      </g>
    </svg>
  );
};

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

  const proofText = [
    hasRating ? `${reviews} review${reviews === 1 ? '' : 's'}` : null,
    bookings > 0 ? `${compact(bookings)} booked` : null,
    (!hasRating && bookings === 0 && since) ? `New host · since ${since}` : null,
  ].filter(Boolean).join('  ·  ');

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
      <BrandBackdrop />

      {/* Brand — logo mark + domain, top-left */}
      <div style={{ position: 'absolute', top: 48, left: 72, display: 'flex', alignItems: 'center', gap: 15 }}>
        <img src="https://company-assets.bookasloth.in/images/email/footer-logo.png" alt=""
             style={{ width: 54, height: 54, borderRadius: '50%', objectFit: 'cover', background: '#fff' }}
             onError={(e) => { e.currentTarget.style.display = 'none'; }} />
        <span style={{ fontSize: 25, fontWeight: 700, color: 'rgba(245,245,247,0.9)', letterSpacing: -0.3 }}>www.bookasloth.com</span>
      </div>

      {/* Centre band: identity (left) + portrait stack (right). Bottom-aligned so
          the branding line's last row sits level with the CTA button. */}
      <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'flex-end', padding: '128px 72px 60px', gap: 60 }}>
        {/* ── Left: identity + proof + branding ─────────── */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Name — the verified tick flows inline right after the last character,
              no fixed offset, so it always sits at the name's end whatever the length. */}
          <div style={{
            fontSize: name.length > 21 ? 48 : name.length > 14 ? 56 : name.length > 10 ? 66 : 76,
            fontWeight: 800, color: C.white, lineHeight: 1.08, letterSpacing: -2,
          }}>
            {name}
            {verified && <span style={{ display: 'inline-flex', verticalAlign: 'middle', marginLeft: 16 }}><VerifiedTick /></span>}
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

          {/* Proof line — directly under the profession */}
          {proofText && (
            <div style={{ marginTop: 12, fontSize: 20, color: C.grey, fontWeight: 500 }}>{proofText}</div>
          )}

          {/* Branding line — fills the space below */}
          <div style={{ marginTop: 26, maxWidth: 560, fontSize: 22, lineHeight: 1.55, color: 'rgba(245,245,247,0.6)', fontWeight: 400 }}>
            Meet, book, and connect with people worth your time. Powered by{' '}
            <span style={{ color: 'rgba(245,245,247,0.92)', fontWeight: 600 }}>Book A Sloth</span>, where great bookings begin.
          </div>
        </div>

        {/* ── Right: portrait → @username → CTA ──────────── */}
        <div style={{ width: 360, flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div style={{
            width: 268, height: 268, borderRadius: '50%', padding: 5,
            background: `conic-gradient(from 140deg, ${C.orange}, ${C.orangeSoft}, ${C.orange})`,
            boxShadow: '0 0 90px -10px rgba(254,81,0,0.25)', // glow halved
          }}>
            <div style={{ width: '100%', height: '100%', borderRadius: '50%', overflow: 'hidden', background: C.panel2 }}>
              {avatar
                ? <img src={avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : <div style={{ width: '100%', height: '100%', display: 'grid', placeItems: 'center', fontSize: 100, fontWeight: 800, color: C.grey }}>{name.charAt(0)}</div>}
            </div>
          </div>

          {/* @username */}
          {username && (
            <div style={{ marginTop: 22, fontSize: 24, fontWeight: 700, color: C.white, letterSpacing: -0.2 }}>
              @{username}
            </div>
          )}

          {/* CTA — glow reduced ~90% (a hair of depth, no orange bloom) */}
          <div style={{
            marginTop: 22, padding: '15px 30px', borderRadius: 12, background: C.orange,
            color: '#fff', fontSize: 20, fontWeight: 700, letterSpacing: -0.2,
            boxShadow: '0 3px 8px -5px rgba(0,0,0,0.4)',
          }}>Book an Appointment Now</div>
        </div>
      </div>
    </div>
  );
}
