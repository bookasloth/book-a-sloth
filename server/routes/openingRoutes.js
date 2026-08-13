/**
 * openingRoutes.js — public "The Opening" launch event. Mounted at /api/opening.
 *
 * GET  /status        window + live count (drives countdown)
 * POST /open          cut the ribbon + place a stone (IP rate-limited)
 * GET  /wall          paginated Inaugurators Wall
 */
'use strict';

const router = require('express').Router();
const { getStatus, open, getWall } = require('../controllers/openingController');
const { newsletterIpLimiter } = require('../middleware/security');

router.get('/status', getStatus);
router.post('/open', newsletterIpLimiter, open); // reuse the per-IP write limiter
router.get('/wall', getWall);

module.exports = router;
