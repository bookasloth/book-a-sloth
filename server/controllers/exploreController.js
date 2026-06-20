/**
 * exploreController.js
 * Public Explore page API — foundation stubs.
 * Each handler returns shaped mock data now; replace SELECT * with
 * real Supabase queries once the v2.9 migration is applied.
 */
const { supabase } = require('../config/supabase');

// ── helpers ───────────────────────────────────────────────────
const now = () => new Date().toISOString();

// ── GET /api/explore ──────────────────────────────────────────
// Returns paginated vendors. Filters: category, q, sort, price_min, price_max
// Plan-gating: only vendors on paid plans appear (explore_visible = true).
async function listVendors(req, res) {
  try {
    const {
      category = '',
      q        = '',
      sort     = 'recommended',  // recommended | rating | newest | price_asc | price_desc
      price_min,
      price_max,
      page     = 1,
      limit    = 12,
    } = req.query;

    // TODO: replace with real query once v2.9 migration is applied
    // Real query will join profiles + subscription_plans + explore_boosts
    // + explore_verified_badges and filter by is_explore_visible = true

    return res.json({
      vendors: [],
      meta: {
        page: Number(page),
        limit: Number(limit),
        total: 0,
        hasMore: false,
      },
      filters: { category, q, sort, price_min, price_max },
    });
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
async function getCategories(req, res) {
  try {
    const { data, error } = await supabase
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
