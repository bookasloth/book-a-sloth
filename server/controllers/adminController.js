const { supabaseAdmin } = require('../config/supabase');
const { safeError } = require('../utils/httpError');
const { audit } = require('../services/auditService');
const { sanitizeLikeTerm, isUuid } = require('../utils/searchSanitize');

// Coerce + clamp pagination so a client can't request an unbounded page size.
const clampPage = (p) => Math.max(1, parseInt(p, 10) || 1);
const clampLimit = (l, max = 100) => Math.min(max, Math.max(1, parseInt(l, 10) || 20));

// ══════════════════════════════════════
// PLATFORM STATS
// ══════════════════════════════════════

const getStats = async (req, res) => {
  try {
    // M0 fix: the snapshot columns must be SELECTed to be summable. The old code
    // summed b.platform_fee_amount from a query that only selected services(price),
    // so platform revenue always read ₹0. Platform revenue = platform fee + commission
    // collected on paid bookings (GST is a pass-through liability, not revenue).
    let bookingsRes = await supabaseAdmin
      .from('bookings')
      .select('id, payment_status, platform_fee_amount, commission_applied', { count: 'exact' });

    if (bookingsRes.error && /Could not find the|column.*does not exist/i.test(bookingsRes.error.message)) {
      // Pre-v1.7 DB without commission_applied — fall back to the fee column only.
      bookingsRes = await supabaseAdmin
        .from('bookings')
        .select('id, payment_status, platform_fee_amount', { count: 'exact' });
    }

    const [usersRes, vendorsRes, servicesRes] = await Promise.all([
      supabaseAdmin.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'guest'),
      supabaseAdmin.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'host'),
      supabaseAdmin.from('services').select('id', { count: 'exact', head: true }),
    ]);

    const allBookings = bookingsRes.data || [];
    const paid = allBookings.filter(b => b.payment_status === 'paid');
    const revenue = paid.reduce(
      (s, b) => s + (Number(b.platform_fee_amount) || 0) + (Number(b.commission_applied) || 0),
      0
    );

    res.json({
      users: usersRes.count || 0,
      vendors: vendorsRes.count || 0,
      bookings: bookingsRes.count || 0,
      services: servicesRes.count || 0,
      revenue,
      confirmed: paid.length,
      cancelled: allBookings.filter(b => b.payment_status === 'refunded').length,
    });
  } catch (error) {
    safeError(res, error);
  }
};

// ══════════════════════════════════════
// USERS
// ══════════════════════════════════════

