// /compare — hub page that lists every competitor comparison page (/lp/*).
// Like /solutions, its job is to be a real "how do we compare" directory AND to
// hold crawlable internal links to the /lp/* alternative pages in static HTML so
// they aren't orphaned in the SEO audit. The /lp/* pages hide the global nav, so
// this footer-linked hub is their main crawlable entry point.
import { Link } from 'react-router-dom';
import Seo from '../components/common/Seo';
import { ogCard } from '../config/ogImages';
import { SITE_URL, collectionPageJsonLd, breadcrumbJsonLd } from '../utils/seo';

const TITLE = 'Book A Sloth vs the alternatives | Compare';
const DESCRIPTION =
  'See how Book A Sloth compares to Calendly, Acuity, Setmore, SimplyBook, Zoho Bookings and Topmate — 0% commission, upfront payments and reminders built for India.';

// Each competitor page under /lp/*. Kept as an explicit list (only six, stable)
// rather than parsed from routes — clearer and easy to reorder.
const COMPETITORS = [
  { name: 'Calendly', href: '/lp/calendly-alternative',
    blurb: 'A Calendly alternative that also collects payment upfront and speaks UPI, WhatsApp and GST.' },
  { name: 'Acuity Scheduling', href: '/lp/acuity-alternative',
    blurb: 'Acuity-grade scheduling without the price tag — deposits, reminders and 0% commission.' },
  { name: 'Setmore', href: '/lp/setmore-alternative',
    blurb: 'Everything Setmore does for bookings, plus prepaid slots and India-first payments.' },
  { name: 'SimplyBook.me', href: '/lp/simplybook-alternative',
    blurb: 'A simpler SimplyBook alternative — go live in minutes, keep 100% of every fee.' },
  { name: 'Zoho Bookings', href: '/lp/zoho-bookings-alternative',
    blurb: 'Booking + payments without the Zoho suite lock-in, priced from about ₹10 a day.' },
  { name: 'Topmate', href: '/lp/topmate-vs-bookasloth',
    blurb: 'Sell 1:1s, webinars and bundles like Topmate — with 0% commission on what you earn.' },
];

export default function Compare() {
  const items = COMPETITORS.map((c) => ({ name: `Book A Sloth vs ${c.name}`, url: c.href }));

  return (
    <div className="app-container py-12">
      <Seo
        title={TITLE}
        description={DESCRIPTION}
        image={ogCard('services')}
        canonical={`${SITE_URL}/compare`}
        jsonLd={[
          collectionPageJsonLd({ name: TITLE, description: DESCRIPTION, url: '/compare', items }),
          breadcrumbJsonLd({ items: [{ name: 'Home', path: '/' }, { name: 'Compare', path: '/compare' }] }),
        ]}
      />

      <header className="max-w-2xl">
        <h1 className="font-heading text-[2.1rem] font-extrabold leading-[1.12] tracking-tight text-[#1E1E1E] xl:text-[2.7rem]">
          How Book A Sloth compares
        </h1>
        <p className="mt-4 text-[#64748b]">
          Weighing up your options? Here’s an honest look at how Book A Sloth stacks up against the
          popular booking tools — 0% commission on paid plans, payments collected upfront, and
          reminders and invoicing built for how India books.
        </p>
      </header>

      <section className="mt-10">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {COMPETITORS.map(({ name, href, blurb }) => (
            <Link
              key={href}
              to={href}
              className="block bg-white border-2 border-[#1E1E1E] rounded-[6px] p-5
                         shadow-[4px_4px_0_#1E1E1E] transition-transform duration-150 hover:-translate-y-1 hover:no-underline"
            >
              <span className="block font-heading font-bold text-[#1E1E1E]">
                Book A Sloth vs {name}
              </span>
              <span className="mt-1 block text-sm text-[#64748b]">{blurb}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* Cross-links so this hub isn't a dead end. */}
      <p className="mt-10 text-sm text-[#64748b]">
        Not sure which fits your work?{' '}
        <Link to="/solutions" className="font-semibold text-[#1E1E1E] underline underline-offset-2">
          Find the page built for your profession
        </Link>{' '}
        or{' '}
        <Link to="/pricing" className="font-semibold text-[#1E1E1E] underline underline-offset-2">
          see pricing
        </Link>.
      </p>
    </div>
  );
}
