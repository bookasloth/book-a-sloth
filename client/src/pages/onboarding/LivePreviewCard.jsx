import { Video, MapPin, Repeat, Zap, ShieldCheck, Link2, Copy } from 'lucide-react';

// Live preview of the host's future public page. Not an iframe — the real page
// needs services/photo/bio that don't exist yet — so this mock renders whatever
// the form holds right now. Every keystroke gets a visible payoff on the right.
//
// Copy is deliberately truthful: the feature row shows platform facts that are
// actually true for a new host (booking mode, instant confirmation, secure
// payments). No fabricated "works worldwide / responds in 24h / 12K coaches".
const BOOKING = {
  online_only:  { Icon: Video,  label: 'Online sessions' },
  offline_only: { Icon: MapPin, label: 'In person' },
  both:         { Icon: Repeat, label: 'Online & in person' },
};

const LivePreviewCard = ({
  displayName,
  slug,
  personaLabel,
  personaTag,
  bookingType,
  whatsappNumber, // eslint-disable-line no-unused-vars -- kept for API compat
  tagline,
  photoUrl,
}) => {
  const booking = BOOKING[bookingType] || BOOKING.online_only;
  const initial = (displayName || 'S').trim().charAt(0).toUpperCase();

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-[0_18px_40px_-24px_rgba(23,32,51,0.35)]">
      {/* Cover — faux layered "hills" so an empty page still feels alive */}
      <div className="relative h-20 bg-gradient-to-br from-primary to-orange-400">
        <div className="absolute inset-0 opacity-70 [background:radial-gradient(120%_140%_at_20%_120%,rgba(0,0,0,0.28),transparent_55%),radial-gradient(120%_120%_at_85%_120%,rgba(0,0,0,0.22),transparent_50%)]" />
      </div>

      <div className="-mt-9 px-5 pb-5">
        {/* Avatar */}
        <div className="flex h-[68px] w-[68px] items-center justify-center overflow-hidden rounded-full bg-primary-light text-2xl font-bold text-primary-cta ring-4 ring-white">
          {photoUrl ? (
            <img src={photoUrl} alt="" className="h-full w-full object-cover" />
          ) : (
            initial
          )}
        </div>

        {/* Name + category */}
        <h3 className="mt-3 text-lg font-bold leading-tight text-gray-900">
          {displayName || 'Your name'}
        </h3>
        <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1">
          {personaLabel && (
            <span className="text-sm font-semibold text-primary">{personaLabel}</span>
          )}
          {personaLabel && <span className="text-gray-300">·</span>}
          <span className="inline-flex items-center gap-1 text-xs font-medium text-gray-500">
            <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
            {booking.label}
          </span>
        </div>

        {/* Tagline */}
        <p className="mt-2.5 min-h-[2.5rem] text-sm leading-snug text-gray-600">
          {tagline || (personaTag ? `${personaTag}` : 'Add a one-line tagline so guests know what you offer.')}
        </p>

        {/* Feature row — true for every new host */}
        <div className="mt-3 grid grid-cols-3 gap-2 border-t border-gray-100 pt-3">
          <Feature Icon={booking.Icon} label={booking.label} />
          <Feature Icon={Zap} label="Instant confirm" />
          <Feature Icon={ShieldCheck} label="Secure pay" />
        </div>

        {/* CTA — visual only in preview */}
        <div className="mt-4 flex w-full items-center justify-center rounded-lg bg-primary py-2.5 text-sm font-bold text-white">
          Book a session
        </div>

        {/* Public link */}
        <div className="mt-3 flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2">
          <Link2 className="h-3.5 w-3.5 shrink-0 text-gray-400" strokeWidth={2.5} />
          <span className="min-w-0 flex-1 truncate font-mono text-xs text-gray-500">
            bookasloth.com/<span className="font-semibold text-primary-cta">{slug || 'your-url'}</span>
          </span>
          <Copy className="h-3.5 w-3.5 shrink-0 text-gray-400" strokeWidth={2.5} />
        </div>

        <p className="mt-2.5 text-center text-[11px] text-gray-400">
          Secure booking · Powered by Book A Sloth
        </p>
      </div>
    </div>
  );
};

const Feature = ({ Icon, label }) => (
  <div className="flex flex-col items-center gap-1 text-center">
    <Icon className="h-4 w-4 text-gray-500" strokeWidth={2} />
    <span className="text-[10.5px] font-medium leading-tight text-gray-500">{label}</span>
  </div>
);

export default LivePreviewCard;
