import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import Seo from "../components/common/Seo";
import { SITE_URL } from "../utils/seo";

// /changelog — public "What's New" timeline. Marketing-facing product updates,
// newest first. Entries are curated release notes (backdated to launch window).
// Tags drive the colour chip: New / Improved / Fixed / Security.
const TAG_STYLES = {
  New:      { bg: 'rgba(5,150,105,0.10)',  fg: '#059669' },
  Improved: { bg: 'rgba(37,99,235,0.10)',  fg: '#2563eb' },
  Fixed:    { bg: 'rgba(245,158,11,0.12)', fg: '#b45309' },
  Security: { bg: 'rgba(124,58,237,0.10)', fg: '#7c3aed' },
};

// Decorative animated mesh backdrop for the changelog.
// Brief composition (top → bottom): orange dominant (~50%), with blue,
// green-yellow, white, black and pink accents woven in as soft radial
// "blobs" that slowly drift + breathe for a fluid, organic feel. Top is
// kept lighter so the dark header stays legible; orange deepens through
// the middle; cooler/darker notes settle low. Motion = cheap GPU
// transforms only; honours prefers-reduced-motion (see <style> below).
const BASE_WASH =
  'linear-gradient(180deg, #FFE7D2 0%, #FF8A3D 24%, #FE5100 55%, #D64400 84%, #B23800 100%)';

// Each blob: position + size + radial fill + which drift animation it rides.
const BLOBS = [
  // white highlight, top-left — lifts the header (dominant readability zone)
  { top: '-8%',  left: '-6%',  w: '60%', h: '55%', anim: 'clDrift1', dur: '17s', delay: '0s',
    fill: 'radial-gradient(closest-side, rgba(255,255,255,0.9) 0%, rgba(255,255,255,0) 70%)' },
  // pink accent, top-right
  { top: '-10%', left: '58%',  w: '55%', h: '50%', anim: 'clDrift2', dur: '21s', delay: '-4s',
    fill: 'radial-gradient(closest-side, rgba(255,77,141,0.6) 0%, rgba(255,77,141,0) 70%)' },
  // bright orange core, upper-mid (dominant)
  { top: '12%',  left: '20%',  w: '75%', h: '60%', anim: 'clDrift3', dur: '19s', delay: '-2s',
    fill: 'radial-gradient(closest-side, rgba(255,122,46,0.85) 0%, rgba(255,122,46,0) 72%)' },
  // green-yellow accent, mid-right
  { top: '42%',  left: '66%',  w: '52%', h: '48%', anim: 'clDrift1', dur: '23s', delay: '-7s',
    fill: 'radial-gradient(closest-side, rgba(185,217,0,0.5) 0%, rgba(185,217,0,0) 70%)' },
  // blue accent, mid-left
  { top: '52%',  left: '-12%', w: '55%', h: '50%', anim: 'clDrift2', dur: '20s', delay: '-9s',
    fill: 'radial-gradient(closest-side, rgba(37,99,235,0.45) 0%, rgba(37,99,235,0) 70%)' },
  // deep orange pool, lower-mid (dominant)
  { top: '64%',  left: '28%',  w: '80%', h: '60%', anim: 'clDrift3', dur: '18s', delay: '-5s',
    fill: 'radial-gradient(closest-side, rgba(214,68,0,0.95) 0%, rgba(214,68,0,0) 72%)' },
  // black settle, bottom-right
  { top: '74%',  left: '70%',  w: '55%', h: '50%', anim: 'clDrift1', dur: '25s', delay: '-3s',
    fill: 'radial-gradient(closest-side, rgba(11,11,11,0.5) 0%, rgba(11,11,11,0) 68%)' },
];