const getUsers = async (req, res) => {
  try {
    const { role } = req.query;
    const page = clampPage(req.query.page);
    const limit = clampLimit(req.query.limit);
    let query = supabaseAdmin
      .from('profiles')
      .select('id, name, email, role, username, is_verified, is_banned, google_calendar_connected, created_at', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range((page - 1) * limit, page * limit - 1);

    if (role && role !== 'all') query = query.eq('role', role);
    // Sanitize the term so commas/parens/wildcards can't break out of the or().
    const search = sanitizeLikeTerm(req.query.search);
    if (search) query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%,username.ilike.%${search}%`);

    const { data, count, error } = await query;
    if (error) return safeError(res, error);

    res.json({ users: data, total: count, page, limit });
  } catch (error) {
    safeError(res, error);
  }
};

const getUserById = async (req, res) => {
  try {
    if (!isUuid(req.params.id)) return res.status(400).json({ message: 'Invalid user id' });
    const { data: user, error } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', req.params.id)
      .single();

    if (error || !user) return res.status(404).json({ message: 'User not found' });

    // Strip sensitive tokens
    delete user.google_access_token;
    delete user.google_refresh_token;
    delete user.otp_code;
    delete user.otp_expires_at;

    // Get their bookings and services count
    const [bookingsRes, servicesRes] = await Promise.all([
      supabaseAdmin.from('bookings').select('id', { count: 'exact', head: true })
        .or(`host_id.eq.${req.params.id},guest_id.eq.${req.params.id}`),
      supabaseAdmin.from('services').select('id', { count: 'exact', head: true }).eq('host_id', req.params.id),
    ]);

    res.json({ user, bookings: bookingsRes.count || 0, services: servicesRes.count || 0 });
  } catch (error) {
    safeError(res, error);
  }
};

const updateUser = async (req, res) => {
  try {
    const { role, is_verified, is_banned, admin_notes, name, email } = req.body;
    const updates = { updated_at: new Date().toISOString() };
    if (role !== undefined) updates.role = role;
    if (is_verified !== undefined) updates.is_verified = is_verified;
    if (is_banned !== undefined) updates.is_banned = is_banned;
    if (admin_notes !== undefined) updates.admin_notes = admin_notes;
    if (name !== undefined) updates.name = name;
    if (email !== undefined) {
      updates.email = email;
      // BUG-07 fixed: sync email to Supabase Auth so the user can still log in
      await supabaseAdmin.auth.admin.updateUserById(req.params.id, { email });
    }

    const { data, error } = await supabaseAdmin
      .from('profiles')
      .update(updates)
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) return safeError(res, error);
    await audit(req, { action: 'user.update', resource_type: 'profile', resource_id: req.params.id,
      after: { role: updates.role, is_verified: updates.is_verified, is_banned: updates.is_banned } });
    res.json(data);
  } catch (error) {
    safeError(res, error);
  }
};

const deleteUser = async (req, res) => {
  try {
    // Delete profile row (cascade deletes related data via FK)
    const { error } = await supabaseAdmin
      .from('profiles')
      .delete()
      .eq('id', req.params.id);
    if (error) return safeError(res, error);
    await audit(req, { action: 'user.delete', resource_type: 'profile', resource_id: req.params.id });
    res.json({ message: 'User deleted' });
  } catch (error) {
    safeError(res, error);
  }
};

// ══════════════════════════════════════
// BOOKINGS
// ══════════════════════════════════════

const getAllBookings = async (req, res) => {
  try {
    const { status } = req.query;
    const page = clampPage(req.query.page);
    const limit = clampLimit(req.query.limit);
    let query = supabaseAdmin
      .from('bookings')
      .select('*, services(title, price, duration), profiles!bookings_host_id_fkey(name, email, username)', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range((page - 1) * limit, page * limit - 1);

    if (status && status !== 'all') query = query.eq('status', status);

    const { data, count, error } = await query;
    if (error) return safeError(res, error);

    res.json({ bookings: data, total: count, page, limit });
  } catch (error) {
    safeError(res, error);
  }
};

const updateBooking = async (req, res) => {
  try {
    const { status, payment_status } = req.body;
    const updates = { updated_at: new Date().toISOString() };
    if (status) updates.status = status;
    if (payment_status) updates.payment_status = payment_status;

    const { data, error } = await supabaseAdmin
      .from('bookings')
      .update(updates)
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) return safeError(res, error);
    await audit(req, { action: 'booking.update', resource_type: 'booking', resource_id: req.params.id,
      after: { status: updates.status, payment_status: updates.payment_status } });
    res.json(data);
  } catch (error) {
    safeError(res, error);
  }
};

const deleteBooking = async (req, res) => {
  try {
    const { error } = await supabaseAdmin.from('bookings').delete().eq('id', req.params.id);
    if (error) return safeError(res, error);
    await audit(req, { action: 'booking.delete', resource_type: 'booking', resource_id: req.params.id });
    res.json({ message: 'Booking deleted' });
  } catch (error) {
    safeError(res, error);
  }
};

// ══════════════════════════════════════
// SERVICES
// ══════════════════════════════════════

const getAllServices = async (req, res) => {
  try {
    // Hard cap to avoid dumping the entire services table in one unbounded query.
    const { data, error } = await supabaseAdmin
      .from('services')
      .select('*, profiles!services_host_id_fkey(name, username)')
      .order('created_at', { ascending: false })
      .limit(500);

    if (error) return safeError(res, error);
    res.json(data);
  } catch (error) {
    safeError(res, error);
  }
};

const deleteService = async (req, res) => {
  try {
    const { error } = await supabaseAdmin.from('services').delete().eq('id', req.params.id);
    if (error) return safeError(res, error);
    await audit(req, { action: 'service.delete', resource_type: 'service', resource_id: req.params.id });
    res.json({ message: 'Service deleted' });
  } catch (error) {
    safeError(res, error);
  }
};

// ══════════════════════════════════════
// SETTINGS
// ══════════════════════════════════════

const getSettings = async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin.from('platform_settings').select('*');
    if (error) return safeError(res, error);
    const settings = {};
    (data || []).forEach(r => { settings[r.key] = r.value; });
    res.json(settings);
  } catch (error) {
    safeError(res, error);
  }
};

const updateSettings = async (req, res) => {
  try {
    const entries = Object.entries(req.body);
    for (const [key, value] of entries) {
      await supabaseAdmin
        .from('platform_settings')
        .upsert({ key, value: JSON.stringify(value), updated_at: new Date().toISOString() }, { onConflict: 'key' });
    }
    // Pricing reads platform_fee / GST from here — bust the cache so edits apply now
    try { require('../services/platformConfig').clearCache(); } catch (_) {}
    // Maintenance mode reads from the same table — bust its cache too.
    try { require('../middleware/maintenanceMiddleware').clearCache(); } catch (_) {}
    res.json({ message: 'Settings updated' });
  } catch (error) {
    safeError(res, error);
  }
};

// NOTE: the former POST /api/admin/cleanup-users handler (mass-deleted every
// Supabase Auth user except a hardcoded fallback email) was removed in M0 — a
// destructive dev-reset tool must never be exposed on the production admin API.
// If a bulk reset is ever needed, do it as an offline, access-controlled script.

module.exports = {
  getStats,
  getUsers,
  getUserById,
  updateUser,
  deleteUser,
  getAllBookings,
  updateBooking,
  deleteBooking,
  getAllServices,
  deleteService,
  getSettings,
  updateSettings,
};
