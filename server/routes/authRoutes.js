const express = require('express');
const router = express.Router();
const {
  registerVendor,
  registerUser,
  googleAuth,
  googleVendorAuth,
  googleCallback,
  sendOtp,
  verifyOtp,
  login,
  getMe,
  forgotPassword,
  resetPassword,
} = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');
const { otpLimiter, authLimiter } = require('../middleware/security');

// Separate registration
router.post('/register/vendor', authLimiter, registerVendor);
router.post('/register/user', authLimiter, registerUser);

// Google OAuth
router.get('/google', protect, googleAuth);                 // legacy: calendar connect (logged-in vendor)
router.get('/google/vendor', authLimiter, googleVendorAuth); // vendor signup/login entry (public)
router.get('/google/callback', googleCallback);

// OTP (for guest booking)
router.post('/send-otp', otpLimiter, sendOtp);
router.post('/verify-otp', otpLimiter, verifyOtp);

// Password reset (OTP-based, works for user/vendor/admin)
router.post('/forgot-password', otpLimiter, forgotPassword);
router.post('/reset-password', authLimiter, resetPassword);

// Shared
router.post('/login', authLimiter, login);
router.get('/me', protect, getMe);

module.exports = router;
