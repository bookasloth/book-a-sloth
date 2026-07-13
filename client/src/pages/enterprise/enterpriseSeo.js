import { FAQ } from './enterpriseData';
import { SITE_URL, organizationJsonLd, faqJsonLd, breadcrumbJsonLd } from '../../utils/seo';

const URL = `${SITE_URL}/enterprise`;

export const ENT_SEO = {
  title: 'Enterprise Appointment Booking App | Book A Sloth Enterprise',
  description: 'Book A Sloth Enterprise is an appointment booking app for organizations — configurable calendars, multiple locations, role-based access, payments, and integrations, built around your workflow.',
  canonical: URL,
  keywords: 'appointment booking app, enterprise appointment booking app, enterprise scheduling software, appointment booking software, multi-location booking software, franchise scheduling software, business scheduling platform',
  ogTitle: 'Enterprise Appointment Booking App — Book A Sloth Enterprise',
  ogDescription: 'Booking infrastructure for organizations with multiple teams, locations, and workflows.',
};

// utils/seo.js has no SoftwareApplication builder yet and Enterprise is the
// only page that needs this @type, so it's kept local rather than added to
// the shared file. ponytail: promote to utils/seo.js if a second page needs it.
const softwareApplicationJsonLd = () => ({
  '@type': 'SoftwareApplication',
  name: 'Book A Sloth Enterprise',
  applicationCategory: 'BusinessApplication',
  operatingSystem: 'Web',
  url: URL,
  description: ENT_SEO.description,
  // No aggregateRating/review — do not fabricate.
});

// organizationJsonLd/faqJsonLd/breadcrumbJsonLd each return a full
// {'@context', '@type', ...} document; strip '@context' before nesting
// multiple nodes under one shared '@graph'.
const stripContext = ({ '@context': _ctx, ...rest }) => rest;

export function buildEnterpriseJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@graph': [
      stripContext(organizationJsonLd({ siteUrl: SITE_URL })),
      softwareApplicationJsonLd(),
      stripContext(faqJsonLd({ faqs: FAQ })),
      stripContext(breadcrumbJsonLd({
        siteUrl: SITE_URL,
        items: [
          { name: 'Home', path: '/' },
          { name: 'Enterprise', path: '/enterprise' },
        ],
      })),
    ],
  };
}
