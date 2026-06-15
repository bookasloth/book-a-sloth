/**
 * emailRoutes.js — public email preference endpoints (no auth; token-gated).
 * Mounted at /api/email.
 */
'use strict';

const router = require('express').Router();
const c = require('../controllers/emailPublicController');

router.get('/unsubscribe', c.getUnsubscribeStatus);
router.post('/unsubscribe', c.unsubscribe);
router.post('/resubscribe', c.resubscribe);

module.exports = router;
