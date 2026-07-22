/**
 * WallOfLove.jsx — multi-platform social-proof wall.
 * Route: /wall-of-love (renders inside app chrome — global <Navbar/>).
 *
 * DESIGN-ONLY: every item below is hardcoded mock data grouped by platform.
 * Wiring to real testimonials is a later job — swap the PLATFORMS arrays for a
 * fetch when a testimonials source exists.
 */
import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Heart, MessageCircle, Repeat2, ThumbsUp, Share2, Send, Bookmark, Play, ArrowRight,
} from 'lucide-react';
import Seo from '../components/common/Seo';
import { collectionPageJsonLd, breadcrumbJsonLd } from '../utils/seo';

const BRAND = (name) => `/assets/brands/${name}.svg`;

// Avatar tint → our accent tokens (design-tokens.css / tailwind c-*).
const TINT = {
  orange: 'bg-primary-light text-primary',
  pink: 'bg-c-pink/10 text-c-pink',
  green: 'bg-c-emerald/10 text-c-emerald',
  blue: 'bg-c-blue/10 text-c-blue',
};

// ponytail: hardcoded mock — real testimonials come from a fetch later.
const TWEETS = [
  { avatar: 'AV', tint: 'orange', name: 'Aarav Verma', handle: '@aarav_builds', date: '10:15 AM · Jun 2, 2026', text: 'Book A Sloth completely changed how I manage appointments. My reminders run automatically and I finally stopped chasing customers all day.', stats: { r: 12, rt: 34, l: 128 } },
  { avatar: 'MS', tint: 'pink', name: 'Maya Shah', handle: '@maya_coaches', date: '9:47 AM · May 28, 2026', text: 'Finally a booking tool made for people who actually run appointments all day. My clients love it and I save hours every week.', stats: { r: 8, rt: 21, l: 89 } },
  { avatar: 'RK', tint: 'blue', name: 'Rohan Kapoor', handle: '@trainwithrohan', date: '8:20 PM · May 26, 2026', text: 'No more WhatsApp back and forth. Everything runs on autopilot now. More focus on my clients, less time doing admin.', stats: { r: 5, rt: 18, l: 72 } },
  { avatar: 'NK', tint: 'green', name: 'Naina Khanna', handle: '@nainasstudio', date: '11:30 AM · May 24, 2026', text: 'My schedule has never been this organised. Clients love the reminders and easy booking flow. Simple, polished and genuinely useful.', stats: { r: 5, rt: 11, l: 64 } },
];

const GOOGLE = [
  { avatar: 'PS', tint: 'pink', name: 'Priya Sharma', meta: 'Local Guide · 12 reviews', age: '2 weeks ago', text: 'Book A Sloth simplified my entire booking process. Clients can book, pay and reschedule easily. Such a smooth experience.', helpful: 5 },
  { avatar: 'AN', tint: 'orange', name: 'Arjun Nair', meta: '7 reviews', age: '1 month ago', text: 'Best scheduling tool I’ve used so far. Automations and reminders have reduced no-shows significantly.', helpful: 4 },
  { avatar: 'KM', tint: 'blue', name: 'Kabir Mehta', meta: 'Local Guide · 24 reviews', age: '1 month ago', text: 'Clean UI, powerful features and genuinely helpful support. My business runs smoother than ever.', helpful: 6 },
  { avatar: 'SK', tint: 'green', name: 'Sana Khan', meta: '3 reviews', age: '3 weeks ago', text: 'I needed something simple yet powerful. Book A Sloth is exactly that and more.', helpful: 3 },
];

const LINKEDIN = [
  { avatar: 'RS', tint: 'orange', name: 'Rishi Singh', role: 'Entrepreneur', text: 'Since switching to Book A Sloth, my team and I have saved 10+ hours every week.\n\nIt’s not just a tool. It’s become a growth partner for our business.', likes: 98, comments: 12 },
  { avatar: 'MA', tint: 'pink', name: 'Meera Agarwal', role: 'Business Coach', text: 'My clients love the seamless booking experience and I love the automation behind it.\n\nProud to be a Book A Sloth host.', likes: 76, comments: 8 },
  { avatar: 'VJ', tint: 'blue', name: 'Vikram Joshi', role: 'Marketing Consultant', text: 'Finally, a Made in India solution that understands how appointment businesses actually work.\n\nKudos to the Book A Sloth team.', likes: 54, comments: 6 },
  { avatar: 'NB', tint: 'green', name: 'Neha Bansal', role: 'Wellness Expert', text: 'Automations, payments, reminders and a beautiful booking page.\n\nBook A Sloth does it all.', likes: 41, comments: 4 },
];

