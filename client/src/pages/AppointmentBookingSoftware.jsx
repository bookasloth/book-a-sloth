import { useState } from "react";
import { Link } from "react-router-dom";
import {
  Calendar, CreditCard, Bell, ShieldCheck, Globe, Zap, Users, IndianRupee,
  Stethoscope, Scissors, Dumbbell, BarChart3, GraduationCap, Camera, Scale, Building2,
  Check, ArrowRight, Plus, Sparkles,
} from "lucide-react";
import Reveal from "../components/home/Reveal";
import Seo from "../components/common/Seo";
import PricingCards from "../components/pricing/PricingCards";
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
  return (
    <main className="bg-white">
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

      {/* ── Hero ─────────────────────────────────────────────── */}
      <section className="px-5 pb-14 pt-16 sm:px-8 lg:pt-24">
        <div className="mx-auto max-w-3xl text-center">
          <Reveal as="h1" className="text-4xl font-extrabold leading-tight text-ink sm:text-5xl lg:text-6xl">
            Appointment booking software <span className="text-primary-cta">that runs itself.</span>
          </Reveal>
          <Reveal as="p" delay={0.06} className="mx-auto mt-5 max-w-[680px] text-lg text-neutral-500">
            Book A Sloth is online appointment booking software for professionals in India —
            doctors, salons, gyms, tutors and consultants. One link handles scheduling, upfront
            payments, WhatsApp reminders and GST invoices. Free to start.
          </Reveal>
          <Reveal delay={0.12} className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              to={ROUTE_START}
              className="inline-flex w-full items-center justify-center gap-2 rounded-[6px] bg-primary-cta px-7 py-4 text-sm font-semibold text-white transition-transform hover:bg-primary-dark hover:no-underline sm:w-auto"
            >
              Create your free booking page <ArrowRight size={16} />
            </Link>
            <Link to="/pricing" className="text-sm font-semibold text-ink underline-offset-4 hover:underline">
              See pricing
            </Link>
          </Reveal>
          <Reveal as="p" delay={0.16} className="mt-5 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-xs text-neutral-400">
            <span className="inline-flex items-center gap-1"><Check size={13} className="text-primary" /> Free forever plan</span>
            <span className="inline-flex items-center gap-1"><Check size={13} className="text-primary" /> No card required</span>
            <span className="inline-flex items-center gap-1"><Check size={13} className="text-primary" /> Razorpay-secure payments</span>
          </Reveal>
        </div>
      </section>

      {/* ── What is it (AEO definition band) ─────────────────── */}
      <section className="border-y border-black/5 bg-sand/40 px-5 py-14 sm:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <Reveal as="h2" className="text-2xl font-extrabold text-ink sm:text-3xl">
            What is appointment booking software?
          </Reveal>
          <Reveal as="p" delay={0.05} className="mx-auto mt-4 max-w-[720px] text-neutral-600">
            Appointment booking software lets your clients see when you're free and book a slot
            online, instead of messaging back and forth. Good software also takes the payment
            upfront, sends automatic reminders, syncs your calendar and issues an invoice — so
            an appointment is booked, paid and confirmed without you lifting a finger. Book A
            Sloth does all of that from a single shareable link.
          </Reveal>
        </div>
      </section>

      {/* ── Features ─────────────────────────────────────────── */}
      <section className="px-5 py-16 sm:px-8 lg:py-24">
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

      {/* ── Profession grid (supporting keywords + internal links) ── */}
      <section className="bg-sand/40 px-5 py-16 sm:px-8 lg:py-24">
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

      {/* ── Free / online intent band ────────────────────────── */}
      <section className="px-5 py-16 sm:px-8 lg:py-24">
        <div className="mx-auto grid max-w-[1050px] items-center gap-10 lg:grid-cols-2">
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
              { icon: Globe, t: "Any device", d: "Works on every phone and browser." },
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
        <div className="mx-auto max-w-3xl rounded-[10px] bg-ink px-8 py-12 text-center text-white">
          <h2 className="text-3xl font-extrabold text-primary sm:text-4xl">Get booked, paid and reminded.</h2>
          <p className="mx-auto mt-3 max-w-[520px] text-neutral-300">
            Set up your appointment booking software in minutes. Free to start, upgrade whenever your bookings grow.
          </p>
          <Link
            to={ROUTE_START}
            className="mt-7 inline-flex items-center justify-center gap-2 rounded-[6px] bg-primary-cta px-7 py-3 text-sm font-semibold text-white transition-transform hover:bg-primary-dark hover:no-underline"
          >
            Create your free booking page <ArrowRight size={16} />
          </Link>
        </div>
      </section>
    </main>
  );
}
