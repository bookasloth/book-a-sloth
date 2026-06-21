import { Link, useNavigate } from "react-router-dom";
import { useState, useRef, useEffect } from "react";
import {
  motion,
  useScroll,
  useTransform,
  useInView,
  AnimatePresence,
} from "framer-motion";
import {
  Search,
  CalendarCheck,
  Wallet,
  Wind,
  CreditCard,
  Mail,
  Globe,
  Users,
  IndianRupee,
  Sparkles,
  ArrowRight,
  Star,
  Check,
  AtSign,
  Banknote,
  MessageCircle,
  Coins,
  ArrowUpRight,
  Video,
  Link2,
  ShieldCheck,
  Code2,
  Palette,
  BellRing,
  BarChart3,
  Calendar,
  Webcam,
  Images,
  Cpu,
  Target,
  HeartPulse,
  GraduationCap,
  Briefcase,
  Plus,
} from "lucide-react";
import { searchVendors, subscribeNewsletter } from "../services/api";
import useLenis from "../hooks/useLenis";
import Reveal from "../components/home/Reveal";
import BrandPreloader from "../components/preloader/BrandPreloader";
import { HERO, PERSONAS, FACES, FINAL, NEWSLETTER } from "../components/home/images";

/* Real funnel routes — do not point CTAs anywhere else. */
const ROUTE_START = "/be-a-sloth";
const ROUTE_LOGIN = "/login-as-vendor";

const EASE = [0.22, 1, 0.36, 1];

/* ════════════════════════════════════════════════════════════
   LINE-DRAW ICON wrapper (How it works)
   ════════════════════════════════════════════════════════════ */
const LineIcon = ({ children }) => {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, amount: 0.6 });
  return (
    <svg
      ref={ref}
      viewBox="0 0 48 48"
      fill="none"
      stroke="#1a1a1a"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`sloth-draw h-9 w-9 ${inView ? "is-visible" : ""}`}
    >
      {children}
    </svg>
  );
};

/* ════════════════════════════════════════════════════════════
   TESTIMONIAL marquee row
   ════════════════════════════════════════════════════════════ */
/* Testimonials — real hosts. Quotes reflect each profession's use of Book A Sloth.
   Avatars are served from the company asset CDN by name-slug; TAvatar falls back
   to initials until each image is uploaded. */
const TESTIMONIALS = [
  { quote: "Half my day used to go in 'is a cabin free at 4?' WhatsApps. Now people just book it themselves.", name: "Mukesh Tidke", role: "Coworking Space Owner", avatar: "https://company-assets.bookasloth.in/images/testimonials/mukesh-tidke.jpg" },
  { quote: "Patients pay a small fee while booking, so they actually turn up. My no-shows dropped a lot.", name: "Dr. Sagar Patil", role: "General Physician", avatar: "https://company-assets.bookasloth.in/images/testimonials/sagar-patil.jpg" },
  { quote: "I send the link, they pick a slot, payment's sorted before the call. No more awkward money talk.", name: "Vishal Chaware", role: "Salesforce Developer", avatar: "https://company-assets.bookasloth.in/images/testimonials/vishal-chaware.jpg" },
  { quote: "Set up my weekend mentoring in one evening and kind of forgot about it. Slots fill, money's already in.", name: "Sangharata Somkuvar", role: "DevOps Engineer", avatar: "https://company-assets.bookasloth.in/images/testimonials/sangharata-somkuvar.jpg" },
  { quote: "My patients forget appointments easily. The reminder texts have honestly been a lifesaver.", name: "Dr. Yukta Bawankar", role: "Physiotherapist", avatar: "https://company-assets.bookasloth.in/images/testimonials/yukta-bawankar.jpg" },
  { quote: "Stuck the link in my Insta bio. Looks way better than sending a GPay QR after the call.", name: "Happy Singh", role: "Creative Lead", avatar: "https://company-assets.bookasloth.in/images/testimonials/happy-singh.jpg" },
  { quote: "Honestly I picked it because 0% commission. I charge for audits and Sloth doesn't take a cut.", name: "Arjun Ravikumar", role: "Performance Marketeer", avatar: "https://company-assets.bookasloth.in/images/testimonials/arjun-ravikumar.jpg" },
  { quote: "During GST season, clients booking slots instead of calling me randomly saved my sanity.", name: "Vishnu Gavkhare", role: "Chartered Accountant", avatar: "https://company-assets.bookasloth.in/images/testimonials/vishnu-gavkhare.jpg" },
];

/* Avatar with graceful initials fallback (CDN image may be unset during setup). */
const TAvatar = ({ src, name }) => {
  const [err, setErr] = useState(false);
  if (err || !src) {
    return (
      <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-primary/10 text-sm font-bold text-primary">
        {name?.charAt(0) || "★"}
      </div>
    );
  }
  return (
    <img
      src={src}
      onError={() => setErr(true)}
      alt={name}
      loading="lazy"
      className="h-11 w-11 flex-shrink-0 rounded-xl object-cover"
    />
  );
};

/* ════════════════════════════════════════════════════════════
   FLOATING glass card (hero)
   ════════════════════════════════════════════════════════════ */
const GlassCard = ({ icon: Icon, label, value, accent, className, float }) => (
  <div
    className={`sloth-glass ${float} absolute flex items-center gap-3 rounded-2xl px-4 py-3 ${className}`}
  >
    <span
      className={`flex h-10 w-10 items-center justify-center rounded-xl ${
        accent ? "bg-primary/10 text-primary" : "bg-neutral-900/5 text-neutral-700"
      }`}
    >
      <Icon size={18} />
    </span>
    <div>
      <div className="text-[11px] font-medium text-neutral-400">{label}</div>
      <div className={`text-sm font-semibold ${accent ? "text-primary" : "text-ink"}`}>
        {value}
      </div>
    </div>
  </div>
);

/* ════════════════════════════════════════════════════════════
   FEATURES (bento)
   ════════════════════════════════════════════════════════════ */
const FEATURES = [
  { icon: CreditCard, title: "Payments Built In", desc: "Clients pay up-front. Your time finally bills itself." },
  { icon: Mail, title: "Email Reminders", desc: "Gentle nudges so no session is ever forgotten." },
  { icon: Globe, title: "Personal SlothPage", desc: "A mini-site that books and bills on your behalf." },
  { icon: Users, title: "Light CRM", desc: "Notes, history, receipts — zero spreadsheets." },
  { icon: IndianRupee, title: "India First", desc: "GST, INR, UPI — built for how India pays." },
  { icon: Sparkles, title: "AI Assistant", desc: "Suggests slots, drafts briefs, sends thank-yous." },
];

/* Modern features (pastel grid) — sits directly under the hero.
   "Calendar Sync" replaces the earlier AI card. */
const MODERN_FEATURES = [
  { icon: Banknote, title: "Payments Built In", desc: "Clients pay up-front. Your time finally bills itself — peacefully.", bg: "bg-pink-200/60" },
  { icon: MessageCircle, title: "WhatsApp Reminders", desc: "Because email reminders get ghosted. Calm, timely pings straight to WhatsApp.", bg: "bg-lime-200/60" },
  { icon: Globe, title: "Personal Sloth Page", desc: "A mini-website that books, bills, and brands you — automatically.", bg: "bg-orange-200/60" },
  { icon: Users, title: "Light CRM", desc: "Client notes, history, and receipts — zero spreadsheets, zero stress.", bg: "bg-blue-200/60" },
  { icon: Coins, title: "India-First Design", desc: "GST, INR, and UPI native — no dollar drama, no currency confusion.", bg: "bg-amber-200/60" },
  { icon: CalendarCheck, title: "Calendar Sync", desc: "Two-way Google Calendar sync — no double-bookings, no clashes.", bg: "bg-teal-200/60" },
];

/* "…and so much more" — features + integrations.
   Line icons, per-card colour + subtle glow; hover reveals the description. */
const MOREFEATURES = [
  // Features
  { icon: CreditCard, title: "Accept payments", desc: "UPI, cards & netbanking — clients pay before the session starts.", color: "#2563eb" },
  { icon: Video, title: "Built-in video calls", desc: "A meeting link is created automatically for every online booking.", color: "#7c3aed" },
  { icon: Link2, title: "Short booking links", desc: "bookasloth.com/you — one calm link for everything you offer.", color: "#0ea5e9" },
  { icon: ShieldCheck, title: "Privacy first", desc: "Your data stays yours. Encrypted, access-controlled, never sold.", color: "#059669" },
  { icon: Code2, title: "Easy embeds", desc: "Drop your booking widget into any website in one line.", color: "#4f46e5" },
  { icon: Palette, title: "Simple customization", desc: "Brand your page — colours, logo and theme in a few clicks.", color: "#db2777" },
  { icon: BellRing, title: "Smart reminders", desc: "Email + WhatsApp nudges cut no-shows to almost zero.", color: "#f59e0b" },
  { icon: Star, title: "Reviews & ratings", desc: "Two-way reviews build trust after every session.", color: "#eab308" },
  { icon: BarChart3, title: "Insightful analytics", desc: "Bookings, revenue and no-shows — all at a glance.", color: "#0891b2" },
  // Integrations
  { icon: IndianRupee, title: "Razorpay", desc: "Payments, payouts and subscriptions, India-native.", color: "#3b82f6" },
  { icon: Calendar, title: "Google Calendar", desc: "Two-way sync keeps your real availability accurate.", color: "#ea4335" },
  { icon: Webcam, title: "Google Meet", desc: "Auto-generated meet links on confirmed online bookings.", color: "#16a34a" },
  { icon: MessageCircle, title: "WhatsApp", desc: "Confirmations and reminders land where clients actually look.", color: "#25d366" },
  { icon: Mail, title: "Email", desc: "Beautiful transactional emails for every booking event.", color: "#dc2626" },
  { icon: Images, title: "Cloudinary", desc: "Fast, optimized image hosting for your page and services.", color: "#f97316" },
];

