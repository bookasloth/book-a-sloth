/**
 * botRoutes.js — Bolt 958 support bot. Mounted at /api/bot.
 * Public + unauthenticated (Phase 1 knowledge bot). botLimiter caps the
 * Anthropic-backed /ask path per IP.
 */
'use strict';

const router = require('express').Router();
const { ask, feedback } = require('../controllers/botController');
const { botLimiter } = require('../middleware/security');

router.post('/ask', botLimiter, ask);
router.post('/feedback', botLimiter, feedback);

module.exports = router;
