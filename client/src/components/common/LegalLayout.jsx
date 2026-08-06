import { Link } from 'react-router-dom';
import useDocumentMeta from '../../hooks/useDocumentMeta';
import Seo from './Seo';
import { SITE_URL } from '../../utils/seo';
import { ogCard } from '../../config/ogImages';

/**
 * Shared chrome for the legal pages (/terms, /privacy, /refund). Keeps the three
 * documents visually consistent and cross-linked. The canonical text lives inline
 * in each page component (Terms.jsx, Privacy.jsx, Refund.jsx).
 */

// Future effective date for the commercial legal set (/guest-terms, /refund, /terms,
// host pair). They describe how the platform will operate once the model ships, NOT how
// it behaves today — a legal page that contradicts the running product is worse than
// none. Change this ONE constant to the real go-live date once the model is live.
//
// ⚠️ The current copy still reflects the ABANDONED merchant-of-record model. It is being
// reverted to the marketplace/intermediary model (v4) — see
// docs/legal-marketplace-revert-brief.md. The name stays MOR_EFFECTIVE until the copy is
// rewritten (rename → MARKETPLACE_EFFECTIVE then; ripples to GuestTerms/Refund imports).
export const MOR_EFFECTIVE = '1 September 2026';

export const Section = ({ title, children }) => (
  <section className="mb-7 last:mb-0">
    <h2 className="text-[15px] font-semibold mb-2 text-ink">{title}</h2>
    <div className="text-sm text-gray-600 leading-relaxed space-y-2.5">{children}</div>
  </section>
);

const POLICIES = [
  { to: '/terms',           label: 'Terms of Use' },
  { to: '/privacy',         label: 'Privacy Policy' },
  { to: '/guest-terms',     label: 'Guest Terms of Sale' },
  { to: '/refund',          label: 'Refund & Cancellation' },
  { to: '/host-agreement',  label: 'Host Agreement' },
  { to: '/host-fees',       label: 'Host Fee Schedule' },
];

export default function LegalLayout({
  title,
  updated = '20 June 2026',
  // `effective` defaults to `updated`. The merchant-of-record documents carry a
  // FUTURE effective date on purpose: they describe how the platform will operate
  // once the model ships, and a legal page that contradicts how the product
  // actually behaves today is worse than no page at all.
  effective,
  current,
  intro,
  description,
  children,
}) {
  useDocumentMeta({ title: `${title} | Book A Sloth` });
  const canonical = current ? `${SITE_URL}${current}` : undefined;

  return (
    <div className="min-h-screen" style={{ background: "#f7f5ef" }}>
    <Seo
      title={`${title} | Book A Sloth`}
      description={description || `${title} for Book A Sloth — the online appointment booking and scheduling platform.`}
      canonical={canonical}
      image={current ? ogCard(current.replace(/^\//, '')) : undefined}
    />
    <div className="app-container py-8 sm:py-12">
      <div className="mx-auto max-w-2xl">
        <h1 className="text-2xl sm:text-3xl font-bold mb-1 text-ink">{title}</h1>
        <p className="text-xs text-gray-400 mb-6">Last updated: {updated} &middot; Effective: {effective || updated}</p>

        {/* Cross-links between the three documents */}
        <nav className="flex flex-wrap gap-2 mb-7" aria-label="Legal documents">
          {POLICIES.map((p) => (
            <Link
              key={p.to}
              to={p.to}
              className={`px-3 py-1 rounded-full border text-xs transition-colors hover:no-underline ${
                current === p.to
                  ? 'bg-primary/10 border-primary/30 text-primary font-semibold'
                  : 'border-gray-200 text-gray-500 hover:text-primary hover:border-primary/30'
              }`}
            >
              {p.label}
            </Link>
          ))}
        </nav>

        <div className="page-card p-6 sm:p-8">
          {intro && (
            <div className="text-sm text-gray-600 leading-relaxed space-y-2.5 mb-7 pb-7 border-b border-gray-100">
              {intro}
            </div>
          )}
          {children}
        </div>

        <p className="mt-6 text-center text-xs text-gray-400">
          Operated by Timewheel Internet Private Limited &middot; CIN U62012OD2026PTC052654 &middot; GSTIN 21AAMCT8270C1ZF
        </p>
      </div>
    </div>
    </div>
  );
}
