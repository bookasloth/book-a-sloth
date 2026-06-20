const express = require('express');
const multer  = require('multer');
const router  = express.Router();

// SECURITY: every admin route is gated by the isolated RBAC middleware.
// requireAdmin(permission) verifies the super-admin-secret JWT, rejects any
// non-admin token, then checks the embedded permission array. A vendor JWT can
// never pass. requireSuperAdmin requires the wildcard (super role) outright.
const { requireAdmin, requireSuperAdmin } = require('../middleware/adminMiddleware');

const {
  getStats, getProviderPlanAnalytics, getUsers, getUserById, updateUser, deleteUser, adminSetUserCategories,
  getAllBookings, updateBooking, deleteBooking,
  getAllServices, deleteService, updateServiceSeo, updateProviderSeo,
  getSettings, updateSettings,
} = require('../controllers/adminController');

// ── Operations Center ──────────────────────────────────────────
const ops = require('../controllers/opsAdminController');
router.get('/stats',                    requireAdmin('ops.view'),             getStats);
router.get('/provider-plan-analytics',  requireAdmin('professionals.view'),   getProviderPlanAnalytics);

// ── Marketing / performance insights (owned KPI tiles, Postgres-first) ──
const insights = require('../controllers/insightsAdminController');
router.get('/insights/kpis', requireAdmin('analytics.view'), insights.getKpis);
router.get('/ops/summary',  requireAdmin('ops.view'), ops.getSummary);

// ── Image upload (admin session) — badges, branding, CMS, etc. ─
// Reuses the shared uploadImage handler; admin uploader id comes from req.admin.
const { uploadImage } = require('../controllers/uploadController');
const adminUpload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 2 * 1024 * 1024 } });
router.post('/upload/image', requireAdmin(), adminUpload.single('image'), uploadImage);

// ── Users ──────────────────────────────────────────────────────
router.get('/users',        requireAdmin('users.view'),   getUsers);
router.get('/users/:id',    requireAdmin('users.view'),   getUserById);
router.put('/users/:id',    requireAdmin('users.edit'),   updateUser);
router.delete('/users/:id', requireAdmin('users.delete'), deleteUser);
router.patch('/users/:id/categories', requireAdmin('users.edit'), adminSetUserCategories);

// ── Bookings ───────────────────────────────────────────────────
router.get('/bookings',        requireAdmin('bookings.view'), getAllBookings);
router.put('/bookings/:id',    requireAdmin('bookings.edit'), updateBooking);
router.delete('/bookings/:id', requireAdmin('bookings.edit'), deleteBooking);

// ── Services ───────────────────────────────────────────────────
router.get('/services',         requireAdmin('services.view'),   getAllServices);
router.put('/services/:id/seo',  requireAdmin('services.manage'), updateServiceSeo);
router.delete('/services/:id',  requireAdmin('services.manage'), deleteService);

// ── Provider (host) SEO — providers are users with role='host' ─
router.put('/providers/:id/seo', requireAdmin('users.edit'), updateProviderSeo);

// ── Platform settings (system) ─────────────────────────────────
router.get('/settings', requireAdmin('settings.manage'), getSettings);
router.put('/settings', requireAdmin('settings.manage'), updateSettings);

// ── Appearance — navbar logo (mode + image URLs) ───────────────
const appearance = require('../controllers/appearanceController');
router.get('/appearance', requireAdmin('settings.manage'), appearance.getAdmin);
router.put('/appearance', requireAdmin('settings.manage'), appearance.update);

// ── Payment settings — Razorpay credentials (encrypted at rest) ─
const paymentSettings = require('../controllers/paymentSettingsAdminController');
router.get('/settings/payment/razorpay',       requireAdmin('settings.manage'), paymentSettings.getRazorpay);
router.put('/settings/payment/razorpay',        requireAdmin('settings.manage'), paymentSettings.updateRazorpay);
router.post('/settings/payment/razorpay/test',  requireAdmin('settings.manage'), paymentSettings.testRazorpay);

