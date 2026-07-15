/**
 * securityRoutes.js — Google Cross-Account Protection (RISC) receiver.
 *
 * ⚠️ DRAFT / NOT WIRED INTO PROD — intentionally NOT mounted in server.js. The SET
 *    is the auth for this route (no protect/requireHost), and the body is a raw
 *    JWT (content-type application/secevent+jwt) needing express.text() rather
 *    than the global JSON parser — the router supplies its own below.
 *
 *    To enable (after the manual Google Cloud steps in securityRiscController.js
 *    and the v3.79 migration), add to server.js alongside the other mounts:
 *        app.use('/api/security', require('./routes/securityRoutes'));
 */
const express = require('express');
const router = express.Router();
const { receiveRiscEvent } = require('../controllers/securityRiscController');

// Accept the bare SET JWT as text. `type: () => true` so we still capture it if
// Google sends application/secevent+jwt (which the JSON parser would ignore).
const rawSet = express.text({ type: () => true, limit: '64kb' });

// POST /api/security/risc — receives Google RISC Security Event Tokens.
router.post('/risc', rawSet, receiveRiscEvent);

module.exports = router;
