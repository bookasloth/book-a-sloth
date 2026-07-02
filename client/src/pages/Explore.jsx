/**
 * Explore.jsx — Public Explore page
 * Route: /explore  |  /explore?category=yoga  |  /explore?q=therapist
 *
 * Revenue touchpoints built in:
 *   ① Featured row      — paid featured slots (top 5)
 *   ② Sponsored slots   — every 5th card is a paid "Ad" slot
 *   ③ Sponsored search  — keyword-bid results appear at top when searching
 *   ④ Collections rows  — curated / paid collections
 *   ⑤ Plan gating       — only paid-plan vendors appear (UI shows upgrade nudge)
 *   ⑥ Verified badge    — shown on card if vendor paid for it
 *   ⑦ Boost badge       — "Trending" shown for boosted vendors
 */
import { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Search, SlidersHorizontal, X, ChevronLeft, ChevronRight, Sparkles, Zap } from 'lucide-react';
import VendorCard from '../components/guest/VendorCard';
import CategoryFilter from '../components/guest/CategoryFilter';
import Seo from '../components/common/Seo';
import { SITE_URL } from '../utils/seo';
import {
  getExploreVendors,
  getExploreFeatured,
  getExploreCategories,
  getExploreCollections,
  getExploreSponsored,
} from '../services/api';

// ── Launch flag ───────────────────────────────────────────────
// Explore (discovery + paid placement) launches later. While this is true,
// /explore renders <ExploreComingSoon />; the full page (ExploreFull) below is
// kept intact and structurally identical so launch = flip COMING_SOON → false.
const COMING_SOON = true;

// ── Mock data (shown while real API is wired up) ──────────────
const MOCK_CATEGORIES = [
  { id: '1', label: 'Fitness', slug: 'fitness' },
  { id: '2', label: 'Therapy', slug: 'therapy' },
  { id: '3', label: 'Business', slug: 'business' },
  { id: '4', label: 'Design', slug: 'design' },
  { id: '5', label: 'Music', slug: 'music' },
  { id: '6', label: 'Career', slug: 'career' },
  { id: '7', label: 'Finance', slug: 'finance' },
  { id: '8', label: 'Language', slug: 'language' },
];

const MOCK_FEATURED = [
  { id: 'f1', name: 'Ananya Sharma', username: 'ananya', tagline: 'Life & career coach helping you find your why', category: 'Career', avgRating: 4.9, reviewCount: 128, minPrice: 999, currency: 'INR', isFeatured: true, isVerified: true },
  { id: 'f2', name: 'Rahul Fitness', username: 'rahul-fit', tagline: 'Online strength & conditioning — results in 90 days', category: 'Fitness', avgRating: 4.8, reviewCount: 87, minPrice: 699, currency: 'INR', isFeatured: true },
  { id: 'f3', name: 'Dr. Priya Nair', username: 'drpriya', tagline: 'Therapist specialising in anxiety & burnout', category: 'Therapy', avgRating: 5.0, reviewCount: 210, minPrice: 1499, currency: 'INR', isFeatured: true, isVerified: true },
  { id: 'f4', name: 'Vikram Iyer', username: 'vikramiyer', tagline: 'Startup advisor & product strategy', category: 'Business', avgRating: 4.7, reviewCount: 54, minPrice: 2499, currency: 'INR', isFeatured: true },
];

const MOCK_VENDORS = Array.from({ length: 24 }, (_, i) => ({
  id: `v${i}`,
  name: ['Sana Khan', 'Dev Malhotra', 'Tara Singh', 'Arjun Rao', 'Meera Joshi', 'Ria Sharma'][i % 6],
  username: `vendor-${i}`,
  tagline: ['Math tutor for competitive exams', 'UI/UX design mentor', 'Career counselling for freshers', 'Agency founder & growth advisor', 'Freelance designer', 'Content & personal branding coach'][i % 6],
  category: MOCK_CATEGORIES[i % MOCK_CATEGORIES.length].label,
  avgRating: (4 + Math.random()).toFixed(1) * 1,
  reviewCount: Math.floor(Math.random() * 200) + 5,
  minPrice: [499, 799, 999, 1499, 1999, 2499][i % 6],
  currency: 'INR',
  isFeatured: false,
  isSponsored: i % 5 === 4,   // every 5th card is a sponsored slot
  isVerified: i % 4 === 0,
  isBoosted: i % 7 === 0,
}));

