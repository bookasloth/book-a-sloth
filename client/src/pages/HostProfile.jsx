import { useState, useEffect, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import { getHostProfile, getHostReviews, getHostProducts } from "../services/api";
import BrandPreloader from "../components/preloader/BrandPreloader";
import {
  DEFAULT_THEME_COLOR,
  getContrastColor,
  getPlanBorderColor,
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

// ─── Social Icon SVGs ─────────────────────────────────────────────────────────
const SOCIAL_ICONS = {
  instagram: <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />,
  youtube:   <path d="M23.495 6.205a3.007 3.007 0 00-2.088-2.088c-1.87-.501-9.396-.501-9.396-.501s-7.507-.01-9.396.501A3.007 3.007 0 00.527 6.205a31.247 31.247 0 00-.522 5.805 31.247 31.247 0 00.522 5.783 3.007 3.007 0 002.088 2.088c1.868.502 9.396.502 9.396.502s7.506 0 9.396-.502a3.007 3.007 0 002.088-2.088 31.247 31.247 0 00.5-5.783 31.247 31.247 0 00-.5-5.805zM9.609 15.601V8.408l6.264 3.602z" />,
  linkedin:  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />,
  facebook:  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />,
  twitter:   <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />,
  whatsapp:  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />,
  website:   <><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" /></>,
  github:    <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />,
  email:     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />,
};
const STROKE_ICONS = new Set(['website', 'email']);

const SocialIcon = ({ platform, href }) => {
  const brandColor = SOCIAL_BRAND_COLORS[platform] || '#374151';
  const icon = SOCIAL_ICONS[platform];
  if (!icon || !href) return null;
  const isStroke = STROKE_ICONS.has(platform);
  return (
    <a href={href} target="_blank" rel="noreferrer"
      className="flex items-center justify-center flex-shrink-0 transition-opacity hover:opacity-80"
      style={{ width: 36, height: 36, borderRadius: '50%', background: brandColor }}
      title={platform.charAt(0).toUpperCase() + platform.slice(1)}>
      <svg className="w-4 h-4" style={{ color: '#ffffff' }}
        fill={isStroke ? 'none' : 'currentColor'}
        stroke={isStroke ? 'currentColor' : 'none'}
        viewBox="0 0 24 24">
        {icon}
      </svg>
    </a>
  );
};

// ─── Badge (emoji with tooltip) ───────────────────────────────────────────────
const Badge = ({ badge }) => {
  const [tip, setTip] = useState(false);
  const icon  = badge.icon  || badge.emoji || '🏅';
  const label = badge.label || badge.name  || 'Badge';
  return (
    <div className="relative">
      <div
        onMouseEnter={() => setTip(true)}
        onMouseLeave={() => setTip(false)}
        className="flex items-center justify-center cursor-default select-none transition-transform hover:scale-110"
        style={{ width: 40, height: 40, borderRadius: 12, background: '#F4F4F4', fontSize: 20 }}>
        {icon}
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
        <div className="text-xs font-semibold" style={{ color: C.text }}>{val}</div>
        <div className="text-[10px] mt-0.5" style={{ color: C.muted }}>{lbl}</div>
      </div>
    ))}
  </div>
);

