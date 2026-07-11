/**
 * exploreController.js
 * Public Explore page API — foundation stubs.
 * Each handler returns shaped mock data now; replace SELECT * with
 * real Supabase queries once the v2.9 migration is applied.
 */
const { supabase, supabaseAdmin } = require('../config/supabase');
const responseCache = require('../services/responseCache');
const { setPublicCache } = require('../utils/httpCache');
const { sanitizeLikeTerm } = require('../utils/searchSanitize');

// Read-through cache TTL for the public listing (matches host/service pages).
const EXPLORE_CACHE_MS = 120 * 1000;

// ── helpers ───────────────────────────────────────────────────
const now = () => new Date().toISOString();

const schemaMissing = (err) => err && /Could not find the|column .* does not exist/i.test(err.message || '');

// ── GET /api/explore ──────────────────────────────────────────
// Minimal real listing: verified hosts, profession (category) + service filters.
// `service` REQUIRES `category`: service slugs are only unique per profession
// (v3.60 pair model), so a slug-only filter could leak across professions.
async function listVendors(req, res) {
  try {
    const category = String(req.query.category || '').trim();
    const service  = String(req.query.service  || '').trim();
    // Sanitize with the shared util (strips PostgREST or()/ilike metachars), then
    // ignore terms under 2 chars: a 1-char `%a%` matches almost everything, which
    // is pure DB load for a useless result. Under 2 chars → no text filter.
    const cleanQ   = sanitizeLikeTerm(String(req.query.q || '').trim());
    const q        = cleanQ.length >= 2 ? cleanQ : '';
    const page     = Math.max(1, parseInt(req.query.page, 10)  || 1);
    const limit    = Math.min(48, Math.max(1, parseInt(req.query.limit, 10) || 12));

    if (service && !category) {
      return res.status(400).json({ message: 'service filter requires a category (profession)' });
    }

    // Read-through cache (120s) keyed by the full filter+page combo. Public,
    // anonymous, no per-user data → safe to share. This collapses repeat browse/
    // search hits (crawlers, retries, popular queries) onto one DB read per window
    // and shields Supabase during a traffic spike. Fail-open: a cache outage just
    // runs the query uncached. TTL is the staleness backstop (a host edit shows
    // within ~2 min); no explicit bust wiring needed.
    const cacheKey = `explore:v1:${category}|${service}|${q}|${page}|${limit}`;
    const payload = await responseCache.getOrSet(cacheKey, EXPLORE_CACHE_MS, async () => {
      const runQuery = (withPairCol) => {
        const svcCols = withPairCol
          ? 'price, rating, total_reviews, category, primary_category, is_active'
          : 'price, rating, total_reviews, category, is_active';
        let sel = supabaseAdmin
          .from('profiles')
          .select(`id, name, username, tagline, profile_image, primary_category, services!inner(${svcCols})`, { count: 'exact' })
          .eq('role', 'host')
          .eq('is_verified', true)
          .eq('is_banned', false)
          .not('username', 'is', null)
          .eq('services.is_active', true);
        if (category) sel = sel.eq('primary_category', category);
        if (service) {
          sel = sel.eq('services.category', service);
          if (withPairCol) sel = sel.eq('services.primary_category', category);
        }
        if (q) {
          sel = sel.or(`name.ilike.%${q}%,tagline.ilike.%${q}%`);
        }
        return sel
          .order('updated_at', { ascending: false })
          .range((page - 1) * limit, page * limit - 1);
      };

      let r = await runQuery(true);
      if (schemaMissing(r.error)) r = await runQuery(false); // pre-v3.60
      if (r.error) throw r.error; // thrown → not cached; outer catch returns 500

      const vendors = (r.data || []).map((p) => {
        const svcs = p.services || [];
        const rated = svcs.filter((s) => (s.total_reviews || 0) > 0);
        return {
          id: p.id,
          name: p.name,
          username: p.username,
          tagline: p.tagline || '',
          profileImage: p.profile_image || null,
          category: p.primary_category || '',
          avgRating: rated.length
            ? Number((rated.reduce((a, s) => a + Number(s.rating || 0), 0) / rated.length).toFixed(1))
            : null,
          reviewCount: svcs.reduce((a, s) => a + (s.total_reviews || 0), 0),
          minPrice: svcs.length ? Math.min(...svcs.map((s) => Number(s.price) || 0)) : null,
          currency: 'INR',
          isFeatured: false, isSponsored: false, isBoosted: false,
          isVerified: true, // listing already filters is_verified=true
        };
      });

      const total = r.count || 0;
      return {
        vendors,
        meta: { page, limit, total, hasMore: page * limit < total },
        filters: { category, service, q },
      };
    });

    setPublicCache(res, 120);
    return res.json(payload);
  } catch (err) {
    console.error('[explore.listVendors]', err);
    return res.status(500).json({ message: 'Failed to load hosts' });
  }
}

