'use strict';
/**
 * eventsRoutes.js — public intent-event sink (/api/events).
 * Rate-limited (same limiter as the other public write forms) to stop abuse.
 */
const router = require('express').Router();
const { newsletterIpLimiter } = require('../middleware/security');
const { recordIntent, recordLinkClick } = require('../controllers/eventsController');

router.post('/intent', newsletterIpLimiter, recordIntent);
router.post('/link/:code', newsletterIpLimiter, recordLinkClick);

module.exports = router;
