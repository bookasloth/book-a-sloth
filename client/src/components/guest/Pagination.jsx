/**
 * Pagination.jsx — numbered pager for Explore. Max 8 pages (96-cap ÷ 12), so we
 * render every page number, no ellipsis. Uses <Link> (crawlable) with hrefs that
 * preserve q + filters; rel="prev"/"next" on the arrows; scrolls to top on change.
 *
 * Props: page, totalPages, hrefFor(pageNum) => string
 */
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const cellBase =
  'w-9 h-9 flex items-center justify-center font-bold text-sm border-2 border-[#1E1E1E] rounded-[4px] transition-shadow';

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
        className={`${cellBase} bg-white ${page === 1
          ? 'opacity-40 pointer-events-none'
          : 'shadow-[2px_2px_0_#1E1E1E] hover:shadow-[3px_3px_0_#1E1E1E]'}`}
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
            ? 'bg-[#FE5100] text-white shadow-[2px_2px_0_#1E1E1E]'
            : 'bg-white text-[#1E1E1E] shadow-[2px_2px_0_#1E1E1E] hover:shadow-[3px_3px_0_#1E1E1E]'}`}
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
        className={`${cellBase} bg-white ${page === totalPages
          ? 'opacity-40 pointer-events-none'
          : 'shadow-[2px_2px_0_#1E1E1E] hover:shadow-[3px_3px_0_#1E1E1E]'}`}
      >
        <ChevronRight size={16} />
      </Link>
    </nav>
  );
}
