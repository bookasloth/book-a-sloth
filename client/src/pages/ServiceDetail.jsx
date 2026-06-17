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

// ─── Social icons — outline (linear) set, monochrome ──────────────────────────
const SOCIAL_ICONS = {
  instagram: <><rect x="2" y="2" width="20" height="20" rx="5" ry="5" /><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" /><line x1="17.5" y1="6.5" x2="17.51" y2="6.5" /></>,
  youtube: <><path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z" /><polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02" /></>,
  linkedin: <><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" /><rect x="2" y="9" width="4" height="12" /><circle cx="4" cy="4" r="2" /></>,
  facebook: <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />,
  twitter:  <path d="M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z" />,
  whatsapp: <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />,
  website: <><circle cx="12" cy="12" r="10" /><line x1="2" y1="12" x2="22" y2="12" /><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" /></>,
  github: <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22" />,
  email: <><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22,6 12,13 2,6" /></>,
};
const SOCIAL_ORDER = ['instagram', 'youtube', 'linkedin', 'facebook', 'twitter', 'whatsapp', 'website', 'github', 'email'];

const SocialIcon = ({ platform, href }) => {
  const icon = SOCIAL_ICONS[platform];
  if (!icon || !href) return null;
  return (
    <a href={href} target="_blank" rel="noreferrer"
      className="flex items-center justify-center flex-shrink-0 text-gray-500 border border-gray-200 rounded-lg hover:text-gray-900 hover:border-gray-300 hover:bg-gray-50 transition-colors"
      style={{ width: 34, height: 34 }}
      title={platform.charAt(0).toUpperCase() + platform.slice(1)}>
      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
        {icon}
      </svg>
    </a>
  );
};

// Service-meta label for the booking card — "30 Minutes", "1h 30m", etc.
const fmtMetaDuration = (min) => {
  if (!min) return '—';
  if (min < 60) return `${min} Minutes`;
  return fmtDuration(min);
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
];