// ── Feature flags ──────────────────────────────────────────────
const features = require('../controllers/featureFlagController');
router.get('/features',        requireAdmin('settings.manage'), features.getFlags);
router.post('/features',       requireAdmin('settings.manage'), features.createFlag);
router.patch('/features/:key', requireAdmin('settings.manage'), features.toggleFlag);

// ── Staff & roles (Super Admin only — staff.manage is super-exclusive) ──
const staff = require('../controllers/staffAdminController');
router.get('/roles',                       requireAdmin('staff.manage'), staff.listRoles);
router.get('/staff',                       requireAdmin('staff.manage'), staff.listStaff);
router.post('/staff',                      requireAdmin('staff.manage'), staff.createStaff);
router.get('/staff/:id',                   requireAdmin('staff.manage'), staff.getStaff);
router.put('/staff/:id',                   requireAdmin('staff.manage'), staff.updateStaff);
router.patch('/staff/:id/status',          requireAdmin('staff.manage'), staff.setStaffActive);
router.post('/staff/:id/reset-password',   requireAdmin('staff.manage'), staff.resetStaffPassword);

// ── Audit log viewer ───────────────────────────────────────────
const auditCtrl = require('../controllers/auditAdminController');
router.get('/audit',         requireAdmin('audit.view'), auditCtrl.listAudit);
router.get('/audit/actions', requireAdmin('audit.view'), auditCtrl.listActions);

// ── Notification system (WhatsApp / AiSensy) ───────────────────
const notif = require('../controllers/notificationAdminController');
router.get('/notifications/provider',        requireAdmin('notifications.view'), notif.getProvider);
router.put('/notifications/provider',        requireAdmin('whatsapp.manage'),    notif.updateProvider);
router.post('/notifications/provider/test',  requireAdmin('whatsapp.manage'),    notif.testProvider);
router.get('/notifications/events',          requireAdmin('notifications.view'), notif.getEvents);
router.put('/notifications/events/:id',      requireAdmin('whatsapp.manage'),    notif.updateEvent);
router.post('/notifications/test-send',      requireAdmin('whatsapp.manage'),    notif.testSend);
router.get('/notifications/logs',            requireAdmin('notifications.view'), notif.getLogs);
router.post('/notifications/logs/:id/retry', requireAdmin('whatsapp.manage'),    notif.retryLog);

// ── Vendor feedback (triage) ───────────────────────────────────
const feedbackAdmin = require('../controllers/feedbackAdminController');
router.get('/feedback',         requireAdmin('feedback.view'),   feedbackAdmin.listFeedback);
router.patch('/feedback/:id',   requireAdmin('feedback.manage'), feedbackAdmin.updateFeedbackStatus);

// ── Badge system ───────────────────────────────────────────────
const badges = require('../controllers/badgeAdminController');
router.get('/badges/meta',                requireAdmin('badges.manage'), badges.getMeta);
router.post('/badges/preview',            requireAdmin('badges.manage'), badges.previewRules);
router.post('/badges/evaluate',           requireAdmin('badges.manage'), badges.runEvaluation);
router.post('/badges/evaluate/:vendorId', requireAdmin('badges.manage'), badges.runEvaluation);
router.get('/badges',                     requireAdmin('badges.manage'), badges.listBadges);
router.post('/badges',                    requireAdmin('badges.manage'), badges.createBadge);
router.get('/badges/:id',                 requireAdmin('badges.manage'), badges.getBadge);
router.put('/badges/:id',                 requireAdmin('badges.manage'), badges.updateBadge);
router.patch('/badges/:id/status',        requireAdmin('badges.manage'), badges.updateBadgeStatus);
router.get('/badges/:id/preview',         requireAdmin('badges.manage'), badges.previewBadge);
router.get('/vendors/:id/badges',         requireAdmin('badges.manage'), badges.getVendorBadges);
router.post('/vendors/:id/badges',        requireAdmin('badges.manage'), badges.assignBadge);
router.delete('/vendors/:id/badges/:badgeId', requireAdmin('badges.manage'), badges.revokeBadge);

