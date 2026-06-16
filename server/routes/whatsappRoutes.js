const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { otpLimiter } = require('../middleware/security');
const { sendOtp, verifyOtp } = require('../controllers/whatsappController');

router.post('/send-otp', protect, otpLimiter, sendOtp);
router.post('/verify-otp', protect, otpLimiter, verifyOtp);

module.exports = router;
