/**
 * Explore.jsx — Public Explore page. Browse SERVICES by category.
 * Route: /explore  |  /explore?category=yoga  |  /explore?category=yoga&page=2
 *
 * Ordering is a precomputed per-service quality score (0–100), served by
 * GET /api/explore. The free-text search box was scrapped — Explore is now a
 * browse-by-category page. URL state (category, service, page) is the source of
 * truth so every view is a shareable, crawlable link.
 */
import { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { X, Sparkles } from 'lucide-react';
import ServiceCard from '../components/guest/ServiceCard';
import Pagination from '../components/guest/Pagination';
import CategoryFilter from '../components/guest/CategoryFilter';
import Seo from '../components/common/Seo';
import { ogCard } from '../config/ogImages';
import { SITE_URL, collectionPageJsonLd, breadcrumbJsonLd } from '../utils/seo';
import { getExploreServices, getExploreCategories } from '../services/api';

// Launch flag: flip true to show the placeholder instead of the live page.
const COMING_SOON = false;
// 9 = three whole rows of the 3-up grid. The card is portrait; 4-up gives slivers.
const PAGE_SIZE = 9;

function ExploreFull() {
  const [searchParams, setSearchParams] = useSearchParams();

  // URL is the source of truth.
  const category = searchParams.get('category') || '';
  const service  = searchParams.get('service') || '';
  // Server caps results at 96 = 8 pages (exploreController.paginate).
  const page     = Math.max(1, Math.min(8, parseInt(searchParams.get('page'), 10) || 1));

  const [categories, setCategories] = useState([]);
  const [services,   setServices]   = useState([]);
  const [meta,       setMeta]       = useState({ total: 0, totalPages: 0, page: 1 });
  const [fetching,   setFetching]   = useState(false);

  const reqRef   = useRef(0);
  const abortRef = useRef(null);

  // Merge params, dropping empties; page 1 is implicit (omitted for clean URLs).
  const updateParams = useCallback((patch) => {
    const next = { category, service, page: String(page), ...patch };
    const sp = {};
    if (next.category) sp.category = next.category;
    if (next.service)  sp.service = next.service;
    if (next.page && String(next.page) !== '1') sp.page = String(next.page);
    setSearchParams(sp, { replace: true });
  }, [category, service, page, setSearchParams]);

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
    getExploreServices({ category, service, page, limit: PAGE_SIZE }, { signal: controller.signal })
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
  }, [category, service, page]);

  const handleCategory = (slug) => updateParams({ category: slug, service: '', page: '1' });

  // Crawlable hrefs preserving filters.
  const hrefFor = (p) => {
    const sp = new URLSearchParams();
    if (category) sp.set('category', category);
    if (service) sp.set('service', service);
    if (p > 1) sp.set('page', String(p));
    const s = sp.toString();
    return s ? `/explore?${s}` : '/explore';
  };

  const headingText = category
    ? `${categories.find(c => c.slug === category)?.label || category} services`
    : 'Explore all services';

  const firstLoad = fetching && services.length === 0;

  // Faceted / paginated Explore views are thin, duplicative variants of the
  // canonical /explore (which they already canonicalize to). Google was indexing
  // them and flagging "soft 404" (the ?category=&service= combos are emitted as
  // crawlable links + ItemList JSON-LD from /services/:profession). noindex any
  // variant with an active param, or an empty result set; keep the bare /explore
  // indexable. `follow` so crawlers still reach the host/service pages the cards link to.
  const noindex = !!(category || service || page > 1) || (!fetching && services.length === 0);

  return (
    <div className="min-h-screen bg-surface">
      <Seo
        title="Explore Services — Book A Sloth"
        description="Discover and book 1:1 services from coaches, consultants, therapists and creators on Book A Sloth. Browse by category."
        image={ogCard('explore')}
        canonical={`${SITE_URL}/explore`}
        robots={noindex ? 'noindex, follow' : undefined}
        jsonLd={[
          collectionPageJsonLd({
            name: 'Explore Services — Book A Sloth',
            description: 'Discover and book 1:1 services from coaches, consultants, therapists and creators on Book A Sloth. Browse by category.',
            url: '/explore',
          }),
          breadcrumbJsonLd({ items: [{ name: 'Home', path: '/' }, { name: 'Explore', path: '/explore' }] }),
        ]}
      />

      {/* Thin top progress bar while (re)fetching. */}
      {fetching && (
        <div className="fixed top-0 left-0 right-0 h-0.5 bg-primary/30 z-50 overflow-hidden">
          <div className="h-full w-1/3 bg-primary animate-[explore-bar_1s_ease-in-out_infinite]" />
        </div>
      )}

      {/* HERO — a browsing page should be quiet so the results are the loud part.
          Same restrained language as /blog: hairline rules, ink on white. */}
      <div className="border-b border-black/5">
        <div className="app-container py-12 text-center sm:py-16">
          <h1 className="font-heading text-3xl font-bold tracking-tight text-ink sm:text-5xl">
            Find Your Perfect Sloth
          </h1>
          <p className="mt-3 text-base text-muted">
            Book 1:1 services with coaches, therapists, mentors &amp; more — browse by category below
          </p>
        </div>
      </div>

      <div className="app-container space-y-8 py-8">
        <CategoryFilter categories={categories} selected={category} onChange={handleCategory} />

        {/* Toolbar */}
        <div>
          <h2 className="font-heading text-xl font-bold tracking-tight text-ink">{headingText}</h2>
          <p className="mt-0.5 text-sm text-muted">
            {fetching && services.length === 0 ? 'Loading…' : `${meta.total} service${meta.total === 1 ? '' : 's'} found`}
          </p>
        </div>

        {/* Active filter pills */}
        {(category || service) && (
          <div className="flex flex-wrap gap-2">
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
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: PAGE_SIZE }).map((_, i) => (
              <div key={i} className="page-card animate-pulse overflow-hidden">
                <div className="aspect-[4/3] bg-black/[0.04]" />
                <div className="space-y-2 p-4">
                  <div className="h-5 w-3/4 rounded bg-black/[0.04]" />
                  <div className="h-3 w-full rounded bg-black/[0.04]" />
                  <div className="h-3 w-2/3 rounded bg-black/[0.04]" />
                  <div className="flex gap-1.5 pt-1">
                    <div className="h-6 w-20 rounded-full bg-black/[0.04]" />
                    <div className="h-6 w-16 rounded-full bg-black/[0.04]" />
                  </div>
                  <div className="flex items-end justify-between pt-3">
                    <div className="h-7 w-20 rounded bg-black/[0.04]" />
                    <div className="h-9 w-28 rounded bg-black/[0.04]" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : services.length === 0 ? (
          <div className="rounded-2xl border border-black/5 bg-[#FFF8EE] px-6 py-16 text-center">
            <div className="mb-4 text-5xl">🦥</div>
            <p className="font-heading text-lg font-bold text-ink">No services found</p>
            <p className="mt-1 text-sm text-muted">
              Try a different category or clear your filters.
            </p>
            {(category || service) && (
              <button
                onClick={() => setSearchParams({}, { replace: true })}
                className="btn mt-5 inline-flex items-center bg-primary-cta px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors duration-150 hover:bg-[#a83400] hover:no-underline">
                Clear filters
              </button>
            )}
            {categories.length > 0 && (
              <div className="mt-6 flex flex-wrap justify-center gap-2">
                {categories.slice(0, 6).map(c => (
                  <button key={c.slug} onClick={() => handleCategory(c.slug)}
                    className="rounded-lg border border-black/10 bg-white px-3 py-1.5 text-sm font-medium text-ink transition-colors hover:bg-black/[0.04]">
                    {c.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : (
          // Keep previous results rendered while a new page loads (dim only).
          <div className={`grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 transition-opacity
                          ${fetching ? 'opacity-60' : 'opacity-100'}`}>
            {services.map((s, idx) => (
              <ServiceCard key={s.id || idx} service={s} rank={(page - 1) * PAGE_SIZE + idx + 1} />
            ))}
          </div>
        )}

        <Pagination page={page} totalPages={meta.totalPages} hrefFor={hrefFor} />

        {/* BE A SLOTH CTA */}
        <section className="flex flex-col items-center justify-between gap-4 rounded-2xl border border-black/5 bg-[#FFF8EE] p-8 md:flex-row">
          <div className="text-center md:text-left">
            <p className="font-heading text-xl font-bold text-ink">You could be on this page 🦥</p>
            <p className="mt-1 text-sm text-muted">Join coaches, mentors &amp; experts on Book A Sloth</p>
          </div>
          <Link to="/be-a-sloth"
            className="btn inline-flex shrink-0 items-center bg-primary-cta px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors duration-150 hover:bg-[#a83400] hover:no-underline">
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
    <span className="flex items-center gap-1 rounded-full border border-black/10 bg-white px-3 py-1 text-sm font-medium text-ink">
      {label}
      <button onClick={onClear} className="ml-1 text-muted transition-colors hover:text-ink" aria-label="Remove filter">
        <X size={13} />
      </button>
    </span>
  );
}

function ExploreComingSoon() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-surface px-4 py-16">
      <Seo
        title="Explore Services — Book A Sloth"
        description="Discover and book 1:1 services from coaches, consultants, therapists and creators on Book A Sloth."
        image={ogCard('explore')}
        canonical={`${SITE_URL}/explore`}
        jsonLd={[
          collectionPageJsonLd({
            name: 'Explore Services — Book A Sloth',
            description: 'Discover and book 1:1 services from coaches, consultants, therapists and creators on Book A Sloth.',
            url: '/explore',
          }),
          breadcrumbJsonLd({ items: [{ name: 'Home', path: '/' }, { name: 'Explore', path: '/explore' }] }),
        ]}
      />
      <div className="w-full max-w-lg text-center">
        <span className="mb-6 inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-amber-800">
          <Sparkles size={13} /> Coming Soon
        </span>
        <div className="mb-5 text-6xl" aria-hidden="true">🦥</div>
        <h1 className="mb-3 font-heading text-3xl font-bold leading-tight tracking-tight text-ink md:text-4xl">
          Explore is on its way
        </h1>
        <p className="mb-8 text-[15px] leading-relaxed text-muted">
          A place to discover coaches, mentors, therapists &amp; experts — browse by category and book instantly.
        </p>
        <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link to="/categories"
            className="btn inline-flex w-full items-center justify-center bg-primary-cta px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors duration-150 hover:bg-[#a83400] hover:no-underline sm:w-auto">
            Browse Categories
          </Link>
          <Link to="/be-a-sloth"
            className="btn btn--outline inline-flex w-full items-center justify-center border border-black/10 bg-white px-5 py-2.5 text-sm font-semibold text-ink transition-colors duration-150 hover:bg-black/[0.04] hover:no-underline sm:w-auto">
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
