/**
 * vendorController.js
 * Vendor-specific dashboard operations:
 *   - Transactions list
 *   - Payout / withdrawal requests
 *   - Service soft-disable/enable
 */
const { supabaseAdmin } = require('../config/supabase');
const { safeError } = require('../utils/httpError');

// ─── TRANSACTIONS ─────────────────────────────────────────────────────────────

// GET /api/vendor/transactions?page=1&limit=20&search=&status=&sort=desc
const getTransactions = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      search = '',
      status = '',
      sort = 'desc',
    } = req.query;

    const from = (parseInt(page) - 1) * parseInt(limit);
    const to   = from + parseInt(limit) - 1;

    let query = supabaseAdmin
      .from('bookings')
      .select('*, services(title, price, duration)', { count: 'exact' })
      .eq('host_id', req.user.id)
      .order('created_at', { ascending: sort === 'asc' })
      .range(from, to);

    if (status) query = query.eq('payment_status', status);
    if (search) {
      query = query.or(
        `guest_name.ilike.%${search}%,guest_email.ilike.%${search}%`
      );
    }

    const { data, error, count } = await query;
    if (error) return safeError(res, error);

    res.json({ data: data || [], total: count || 0, page: parseInt(page), limit: parseInt(limit) });
  } catch (error) {
    safeError(res, error);
  }
};

// ─── PAYOUTS ──────────────────────────────────────────────────────────────────

// GET /api/vendor/payout/balance
const getPayoutBalance = async (req, res) => {
  try {
    const hostId = req.user.id;

    // Total earned (paid bookings, vendor_amount)
    const { data: paidBookings } = await supabaseAdmin
      .from('bookings')
      .select('vendor_amount, platform_fee_amount')
      .eq('host_id', hostId)
      .eq('payment_status', 'paid');

    const totalEarned = (paidBookings || []).reduce(
      (sum, b) => sum + (b.vendor_amount || 0), 0
    );

    // Total withdrawn (approved payouts)
    const { data: payouts } = await supabaseAdmin
      .from('payout_requests')
      .select('amount, status')
      .eq('host_id', hostId);

    const totalWithdrawn = (payouts || [])
      .filter(p => p.status === 'approved')
      .reduce((sum, p) => sum + (p.amount || 0), 0);

    const pendingPayout = (payouts || [])
      .filter(p => p.status === 'pending')
      .reduce((sum, p) => sum + (p.amount || 0), 0);

    const available = Math.max(0, totalEarned - totalWithdrawn - pendingPayout);

    res.json({
      available: Math.round(available * 100) / 100,
      pending: Math.round(pendingPayout * 100) / 100,
      totalWithdrawn: Math.round(totalWithdrawn * 100) / 100,
      totalEarned: Math.round(totalEarned * 100) / 100,
    });
  } catch (error) {
    safeError(res, error);
  }
};

// GET /api/vendor/payout/requests
const getPayoutRequests = async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('payout_requests')
      .select('*')
      .eq('host_id', req.user.id)
      .order('created_at', { ascending: false });

    if (error) return safeError(res, error);
    res.json(data || []);
  } catch (error) {
    safeError(res, error);
  }
};

// POST /api/vendor/payout/request
const requestPayout = async (req, res) => {
  try {
    const { amount, notes } = req.body;
    const hostId = req.user.id;

    if (!amount || isNaN(amount) || parseFloat(amount) < 100) {
      return res.status(400).json({ message: 'Minimum withdrawal amount is ₹100' });
    }

    // Get available balance
    const { data: paidBookings } = await supabaseAdmin
      .from('bookings')
      .select('vendor_amount')
      .eq('host_id', hostId)
      .eq('payment_status', 'paid');

    const totalEarned = (paidBookings || []).reduce(
      (sum, b) => sum + (b.vendor_amount || 0), 0
    );

    const { data: payouts } = await supabaseAdmin
      .from('payout_requests')
      .select('amount, status')
      .eq('host_id', hostId);

    const alreadyClaimed = (payouts || [])
      .filter(p => p.status === 'approved' || p.status === 'pending')
      .reduce((sum, p) => sum + (p.amount || 0), 0);

    const available = Math.max(0, totalEarned - alreadyClaimed);

    if (parseFloat(amount) > available) {
      return res.status(400).json({
        message: `Cannot exceed available balance of ₹${Math.round(available)}`,
      });
    }

    const { data, error } = await supabaseAdmin
      .from('payout_requests')
      .insert({
        host_id: hostId,
        amount: parseFloat(amount),
        notes: notes || '',
        status: 'pending',
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) return safeError(res, error);
    res.status(201).json(data);
  } catch (error) {
    safeError(res, error);
  }
};

// ─── SERVICE TOGGLE ───────────────────────────────────────────────────────────

// PUT /api/vendor/services/:id/toggle
const toggleService = async (req, res) => {
  try {
    // Fetch current status
    const { data: service, error: fetchError } = await supabaseAdmin
      .from('services')
      .select('id, is_active, host_id')
      .eq('id', req.params.id)
      .eq('host_id', req.user.id)
      .single();

    if (fetchError || !service) {
      return res.status(404).json({ message: 'Service not found' });
    }

    const { data, error } = await supabaseAdmin
      .from('services')
      .update({
        is_active: !service.is_active,
        updated_at: new Date().toISOString(),
      })
      .eq('id', req.params.id)
      .eq('host_id', req.user.id)
      .select()
      .single();

    if (error) return safeError(res, error);
    res.json(data);
  } catch (error) {
    safeError(res, error);
  }
};

module.exports = {
  getTransactions,
  getPayoutBalance,
  getPayoutRequests,
  requestPayout,
  toggleService,
};
