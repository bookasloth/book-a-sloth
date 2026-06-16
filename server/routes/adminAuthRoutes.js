const express = require('express');
const router = express.Router();
const { adminLogin, adminMe, setup2fa, confirm2fa, verify2fa } = require('../controllers/adminAuthController');
const { requireAdmin } = require('../middleware/adminMiddleware');
const { authLimiter } = require('../middleware/security');

router.post('/login', authLimiter, adminLogin);
router.post('/2fa-setup', authLimiter, setup2fa);
router.post('/2fa-confirm', authLimiter, confirm2fa);
router.post('/2fa-verify', authLimiter, verify2fa);
router.get('/me', requireAdmin(), adminMe);

module.exports = router;
