/**
 * glossaryData.js — the booking & scheduling glossary (/glossary + /glossary/:slug).
 *
 * Definitional, answer-first content for SEO/AEO ("what is a booking page",
 * "what is a no-show", …). Each entry: a stable slug, the term, a one-line
 * summary (used on the index + in the DefinedTermSet), a fuller definition
 * (answer-first — the first sentence stands alone), and related slugs for
 * internal linking. Plain strings only — these feed DefinedTerm JSON-LD.
 *
 * KEEP SLUGS STABLE (they're URLs). Mirror the slug list in
 * server/services/sitemapService.js (GLOSSARY_SLUGS) when you add/remove terms.
 */

export const GLOSSARY = [
  {
    slug: 'booking-page',
    term: 'Booking page',
    short: 'A personal web page where clients see your services and book a time.',
    def: 'A booking page is a personal web page where your clients see what you offer and book a slot themselves, without messaging you. It shows your services, prices and live availability, and takes payment at the time of booking. On Book A Sloth your booking page lives at a link like bookasloth.com/your-name.',
    related: ['booking-link', 'availability', 'advance-payment'],
  },
  {
    slug: 'booking-link',
    term: 'Booking link',
    short: 'The single shareable URL that opens your booking page.',
    def: 'A booking link is the one URL you share — in your bio, DMs or email signature — that opens your booking page so anyone can book you in a few taps. Instead of trading messages to find a time, you send the link once and clients self-serve. It replaces "what time works for you?" with a slot they pick and pay for.',
    related: ['booking-page', 'availability'],
  },
  {
    slug: 'no-show',
    term: 'No-show',
    short: 'A client who books an appointment and never turns up.',
    def: 'A no-show is a client who books an appointment but does not attend and does not cancel in time, leaving a slot you could have sold empty. No-shows are one of the biggest hidden costs for appointment-based businesses. Taking payment upfront and sending reminders are the two most effective ways to cut them.',
    related: ['advance-payment', 'reminder', 'cancellation-policy'],
  },
  {
    slug: 'advance-payment',
    term: 'Advance payment',
    short: 'Collecting payment at the moment a client books, before the appointment.',
    def: 'Advance payment means the client pays when they book, not after the session. A paid slot is far less likely to be skipped, so advance payment is the single biggest lever against no-shows. On Book A Sloth clients pay upfront over UPI or card through Razorpay, and the money settles to your account.',
    related: ['no-show', 'upi', 'gst-invoice'],
  },
  {
    slug: 'availability',
    term: 'Availability',
    short: 'The hours and days you let clients book, synced to your calendar.',
    def: 'Availability is the set of hours and days you are open for bookings. A good booking tool shows only your real free slots and hides times you are busy, so clients never double-book you. Book A Sloth syncs with Google Calendar so a meeting there blocks the matching slot automatically.',
    related: ['double-booking', 'buffer-time', 'google-calendar-sync'],
  },
  {
    slug: 'double-booking',
    term: 'Double booking',
    short: 'Two clients booked into the same slot by mistake.',
    def: 'Double booking is when two clients end up booked for the same time, usually because availability was tracked by hand. It forces an awkward cancellation and damages trust. Live, calendar-synced availability prevents it by removing a slot the instant it is taken.',
    related: ['availability', 'google-calendar-sync'],
  },
  {
    slug: 'buffer-time',
    term: 'Buffer time',
    short: 'A gap automatically held before or after each appointment.',
    def: 'Buffer time is a gap the system keeps before or after a booking so you are not scheduled back-to-back. It gives you time to reset, travel or write notes between clients. Buffers are set once per service and applied to every slot automatically.',
    related: ['availability', 'lead-time'],
  },
  {
    slug: 'lead-time',
    term: 'Lead time',
    short: 'The minimum notice required before a slot can be booked.',
    def: 'Lead time (or minimum notice) is how far in advance a client must book — for example, "no bookings within 2 hours of the start". It stops last-minute bookings you cannot prepare for. It is set per service and enforced automatically at checkout.',
    related: ['availability', 'buffer-time'],
  },
  {
    slug: 'cancellation-policy',
    term: 'Cancellation policy',
    short: 'Your rules for refunds and changes when a client cancels.',
    def: 'A cancellation policy sets out what happens when a client cancels or reschedules — how much notice is required and whether the payment is refunded. A clear policy, shown before payment, protects your time and sets expectations. Pair it with advance payment so late cancellations do not cost you the whole slot.',
    related: ['advance-payment', 'no-show', 'reschedule'],
  },
  {
    slug: 'reschedule',
    term: 'Reschedule',
    short: 'Moving an existing booking to a new time without rebooking.',
    def: 'Rescheduling is moving a confirmed booking to a different slot without cancelling and starting over. Letting clients reschedule themselves (within your policy) reduces no-shows, because a client who cannot make it moves the slot instead of simply not turning up. The calendar and reminders update automatically.',
    related: ['cancellation-policy', 'reminder'],
  },
  {
    slug: 'reminder',
    term: 'Appointment reminder',
    short: 'An automatic message that nudges a client before their appointment.',
    def: 'An appointment reminder is an automatic message — WhatsApp, email or SMS — sent before a booking so the client remembers to show up. Reminders are one of the most effective ways to reduce no-shows. In India, WhatsApp reminders are especially effective because they see far higher open rates than email.',
    related: ['no-show', 'whatsapp-reminder'],
  },
  {
    slug: 'whatsapp-reminder',
    term: 'WhatsApp reminder',
    short: 'An appointment reminder delivered over WhatsApp.',
    def: 'A WhatsApp reminder is an automated booking reminder sent over WhatsApp instead of (or alongside) email. In India WhatsApp open rates are above 90%, versus roughly 20% for email, so WhatsApp reminders cut no-shows more effectively. Book A Sloth sends them automatically on paid plans.',
    related: ['reminder', 'no-show'],
  },
  {
    slug: 'upi',
    term: 'UPI payment',
    short: "India's instant bank-to-bank payment system (PhonePe, Google Pay, Paytm).",
    def: 'UPI (Unified Payments Interface) is India\'s instant, bank-to-bank payment system used by apps like PhonePe, Google Pay and Paytm. For a booking business it means clients can pay a deposit or the full fee in seconds from their phone. Book A Sloth accepts UPI (plus cards, net banking and wallets) through Razorpay at the time of booking.',
    related: ['advance-payment', 'gst-invoice', 'payment-gateway'],
  },
  {
    slug: 'gst-invoice',
    term: 'GST invoice',
    short: 'A tax-compliant invoice that itemises the GST charged on a service.',
    def: 'A GST invoice is a tax-compliant bill that shows the base fee and the GST charged on top, split into CGST and SGST for an intra-state supply. Indian professionals above the registration threshold must issue one for taxable services. Book A Sloth can generate a GST-ready invoice automatically for every paid booking.',
    related: ['upi', 'advance-payment'],
  },
  {
    slug: 'payment-gateway',
    term: 'Payment gateway',
    short: 'The service that securely processes a client\'s online payment.',
    def: 'A payment gateway is the service that securely takes a client\'s card or UPI payment online and moves the money to your account. Book A Sloth uses Razorpay, an RBI-authorised payment aggregator, so payments are handled to Indian regulatory standards and you never touch raw card details.',
    related: ['upi', 'advance-payment', 'payout'],
  },
  {
    slug: 'payout',
    term: 'Payout',
    short: 'The transfer of your earned booking money to your bank account.',
    def: 'A payout is the transfer of money a client paid for a booking into your own bank account. The gateway collects the payment upfront and settles your share to you, typically after the session completes. On Book A Sloth paid plans there is 0% commission, so you keep the full fee minus a small flat platform fee and the gateway\'s standard charge.',
    related: ['payment-gateway', 'commission', 'advance-payment'],
  },
  {
    slug: 'commission',
    term: 'Commission',
    short: 'A percentage of each booking the platform keeps.',
    def: 'Commission is a cut the platform takes from every booking, so the more you earn the more you pay. Many booking and creator platforms charge it. Book A Sloth charges 0% commission on paid plans — a flat fee instead — so your price does not scale against you.',
    related: ['payout', 'platform-fee'],
  },
  {
    slug: 'platform-fee',
    term: 'Platform fee',
    short: 'A small fixed charge per booking, instead of a percentage cut.',
    def: 'A platform fee is a fixed amount charged per booking — unlike commission, it does not grow with your price. Book A Sloth\'s paid plans use a flat per-booking fee plus the payment gateway\'s standard charge, and take no commission, so a bigger booking does not mean a bigger platform cut.',
    related: ['commission', 'payout'],
  },
  {
    slug: 'google-calendar-sync',
    term: 'Google Calendar sync',
    short: 'Two-way linking of your bookings with your Google Calendar.',
    def: 'Google Calendar sync connects your booking tool to your Google Calendar both ways: new bookings appear as calendar events, and events you already have block those slots from being booked. It is the simplest way to avoid double booking across work and personal commitments. Book A Sloth also creates a Google Meet link for online sessions.',
    related: ['availability', 'double-booking'],
  },
  {
    slug: 'round-robin',
    term: 'Round-robin booking',
    short: 'Spreading bookings evenly across several team members.',
    def: 'Round-robin booking distributes incoming bookings across a team so each member gets an even share, or so the next free person is assigned automatically. It is used by clinics, agencies and studios with multiple providers. It keeps one person from being overloaded while another sits idle.',
    related: ['availability', 'booking-page'],
  },
  {
    slug: 'intake-form',
    term: 'Intake form',
    short: 'Questions a client answers while booking, so you arrive prepared.',
    def: 'An intake form collects the details you need from a client at the moment they book — goals, history, links or files — so you walk into the session prepared. It replaces a round of back-and-forth before the first meeting. Answers are attached to the booking automatically.',
    related: ['booking-page', 'booking-link'],
  },
  {
    slug: 'digital-product',
    term: 'Digital product',
    short: 'A downloadable item (guide, template, recording) sold from your page.',
    def: 'A digital product is a file you sell for instant download — a PDF guide, template, worksheet or recording — alongside your bookable sessions. It lets you earn without trading time for every rupee. On Book A Sloth you can list digital products on the same page as your services and get paid upfront.',
    related: ['booking-page', 'advance-payment'],
  },
  {
    slug: 'meeting-link',
    term: 'Meeting link',
    short: 'The video-call URL auto-created for an online booking.',
    def: 'A meeting link is the video-call URL (such as Google Meet) generated automatically when a client books an online session, and sent to both of you with the confirmation and reminders. Nobody has to create or share it by hand. For in-person services the booking carries your location instead.',
    related: ['google-calendar-sync', 'reminder'],
  },
];

export const glossaryBySlug = (slug) => GLOSSARY.find((g) => g.slug === slug) || null;
export const GLOSSARY_SLUGS = GLOSSARY.map((g) => g.slug);
