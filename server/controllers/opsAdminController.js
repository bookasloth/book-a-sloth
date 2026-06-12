/**
 * opsAdminController.js — Operations Center summary (the admin homepage).
 *
 * Returns the "what needs attention right now" queue, computed from REAL data:
 * pending payouts, failed emails, failed notifications (WhatsApp), abandoned
 * (stale unpaid) bookings, plus headline platform counts. Every sub-count is
 * isolated in its own try/catch with a 0 fallback, so a single missing column
 * or empty table can never 500 the dashboard.
 */

const { supabaseAdmin } = require('../config/supabase');

// Each metric builds its own table-bound COUNT query; returns 0 on any error
// (missing column, empty table) so the dashboard never 500s.
const countWhere = async (table, apply) => {
  try {
    let q = supabaseAdmin.from(table).select('id', { count: 'exact', head: true });
    q = apply ? apply(q) : q;
    const { count, error } = await q;
    if (error) return 0;
    return count || 0;
  } catch (_) { return 0; }
};

// GET /api/admin/ops/summary
const getSummary = async (req, res) => {
  try {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();

    const [
      pendingPayouts,
      failedEmails,
      failedNotifications,
      staleUnpaidBookings,
      pendingReviews,
      pendingVerifications,
      totalUsers,
      totalVendors,
      totalBookings,
      totalServices,
    ] = await Promise.all([
      countWhere('payout_requests', q => q.eq('status', 'pending')),
      countWhere('email_logs',      q => q.eq('status', 'failed')),
      countWhere('notification_logs', q => q.eq('status', 'failed')),
      countWhere('bookings',        q => q.eq('status', 'pending').eq('payment_status', 'unpaid').lt('created_at', oneHourAgo)),
      // These columns arrive in later milestones (reviews.status M3, verification_status M3).
      // The fallback to 0 keeps the dashboard alive until then.
      countWhere('reviews',         q => q.eq('status', 'pending')),
      countWhere('profiles',        q => q.eq('verification_status', 'pending')),
      countWhere('profiles',        q => q.eq('role', 'guest')),
      countWhere('profiles',        q => q.eq('role', 'host')),
      countWhere('bookings',        null),
      countWhere('services',        null),
    ]);

    const attention = [
      { key: 'pending_payouts',       label: 'Pending payouts',        count: pendingPayouts,       to: '/admin/finance/payouts?status=pending',     severity: pendingPayouts ? 'warning' : 'ok' },
      { key: 'failed_emails',         label: 'Failed emails',          count: failedEmails,         to: '/admin/platform/communication?tab=logs&status=failed', severity: failedEmails ? 'danger' : 'ok' },
      { key: 'failed_notifications',  label: 'Failed WhatsApp/notifs', count: failedNotifications,  to: '/admin/notifications?tab=logs&status=failed', severity: failedNotifications ? 'danger' : 'ok' },
      { key: 'stale_unpaid_bookings', label: 'Abandoned bookings',     count: staleUnpaidBookings,  to: '/admin/bookings?status=pending',            severity: staleUnpaidBookings ? 'warning' : 'ok' },
      { key: 'pending_reviews',       label: 'Reviews to moderate',    count: pendingReviews,       to: '/admin/support/reviews?status=pending',     severity: pendingReviews ? 'warning' : 'ok' },
      { key: 'pending_verifications', label: 'Pending verifications',  count: pendingVerifications, to: '/admin/professionals?status=pending',       severity: pendingVerifications ? 'warning' : 'ok' },
    ];

    const totalAttention = attention.reduce((s, a) => s + a.count, 0);

    res.json({
      attention,
      totalAttention,
      stats: {
        users: totalUsers,
        vendors: totalVendors,
        bookings: totalBookings,
        services: totalServices,
      },
      generated_at: new Date().toISOString(),
    });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

module.exports = { getSummary };
