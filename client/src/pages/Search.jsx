/**
 * Search.jsx — Google-style launcher for Book A Sloth.
 * Route: /search
 *
 * DESIGN-ONLY: no live search backend. The bar submits to /explore?q= so the
 * existing Explore page does the real work; shortcut tiles link to real routes.
 * "Continue where you left off" is mock data (recent-view history is not built).
 */
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Search as SearchIcon, Mic, ScanLine, Sparkles,
  User, Briefcase, MapPin, Calendar, Plus, MoreVertical, ChevronRight,
} from 'lucide-react';
import Seo from '../components/common/Seo';

// Quick-action tiles. Each links to a real route so the launcher is usable today.
const SHORTCUTS = [
  { icon: User,      label: 'Find a Host',      to: '/explore' },
  { icon: Briefcase, label: 'Explore Services', to: '/explore' },
  { icon: MapPin,    label: 'Nearby',           to: '/explore' },
  { icon: Calendar,  label: 'My Bookings',      to: '/user/bookings' },
  { icon: Plus,      label: 'Add shortcut',     to: '/explore' },
];

// ponytail: mock recent view — real "continue where you left off" needs a
// per-user history table that doesn't exist yet. Hardcoded until it does.
const RECENT = { host: 'Dr. Priya Sharma', service: 'Consultation', when: '2 hours ago' };

export default function Search() {
  const navigate = useNavigate();
  const [q, setQ] = useState('');

  const submit = (e) => {
    e.preventDefault();
    const v = q.trim();
    navigate(v ? `/explore?q=${encodeURIComponent(v)}` : '/explore');
  };

  return (
    <div className="min-h-screen bg-canvas px-4 pb-24 pt-10 sm:pt-16">
      <Seo
        title="Search — Book A Sloth"
        description="Search hosts and services, or jump straight to explore, nearby, and your bookings on Book A Sloth."
        robots="noindex"
      />

      <div className="mx-auto w-full max-w-3xl">
        {/* Wordmark */}
        <div className="mb-8 flex items-center justify-center gap-4">
          <img src="/favicon.svg" alt="" className="h-16 w-16" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
          <span className="font-heading text-4xl font-extrabold leading-none tracking-tight text-primary sm:text-5xl">
            BOOK A<br />SLOTH
          </span>
        </div>

        {/* Search bar */}
        <form onSubmit={submit} className="relative">
          <div className="flex items-center gap-3 rounded-full border-2 border-ink/10 bg-surface px-5 py-3 shadow-sm transition focus-within:border-primary/40 focus-within:shadow-md">
            <SearchIcon className="h-5 w-5 shrink-0 text-muted" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search Book A Sloth"
              aria-label="Search Book A Sloth"
              className="min-w-0 flex-1 bg-transparent text-base text-ink outline-none placeholder:text-muted"
            />
            <button type="button" aria-label="Voice search" className="hidden shrink-0 rounded-full p-1.5 text-muted hover:bg-sand hover:text-ink sm:block">
              <Mic className="h-5 w-5" />
            </button>
            <button type="button" aria-label="Visual search" className="hidden shrink-0 rounded-full p-1.5 text-muted hover:bg-sand hover:text-ink sm:block">
              <ScanLine className="h-5 w-5" />
            </button>
            <span className="hidden h-6 w-px shrink-0 bg-ink/10 sm:block" />
            <button
              type="submit"
              className="flex shrink-0 items-center gap-1.5 rounded-full border-2 border-ink/10 px-3 py-1.5 text-sm font-semibold text-ink hover:border-primary/40 hover:text-primary"
            >
              <Sparkles className="h-4 w-4 text-primary" />
              AI Search
            </button>
          </div>
        </form>

        {/* Shortcut tiles */}
        <div className="mt-10 flex flex-wrap items-start justify-center gap-x-6 gap-y-6 sm:gap-x-10">
          {SHORTCUTS.map(({ icon: Icon, label, to }) => (
            <Link key={label} to={to} className="group flex w-20 flex-col items-center gap-2 text-center">
              <span className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-ink/10 bg-surface text-ink transition group-hover:border-primary/40 group-hover:text-primary">
                <Icon className="h-6 w-6" />
              </span>
              <span className="text-xs font-medium text-ink">{label}</span>
            </Link>
          ))}
        </div>

        {/* Continue where you left off */}
        <div className="mt-10 rounded-xl border-2 border-ink/10 bg-surface p-4 sm:p-5">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-heading text-base font-semibold text-ink">Continue where you left off</h2>
            <button type="button" aria-label="More options" className="rounded-full p-1 text-muted hover:bg-sand hover:text-ink">
              <MoreVertical className="h-5 w-5" />
            </button>
          </div>

          <Link
            to="/explore"
            className="flex items-center gap-4 rounded-lg border-2 border-ink/10 p-3 transition hover:border-primary/40 hover:bg-sand/50"
          >
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-primary-light text-primary">
              <User className="h-6 w-6" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-semibold text-ink">
                {RECENT.host} <span className="text-muted">· {RECENT.service}</span>
              </span>
              <span className="block text-xs text-muted">Last viewed {RECENT.when}</span>
            </span>
            <ChevronRight className="h-5 w-5 shrink-0 text-muted" />
          </Link>

          <Link to="/explore" className="mt-3 inline-block text-sm font-semibold text-primary hover:underline">
            See more
          </Link>
        </div>
      </div>
    </div>
  );
}