/* Industry Discovery — the 20 live (active) categories, grouped by industry.
   Mirrors the server categories seed v3.21 (group_label = industry, label =
   profession; only `status:'active'` shown). Fully data-driven: add an industry
   by adding an entry. NOTE: this is a static snapshot — wire it to the live
   categories API later if you want it to track admin changes automatically. */
const INDUSTRIES = [
  {
    name: "Technology & Product",
    slug: "technology-product",
    icon: Cpu,
    color: "#2563eb",
    description: "Build products. Mentor makers.",
    professions: ["Software Engineer", "Product Manager", "UX Designer", "Data Scientist", "AI Engineer"],
  },
  {
    name: "Coaching & Consulting",
    slug: "coaching-consulting",
    icon: Target,
    color: "#7c3aed",
    description: "Coach, advise, and transform.",
    professions: ["Career Coach", "Life Coach", "Executive Coach", "Leadership Coach", "Business Coach"],
  },
  {
    name: "Health & Wellness",
    slug: "health-wellness",
    icon: HeartPulse,
    color: "#0d9488",
    description: "Care for minds and bodies.",
    professions: ["Psychologist", "Nutritionist", "Speech Therapist"],
  },
  {
    name: "Education",
    slug: "education",
    icon: GraduationCap,
    color: "#f59e0b",
    description: "Teach, mentor, and inspire.",
    professions: ["Language Tutor", "IELTS Coach", "Study Abroad Consultant"],
  },
  {
    name: "Business Services",
    slug: "business-services",
    icon: Briefcase,
    color: "#0891b2",
    description: "Advise, strategize, and grow.",
    professions: ["Financial Advisor", "Startup Advisor", "Business Consultant", "HR Consultant"],
  },
];

/* "Who it's for" personas */
const WHO = [
  { key: "freelancer", title: "Freelancers", desc: "Collect advances, never chase invoices." },
  { key: "tutor", title: "Tutors", desc: "Schedule classes, auto-bill parents." },
  { key: "coach", title: "Coaches", desc: "Focus on people, not payment links." },
  { key: "therapist", title: "Therapists", desc: "A calm, private booking space." },
  { key: "consultant", title: "Consultants", desc: "Sell your hours, peacefully." },
  { key: "studio", title: "Agencies & Studios", desc: "One calendar for the whole team." },
];

const TRENDING = [
  "Career coach",
  "Yoga teacher",
  "UI designer",
  "Therapist",
  "Math tutor",
  "Business consultant",
];

/* "How it works" — outcome-led pipeline (Share → Book & Pay → Focus).
   Line-draw glyphs reuse the LineIcon stroke style. */
const STEPS = [
  {
    title: "Share one link",
    desc: "Your services, availability and pricing — in a single SlothPage link.",
    chip: "Replaces 20 DMs",
    draw: (
      <>
        <path d="M20 28a7 7 0 0 1 0-10l4-4a7 7 0 0 1 10 10l-2 2" />
        <path d="M28 20a7 7 0 0 1 0 10l-4 4a7 7 0 0 1-10-10l2-2" />
      </>
    ),
  },
  {
    title: "Clients book & pay upfront",
    desc: "They self-book a slot and pay before the session. Money lands first.",
    chip: "Paid in advance",
    draw: (
      <>
        <rect x="6" y="13" width="36" height="24" rx="4" />
        <line x1="6" y1="21" x2="42" y2="21" />
        <circle cx="14" cy="29" r="2.5" />
      </>
    ),
  },
  {
    title: "You just show up",
    desc: "Auto reminders cut no-shows; receipts and follow-ups send themselves.",
    chip: "~0 no-shows",
    draw: (
      <>
        <path d="M8 28c6 0 6-8 12-8s6 8 12 8 8-6 8-6" />
        <circle cx="24" cy="14" r="4" />
      </>
    ),
  },
];

/* Footer nav — every link resolves (route, on-page anchor, or mailto).
   No dead "#" hrefs. Add columns/links here as pages ship. */
const FOOTER_COLS = [
  { h: "Product", links: [
    { t: "How It Works", href: "#how-it-works" },
    { t: "Find Hosts", href: "#find" },
    { t: "Pricing", href: "#pricing" },
    { t: "Be a Sloth", href: "/be-a-sloth" },
  ]},
  { h: "Company", links: [
    { t: "About", href: "/about" },
    { t: "Manifesto", href: "#manifesto" },
    { t: "Log in", href: "/login-as-vendor" },
  ]},
  { h: "Collective", links: [
    { t: "The Collective", href: "#collective" },
    { t: "Newsletter", href: "#newsletter" },
    { t: "Contact", href: "mailto:team@timewheel.co.in" },
  ]},
];

/* Social — only real destinations. Founder: add Instagram/X/WhatsApp URLs here. */
const SOCIAL = [
  { Icon: AtSign, label: "Email Book A Sloth", href: "mailto:team@timewheel.co.in" },
];

/* ════════════════════════════════════════════════════════════
   PAGE
   ════════════════════════════════════════════════════════════ */
