/**
 * Pagination.jsx — "Slooooth" doodle pager for Explore, à la Google's
 * "Goooogle". The word spells sloth with one 'o' per page (max 8, so it stays a
 * word, no ellipsis). Each 'o' is a crawlable <Link> to its page; the current
 * page's 'o' lights up in a palette colour, the rest stay greyscale. S/l/t/h are
 * decoration. Arrows carry rel="prev"/"next" and scroll to top on change.
 *
 * Props: page, totalPages, hrefFor(pageNum) => string
 */
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';

// Founder palette (photo), black/white excluded. Cycled by page, so with the
// 8-page cap each colour lands once or twice — a full 10 pages would use each
// exactly twice.
const PAGE_COLORS = ['#FE5100', '#FF4D93', '#4AB765', '#FFCC1C', '#269CEF'];
const colorFor = (p) => PAGE_COLORS[(p - 1) % PAGE_COLORS.length];

const wordBase = 'font-heading text-4xl font-extrabold tracking-tight sm:text-5xl';
const arrowBase =
  'flex h-9 w-9 items-center justify-center rounded-lg transition-colors duration-150';

export default function Pagination({ page, totalPages, hrefFor }) {
  if (!totalPages || totalPages <= 1) return null;
  const toTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });
  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);

  return (
    <nav className="flex items-center justify-center gap-2 mt-10" aria-label="Pagination">
      <Link
        to={hrefFor(Math.max(1, page - 1))}
        rel="prev"
        aria-label="Previous page"
        aria-disabled={page === 1}
        onClick={(e) => (page === 1 ? e.preventDefault() : toTop())}
        className={`${arrowBase} ${page === 1
          ? 'pointer-events-none text-gray-300'
          : 'text-gray-600 hover:bg-black/[0.04] hover:text-ink'}`}
      >
        <ChevronLeft size={18} />
      </Link>

      {/* Sl-oooo…-th. The o's are the page links; the rest is just the word. */}
      <span className={`${wordBase} select-none flex items-baseline`}>
        <span className="text-gray-300" aria-hidden="true">Sl</span>
        {pages.map((p) => (
          <Link
            key={p}
            to={hrefFor(p)}
            aria-label={`Page ${p}`}
            aria-current={p === page ? 'page' : undefined}
            onClick={toTop}
            style={p === page ? { color: colorFor(p) } : undefined}
            className={`transition-colors duration-150 ${p === page
              ? ''
              : 'text-gray-300 hover:text-gray-500'}`}
          >
            o
          </Link>
        ))}
        <span className="text-gray-300" aria-hidden="true">th</span>
      </span>

      <Link
        to={hrefFor(Math.min(totalPages, page + 1))}
        rel="next"
        aria-label="Next page"
        aria-disabled={page === totalPages}
        onClick={(e) => (page === totalPages ? e.preventDefault() : toTop())}
        className={`${arrowBase} ${page === totalPages
          ? 'pointer-events-none text-gray-300'
          : 'text-gray-600 hover:bg-black/[0.04] hover:text-ink'}`}
      >
        <ChevronRight size={18} />
      </Link>
    </nav>
  );
}