const YOUTUBE = [
  { overlay: 'Why I Switched\nto Book A Sloth', duration: '6:42', title: 'Why I Switched to Book A Sloth (Complete Walkthrough)', meta: 'The Coaches Club · 1.2K views · 2 weeks ago' },
  { overlay: 'Book A Sloth\nReview & Demo', duration: '8:15', title: 'Book A Sloth Review & Demo – Is It Worth It?', meta: 'SaaS Simplified · 2.3K views · 1 month ago' },
  { overlay: 'Automate Your\nBookings', duration: '5:31', title: 'How I Automated My Business Bookings', meta: 'Fitness with Rahul · 3.1K views · 3 weeks ago' },
  { overlay: 'Full Setup Guide\nfor Beginners', duration: '7:06', title: 'Book A Sloth Full Setup Guide for Beginners', meta: 'Digital Dost · 1.8K views · 1 month ago' },
];

// bg = gradient tint for the post "image"; text tokens picked for contrast.
const INSTAGRAM = [
  { avatar: 'CR', tint: 'orange', handle: 'thefitcoach_rahul', copy: 'My new booking\npage is live!', bg: 'bg-gradient-to-br from-ink to-black text-white', tag: 'text-secondary', likes: 128 },
  { avatar: 'AC', tint: 'pink', handle: 'coach_ananya', copy: 'Automations\nthat save me\nevery day.', bg: 'bg-gradient-to-br from-primary to-primary-dark text-white', tag: 'text-secondary', likes: 97 },
  { avatar: 'NK', tint: 'blue', handle: 'dr.naina.k', copy: 'No more\nno-shows.\n\nThank you\nBook A Sloth!', bg: 'bg-sand text-ink', tag: 'text-primary', likes: 156 },
  { avatar: 'WS', tint: 'green', handle: 'the.wellness.studio', copy: 'Everything in\none place.\n\nSo. Much. Peace.', bg: 'bg-ink text-white', tag: 'text-secondary', likes: 112 },
];

const PLATFORMS = [
  { key: 'twitter', label: 'Twitter / X', brand: 'x' },
  { key: 'google', label: 'Google', brand: 'google' },
  { key: 'linkedin', label: 'LinkedIn', brand: 'linkedin' },
  { key: 'youtube', label: 'YouTube', brand: 'youtube' },
  { key: 'instagram', label: 'Instagram', brand: 'instagram' },
];

function Avatar({ children, tint, size = 'h-9 w-9 text-[11px]' }) {
  return (
    <span className={`grid ${size} shrink-0 place-items-center rounded-full font-heading font-bold ${TINT[tint]}`}>
      {children}
    </span>
  );
}

function UserRow({ r, sub }) {
  return (
    <div className="flex items-center gap-2.5">
      <Avatar tint={r.tint}>{r.avatar}</Avatar>
      <div className="min-w-0 flex-1">
        <div className="truncate font-heading text-[13px] font-bold text-ink">{r.name}</div>
        <div className="truncate text-[11px] text-muted">{sub}</div>
      </div>
    </div>
  );
}

const CARD = 'rounded-xl border-2 border-ink/10 bg-surface shadow-sm transition hover:-translate-y-0.5 hover:shadow-md';

function TweetCard({ r }) {
  return (
    <article className={`flex min-h-[280px] flex-col p-5 ${CARD}`}>
      <div className="flex items-start justify-between gap-4">
        <UserRow r={r} sub={r.handle} />
        <img src={BRAND('x')} alt="X" className="h-5 w-5 shrink-0" />
      </div>
      <p className="mt-5 text-[13px] leading-relaxed text-ink">{r.text}</p>
      <div className="mt-auto pt-5 text-[11px] text-muted">{r.date}</div>
      <div className="mt-3 flex items-center gap-6 border-t-2 border-ink/5 pt-3 text-[11px] text-muted">
        <span className="inline-flex items-center gap-1.5"><MessageCircle className="h-3.5 w-3.5" />{r.stats.r}</span>
        <span className="inline-flex items-center gap-1.5"><Repeat2 className="h-3.5 w-3.5" />{r.stats.rt}</span>
        <span className="inline-flex items-center gap-1.5"><Heart className="h-3.5 w-3.5" />{r.stats.l}</span>
      </div>
    </article>
  );
}

function GoogleCard({ r }) {
  return (
    <article className={`flex min-h-[280px] flex-col p-5 ${CARD}`}>
      <div className="flex items-start justify-between gap-4">
        <UserRow r={r} sub={r.meta} />
        <img src={BRAND('google')} alt="Google" className="h-5 w-5 shrink-0" />
      </div>
      <div className="mt-4 flex items-center gap-2">
        <span className="text-sm tracking-wide text-secondary">{'★★★★★'}</span>
        <span className="text-[11px] text-muted">{r.age}</span>
      </div>
      <p className="mt-3 text-[13px] leading-relaxed text-ink">{r.text}</p>
      <div className="mt-auto flex justify-between pt-5 text-[11px] text-muted">
        <span className="inline-flex items-center gap-1.5"><ThumbsUp className="h-3.5 w-3.5" />{r.helpful}</span>
        <span className="inline-flex items-center gap-1.5"><Share2 className="h-3.5 w-3.5" />Share</span>
      </div>
    </article>
  );
}