// ── Payout approval ────────────────────────────────────────────
const payouts = require('../controllers/payoutAdminController');
router.get('/payouts',              requireAdmin('payouts.view'),    payouts.listPayouts);
router.post('/payouts/:id/approve', requireAdmin('payouts.approve'), payouts.approvePayout);
router.post('/payouts/:id/reject',  requireAdmin('payouts.approve'), payouts.rejectPayout);
router.post('/payouts/:id/pay',     requireAdmin('payouts.release'), payouts.markPayoutPaid);

// ── Subscription plans ─────────────────────────────────────────
const plans = require('../controllers/planAdminController');
router.get('/plans',                 requireAdmin('plans.view'),   plans.listPlans);
router.post('/plans',                requireAdmin('plans.manage'), plans.createPlan);
router.patch('/plans/reorder',       requireAdmin('plans.manage'), plans.reorderPlans);
router.post('/plans/assign',         requireAdmin('plans.manage'), plans.assignPlan);
router.put('/plans/:id',             requireAdmin('plans.manage'), plans.updatePlan);
router.patch('/plans/:id/archive',   requireAdmin('plans.manage'), plans.setPlanActive);
router.patch('/plans/:id/restore',   requireAdmin('plans.manage'), plans.setPlanActive);
router.post('/plans/:id/clone',      requireAdmin('plans.manage'), plans.clonePlan);

// ── Categories / professions registry ──────────────────────────
const categories = require('../controllers/categoryController');
router.get('/categories',        requireAdmin('settings.manage'), categories.adminList);
router.post('/categories',       requireAdmin('settings.manage'), categories.adminCreate);
router.put('/categories/:id',    requireAdmin('settings.manage'), categories.adminUpdate);
router.delete('/categories/:id', requireAdmin('settings.manage'), categories.adminDelete);

// ── Email Communication Engine ─────────────────────────────────
const email = require('../controllers/emailAdminController');
router.get('/email/templates',                requireAdmin('email.manage'), email.listTemplates);
router.post('/email/templates',               requireAdmin('email.manage'), email.createTemplate);
router.get('/email/templates/:id',            requireAdmin('email.manage'), email.getTemplate);
router.put('/email/templates/:id',            requireAdmin('email.manage'), email.updateTemplate);
router.post('/email/templates/:id/duplicate', requireAdmin('email.manage'), email.duplicateTemplate);
router.patch('/email/templates/:id/archive',  requireAdmin('email.manage'), email.archiveTemplate);
router.post('/email/templates/:id/preview',   requireAdmin('email.manage'), email.previewTemplate);
router.post('/email/templates/:id/test',      requireAdmin('email.manage'), email.testTemplate);
router.post('/email/test-provider',           requireAdmin('email.manage'), email.testProvider);
router.get('/email/logs',                     requireAdmin('email.manage'), email.listLogs);
router.get('/email/logs/:id',                 requireAdmin('email.manage'), email.getLog);
router.post('/email/logs/:id/retry',          requireAdmin('email.manage'), email.retryLog);
router.get('/email/settings',                 requireAdmin('email.manage'), email.getSettings);
router.put('/email/settings',                 requireAdmin('email.manage'), email.updateSettings);
router.get('/email/events',                   requireAdmin('email.manage'), email.listEvents);

