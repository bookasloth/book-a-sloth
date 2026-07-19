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

const Stat = ({ icon, value, label }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <span style={{ fontSize: 26 }}>{icon}</span>
      <span style={{ fontSize: 30, fontWeight: 700, color: C.white, lineHeight: 1 }}>{value}</span>
    </div>
    <span style={{ fontSize: 15, color: C.grey, letterSpacing: 0.2 }}>{label}</span>
  </div>
);

const TrustLine = ({ icon, text }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 12, color: C.white, fontSize: 19 }}>
    <span style={{ fontSize: 20, opacity: 0.9 }}>{icon}</span>
    <span>{text}</span>
  </div>
);

export default function HostOgCard() {
  const [params] = useSearchParams();
  useHideChrome();

  const name = params.get('name') || 'Book A Sloth Host';
  const profession = params.get('profession') || '';
  const bio = params.get('bio') || '';
  const username = params.get('username') || '';
  const avatar = params.get('avatar') || '';
  const verified = params.get('verified') === '1';
  const online = params.get('online') === '1';
  const meet = params.get('meet') === '1';

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

      {/* Dotted-grid texture */}
      <div style={{
        position: 'absolute', inset: 0, opacity: 0.4,
        backgroundImage: 'radial-gradient(rgba(255,255,255,0.05) 1px, transparent 1px)',
        backgroundSize: '26px 26px',
      }} />

      {/* Inner framed card */}
      <div style={{
        position: 'absolute', inset: 28, borderRadius: 24, overflow: 'hidden',
        border: `1px solid ${C.line}`,
        boxShadow: '0 0 0 1px rgba(254,81,0,0.06), 0 40px 120px -40px rgba(254,81,0,0.25)',
        background: 'linear-gradient(180deg, rgba(255,255,255,0.02), rgba(255,255,255,0))',
        display: 'flex', flexDirection: 'column',
      }}>
        <div style={{ flex: 1, minHeight: 0, display: 'flex', padding: '38px 52px 26px' }}>
          {/* ── Left content ─────────────────────────────── */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', paddingRight: 40 }}>
            {/* Brand */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <img src="/favicon.svg" alt="" style={{ width: 40, height: 40, borderRadius: 9 }}
                   onError={(e) => { e.currentTarget.style.display = 'none'; }} />
              <span style={{ fontSize: 25, fontWeight: 700, color: C.white, letterSpacing: -0.3 }}>Book A Sloth</span>
            </div>

            {/* Verified pill */}
            {verified && (
              <div style={{
                marginTop: 22, alignSelf: 'flex-start', display: 'flex', alignItems: 'center', gap: 8,
                background: 'rgba(254,81,0,0.14)', color: C.orangeSoft,
                padding: '7px 14px', borderRadius: 999, fontSize: 15, fontWeight: 600, letterSpacing: 0.4,
              }}>
                <span style={{ fontSize: 16 }}>✔</span> VERIFIED HOST
              </div>
            )}

            {/* Name */}
            <div style={{
              marginTop: verified ? 14 : 22, fontSize: name.length > 20 ? 52 : name.length > 13 ? 60 : 70,
              fontWeight: 800, color: C.white, lineHeight: 1.02, letterSpacing: -1.5,
            }}>{name}</div>

            {/* Profession */}
            {profession && (
              <div style={{ marginTop: 10, fontSize: 30, fontWeight: 600, color: C.orange, letterSpacing: -0.3 }}>
                {profession}
              </div>
            )}

            {/* Bio (2-line clamp) */}
            {bio && (
              <div style={{
                marginTop: 16, fontSize: 20, lineHeight: 1.4, color: 'rgba(245,245,247,0.72)',
                maxHeight: 56, overflow: 'hidden',
                display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
              }}>{bio}</div>
            )}

            <div style={{ flex: 1 }} />

            {/* Stats */}
            <div style={{ display: 'flex', gap: 46, marginBottom: 26 }}>
              <Stat icon="⭐" value={hasRating ? rating.toFixed(1) : 'New'}
                    label={hasRating ? `${reviews} Reviews` : 'Just launched'} />
              <Stat icon="📅" value={bookings > 0 ? compact(bookings) : '—'} label="Bookings" />
              {since && <Stat icon="🌱" value={since} label="Member since" />}
            </div>

            {/* CTA row */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{
                display: 'flex', alignItems: 'center', gap: 8,
                border: `1px solid ${C.line}`, borderRadius: 10, padding: '13px 20px',
                color: C.white, fontSize: 17, fontWeight: 600, background: 'rgba(255,255,255,0.03)',
              }}>📅 Book Instantly</div>
              {username && (
                <div style={{
                  borderRadius: 10, padding: '13px 22px', background: C.orange,
                  color: '#fff', fontSize: 17, fontWeight: 700,
                }}>bookasloth.com/{username}</div>
              )}
            </div>
          </div>

          {/* ── Right panel: avatar + trust ──────────────── */}
          <div style={{ width: 340, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-start' }}>
            <div style={{
              width: 250, height: 250, borderRadius: '50%', padding: 5,
              background: `conic-gradient(from 140deg, ${C.orange}, ${C.orangeSoft}, ${C.orange})`,
              boxShadow: '0 0 60px -12px rgba(254,81,0,0.55)',
            }}>
              <div style={{ width: '100%', height: '100%', borderRadius: '50%', overflow: 'hidden', background: C.panel2 }}>
                {avatar
                  ? <img src={avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  : <div style={{ width: '100%', height: '100%', display: 'grid', placeItems: 'center', fontSize: 90, fontWeight: 800, color: C.grey }}>{name.charAt(0)}</div>}
              </div>
            </div>

            <div style={{ marginTop: 34, display: 'flex', flexDirection: 'column', gap: 18, alignSelf: 'stretch', paddingLeft: 14 }}>
              {online && <TrustLine icon="🌐" text="Available Online" />}
              {meet && <TrustLine icon="🎥" text="Google Meet" />}
              <TrustLine icon="🛡️" text="Trusted & Verified" />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{
          borderTop: `1px solid ${C.line}`, padding: '18px 52px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          color: C.grey, fontSize: 17,
        }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <img src="/favicon.svg" alt="" style={{ width: 22, height: 22, borderRadius: 5 }}
                 onError={(e) => { e.currentTarget.style.display = 'none'; }} />
            The simplest way to book the best.
          </span>
          {/* Inline tricolour, not the 🇮🇳 flag emoji — headless Chrome can't render
              regional-indicator glyphs, and the screenshot is final (shows "IN"). */}
          <span style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
            Made in India
            <span style={{ display: 'inline-flex', flexDirection: 'column', width: 22, height: 15, borderRadius: 2, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.15)' }}>
              <span style={{ flex: 1, background: '#FF9933' }} />
              <span style={{ flex: 1, background: '#FFFFFF' }} />
              <span style={{ flex: 1, background: '#138808' }} />
            </span>
          </span>
        </div>
      </div>
    </div>
  );
}