// ─── Service Card ──────────────────────────────────────────────────────────────
const ServiceCard = ({ service: s, profileSlug, viewMode }) => {
  const desc      = s.short_description || s.description || '';
  const detailUrl = s.slug ? `/${profileSlug}/${s.slug}` : null;
  const bookUrl   = s.slug ? `/${profileSlug}/booking/${s.slug}` : null;
  const tag       = getServiceTag(s);
  const tagStyle  = tag ? TAG_STYLES[tag] : null;

  if (viewMode === 'list') {
    return (
      <div className="flex items-center gap-4 bg-white rounded-xl px-5 py-4 transition-shadow hover:shadow-sm"
        style={{ border: `1px solid ${C.border}` }}>
        <div className="flex-1 min-w-0">
          {detailUrl
            ? <Link to={detailUrl} className="font-semibold text-sm hover:opacity-60 transition-opacity" style={{ color: C.text }}>{s.title}</Link>
            : <span className="font-semibold text-sm" style={{ color: C.text }}>{s.title}</span>}
          <div className="grid grid-cols-3 gap-3 mt-2">
            {[
              { val: s.price === 0 ? 'Free' : `₹${s.price}`, lbl: 'Price' },
              { val: `${s.duration} min`,                      lbl: 'Duration' },
              { val: s.meeting_mode === 'offline' ? 'In-person' : 'Online', lbl: 'Mode' },
            ].map(({ val, lbl }) => (
              <div key={lbl}>
                <div className="text-xs font-semibold" style={{ color: C.text }}>{val}</div>
                <div className="text-[10px] mt-0.5" style={{ color: C.muted }}>{lbl}</div>
              </div>
            ))}
          </div>
        </div>
        {bookUrl && (
          <Link to={bookUrl}
            className="flex-shrink-0 rounded-lg text-xs font-semibold flex items-center transition-opacity hover:opacity-80"
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
      style={{ border: `1px solid ${C.border}`, height: 250, padding: '20px 20px 18px' }}>

      {/* Title + tag */}
      <div className="flex items-start justify-between gap-2 mb-2">
        {detailUrl
          ? <Link to={detailUrl} className="font-semibold text-sm leading-snug hover:opacity-60 transition-opacity line-clamp-2 flex-1" style={{ color: C.text }}>{s.title}</Link>
          : <span className="font-semibold text-sm leading-snug line-clamp-2 flex-1" style={{ color: C.text }}>{s.title}</span>}
        {tagStyle && (
          <span className="flex-shrink-0 text-[10px] font-semibold px-2 py-0.5 rounded-full"
            style={{ background: tagStyle.bg, color: tagStyle.color }}>
            {tag}
          </span>
        )}
      </div>

      {/* Description */}
      <p className="text-xs leading-relaxed line-clamp-2 flex-1 mb-3" style={{ color: C.secondary }}>
        {desc || ' '}
      </p>

      {/* Meta */}
      <MetaRow price={s.price} duration={s.duration} mode={s.meeting_mode} />

      {/* Footer */}
      <div className="flex items-center justify-between mt-3">
        {detailUrl
          ? <Link to={detailUrl} className="text-xs font-medium transition-opacity hover:opacity-60" style={{ color: C.secondary }}>View Details →</Link>
          : <span />}
        {bookUrl && (
          <Link to={bookUrl}
            className="rounded-lg text-xs font-semibold flex items-center transition-opacity hover:opacity-80"
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
        <Link to={`/${profileSlug}/product/${p.id}`}
          className="rounded-lg text-xs font-semibold flex items-center transition-opacity hover:opacity-80"
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
  const pageRef         = useRef(null);
  const [host,        setHost]        = useState(null);
  const [services,    setServices]    = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState('');
  const [viewMode,    setViewMode]    = useState('grid');
  const [reviewData,  setReviewData]  = useState({ reviews: [], count: 0, avg: 0 });
  const [showReviews, setShowReviews] = useState(false);
  const [products,    setProducts]    = useState([]);

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await getHostProfile(profileSlug);
        setHost(data.host);
        setServices(data.services || []);
        getHostReviews(profileSlug).then(r => setReviewData(r.data)).catch(() => {});
        getHostProducts(profileSlug).then(r => setProducts(r.data || [])).catch(() => {});
      } catch (err) {
        setError(err.response?.status === 404 ? 'Creator not found' : 'Something went wrong');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [profileSlug]);

  useEffect(() => {
    if (!host) return;
    document.title = host.name
      ? `${host.name}${host.profession ? ` — ${host.profession}` : ''} | Book A Sloth`
      : 'Book A Sloth';
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) metaDesc.setAttribute('content', host.bio ? host.bio.slice(0, 160) : `Book sessions with ${host.name}.`);
  }, [host]);

  // Inject --profile-accent and --profile-accent-text CSS variables so all
  // themed elements on this page pick up the host's chosen color.
  useEffect(() => {
    if (!host || !pageRef.current) return;
    const color = isValidHex(host.theme_color) ? host.theme_color : DEFAULT_THEME_COLOR;
    applyProfileTheme(pageRef.current, color);
  }, [host]);

  // Derived values are null-safe: the component renders the preloader while
  // host is still loading, so these run before host exists.
  const tc          = host && isValidHex(host.theme_color) ? host.theme_color : DEFAULT_THEME_COLOR;
  const borderColor = getPlanBorderColor(host?.plan || 'explorer');
  const social      = host?.social_links || {};
  const badges      = Array.isArray(host?.badges) ? host.badges : [];

  const SOCIAL_ORDER = ['instagram', 'youtube', 'linkedin', 'facebook', 'twitter', 'whatsapp', 'website', 'github', 'email'];
  const socialLinks  = SOCIAL_ORDER
    .filter(k => social[k])
    .map(k => ({ key: k, href: k === 'email' ? `mailto:${social[k]}` : social[k] }));

  const stats = [
    { val: services.length,                                               lbl: 'Services' },
    { val: reviewData.avg > 0 ? `${reviewData.avg.toFixed(1)}★` : '—',   lbl: 'Rating'   },
    { val: reviewData.count > 0 ? reviewData.count : '—',                 lbl: 'Reviews'  },
  ];

  return (
    <>
      <BrandPreloader
        variant="profile"
        ready={!loading && !!host && !error}
        profileName={host?.name}
        accentColor={tc}
      />

      {error ? (
        <div className="min-h-screen flex items-center justify-center" style={{ background: C.bg }}>
          <div className="text-center">
            <p className="text-lg" style={{ color: C.secondary }}>{error}</p>
            <Link to="/" className="mt-4 inline-block text-sm hover:underline" style={{ color: C.text }}>← Back to home</Link>
          </div>
        </div>
      ) : !host ? null : (
    <div ref={pageRef} className="min-h-screen" style={{ background: C.bg, paddingBottom: 64 }}>

      {host.is_verified === false && (
        <div className="px-4 py-2 text-center text-sm"
          style={{ background: '#FFFBEB', borderBottom: '1px solid #FDE68A', color: '#92400E' }}>
          ⚠️ This creator's account is pending admin verification.
        </div>
      )}

      <div className="app-container pt-8">
        <div className="flex flex-col lg:flex-row gap-6 items-start">

          {/* ── LEFT SIDEBAR ────────────────────────────────────────────── */}
          <div className="w-full lg:flex-shrink-0 lg:sticky lg:top-24"
            style={{ minWidth: 350, maxWidth: 420 }}>

            <div className="overflow-hidden rounded-2xl"
              style={{ background: C.card, border: `1px solid ${C.border}` }}>

              {/* Cover — 180px, rounded top only */}
              <div className="relative overflow-hidden"
                style={{
                  height: 180,
                  borderRadius: '16px 16px 0 0',
                  background: host.cover_image ? undefined : `linear-gradient(135deg, ${tc}33, ${tc}88)`,
                }}>
                {host.cover_image && (
                  <img src={host.cover_image} alt="" className="w-full h-full object-cover" />
                )}
              </div>

              {/* Profile photo — 100×100 square, overlapping cover */}
              <div className="flex justify-center" style={{ marginTop: -50, position: 'relative' }}>
                <div style={{
                  width: 100, height: 100,
                  borderRadius: 12,
                  border: `3px solid ${C.card}`,
                  outline: `2px solid ${borderColor}`,
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
                {host.google_calendar_connected && (
                  <span style={{
                    position: 'absolute', bottom: 4, right: 'calc(50% - 60px)',
                    width: 14, height: 14, borderRadius: '50%',
                    background: '#22C55E', border: `2px solid ${C.card}`,
                  }} />
                )}
              </div>

              {/* Profile info + all sections */}
              <div className="px-6 pb-6 pt-4 text-center">

                {/* Name */}
                <h1 className="text-xl font-bold mt-1" style={{ color: C.text }}>{host.name}</h1>

                {/* Profession */}
                {(host.profession || host.tagline) && (
                  <p className="text-sm font-medium mt-0.5" style={{ color: C.secondary }}>
                    {host.profession || host.tagline}
                  </p>
                )}

                {/* Rating + Available now */}
                <div className="flex flex-wrap items-center justify-center gap-3 mt-2">
                  {reviewData.avg > 0 && <Stars avg={reviewData.avg} count={reviewData.count} />}
                  {host.google_calendar_connected && (
                    <span className="flex items-center gap-1 text-xs font-medium" style={{ color: '#16A34A' }}>
                      <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#16A34A', display: 'inline-block' }} />
                      Available now
                    </span>
                  )}
                </div>

                {/* Bio — 3 lines max */}
                {host.bio && (
                  <p className="text-sm leading-relaxed mt-3 line-clamp-3 text-left" style={{ color: C.secondary }}>
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

                {/* Stats — 3 columns, no cards */}
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

          {/* ── RIGHT ───────────────────────────────────────────────────── */}
          <div className="flex-1 min-w-0">

            {/* Header row */}
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold" style={{ color: C.text }}>Services</h2>

              {/* Grid / List toggle */}
              <div className="flex rounded-lg overflow-hidden" style={{ border: `1px solid ${C.border}`, background: C.card }}>
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
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium capitalize transition-colors"
                    style={viewMode === mode
                      ? { background: C.text, color: C.btnText }
                      : { color: C.secondary }}>
                    {icon}{mode}
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