const Home = () => {
  useLenis();
  const navigate = useNavigate();

  // ── Preloader readiness: fonts loaded + hero image decoded (real, not timed) ──
  const [assetsReady, setAssetsReady] = useState(false);
  useEffect(() => {
    let done = false;
    const finish = () => { if (!done) { done = true; setAssetsReady(true); } };
    const fontsP = document.fonts ? document.fonts.ready : Promise.resolve();
    const img = new Image();
    img.src = HERO;
    const imgP = img.decode
      ? img.decode().catch(() => {})
      : new Promise((r) => { img.onload = r; img.onerror = r; });
    Promise.all([fontsP, imgP]).then(finish);
    const safety = setTimeout(finish, 4000); // never strand the preloader
    return () => clearTimeout(safety);
  }, []);

  // ── Hero username / SlothPage claim ──
  const [username, setUsername] = useState("");
  const claim = () => {
    const handle = username.trim();
    // Carry the typed handle through the (Google-only) funnel instead of dropping it.
    if (handle) sessionStorage.setItem("pendingSlothPage", handle);
    navigate(ROUTE_START, { state: { desiredUsername: handle || undefined } });
  };

  // ── Newsletter ──
  const [emailInput, setEmailInput] = useState("");
  const [newsletterState, setNewsletterState] = useState("idle"); // idle|loading|ok|err
  const submitNewsletter = async (e) => {
    e.preventDefault();
    const email = emailInput.trim();
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      setNewsletterState("err");
      return;
    }
    setNewsletterState("loading");
    try {
      await subscribeNewsletter(email);
    } catch {
      // Backend route /email/subscribe is pending — capture the lead client-side
      // so it is never lost (mirrors the /lp client-only lead pattern).
      try {
        const leads = JSON.parse(localStorage.getItem("newsletterLeads") || "[]");
        localStorage.setItem("newsletterLeads", JSON.stringify([...leads, email].slice(-200)));
      } catch { /* storage unavailable — ignore */ }
    }
    setNewsletterState("ok");
    setEmailInput("");
  };

  // ── Search (UNCHANGED logic — debounced searchVendors) ──
  const [query, setQuery] = useState("");
  const [results, setResults] = useState(null);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState(false);
  const searchTimeout = useRef(null);

  const handleSearch = (q) => {
    setQuery(q);
    clearTimeout(searchTimeout.current);
    if (!q.trim()) {
      setResults(null);
      setSearchError(false);
      return;
    }
    searchTimeout.current = setTimeout(async () => {
      setSearching(true);
      setSearchError(false);
      try {
        const { data } = await searchVendors(q);
        setResults(data);
      } catch {
        setResults(null);
        setSearchError(true);
      } finally {
        setSearching(false);
      }
    }, 400);
  };

  const hasResults =
    results && (results.vendors?.length > 0 || results.services?.length > 0);

  // ── Hero image parallax ──
  const heroRef = useRef(null);
  const { scrollYProgress: heroProg } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });
  const heroImgY = useTransform(heroProg, [0, 1], [0, 80]);

  // ── Final CTA parallax ──
  const finalRef = useRef(null);
  const { scrollYProgress: finalProg } = useScroll({
    target: finalRef,
    offset: ["start end", "end start"],
  });
  const finalImgY = useTransform(finalProg, [0, 1], [-40, 40]);

  // ── Testimonials carousel: centred active card fills the 28%→72% middle cell.
  //    Transform-based track (the page runs Lenis smooth-scroll, which blocks inner
  //    scrollLeft — so we translate, not scroll). List is tripled; the auto-advance
  //    walks FORWARD forever and, on reaching the 3rd copy, jumps back one copy with
  //    animation OFF (identical frame) → seamless, never scrolls back. ──
  const N_T = TESTIMONIALS.length;
  const T_GAP = 20; // px gap between cards
  const [activeT, setActiveT] = useState(N_T); // start in the middle copy
  const [tAnim, setTAnim] = useState(false); // transition on? (off on mount + during the seamless jump)
  const [tW, setTW] = useState(0);
  const tWrapRef = useRef(null);
  const tPausedRef = useRef(false);
  useEffect(() => {
    const el = tWrapRef.current;
    if (!el) return;
    const measure = () => setTW(el.clientWidth);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  // Enable the transition a frame AFTER the offset has applied instantly (covers first
  // paint and the post-jump frame) so the track never animates in from the left.
  useEffect(() => {
    if (tAnim || !tW) return;
    const id = requestAnimationFrame(() => requestAnimationFrame(() => setTAnim(true)));
    return () => cancelAnimationFrame(id);
  }, [tAnim, tW]);
  useEffect(() => {
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
    const id = setInterval(() => {
      if (!tPausedRef.current) setActiveT((a) => a + 1);
    }, 2500);
    return () => clearInterval(id);
  }, []);
  useEffect(() => {
    if (activeT < 2 * N_T) return;
    const id = setTimeout(() => { setTAnim(false); setActiveT((a) => a - N_T); }, 700);
    return () => clearTimeout(id);
  }, [activeT, N_T]);
  const tFrac = tW >= 1024 ? 0.44 : tW >= 640 ? 0.6 : 0.84;
  const tCardW = tW ? tW * tFrac : 0;
  const tOffset = tW ? (tW - tCardW) / 2 - activeT * (tCardW + T_GAP) : 0;

  // ── Pricing: 2 plans, Yearly active by default ──
  const [yearly, setYearly] = useState(true);
  const PLANS = [
    {
      name: "Creator",
      tagline: "For solo creators & freelancers.",
      monthly: 199,
      yearly: 999,
      intro: "What's included:",
      features: [
        "0% commission on bookings",
        "Up to 20 services",
        "2,000 bookings a year",
        "2 calendar integrations (Google Calendar + Zoom)",
        "1 service category",
        "Auto invoices",
        "Basic reports",
        "Client history",
        "Priority email support",
      ],
    },
    {
      name: "Professional",
      tagline: "Top tier, for growing practices & studios.",
      monthly: 499,
      yearly: 3650,
      recommended: true,
      intro: "Everything in Creator, plus:",
      features: [
        "Up to 30 services",
        "3,000 bookings a year",
        "3 calendar integrations (Google Calendar + Zoom + iCal)",
        "3 service categories",
        "Client notes",
        "Advanced reports",
        "Data export",
        "Priority support",
      ],
    },
  ];

  // ── Competitor comparison tiles (favicons via Google's favicon service) ──
  const COMPETITORS = [
    { name: "Topmate", domain: "topmate.io", href: "/lp/topmate-vs-bookasloth" },
    { name: "Calendly", domain: "calendly.com", href: "/lp/calendly-alternative" },
    { name: "Cal.com", domain: "cal.com" }, // page not built yet → active tile, no link
    { name: "DaySchedule", domain: "dayschedule.com" }, // page not built yet
    { name: "Gumroad", domain: "gumroad.com", soon: true },
    { name: "SuperProfile", domain: "superprofile.bio", soon: true },
    { name: "TidyCal", domain: "tidycal.com", soon: true },
    { name: "Acuity", domain: "acuityscheduling.com", soon: true },
  ];

  return (
    <div id="top" className="overflow-x-hidden bg-canvas text-ink">
      <BrandPreloader variant="homepage" ready={assetsReady} />

      {/* ════════════════ HERO ════════════════ */}
      <section ref={heroRef} className="relative px-5 pb-20 pt-12 sm:px-8 sm:pt-20 lg:pb-32 lg:pt-28">
        {/* Ambient warm aura — adds depth on the flat canvas without changing the palette */}
        <div aria-hidden className="sloth-hero-aura" />

        <div className="relative z-10 mx-auto grid max-w-7xl items-center gap-14 lg:grid-cols-[1.05fr_0.95fr] lg:gap-12">
          {/* LEFT */}
          <div>
            <Reveal as="h1" delay={0.05} className="text-[2.7rem] font-bold leading-[1.02] tracking-[-0.025em] text-ink sm:text-[4.5rem]">
              Get booked & paid
              <br />
              <span className="font-normal italic text-primary">before you even</span>
              <br />
              open your register.
            </Reveal>

            <Reveal as="p" delay={0.12} className="mt-7 max-w-md text-lg leading-relaxed text-neutral-500">
              Book A Sloth helps India's freelancers, tutors, coaches and studios
              get booked, paid and remembered — without the chaos.
            </Reveal>

            {/* URL creator */}
            <Reveal delay={0.18} className="mt-9">
              <div className="flex max-w-lg flex-col gap-2 sm:flex-row sm:items-center sm:gap-0 sm:rounded-[18px] sm:border sm:border-black/[0.07] sm:bg-white sm:p-1.5 sm:shadow-[0_10px_30px_-10px_rgba(26,26,26,0.18)]">
                {/* URL prefix + input — own card on mobile, merges into pill on desktop */}
                <div className="flex min-h-[3.5rem] flex-1 items-center min-w-0 rounded-[14px] border border-black/[0.07] bg-white px-5 shadow-sm sm:min-h-0 sm:border-0 sm:bg-transparent sm:px-4 sm:shadow-none">
                  <span className="select-none whitespace-nowrap text-sm font-medium text-neutral-400 shrink-0">
                    bookasloth.com/
                  </span>
                  <input
                    aria-label="Your SlothPage username"
                    value={username}
                    onChange={(e) =>
                      setUsername(e.target.value.replace(/[^a-z0-9-]/gi, "").toLowerCase())
                    }
                    onKeyDown={(e) => e.key === "Enter" && claim()}
                    placeholder="yourname"
                    className="!min-h-0 !w-auto flex-1 min-w-0 !border-0 !bg-transparent !p-0 py-3.5 text-sm font-medium text-ink placeholder:font-normal placeholder:text-neutral-400 !shadow-none focus:!ring-0 sm:py-2.5"
                  />
                </div>
                <button
                  onClick={claim}
                  className="btn inline-flex min-h-[3.5rem] shrink-0 items-center justify-center gap-1.5 whitespace-nowrap rounded-[14px] bg-primary-cta px-6 py-3.5 text-sm font-semibold text-white transition-all hover:-translate-y-0.5 hover:bg-primary-dark sm:min-h-0 sm:py-3"
                >
                  Get Started
                  <ArrowRight size={15} />
                </button>
              </div>
              <p className="mt-3 flex items-center gap-1.5 text-xs text-neutral-400">
                <Check size={13} className="text-primary" />
                Free forever · No card needed
              </p>
            </Reveal>

            {/* Social proof */}
            <Reveal delay={0.24} className="mt-9 flex items-center gap-4">
              <div className="flex -space-x-3">
                {FACES.slice(0, 3).map((f, i) => (
                  <img
                    key={i}
                    src={f}
                    alt=""
                    loading="lazy"
                    className="h-10 w-10 rounded-full border-2 border-canvas object-cover"
                  />
                ))}
              </div>
              <div>
                <div className="flex items-center gap-1">
                  {[0, 1, 2, 3, 4].map((i) => (
                    <Star key={i} size={13} className="fill-amber-400 text-amber-400" />
                  ))}
                  <span className="ml-1 text-sm font-semibold text-ink">4.9/5</span>
                </div>
                <p className="text-xs text-neutral-400">
                  Loved by 50+ calm professionals.
                </p>
              </div>
            </Reveal>
          </div>

          {/* RIGHT */}
          <Reveal delay={0.1} className="relative">
            <div className="relative mx-auto aspect-[4/5] w-full max-w-md overflow-hidden rounded-[2.25rem] bg-sand shadow-[0_40px_90px_-25px_rgba(26,26,26,0.38)] ring-1 ring-black/5">
              <motion.img
                src={HERO}
                alt="A calm professional at work"
                loading="eager"
                style={{ y: heroImgY }}
                className="h-[112%] w-full object-cover"
              />
              {/* Subtle inset sheen for a more premium frame */}
              <div aria-hidden className="pointer-events-none absolute inset-0 rounded-[2.25rem] ring-1 ring-inset ring-white/15" />
            </div>

            {/* Floating glass cards */}
            <GlassCard
              icon={CalendarCheck}
              label="New booking"
              value="Confirmed · 4:30 PM"
              float="sloth-float"
              className="-left-3 top-10 sm:-left-8"
            />
            <GlassCard
              icon={Wallet}
              label="Payment received"
              value="₹2,500"
              accent
              float="sloth-float--mid"
              className="-right-2 top-1/2 sm:-right-6"
            />
            <GlassCard
              icon={Wind}
              label="Upcoming session"
              value="Tomorrow · 11 AM"
              float="sloth-float--slow"
              className="bottom-8 left-2 sm:left-6"
            />
          </Reveal>
        </div>
      </section>

      {/* ════════════════ MODERN FEATURES (PASTEL GRID) ════════════════ */}
      <section className="px-5 py-20 sm:px-8 lg:py-28">
        <div className="mx-auto max-w-6xl">
          <Reveal as="h2" className="mx-auto max-w-3xl text-center text-4xl font-extrabold leading-tight text-ink sm:text-5xl">
            Contains modern features for better experience{" "}
            <span className="text-primary">better experience.</span>
          </Reveal>

          <div className="mt-14 grid gap-5 sm:gap-6 md:grid-cols-3">
            {MODERN_FEATURES.map((f, i) => (
              <Reveal key={f.title} delay={(i % 3) * 0.08}>
                <div className={`relative flex h-full min-h-[240px] flex-col justify-between overflow-hidden rounded-[24px] border border-white/50 ${f.bg} p-7 shadow-[0_8px_30px_rgba(26,26,26,0.06)] ring-1 ring-inset ring-white/40 backdrop-blur-xl backdrop-saturate-150 sm:p-8`}>
                  {/* Top sheen — sells the frosted-glass look on a flat canvas */}
                  <span aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/30 to-transparent" />
                  <div className="relative flex items-start justify-between">
                    <f.icon size={28} strokeWidth={2} className="text-ink" />
                    <ArrowUpRight size={20} className="text-ink/50" />
                  </div>
                  <div className="relative">
                    <h3 className="font-heading text-lg font-bold text-ink">{f.title}</h3>
                    <p className="mt-1.5 text-sm leading-relaxed text-ink/70">{f.desc}</p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════ ...AND SO MUCH MORE (features + integrations) ════════════════ */}
      <section className="px-5 py-20 sm:px-8 lg:py-28">
        <div className="mx-auto max-w-6xl">
          <Reveal as="p" className="text-center text-sm font-medium uppercase tracking-[0.2em] text-primary">
            Features & integrations
          </Reveal>
          <Reveal as="h2" delay={0.05} className="mt-3 text-center text-4xl font-extrabold leading-tight text-ink sm:text-5xl">
            ...and so much more!
          </Reveal>

          <div className="mt-14 grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 md:grid-cols-5">
            {MOREFEATURES.map((f, i) => (
              <Reveal key={f.title} delay={(i % 5) * 0.05}>
                <div className="group relative flex h-full min-h-[210px] flex-col items-center justify-center overflow-hidden rounded-[20px] border border-black/5 bg-white p-5 text-center transition-all duration-300 hover:-translate-y-1.5 hover:border-black/10 hover:shadow-[0_22px_45px_-18px_rgba(26,26,26,0.22)]">
                  {/* Diagonal shine sweep on hover */}
                  <span
                    aria-hidden
                    className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-black/[0.04] to-transparent transition-transform duration-700 ease-out group-hover:translate-x-full"
                  />

                  {/* Icon tile + coloured glow */}
                  <span className="relative mb-4 inline-flex h-14 w-14 items-center justify-center">
                    <span
                      aria-hidden
                      className="absolute inset-0 rounded-2xl opacity-20 blur-xl transition-all duration-300 group-hover:scale-125 group-hover:opacity-60"
                      style={{ background: f.color }}
                    />
                    <span className="relative inline-flex h-14 w-14 items-center justify-center rounded-2xl border border-black/5 bg-white shadow-sm transition-transform duration-300 group-hover:scale-105">
                      <f.icon size={24} strokeWidth={1.75} style={{ color: f.color }} />
                    </span>
                  </span>

                  <h3 className="font-heading text-sm font-bold text-ink">{f.title}</h3>

                  {/* Hover-revealed info */}
                  <p className="mt-2 max-h-0 overflow-hidden text-xs leading-relaxed text-neutral-500 opacity-0 transition-all duration-300 ease-out group-hover:max-h-24 group-hover:opacity-100">
                    {f.desc}
                  </p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════ INDUSTRY DISCOVERY ════════════════ */}
      <section className="px-5 py-20 sm:px-8 lg:py-28">
        <div className="mx-auto max-w-6xl">
          <Reveal as="p" className="text-center text-sm font-medium uppercase tracking-[0.2em] text-primary">
            Industries we support
          </Reveal>
          <Reveal as="h2" delay={0.05} className="mx-auto mt-3 max-w-2xl text-center text-4xl text-ink sm:text-5xl">
            Built for your <span className="italic text-primary">profession.</span>
          </Reveal>
          <Reveal as="p" delay={0.1} className="mx-auto mt-4 max-w-2xl text-center text-base text-neutral-500">
            From tech to coaching to wellness — explore an industry to see the roles already booking on Book A Sloth.
          </Reveal>

          <div className="mt-14 flex flex-wrap justify-center gap-5">
            {INDUSTRIES.map((ind, i) => (
              <Reveal key={ind.slug} delay={(i % 3) * 0.08} className="w-full sm:w-[calc(50%-0.625rem)] lg:w-[calc(33.333%-0.833rem)]">
                {/* Focusable card: hover (mouse), focus-within (keyboard) and
                    tap (mobile focuses the tabIndex=0 card) all trigger expand. */}
                {/* Fixed-height card: default summary and detail crossfade in the
                    SAME footprint — the card never resizes, so nothing shifts. */}
                <div
                  tabIndex={0}
                  role="group"
                  aria-label={`${ind.name} — show popular professions`}
                  className="group relative h-full min-h-[16rem] overflow-hidden rounded-[24px] border border-white/60 bg-white/70 shadow-[0_8px_30px_rgba(26,26,26,0.05)] outline-none ring-1 ring-inset ring-white/50 backdrop-blur-xl transition-[transform,box-shadow] duration-300 hover:-translate-y-1 hover:shadow-[0_24px_50px_-20px_rgba(26,26,26,0.22)] focus-visible:-translate-y-1 focus-visible:ring-2 focus-visible:ring-primary/40 motion-reduce:transition-none"
                >
                  {/* Big line icon bleeding from the top-left corner — card background */}
                  <ind.icon
                    aria-hidden
                    strokeWidth={1.25}
                    className="pointer-events-none absolute -left-5 -top-5 h-32 w-32 opacity-[0.13] transition-opacity duration-300 group-hover:opacity-20 group-focus-within:opacity-20 motion-reduce:transition-none"
                    style={{ color: ind.color }}
                  />

                  {/* DEFAULT layer — title sits top-right next to the corner icon;
                      description + hint anchor to the bottom. Fades out on hover/focus. */}
                  <div className="absolute inset-0 flex flex-col p-6 transition-opacity duration-300 group-hover:opacity-0 group-focus-within:opacity-0 motion-reduce:transition-none">
                    <h3 className="ml-auto max-w-[60%] text-right font-heading text-xl font-bold leading-tight text-ink">{ind.name}</h3>
                    <p className="mt-auto text-sm leading-relaxed text-neutral-500">{ind.description}</p>
                    <span className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-neutral-400">
                      Explore roles <ArrowRight size={12} />
                    </span>
                  </div>

                  {/* DETAIL layer — frosted panel (bg + blur) fully hides/blurs the
                      back content; professions + CTA fade in over it. */}
                  <div className="absolute inset-0 flex flex-col bg-white/60 p-6 opacity-0 backdrop-blur-md transition-opacity duration-300 group-hover:opacity-100 group-focus-within:opacity-100 motion-reduce:transition-none">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink">
                      Popular professions
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {ind.professions.map((p) => (
                        <span
                          key={p}
                          className="rounded-full border border-black/5 bg-white/80 px-3 py-1 text-xs font-medium text-neutral-700"
                        >
                          {p}
                        </span>
                      ))}
                    </div>
                    <Link
                      to={`${ROUTE_START}?industry=${ind.slug}`}
                      className="mt-auto inline-flex w-fit items-center gap-1.5 rounded-[6px] bg-primary-cta px-5 py-2.5 text-sm font-semibold text-white transition-transform hover:-translate-y-0.5 hover:bg-primary-dark hover:no-underline"
                    >
                      Get Started <ArrowRight size={15} />
                    </Link>
                  </div>
                </div>
              </Reveal>
            ))}

          </div>
        </div>
      </section>

      {/* ════════════════ SEARCH — "Find a vendor" ════════════════
         TEMPORARILY DISABLED (keep for later). The whole section is preserved
         below; it just doesn't render. To bring it back, delete the
         `{false && (` line here and its matching `)}` after </section>. */}
      {false && (
      <section id="find" className="px-5 py-20 sm:px-8 lg:py-28">
        <div className="mx-auto max-w-3xl text-center">
          <Reveal as="h2" className="text-4xl text-ink sm:text-5xl">
            Find a vendor
          </Reveal>
          <Reveal as="p" delay={0.06} className="mx-auto mt-4 max-w-md text-neutral-500">
            Search a name, a skill, a service. Discover calm professionals near you.
          </Reveal>

          <Reveal delay={0.12} className="relative mx-auto mt-10 max-w-2xl">
            <label htmlFor="vendor-search" className="sr-only">
              Search hosts by name, skill or service
            </label>
            <Search
              size={20}
              className="pointer-events-none absolute left-5 top-1/2 -translate-y-1/2 text-neutral-400"
            />
            <input
              id="vendor-search"
              type="search"
              placeholder="e.g. career coach, UI designer, yoga teacher…"
              value={query}
              onChange={(e) => handleSearch(e.target.value)}
              className="!h-16 w-full rounded-full border border-black/5 bg-white !pl-14 !pr-14 text-base shadow-[0_12px_40px_-12px_rgba(26,26,26,0.18)] focus:!border-primary"
            />
            {searching && (
              <div className="absolute right-6 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            )}
            {/* Screen-reader status — announces search progress/outcome */}
            <div role="status" aria-live="polite" className="sr-only">
              {searching
                ? "Searching"
                : searchError
                ? "Search failed, please try again"
                : query && !hasResults
                ? `No results for ${query}`
                : ""}
            </div>
          </Reveal>

          {/* Trending chips */}
          {!query && (
            <Reveal delay={0.18} className="mt-6 flex flex-wrap justify-center gap-2">
              <span className="py-1.5 text-xs font-medium uppercase tracking-wide text-neutral-400">
                Trending
              </span>
              {TRENDING.map((c) => (
                <button
                  key={c}
                  onClick={() => handleSearch(c)}
                  className="rounded-full border border-black/5 bg-white px-4 py-1.5 text-sm text-neutral-600 transition-colors hover:border-primary/30 hover:text-primary"
                >
                  {c}
                </button>
              ))}
            </Reveal>
          )}

          {/* Results (unchanged data shape) */}
          {query && (
            <div className="mt-6 text-left">
              {!hasResults && !searching && (
                <p className="py-6 text-center text-sm text-neutral-500">
                  {searchError
                    ? "Something went wrong. Please try again."
                    : `No results for “${query}”.`}
                </p>
              )}

              {results?.vendors?.length > 0 && (
                <div className="mb-5">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-neutral-400">
                    Hosts
                  </p>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {results.vendors.map((v) => (
                      <Link
                        key={v.id}
                        to={`/${v.username}`}
                        className="flex items-center gap-3 rounded-2xl border border-black/5 bg-white p-3 transition-shadow hover:shadow-md hover:no-underline"
                      >
                        {v.profile_image ? (
                          <img src={v.profile_image} alt={v.name} className="h-10 w-10 flex-shrink-0 rounded-xl object-cover" />
                        ) : (
                          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-primary/10 text-sm font-bold text-primary">
                            {v.name?.charAt(0)}
                          </div>
                        )}
                        <div className="min-w-0">
                          <div className="flex items-center gap-1">
                            <p className="truncate text-sm font-medium text-ink">{v.name}</p>
                            {v.is_verified && <Check size={14} className="flex-shrink-0 text-green-500" />}
                          </div>
                          <p className="truncate text-xs text-neutral-400">
                            {v.profession || v.tagline || "@" + v.username}
                          </p>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {results?.services?.length > 0 && (
                <div>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-neutral-400">
                    Services
                  </p>
                  <div className="space-y-2">
                    {results.services.map((s) => (
                      <Link
                        key={s.id}
                        to={`/${s.profiles?.username}/${s.slug || s.id}`}
                        className="flex items-center gap-3 rounded-2xl border border-black/5 bg-white p-3 transition-shadow hover:shadow-md hover:no-underline"
                      >
                        {s.thumbnail_url ? (
                          <img src={s.thumbnail_url} alt={s.title} className="h-10 w-12 flex-shrink-0 rounded-lg object-cover" />
                        ) : (
                          <div className="flex h-10 w-12 flex-shrink-0 items-center justify-center rounded-lg bg-primary/5">
                            <CalendarCheck size={18} className="text-primary/40" />
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium text-ink">{s.title}</p>
                          <p className="text-xs text-neutral-400">
                            by {s.profiles?.name} · {s.duration} min
                          </p>
                        </div>
                        <span className="flex-shrink-0 text-sm font-semibold text-primary">
                          {s.price === 0 ? "Free" : `₹${s.price}`}
                        </span>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </section>
      )}

      {/* ════════════════ HOW THE CALM WORKS ════════════════ */}
      <section id="how-it-works" className="px-5 py-20 sm:px-8 lg:py-32">
        <div className="mx-auto max-w-6xl">
          <Reveal as="p" className="text-center text-sm font-medium uppercase tracking-[0.2em] text-primary">
            How the calm works
          </Reveal>
          <Reveal as="h2" delay={0.05} className="mx-auto mt-4 max-w-xl text-center text-4xl text-ink sm:text-5xl">
            From link to paid. <span className="italic text-primary">Calmly.</span>
          </Reveal>
          <Reveal as="p" delay={0.1} className="mx-auto mt-4 max-w-md text-center text-base text-neutral-500">
            No WhatsApp back-and-forth. No payment chasing. No calendar chaos.
          </Reveal>

          <div className="relative mt-16">
            {/* Direction chevrons sitting in the gaps between cards (desktop) */}
            <ArrowRight
              aria-hidden
              size={22}
              className="absolute left-1/3 top-[4.25rem] z-20 hidden -translate-x-1/2 -translate-y-1/2 text-primary/40 md:block"
            />
            <ArrowRight
              aria-hidden
              size={22}
              className="absolute left-2/3 top-[4.25rem] z-20 hidden -translate-x-1/2 -translate-y-1/2 text-primary/40 md:block"
            />

            <div className="grid gap-12 md:grid-cols-3 md:gap-6">
              {STEPS.map((s, i) => (
                <Reveal key={s.title} delay={i * 0.12}>
                  <div className="group relative flex h-full flex-col items-center rounded-[24px] border border-white/60 bg-white/60 p-8 text-center shadow-[0_8px_30px_rgba(26,26,26,0.05)] ring-1 ring-inset ring-white/50 backdrop-blur-xl transition-all duration-300 hover:-translate-y-1.5 hover:shadow-[0_24px_50px_-20px_rgba(26,26,26,0.25)]">
                    {/* Vertical connector to the next step (mobile) */}
                    {i < STEPS.length - 1 && (
                      <span
                        aria-hidden
                        className="absolute left-1/2 top-full z-20 h-12 w-px -translate-x-1/2 bg-neutral-200 md:hidden"
                      >
                        <ArrowRight
                          size={16}
                          className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 rotate-90 bg-canvas text-primary/40"
                        />
                      </span>
                    )}

                    {/* Node: icon box + step number + hover glow */}
                    <div className="relative inline-flex h-16 w-16 items-center justify-center">
                      <span
                        aria-hidden
                        className="absolute inset-0 rounded-2xl bg-primary/25 opacity-0 blur-lg transition-opacity duration-300 group-hover:opacity-100"
                      />
                      <span className="relative inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-white shadow-[0_10px_30px_-10px_rgba(26,26,26,0.18)] ring-1 ring-black/5">
                        <LineIcon>{s.draw}</LineIcon>
                      </span>
                      <span className="absolute -right-2 -top-2 z-10 flex h-6 w-6 items-center justify-center rounded-full bg-primary-cta text-[11px] font-bold text-white">
                        {i + 1}
                      </span>
                    </div>

                    <h3 className="mt-6 font-heading text-xl font-bold text-ink">{s.title}</h3>
                    <p className="mx-auto mt-2 max-w-xs text-neutral-500">{s.desc}</p>

                    <span className="mt-5 inline-flex items-center gap-1.5 rounded-full bg-sand px-3 py-1 text-xs font-semibold text-primary">
                      <Check size={13} />
                      {s.chip}
                    </span>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ════════════════ FEATURES (BENTO) ════════════════
         REMOVED FROM PAGE (duplicate of the pastel "modern features" grid above).
         Preserved below; re-enable by deleting `{false && (` and its `)}`. */}
      {false && (
      <section className="px-5 py-20 sm:px-8 lg:py-28">
        <div className="mx-auto max-w-6xl">
          <div className="grid auto-rows-[minmax(0,1fr)] gap-4 md:grid-cols-3">
            {/* Big intro card */}
            <Reveal className="md:col-span-2 md:row-span-2">
              <div className="flex h-full flex-col justify-between overflow-hidden rounded-[2rem] bg-ink p-8 text-white sm:p-10">
                <div>
                  <Sparkles size={24} className="text-primary" />
                  <h2 className="mt-6 text-3xl leading-tight sm:text-4xl">
                    More than a scheduler.
                    <br />
                    <span className="text-white/50">Your calm business partner.</span>
                  </h2>
                  <p className="mt-4 max-w-md text-white/60">
                    Everything you need to run a one-person practice or a small
                    studio — booking, payments, reminders and a beautiful page —
                    in one quiet place.
                  </p>
                </div>
                <Link
                  to={ROUTE_START}
                  className="mt-8 inline-flex w-fit items-center gap-2 rounded-full bg-primary-cta px-6 py-3 text-sm font-semibold text-white transition-transform hover:-translate-y-0.5 hover:bg-primary-dark hover:no-underline"
                >
                  Get Started <ArrowRight size={16} />
                </Link>
              </div>
            </Reveal>

            {/* Feature cards */}
            {FEATURES.map((f, i) => (
              <Reveal key={f.title} delay={(i % 3) * 0.06}>
                <motion.div
                  whileHover={{ y: -4 }}
                  transition={{ duration: 0.3, ease: EASE }}
                  className="flex h-full flex-col rounded-[2rem] border border-black/5 bg-white p-6 shadow-[0_8px_30px_rgba(26,26,26,0.04)]"
                >
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-neutral-100 text-ink">
                    <f.icon size={20} />
                  </span>
                  <h3 className="mt-4 font-heading text-base font-bold text-ink">
                    {f.title}
                  </h3>
                  <p className="mt-1.5 text-sm text-neutral-500">{f.desc}</p>
                </motion.div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>
      )}

      {/* ════════════════ WHO IT'S FOR ════════════════
         REMOVED from page (keep for later). Restore by deleting `{false && (`
         and its matching `)}` after </section>. */}
      {false && (
      <section className="px-5 py-20 sm:px-8 lg:py-28">
        <div className="mx-auto max-w-6xl">
          <Reveal as="h2" className="max-w-xl text-4xl text-ink sm:text-5xl">
            Built for the new
            <br />
            <span className="text-neutral-400">Indian professional.</span>
          </Reveal>

          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {WHO.map((p, i) => (
              <Reveal key={p.key} delay={(i % 3) * 0.07}>
                <div className="group relative overflow-hidden rounded-[2rem] bg-sand shadow-sm transition-shadow duration-300 hover:shadow-[0_24px_50px_-20px_rgba(26,26,26,0.35)]">
                  <div className="aspect-[4/5] overflow-hidden">
                    <img
                      src={PERSONAS[p.key]}
                      alt={p.title}
                      loading="lazy"
                      className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.03]"
                    />
                  </div>
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent p-6 pt-16">
                    <h3 className="font-heading text-lg font-bold text-white">{p.title}</h3>
                    <p className="mt-0.5 text-sm text-white/70">{p.desc}</p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>
      )}

      {/* ════════════════ TESTIMONIALS (CENTERED CAROUSEL) ════════════════ */}
      <section id="collective" className="overflow-hidden px-5 py-20 sm:px-8 lg:py-28">
        <div className="mx-auto max-w-3xl text-center">
          <Reveal as="h2" className="text-5xl font-extrabold leading-[1.05] tracking-tight text-ink sm:text-6xl">
            Don't just take our word for it
          </Reveal>
          <Reveal as="p" delay={0.1} className="mx-auto mt-5 max-w-xl text-base text-neutral-500">
            Our hosts are our best ambassadors. Discover why calm professionals across India choose Book A Sloth.
          </Reveal>
        </div>

        <div className="relative mt-16">
          {/* Blueprint guide lines (desktop) — at 28%/72% = the active card's edges */}
          <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-12 top-12 z-0 hidden lg:block">
            <div className="absolute inset-x-0 top-0 border-t border-dashed border-neutral-200" />
            <div className="absolute inset-x-0 bottom-0 border-t border-dashed border-neutral-200" />
            <div className="absolute inset-y-0 left-[28%] border-l border-dashed border-neutral-200" />
            <div className="absolute inset-y-0 left-[72%] border-l border-dashed border-neutral-200" />
          </div>

          {/* Transform track — Lenis blocks inner scrollLeft, so we translate.
              Loops forward forever (tripled list, animation-off seamless reset). */}
          <div
            ref={tWrapRef}
            onMouseEnter={() => { tPausedRef.current = true; }}
            onMouseLeave={() => { tPausedRef.current = false; }}
            className="relative z-10 overflow-hidden py-12"
          >
            <div
              className={`flex ${tAnim ? "transition-transform duration-700 ease-out motion-reduce:transition-none" : ""}`}
              style={{ transform: `translate3d(${tOffset}px, 0, 0)`, columnGap: `${T_GAP}px` }}
            >
              {tW > 0 &&
                [...TESTIMONIALS, ...TESTIMONIALS, ...TESTIMONIALS].map((t, i) => {
                  const isActive = i === activeT;
                  return (
                    <figure
                      key={i}
                      style={{ width: `${tCardW}px` }}
                      className={`flex h-[14rem] flex-shrink-0 flex-col justify-between rounded-[6px] p-7 text-left transition-[opacity,box-shadow,border-color] duration-500 sm:p-9 ${
                        isActive
                          ? "border border-black/5 bg-white opacity-100 shadow-[0_30px_70px_-30px_rgba(26,26,26,0.35)]"
                          : "border border-transparent bg-transparent opacity-40"
                      }`}
                    >
                      {/* Quote — top-left, full width (font ~50% of before) */}
                      <blockquote className="text-[15px] font-semibold leading-snug text-ink sm:text-[18px]">
                        “{t.quote}”
                      </blockquote>
                      {/* Photo · name · profession — bottom-left (size unchanged) */}
                      <figcaption className="flex items-center gap-3">
                        <TAvatar src={t.avatar} name={t.name} />
                        <div>
                          <div className="text-sm font-semibold text-ink">{t.name}</div>
                          <div className="text-xs text-neutral-400">{t.role}</div>
                        </div>
                      </figcaption>
                    </figure>
                  );
                })}
            </div>
          </div>

          {/* Blueprint crosshairs (desktop) — at the middle cell's corners */}
          <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-12 top-12 z-20 hidden lg:block">
            {[
              "left-[28%] top-0 -translate-x-1/2 -translate-y-1/2",
              "left-[72%] top-0 -translate-x-1/2 -translate-y-1/2",
              "left-[28%] bottom-0 -translate-x-1/2 translate-y-1/2",
              "left-[72%] bottom-0 -translate-x-1/2 translate-y-1/2",
            ].map((pos) => (
              <Plus key={pos} size={18} className={`absolute ${pos} text-neutral-300`} />
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════ CALM ECONOMY / MANIFESTO ════════════════
         REMOVED from page (keep for later). Restore by deleting `{false && (`
         and its matching `)}` after </section>. */}
      {false && (
      <section id="manifesto" className="px-5 py-20 sm:px-8 lg:py-32">
        <div className="mx-auto grid max-w-6xl gap-12 lg:grid-cols-12">
          <Reveal className="lg:col-span-4">
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-primary">
              The Calm Economy
            </p>
            <h2 className="mt-4 text-4xl leading-[1.05] text-ink sm:text-5xl">
              Work slower.
              <br />
              <span className="italic text-neutral-400">Earn smarter.</span>
            </h2>
          </Reveal>

          <Reveal delay={0.1} className="space-y-5 text-lg leading-relaxed text-neutral-600 lg:col-span-5">
            <p>Work shouldn't feel like warfare.</p>
            <p>
              You shouldn't need five tabs, three apps and a daily dose of anxiety
              to do the thing you actually love.
            </p>
            <p>
              Book A Sloth is part of a new rhythm — where peace and profit can
              finally coexist. Less hustle. More flow.
            </p>
          </Reveal>

          <Reveal delay={0.18} className="lg:col-span-3">
            <ul className="space-y-4 border-l border-neutral-200 pl-6">
              {["Less hustle, more flow.", "Balance over burnout.", "Time earns better when it's calm.", "Quiet tools, loud results."].map(
                (t) => (
                  <li key={t} className="text-lg text-ink">
                    {t}
                  </li>
                )
              )}
            </ul>
          </Reveal>
        </div>
      </section>
      )}

      {/* ════════════════ PRICING (2 plans · yearly active) ════════════════ */}
      <section id="pricing" className="px-5 py-20 sm:px-8 lg:py-28">
        <div className="mx-auto max-w-4xl">
          <Reveal as="h2" className="text-center text-4xl font-extrabold leading-tight text-ink sm:text-5xl">
            Simple pricing. <span className="text-primary">Zero commission.</span>
          </Reveal>
          <Reveal as="p" delay={0.06} className="mx-auto mt-4 max-w-md text-center text-neutral-500">
            Keep everything you earn. Start free — upgrade when you're ready.
          </Reveal>

          {/* Billing toggle — Yearly active by default */}
          <Reveal delay={0.12} className="mt-8 flex justify-center">
            <div className="inline-flex items-center gap-1 rounded-full border border-black/5 bg-white p-1 shadow-sm">
              <button
                type="button"
                onClick={() => setYearly(false)}
                className={`rounded-full px-4 py-1.5 text-sm font-semibold transition-colors ${!yearly ? "bg-ink text-white" : "text-neutral-500 hover:text-ink"}`}
              >
                Monthly
              </button>
              <button
                type="button"
                onClick={() => setYearly(true)}
                className={`inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-semibold transition-colors ${yearly ? "bg-ink text-white" : "text-neutral-500 hover:text-ink"}`}
              >
                Yearly
                <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${yearly ? "bg-primary text-white" : "bg-primary/10 text-primary"}`}>
                  Best value
                </span>
              </button>
            </div>
          </Reveal>

          {/* Plans */}
          <div className="mt-10 grid gap-5 md:grid-cols-2">
            {PLANS.map((p, i) => {
              const perMo = Math.round(p.yearly / 12);
              const savePct = Math.round((1 - p.yearly / 12 / p.monthly) * 100);
              const bigPrice = yearly ? p.yearly : p.monthly;
              return (
                <Reveal key={p.name} delay={i * 0.08}>
                  <div
                    className={`relative flex h-full flex-col rounded-[24px] border bg-white p-7 sm:p-8 ${
                      p.recommended
                        ? "border-primary/30 shadow-[0_24px_60px_-30px_rgba(254,81,0,0.45)] ring-1 ring-primary/20"
                        : "border-black/5 shadow-[0_8px_30px_rgba(26,26,26,0.05)]"
                    }`}
                  >
                    {p.recommended && (
                      <span className="absolute right-6 top-6 rounded-full bg-primary-cta px-3 py-1 text-xs font-semibold text-white">
                        Recommended
                      </span>
                    )}
                    <h3 className="font-heading text-2xl font-bold text-ink">{p.name}</h3>
                    <p className="mt-1 text-sm text-neutral-500">{p.tagline}</p>

                    <div className="mt-6 flex items-end gap-2">
                      <span className="text-5xl font-extrabold text-ink">₹{bigPrice.toLocaleString("en-IN")}</span>
                      <span className="mb-1.5 text-sm text-neutral-400">/ {yearly ? "year" : "month"}</span>
                      {yearly && (
                        <span className="mb-2 rounded-full bg-sand px-2 py-0.5 text-xs font-semibold text-primary">
                          Save {savePct}%
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-xs text-neutral-400">
                      {yearly ? `just ₹${perMo}/month, billed yearly` : "billed monthly"}
                    </p>

                    <Link
                      to={ROUTE_START}
                      className={`mt-6 inline-flex items-center justify-center rounded-[6px] px-6 py-3 text-sm font-semibold transition-transform hover:-translate-y-0.5 hover:no-underline ${
                        p.recommended
                          ? "bg-primary-cta text-white hover:bg-primary-dark"
                          : "bg-ink text-white hover:bg-neutral-800"
                      }`}
                    >
                      Start free
                    </Link>

                    <p className="mt-7 text-sm font-semibold text-ink">{p.intro}</p>
                    <ul className="mt-4 space-y-3">
                      {p.features.map((f) => (
                        <li key={f} className="flex items-start gap-2.5 text-sm text-neutral-600">
                          <Check size={16} className="mt-0.5 flex-shrink-0 text-primary" />
                          <span>{f}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </Reveal>
              );
            })}
          </div>

          {/* Free plan — horizontal on desktop, stacked (like the cards above) on mobile */}
          <Reveal delay={0.16} className="mt-5">
            <div className="rounded-[24px] border border-black/5 bg-white p-7 shadow-[0_8px_30px_rgba(26,26,26,0.05)] sm:p-8 lg:flex lg:items-center lg:gap-8">
              <div className="lg:shrink-0">
                <div className="flex items-center gap-2.5">
                  <h3 className="font-heading text-2xl font-bold text-ink">Free</h3>
                  <span className="rounded-full bg-sand px-2.5 py-0.5 text-xs font-semibold text-primary">Forever</span>
                </div>
                <p className="mt-1 text-sm text-neutral-500">Free forever · 5% per booking.</p>
                <div className="mt-4 flex items-end gap-2">
                  <span className="text-4xl font-extrabold text-ink">₹0</span>
                  <span className="mb-1 text-sm text-neutral-400">/ forever</span>
                </div>
              </div>

              <ul className="mt-6 grid gap-3 lg:mt-0 lg:flex-1 lg:grid-cols-2 lg:gap-x-8">
                {["Up to 5 services", "200 bookings a year", "1 calendar integration", "Email reminders"].map((f) => (
                  <li key={f} className="flex items-start gap-2.5 text-sm text-neutral-600">
                    <Check size={16} className="mt-0.5 flex-shrink-0 text-primary" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>

              <div className="mt-6 lg:mt-0 lg:shrink-0">
                <Link
                  to={ROUTE_START}
                  className="inline-flex w-full items-center justify-center rounded-[6px] bg-ink px-7 py-3 text-sm font-semibold text-white transition-transform hover:-translate-y-0.5 hover:bg-neutral-800 hover:no-underline lg:w-auto"
                >
                  Start free
                </Link>
              </div>
            </div>
          </Reveal>

          <p className="mt-8 text-center text-xs text-neutral-400">
            Paid plans are 0% commission. Prices in INR, exclusive of GST. Cancel anytime.
          </p>
        </div>
      </section>

      {/* ════════════════ PRICING (legacy, hidden) ════════════════
         REMOVED from page (keep for later). Restore by deleting `{false && (`
         and its matching `)}` after </section>. */}
      {false && (
      <section id="pricing" className="px-5 py-20 sm:px-8 lg:py-28">
        <div className="mx-auto max-w-5xl">
          <Reveal as="h2" className="text-center text-4xl text-ink sm:text-5xl">
            Calm plans, no contracts.
          </Reveal>
          <Reveal as="p" delay={0.06} className="mt-4 text-center text-neutral-500">
            Cancel anytime. Start free, forever.
          </Reveal>

          {/* Top row: Pro + Studio */}
          <div className="mt-14 grid gap-5 md:grid-cols-2">
            {[
              {
                tier: "Pro Sloth",
                tagline: "For growing freelancers & coaches.",
                price: "₹499",
                period: "/ month",
                popular: true,
                perks: ["Unlimited bookings", "Payments + reminders", "Custom SlothPage", "AI calm assistant"],
              },
              {
                tier: "Studio Plan",
                tagline: "For agencies & multi-person studios.",
                price: "₹1,499",
                period: "/ month",
                perks: ["Everything in Pro", "Team calendars", "Multiple members", "Priority support"],
              },
            ].map((p, i) => (
              <Reveal key={p.tier} delay={i * 0.08}>
                <div
                  className={`relative flex h-full flex-col rounded-[2rem] p-8 ${
                    p.popular
                      ? "bg-ink text-white shadow-[0_30px_70px_-25px_rgba(26,26,26,0.6)]"
                      : "border border-black/5 bg-white"
                  }`}
                >
                  {p.popular && (
                    <span className="absolute right-6 top-6 rounded-full bg-primary-cta px-3 py-1 text-xs font-semibold text-white">
                      Most popular
                    </span>
                  )}
                  <h3 className="font-heading text-lg font-bold">{p.tier}</h3>
                  <p className={`mt-1 text-sm ${p.popular ? "text-white/60" : "text-neutral-500"}`}>
                    {p.tagline}
                  </p>
                  <div className="mt-6 flex items-end gap-1">
                    <span className="text-5xl">{p.price}</span>
                    <span className={`mb-1.5 text-sm ${p.popular ? "text-white/50" : "text-neutral-400"}`}>
                      {p.period}
                    </span>
                  </div>
                  <ul className="mt-6 flex-1 space-y-3">
                    {p.perks.map((perk) => (
                      <li key={perk} className="flex items-center gap-2.5 text-sm">
                        <Check size={16} className="text-primary" />
                        <span className={p.popular ? "text-white/80" : "text-neutral-600"}>{perk}</span>
                      </li>
                    ))}
                  </ul>
                  <Link
                    to={ROUTE_START}
                    className={`mt-8 inline-flex items-center justify-center rounded-full py-3 text-sm font-semibold transition-transform hover:-translate-y-0.5 hover:no-underline ${
                      p.popular
                        ? "bg-primary-cta text-white hover:bg-primary-dark"
                        : "bg-neutral-100 text-ink hover:bg-neutral-200"
                    }`}
                  >
                    Get started
                  </Link>
                </div>
              </Reveal>
            ))}
          </div>

          {/* Full-width Free Forever */}
          <Reveal delay={0.1} className="mt-5">
            <div className="flex flex-col items-center gap-6 rounded-[2rem] border border-black/5 bg-white p-8 sm:flex-row sm:justify-between sm:p-10">
              <div className="text-center sm:text-left">
                <h3 className="font-heading text-xl font-bold text-ink">Free Forever</h3>
                <p className="mt-1 max-w-sm text-sm text-neutral-500">
                  Everything you need to take your first calm booking. No card, no catch.
                </p>
              </div>
              <div className="text-center">
                <span className="text-5xl text-ink">₹0</span>
                <p className="text-xs text-neutral-400">forever</p>
              </div>
              <Link
                to={ROUTE_START}
                className="inline-flex items-center gap-2 rounded-full bg-ink px-7 py-3.5 text-sm font-semibold text-white transition-transform hover:-translate-y-0.5 hover:no-underline"
              >
                Get Started <ArrowRight size={15} />
              </Link>
            </div>
          </Reveal>
        </div>
      </section>
      )}

      {/* ════════════════ COMPARISON / COMPETITORS (full-width dark band) ════════════════ */}
      <section className="bg-ink px-5 py-16 text-white sm:px-8 lg:py-24">
        <Reveal className="mx-auto max-w-7xl">
          <div className="lg:flex lg:items-end lg:justify-between">
            <div>
              <p className="text-sm font-medium uppercase tracking-[0.2em] text-primary">Compare</p>
              <h2 className="mt-4 max-w-xl text-4xl leading-tight text-white sm:text-5xl">
                A calmer alternative to the tools you know.
              </h2>
            </div>
            <Link
              to={ROUTE_START}
              className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:no-underline lg:mb-2 lg:mt-0"
            >
              See for yourself <ArrowUpRight size={16} />
            </Link>
          </div>

          <div className="mt-10 grid grid-cols-2 border-l border-t border-white/10 lg:grid-cols-4">
            {COMPETITORS.map((c) => {
              const Tag = c.href ? Link : "div";
              const tagProps = c.href ? { to: c.href } : {};
              return (
                <Tag
                  key={c.name}
                  {...tagProps}
                  className={`group relative flex min-h-[170px] flex-col justify-between border-b border-r border-white/10 p-6 ${
                    c.soon ? "opacity-50" : c.href ? "transition-colors hover:bg-white/[0.04] hover:no-underline" : ""
                  }`}
                >
                  <div className="flex items-start justify-between">
                    {/* competitor icon vs Book A Sloth icon — no white tile */}
                    <div className="flex items-center gap-1.5">
                      <img
                        src={`https://www.google.com/s2/favicons?sz=64&domain=${c.domain}`}
                        alt=""
                        loading="lazy"
                        className="h-7 w-7 object-contain"
                      />
                      <span className="text-xs font-medium text-white/40">vs</span>
                      <img
                        src="https://company-assets.bookasloth.in/images/email/sloth-icon-sqr.png"
                        alt="Book A Sloth"
                        loading="lazy"
                        className="h-7 w-7 rounded-[6px] object-contain"
                      />
                    </div>
                    {c.soon ? (
                      <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white/50">
                        Soon
                      </span>
                    ) : (
                      <ArrowUpRight size={18} className="text-white/40 transition-colors group-hover:text-white" />
                    )}
                  </div>
                  <p className="text-base font-semibold text-white">{c.name} vs Book A Sloth</p>
                </Tag>
              );
            })}
          </div>
        </Reveal>
      </section>

      {/* ════════════════ NEWSLETTER ════════════════
         REMOVED from page (keep for later). Restore by deleting `{false && (`
         and its matching `)}` after </section>. */}
      {false && (
      <section id="newsletter" className="px-5 py-20 sm:px-8">
        <Reveal className="mx-auto max-w-4xl overflow-hidden rounded-[2.5rem] bg-sand">
          <div className="grid items-center gap-8 p-8 sm:p-12 lg:grid-cols-2">
            <div>
              <h2 className="text-3xl text-ink sm:text-4xl">
                Letters from the calm side.
              </h2>
              <p className="mt-3 max-w-sm text-neutral-500">
                Tips, templates and the occasional truth bomb — delivered weekly,
                quietly.
              </p>
              <form onSubmit={submitNewsletter} noValidate className="mt-6 flex flex-col gap-2 sm:flex-row">
                <label htmlFor="newsletter-email" className="sr-only">Email address</label>
                <input
                  id="newsletter-email"
                  type="email"
                  autoComplete="email"
                  placeholder="your@email.com"
                  value={emailInput}
                  onChange={(e) => {
                    setEmailInput(e.target.value);
                    if (newsletterState !== "idle") setNewsletterState("idle");
                  }}
                  aria-invalid={newsletterState === "err"}
                  className="!h-12 flex-1 rounded-full border border-black/5 bg-white px-5 text-sm focus:!border-primary"
                />
                <button
                  type="submit"
                  disabled={newsletterState === "loading"}
                  className="inline-flex items-center justify-center rounded-full bg-primary-cta px-6 py-3 text-sm font-semibold text-white transition-transform hover:-translate-y-0.5 hover:bg-primary-dark disabled:opacity-60"
                >
                  {newsletterState === "loading" ? "Joining…" : "Join the Collective"}
                </button>
              </form>
              <p role="status" aria-live="polite" className="mt-3 text-xs text-neutral-500">
                {newsletterState === "ok"
                  ? "You’re in — welcome to the Collective."
                  : newsletterState === "err"
                  ? "Please enter a valid email address."
                  : "No spam. Unsubscribe anytime."}
              </p>
            </div>
            <div className="hidden overflow-hidden rounded-[1.5rem] lg:block">
              <img src={NEWSLETTER} alt="" loading="lazy" className="aspect-[4/3] w-full object-cover" />
            </div>
          </div>
        </Reveal>
      </section>
      )}

      {/* ════════════════ FINAL CTA ════════════════
         REMOVED from page (keep for later). Restore by deleting `{false && (`
         and its matching `)}` after </section>. */}
      {false && (
      <section ref={finalRef} className="relative px-5 py-20 sm:px-8">
        <div className="relative mx-auto max-w-6xl overflow-hidden rounded-[2.5rem]">
          <motion.img
            src={FINAL}
            alt=""
            loading="lazy"
            style={{ y: finalImgY }}
            className="absolute inset-0 h-[120%] w-full object-cover"
          />
          <div className="absolute inset-0 bg-ink/60" />
          <div className="relative px-6 py-24 text-center sm:py-32">
            <Reveal as="h2" className="mx-auto max-w-2xl text-4xl leading-tight text-white sm:text-6xl">
              You've done the hustle.
              <br />
              <span className="italic text-white/70">Now try the flow.</span>
            </Reveal>
            <Reveal delay={0.1} className="mt-10 flex flex-col justify-center gap-3 sm:flex-row">
              <Link
                to={ROUTE_START}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-primary-cta px-8 py-4 text-sm font-semibold text-white shadow-[0_16px_40px_rgba(254,81,0,0.4)] transition-transform hover:-translate-y-0.5 hover:bg-primary-dark hover:no-underline"
              >
                Get Started <ArrowRight size={16} />
              </Link>
              <a
                href="#how-it-works"
                className="inline-flex items-center justify-center rounded-full border border-white/30 bg-white/10 px-8 py-4 text-sm font-semibold text-white backdrop-blur transition-colors hover:bg-white/20 hover:no-underline"
              >
                See how it works
              </a>
            </Reveal>
          </div>
        </div>
      </section>
      )}

      {/* ════════════════ FOOTER ════════════════ */}
      <footer className="px-5 pb-12 pt-10 sm:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="grid gap-10 border-t border-neutral-200 py-12 sm:grid-cols-2 lg:grid-cols-5">
            <div className="lg:col-span-2">
              <a href="#top" className="flex items-center gap-2 hover:no-underline">
                <span className="text-xl">🦥</span>
                <span className="font-heading text-base font-extrabold text-ink">Book A Sloth</span>
              </a>
              <p className="mt-3 max-w-xs text-sm text-neutral-500">
                The calm way to get booked and paid. Built with calm, in India.
              </p>
              <div className="mt-5 flex gap-3">
                {SOCIAL.map(({ Icon, label, href }) => (
                  <a
                    key={label}
                    href={href}
                    aria-label={label}
                    className="flex h-9 w-9 items-center justify-center rounded-full bg-neutral-100 text-neutral-500 transition-colors hover:bg-primary hover:text-white"
                  >
                    <Icon size={16} />
                  </a>
                ))}
              </div>
            </div>

            {FOOTER_COLS.map((col) => (
              <div key={col.h}>
                <p className="font-heading text-sm font-bold text-ink">{col.h}</p>
                <ul className="mt-4 space-y-2.5">
                  {col.links.map((l) => (
                    <li key={l.t}>
                      {l.href.startsWith("/") ? (
                        <Link to={l.href} className="text-sm text-neutral-500 hover:text-primary hover:no-underline">
                          {l.t}
                        </Link>
                      ) : (
                        <a href={l.href} className="text-sm text-neutral-500 hover:text-primary hover:no-underline">
                          {l.t}
                        </a>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="flex flex-col gap-2 border-t border-neutral-200 py-6 text-xs text-neutral-400 sm:flex-row sm:justify-between">
            <p>© {new Date().getFullYear()} Book A Sloth. All rights reserved.</p>
            <div className="flex flex-wrap gap-5">
              <Link to="/terms" className="hover:text-ink hover:no-underline">Terms</Link>
              <Link to="/privacy" className="hover:text-ink hover:no-underline">Privacy</Link>
              <Link to="/refund" className="hover:text-ink hover:no-underline">Refund</Link>
              <a href="mailto:team@timewheel.co.in" className="hover:text-ink hover:no-underline">team@timewheel.co.in</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;
