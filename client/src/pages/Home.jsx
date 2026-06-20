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
  Menu,
  X,
  AtSign,
  Send,
  Rss,
  MessageCircle,
} from "lucide-react";
import { searchVendors } from "../services/api";
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
const TESTIMONIALS = [
  { q: "Book A Sloth made freelancing feel human again. I stopped chasing payments and started doing the work I love.", n: "Ria Sharma", r: "Content Coach", size: "wide" },
  { q: "It's Calendly if Calendly meditated.", n: "Anuj Mehta", r: "Product Designer", size: "sm" },
  { q: "I didn't automate my work — I automated my peace.", n: "Nishtha Kapoor", r: "Therapist", size: "md" },
  { q: "Feels less like software, more like sanity.", n: "Aditi Bose", r: "Consultant", size: "sm" },
  { q: "Payments land before the session even starts. My cash flow has never been calmer.", n: "Vikram Iyer", r: "Business Coach", size: "wide" },
  { q: "My students just pick a slot. No more 'are you free?' chaos.", n: "Sana Khan", r: "Math Tutor", size: "md" },
  { q: "The SlothPage is my whole studio in one link.", n: "Dev Malhotra", r: "Yoga Studio", size: "sm" },
  { q: "Finally, an Indian product that gets UPI, GST and INR right.", n: "Priya Nair", r: "CA & Advisor", size: "md" },
  { q: "Reminders cut my no-shows to almost zero.", n: "Rahul Verma", r: "Fitness Coach", size: "sm" },
  { q: "Calm, beautiful, and it just works. Rare combination.", n: "Meera Joshi", r: "UI Designer", size: "md" },
  { q: "I run a 6-person agency from one calm dashboard.", n: "Arjun Rao", r: "Agency Founder", size: "wide" },
  { q: "Booked, paid, remembered. That's the whole job done.", n: "Tara Singh", r: "Career Counsellor", size: "sm" },
];

const TCard = ({ t, face }) => {
  const width =
    t.size === "wide" ? "w-[360px]" : t.size === "md" ? "w-[300px]" : "w-[260px]";
  return (
    <figure
      className={`${width} shrink-0 rounded-3xl border border-black/5 bg-white p-6 shadow-[0_8px_30px_rgba(26,26,26,0.05)]`}
    >
      <div className="mb-3 flex gap-0.5">
        {[0, 1, 2, 3, 4].map((i) => (
          <Star key={i} size={14} className="fill-primary text-primary" />
        ))}
      </div>
      <blockquote className="text-[17px] leading-snug text-neutral-800">
        “{t.q}”
      </blockquote>
      <figcaption className="mt-5 flex items-center gap-3">
        <img
          src={face}
          alt={t.n}
          loading="lazy"
          className="h-10 w-10 rounded-full object-cover"
        />
        <div>
          <div className="text-sm font-semibold text-ink">{t.n}</div>
          <div className="text-xs text-neutral-400">{t.r}</div>
        </div>
      </figcaption>
    </figure>
  );
};