const MOCK_COLLECTIONS = [
  {
    id: 'c1', title: 'Top Picks', subtitle: 'Hand-curated by the Book A Sloth team', icon_emoji: '🏆',
    vendors: MOCK_VENDORS.slice(0, 4),
  },
  {
    id: 'c2', title: 'Under ₹500', subtitle: 'Great sessions that won\'t break the bank', icon_emoji: '💸',
    vendors: MOCK_VENDORS.filter(v => v.minPrice <= 499).slice(0, 4),
  },
];

const SORT_OPTIONS = [
  { value: 'recommended', label: 'Recommended' },
  { value: 'rating',      label: 'Top Rated' },
  { value: 'newest',      label: 'Newest' },
  { value: 'price_asc',   label: 'Price: Low → High' },
  { value: 'price_desc',  label: 'Price: High → Low' },
];

const PAGE_SIZE = 12;

function ExploreFull() {
  const [searchParams, setSearchParams] = useSearchParams();

  // ── State ─────────────────────────────────────────────────
  const [query,      setQuery]      = useState(searchParams.get('q') || '');
  const [inputVal,   setInputVal]   = useState(searchParams.get('q') || '');
  const [category,   setCategory]   = useState(searchParams.get('category') || '');
  const [sort,       setSort]       = useState('recommended');
  const [page,       setPage]       = useState(1);
  const [showFilter, setShowFilter] = useState(false);

  const [categories,   setCategories]   = useState(MOCK_CATEGORIES);
  const [featured,     setFeatured]     = useState(MOCK_FEATURED);
  const [vendors,      setVendors]      = useState(MOCK_VENDORS);
  const [collections,  setCollections]  = useState(MOCK_COLLECTIONS);
  const [sponsored,    setSponsored]    = useState([]);
  const [loading,      setLoading]      = useState(false);
  const [totalVendors, setTotalVendors] = useState(MOCK_VENDORS.length);

  const searchRef = useRef(null);
  const vendorsReqRef = useRef(0);

  // ── Sync URL params ───────────────────────────────────────
  useEffect(() => {
    const params = {};
    if (query)    params.q        = query;
    if (category) params.category = category;
    setSearchParams(params, { replace: true });
  }, [query, category]);

  // ── Load data (swap mock → real when API ready) ───────────
  const loadVendors = useCallback(async () => {
    const reqId = ++vendorsReqRef.current;
    setLoading(true);
    try {
      // Uncomment when backend is live:
      // const res = await getExploreVendors({ q: query, category, sort, page, limit: PAGE_SIZE });
      // if (reqId !== vendorsReqRef.current) return; // stale response — a newer request took over
      // setVendors(res.data.vendors);
      // setTotalVendors(res.data.meta.total);

      // Filter mock data client-side for now
      let filtered = [...MOCK_VENDORS];
      if (query)    filtered = filtered.filter(v => v.name.toLowerCase().includes(query.toLowerCase()) || v.tagline.toLowerCase().includes(query.toLowerCase()));
      if (category) filtered = filtered.filter(v => v.category.toLowerCase() === category.toLowerCase());
      if (sort === 'price_asc')  filtered.sort((a, b) => a.minPrice - b.minPrice);
      if (sort === 'price_desc') filtered.sort((a, b) => b.minPrice - a.minPrice);
      if (sort === 'rating')     filtered.sort((a, b) => b.avgRating - a.avgRating);
      if (reqId !== vendorsReqRef.current) return; // stale response — a newer request took over
      setTotalVendors(filtered.length);
      setVendors(filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE));
    } catch {
      if (reqId !== vendorsReqRef.current) return;
      setVendors([]);
      setTotalVendors(0);
    } finally {
      if (reqId === vendorsReqRef.current) setLoading(false);
    }
  }, [query, category, sort, page]);

  useEffect(() => { loadVendors(); }, [loadVendors]);

  // ── Handlers ──────────────────────────────────────────────
  const handleSearch = (e) => {
    e.preventDefault();
    setQuery(inputVal.trim());
    setPage(1);
  };

  const handleCategory = (slug) => {
    setCategory(slug);
    setPage(1);
  };

  const totalPages = Math.ceil(totalVendors / PAGE_SIZE);

  // ── SEO heading ───────────────────────────────────────────
  const headingText = query
    ? `Results for "${query}"`
    : category
    ? `${categories.find(c => c.slug === category)?.label || category} Sloths`
    : 'Explore All Sloths';

  return (
    <div className="min-h-screen bg-[#FFF8EE]">
      <Seo
        title="Explore Hosts & Services — Book A Sloth"
        description="Discover coaches, consultants, therapists, and creators taking bookings on Book A Sloth. Browse services and book instantly."
        canonical={`${SITE_URL}/explore`}
      />

      {/* ═══ HERO / SEARCH ═══════════════════════════════════ */}
      <div className="bg-[#1E1E1E] border-b-4 border-[#1E1E1E]">
        <div className="max-w-5xl mx-auto px-4 py-12 text-center">
          <h1 className="text-3xl md:text-5xl font-black text-white mb-2 leading-tight tracking-tight">
            Find Your Perfect Sloth
          </h1>
          <p className="text-[#FFF8EE]/70 text-base mb-8">
            Book 1:1 sessions with coaches, therapists, mentors & more
          </p>

          {/* Search bar */}
          <form onSubmit={handleSearch} className="relative max-w-xl mx-auto">
            <div className="flex border-2 border-[#FE5100] rounded-[6px] overflow-hidden shadow-[4px_4px_0_#FE5100]">
              <input
                ref={searchRef}
                value={inputVal}
                onChange={e => setInputVal(e.target.value)}
                placeholder="Search by name, skill, or topic..."
                className="flex-1 px-4 py-3 bg-white text-[#1E1E1E] text-[15px] font-medium outline-none placeholder:text-[#64748b]"
              />
              {inputVal && (
                <button type="button" onClick={() => { setInputVal(''); setQuery(''); setPage(1); }}
                  className="px-3 bg-white text-[#64748b] hover:text-[#1E1E1E]">
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

      <div className="max-w-5xl mx-auto px-4 py-8 space-y-10">

        {/* ═══ CATEGORY FILTER ════════════════════════════════ */}
        <CategoryFilter
          categories={categories}
          selected={category}
          onChange={handleCategory}
        />

        {/* ═══ FEATURED ROW ════════════════════════════════════
            Revenue: vendors paid for these 5 slots            */}
        {featured.length > 0 && !query && (
          <section>
            <div className="flex items-center gap-2 mb-4">
              <span className="text-lg font-black text-[#1E1E1E]">⭐ Featured Sloths</span>
              <span className="text-xs font-semibold bg-[#FE5100] text-white px-2 py-0.5 rounded-[4px]">
                Premium
              </span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {featured.map(v => <VendorCard key={v.id} vendor={v} />)}
            </div>
          </section>
        )}

        {/* ═══ COLLECTIONS ROWS ════════════════════════════════
            Revenue: paid editorial placements                 */}
        {collections.length > 0 && !query && !category && (
          <div className="space-y-8">
            {collections.map(col => (
              <section key={col.id}>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <span className="text-lg font-black text-[#1E1E1E]">
                      {col.icon_emoji} {col.title}
                    </span>
                    {col.subtitle && (
                      <p className="text-sm text-[#64748b] mt-0.5">{col.subtitle}</p>
                    )}
                  </div>
                  <Link to={`/explore?collection=${col.id}`}
                    className="text-sm font-bold text-[#FE5100] hover:underline">
                    See all →
                  </Link>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {col.vendors.map(v => <VendorCard key={v.id} vendor={v} />)}
                </div>
              </section>
            ))}
          </div>
        )}

        {/* ═══ MAIN VENDOR GRID ════════════════════════════════ */}
        <section>
          {/* Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
            <div>
              <h2 className="text-xl font-black text-[#1E1E1E]">{headingText}</h2>
              <p className="text-sm text-[#64748b] mt-0.5">{totalVendors} sloths found</p>
            </div>

            <div className="flex items-center gap-2">
              {/* Sort */}
              <select
                value={sort}
                onChange={e => { setSort(e.target.value); setPage(1); }}
                className="border-2 border-[#1E1E1E] rounded-[4px] px-3 py-1.5 text-sm font-semibold
                           bg-white text-[#1E1E1E] outline-none shadow-[2px_2px_0_#1E1E1E]"
              >
                {SORT_OPTIONS.map(o => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Active filters pill */}
          {(query || category) && (
            <div className="flex flex-wrap gap-2 mb-4">
              {query && (
                <span className="flex items-center gap-1 text-sm bg-white border-2 border-[#1E1E1E]
                                 rounded-[4px] px-3 py-1 font-medium shadow-[2px_2px_0_#1E1E1E]">
                  Search: <strong>{query}</strong>
                  <button onClick={() => { setQuery(''); setInputVal(''); setPage(1); }}
                    className="ml-1 text-[#64748b] hover:text-[#FE5100]"><X size={13} /></button>
                </span>
              )}
              {category && (
                <span className="flex items-center gap-1 text-sm bg-white border-2 border-[#1E1E1E]
                                 rounded-[4px] px-3 py-1 font-medium shadow-[2px_2px_0_#1E1E1E]">
                  {categories.find(c => c.slug === category)?.label || category}
                  <button onClick={() => { setCategory(''); setPage(1); }}
                    className="ml-1 text-[#64748b] hover:text-[#FE5100]"><X size={13} /></button>
                </span>
              )}
            </div>
          )}

          {/* Grid */}
          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {Array.from({ length: PAGE_SIZE }).map((_, i) => (
                <div key={i} className="h-52 bg-white border-2 border-[#E5E5E5] rounded-[6px] animate-pulse" />
              ))}
            </div>
          ) : vendors.length === 0 ? (
            <div className="text-center py-20 border-2 border-dashed border-[#E5E5E5] rounded-[6px] bg-white">
              <div className="text-5xl mb-4">🦥</div>
              <p className="text-lg font-bold text-[#1E1E1E]">No sloths found</p>
              <p className="text-sm text-[#64748b] mt-1">Try a different search or category</p>
              <button onClick={() => { setQuery(''); setInputVal(''); setCategory(''); setPage(1); }}
                className="btn mt-4 px-4 py-2 bg-[#FE5100] text-white font-bold
                           shadow-[2px_2px_0_#1E1E1E] hover:shadow-[3px_3px_0_#1E1E1E]">
                Clear filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {vendors.map((v, idx) => (
                <VendorCard key={v.id || idx} vendor={v} />
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-8">
              <button
                disabled={page === 1}
                onClick={() => setPage(p => p - 1)}
                className="btn btn--outline w-9 h-9 flex items-center justify-center
                           bg-white font-bold shadow-[2px_2px_0_#1E1E1E] disabled:opacity-40
                           hover:shadow-[3px_3px_0_#1E1E1E] transition-shadow"
              >
                <ChevronLeft size={16} />
              </button>

              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter(p => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
                .reduce((acc, p, idx, arr) => {
                  if (idx > 0 && p - arr[idx - 1] > 1) acc.push('...');
                  acc.push(p);
                  return acc;
                }, [])
                .map((p, i) =>
                  p === '...' ? (
                    <span key={`dot-${i}`} className="px-1 text-[#64748b] font-bold">…</span>
                  ) : (
                    <button
                      key={p}
                      onClick={() => setPage(p)}
                      className={`btn w-9 h-9 flex items-center justify-center
                                  font-bold text-sm transition-all
                                  ${page === p
                                    ? 'bg-[#FE5100] text-white shadow-[2px_2px_0_#1E1E1E]'
                                    : 'btn--outline bg-white text-[#1E1E1E] shadow-[2px_2px_0_#1E1E1E] hover:shadow-[3px_3px_0_#1E1E1E]'
                                  }`}
                    >
                      {p}
                    </button>
                  )
                )}

              <button
                disabled={page === totalPages}
                onClick={() => setPage(p => p + 1)}
                className="btn btn--outline w-9 h-9 flex items-center justify-center
                           bg-white font-bold shadow-[2px_2px_0_#1E1E1E] disabled:opacity-40
                           hover:shadow-[3px_3px_0_#1E1E1E] transition-shadow"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          )}
        </section>

        {/* ═══ BE A SLOTH CTA ═══════════════════════════════════ */}
        <section className="border-2 border-[#1E1E1E] rounded-[6px] bg-white shadow-[4px_4px_0_#1E1E1E]
                            p-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div>
            <p className="text-xl font-black text-[#1E1E1E]">You could be on this page 🦥</p>
            <p className="text-sm text-[#64748b] mt-1">
              Join hundreds of coaches, mentors & experts on Book A Sloth
            </p>
          </div>
          <Link to="/be-a-sloth"
            className="btn shrink-0 px-6 py-3 bg-[#FE5100] text-white font-black text-sm
                       shadow-[4px_4px_0_#1E1E1E]
                       hover:shadow-[6px_6px_0_#1E1E1E] transition-shadow whitespace-nowrap">
            Become a Sloth →
          </Link>
        </section>

      </div>
    </div>
  );
}

// ── Coming Soon screen (shown while COMING_SOON is true) ──────────
// Brand-consistent placeholder. No vendor profiles / listings rendered.
function ExploreComingSoon() {
  return (
    <div className="min-h-screen bg-[#FFF8EE] flex items-center justify-center px-4 py-16">
      <Seo
        title="Explore Hosts & Services — Book A Sloth"
        description="Discover coaches, consultants, therapists, and creators taking bookings on Book A Sloth. Browse services and book instantly."
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
          We&apos;re building a place to discover coaches, mentors, therapists &amp; experts —
          search by skill, browse curated collections, and find your perfect Sloth.
          Not live yet, but worth the wait.
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

// Route entry — flips between the launch placeholder and the full page.
export default function Explore() {
  return COMING_SOON ? <ExploreComingSoon /> : <ExploreFull />;
}
