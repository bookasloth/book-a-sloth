const express = require('express');
const router = express.Router();
const { adminLogin, adminMe } = require('../controllers/adminAuthController');
const { requireAdmin } = require('../middleware/adminMiddleware');
const { authLimiter } = require('../middleware/security');

// Single-step admin staff login: username/email + password -> session token.
router.post('/login', authLimiter, adminLogin);

// Echo the current admin identity + permissions (used by the client to gate UI).
router.get('/me', requireAdmin(), adminMe);

module.exports = router;
