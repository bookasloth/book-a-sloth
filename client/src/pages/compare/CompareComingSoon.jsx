// Placeholder for the parked /compare/<slug> pages. Every competitor flagged
// `comingSoon` in data/competitors.js (all but Topmate today) routes here instead
// of a full comparison. noindex so crawlers don't index an empty page; canonical
// points at the live /compare hub. No comparison/FAQ schema — there's nothing to
// back it yet. Keeps the global nav/footer (unlike the bespoke comparison pages).
import { Link, useLocation } from 'react-router-dom';
import { ArrowRight, Clock } from 'lucide-react';
import Seo from '../../components/common/Seo';
import { SITE_URL } from '../../utils/seo';
import { COMPETITOR_LIST } from '../../data/competitors';

export default function CompareComingSoon() {
  const { pathname } = useLocation();
  const competitor = COMPETITOR_LIST.find((c) => c.path === pathname);
  const name = competitor?.name || 'this tool';

  return (
    <main className="bg-canvas">
      <Seo
        title={`Book A Sloth vs ${name} — comparison coming soon`}
        description={`Our in-depth Book A Sloth vs ${name} comparison is on the way. In the meantime, see how we compare on pricing, UPI and WhatsApp reminders.`}
        canonical={`${SITE_URL}/compare`}
        robots="noindex, follow"
      />
      <section className="px-5 py-24 sm:px-8 lg:py-32">
        <div className="mx-auto max-w-3xl text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-black/5 bg-sand px-4 py-1.5 text-xs font-semibold text-neutral-600">
            <Clock size={14} aria-hidden /> Coming soon
          </span>
          <h1 className="mt-6 font-heading text-4xl font-extrabold leading-[1.1] tracking-tight text-ink sm:text-5xl">
            Book A Sloth vs <span className="text-primary-cta">{name}</span>
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-neutral-600 sm:text-lg">
            This comparison is on the way. While we finish it, see how Book A Sloth
            stacks up overall — free plan, UPI at booking, and WhatsApp reminders,
            priced in rupees.
          </p>
          <div className="mt-9 flex flex-wrap justify-center gap-3">
            <Link
              to="/compare"
              className="inline-flex items-center gap-1.5 rounded-[6px] bg-ink px-6 py-3 text-sm font-semibold text-white shadow-[0_8px_30px_rgba(26,26,26,0.12)] hover:no-underline hover:opacity-90"
            >
              See all comparisons <ArrowRight size={15} aria-hidden />
            </Link>
            <Link
              to="/be-a-sloth"
              className="rounded-[6px] border border-black/10 bg-white px-6 py-3 text-sm font-semibold text-ink hover:no-underline hover:opacity-90"
            >
              Start free
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
