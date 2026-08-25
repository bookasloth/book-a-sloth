const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const c = require('../controllers/supportController');

// Host/guest support chat. A participant only ever reaches their own thread
// (ownership is enforced in the controller).
router.get('/thread',                 protect, c.getMyThread);
router.get('/thread/:id/messages',    protect, c.getMessages);
router.post('/thread/:id/messages',   protect, c.sendMessage);
router.post('/thread/:id/escalate',   protect, c.escalateThread);
router.post('/thread/:id/read',       protect, c.markRead);

module.exports = router;
