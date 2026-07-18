import { useParams, Link, Navigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import Seo from '../components/common/Seo';
import { ogCard } from '../config/ogImages';
import { SITE_URL } from '../utils/seo';
import Markdown from '../components/common/Markdown';
import { getHelpDoc } from '../content/helpDocs';

/**
 * /help/docs/:slug — a single help article, rendered from docs/help/<slug>.md.
 * Unknown slugs redirect to the help index (only known slugs are prerendered).
 */

const HelpDoc = () => {
  const { slug } = useParams();
  const doc = getHelpDoc(slug);
  if (!doc) return <Navigate to="/help/docs" replace />;

  const canonical = `${SITE_URL}/help/docs/${doc.slug}`;
  const articleJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: doc.title,
    description: doc.excerpt || undefined,
    url: canonical,
    publisher: { '@type': 'Organization', name: 'Book A Sloth' },
    mainEntityOfPage: canonical,
  };

  return (
    <div className="min-h-screen" style={{ background: '#f7f5ef' }}>
      <Seo
        title={`${doc.title} — Help — Book A Sloth`}
        description={doc.excerpt || `${doc.title} — Book A Sloth help.`}
        image={ogCard('help')}
        canonical={canonical}
        jsonLd={articleJsonLd}
      />
      <div className="app-container py-8 sm:py-12 max-w-3xl">
        <nav className="flex items-center gap-1.5 text-sm text-gray-500 mb-5">
          <Link to="/help/docs" className="inline-flex items-center gap-1.5 hover:text-gray-700">
            <ArrowLeft size={15} /> All help articles
          </Link>
        </nav>

        <article className="bg-white border rounded-2xl p-6 sm:p-8">
          <Markdown source={doc.body} />
        </article>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-500">
            Still stuck?{' '}
            <Link to="/help" className="font-semibold text-[#FE5100] hover:underline">Contact support</Link>
            {' '}or{' '}
            <Link to="/help/docs" className="font-semibold text-[#FE5100] hover:underline">browse all articles</Link>.
          </p>
        </div>
      </div>
    </div>
  );
};

export default HelpDoc;
