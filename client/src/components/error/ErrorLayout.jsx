// ErrorLayout — the single visual shell every branded error / offline page uses.
//
// No header, no footer (it calls useHideChrome to drop the global chrome), one
// centred card, one primary CTA, calm fade-in, dark-mode aware, keyboard
// accessible. SEO is locked to noindex/nofollow with no canonical. The page-
// specific bits (eyebrow, title, copy, art, CTA) come in as props from the
// catalog via ErrorPage, so adding a new error never touches this file.
import Seo from '../common/Seo';
import ErrorIllustration from './ErrorIllustration';
import { useHideChrome } from '../../context/ChromeContext';
import '../../styles/error-pages.css';

export default function ErrorLayout({
  eyebrow,
  title,
  message,
  art,
  image,
  primaryLabel,
  onPrimary,
  seoTitle,
  children,
}) {
  useHideChrome();

  return (
    <main className="bas-error min-h-screen flex items-center justify-center px-5 py-12 bg-[#faf9f6] text-[#1a1a1a] dark:bg-[#0f1115] dark:text-gray-100">
      {/* Error pages must never be indexed and carry no canonical. */}
      <Seo title={seoTitle} robots="noindex, nofollow, noarchive" />

      <div className="bas-error__card w-full max-w-md text-center rounded-md bg-white dark:bg-[#171a21] border border-black/5 dark:border-white/10 shadow-[0_12px_44px_-16px_rgba(20,20,20,0.25)] px-7 py-10 sm:px-10 sm:py-12">
        {/* Brand mark — quiet, not a nav. */}
        <a
          href="/"
          aria-label="Book a Sloth — home"
          className="inline-flex items-center gap-2 mb-7 text-[#1a1a1a] dark:text-gray-100"
        >
          <img src="/favicon.svg" alt="" width="28" height="28" className="h-7 w-7" />
          <span className="font-heading font-semibold text-[15px] tracking-tight">Book a Sloth</span>
        </a>

        <div className="flex justify-center mb-5 text-[#1a1a1a] dark:text-gray-100">
          <ErrorIllustration art={art} image={image} />
        </div>

        {eyebrow && (
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#fe5100] mb-3">
            {eyebrow}
          </p>
        )}

        {/* Explicit colours: a global `h1 { color: var(--text) }` (base-fb.css)
            isn't theme-aware and would force the title dark-on-dark. */}
        <h1 className="font-heading text-2xl sm:text-[28px] font-semibold leading-snug mb-3 text-[#1a1a1a] dark:text-white">
          {title}
        </h1>

        <p className="text-[15px] leading-relaxed text-gray-500 dark:text-gray-400 mb-8 max-w-sm mx-auto">
          {message}
        </p>

        {/* Optional slot (e.g. offline live-status line). */}
        {children}

        {primaryLabel && (
          <button
            type="button"
            onClick={onPrimary}
            className="inline-flex items-center justify-center w-full sm:w-auto px-7 py-3 rounded-md bg-[#fe5100] hover:bg-[#d94400] active:bg-[#c23d00] text-white font-medium text-[15px] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#fe5100] focus-visible:ring-offset-2 dark:focus-visible:ring-offset-[#171a21]"
          >
            {primaryLabel}
          </button>
        )}

        {/* Single quiet secondary link — support, not a competing CTA. */}
        <p className="mt-6 text-[13px] text-gray-400 dark:text-gray-500">
          Need a hand?{' '}
          <a
            href="/help"
            className="text-gray-500 dark:text-gray-400 underline underline-offset-2 hover:text-[#fe5100] dark:hover:text-[#fe5100] focus:outline-none focus-visible:text-[#fe5100]"
          >
            Contact support
          </a>
        </p>
      </div>
    </main>
  );
}