const RELEASES = [
  {
    date: 'Jul 15, 2026', version: 'v3.76',
    title: 'Your clients, all in one place',
    tags: ['New'],
    points: [
      'A built-in CRM for Studio hosts — every guest who books becomes a client, automatically, with their history in one view.',
      'Keep private notes and files against each client, add your own labels, and export the whole list to CSV whenever you need it.',
    ],
  },
  {
    date: 'Jul 15, 2026', version: 'v3.78',
    title: 'In-person bookings now come with a map',
    tags: ['New', 'Improved'],
    points: [
      'Set your venue once and every offline, in-person booking carries a Google Maps link — right in the confirmation, the calendar invite and the WhatsApp message.',
      'Guests know exactly where to go; online sessions keep their Meet links as before.',
    ],
  },
  {
    date: 'Jul 15, 2026',
    title: 'Your contacts stay yours',
    tags: ['Improved', 'Security'],
    points: [
      'Phone numbers are now shown only when they’re genuinely needed for a booking — keeping guest and host contacts protected.',
      'Email and location details stay exactly where you expect them.',
    ],
  },
  {
    date: 'Jul 14, 2026', version: 'v3.77',
    title: 'Refer a host, earn cash',
    tags: ['New'],
    points: [
      'Love Book A Sloth? Refer a fellow creator and earn a cash reward once they’re up and running on a paid plan.',
      'Track your referrals and rewards straight from your dashboard — clean and hands-off.',
    ],
  },
  {
    date: 'Jul 13, 2026', version: 'v3.75',
    title: 'Book A Sloth, for teams',
    tags: ['New'],
    points: [
      'A new Enterprise page for agencies, studios and larger teams who need to run bookings across a whole roster from one place.',
      'Tell us what you need and our team will tailor a plan and get you set up.',
    ],
  },
  {
    date: 'Jul 12, 2026',
    title: 'Share your page in one tap',
    tags: ['Improved'],
    points: [
      'A native share button on your dashboard — send your booking link straight to WhatsApp, Messages or anywhere else using your phone’s own share sheet.',
    ],
  },
  {
    date: 'Jul 11, 2026', version: 'v3.72',
    title: 'A smarter way to get discovered',
    tags: ['New', 'Improved'],
    points: [
      'Rebuilt Explore ranks real services by quality and relevance, so guests searching for what you offer see the best matches first.',
      'Search and public listings are faster and crash-proof, even under heavy load.',
    ],
  },
  {
    date: 'Jul 11, 2026', version: 'v3.71',
    title: 'Your calendar, never double-booked',
    tags: ['Improved', 'Fixed'],
    points: [
      'Hardened the booking engine so two guests can never grab the same slot — even in the same split second — while a short grace window keeps genuine back-to-back bookings flowing.',
    ],
  },
  {
    date: 'Jul 9, 2026',
    title: 'The mobile dashboard keeps getting better',
    tags: ['Improved'],
    points: [
      'More native-app polish on mobile: an infinite-scroll bookings feed, smoother sheets and forms, friendly success screens and a clearer step-by-step onboarding progress bar.',
      'Set your hours per day with a simple open/closed toggle, and pick your brand colour from a proper colour wheel.',
    ],
  },
  {
    date: 'Jul 8, 2026', version: 'v3.68',
    title: 'Get verified, get paid',
    tags: ['New', 'Security'],
    points: [
      'Verify your identity in four quick steps — your details are encrypted and stored privately, never shown on your page.',
      'A verified badge builds trust with guests, and clearing verification unlocks your payouts.',
      'Prefer a face-to-face check? A video-KYC option is on the way.',
    ],
  },
  {
    date: 'Jul 7, 2026', version: 'v3.67',
    title: 'Proper GST tax invoices, done for you',
    tags: ['New', 'Improved'],
    points: [
      'Every booking and subscription now generates a clean, GST-compliant tax invoice — with the right place-of-supply and tax split worked out automatically.',
      'Download any invoice from your dashboard, or opt in for one right at checkout.',
      'No spreadsheets, no manual maths — just receipts you and your accountant can rely on.',
    ],
  },
  {
    date: 'Jul 7, 2026',
    title: 'An app-like experience on your phone',
    tags: ['Improved'],
    points: [
      'The host dashboard now feels like a native app on mobile — smooth page transitions, swipe gestures and tap-friendly confirmations.',
      'Faster, calmer and built for running your bookings on the go.',
    ],
  },
  {
    date: 'Jul 6, 2026',
    title: 'Pages built for your profession',
    tags: ['New'],
    points: [
      'New landing pages tailored to your line of work — doctors, lawyers, salons, fitness coaches, consultants and more — so the right guests find you faster.',
      'Get in touch anytime through our new contact page.',
    ],
  },
  {
    date: 'Jul 3, 2026', version: 'v3.64',
    title: 'Reviews you can trust',
    tags: ['Improved'],
    points: [
      'Reviews that break our community guidelines can now be taken down — so the ratings on every profile and service page stay honest and fair.',
      'Nothing changes for genuine feedback: your real reviews keep showing exactly where they always have.',
    ],
  },
  {
    date: 'Jul 1, 2026', version: 'v3.59',
    title: 'Turn one session into the next',
    tags: ['New', 'Improved'],
    points: [
      'Rebook nudges for Studio hosts: after a completed session, your guest gets a warm “ready for another?” reminder — at 3 days and again at 21 days — with a one-tap link straight back to your page.',
      'Completely hands-off — it automatically skips anyone who’s already rebooked, so the right people get nudged at the right time.',
      'Sent by email today, with WhatsApp ready to switch on.',
      'Behind the scenes: sharper product analytics so we can see what’s driving bookings and keep building what helps you get booked.',
    ],
  },
  {
    date: 'Jun 29, 2026', version: 'v3.54',
    title: 'Reminders that actually show up — even last-minute',
    tags: ['New', 'Improved'],
    points: [
      'Automatic booking reminders before every session — a 24-hour heads-up on Host+, plus a 1-hour nudge and reschedule alerts on Studio.',
      'Booked something at the last minute? A catch-up sweep makes sure short-notice bookings still get their reminder in time.',
    ],
  },
  {
    date: 'Jun 28, 2026', version: 'v3.53',
    title: 'A booking page that looks and feels like you',
    tags: ['New', 'Improved'],
    points: [
      'Dress up your service page with animated, brand-tinted backgrounds — curated and ready to pick.',
      'New profession-scoped service categories so you tag your work with the labels that actually fit your craft.',
      'A slimmer, calmer navigation with a redesigned profile menu and a full Use Cases mega-menu — fewer links, faster to what you need.',
    ],
  },
  {
    date: 'Jun 28, 2026',
    title: 'Get to know Book A Sloth',
    tags: ['New'],
    points: [
      'A revamped About page — our story, the team and the brands building with us.',
      'A new Blog where we share what we’re building, in public.',
    ],
  },
  {
    date: 'Jun 27, 2026', version: 'v3.5',
    title: 'A dashboard that actually works the way you do',
    tags: ['Improved', 'Fixed'],
    points: [
      'Rebuilt the host dashboard: sticky sidebar, sticky top bar with profile, notifications and one-tap support.',
      'Mobile menus now open as native-feeling bottom sheets instead of cramped dropdowns.',
      'Earnings, pending payouts and “needs action” counts are now accurate to the rupee — cancelled bookings no longer inflate your numbers.',
    ],
  },
  {
    date: 'Jun 25, 2026', version: 'v3.37',
    title: 'Sell digital products alongside your sessions',
    tags: ['New'],
    points: [
      'Upload an e-book, template or guide and sell it straight from your booking page — no extra tools.',
      'Buyers get an instant, secure download link by email the moment payment clears.',
      'Every sale lands in your ledger with a clean GST invoice.',
    ],
  },
  {
    date: 'Jun 24, 2026', version: 'v3.31',
    title: 'Become a host in under 60 seconds',
    tags: ['New', 'Improved'],
    points: [
      'New Google-first onboarding: one tap connects your identity, calendar and Meet links — no passwords to invent.',
      'Claim your booking link (bookasloth.com/yourname) right at the start and keep it forever.',
      'Smoother mobile navigation with a full-screen drawer and faster page loads.',
    ],
  },
  {
    date: 'Jun 23, 2026', version: 'v3.28',
    title: 'Receipts your customers will actually keep',
    tags: ['Improved', 'Security'],
    points: [
      'Premium, wallet-style invoices with your branding, GST breakup and a one-tap download.',
      'Refreshed every transactional email with a cleaner, friendlier identity.',
      'Hardened the platform after a full security review — tighter data access across the board.',
    ],
  },
  {
    date: 'Jun 22, 2026', version: 'v3.23',
    title: 'A homepage that tells your story',
    tags: ['New', 'Fixed'],
    points: [
      'Reimagined homepage with live counters, real creator stories and a clearer path to “Let’s Get Started”.',
      'Fixed a sign-in hiccup for visitors arriving on the www. version of the site.',
    ],
  },
  {
    date: 'Jun 20, 2026', version: 'v3.21',
    title: '60 industries, one booking page',
    tags: ['New'],
    points: [
      'Pick from 60+ industry categories so guests instantly understand what you offer.',
      'Tag each service with its own category for cleaner, more discoverable pages.',
    ],
  },
  {
    date: 'Jun 19, 2026', version: 'v3.18',
    title: 'Book A Sloth goes live 🚀',
    tags: ['New'],
    points: [
      'Production launch — payments, calendars and notifications running on hardened, monitored infrastructure.',
      'Automated backups, error tracking and a documented deploy pipeline behind the scenes.',
    ],
  },
  {
    date: 'Jun 18, 2026', version: 'v3.17',
    title: 'Your link is yours, forever',
    tags: ['New', 'Improved'],
    points: [
      'Permanent usernames: change your handle and old links keep redirecting — never lose a booking.',
      'Big speed-ups on public booking pages: lighter scripts, self-hosted fonts, snappier first paint.',
    ],
  },
  {
    date: 'Jun 17, 2026', version: 'v3.16',
    title: 'Two-way reviews + a home for your bookings',
    tags: ['New', 'Security'],
    points: [
      'Guests and hosts can now review each other — build trust both ways.',
      'A dedicated dashboard for guests to track upcoming and past bookings.',
      'Admin accounts are now protected with mandatory two-factor authentication.',
    ],
  },
  {
    date: 'Jun 16, 2026', version: 'v3.12',
    title: 'Get paid, then get paid again',
    tags: ['New'],
    points: [
      'Subscriptions with auto-renew — monthly or annual — powered by Razorpay UPI AutoPay.',
      'New settlement engine tracks your clearing balance from booking to payout.',
      'Hosts can verify their WhatsApp number for trusted, branded notifications.',
    ],
  },
  {
    date: 'Jun 15, 2026', version: 'v3.7',
    title: 'Respect for the inbox',
    tags: ['New'],
    points: [
      'One-click unsubscribe for marketing emails — booking and payment emails always get through.',
      'Added clear Help, Privacy and Unsubscribe pages.',
    ],
  },
  {
    date: 'Jun 14, 2026', version: 'v3.2',
    title: 'Log in with just your phone',
    tags: ['New', 'Improved'],
    points: [
      'Phone-first login — your number is your identity, a one-time code is your key.',
      'Behind the scenes: feature switches let us roll out and roll back safely without downtime.',
    ],
  },
  {
    date: 'Jun 10, 2026',
    title: 'Notifications that reach people',
    tags: ['New'],
    points: [
      'A unified notification engine sends booking confirmations and reminders over email and WhatsApp.',
      'Queued, retried and logged — so the right message lands at the right time.',
    ],
  },
  {
    date: 'Jun 5, 2026',
    title: 'Reviews land on Book A Sloth',
    tags: ['New'],
    points: [
      'Guests can leave a rating and a few words after every session.',
      'Your best reviews shine right on your public profile.',
    ],
  },
  {
    date: 'Jun 1, 2026',
    title: 'Calendars and Meet links, on autopilot',
    tags: ['New'],
    points: [
      'Connect Google Calendar once — busy times are blocked automatically, double-bookings disappear.',
      'Every online session gets a Google Meet link created for you.',
    ],
  },
  {
    date: 'May 24, 2026',
    title: 'A booking flow guests breeze through',
    tags: ['Improved'],
    points: [
      'Cleaner date and time picker with real-time availability.',
      'Guests can book with a quick WhatsApp code — no account, no friction.',
    ],
  },
  {
    date: 'May 18, 2026',
    title: 'Payments are live with Razorpay',
    tags: ['New'],
    points: [
      'Take secure card, UPI and netbanking payments at checkout.',
      'Money flows to verified hosts with GST-ready invoices on every order.',
    ],
  },
  {
    date: 'May 12, 2026',
    title: 'Publish your services',
    tags: ['New'],
    points: [
      'Create services with pricing, duration and a description — your storefront in minutes.',
      'Share one link and let guests book the slots you choose.',
    ],
  },
  {
    date: 'May 6, 2026',
    title: 'Sign in over WhatsApp',
    tags: ['New'],
    points: [
      'One-time codes delivered to WhatsApp — the fastest way for guests to verify and book.',
    ],
  },
  {
    date: 'May 1, 2026',
    title: 'Hello, Book A Sloth 🦥',
    tags: ['New'],
    points: [
      'The very first build: a home for creators and professionals to get booked and get paid at 0% commission.',
      'Thanks for being here this early — the best is still ahead.',
    ],
  },
];

