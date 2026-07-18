import { Link } from 'react-router-dom';
import { ChevronRight, ArrowLeft } from 'lucide-react';
import Seo from '../components/common/Seo';
import { ogCard } from '../config/ogImages';
import { SITE_URL } from '../utils/seo';
import { helpGroups } from '../content/helpDocs';

/**
 * /help/docs — the help-center index. Lists every article (docs/help/*.md)
 * grouped by audience. Static: content is bundled at build time.
 */

const GROUP_BLURB = {
  Guests: 'Booking, sign-in, payments, and managing your bookings.',
  Hosts: 'Setting up, getting paid, plans, and growing your page.',
  General: 'About Book A Sloth, pricing, trust, and reaching us.',
};

const HelpDocs = () => {
  const groups = helpGroups();
  return (
    <div className="min-h-screen" style={{ background: '#f7f5ef' }}>
      <Seo
        title="Help Articles — Book A Sloth"
        description="Guides and answers for booking, sign-in, payments, hosting, plans, and payouts on Book A Sloth."
        image={ogCard('help')}
        canonical={`${SITE_URL}/help/docs`}
      />
      <div className="app-container py-8 sm:py-12 max-w-3xl">
        <Link to="/help" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-4">
          <ArrowLeft size={15} /> Help &amp; Support
        </Link>
        <h1 className="text-2xl sm:text-3xl font-bold mb-2">Help articles</h1>
        <p className="text-sm text-gray-500 mb-8">
          Answers to common questions, for guests booking a service and hosts running their page.
        </p>

        {groups.map(({ category, docs }) => (
          <section key={category} className="mb-9">
            <h2 className="text-lg font-bold mb-1">{category}</h2>
            <p className="text-sm text-gray-500 mb-3">{GROUP_BLURB[category]}</p>
            <div className="space-y-2">
              {docs.map((doc) => (
                <Link
                  key={doc.slug}
                  to={`/help/docs/${doc.slug}`}
                  className="flex items-start gap-3 bg-white border rounded-2xl p-4 hover:shadow-md transition-shadow hover:no-underline group"
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-gray-900 group-hover:text-[#FE5100]">{doc.title}</p>
                    {doc.excerpt && <p className="text-sm text-gray-500 mt-0.5 line-clamp-2">{doc.excerpt}</p>}
                  </div>
                  <ChevronRight size={18} className="text-gray-300 mt-0.5 flex-shrink-0 group-hover:text-[#FE5100]" />
                </Link>
              ))}
            </div>
          </section>
        ))}

        <div className="bg-white border rounded-2xl p-5 text-center">
          <p className="font-semibold text-gray-900">Didn&apos;t find your answer?</p>
          <p className="text-sm text-gray-500 mt-1 mb-3">Ask Bolt, our assistant, or reach our team.</p>
          <Link to="/help" className="inline-flex text-sm font-semibold text-[#FE5100] hover:underline">
            Contact support
          </Link>
        </div>
      </div>
    </div>
  );
};

export default HelpDocs;