// ── GET /api/explore/featured ─────────────────────────────────
// Returns up to 5 active featured slot vendors.
async function getFeatured(req, res) {
  try {
    // TODO: query explore_featured_slots WHERE is_active = true AND ends_at > now()
    // JOIN profiles to get vendor details
    return res.json({ featured: [] });
  } catch (err) {
    console.error('[explore.getFeatured]', err);
    return res.status(500).json({ message: 'Failed to load featured hosts' });
  }
}

// ── GET /api/explore/categories ───────────────────────────────
// Returns active categories with vendor counts.
// supabaseAdmin (not the anon client): anon table grants were revoked in v3.27,
// so the anon client silently returns an empty rail on this public read.
async function getCategories(req, res) {
  try {
    const { data, error } = await supabaseAdmin
      .from('categories')
      .select('id, label, slug, icon_url')
      .eq('status', 'active')
      .order('label', { ascending: true });

    if (error) throw error;
    return res.json({ categories: data || [] });
  } catch (err) {
    console.error('[explore.getCategories]', err);
    return res.status(500).json({ message: 'Failed to load categories' });
  }
}

// ── GET /api/explore/collections ──────────────────────────────
// Returns active collections with their vendors.
async function getCollections(req, res) {
  try {
    // TODO: query explore_collections + explore_collection_vendors
    // JOIN profiles for vendor details
    return res.json({ collections: [] });
  } catch (err) {
    console.error('[explore.getCollections]', err);
    return res.status(500).json({ message: 'Failed to load collections' });
  }
}

// ── GET /api/explore/sponsored ────────────────────────────────
// Returns vendors sponsored for a given keyword/category (for search results).
async function getSponsored(req, res) {
  try {
    const { keyword = '' } = req.query;
    // TODO: query explore_sponsored_keywords WHERE keyword = ? AND is_active = true
    // ORDER BY bid_amount DESC LIMIT 3
    return res.json({ sponsored: [], keyword });
  } catch (err) {
    console.error('[explore.getSponsored]', err);
    return res.status(500).json({ message: 'Failed to load sponsored hosts' });
  }
}

// ── ADMIN: GET /api/admin/explore/featured ────────────────────
async function adminListFeatured(req, res) {
  try {
    const { data, error } = await supabase
      .from('explore_featured_slots')
      .select('*, profiles(name, username, profile_image)')
      .order('slot_position');
    if (error) throw error;
    return res.json({ slots: data || [] });
  } catch (err) {
    console.error('[explore.adminListFeatured]', err);
    return res.status(500).json({ message: 'Failed to load featured slots' });
  }
}

async function adminCreateFeatured(req, res) {
  try {
    const { vendor_id, slot_position, starts_at, ends_at, price_paid, payment_ref, notes } = req.body;
    const { data, error } = await supabase
      .from('explore_featured_slots')
      .insert({ vendor_id, slot_position, starts_at, ends_at, price_paid, payment_ref, notes, is_active: true })
      .select()
      .single();
    if (error) throw error;
    return res.status(201).json({ slot: data });
  } catch (err) {
    console.error('[explore.adminCreateFeatured]', err);
    return res.status(500).json({ message: 'Failed to create featured slot' });
  }
}

async function adminUpdateFeatured(req, res) {
  try {
    const { id } = req.params;
    const { data, error } = await supabase
      .from('explore_featured_slots')
      .update({ ...req.body, updated_at: now() })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return res.json({ slot: data });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to update featured slot' });
  }
}

async function adminDeleteFeatured(req, res) {
  try {
    const { id } = req.params;
    await supabase.from('explore_featured_slots').update({ is_active: false }).eq('id', id);
    return res.json({ success: true });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to remove featured slot' });
  }
}

// ── ADMIN: Collections ────────────────────────────────────────
async function adminListCollections(req, res) {
  try {
    const { data, error } = await supabase
      .from('explore_collections')
      .select('*, explore_collection_vendors(vendor_id, sort_order, profiles(name, username, profile_image))')
      .order('sort_order');
    if (error) throw error;
    return res.json({ collections: data || [] });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to load collections' });
  }
}

async function adminCreateCollection(req, res) {
  try {
    const { title, subtitle, slug, icon_emoji, sort_order, is_paid } = req.body;
    const { data, error } = await supabase
      .from('explore_collections')
      .insert({ title, subtitle, slug, icon_emoji, sort_order, is_paid, is_active: true })
      .select().single();
    if (error) throw error;
    return res.status(201).json({ collection: data });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to create collection' });
  }
}

