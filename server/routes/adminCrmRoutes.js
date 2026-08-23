'use strict';
/**
 * adminCrmRoutes.js — Admin Sales CRM (/api/admin/crm).
 *
 * Mounted under adminLimiter in server.js. Read routes require `leads.view`;
 * every mutation, send, import and bulk op requires `leads.manage`. Sends are
 * additionally gated at runtime by the `crm_admin_sends` kill-switch (default
 * OFF) inside MessageService.
 */
const express = require('express');
const { requireAdmin } = require('../middleware/adminMiddleware');
const c = require('../controllers/crmController');

const router = express.Router();
const view = requireAdmin('leads.view');
const manage = requireAdmin('leads.manage');

// Dashboard
router.get('/dashboard', view, c.dashboard);
router.get('/pipeline', view, c.pipeline);

// Follow-ups (collection-level) + sequences list
router.get('/follow-ups', view, c.listFollowUps);
router.post('/follow-ups/:id/complete', manage, c.completeFollowUp);
router.post('/follow-ups/:id/cancel', manage, c.cancelFollowUp);
router.get('/sequences', view, c.listSequences);
router.post('/sequences', manage, c.createSequence);

// Import / export / bulk / attribution
router.post('/import/preview', manage, c.importPreview);
router.post('/import/commit', manage, c.importCommit);
router.get('/leads/export.csv', view, c.exportCsv);
router.post('/leads/bulk', manage, c.bulk);
router.post('/attribution/refresh', manage, c.refreshAttribution);

// Leads
router.get('/leads', view, c.listLeads);
router.post('/leads', manage, c.createLead);
router.get('/leads/:id', view, c.getLead);
router.patch('/leads/:id', manage, c.updateLead);
router.get('/leads/:id/timeline', view, c.getTimeline);

// Lead actions
router.post('/leads/:id/status', manage, c.setStatus);
router.post('/leads/:id/owner', manage, c.setOwner);
router.post('/leads/:id/tags', manage, c.addTag);
router.delete('/leads/:id/tags/:tag', manage, c.removeTag);
router.post('/leads/:id/dnc', manage, c.setDnc);
router.post('/leads/:id/notes', manage, c.addNote);
router.post('/leads/:id/call', manage, c.logCall);
router.post('/leads/:id/whatsapp', manage, c.sendWhatsApp);
router.post('/leads/:id/email', manage, c.sendEmail);
router.post('/leads/:id/follow-ups', manage, c.createFollowUp);
router.post('/leads/:id/enroll', manage, c.enroll);

module.exports = router;
