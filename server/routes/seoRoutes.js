'use strict';
/**
 * seoRoutes.js — SEO Audit Engine, mounted at /api/admin/seo (see adminRoutes).
 * Every route is gated by the admin RBAC middleware on seo.manage.
 */
const express = require('express');
const router = express.Router();
const { requireAdmin } = require('../middleware/adminMiddleware');
const c = require('../controllers/seoAdminController');

router.get('/overview', requireAdmin('seo.manage'), c.getOverview);
router.get('/issues', requireAdmin('seo.manage'), c.getIssues);
router.get('/issues/:id', requireAdmin('seo.manage'), c.getIssue);
router.get('/pages', requireAdmin('seo.manage'), c.getPages);
router.get('/categories', requireAdmin('seo.manage'), c.getCategories);
router.get('/reports', requireAdmin('seo.manage'), c.getReports);
router.get('/changes', requireAdmin('seo.manage'), c.getChanges);
router.get('/pages/:id', requireAdmin('seo.manage'), c.getPage);
router.get('/scores/history', requireAdmin('seo.manage'), c.getScoreHistory);
router.post('/crawl', requireAdmin('seo.manage'), c.postCrawl);
router.get('/crawl/:id', requireAdmin('seo.manage'), c.getCrawl);
router.post('/issues/:id/mute', requireAdmin('seo.manage'), c.postMuteIssue);
router.get('/gsc', requireAdmin('seo.manage'), c.getGsc);
router.post('/gsc/sync', requireAdmin('seo.manage'), c.postGscSync);

module.exports = router;
