const express = require('express');
const router = express.Router();
const { getByToken, cancelByToken } = require('../controllers/manageBookingController');
const { bookingLimiter } = require('../middleware/security');

// Public, token-authorized (MF3 #516). No protect/optionalProtect — the signed
// manage-booking token IS the auth, scoped to one booking id. Rate-limited like
// the rest of the booking surface.
router.get('/:token', bookingLimiter, getByToken);
router.post('/:token/cancel', bookingLimiter, cancelByToken);

module.exports = router;
