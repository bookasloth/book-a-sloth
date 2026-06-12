const express = require('express');
const multer  = require('multer');
const router  = express.Router();

// SECURITY: every admin route is gated by the isolated RBAC middleware.
// requireAdmin(permission) verifies the super-admin-secret JWT, rejects any
// non-admin token, then checks the embedded permission array. A vendor JWT can
// never pass. requireSuperAdmin requires the wildcard (super role) outright.
const { requireAdmin, requireSuperAdmin } = require('../middleware/adminMiddleware');

const {
  getStats, getUsers, getUserById, updateUser, deleteUser,
  getAllBookings, updateBooking, deleteBooking,
  getAllServices, deleteService,
  getSettings, updateSettings,
} = require('../controllers/adminController');

// ── Operations Center ──────────────────────────────────────────
const ops = require('../controllers/opsAdminController');
router.get('/stats',        requireAdmin('ops.view'), getStats);
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

// ── Bookings ───────────────────────────────────────────────────
router.get('/bookings',        requireAdmin('bookings.view'), getAllBookings);
router.put('/bookings/:id',    requireAdmin('bookings.edit'), updateBooking);
router.delete('/bookings/:id', requireAdmin('bookings.edit'), deleteBooking);

// ── Services ───────────────────────────────────────────────────
router.get('/services',        requireAdmin('services.view'),   getAllServices);
router.delete('/services/:id', requireAdmin('services.manage'), deleteService);

// ── Platform settings (system) ─────────────────────────────────
router.get('/settings', requireAdmin('settings.manage'), getSettings);
router.put('/settings', requireAdmin('settings.manage'), updateSettings);

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
router.get('/campaigns',                   requireAdmin('campaigns.view'),   campaigns.listCampaigns);
router.post('/campaigns',                  requireAdmin('campaigns.manage'), campaigns.createCampaign);
router.get('/campaigns/:id',               requireAdmin('campaigns.view'),   campaigns.getCampaign);
router.put('/campaigns/:id',               requireAdmin('campaigns.manage'), campaigns.updateCampaign);
router.post('/campaigns/:id/launch',       requireAdmin('campaigns.manage'), campaigns.launchCampaign);

module.exports = router;
