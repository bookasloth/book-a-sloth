import { Link } from 'react-router-dom';
import useDocumentMeta from '../../hooks/useDocumentMeta';

/**
 * Shared chrome for the legal pages (/terms, /privacy, /refund). Keeps the three
 * documents visually consistent and cross-linked. Content lives in each page.
 * Source of truth for the text: /legal/*.md (kept in sync on updates).
 */

export const Section = ({ title, children }) => (
  <section className="mb-7 last:mb-0">
    <h2 className="text-[15px] font-semibold mb-2 text-ink">{title}</h2>
    <div className="text-sm text-gray-600 leading-relaxed space-y-2.5">{children}</div>
  </section>
);

const POLICIES = [
  { to: '/terms',   label: 'Terms & Conditions' },
  { to: '/privacy', label: 'Privacy Policy' },
  { to: '/refund',  label: 'Refund & Cancellation' },
];

export default function LegalLayout({ title, updated = '20 June 2026', current, intro, children }) {
  useDocumentMeta({ title: `${title} | Book A Sloth` });

  return (
    <div className="min-h-screen" style={{ background: "#f7f5ef" }}>
    <div className="app-container py-8 sm:py-12">
      <div className="mx-auto max-w-2xl">
        <h1 className="text-2xl sm:text-3xl font-bold mb-1 text-ink">{title}</h1>
        <p className="text-xs text-gray-400 mb-6">Last updated: {updated} &middot; Effective: {updated}</p>

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