const MarqueeRow = ({ items, dir = "left" }) => {
  // Duplicate the list for a seamless 50% loop.
  const doubled = [...items, ...items];
  return (
    <div className="sloth-marquee-wrap sloth-edge-fade overflow-hidden py-2">
      <div className={`sloth-marquee sloth-marquee--${dir}`}>
        {doubled.map((t, i) => (
          <TCard key={`${dir}-${i}`} t={t} face={FACES[i % FACES.length]} />
        ))}
      </div>
    </div>
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
  const claim = () => navigate(ROUTE_START);

  // ── Newsletter ──
  const [emailInput, setEmailInput] = useState("");

  // ── Search (UNCHANGED logic — debounced searchVendors) ──
  const [query, setQuery] = useState("");
  const [results, setResults] = useState(null);
  const [searching, setSearching] = useState(false);
  const searchTimeout = useRef(null);

  const handleSearch = (q) => {
    setQuery(q);
    clearTimeout(searchTimeout.current);
    if (!q.trim()) {
      setResults(null);
      return;
    }
    searchTimeout.current = setTimeout(async () => {
      setSearching(true);
      try {
        const { data } = await searchVendors(q);
        setResults(data);
      } catch {
        setResults(null);
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

  return (
    <div id="top" className="overflow-x-hidden bg-canvas text-ink">
      <BrandPreloader variant="homepage" ready={assetsReady} />

      {/* ════════════════ HERO ════════════════ */}
      <section ref={heroRef} className="relative px-5 pb-16 pt-16 sm:px-8 sm:pt-20 lg:pb-24 lg:pt-28">
        <div className="mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-2 lg:gap-8">
          {/* LEFT */}
          <div>
            <Reveal as="h1" delay={0.05} className="text-[2.6rem] leading-[1.05] text-ink sm:text-6xl">
              Get booked & paid
              <br />
              <span className="italic text-neutral-500">before you even</span>
              <br />
              open your register.
            </Reveal>

            <Reveal as="p" delay={0.12} className="mt-6 max-w-md text-lg leading-relaxed text-neutral-500">
              Book A Sloth helps India's freelancers, tutors, coaches and studios
              get booked, paid and remembered — without the chaos.
            </Reveal>

            {/* URL creator */}
            <Reveal delay={0.18} className="mt-8">
              <div className="flex max-w-lg flex-col gap-2 sm:flex-row sm:items-center sm:gap-0 sm:rounded-2xl sm:border sm:border-neutral-200 sm:bg-white sm:p-1.5 sm:shadow-[0_4px_20px_-6px_rgba(0,0,0,0.12)]">
                {/* URL prefix + input — own card on mobile, merges into pill on desktop */}
                <div className="flex flex-1 items-center min-w-0 rounded-2xl border border-neutral-200 bg-white px-4 shadow-sm sm:rounded-xl sm:border-0 sm:bg-transparent sm:px-3 sm:shadow-none">
                  <span className="select-none whitespace-nowrap text-sm font-medium text-neutral-400 shrink-0">
                    bookasloth.com/
                  </span>
                  <input
                    value={username}
                    onChange={(e) =>
                      setUsername(e.target.value.replace(/[^a-z0-9-]/gi, "").toLowerCase())
                    }
                    onKeyDown={(e) => e.key === "Enter" && claim()}
                    placeholder="yourname"
                    className="!min-h-0 !w-auto flex-1 min-w-0 !border-0 !bg-transparent !p-0 py-3.5 text-sm font-medium text-ink placeholder:font-normal placeholder:text-neutral-300 !shadow-none focus:!ring-0 sm:py-2.5"
                  />
                </div>
                <button
                  onClick={claim}
                  className="btn inline-flex shrink-0 items-center justify-center gap-1.5 whitespace-nowrap bg-primary px-5 py-3.5 text-sm font-semibold text-white transition-all hover:-translate-y-0.5 hover:bg-primary-dark sm:py-3"
                >
                  Claim Your SlothPage
                  <ArrowRight size={15} />
                </button>
              </div>
            </Reveal>

            {/* Social proof */}
            <Reveal delay={0.24} className="mt-8 flex items-center gap-4">
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
                  Loved by 1,000+ calm professionals.
                </p>
              </div>
            </Reveal>
          </div>

          {/* RIGHT */}
          <Reveal delay={0.1} className="relative">
            <div className="relative mx-auto aspect-[4/5] w-full max-w-md overflow-hidden rounded-[2rem] bg-sand shadow-[0_30px_80px_-20px_rgba(26,26,26,0.3)]">
              <motion.img
                src={HERO}
                alt="A calm professional at work"
                loading="eager"
                style={{ y: heroImgY }}
                className="h-[112%] w-full object-cover"
              />
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

      {/* ════════════════ SEARCH ════════════════ */}
      <section id="find" className="px-5 py-20 sm:px-8 lg:py-28">
        <div className="mx-auto max-w-3xl text-center">
          <Reveal as="h2" className="text-4xl text-ink sm:text-5xl">
            Find a vendor
          </Reveal>
          <Reveal as="p" delay={0.06} className="mx-auto mt-4 max-w-md text-neutral-500">
            Search a name, a skill, a service. Discover calm professionals near you.
          </Reveal>

          <Reveal delay={0.12} className="relative mx-auto mt-10 max-w-2xl">
            <Search
              size={20}
              className="pointer-events-none absolute left-5 top-1/2 -translate-y-1/2 text-neutral-400"
            />
            <input
              type="text"
              placeholder="e.g. career coach, UI designer, yoga teacher…"
              value={query}
              onChange={(e) => handleSearch(e.target.value)}
              className="!h-16 w-full rounded-full border border-black/5 bg-white !pl-14 !pr-14 text-base shadow-[0_12px_40px_-12px_rgba(26,26,26,0.18)] focus:!border-primary"
            />
            {searching && (
              <div className="absolute right-6 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            )}
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
                <p className="py-6 text-center text-sm text-neutral-400">
                  No results for “{query}”.
                </p>
              )}

              {results?.vendors?.length > 0 && (
                <div className="mb-5">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-neutral-400">
                    Vendors
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

      {/* ════════════════ HOW THE CALM WORKS ════════════════ */}
      <section id="how-it-works" className="px-5 py-20 sm:px-8 lg:py-32">
        <div className="mx-auto max-w-6xl">
          <Reveal as="p" className="text-center text-sm font-medium uppercase tracking-[0.2em] text-primary">
            How the calm works
          </Reveal>
          <Reveal as="h2" delay={0.05} className="mx-auto mt-4 max-w-xl text-center text-4xl text-ink sm:text-5xl">
            Three steps. Zero chaos.
          </Reveal>

          <div className="mt-16 grid gap-10 md:grid-cols-3 md:gap-6">
            {[
              {
                title: "Book It",
                desc: "Share your link. Clients pick a slot. No DMs, no “are you free tomorrow?”.",
                draw: (
                  <>
                    <rect x="8" y="10" width="32" height="30" rx="4" />
                    <line x1="8" y1="18" x2="40" y2="18" />
                    <line x1="16" y1="6" x2="16" y2="14" />
                    <line x1="32" y1="6" x2="32" y2="14" />
                    <path d="M18 28l4 4 8-8" />
                  </>
                ),
              },
              {
                title: "Get Paid",
                desc: "Payment lands before you meet. UPI, card or wallet — peacefully verified.",
                draw: (
                  <>
                    <rect x="6" y="13" width="36" height="24" rx="4" />
                    <line x1="6" y1="21" x2="42" y2="21" />
                    <circle cx="14" cy="29" r="2.5" />
                  </>
                ),
              },
              {
                title: "Breathe Easy",
                desc: "Automatic reminders, receipts and follow-ups. You focus; we handle the rest.",
                draw: (
                  <>
                    <path d="M8 28c6 0 6-8 12-8s6 8 12 8 8-6 8-6" />
                    <circle cx="24" cy="14" r="4" />
                  </>
                ),
              },
            ].map((s, i) => (
              <Reveal key={s.title} delay={i * 0.1} className="text-center md:text-left">
                <div className="mb-6 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-white shadow-[0_10px_30px_-10px_rgba(26,26,26,0.15)]">
                  <LineIcon>{s.draw}</LineIcon>
                </div>
                <div className="mb-2 text-xs font-semibold text-neutral-300">
                  0{i + 1}
                </div>
                <h3 className="font-heading text-xl font-bold text-ink">{s.title}</h3>
                <p className="mt-2 text-neutral-500">{s.desc}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════ FEATURES (BENTO) ════════════════ */}
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
                  className="mt-8 inline-flex w-fit items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-white transition-transform hover:-translate-y-0.5 hover:bg-primary-dark hover:no-underline"
                >
                  Start Calmly <ArrowRight size={16} />
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

      {/* ════════════════ WHO IT'S FOR ════════════════ */}
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

      {/* ════════════════ TESTIMONIALS (MASONRY WALL) ════════════════ */}
      <section id="collective" className="overflow-hidden py-20 lg:py-28">
        <div className="mx-auto mb-14 max-w-3xl px-5 text-center sm:px-8">
          <Reveal as="p" className="text-sm font-medium uppercase tracking-[0.2em] text-primary">
            The Collective
          </Reveal>
          <Reveal as="h2" delay={0.05} className="mt-4 text-4xl text-ink sm:text-5xl">
            Peace of mind, proven by professionals.
          </Reveal>
        </div>

        <div className="flex flex-col gap-4">
          <MarqueeRow items={TESTIMONIALS.slice(0, 6)} dir="left" />
          <MarqueeRow items={TESTIMONIALS.slice(6, 12)} dir="right" />
          <MarqueeRow items={[...TESTIMONIALS].reverse().slice(0, 6)} dir="left" />
          <MarqueeRow items={[...TESTIMONIALS].reverse().slice(6, 12)} dir="right" />
        </div>

        <p className="mt-12 text-center text-sm text-neutral-400">
          Loved by 1,000+ calm professionals and counting.
        </p>
      </section>

      {/* ════════════════ CALM ECONOMY / MANIFESTO ════════════════ */}
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

      {/* ════════════════ PRICING ════════════════ */}
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
                    <span className="absolute right-6 top-6 rounded-full bg-primary px-3 py-1 text-xs font-semibold text-white">
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
                        ? "bg-primary text-white hover:bg-primary-dark"
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
                Start free <ArrowRight size={15} />
              </Link>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ════════════════ NEWSLETTER ════════════════ */}
      <section className="px-5 py-20 sm:px-8">
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
              <div className="mt-6 flex flex-col gap-2 sm:flex-row">
                <input
                  type="email"
                  placeholder="your@email.com"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  className="!h-12 flex-1 rounded-full border border-black/5 bg-white px-5 text-sm focus:!border-primary"
                />
                <button className="inline-flex items-center justify-center rounded-full bg-primary px-6 py-3 text-sm font-semibold text-white transition-transform hover:-translate-y-0.5 hover:bg-primary-dark">
                  Join the Collective
                </button>
              </div>
              <p className="mt-3 text-xs text-neutral-400">No spam. Unsubscribe anytime.</p>
            </div>
            <div className="hidden overflow-hidden rounded-[1.5rem] lg:block">
              <img src={NEWSLETTER} alt="" loading="lazy" className="aspect-[4/3] w-full object-cover" />
            </div>
          </div>
        </Reveal>
      </section>

      {/* ════════════════ FINAL CTA ════════════════ */}
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
                className="inline-flex items-center justify-center gap-2 rounded-full bg-primary px-8 py-4 text-sm font-semibold text-white shadow-[0_16px_40px_rgba(254,81,0,0.4)] transition-transform hover:-translate-y-0.5 hover:bg-primary-dark hover:no-underline"
              >
                Start Calmly <ArrowRight size={16} />
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
                {[AtSign, Send, Rss, MessageCircle].map((Icon, i) => (
                  <a
                    key={i}
                    href="#"
                    className="flex h-9 w-9 items-center justify-center rounded-full bg-neutral-100 text-neutral-500 transition-colors hover:bg-primary hover:text-white"
                  >
                    <Icon size={16} />
                  </a>
                ))}
              </div>
            </div>

            {[
              { h: "Product", links: ["How It Works", "Find Vendors", "Pricing", "SlothPage"] },
              { h: "Company", links: ["About", "Manifesto", "Careers", "Contact"] },
              { h: "Collective", links: ["The Collective", "Blog", "Stories", "Newsletter"] },
            ].map((col) => (
              <div key={col.h}>
                <p className="font-heading text-sm font-bold text-ink">{col.h}</p>
                <ul className="mt-4 space-y-2.5">
                  {col.links.map((l) => (
                    <li key={l}>
                      <a href="#" className="text-sm text-neutral-500 hover:text-primary hover:no-underline">
                        {l}
                      </a>
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
