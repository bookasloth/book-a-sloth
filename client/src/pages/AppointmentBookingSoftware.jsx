import { useState } from "react";
import { Link } from "react-router-dom";
import {
  Calendar, CreditCard, Bell, ShieldCheck, Globe, Zap, Users, IndianRupee,
  Stethoscope, Scissors, Dumbbell, BarChart3, GraduationCap, Camera, Scale, Building2,
  Check, ArrowRight, Plus, Sparkles, Star, Percent, Clock, CalendarCheck,
} from "lucide-react";
import Reveal from "../components/home/Reveal";
import Seo from "../components/common/Seo";
import PricingCards from "../components/pricing/PricingCards";
import { HERO_FACES } from "../components/home/images";
import { TESTIMONIALS } from "../data/testimonials";
import { SITE_URL } from "../utils/seo";
import { ogCard } from "../config/ogImages";

// /appointment-booking-software — SEO/AEO/GEO landing targeting the head term
// "appointment booking software" and its profession/intent long-tail (doctor,
// salon, dental, spa, gym, hospital, medical, online, free, best, white-label).
//
// Unique content on the site's design language — NOT a homepage clone (a
// near-duplicate would be canonicalised away and never rank). Self-canonical.
// JSON-LD graph (SoftwareApplication + Service + FAQPage + BreadcrumbList) is
// baked for crawlers/AEO by scripts/prerender.mjs — this route is registered
// there and in both reserved-segment lists. No aggregateRating by design
// (platform rating lives only on the homepage node — see bas-seo-schema skill).

const ROUTE_START = "/be-a-sloth";
const CANONICAL = `${SITE_URL}/appointment-booking-software`;

const STATS = [
  { icon: Percent, value: "0%", label: "Commission on the paid plan" },
  { icon: IndianRupee, value: "₹9.86", label: "A day for Sloth Active" },
  { icon: Bell, value: "24×7", label: "Automatic WhatsApp & email reminders" },
  { icon: Zap, value: "5 min", label: "To set up your booking page" },
];

const FEATURES = [
  { icon: Globe, title: "Your own booking page", desc: "A shareable link where clients pick a service and a slot in seconds — no app to install, works on any phone." },
  { icon: CreditCard, title: "Payments built in", desc: "Collect the fee upfront over UPI or card through Razorpay, so no-shows cost you nothing." },
  { icon: Bell, title: "Automatic reminders", desc: "Confirmation, 24-hour and 1-hour reminders over email and WhatsApp — the software chases, not you." },
  { icon: Calendar, title: "Calendar sync", desc: "Two-way Google Calendar and Meet, so a booking blocks your time and creates the meeting link instantly." },
  { icon: IndianRupee, title: "GST invoices & payouts", desc: "Every paid booking generates a GST invoice and settles to your bank after KYC — books that reconcile themselves." },
  { icon: Users, title: "Client CRM", desc: "Records, notes and history for every client, with follow-up and rebook automation to fill quiet weeks." },
];

// Supporting keyword → the /for/* landing that already ranks for it, so this
// page also passes internal-link equity to the profession pages.
const PROFESSIONS = [
  { icon: Stethoscope, kw: "Doctor & clinic appointment booking software", to: "/for/doctors", desc: "Medical, dental and hospital scheduling with patient reminders, upfront consultation fees and GST receipts." },
  { icon: Scissors, kw: "Salon & spa appointment booking software", to: "/for/salon", desc: "Hair salon and spa bookings with deposits, service menus and no-show protection — the best fit for beauty & wellness." },
  { icon: Dumbbell, kw: "Gym & fitness appointment booking software", to: "/for/fitness", desc: "Class and personal-training slots, session packs and reminders that keep members turning up." },
  { icon: BarChart3, kw: "Consultant appointment booking software", to: "/for/business-consultant", desc: "Advisory and coaching calls booked and paid before they start, with automatic follow-ups." },
  { icon: GraduationCap, kw: "Tutor appointment booking software", to: "/for/tutors", desc: "Online and in-person classes, recurring slots and parent reminders in one link." },
  { icon: Camera, kw: "Photographer appointment booking software", to: "/for/photographers", desc: "Shoots booked with a deposit, calendar-synced, and confirmed without the back-and-forth." },
  { icon: Scale, kw: "Lawyer & CA appointment booking software", to: "/for/lawyers", desc: "Paid consultations with clean GST invoicing for legal, tax and financial practices." },
  { icon: Building2, kw: "Agency appointment booking software", to: "/for/agencies", desc: "One booking page for the whole team, with payments and reminders handled end to end." },
];

