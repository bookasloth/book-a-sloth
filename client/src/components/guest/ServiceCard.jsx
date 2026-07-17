/**
 * ServiceCard.jsx — grid card for a single SERVICE (not a profile).
 *
 * Props:
 *   service — flat card from GET /api/explore .services[]:
 *     { id, slug, title, price, currency, coverImage, hostName, hostUsername,
 *       hostAvatar, avgRating, reviewCount, category, area, url,
 *       badges:{ instantBook, isNew, availableThisWeek } }
 *   rank    — 1-based position in the current result set (for click analytics).
 *
 * Explore-only. HostProfile has its OWN local ServiceCard (defined inline there),
 * so restyling this one cannot reach it — checked by import, not by name.
 * Flat minimal, matching /blog: page-card chrome, hairline rules, tinted pills.
 */
import { Link } from 'react-router-dom';
import { Star, BadgeCheck, Zap, MapPin, CalendarCheck } from 'lucide-react';
import { logExploreClick } from '../../services/api';

const AVATAR_FALLBACK = 'https://api.dicebear.com/7.x/initials/svg?seed=';

export default function ServiceCard({ service, rank }) {
  const {
    id, slug, title = '', price, currency = 'INR', coverImage,
    hostName = 'Host', hostUsername = '#', hostAvatar,
    avgRating, reviewCount = 0, category = '', area = '',
    url, badges = {},
  } = service || {};

  const to = url || (hostUsername && slug ? `/${hostUsername}/${slug}` : '#');
  const priceLabel = price > 0
    ? `From ${currency === 'INR' ? '₹' : '$'}${Number(price).toLocaleString('en-IN')}`
    : 'Free';
  const avatarSrc = hostAvatar || `${AVATAR_FALLBACK}${encodeURIComponent(hostName)}`;

  return (
    <Link
      to={to}
      onClick={() => logExploreClick({ serviceId: id, rank })}
      style={{ textDecoration: 'none' }}
      className="page-card group flex flex-col overflow-hidden transition-shadow hover:shadow-md"
    >
      {/* Cover 4:3 */}
      <div className="relative aspect-[4/3] overflow-hidden bg-[#FFF8EE]">
        {coverImage ? (
          <img
            src={coverImage}
            alt={title}
            loading="lazy"
            className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-[1.03]"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-4xl" aria-hidden="true">🦥</div>
        )}

        {/* Badges */}
        <div className="absolute top-2 left-2 flex flex-wrap gap-1">
          {badges.isNew && (
            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-800">New</span>
          )}
          {badges.instantBook && (
            <span className="flex items-center gap-1 rounded-full bg-primary-cta px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">
              <Zap size={9} fill="white" /> Instant
            </span>
          )}
        </div>
      </div>

      {/* Body */}
      <div className="flex flex-col flex-1 p-3.5">
        {category && (
          <span className="mb-2 self-start rounded-full bg-black/[0.04] px-2 py-0.5 text-[10px] font-semibold text-muted">
            {category}
          </span>
        )}

        <h3 className="font-heading text-[15px] font-bold leading-snug text-ink line-clamp-2 transition-colors duration-150 group-hover:text-primary-cta">{title}</h3>

        {/* Host row */}
        <div className="flex items-center gap-2 mt-2">
          <img src={avatarSrc} alt={hostName}
               className="h-5 w-5 rounded-full border border-black/10 bg-[#FFF8EE] object-cover" />
          <span className="truncate text-[12px] text-muted">{hostName}</span>
        </div>

        {/* Meta: rating + area */}
        <div className="flex items-center gap-3 mt-2 text-[12px]">
          {avgRating > 0 ? (
            <span className="flex items-center gap-1 font-semibold text-ink">
              <Star size={12} className="fill-amber-400 text-amber-400" />
              {avgRating.toFixed(1)}
              {reviewCount > 0 && <span className="font-normal text-muted">({reviewCount})</span>}
            </span>
          ) : (
            <span className="text-muted">No reviews yet</span>
          )}
          {area && (
            <span className="flex items-center gap-1 truncate text-muted">
              <MapPin size={11} /> <span className="truncate">{area}</span>
            </span>
          )}
        </div>

        {badges.availableThisWeek && (
          <span className="mt-2 flex items-center gap-1 text-[11px] font-semibold text-green-600">
            <CalendarCheck size={12} /> Available this week
          </span>
        )}

        {/* Footer: price + verified host */}
        <div className="flex items-center justify-between mt-auto pt-3">
          <span className="text-[13px] font-bold text-ink">{priceLabel}</span>
          <span className="flex items-center gap-1 text-[11px] text-muted">
            <BadgeCheck size={13} className="text-primary-cta" /> Verified
          </span>
        </div>
      </div>
    </Link>
  );
}
