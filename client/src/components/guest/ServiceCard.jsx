/**
 * ServiceCard.jsx — Explore grid card for a single SERVICE (not a profile).
 * Friendly Brutalism tokens (4px borders, rounded-[6px], hard shadow, #FE5100).
 *
 * Props:
 *   service — flat card from GET /api/explore .services[]:
 *     { id, slug, title, price, currency, coverImage, hostName, hostUsername,
 *       hostAvatar, avgRating, reviewCount, category, area, url,
 *       badges:{ instantBook, isNew, availableThisWeek } }
 *   rank    — 1-based position in the current result set (for click analytics).
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
      className="group flex flex-col bg-white border-2 border-[#1E1E1E] rounded-[6px] overflow-hidden
                 transition-transform duration-150 hover:-translate-y-1
                 shadow-[4px_4px_0_#1E1E1E] hover:shadow-[6px_6px_0_#1E1E1E]"
    >
      {/* Cover 4:3 */}
      <div className="relative aspect-[4/3] bg-[#FFF8EE] border-b-2 border-[#1E1E1E] overflow-hidden">
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
            <span className="text-[10px] font-bold uppercase tracking-wide bg-[#FFB703] text-[#1E1E1E]
                             border border-[#1E1E1E] px-2 py-0.5 rounded-[4px]">New</span>
          )}
          {badges.instantBook && (
            <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide
                             bg-[#FE5100] text-white border border-[#1E1E1E] px-2 py-0.5 rounded-[4px]">
              <Zap size={9} fill="white" /> Instant
            </span>
          )}
        </div>
      </div>

      {/* Body */}
      <div className="flex flex-col flex-1 p-3.5">
        {category && (
          <span className="self-start text-[10px] font-semibold bg-[#FFF8EE] border border-[#1E1E1E]
                           text-[#1E1E1E] px-2 py-0.5 rounded-[4px] mb-2">
            {category}
          </span>
        )}

        <h3 className="font-bold text-[15px] text-[#1E1E1E] leading-snug line-clamp-2">{title}</h3>

        {/* Host row */}
        <div className="flex items-center gap-2 mt-2">
          <img src={avatarSrc} alt={hostName}
               className="w-5 h-5 rounded-full border border-[#1E1E1E] object-cover bg-[#FFF8EE]" />
          <span className="text-[12px] text-[#64748b] truncate">{hostName}</span>
        </div>

        {/* Meta: rating + area */}
        <div className="flex items-center gap-3 mt-2 text-[12px]">
          {avgRating > 0 ? (
            <span className="flex items-center gap-1 text-[#1E1E1E] font-semibold">
              <Star size={12} className="text-[#FBBF24] fill-[#FBBF24]" />
              {avgRating.toFixed(1)}
              {reviewCount > 0 && <span className="text-[#64748b] font-normal">({reviewCount})</span>}
            </span>
          ) : (
            <span className="text-[#64748b]">No reviews yet</span>
          )}
          {area && (
            <span className="flex items-center gap-1 text-[#64748b] truncate">
              <MapPin size={11} /> <span className="truncate">{area}</span>
            </span>
          )}
        </div>

        {badges.availableThisWeek && (
          <span className="flex items-center gap-1 text-[11px] font-semibold text-[#16a34a] mt-2">
            <CalendarCheck size={12} /> Available this week
          </span>
        )}

        {/* Footer: price + verified host */}
        <div className="flex items-center justify-between mt-auto pt-3">
          <span className="text-[13px] font-bold text-[#FE5100]">{priceLabel}</span>
          <span className="flex items-center gap-1 text-[11px] text-[#64748b]">
            <BadgeCheck size={13} className="text-[#FE5100]" /> Verified
          </span>
        </div>
      </div>
    </Link>
  );
}
