/**
 * Pagination.jsx — numbered pager for Explore. Max 8 pages (96-cap ÷ 12), so we
 * render every page number, no ellipsis. Uses <Link> (crawlable) with hrefs that
 * preserve q + filters; rel="prev"/"next" on the arrows; scrolls to top on change.
 *
 * Props: page, totalPages, hrefFor(pageNum) => string
 */
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';

// Flat, matching /blog's pager: current page is an ink fill, the rest are quiet
// until hovered. Explore-only — the admin pages have their own Pagination.
const cellBase =
  'flex h-9 w-9 items-center justify-center rounded-lg text-sm font-semibold transition-colors duration-150';

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
        className={`${cellBase} ${page === 1
          ? 'pointer-events-none text-gray-300'
          : 'text-gray-600 hover:bg-black/[0.04] hover:text-ink'}`}
      >
        <ChevronLeft size={16} />
      </Link>

      {pages.map((p) => (
        <Link
          key={p}
          to={hrefFor(p)}
          aria-current={p === page ? 'page' : undefined}
          onClick={toTop}
          className={`${cellBase} ${p === page
            ? 'bg-ink text-white'
            : 'text-gray-600 hover:bg-black/[0.04] hover:text-ink'}`}
        >
          {p}
        </Link>
      ))}

      <Link
        to={hrefFor(Math.min(totalPages, page + 1))}
        rel="next"
        aria-label="Next page"
        aria-disabled={page === totalPages}
        onClick={(e) => (page === totalPages ? e.preventDefault() : toTop())}
        className={`${cellBase} ${page === totalPages
          ? 'pointer-events-none text-gray-300'
          : 'text-gray-600 hover:bg-black/[0.04] hover:text-ink'}`}
      >
        <ChevronRight size={16} />
      </Link>
    </nav>
  );
}