async function adminUpdateCollection(req, res) {
  try {
    const { id } = req.params;
    const { data, error } = await supabase
      .from('explore_collections')
      .update({ ...req.body, updated_at: now() })
      .eq('id', id).select().single();
    if (error) throw error;
    return res.json({ collection: data });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to update collection' });
  }
}

async function adminAddToCollection(req, res) {
  try {
    const { id } = req.params;
    const { vendor_id, sort_order } = req.body;
    const { data, error } = await supabase
      .from('explore_collection_vendors')
      .upsert({ collection_id: id, vendor_id, sort_order })
      .select().single();
    if (error) throw error;
    return res.status(201).json({ entry: data });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to add host to collection' });
  }
}

async function adminRemoveFromCollection(req, res) {
  try {
    const { id, vendorId } = req.params;
    await supabase.from('explore_collection_vendors')
      .delete().eq('collection_id', id).eq('vendor_id', vendorId);
    return res.json({ success: true });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to remove host from collection' });
  }
}

// ── ADMIN: Boosts ─────────────────────────────────────────────
async function adminListBoosts(req, res) {
  try {
    const { data, error } = await supabase
      .from('explore_boosts')
      .select('*, profiles(name, username, profile_image)')
      .eq('is_active', true)
      .order('ends_at');
    if (error) throw error;
    return res.json({ boosts: data || [] });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to load boosts' });
  }
}

async function adminCreateBoost(req, res) {
  try {
    const { vendor_id, boost_type, starts_at, ends_at, price_paid, payment_ref } = req.body;
    const multiplier = boost_type === 'premium' ? 2.5 : 1.5;
    const { data, error } = await supabase
      .from('explore_boosts')
      .insert({ vendor_id, boost_type, multiplier, starts_at, ends_at, price_paid, payment_ref, is_active: true })
      .select().single();
    if (error) throw error;
    return res.status(201).json({ boost: data });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to create boost' });
  }
}

async function adminRevokeBoost(req, res) {
  try {
    const { id } = req.params;
    await supabase.from('explore_boosts').update({ is_active: false }).eq('id', id);
    return res.json({ success: true });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to revoke boost' });
  }
}

// ── ADMIN: Verified Badges ────────────────────────────────────
async function adminListVerified(req, res) {
  try {
    const { data, error } = await supabase
      .from('explore_verified_badges')
      .select('*, profiles(name, username, profile_image)')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return res.json({ verified: data || [] });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to load verified badges' });
  }
}

async function adminGrantVerified(req, res) {
  try {
    const { vendor_id, expires_at, price_paid, payment_ref } = req.body;
    const { data, error } = await supabase
      .from('explore_verified_badges')
      .upsert({ vendor_id, verified_at: now(), expires_at, price_paid, payment_ref, is_active: true })
      .select().single();
    if (error) throw error;
    return res.status(201).json({ badge: data });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to grant verified badge' });
  }
}

async function adminRevokeVerified(req, res) {
  try {
    const { id } = req.params;
    await supabase.from('explore_verified_badges').update({ is_active: false }).eq('id', id);
    return res.json({ success: true });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to revoke badge' });
  }
}

// ── ADMIN: Sponsored Keywords ─────────────────────────────────
async function adminListKeywords(req, res) {
  try {
    const { data, error } = await supabase
      .from('explore_sponsored_keywords')
      .select('*, profiles(name, username, profile_image)')
      .order('bid_amount', { ascending: false });
    if (error) throw error;
    return res.json({ keywords: data || [] });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to load keywords' });
  }
}

async function adminCreateKeyword(req, res) {
  try {
    const { vendor_id, keyword, bid_amount, starts_at, ends_at, payment_ref } = req.body;
    const { data, error } = await supabase
      .from('explore_sponsored_keywords')
      .insert({ vendor_id, keyword, bid_amount, starts_at, ends_at, payment_ref, is_active: true })
      .select().single();
    if (error) throw error;
    return res.status(201).json({ keyword: data });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to create keyword' });
  }
}

async function adminRevokeKeyword(req, res) {
  try {
    const { id } = req.params;
    await supabase.from('explore_sponsored_keywords').update({ is_active: false }).eq('id', id);
    return res.json({ success: true });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to revoke keyword' });
  }
}

module.exports = {
  // Public
  listVendors, getFeatured, getCategories, getCollections, getSponsored,
  // Admin — featured
  adminListFeatured, adminCreateFeatured, adminUpdateFeatured, adminDeleteFeatured,
  // Admin — collections
  adminListCollections, adminCreateCollection, adminUpdateCollection,
  adminAddToCollection, adminRemoveFromCollection,
  // Admin — boosts
  adminListBoosts, adminCreateBoost, adminRevokeBoost,
  // Admin — verified
  adminListVerified, adminGrantVerified, adminRevokeVerified,
  // Admin — keywords
  adminListKeywords, adminCreateKeyword, adminRevokeKeyword,
};
