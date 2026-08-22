import { Video, MapPin, Repeat, MessageCircle, Star } from 'lucide-react';

// Live preview of the host's future profile card. Not an iframe of the real
// public page — the real page needs services/photo/bio that don't exist yet.
// This mock renders whatever the form has right now, so every keystroke has
// a visible payoff on the right of the screen.
const BOOKING_ICON = {
  online_only:  { Icon: Video,  label: 'Online' },
  offline_only: { Icon: MapPin, label: 'In person' },
  both:         { Icon: Repeat, label: 'Online & in person' },
};

const LivePreviewCard = ({
  displayName,
  slug,
  personaLabel,
  bookingType,
  whatsappNumber,
  tagline,
  photoUrl,
}) => {
  const booking = BOOKING_ICON[bookingType] || null;
  const initial = (displayName || 'S').trim().charAt(0).toUpperCase();

  return (
    <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
      {/* Faux browser chrome — reinforces "this is your public page" */}
      <div className="flex items-center gap-1.5 px-3 py-2 bg-gray-100 border-b border-gray-200">
        <span className="w-2.5 h-2.5 rounded-full bg-red-400" />
        <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
        <span className="w-2.5 h-2.5 rounded-full bg-green-400" />
        <div className="ml-3 flex-1 text-[11px] font-mono text-gray-500 truncate">
          bookasloth.com/{slug || 'your-url'}
        </div>
      </div>

      {/* Header band */}
      <div className="h-14 bg-gradient-to-br from-primary/20 to-primary/5" />

      {/* Body */}
      <div className="px-5 pb-5 -mt-8">
        {/* Avatar */}
        <div className="w-16 h-16 rounded-full ring-4 ring-white bg-primary flex items-center justify-center text-white text-2xl font-bold overflow-hidden">
          {photoUrl ? (
            <img src={photoUrl} alt="" className="w-full h-full object-cover" />
          ) : (
            initial
          )}
        </div>

        {/* Name */}
        <h3 className="mt-3 text-lg font-bold text-gray-900 leading-tight">
          {displayName || 'Your name'}
        </h3>
        {personaLabel && (
          <p className="text-xs uppercase tracking-wide text-primary font-semibold mt-0.5">
            {personaLabel}
          </p>
        )}

        {/* Tagline */}
        <p className="mt-2 text-sm text-gray-600 leading-snug min-h-[2.5rem]">
          {tagline || 'Add a one-line tagline so guests know what you offer.'}
        </p>

        {/* Badges row */}
        <div className="mt-4 flex flex-wrap gap-2">
          {booking && <Badge Icon={booking.Icon} label={booking.label} />}
          {whatsappNumber && (
            <Badge Icon={MessageCircle} label="WhatsApp updates" />
          )}
        </div>

        {/* Empty services placeholder */}
        <div className="mt-5 rounded-lg border border-dashed border-gray-300 bg-gray-50 p-4 text-center">
          <p className="text-xs text-gray-400">
            Your services will appear here after you publish.
          </p>
        </div>

        {/* Stub review row */}
        <div className="mt-3 flex items-center gap-1 text-xs text-gray-400">
          <Star className="w-3.5 h-3.5" strokeWidth={2} />
          <span>New host · reviews will build up as you get booked</span>
        </div>
      </div>
    </div>
  );
};

const Badge = ({ Icon, label }) => (
  <span className="inline-flex items-center gap-1 bg-gray-100 border border-gray-200 text-gray-700 text-xs font-medium rounded-full px-2.5 py-1">
    <Icon className="w-3 h-3" strokeWidth={2.5} />
    {label}
  </span>
);

export default LivePreviewCard;