function LinkedinCard({ r }) {
  return (
    <article className={`flex min-h-[330px] flex-col p-5 ${CARD}`}>
      <div className="flex items-start justify-between gap-4">
        <UserRow r={{ ...r, name: `${r.name} · 2nd` }} sub={r.role} />
        <img src={BRAND('linkedin')} alt="LinkedIn" className="h-5 w-5 shrink-0" />
      </div>
      <p className="mt-5 whitespace-pre-line text-[13px] leading-relaxed text-ink">{r.text}</p>
      <div className="mt-auto flex justify-between pt-5 text-[11px] text-muted">
        <div className="flex items-center gap-1.5">
          <span className="grid h-4 w-4 place-items-center rounded-full bg-c-blue text-[7px] text-white">{'♥'}</span>
          <span className="grid h-4 w-4 place-items-center rounded-full bg-c-pink text-[7px] text-white">{'♥'}</span>
          <span>{r.likes}</span>
        </div>
        <span>{r.comments} comments</span>
      </div>
      <div className="mt-3 flex justify-between border-t-2 border-ink/5 pt-3 text-[11px] font-medium text-muted">
        <span>Like</span><span>Comment</span><span>Share</span>
      </div>
    </article>
  );
}

function YoutubeCard({ r }) {
  return (
    <a href="#" className="group block">
      <div className="relative flex aspect-video items-end overflow-hidden rounded-xl bg-gradient-to-br from-ink to-black p-4 text-white">
        <span className="pointer-events-none absolute -right-11 -top-20 h-40 w-40 rounded-full bg-primary/20" />
        <div className="relative z-10 max-w-[70%] whitespace-pre-line font-heading text-lg font-bold leading-tight">{r.overlay}</div>
        <span className="absolute left-1/2 top-1/2 grid h-12 w-12 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-primary text-white transition group-hover:scale-110">
          <Play className="h-5 w-5 fill-white" />
        </span>
        <span className="absolute bottom-2 right-2 rounded bg-black px-1.5 py-0.5 text-[8px] font-medium">{r.duration}</span>
      </div>
      <div className="pt-3">
        <div className="font-heading text-[13px] font-bold leading-snug text-ink">{r.title}</div>
        <div className="mt-2 text-[11px] text-muted">{r.meta}</div>
      </div>
    </a>
  );
}

function InstagramCard({ r }) {
  return (
    <article className={`overflow-hidden ${CARD}`}>
      <div className="flex h-12 items-center justify-between gap-2.5 px-3.5">
        <div className="flex items-center gap-2.5">
          <Avatar tint={r.tint} size="h-7 w-7 text-[8px]">{r.avatar}</Avatar>
          <span className="font-heading text-[11px] font-bold text-ink">{r.handle}</span>
        </div>
        <img src={BRAND('instagram')} alt="Instagram" className="h-5 w-5 shrink-0" />
      </div>
      <div className={`flex aspect-[1/0.83] items-center p-6 ${r.bg}`}>
        <div className="max-w-[85%] whitespace-pre-line font-heading text-xl font-bold leading-tight">
          {r.copy}
          <span className={`mt-2.5 block text-[10px] font-medium ${r.tag}`}>@bookasloth</span>
        </div>
      </div>
      <div className="flex items-center justify-between px-4 py-3.5">
        <div className="flex gap-3 text-ink">
          <Heart className="h-[18px] w-[18px]" /><MessageCircle className="h-[18px] w-[18px]" /><Send className="h-[18px] w-[18px]" />
        </div>
        <Bookmark className="h-[18px] w-[18px] text-ink" />
      </div>
      <div className="px-4 pb-3.5 text-[11px] font-medium text-ink">{r.likes} likes</div>
    </article>
  );
}

function Section({ platform, children }) {
  return (
    <section className="mt-16 first:mt-0">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <img src={BRAND(platform.brand)} alt={platform.label} className="h-7 w-7" />
          <h2 className="font-heading text-xl font-bold tracking-tight text-ink sm:text-2xl">{platform.label}</h2>
        </div>
        <a href="#" className="inline-flex items-center gap-2 text-[11px] font-medium text-muted transition hover:text-ink">
          <span className="hidden sm:inline">View more on {platform.label}</span>
          <ArrowRight className="h-3.5 w-3.5" />
        </a>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">{children}</div>
    </section>
  );
}