const FAQ = [
  {
    q: "What is appointment booking software?",
    a: "Appointment booking software lets clients see your availability and book a time slot online, instead of messaging you to arrange it. Book A Sloth adds upfront payment, automatic email and WhatsApp reminders, calendar sync and GST invoicing, so the whole appointment — booked, paid and reminded — runs itself from a single link.",
  },
  {
    q: "Is there free appointment booking software?",
    a: "Yes. Book A Sloth's Sloth plan is free forever with unlimited services and bookings — you only pay a 5% fee when you actually get paid, and nothing when you don't. It's genuinely free online appointment booking software, not a time-limited trial. Upgrade to Sloth Active to drop the commission to 0%.",
  },
  {
    q: "Which is the best appointment booking software for doctors and clinics?",
    a: "For Indian clinics, the best appointment booking software is one that collects the consultation fee upfront, sends patient reminders and produces GST invoices automatically. Book A Sloth does all three, and works for dental, medical and multi-doctor hospital setups from one booking page.",
  },
  {
    q: "Do you offer online appointment booking software for salons and spas?",
    a: "Yes. Salons, hair studios and spas use Book A Sloth as online appointment booking software with deposits, service menus and no-show protection, so a booked slot is a paid slot.",
  },
  {
    q: "Can I use it as a white-label appointment booking system?",
    a: "Your booking page runs on your own custom URL with your brand, colours and services. It isn't a fully re-badged reseller product, but for most creators and clinics it delivers the white-label appointment booking experience their clients expect.",
  },
  {
    q: "Does the software send appointment reminders?",
    a: "Every booking triggers a confirmation plus 24-hour and 1-hour reminders over email and WhatsApp, along with reschedule and cancellation alerts — timely appointment reminders your clients actually see.",
  },
];

const JSON_LD = [
  {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "Book A Sloth",
    applicationCategory: "BusinessApplication",
    applicationSubCategory: "Appointment Scheduling Software",
    operatingSystem: "Web",
    url: CANONICAL,
    description:
      "Appointment booking software for Indian doctors, salons, gyms, consultants and creators — online scheduling, upfront payments, reminders and GST invoices in one link.",
    offers: [
      { "@type": "Offer", price: "0", priceCurrency: "INR", name: "Sloth plan (free)" },
      { "@type": "Offer", price: "3599", priceCurrency: "INR", name: "Sloth Active plan (yearly)" },
    ],
    // No aggregateRating: platform rating lives only on the homepage node
    // (bas-seo-schema skill). Never a fabricated rating on a marketing page.
  },
  {
    "@context": "https://schema.org",
    "@type": "Service",
    serviceType: "Appointment booking software",
    provider: { "@type": "Organization", name: "Book A Sloth", url: SITE_URL },
    areaServed: "IN",
    url: CANONICAL,
    description:
      "Online appointment booking and scheduling software with payments, reminders and GST invoicing for professionals in India.",
  },
  {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQ.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  },
  {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: `${SITE_URL}/` },
      { "@type": "ListItem", position: 2, name: "Appointment Booking Software", item: CANONICAL },
    ],
  },
];

/* Soft decorative gradient orb — pure CSS, aria-hidden. Adds depth without an asset. */
function Orb({ className }) {
  return <div aria-hidden className={`pointer-events-none absolute rounded-full blur-3xl ${className}`} />;
}

/* Hero social-proof face with neutral fallback chip. */
function Face({ src }) {
  return src ? (
    <img src={src} alt="" loading="lazy" className="h-9 w-9 flex-shrink-0 rounded-full border-2 border-white object-cover" onError={(e) => { e.currentTarget.style.visibility = "hidden"; }} />
  ) : (
    <span className="h-9 w-9 flex-shrink-0 rounded-full border-2 border-white bg-primary/20" />
  );
}

/* Testimonial avatar with initials fallback. */
function TAvatar({ src, name }) {
  return src ? (
    <img src={src} alt={name} loading="lazy" className="h-11 w-11 flex-shrink-0 rounded-xl object-cover" onError={(e) => { e.currentTarget.style.display = "none"; }} />
  ) : (
    <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-primary/12 text-sm font-bold text-primary">
      {name?.charAt(0) || "★"}
    </div>
  );
}