const BookingCard = ({ service, onBookNow, bookingFee = 0 }) => {
  const isFree = service.price === 0;
  const [feeOpen, setFeeOpen] = useState(false);
  const [btnHover, setBtnHover] = useState(false);

  return (
    <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
      {/* Thumbnail */}
      {service.thumbnail_url
        ? <img src={service.thumbnail_url} alt={service.title} className="w-full aspect-[16/10] object-cover"/>
        : <div className="w-full aspect-[16/10] bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
            <svg className="w-10 h-10 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 16M14 8h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
            </svg>
          </div>}
      <div className="p-5">
        {/* Price + booking fee on one line */}
        <div className="relative flex items-baseline gap-2 mt-2 mb-5">
          <div className="text-3xl font-black text-gray-900 leading-none">{isFree ? 'Free' : `₹${service.price}`}</div>
          {!isFree && bookingFee > 0 && (
            <button type="button" onClick={() => setFeeOpen(o => !o)}
              className="inline-flex items-center gap-0.5 text-xs font-medium text-gray-500 hover:text-gray-700 transition-colors">
              <span>+ ₹{bookingFee} Booking Charges</span>
              <svg className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="9" strokeWidth={1.6}/><path strokeWidth={1.8} strokeLinecap="round" d="M12 16v-4M12 8.5h.01"/>
              </svg>
            </button>
          )}
          {!isFree && bookingFee > 0 && feeOpen && (
            <>
              <button type="button" aria-hidden tabIndex={-1}
                className="fixed inset-0 z-10 cursor-default" onClick={() => setFeeOpen(false)}/>
              <div className="absolute z-20 left-0 top-full mt-2 w-64 rounded-xl bg-gray-900 text-white text-xs leading-relaxed p-3 shadow-lg">
                <span className="absolute -top-1.5 left-6 w-3 h-3 rotate-45 bg-gray-900"/>
                This fee helps us operate and improve our platform, delivering a seamless experience.
              </div>
            </>
          )}
        </div>

        {/* Primary CTA */}
        <button onClick={onBookNow}
          onMouseEnter={() => setBtnHover(true)}
          onMouseLeave={() => setBtnHover(false)}
          className="btn w-full py-3.5 font-bold text-sm transition-colors"
          style={{
            background: 'var(--profile-accent, #FE5100)',
            color: btnHover ? '#000000' : 'var(--profile-accent-text, #ffffff)',
          }}>
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

// ─── Profile Card (creator summary — sits below the booking card) ─────────────
// Premium, vertical layout distinct from the InstructorTab. Excludes bio.
const ProfileCard = ({ vendor, rating, reviewCount, bookings }) => {
  const [btnHover, setBtnHover] = useState(false);
  if (!vendor?.name) return null;

  const expertise = [vendor.profession, vendor.tagline]
    .filter(Boolean)
    .filter((v, i, a) => a.indexOf(v) === i);

  const accent = 'var(--profile-accent, #FE5100)';

  return (
    <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
      <div className="px-5 pb-5 pt-5 text-center">
        {/* Photo — centered */}
        <div className="flex justify-center mb-3">
          <div className="w-20 h-20 rounded-2xl border-[3px] border-white shadow-sm overflow-hidden bg-white">
            {vendor.profile_image
              ? <img src={vendor.profile_image} alt={vendor.name} className="w-full h-full object-cover"/>
              : <div className="w-full h-full flex items-center justify-center text-2xl font-bold"
                  style={{ background: `color-mix(in srgb, ${accent} 12%, white)`, color: accent }}>
                  {vendor.name.charAt(0).toUpperCase()}
                </div>}
          </div>
        </div>

        {/* Name + verified — centered */}
        <div className="flex items-center justify-center gap-1.5">
          <h3 className="text-base font-bold text-gray-900">{vendor.name}</h3>
          {vendor.is_verified && (
            <svg className="w-4 h-4 flex-shrink-0 text-green-500" fill="currentColor" viewBox="0 0 24 24">
              <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
          )}
        </div>

        {/* Profession — plain text, no badge */}
        {expertise.length > 0 && (
          <p className="text-sm text-gray-500 mt-1">{expertise.join(' · ')}</p>
        )}

        {/* Inline stats: rating · bookings */}
        {(rating > 0 || bookings > 0) && (
          <div className="flex items-center justify-center flex-wrap gap-x-4 gap-y-1 mt-3 text-sm">
            {rating > 0 && (
              <span className="flex items-center gap-1 text-gray-700">
                <svg className="w-4 h-4 text-amber-400" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>
                <strong className="font-semibold text-gray-900">{rating.toFixed(1)}</strong>
                <span className="text-gray-400">({reviewCount})</span>
              </span>
            )}
            {bookings > 0 && (
              <span className="flex items-center gap-1 text-gray-700">
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
                <strong className="font-semibold text-gray-900">{bookings}</strong>
                <span className="text-gray-400">booked</span>
              </span>
            )}
          </div>
        )}

        {/* View full profile — white→brand on hover, no underline */}
        {vendor.username && (
          <Link to={`/${vendor.username}`}
            onMouseEnter={() => setBtnHover(true)} onMouseLeave={() => setBtnHover(false)}
            className="btn btn--outline mt-5 w-full inline-flex items-center justify-center gap-1.5 py-2.5 text-sm font-semibold no-underline transition-colors"
            style={{
              background: btnHover ? accent : '#ffffff',
              color: btnHover ? '#ffffff' : accent,
            }}>
            View full profile
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"/></svg>
          </Link>
        )}
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

  const { service, vendor, totalServices, reviews, avgRating, ratingBreakdown, bookingFee } = data;

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

            {/* ── HERO ── theme-derived gradient band, creator-focused */}
            <section
              className="rounded-2xl p-6 sm:p-10 mb-6"
              style={{
                background: 'linear-gradient(135deg, color-mix(in srgb, var(--profile-accent, #FE5100) 14%, white), color-mix(in srgb, var(--profile-accent, #FE5100) 4%, white))',
              }}>
              {/* Title */}
              <h1 className="text-4xl sm:text-5xl font-black text-gray-900 mb-4 leading-[1.1] tracking-tight">{service.title}</h1>

              {/* Short description */}
              {service.short_description && (
                <p className="text-base sm:text-lg text-gray-600 mb-6 leading-relaxed max-w-2xl">{service.short_description}</p>
              )}

              {/* Creator — [photo] by Name in Category */}
              {vendor?.name && (
                <div className="flex items-center gap-3 mb-6">
                  {vendor.profile_image
                    ? <img src={vendor.profile_image} alt={vendor.name} className="w-11 h-11 rounded-full object-cover ring-2 ring-white shadow-sm flex-shrink-0"/>
                    : <div className="w-11 h-11 rounded-full bg-primary/10 flex items-center justify-center text-base font-bold text-primary ring-2 ring-white shadow-sm flex-shrink-0">{vendor.name.charAt(0)}</div>}
                  <p className="text-sm text-gray-600 flex items-center flex-wrap gap-x-1.5 gap-y-0.5 min-w-0">
                    <span>by</span>
                    <Link to={`/${vendor.username}`} className="font-bold text-gray-900 hover:text-primary">{vendor.name}</Link>
                    {vendor.is_verified && (
                      <svg className="w-4 h-4 flex-shrink-0 text-green-500" fill="currentColor" viewBox="0 0 24 24"><path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                    )}
                    {creatorCategory && <><span>in</span><span className="font-bold text-gray-900">{creatorCategory}</span></>}
                  </p>
                </div>
              )}

              {/* Meta row — bestseller · rating · bookings · duration · mode */}
              <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm">
                {isBestseller && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700">
                    <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>
                    Bestseller
                  </span>
                )}
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-gray-900">{rating ? rating.toFixed(1) : 'New'}</span>
                  <Stars avg={rating} count={0}/>
                  {reviewCount > 0 && <span className="text-gray-500">{reviewCount} Rating</span>}
                </div>
                {bookings > 0 && (
                  <span className="flex items-center gap-1.5 text-gray-600">
                    <strong className="font-semibold text-gray-900">{bookings}</strong> Bookings
                  </span>
                )}
                <span className="flex items-center gap-1.5 text-gray-600">
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
                  {fmtDuration(service.duration)}
                </span>
                <span className="flex items-center gap-1.5 text-gray-600">
                  {service.meeting_mode === 'offline'
                    ? <><svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a2 2 0 01-2.828 0l-4.243-4.243a8 8 0 1111.314 0z"/><circle cx="12" cy="11" r="2.5"/></svg>In-person</>
                    : <><svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><line x1="3" y1="12" x2="21" y2="12"/><path d="M12 3a14 14 0 0 1 0 18 14 14 0 0 1 0-18z"/></svg>Online</>}
                </span>
              </div>
            </section>

            {/* Mobile: booking card as a normal block below the hero */}
            <div className="lg:hidden mb-6 space-y-6">
              <BookingCard service={service} onBookNow={handleBookNow} bookingFee={bookingFee}/>
              <ProfileCard vendor={vendor} rating={rating} reviewCount={reviewCount} bookings={bookings}/>
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
          <div className="hidden lg:flex lg:w-[320px] flex-shrink-0 self-start sticky top-24 flex-col gap-5">
            <BookingCard service={service} onBookNow={handleBookNow} bookingFee={bookingFee}/>
            <ProfileCard vendor={vendor} rating={rating} reviewCount={reviewCount} bookings={bookings}/>
          </div>
        </div>
      </div>
    </div>
  );
}