// ── Campaigns (Phase 1: email) ─────────────────────────────────
// Static sub-paths (contacts, segments) are registered BEFORE '/campaigns/:id'
// so Express does not match them as an :id param.
const campaigns = require('../controllers/campaignAdminController');
router.get('/campaigns/contacts',          requireAdmin('campaigns.view'),   campaigns.listContacts);
router.post('/campaigns/contacts/sync',    requireAdmin('campaigns.manage'), campaigns.syncContacts);
router.patch('/campaigns/contacts/:id',    requireAdmin('campaigns.manage'), campaigns.suppressContact);
router.get('/campaigns/segments',          requireAdmin('campaigns.view'),   campaigns.listSegments);
router.post('/campaigns/segments/preview', requireAdmin('campaigns.view'),   campaigns.previewSegment);
router.get('/campaigns/wa-templates',      requireAdmin('campaigns.view'),   campaigns.listWaTemplates);
router.post('/campaigns/wa-templates',     requireAdmin('campaigns.manage'), campaigns.createWaTemplate);
router.put('/campaigns/wa-templates/:id',  requireAdmin('campaigns.manage'), campaigns.updateWaTemplate);
router.get('/campaigns',                   requireAdmin('campaigns.view'),   campaigns.listCampaigns);
router.post('/campaigns',                  requireAdmin('campaigns.manage'), campaigns.createCampaign);
router.get('/campaigns/:id',               requireAdmin('campaigns.view'),   campaigns.getCampaign);
router.put('/campaigns/:id',               requireAdmin('campaigns.manage'), campaigns.updateCampaign);
router.post('/campaigns/:id/launch',       requireAdmin('campaigns.manage'), campaigns.launchCampaign);

// ── Financial ledger (P1) ──────────────────────────────────────
const finance = require('../controllers/financeAdminController');
router.get('/finance/summary',            requireAdmin('finance.view'),   finance.getSummary);
router.get('/finance/accounts',           requireAdmin('finance.view'),   finance.getAccounts);
router.get('/finance/journals',           requireAdmin('finance.view'),   finance.listJournals);
router.get('/finance/journals/:id',       requireAdmin('finance.view'),   finance.getJournal);
router.get('/finance/ledger/:accountId',  requireAdmin('finance.view'),   finance.getLedger);
router.post('/finance/adjustment',        requireAdmin('finance.manage'), finance.postAdjustment);
router.post('/finance/reversal',          requireAdmin('finance.manage'), finance.postReversal);
router.post('/finance/bank-transfer',     requireAdmin('finance.manage'), finance.postBankTransfer);


// ── Explore Page Revenue Management ───────────────────────────
const explore = require('../controllers/exploreController');
// Featured slots
router.get('/explore/featured',                             requireAdmin('settings.manage'), explore.adminListFeatured);
router.post('/explore/featured',                            requireAdmin('settings.manage'), explore.adminCreateFeatured);
router.put('/explore/featured/:id',                         requireAdmin('settings.manage'), explore.adminUpdateFeatured);
router.delete('/explore/featured/:id',                      requireAdmin('settings.manage'), explore.adminDeleteFeatured);
// Collections
router.get('/explore/collections',                          requireAdmin('settings.manage'), explore.adminListCollections);
router.post('/explore/collections',                         requireAdmin('settings.manage'), explore.adminCreateCollection);
router.put('/explore/collections/:id',                      requireAdmin('settings.manage'), explore.adminUpdateCollection);
router.post('/explore/collections/:id/vendors',             requireAdmin('settings.manage'), explore.adminAddToCollection);
router.delete('/explore/collections/:id/vendors/:vendorId', requireAdmin('settings.manage'), explore.adminRemoveFromCollection);
// Boosts
router.get('/explore/boosts',                               requireAdmin('settings.manage'), explore.adminListBoosts);
router.post('/explore/boosts',                              requireAdmin('settings.manage'), explore.adminCreateBoost);
router.delete('/explore/boosts/:id',                        requireAdmin('settings.manage'), explore.adminRevokeBoost);
// Verified badges
router.get('/explore/verified',                             requireAdmin('settings.manage'), explore.adminListVerified);
router.post('/explore/verified',                            requireAdmin('settings.manage'), explore.adminGrantVerified);
router.delete('/explore/verified/:id',                      requireAdmin('settings.manage'), explore.adminRevokeVerified);
// Sponsored keywords
router.get('/explore/keywords',                             requireAdmin('settings.manage'), explore.adminListKeywords);
router.post('/explore/keywords',                            requireAdmin('settings.manage'), explore.adminCreateKeyword);
router.delete('/explore/keywords/:id',                      requireAdmin('settings.manage'), explore.adminRevokeKeyword);

module.exports = router;
