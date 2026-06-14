/**
 * ServiceDetail — public service page at /:username/:slug
 * Sections: Hero · Tabs (Overview, Deliverables, Instructor, FAQ, Reviews) · Sticky sidebar
 */
import { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import DOMPurify from 'dompurify';
import { svcGetPublicByProfile } from '../services/api';
import { applyProfileTheme, isValidHex, DEFAULT_THEME_COLOR } from '../utils/themeUtils';

// Sanitize vendor-supplied rich text before rendering as HTML. Strips <script>,
// event handlers (onerror/onload/…), javascript:/data: URLs, <iframe>, etc.
// SECURITY: long_description is vendor-controlled and shown on a public page —
// rendering it raw is stored XSS against every guest/host who views it.
const sanitizeHtml = (dirty) =>
  DOMPurify.sanitize(String(dirty || ''), { USE_PROFILES: { html: true } });

// ─── Helpers ─────────────────────────────────────────────────────────────────

const fmtDuration = (min) => {
  if (!min) return '—';
  if (min < 60) return `${min} min`;
  const h = Math.floor(min / 60), m = min % 60;
  return m ? `${h}h ${m}m` : `${h}h`;
};

const Stars = ({ avg, count, size = 'sm' }) => {
  const sz = size === 'lg' ? 'w-5 h-5' : 'w-4 h-4';
  return (
    <div className="flex items-center gap-1">
      {[1,2,3,4,5].map(s => (
        <svg key={s} className={`${sz} ${s <= Math.round(avg) ? 'text-amber-400' : 'text-gray-200'}`} fill="currentColor" viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
        </svg>
      ))}
      {count > 0 && <span className="text-xs text-gray-500 ml-1">{avg?.toFixed(1)} ({count})</span>}
    </div>
  );
};

// ─── Tab components ───────────────────────────────────────────────────────────

const OverviewTab = ({ html }) => {
  const [expanded, setExpanded] = useState(false);
  const ref = useRef(null);
  const clean = sanitizeHtml(html);
  const [tall, setTall] = useState(false);

  useEffect(() => {
    if (ref.current) setTall(ref.current.scrollHeight > 320);
  }, [clean]);

  if (!clean) return <p className="text-gray-400 text-sm">No overview provided.</p>;

  return (
    <div className="relative">
      <div
        ref={ref}
        className={`prose prose-sm max-w-none text-gray-700 transition-all duration-300 ${!expanded && tall ? 'max-h-80 overflow-hidden' : ''}`}
        dangerouslySetInnerHTML={{ __html: clean }}
      />
      {!expanded && tall && (
        <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-white to-transparent"/>
      )}
      {tall && (
        <button onClick={() => setExpanded(e => !e)}
          className="mt-3 text-sm font-medium text-primary hover:underline flex items-center gap-1">
          {expanded ? 'Show Less' : 'Show More'}
          <svg className={`w-4 h-4 transition-transform ${expanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7"/>
          </svg>
        </button>
      )}
    </div>
  );
};

const DeliverablesTab = ({ included = [], excluded = [] }) => (
  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
    <div>
      <h3 className="text-sm font-bold text-gray-800 mb-3 flex items-center gap-2">
        <span className="w-5 h-5 rounded-full bg-green-100 text-green-700 flex items-center justify-center text-xs">✓</span>
        What's Included
      </h3>
      {included.length === 0
        ? <p className="text-xs text-gray-400">Not specified</p>
        : <div className="flex flex-wrap gap-2">
            {included.map((item, i) => (
              <span key={i} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-50 border border-green-200 text-green-800 text-xs font-medium">
                <svg className="w-3 h-3 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7"/></svg>
                {item}
              </span>
            ))}
          </div>
      }
    </div>
    <div>
      <h3 className="text-sm font-bold text-gray-800 mb-3 flex items-center gap-2">
        <span className="w-5 h-5 rounded-full bg-red-100 text-red-600 flex items-center justify-center text-xs">✕</span>
        Not Included
      </h3>
      {excluded.length === 0
        ? <p className="text-xs text-gray-400">Not specified</p>
        : <div className="flex flex-wrap gap-2">
            {excluded.map((item, i) => (
              <span key={i} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-50 border border-red-200 text-red-800 text-xs font-medium">
                <svg className="w-3 h-3 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12"/></svg>
                {item}
              </span>
            ))}
          </div>
      }
    </div>
  </div>
);

const InstructorTab = ({ vendor, totalServices }) => {
  if (!vendor?.name) return <p className="text-gray-400 text-sm">No instructor info.</p>;
  return (
    <div className="flex flex-col sm:flex-row gap-5 items-start">
      <div className="flex-shrink-0">
        {vendor.profile_image
          ? <img src={vendor.profile_image} alt={vendor.name} className="w-20 h-20 rounded-2xl object-cover border-2 border-white shadow-md"/>
          : <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center text-3xl font-bold text-primary">{vendor.name.charAt(0)}</div>}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <h3 className="text-lg font-bold text-gray-900">{vendor.name}</h3>
          {vendor.is_verified && (
            <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 24 24">
              <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
          )}
        </div>
        {(vendor.profession || vendor.tagline) && (
          <p className="text-sm text-green-600 font-medium mb-2">{vendor.profession || vendor.tagline}</p>
        )}
        {vendor.bio && <p className="text-sm text-gray-600 mb-3 leading-relaxed">{vendor.bio}</p>}
        <div className="flex flex-wrap gap-4 text-xs text-gray-500 mb-4">
          <span><strong className="text-gray-800">{totalServices}</strong> services</span>
          <span><strong className="text-gray-800">{vendor.total_bookings || 0}</strong> bookings</span>
        </div>
        {vendor.username && (
          <Link to={`/${vendor.username}`}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline">
            Visit Profile
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/></svg>
          </Link>
        )}
      </div>
    </div>
  );
};

const FAQTab = ({ faqs = [] }) => {
  const [open, setOpen] = useState(null);
  if (faqs.length === 0) return <p className="text-gray-400 text-sm">No FAQs provided.</p>;
  return (
    <div className="divide-y divide-gray-100">
      {faqs.map((faq, i) => (
        <div key={i} className="py-4">
          <button onClick={() => setOpen(open === i ? null : i)}
            className="w-full flex items-center justify-between gap-3 text-left">
            <span className="text-sm font-semibold text-gray-800">{faq.question}</span>
            <svg className={`w-5 h-5 flex-shrink-0 text-gray-400 transition-transform ${open === i ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7"/>
            </svg>
          </button>
          {open === i && <p className="mt-3 text-sm text-gray-600 leading-relaxed pr-8">{faq.answer}</p>}
        </div>
      ))}
    </div>
  );
};

const ReviewsTab = ({ reviews = [], avgRating, ratingBreakdown = [] }) => {
  const total = reviews.length;
  return (
    <div>
      {total === 0
        ? <p className="text-gray-400 text-sm">No reviews yet.</p>
        : <>
            {/* Summary */}
            <div className="flex flex-col sm:flex-row gap-6 mb-6 pb-6 border-b">
              <div className="text-center">
                <div className="text-5xl font-black text-gray-900 leading-none">{avgRating?.toFixed(1)}</div>
                <Stars avg={avgRating} count={0} size="lg"/>
                <p className="text-xs text-gray-400 mt-1">{total} review{total !== 1 ? 's' : ''}</p>
              </div>
              <div className="flex-1 space-y-1.5">
                {ratingBreakdown.map(({star, count}) => (
                  <div key={star} className="flex items-center gap-2 text-xs">
                    <span className="w-4 text-gray-500 text-right">{star}</span>
                    <svg className="w-3.5 h-3.5 text-amber-400" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>
                    <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full bg-amber-400 rounded-full" style={{ width: total ? `${(count / total) * 100}%` : '0%' }}/>
                    </div>
                    <span className="w-4 text-gray-400">{count}</span>
                  </div>
                ))}
              </div>
            </div>
            {/* Review list */}
            <div className="space-y-4">
              {reviews.map(r => (
                <div key={r.id} className="flex gap-3">
                  <div className="w-9 h-9 rounded-full bg-primary/10 flex-shrink-0 flex items-center justify-center text-sm font-bold text-primary">
                    {r.profiles?.name?.charAt(0) || '?'}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium">{r.profiles?.name || 'Anonymous'}</span>
                      <Stars avg={r.rating} count={0}/>
                    </div>
                    {r.comment && <p className="text-sm text-gray-600 leading-relaxed">{r.comment}</p>}
                    <p className="text-xs text-gray-400 mt-1">
                      {new Date(r.created_at).toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'})}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </>
      }
    </div>
  );
};

// ─── Booking Card (sticky sidebar on desktop, block on mobile) ────────────────

// Conversion-focused trust signals shown under the CTA.
const TRUST_SIGNALS = [
  { key: 'verified',  label: 'Verified vendor',
    path: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z' },
  { key: 'instant',   label: 'Instant confirmation',
    path: 'M13 10V3L4 14h7v7l9-11h-7z' },
  { key: 'reschedule',label: 'Free reschedule & refund policy',
    path: 'M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15' },
  { key: 'transparent', label: 'Transparent pricing — no hidden fees',
    path: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z' },
];

const BookingCard = ({ service, onBookNow }) => {
  const isFree = service.price === 0;
  return (
    <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
      {/* Thumbnail */}
      {service.thumbnail_url
        ? <img src={service.thumbnail_url} alt={service.title}
            className="w-full aspect-[16/10] object-cover"/>
        : <div className="w-full aspect-[16/10] bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
            <svg className="w-10 h-10 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
          </div>}

      <div className="p-5">
        {/* Price */}
        <div className="flex items-baseline gap-2 mb-1">
          <span className="text-3xl font-black text-gray-900">{isFree ? 'Free' : `₹${service.price}`}</span>
          {!isFree && <span className="text-sm font-medium text-gray-400">/ session</span>}
        </div>
        {/* Secondary pricing / meta */}
        <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-5">
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
          {fmtDuration(service.duration)} · {service.meeting_mode === 'offline' ? 'In-person' : 'Online session'}
        </div>

        {/* Primary CTA */}
        <button onClick={onBookNow}
          className="w-full py-3.5 rounded-xl font-bold text-sm hover:opacity-90 active:opacity-80 transition-opacity"
          style={{ background: 'var(--profile-accent, #FE5100)', color: 'var(--profile-accent-text, #ffffff)' }}>
          Book a Slot
        </button>

        {/* Trust indicators */}
        <ul className="mt-5 pt-5 border-t border-gray-100 space-y-3">
          {TRUST_SIGNALS.map(({ key, label, path }) => (
            <li key={key} className="flex items-start gap-2.5 text-xs text-gray-600">
              <svg className="w-4 h-4 flex-shrink-0 text-green-500 mt-px" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={path}/>
              </svg>
              <span>{label}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────

const TABS = ['Overview', 'Deliverables', 'Instructor', 'FAQ', 'Reviews'];

export default function ServiceDetail() {
  const { profileSlug, serviceSlug } = useParams();
  const navigate  = useNavigate();
  const [data, setData]     = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState('');
  const [tab, setTab]       = useState('Overview');

  useEffect(() => {
    svcGetPublicByProfile(profileSlug, serviceSlug)
      .then(r => {
        setData(r.data);
        // Per-host theme → CSS vars consumed by the Book Slot CTAs
        const v = r.data?.vendor;
        applyProfileTheme(
          document.documentElement,
          isValidHex(v?.theme_color) ? v.theme_color : DEFAULT_THEME_COLOR,
        );
        // SEO — update page title and meta description
        const svc = r.data?.service;
        const vendor = r.data?.vendor;
        if (svc) {
          document.title = `${svc.title}${vendor?.name ? ` with ${vendor.name}` : ''} | Book A Sloth`;
          const metaDesc = document.querySelector('meta[name="description"]');
          if (metaDesc) {
            metaDesc.setAttribute('content', svc.short_description || svc.description
              ? (svc.short_description || svc.description).slice(0, 160)
              : `Book ${svc.title} on Book A Sloth.`);
          }
        }
      })
      .catch(() => setError('Service not found'))
      .finally(() => setLoading(false));
  }, [profileSlug, serviceSlug]);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center text-gray-400">
        <svg className="w-8 h-8 animate-spin mx-auto mb-2" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
        </svg>
        Loading…
      </div>
    </div>
  );

  if (error || !data) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <p className="text-gray-400 text-lg mb-3">{error || 'Service not found'}</p>
        <button onClick={() => navigate(-1)} className="text-primary text-sm hover:underline">Go back</button>
      </div>
    </div>
  );

  const { service, vendor, totalServices, reviews, avgRating, ratingBreakdown } = data;

  const handleBookNow = () => {
    // Navigate to /:profileSlug/booking/:serviceSlug
    const pSlug = vendor?.username || profileSlug;
    if (pSlug && service?.slug) {
      navigate(`/${pSlug}/booking/${service.slug}`);
    }
  };

  const hasFAQs = Array.isArray(service.faqs) && service.faqs.length > 0;
  const hasDeliverables = (service.included_items?.length || 0) + (service.excluded_items?.length || 0) > 0;

  // Hero trust signals (derived from existing data — no schema change)
  const rating      = avgRating || service.rating || 0;
  const reviewCount = reviews?.length || service.total_reviews || 0;
  const bookings    = service.total_bookings || 0;
  // Bestseller heuristic: proven volume + high rating
  const isBestseller = bookings >= 10 && rating >= 4.5;
  const creatorCategory = service.category?.name || service.category_name
    || vendor?.profession || vendor?.tagline || '';

  return (
    <div className="min-h-screen bg-[#f7f5ef]">
      <div className="app-container py-8">
        {/* Back */}
        <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 mb-6 transition-colors">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7"/></svg>
          Back
        </button>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* ── LEFT: Main content ── */}
          <div className="flex-1 min-w-0">

            {/* ── HERO ── premium, creator-focused service info */}
            <section className="bg-white border border-gray-200 rounded-2xl p-6 sm:p-8 shadow-sm mb-6">
              {/* Badges */}
              <div className="flex flex-wrap items-center gap-2 mb-5">
                <span className={`inline-flex items-center text-xs px-2.5 py-1 rounded-full font-medium ${service.meeting_mode === 'offline' ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700'}`}>
                  {service.meeting_mode === 'offline' ? '📍 In-person' : '🌐 Online'}
                </span>
                {isBestseller && (
                  <span className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-semibold bg-amber-100 text-amber-800">
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>
                    Bestseller
                  </span>
                )}
              </div>

              {/* Title */}
              <h1 className="text-3xl sm:text-4xl font-black text-gray-900 mb-4 leading-[1.12] tracking-tight">{service.title}</h1>

              {/* Short description */}
              {service.short_description && (
                <p className="text-base sm:text-lg text-gray-600 mb-6 leading-relaxed max-w-2xl">{service.short_description}</p>
              )}

              {/* Creator */}
              {vendor?.name && (
                <div className="flex items-center gap-3 mb-6">
                  {vendor.profile_image
                    ? <img src={vendor.profile_image} alt={vendor.name} className="w-11 h-11 rounded-full object-cover border border-gray-100"/>
                    : <div className="w-11 h-11 rounded-full bg-primary/10 flex items-center justify-center text-base font-bold text-primary">{vendor.name.charAt(0)}</div>}
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <Link to={`/${vendor.username}`} className="text-sm font-semibold text-gray-900 hover:text-primary truncate">{vendor.name}</Link>
                      {vendor.is_verified && (
                        <svg className="w-4 h-4 flex-shrink-0 text-green-500" fill="currentColor" viewBox="0 0 24 24"><path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                      )}
                    </div>
                    {creatorCategory && <p className="text-xs text-gray-500 truncate">{creatorCategory}</p>}
                  </div>
                </div>
              )}

              {/* Trust indicators */}
              <div className="flex flex-wrap items-center gap-x-6 gap-y-3 pt-5 border-t border-gray-100 text-sm">
                <div className="flex items-center gap-2">
                  <Stars avg={rating} count={0}/>
                  <span className="font-semibold text-gray-900">{rating ? rating.toFixed(1) : 'New'}</span>
                  <span className="text-gray-400">({reviewCount} {reviewCount === 1 ? 'review' : 'reviews'})</span>
                </div>
                {bookings > 0 && (
                  <span className="flex items-center gap-1.5 text-gray-500">
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
                    <strong className="font-semibold text-gray-900">{bookings}</strong> booked
                  </span>
                )}
                <span className="flex items-center gap-1.5 text-gray-500">
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
                  {fmtDuration(service.duration)}
                </span>
              </div>
            </section>

            {/* Mobile: booking card as a normal block below the hero */}
            <div className="lg:hidden mb-6">
              <BookingCard service={service} onBookNow={handleBookNow}/>
            </div>

            {/* Important note */}
            {service.important_note && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6 flex gap-2">
                <span className="text-amber-500 flex-shrink-0">⚠️</span>
                <p className="text-sm text-amber-800 whitespace-pre-line">{service.important_note}</p>
              </div>
            )}

            {/* Tabs */}
            <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
              {/* Tab bar */}
              <div className="flex overflow-x-auto border-b border-gray-100 scrollbar-hide">
                {TABS.map(t => (
                  <button key={t} onClick={() => setTab(t)}
                    className={`px-5 py-3.5 text-sm font-medium whitespace-nowrap flex-shrink-0 transition-colors border-b-2 ${tab === t ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-800'}`}>
                    {t}
                    {t === 'Reviews' && (reviews?.length || 0) > 0 && (
                      <span className="ml-1.5 text-xs bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full">{reviews.length}</span>
                    )}
                    {t === 'FAQ' && hasFAQs && (
                      <span className="ml-1.5 text-xs bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded-full">{service.faqs.length}</span>
                    )}
                  </button>
                ))}
              </div>

              {/* Tab content */}
              <div className="p-6">
                {tab === 'Overview'     && <OverviewTab html={service.long_description || service.description}/>}
                {tab === 'Deliverables' && <DeliverablesTab included={service.included_items} excluded={service.excluded_items}/>}
                {tab === 'Instructor'   && <InstructorTab vendor={vendor} totalServices={totalServices}/>}
                {tab === 'FAQ'          && <FAQTab faqs={service.faqs}/>}
                {tab === 'Reviews'      && <ReviewsTab reviews={reviews} avgRating={avgRating} ratingBreakdown={ratingBreakdown}/>}
              </div>
            </div>
          </div>

          {/* ── RIGHT: Sticky sidebar ── */}
          <div className="hidden lg:block lg:w-[320px] flex-shrink-0">
            <div className="sticky top-24">
              <BookingCard service={service} onBookNow={handleBookNow}/>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
