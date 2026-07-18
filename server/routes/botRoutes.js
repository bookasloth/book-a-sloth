/**
 * botRoutes.js — Bolt 958 support bot. Mounted at /api/bot.
 * Public + unauthenticated (Phase 1 knowledge bot). botLimiter caps the
 * Anthropic-backed /ask path per IP.
 */
'use strict';

const router = require('express').Router();
const { ask, askStream, feedback } = require('../controllers/botController');
const { botLimiter, botGlobalLimiter } = require('../middleware/security');

router.post('/ask', botGlobalLimiter, botLimiter, ask);
router.post('/ask/stream', botGlobalLimiter, botLimiter, askStream);
router.post('/feedback', botLimiter, feedback);

module.exports = router;