const Tag = ({ label }) => {
  const s = TAG_STYLES[label] || TAG_STYLES.New;
  return (
    <span
      className="inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold"
      style={{ backgroundColor: s.bg, color: s.fg }}
    >
      {label}
    </span>
  );
};

const Changelog = () => {
  useEffect(() => {
    const prev = document.title;
    document.title = "What's New · Book A Sloth";
    return () => { document.title = prev; };
  }, []);

  return (
    <div className="relative isolate">
      <Seo
        title="What's New — Book A Sloth Changelog"
        description="Every feature, improvement, and fix shipped to Book A Sloth. Follow the latest updates to the appointment booking platform."
        canonical={`${SITE_URL}/changelog`}
      />
      {/* Decorative animated mesh backdrop (fixed, full-bleed) */}
      <style>{`
        @keyframes clDrift1 { 0%,100% { transform: translate3d(0,0,0) scale(1); }
          50% { transform: translate3d(4%,6%,0) scale(1.12); } }
        @keyframes clDrift2 { 0%,100% { transform: translate3d(0,0,0) scale(1.05); }
          50% { transform: translate3d(-5%,4%,0) scale(0.92); } }
        @keyframes clDrift3 { 0%,100% { transform: translate3d(0,0,0) scale(0.96); }
          50% { transform: translate3d(3%,-5%,0) scale(1.1); } }
        @media (prefers-reduced-motion: reduce) {
          .cl-blob { animation: none !important; }
        }
      `}</style>
      <div
        aria-hidden="true"
        className="fixed inset-0 -z-10 overflow-hidden"
        style={{ backgroundColor: '#FF5A12', backgroundImage: BASE_WASH }}
      >
        {BLOBS.map((b, i) => (
          <span
            key={i}
            className="cl-blob absolute"
            style={{
              top: b.top, left: b.left, width: b.w, height: b.h,
              backgroundImage: b.fill,
              animation: `${b.anim} ${b.dur} ease-in-out ${b.delay} infinite`,
              willChange: 'transform',
            }}
          />
        ))}
      </div>

      <div className="app-container py-12 sm:py-16">
      <div className="mx-auto max-w-3xl">
        {/* Header */}
        <header className="text-center">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary-cta">
            Product updates
          </p>
          <h1 className="mt-2 font-heading text-3xl font-extrabold tracking-tight text-ink sm:text-5xl">
            What’s New
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-[15px] leading-relaxed text-gray-500 sm:text-base">
            Every improvement we’ve shipped to help you get booked and get paid —
            newest first. We’re just getting started.
          </p>
        </header>

        {/* Timeline */}
        <ol className="relative mt-12 border-l border-gray-200 sm:mt-16">
          {RELEASES.map((r) => (
            <li key={r.date + r.title} className="relative ml-5 pb-10 last:pb-0 sm:ml-7">
              {/* node */}
              <span
                aria-hidden="true"
                className="absolute -left-[26px] top-1.5 grid h-3.5 w-3.5 place-items-center rounded-full border-2 border-white bg-primary shadow-[0_0_0_3px_rgba(254,81,0,0.12)] sm:-left-[34px]"
              />
              <div className="page-card p-5 sm:p-6">
                <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                  <time className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                    {r.date}
                  </time>
                  {r.version && (
                    <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-medium text-gray-500">
                      {r.version}
                    </span>
                  )}
                  <span className="flex flex-wrap gap-1.5">
                    {r.tags.map((t) => <Tag key={t} label={t} />)}
                  </span>
                </div>

                <h2 className="mt-2.5 font-heading text-lg font-bold tracking-tight text-ink sm:text-xl">
                  {r.title}
                </h2>

                <ul className="mt-3 space-y-2">
                  {r.points.map((p, i) => (
                    <li key={i} className="flex gap-2.5 text-sm leading-relaxed text-gray-600">
                      <svg viewBox="0 0 24 24" className="mt-1 h-3.5 w-3.5 shrink-0 text-c-emerald" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <path d="M20 6 9 17l-5-5" />
                      </svg>
                      <span>{p}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </li>
          ))}
        </ol>

        {/* Footer CTA */}
        <div className="mt-12 rounded-2xl border border-black/5 bg-[#FFF8EE] px-6 py-10 text-center">
          <h3 className="font-heading text-xl font-bold tracking-tight text-ink sm:text-2xl">
            Want all of this for your bookings?
          </h3>
          <p className="mx-auto mt-2 max-w-md text-sm text-gray-500">
            Set up your page, sync your calendar and start getting paid — at 0% commission.
          </p>
          <Link
            to="/be-a-sloth"
            className="btn mt-5 inline-flex items-center px-5 py-2.5 text-sm font-semibold text-white bg-primary-cta hover:bg-[#d94400] transition-colors duration-150 shadow-sm hover:no-underline"
          >
            Become a host
          </Link>
        </div>
      </div>
      </div>
    </div>
  );
};

export default Changelog;