const RENDERERS = {
  twitter: () => TWEETS.map((r) => <TweetCard key={r.name} r={r} />),
  google: () => GOOGLE.map((r) => <GoogleCard key={r.name} r={r} />),
  linkedin: () => LINKEDIN.map((r) => <LinkedinCard key={r.name} r={r} />),
  youtube: () => YOUTUBE.map((r) => <YoutubeCard key={r.title} r={r} />),
  instagram: () => INSTAGRAM.map((r) => <InstagramCard key={r.handle} r={r} />),
};

export default function WallOfLove() {
  const [filter, setFilter] = useState('all');
  const visible = PLATFORMS.filter((p) => filter === 'all' || filter === p.key);

  return (
    <div className="min-h-screen bg-canvas px-4 pb-24 pt-12 sm:pt-16">
      <Seo
        title="Wall of Love — Book A Sloth"
        description="Real words from hosts and guests who book, get booked, and get paid on Book A Sloth — across X, Google, LinkedIn, YouTube and Instagram."
        jsonLd={[
          collectionPageJsonLd({
            name: 'Wall of Love — Book A Sloth',
            description: 'Real words from hosts and guests who book, get booked, and get paid on Book A Sloth — across X, Google, LinkedIn, YouTube and Instagram.',
            url: '/wall-of-love',
          }),
          breadcrumbJsonLd({ items: [{ name: 'Home', path: '/' }, { name: 'Wall of Love', path: '/wall-of-love' }] }),
        ]}
      />

      {/* Hero */}
      <header className="mx-auto max-w-2xl text-center">
        <span className="inline-flex items-center gap-2 rounded-full bg-primary-light px-4 py-1.5 text-xs font-bold uppercase tracking-wide text-primary">
          <Heart className="h-4 w-4 fill-primary" />
          Wall of Love
        </span>
        <h1 className="mt-5 font-heading text-4xl font-extrabold tracking-tight text-ink sm:text-5xl">
          Loved by hosts. Trusted by thousands.
        </h1>
        <p className="mt-4 text-base text-muted">
          Real stories from real people who save time, get more bookings and grow their business with Book A Sloth.
        </p>
      </header>

      {/* Filters */}
      <div className="mx-auto mt-10 flex max-w-4xl flex-nowrap items-center justify-start gap-2 overflow-x-auto pb-2 [scrollbar-width:none] sm:flex-wrap sm:justify-center sm:overflow-visible [&::-webkit-scrollbar]:hidden">
        <button
          type="button"
          onClick={() => setFilter('all')}
          className={`inline-flex h-10 shrink-0 items-center gap-2 rounded-full border-2 bg-surface px-4 font-heading text-xs font-semibold text-ink transition hover:-translate-y-0.5 ${filter === 'all' ? 'border-primary shadow-sm' : 'border-ink/10'}`}
        >
          <span className="h-1.5 w-1.5 rounded-full bg-primary" />
          All
        </button>
        {PLATFORMS.map((p) => (
          <button
            key={p.key}
            type="button"
            onClick={() => setFilter(p.key)}
            className={`inline-flex h-10 shrink-0 items-center gap-2 rounded-full border-2 bg-surface px-4 font-heading text-xs font-semibold text-ink transition hover:-translate-y-0.5 ${filter === p.key ? 'border-primary shadow-sm' : 'border-ink/10'}`}
          >
            <img src={BRAND(p.brand)} alt="" className="h-4 w-4" />
            {p.label}
          </button>
        ))}
      </div>

      {/* Wall */}
      <main className="mx-auto mt-14 max-w-6xl">
        {visible.map((p) => (
          <Section key={p.key} platform={p}>{RENDERERS[p.key]()}</Section>
        ))}

        {/* Bottom CTA */}
        <section className="relative mt-20 rounded-xl border-2 border-ink/10 bg-sand px-8 pb-10 pt-12 text-center">
          <Heart className="absolute -top-5 left-1/2 h-9 w-9 -translate-x-1/2 fill-primary text-primary" />
          <h2 className="font-heading text-2xl font-bold tracking-tight text-ink">Your success is our favorite story.</h2>
          <p className="mt-2 text-sm text-muted">Join amazing hosts growing their business with Book A Sloth.</p>
          <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
            <Link to="/be-a-sloth" className="inline-flex min-h-10 items-center justify-center rounded bg-primary-cta px-6 text-xs font-bold text-white transition hover:bg-primary-dark">
              Start Free
            </Link>
            <Link to="/pricing" className="inline-flex min-h-10 items-center justify-center rounded border-2 border-ink/10 bg-surface px-6 text-xs font-bold text-ink transition hover:border-ink/20">
              Book a Demo
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}
