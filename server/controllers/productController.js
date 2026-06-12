// Phase 3: Digital Products — CRUD + secure download
const { supabaseAdmin } = require('../config/supabase');
const crypto = require('crypto');

// ── POST /api/products ────────────────────────────────────────
const createProduct = async (req, res) => {
  try {
    const { title, description, type, price, file_url, thumbnail_url } = req.body;
    if (!title || price == null) return res.status(400).json({ message: 'title and price are required' });

    const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

    const { data, error } = await supabaseAdmin.from('products')
      .insert({ host_id: req.user.id, title, description, type: type || 'pdf', price, file_url, thumbnail_url, slug })
      .select().single();

    if (error) return res.status(500).json({ message: error.message });
    res.status(201).json(data);
  } catch (error) { res.status(500).json({ message: error.message }); }
};

// ── GET /api/products/mine ────────────────────────────────────
const getMyProducts = async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin.from('products')
      .select('*').eq('host_id', req.user.id).order('created_at', { ascending: false });
    if (error) return res.status(500).json({ message: error.message });
    res.json(data || []);
  } catch (error) { res.status(500).json({ message: error.message }); }
};

// ── PUT /api/products/:id ─────────────────────────────────────
const updateProduct = async (req, res) => {
  try {
    const { title, description, type, price, file_url, thumbnail_url, is_active } = req.body;
    const updates = { updated_at: new Date().toISOString() };
    if (title !== undefined) updates.title = title;
    if (description !== undefined) updates.description = description;
    if (type !== undefined) updates.type = type;
    if (price !== undefined) updates.price = price;
    if (file_url !== undefined) updates.file_url = file_url;
    if (thumbnail_url !== undefined) updates.thumbnail_url = thumbnail_url;
    if (is_active !== undefined) updates.is_active = is_active;

    const { data, error } = await supabaseAdmin.from('products')
      .update(updates).eq('id', req.params.id).eq('host_id', req.user.id).select().single();
    if (error) return res.status(500).json({ message: error.message });
    res.json(data);
  } catch (error) { res.status(500).json({ message: error.message }); }
};

// ── DELETE /api/products/:id ──────────────────────────────────
const deleteProduct = async (req, res) => {
  try {
    const { error } = await supabaseAdmin.from('products')
      .delete().eq('id', req.params.id).eq('host_id', req.user.id);
    if (error) return res.status(500).json({ message: error.message });
    res.json({ message: 'Product deleted' });
  } catch (error) { res.status(500).json({ message: error.message }); }
};

// ── GET /api/products/host/:username ─────────────────────────
// Public — returns active products for a vendor's profile page
const getHostProducts = async (req, res) => {
  try {
    const { data: host } = await supabaseAdmin
      .from('profiles').select('id').eq('username', req.params.username).single();
    if (!host) return res.status(404).json({ message: 'Host not found' });

    const { data, error } = await supabaseAdmin.from('products')
      .select('id, title, description, type, price, thumbnail_url, slug, purchase_count')
      .eq('host_id', host.id).eq('is_active', true)
      .order('created_at', { ascending: false });
    if (error) return res.status(500).json({ message: error.message });
    res.json(data || []);
  } catch (error) { res.status(500).json({ message: error.message }); }
};

// ── GET /api/products/:id ─────────────────────────────────────
// Public — single product detail
const getProduct = async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin.from('products')
      .select('id, title, description, type, price, thumbnail_url, slug, purchase_count, profiles!products_host_id_fkey(name, username, profile_image, tagline)')
      .eq('id', req.params.id).eq('is_active', true).single();
    if (error || !data) return res.status(404).json({ message: 'Product not found' });
    res.json(data);
  } catch (error) { res.status(500).json({ message: error.message }); }
};

// ── GET /api/products/download/:token ────────────────────────
// Secure file download — validates token, returns file_url, increments download_count
const downloadProduct = async (req, res) => {
  try {
    const { token } = req.params;
    const { data: purchase, error } = await supabaseAdmin
      .from('product_purchases')
      .select('*, products(file_url, title)')
      .eq('download_token', token)
      .single();

    if (error || !purchase) return res.status(404).json({ message: 'Download link not found or expired' });
    if (purchase.payment_status !== 'paid') return res.status(403).json({ message: 'Payment not completed' });
    if (new Date(purchase.download_token_expires_at) < new Date())
      return res.status(410).json({ message: 'Download link has expired. Contact the seller for a new link.' });
    if (purchase.download_count >= 3)
      return res.status(410).json({ message: 'Download limit reached (3 downloads). Contact the seller.' });

    // Increment download count
    await supabaseAdmin.from('product_purchases')
      .update({ download_count: purchase.download_count + 1 }).eq('id', purchase.id);

    const fileUrl = purchase.products?.file_url;
    if (!fileUrl) return res.status(404).json({ message: 'File not found. Contact the seller.' });

    // Return the URL — frontend redirects to it
    res.json({
      file_url: fileUrl,
      title: purchase.products?.title,
      downloads_remaining: 2 - purchase.download_count,
    });
  } catch (error) { res.status(500).json({ message: error.message }); }
};

// ── POST /api/products/free-download ─────────────────────────
// For free products — OTP verified, issue download token
const freeDownload = async (req, res) => {
  try {
    const { product_id, buyer_name, buyer_email, buyer_phone, buyer_id } = req.body;

    const { data: product } = await supabaseAdmin
      .from('products').select('id, price, host_id, file_url').eq('id', product_id).single();

    if (!product) return res.status(404).json({ message: 'Product not found' });
    if (product.price !== 0) return res.status(400).json({ message: 'This product requires payment' });
    if (!product.file_url) return res.status(404).json({ message: 'File not available' });

    const downloadToken = crypto.randomUUID();
    const tokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);

    const { data: purchase } = await supabaseAdmin.from('product_purchases').insert({
      product_id, host_id: product.host_id,
      buyer_id: buyer_id || null, buyer_name, buyer_email, buyer_phone,
      amount_paid: 0, platform_fee: 0, payment_status: 'paid',
      download_token: downloadToken,
      download_token_expires_at: tokenExpires.toISOString(),
    }).select().single();

    res.json({ download_token: downloadToken, purchase });
  } catch (error) { res.status(500).json({ message: error.message }); }
};

module.exports = { createProduct, getMyProducts, updateProduct, deleteProduct, getHostProducts, getProduct, downloadProduct, freeDownload };
