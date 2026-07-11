/**
 * Explore.jsx — Public Explore page. Lists ranked SERVICES.
 * Route: /explore  |  /explore?category=yoga  |  /explore?q=therapist&page=2
 *
 * Ranking is a precomputed per-service quality score (0–100) × search relevance,
 * served by GET /api/explore. URL state (q, category, service, page) is the source
 * of truth so every view is a shareable, crawlable link.
 */
import { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Search, X, Sparkles } from 'lucide-react';
import ServiceCard from '../components/guest/ServiceCard';
import Pagination from '../components/guest/Pagination';
import CategoryFilter from '../components/guest/CategoryFilter';
import Seo from '../components/common/Seo';
import { SITE_URL } from '../utils/seo';
import { getExploreServices, getExploreCategories } from '../services/api';

// Launch flag: flip true to show the placeholder instead of the live page.
const COMING_SOON = false;
const PAGE_SIZE = 12;

function ExploreFull() {
  const [searchParams, setSearchParams] = useSearchParams();

  // URL is the source of truth.
  const q        = searchParams.get('q') || '';
  const category = searchParams.get('category') || '';
  const service  = searchParams.get('service') || '';
  const page     = Math.max(1, Math.min(8, parseInt(searchParams.get('page'), 10) || 1));

  const [inputVal,   setInputVal]   = useState(q);
  const [categories, setCategories] = useState([]);
  const [services,   setServices]   = useState([]);
  const [meta,       setMeta]       = useState({ total: 0, totalPages: 0, page: 1 });
  const [fetching,   setFetching]   = useState(false);

  const reqRef   = useRef(0);
  const abortRef = useRef(null);

  // Merge params, dropping empties; page 1 is implicit (omitted for clean URLs).
  const updateParams = useCallback((patch) => {
    const next = { q, category, service, page: String(page), ...patch };
    const sp = {};
    if (next.q)        sp.q = next.q;
    if (next.category) sp.category = next.category;
    if (next.service)  sp.service = next.service;
    if (next.page && String(next.page) !== '1') sp.page = String(next.page);
    setSearchParams(sp, { replace: true });
  }, [q, category, service, page, setSearchParams]);

  // Keep the box in sync when q changes from elsewhere (back button, clear pill).
  useEffect(() => { setInputVal(q); }, [q]);

  // Debounced search: 400ms, client min 3 chars (server enforces min 2); '' clears.
  useEffect(() => {
    const t = setTimeout(() => {
      const v = inputVal.trim();
      const nextQ = v.length >= 3 ? v : '';
      if (nextQ !== q) updateParams({ q: nextQ, page: '1' });
    }, 400);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inputVal]);

  // Categories (once).
  useEffect(() => {
    getExploreCategories().then(res => setCategories(res.data.categories || [])).catch(() => {});
  }, []);

  // Fetch services. AbortController cancels the in-flight request when inputs change;
  // a monotonic reqId guards against a slow, superseded response overwriting fresh data.
  useEffect(() => {
    const reqId = ++reqRef.current;
    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setFetching(true);
    getExploreServices({ q, category, service, page, limit: PAGE_SIZE }, { signal: controller.signal })
      .then(res => {
        if (reqId !== reqRef.current) return;
        setServices(res.data.services || []);
        setMeta(res.data.meta || { total: 0, totalPages: 0, page });
      })
      .catch(err => {
        if (err?.name === 'CanceledError' || err?.code === 'ERR_CANCELED') return; // superseded
        if (reqId !== reqRef.current) return;
        setServices([]);
        setMeta({ total: 0, totalPages: 0, page: 1 });
      })
      .finally(() => { if (reqId === reqRef.current) setFetching(false); });
  }, [q, category, service, page]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    const v = inputVal.trim();
    updateParams({ q: v.length >= 3 ? v : '', page: '1' });
  };
  const clearSearch  = () => { setInputVal(''); updateParams({ q: '', page: '1' }); };
  const handleCategory = (slug) => updateParams({ category: slug, service: '', page: '1' });

  // Crawlable hrefs preserving q + filters.
  const hrefFor = (p) => {
    const sp = new URLSearchParams();
    if (q) sp.set('q', q);
    if (category) sp.set('category', category);
    if (service) sp.set('service', service);
    if (p > 1) sp.set('page', String(p));
    const s = sp.toString();
    return s ? `/explore?${s}` : '/explore';
  };

  const headingText = q
    ? `Results for "${q}"`
    : category
    ? `${categories.find(c => c.slug === category)?.label || category} services`
    : 'Explore all services';

  const firstLoad = fetching && services.length === 0;

  return (
    <div className="min-h-screen bg-[#FFF8EE]">
      <Seo
        title="Explore Services — Book A Sloth"
        description="Discover and book 1:1 services from coaches, consultants, therapists and creators on Book A Sloth. Search by skill or browse by category."
        canonical={`${SITE_URL}/explore`}
      />

      {/* Thin top progress bar while (re)fetching. */}
      {fetching && (
        <div className="fixed top-0 left-0 right-0 h-0.5 bg-[#FE5100]/30 z-50 overflow-hidden">
          <div className="h-full w-1/3 bg-[#FE5100] animate-[explore-bar_1s_ease-in-out_infinite]" />
        </div>
      )}

      {/* HERO / SEARCH */}
      <div className="bg-[#1E1E1E] border-b-4 border-[#1E1E1E]">
        <div className="max-w-5xl mx-auto px-4 py-12 text-center">
          <h1 className="text-3xl md:text-5xl font-black text-white mb-2 leading-tight tracking-tight">
            Find Your Perfect Sloth
          </h1>
          <p className="text-[#FFF8EE]/70 text-base mb-8">
            Book 1:1 services with coaches, therapists, mentors &amp; more
          </p>
          <form onSubmit={handleSearchSubmit} className="relative max-w-xl mx-auto">
            <div className="flex border-2 border-[#FE5100] rounded-[6px] overflow-hidden shadow-[4px_4px_0_#FE5100]">
              <input
                value={inputVal}
                onChange={e => setInputVal(e.target.value)}
                placeholder="Search services by skill or topic..."
                aria-label="Search services"
                className="flex-1 px-4 py-3 bg-white text-[#1E1E1E] text-[15px] font-medium outline-none placeholder:text-[#64748b]"
              />
              {inputVal && (
                <button type="button" onClick={clearSearch}
                  className="px-3 bg-white text-[#64748b] hover:text-[#1E1E1E]" aria-label="Clear search">
                  <X size={16} />
                </button>
              )}
              <button type="submit"
                className="px-5 bg-[#FE5100] text-white font-bold text-sm hover:bg-[#e04800] transition-colors">
                <Search size={18} />
              </button>
            </div>
          </form>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">
        <CategoryFilter categories={categories} selected={category} onChange={handleCategory} />

        {/* Toolbar */}
        <div>
          <h2 className="text-xl font-black text-[#1E1E1E]">{headingText}</h2>
          <p className="text-sm text-[#64748b] mt-0.5">
            {fetching && services.length === 0 ? 'Searching…' : `${meta.total} service${meta.total === 1 ? '' : 's'} found`}
          </p>
        </div>

        {/* Active filter pills */}
        {(q || category || service) && (
          <div className="flex flex-wrap gap-2">
            {q && (
              <FilterPill label={<>Search: <strong>{q}</strong></>} onClear={clearSearch} />
            )}
            {category && (
              <FilterPill
                label={categories.find(c => c.slug === category)?.label || category}
                onClear={() => updateParams({ category: '', service: '', page: '1' })}
              />
            )}
            {service && (
              <FilterPill label={service.replace(/-/g, ' ')} onClear={() => updateParams({ service: '', page: '1' })} />
            )}
          </div>
        )}

        {/* Grid / skeleton / empty */}
        {firstLoad ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {Array.from({ length: PAGE_SIZE }).map((_, i) => (
              <div key={i} className="border-2 border-[#E5E5E5] rounded-[6px] bg-white overflow-hidden animate-pulse">
                <div className="aspect-[4/3] bg-[#F1F1F1] border-b-2 border-[#E5E5E5]" />
                <div className="p-3.5 space-y-2">
                  <div className="h-3 w-16 bg-[#F1F1F1] rounded" />
                  <div className="h-4 w-full bg-[#F1F1F1] rounded" />
                  <div className="h-4 w-2/3 bg-[#F1F1F1] rounded" />
                  <div className="h-3 w-1/2 bg-[#F1F1F1] rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : services.length === 0 ? (
          <div className="text-center py-20 border-2 border-dashed border-[#E5E5E5] rounded-[6px] bg-white">
            <div className="text-5xl mb-4">🦥</div>
            <p className="text-lg font-bold text-[#1E1E1E]">No services found</p>
            <p className="text-sm text-[#64748b] mt-1">
              {q ? 'Try a different search' : 'Try a different category'} or clear your filters.
            </p>
            {(q || category || service) && (
              <button
                onClick={() => setSearchParams({}, { replace: true })}
                className="btn mt-4 px-4 py-2 bg-[#FE5100] text-white font-bold border-2 border-[#1E1E1E]
                           shadow-[2px_2px_0_#1E1E1E] hover:shadow-[3px_3px_0_#1E1E1E]">
                Clear filters
              </button>
            )}
            {categories.length > 0 && (
              <div className="flex flex-wrap justify-center gap-2 mt-6">
                {categories.slice(0, 6).map(c => (
                  <button key={c.slug} onClick={() => handleCategory(c.slug)}
                    className="text-sm bg-white border-2 border-[#1E1E1E] rounded-[4px] px-3 py-1 font-medium
                               shadow-[2px_2px_0_#1E1E1E] hover:shadow-[3px_3px_0_#1E1E1E]">
                    {c.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : (
          // Keep previous results rendered while a new page loads (dim only).
          <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 transition-opacity
                          ${fetching ? 'opacity-60' : 'opacity-100'}`}>
            {services.map((s, idx) => (
              <ServiceCard key={s.id || idx} service={s} rank={(page - 1) * PAGE_SIZE + idx + 1} />
            ))}
          </div>
        )}

        <Pagination page={page} totalPages={meta.totalPages} hrefFor={hrefFor} />

        {/* BE A SLOTH CTA */}
        <section className="border-2 border-[#1E1E1E] rounded-[6px] bg-white shadow-[4px_4px_0_#1E1E1E]
                            p-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div>
            <p className="text-xl font-black text-[#1E1E1E]">You could be on this page 🦥</p>
            <p className="text-sm text-[#64748b] mt-1">Join coaches, mentors &amp; experts on Book A Sloth</p>
          </div>
          <Link to="/be-a-sloth"
            className="btn shrink-0 px-6 py-3 bg-[#FE5100] text-white font-black text-sm border-2 border-[#1E1E1E]
                       shadow-[4px_4px_0_#1E1E1E] hover:shadow-[6px_6px_0_#1E1E1E] transition-shadow whitespace-nowrap">
            Become a Sloth →
          </Link>
        </section>
      </div>

      <style>{`@keyframes explore-bar{0%{transform:translateX(-100%)}100%{transform:translateX(400%)}}`}</style>
    </div>
  );
}

function FilterPill({ label, onClear }) {
  return (
    <span className="flex items-center gap-1 text-sm bg-white border-2 border-[#1E1E1E]
                     rounded-[4px] px-3 py-1 font-medium shadow-[2px_2px_0_#1E1E1E]">
      {label}
      <button onClick={onClear} className="ml-1 text-[#64748b] hover:text-[#FE5100]" aria-label="Remove filter">
        <X size={13} />
      </button>
    </span>
  );
}

function ExploreComingSoon() {
  return (
    <div className="min-h-screen bg-[#FFF8EE] flex items-center justify-center px-4 py-16">
      <Seo
        title="Explore Services — Book A Sloth"
        description="Discover and book 1:1 services from coaches, consultants, therapists and creators on Book A Sloth."
        canonical={`${SITE_URL}/explore`}
      />
      <div className="max-w-lg w-full text-center">
        <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide
                         bg-amber-400 text-[#1E1E1E] border-2 border-[#1E1E1E] rounded-[4px] px-3 py-1
                         shadow-[2px_2px_0_#1E1E1E] mb-6">
          <Sparkles size={13} /> Coming Soon
        </span>
        <div className="text-6xl mb-5" aria-hidden="true">🦥</div>
        <h1 className="text-3xl md:text-4xl font-black text-[#1E1E1E] leading-tight tracking-tight mb-3">
          Explore is on its way
        </h1>
        <p className="text-[15px] text-[#64748b] leading-relaxed mb-8">
          A place to discover coaches, mentors, therapists &amp; experts — search by skill and book instantly.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link to="/categories"
            className="btn w-full sm:w-auto px-6 py-3 bg-[#FE5100] text-white font-black text-sm
                       border-2 border-[#1E1E1E] shadow-[4px_4px_0_#1E1E1E]
                       hover:shadow-[6px_6px_0_#1E1E1E] transition-shadow whitespace-nowrap">
            Browse Categories
          </Link>
          <Link to="/be-a-sloth"
            className="btn btn--outline w-full sm:w-auto px-6 py-3 bg-white text-[#1E1E1E] font-black text-sm
                       border-2 border-[#1E1E1E] shadow-[4px_4px_0_#1E1E1E]
                       hover:shadow-[6px_6px_0_#1E1E1E] transition-shadow whitespace-nowrap">
            Become a Sloth →
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function Explore() {
  return COMING_SOON ? <ExploreComingSoon /> : <ExploreFull />;
}