/* Hero product mockup — a CSS booking page (no screenshot), with a floating
   "fee received" chip. Brand tokens, not the /for/ page's --lp vars. */
function BookingMock() {
  const services = [
    { name: "Consultation — 30 min", meta: "Video · Google Meet", price: "₹1,500" },
    { name: "Follow-up session", meta: "In-person", price: "₹800" },
    { name: "Priority slot — same day", meta: "Video", price: "₹2,500" },
  ];
  return (
    <div className="relative mx-auto w-full max-w-sm">
      <div className="overflow-hidden rounded-[14px] bg-white shadow-[0_40px_90px_-30px_rgba(26,26,26,0.5)] ring-1 ring-black/10">
        <div className="flex items-center gap-2 border-b border-black/5 bg-neutral-50 px-4 py-2.5">
          <span className="flex gap-1.5" aria-hidden>
            <span className="h-2.5 w-2.5 rounded-full bg-neutral-300" />
            <span className="h-2.5 w-2.5 rounded-full bg-neutral-300" />
            <span className="h-2.5 w-2.5 rounded-full bg-neutral-300" />
          </span>
          <div className="ml-2 flex-1 truncate rounded-full bg-white px-3 py-1 text-[11px] text-neutral-400 ring-1 ring-inset ring-black/5">
            bookasloth.com/your-name
          </div>
        </div>
        <div className="p-5">
          <div className="relative">
            <div className="h-14 rounded-[8px] bg-gradient-to-r from-primary to-primary-cta" />
            <div className="absolute -bottom-5 left-3 flex h-12 w-12 items-center justify-center rounded-2xl border-[3px] border-white bg-primary-cta text-sm font-bold text-white">
              BA
            </div>
          </div>
          <div className="pl-1 pt-6">
            <div className="text-sm font-bold text-ink">Your booking page</div>
            <span className="mt-0.5 inline-block rounded-full bg-primary/12 px-2 py-0.5 text-[10px] font-semibold text-primary">
              Accepting bookings
            </span>
          </div>
          <div className="mt-4 space-y-2.5">
            {services.map((s) => (
              <div key={s.name} className="flex items-center justify-between rounded-[8px] border border-neutral-100 bg-white p-3">
                <div className="min-w-0">
                  <div className="truncate text-xs font-semibold text-ink">{s.name}</div>
                  <div className="mt-0.5 text-[10px] text-neutral-400">{s.meta}</div>
                </div>
                <div className="flex items-center gap-2 pl-2">
                  <span className="text-xs font-bold text-ink">{s.price}</span>
                  <span className="rounded-[6px] bg-primary-cta px-2.5 py-1 text-[10px] font-bold text-white">Book</span>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-3 flex items-center gap-1.5 pl-0.5 text-[10px] font-medium text-neutral-500">
            <ShieldCheck size={12} className="text-primary-cta" />
            Fee paid securely before the appointment
          </div>
        </div>
      </div>
      {/* Floating chips */}
      <div className="absolute -right-3 top-14 hidden rounded-2xl bg-white px-3 py-2 shadow-xl ring-1 ring-black/5 sm:block">
        <div className="text-[10px] font-medium text-neutral-400">Fee received</div>
        <div className="text-sm font-bold text-primary-cta">₹2,500</div>
      </div>
      <div className="absolute -left-4 bottom-16 hidden items-center gap-2 rounded-2xl bg-white px-3 py-2 shadow-xl ring-1 ring-black/5 sm:flex">
        <CalendarCheck size={16} className="text-primary" />
        <div>
          <div className="text-[10px] font-medium text-neutral-400">New booking</div>
          <div className="text-xs font-bold text-ink">Confirmed · 4:30 PM</div>
        </div>
      </div>
    </div>
  );
}

/* Single-open FAQ accordion (design-token styled, matches the /for/ pages). */
function FaqAccordion({ faq }) {
  const [open, setOpen] = useState(0);
  return (
    <div className="space-y-3">
      {faq.map((f, i) => {
        const isOpen = open === i;
        return (
          <div key={f.q} className={`overflow-hidden rounded-[10px] border bg-white transition-colors ${isOpen ? "border-primary/40" : "border-black/5"}`}>
            <button
              type="button"
              onClick={() => setOpen(isOpen ? null : i)}
              aria-expanded={isOpen}
              className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left text-base font-semibold text-ink"
            >
              {f.q}
              <span
                className={`flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary transition-transform duration-300 ${isOpen ? "rotate-45" : ""}`}
              >
                <Plus size={15} />
              </span>
            </button>
            {isOpen && <p className="px-5 pb-4 text-[15px] leading-relaxed text-neutral-500">{f.a}</p>}
          </div>
        );
      })}
    </div>
  );
}

export default function AppointmentBookingSoftware() {
  const testimonials = TESTIMONIALS.slice(0, 3);
  return (
    <main className="overflow-x-clip bg-white">
      <Seo
        title="Appointment Booking Software for Clinics, Salons & Consultants | Book A Sloth"
        description="Appointment booking software for Indian doctors, salons, spas, gyms, tutors and consultants. Online scheduling, upfront UPI payments, WhatsApp reminders and GST invoices in one link. Free to start."
        keywords="appointment booking software, online appointment booking software, free appointment booking software, doctor appointment booking software, salon appointment booking software, best appointment booking software"
        canonical={CANONICAL}
        robots="index, follow, max-image-preview:large, max-snippet:-1"
        siteName="Book A Sloth"
        locale="en_IN"
        ogTitle="Appointment Booking Software that books, bills and reminds for you"
        ogDescription="One link for scheduling, payments, reminders and GST invoices — free to start. Built for professionals in India."
        image={ogCard("home")}
        jsonLd={JSON_LD}
      />

      {/* ── Hero (two-column, tinted, decorative) ────────────── */}
      <section className="relative overflow-hidden bg-gradient-to-b from-sand/60 to-white px-5 pb-16 pt-14 sm:px-8 lg:pt-20">
        <Orb className="-left-24 -top-24 h-80 w-80 bg-primary/15" />
        <Orb className="-right-20 top-32 h-72 w-72 bg-primary-cta/10" />
        <div className="relative mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-[1.05fr_0.95fr]">
          {/* LEFT — copy */}
          <div className="text-center lg:text-left">
            <Reveal as="span" className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-semibold text-primary">
              <Sparkles size={13} /> Booking · payments · reminders in one link
            </Reveal>
            <Reveal as="h1" delay={0.05} className="mt-5 text-4xl font-extrabold leading-[1.08] tracking-tight text-ink sm:text-5xl lg:text-6xl">
              Appointment booking software <span className="text-primary-cta">that runs itself.</span>
            </Reveal>
            <Reveal as="p" delay={0.1} className="mx-auto mt-5 max-w-[560px] text-lg text-neutral-500 lg:mx-0">
              Online appointment booking software for professionals in India — doctors, salons,
              gyms, tutors and consultants. One link handles scheduling, upfront payments,
              WhatsApp reminders and GST invoices. Free to start.
            </Reveal>
            <Reveal delay={0.16} className="mt-8 flex flex-col items-center gap-3 sm:flex-row lg:justify-start">
              <Link
                to={ROUTE_START}
                className="inline-flex w-full items-center justify-center gap-2 rounded-[6px] bg-primary-cta px-7 py-4 text-sm font-semibold text-white shadow-lg transition-transform hover:bg-primary-dark hover:no-underline sm:w-auto"
              >
                Create your free booking page <ArrowRight size={16} />
              </Link>
              <Link to="/pricing" className="text-sm font-semibold text-ink underline-offset-4 hover:underline">
                See pricing
              </Link>
            </Reveal>
            {/* Social proof */}
            <Reveal delay={0.22} className="mt-9 flex items-center justify-center gap-4 lg:justify-start">
              <div className="flex -space-x-3">
                {HERO_FACES.map((f, i) => <Face key={i} src={f} />)}
              </div>
              <div className="text-left">
                <div className="flex items-center gap-1">
                  {[0, 1, 2, 3, 4].map((i) => <Star key={i} size={13} className="fill-amber-400 text-amber-400" />)}
                  <span className="ml-1 text-sm font-semibold text-ink">5/5</span>
                </div>
                <p className="text-xs text-neutral-400">Loved by India's creators, clinics &amp; coaches.</p>
              </div>
            </Reveal>
          </div>
          {/* RIGHT — product mockup */}
          <Reveal delay={0.12} className="hidden lg:block">
            <BookingMock />
          </Reveal>
        </div>
      </section>

      {/* ── Stat band ────────────────────────────────────────── */}
      <section className="border-y border-black/5 bg-ink px-5 py-12 sm:px-8">
        <div className="mx-auto grid max-w-5xl grid-cols-2 gap-8 lg:grid-cols-4">
          {STATS.map((s, i) => (
            <Reveal key={s.label} delay={i * 0.06} className="text-center">
              <s.icon size={22} className="mx-auto text-primary" />
              <div className="mt-2 font-heading text-3xl font-extrabold tracking-tight text-white sm:text-4xl">{s.value}</div>
              <p className="mx-auto mt-1.5 max-w-[13rem] text-xs leading-snug text-neutral-400">{s.label}</p>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ── What is it (AEO definition band) ─────────────────── */}
      <section className="relative overflow-hidden px-5 py-16 sm:px-8 lg:py-20">
        <Orb className="left-1/2 top-0 h-64 w-64 -translate-x-1/2 bg-primary/8" />
        <div className="relative mx-auto max-w-3xl text-center">
          <Reveal as="span" className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-primary">
            The basics
          </Reveal>
          <Reveal as="h2" delay={0.05} className="mt-4 text-2xl font-extrabold text-ink sm:text-3xl">
            What is appointment booking software?
          </Reveal>
          <Reveal as="p" delay={0.08} className="mx-auto mt-4 max-w-[720px] text-neutral-600">
            Appointment booking software lets your clients see when you're free and book a slot
            online, instead of messaging back and forth. Good software also takes the payment
            upfront, sends automatic reminders, syncs your calendar and issues an invoice — so
            an appointment is booked, paid and confirmed without you lifting a finger. Book A
            Sloth does all of that from a single shareable link.
          </Reveal>
        </div>
      </section>

      {/* ── Features ─────────────────────────────────────────── */}
      <section className="px-5 pb-16 sm:px-8 lg:pb-24">
        <div className="mx-auto max-w-[1050px]">
          <Reveal as="h2" className="text-center text-3xl font-extrabold text-ink sm:text-4xl">
            Everything an online booking system should do
          </Reveal>
          <Reveal as="p" delay={0.05} className="mx-auto mt-3 max-w-[620px] text-center text-neutral-500">
            Scheduling is the easy part. Book A Sloth also gets you paid and keeps clients coming back.
          </Reveal>
          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f, i) => (
              <Reveal key={f.title} delay={(i % 3) * 0.06}>
                <div className="flex h-full flex-col rounded-[10px] border border-black/5 bg-white p-6 shadow-[0_8px_30px_rgba(26,26,26,0.04)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_22px_45px_-18px_rgba(26,26,26,0.16)]">
                  <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <f.icon size={22} />
                  </span>
                  <h3 className="mt-5 font-heading text-base font-bold text-ink">{f.title}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-neutral-500">{f.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── Real-page proof (product screenshot) ─────────────── */}
      <section className="bg-sand/40 px-5 py-16 sm:px-8 lg:py-24">
        <div className="mx-auto grid max-w-6xl items-center gap-10 lg:grid-cols-2 lg:gap-16">
          <div className="text-center lg:text-left">
            <Reveal as="span" className="inline-flex items-center gap-2 rounded-full bg-primary-cta/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-primary-cta">
              <span className="inline-block h-2 w-2 rounded-full bg-primary-cta" /> Live right now
            </Reveal>
            <Reveal as="h2" delay={0.05} className="mt-5 text-3xl font-extrabold leading-tight text-ink sm:text-4xl">
              Not a mockup. <span className="text-primary-cta">A real booking page.</span>
            </Reveal>
            <Reveal as="p" delay={0.08} className="mx-auto mt-4 max-w-md text-neutral-500 lg:mx-0">
              Everything here is the actual product — profile, services, prices and a working Book
              Now button. Open a live appointment booking page and book it this second.
            </Reveal>
            <Reveal delay={0.14} className="mt-7">
              <Link to="/sndatarkar" className="inline-flex items-center justify-center gap-2 rounded-[6px] border border-primary-cta px-6 py-3.5 text-sm font-semibold text-primary-cta transition-all hover:bg-primary-cta hover:text-white hover:no-underline">
                Open a real page <ArrowRight size={16} />
              </Link>
            </Reveal>
          </div>
          <Reveal delay={0.1}>
            <picture>
              <source media="(max-width: 640px)" srcSet="/images/real-page-mobile.webp" />
              <img
                src="/images/real-page.webp"
                alt="A real, live Book A Sloth appointment booking page — profile, services, prices and a Book Now button"
                width="1440"
                height="900"
                loading="lazy"
                decoding="async"
                className="w-full rounded-xl border border-black/5 shadow-[0_30px_70px_-30px_rgba(26,26,26,0.35)]"
              />
            </picture>
          </Reveal>
        </div>
      </section>

      {/* ── Profession grid (supporting keywords + internal links) ── */}
      <section className="px-5 py-16 sm:px-8 lg:py-24">
        <div className="mx-auto max-w-[1050px]">
          <Reveal as="h2" className="text-center text-3xl font-extrabold text-ink sm:text-4xl">
            Appointment booking software for every profession
          </Reveal>
          <Reveal as="p" delay={0.05} className="mx-auto mt-3 max-w-[640px] text-center text-neutral-500">
            One platform, tuned for how your work actually books. Pick your field and see it in action.
          </Reveal>
          <div className="mt-12 grid gap-5 sm:grid-cols-2">
            {PROFESSIONS.map((p, i) => (
              <Reveal key={p.kw} delay={(i % 2) * 0.06}>
                <Link
                  to={p.to}
                  className="flex h-full items-start gap-4 rounded-[10px] border border-black/5 bg-white p-6 shadow-[0_8px_30px_rgba(26,26,26,0.04)] transition-all duration-300 hover:-translate-y-1 hover:no-underline hover:shadow-[0_22px_45px_-18px_rgba(26,26,26,0.16)]"
                >
                  <span className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <p.icon size={20} />
                  </span>
                  <span className="min-w-0">
                    <span className="block font-heading text-base font-bold text-ink">{p.kw}</span>
                    <span className="mt-1 block text-sm leading-relaxed text-neutral-500">{p.desc}</span>
                    <span className="mt-2 inline-flex items-center gap-1 text-sm font-semibold text-primary-cta">
                      Explore <ArrowRight size={14} />
                    </span>
                  </span>
                </Link>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── Testimonials ─────────────────────────────────────── */}
      <section className="bg-sand/40 px-5 py-16 sm:px-8 lg:py-24">
        <div className="mx-auto max-w-6xl">
          <Reveal as="h2" className="text-center text-3xl font-extrabold text-ink sm:text-4xl">
            Booked, paid and reminded — without the admin
          </Reveal>
          <div className="mt-12 grid gap-5 sm:grid-cols-3 sm:gap-6">
            {testimonials.map((t, i) => (
              <Reveal key={t.name} delay={(i % 3) * 0.08}>
                <figure className="flex h-full flex-col justify-between rounded-[10px] border border-black/5 bg-white p-7 shadow-[0_8px_30px_rgba(26,26,26,0.05)]">
                  <span aria-hidden className="block h-[3px] w-10 rounded-full bg-primary-cta" />
                  <blockquote className="mt-4 flex-1 text-[15px] font-semibold leading-snug text-ink">
                    “{t.quote}”
                  </blockquote>
                  <figcaption className="mt-6 flex items-center gap-3">
                    <TAvatar src={t.avatar} name={t.name} />
                    <div>
                      <div className="text-sm font-bold text-ink">{t.name}</div>
                      <div className="text-xs text-neutral-400">{t.role}</div>
                    </div>
                  </figcaption>
                </figure>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── Free / online intent band ────────────────────────── */}
      <section className="relative overflow-hidden px-5 py-16 sm:px-8 lg:py-24">
        <Orb className="-right-24 top-10 h-72 w-72 bg-primary/10" />
        <div className="relative mx-auto grid max-w-[1050px] items-center gap-10 lg:grid-cols-2">
          <div>
            <Reveal as="h2" className="text-3xl font-extrabold leading-tight text-ink sm:text-4xl">
              Free online appointment booking software — <span className="text-primary-cta">not a trial.</span>
            </Reveal>
            <Reveal as="p" delay={0.05} className="mt-4 max-w-md text-neutral-500">
              Start on the free Sloth plan with unlimited services and bookings. You pay 5% only
              when a client actually pays you, and nothing when they don't. Ready to keep every
              rupee? Sloth Active removes the commission for about ₹10 a day.
            </Reveal>
            <Reveal delay={0.1} className="mt-6 space-y-3">
              {["Unlimited services & bookings on the free plan", "Upfront UPI & card payments", "WhatsApp + email reminders", "GST invoices and bank payouts"].map((t) => (
                <p key={t} className="flex items-start gap-2.5 text-sm text-neutral-600">
                  <Check size={16} className="mt-0.5 flex-shrink-0 text-primary" /> {t}
                </p>
              ))}
            </Reveal>
            <Reveal delay={0.14} className="mt-7">
              <Link
                to={ROUTE_START}
                className="inline-flex items-center justify-center gap-2 rounded-[6px] bg-ink px-6 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90 hover:no-underline"
              >
                Start free <ArrowRight size={16} />
              </Link>
            </Reveal>
          </div>
          <Reveal delay={0.08} className="grid grid-cols-2 gap-4">
            {[
              { icon: Zap, t: "Live in minutes", d: "Claim a link, add services, share it." },
              { icon: ShieldCheck, t: "No-show proof", d: "Fees paid before the slot is held." },
              { icon: Sparkles, t: "Runs itself", d: "Reminders and invoices, automatic." },
              { icon: Clock, t: "Any device", d: "Works on every phone and browser." },
            ].map((c) => (
              <div key={c.t} className="rounded-[10px] border border-black/5 bg-white p-5 shadow-[0_8px_30px_rgba(26,26,26,0.04)]">
                <c.icon size={20} className="text-primary-cta" />
                <p className="mt-3 font-heading text-sm font-bold text-ink">{c.t}</p>
                <p className="mt-1 text-xs leading-relaxed text-neutral-500">{c.d}</p>
              </div>
            ))}
          </Reveal>
        </div>
      </section>

      {/* ── Pricing (shared cards) ───────────────────────────── */}
      <section className="bg-sand/40 px-5 py-16 sm:px-8 lg:py-24">
        <div className="mx-auto max-w-[1050px]">
          <Reveal as="h2" className="text-center text-3xl font-extrabold text-ink sm:text-4xl">
            Simple pricing for booking software
          </Reveal>
          <Reveal as="p" delay={0.05} className="mx-auto mb-10 mt-3 max-w-[620px] text-center text-neutral-500">
            Free to start. 0% commission when you go Active. All prices include GST.
          </Reveal>
          <PricingCards />
          <p className="mt-8 text-center">
            <Link to="/pricing" className="text-sm font-semibold text-primary-cta hover:text-primary-dark hover:underline">
              Compare all plans &amp; features →
            </Link>
          </p>
        </div>
      </section>

      {/* ── FAQ (AEO) ────────────────────────────────────────── */}
      <section className="px-5 py-16 sm:px-8 lg:py-24">
        <div className="mx-auto max-w-3xl">
          <Reveal as="h2" className="text-center text-3xl font-extrabold text-ink sm:text-4xl">
            Appointment booking software — your questions, answered
          </Reveal>
          <div className="mt-10">
            <FaqAccordion faq={FAQ} />
          </div>
        </div>
      </section>

      {/* ── Final CTA ────────────────────────────────────────── */}
      <section className="px-5 pb-24 sm:px-8">
        <div className="relative mx-auto max-w-3xl overflow-hidden rounded-[14px] bg-ink px-8 py-14 text-center text-white">
          <Orb className="-left-16 -top-16 h-56 w-56 bg-primary/25" />
          <Orb className="-right-16 -bottom-16 h-56 w-56 bg-primary-cta/20" />
          <div className="relative">
            <h2 className="text-3xl font-extrabold text-primary sm:text-4xl">Get booked, paid and reminded.</h2>
            <p className="mx-auto mt-3 max-w-[520px] text-neutral-300">
              Set up your appointment booking software in minutes. Free to start, upgrade whenever your bookings grow.
            </p>
            <Link
              to={ROUTE_START}
              className="mt-7 inline-flex items-center justify-center gap-2 rounded-[6px] bg-primary-cta px-7 py-3.5 text-sm font-semibold text-white shadow-lg transition-transform hover:bg-primary-dark hover:no-underline"
            >
              Create your free booking page <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
