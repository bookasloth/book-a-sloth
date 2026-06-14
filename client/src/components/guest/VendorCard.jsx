/**
 * VendorCard.jsx
 * Used on the Explore page grid. Matches Friendly Brutalism design system.
 * Props:
 *   vendor  — { id, name, username, tagline, profileImage, category,
 *               avgRating, reviewCount, minPrice, currency,
 *               isFeatured, isSponsored, isVerified, isBoosted,
 *               responseTime, plan }
 */
import { Link } from 'react-router-dom';
import { Star, BadgeCheck, Zap, TrendingUp } from 'lucide-react';

const FALLBACK_IMG = 'https://api.dicebear.com/7.x/initials/svg?seed=';

export default function VendorCard({ vendor }) {
  const {
    name        = 'Sloth',
    username    = '#',
    tagline     = '',
    profileImage,
    category    = '',
    avgRating   = 0,
    reviewCount = 0,
    minPrice    = 0,
    currency    = 'INR',
    isFeatured  = false,
    isSponsored = false,
    isVerified  = false,
    isBoosted   = false,
  } = vendor;

  const imgSrc = profileImage || `${FALLBACK_IMG}${encodeURIComponent(name)}`;
  const priceLabel = minPrice > 0
    ? `From ${currency === 'INR' ? '₹' : '$'}${minPrice.toLocaleString('en-IN')}`
    : 'Free';

  return (
    <Link
      to={`/${username}`}
      className="group block bg-white border-2 border-[#1E1E1E] rounded-[6px] overflow-hidden
                 transition-transform duration-150 hover:-translate-y-1
                 shadow-[4px_4px_0_#1E1E1E] hover:shadow-[6px_6px_0_#1E1E1E]"
      style={{ textDecoration: 'none' }}
    >
      {/* Top badge strip */}
      {(isFeatured || isSponsored || isBoosted) && (
        <div className="flex gap-1 px-3 pt-2">
          {isFeatured && (
            <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide
                             bg-[#FE5100] text-white px-2 py-0.5 rounded-[4px]">
              <Star size={9} fill="white" /> Featured
            </span>
          )}
          {isSponsored && (
            <span className="text-[10px] font-semibold text-[#64748b] border border-[#e5e7eb]
                             px-2 py-0.5 rounded-[4px] bg-[#F8F8F8]">
              Ad
            </span>
          )}
          {isBoosted && !isFeatured && (
            <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide
                             bg-[#FFB703] text-[#1E1E1E] px-2 py-0.5 rounded-[4px]">
              <TrendingUp size={9} /> Trending
            </span>
          )}
        </div>
      )}

      {/* Avatar + info */}
      <div className="flex items-start gap-3 p-4 pb-3">
        <div className="relative shrink-0">
          <img
            src={imgSrc}
            alt={name}
            className="w-14 h-14 rounded-[6px] border-2 border-[#1E1E1E] object-cover bg-[#FFF8EE]"
          />
          {isVerified && (
            <span className="absolute -bottom-1.5 -right-1.5 bg-white rounded-full border border-[#1E1E1E]">
              <BadgeCheck size={14} className="text-[#FE5100]" fill="#FFF8EE" />
            </span>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-1">
            <h3 className="font-bold text-[15px] text-[#1E1E1E] leading-tight truncate">{name}</h3>
          </div>
          {tagline && (
            <p className="text-[12px] text-[#64748b] mt-0.5 leading-tight line-clamp-2">{tagline}</p>
          )}
        </div>
      </div>

      {/* Category chip */}
      {category && (
        <div className="px-4 pb-2">
          <span className="inline-block text-[11px] font-semibold bg-[#FFF8EE] border border-[#1E1E1E]
                           text-[#1E1E1E] px-2 py-0.5 rounded-[4px]">
            {category}
          </span>
        </div>
      )}

      {/* Divider */}
      <div className="mx-4 border-t border-[#E5E5E5]" />

      {/* Footer: rating + price */}
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-1">
          {avgRating > 0 ? (
            <>
              <Star size={12} className="text-[#FBBF24] fill-[#FBBF24]" />
              <span className="text-[12px] font-semibold text-[#1E1E1E]">{avgRating.toFixed(1)}</span>
              {reviewCount > 0 && (
                <span className="text-[11px] text-[#64748b]">({reviewCount})</span>
              )}
            </>
          ) : (
            <span className="text-[11px] text-[#64748b]">No reviews yet</span>
          )}
        </div>

        <div className="text-right">
          <span className="text-[12px] font-bold text-[#FE5100]">{priceLabel}</span>
        </div>
      </div>

      {/* CTA hover state */}
      <div className="mx-4 mb-3 bg-[#1E1E1E] text-white text-center text-[12px] font-bold py-1.5
                      rounded-[4px] opacity-0 group-hover:opacity-100 transition-opacity duration-150">
        View Profile →
      </div>
    </Link>
  );
}
