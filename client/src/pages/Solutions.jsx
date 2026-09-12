// /solutions — hub page that lists every profession landing page (/for/*).
// Its job is twofold: give visitors a single "who is this for" directory, and
// put crawlable internal links to each /for/:profession page in static HTML so
// they aren't orphaned in the SEO audit. Data-driven from professionLandingData
// so a new profession page shows up here automatically.
import { Link } from 'react-router-dom';
import Seo from '../components/common/Seo';
import { ogCard } from '../config/ogImages';
import { SITE_URL, collectionPageJsonLd, breadcrumbJsonLd } from '../utils/seo';
import PROFESSION_LANDING from './for/professionLandingData';

const TITLE = 'Solutions by Profession | Book A Sloth';
const DESCRIPTION =
  'Appointment booking software tailored to your profession — lawyers, doctors, salons, consultants, freelancers, tutors, photographers and more. Find the page built for how you work.';

// The doctors-india entry spreads `doctors`, so it shares its label. Give it a
// distinct display name here so the two cards read differently.
const LABELS = { 'doctors-india': 'Doctors in India' };

const PROFESSIONS = Object.values(PROFESSION_LANDING).map((p) => ({
  slug: p.slug,
  label: LABELS[p.slug] || p.label,
  blurb: (p.hero && p.hero.eyebrow) || p.socialProof || '',
  Icon: p.icon,
}));

export default function Solutions() {
  const items = PROFESSIONS.map((p) => ({ name: p.label, url: `/for/${p.slug}` }));

  return (
    <div className="app-container py-12">
      <Seo
        title={TITLE}
        description={DESCRIPTION}
        image={ogCard('services')}
        canonical={`${SITE_URL}/solutions`}
        jsonLd={[
          collectionPageJsonLd({ name: TITLE, description: DESCRIPTION, url: '/solutions', items }),
          breadcrumbJsonLd({ items: [{ name: 'Home', path: '/' }, { name: 'Solutions', path: '/solutions' }] }),
        ]}
      />

      <header className="max-w-2xl">
        <h1 className="font-heading text-[2.1rem] font-extrabold leading-[1.12] tracking-tight text-[#1E1E1E] xl:text-[2.7rem]">
          A booking page built for your profession
        </h1>
        <p className="mt-4 text-[#64748b]">
          Book A Sloth adapts to how you actually work. Pick your profession to see the features,
          pricing and language made for you — every page takes bookings, collects payment upfront
          and cuts no-shows.
        </p>
      </header>

      <section className="mt-10">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {PROFESSIONS.map(({ slug, label, blurb, Icon }) => (
            <Link
              key={slug}
              to={`/for/${slug}`}
              className="flex items-start gap-4 bg-white border-2 border-[#1E1E1E] rounded-[6px] p-5
                         shadow-[4px_4px_0_#1E1E1E] transition-transform duration-150 hover:-translate-y-1 hover:no-underline"
            >
              {Icon ? <Icon size={22} className="mt-0.5 shrink-0 text-[#1E1E1E]" aria-hidden="true" /> : null}
              <span>
                <span className="block font-heading font-bold text-[#1E1E1E]">{label}</span>
                <span className="mt-1 block text-sm text-[#64748b]">{blurb}</span>
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* Cross-links to the other discovery hubs so this page isn't a dead end. */}
      <p className="mt-10 text-sm text-[#64748b]">
        Comparing tools instead?{' '}
        <Link to="/compare" className="font-semibold text-[#1E1E1E] underline underline-offset-2">
          See how Book A Sloth stacks up
        </Link>{' '}
        against Calendly, Acuity, Setmore and more — or{' '}
        <Link to="/services" className="font-semibold text-[#1E1E1E] underline underline-offset-2">
          browse services by profession
        </Link>.
      </p>
    </div>
  );
}
