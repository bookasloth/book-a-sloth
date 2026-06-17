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
  loginWithPhone,
  verifyOtpLogin,
  setPassword,
  getMe,
  updateMe,
  forgotPassword,
  resetPassword,
} = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');
const { otpLimiter, authLimiter } = require('../middleware/security');
const { requireFeature } = require('../middleware/requireFeature');

// Separate registration
router.post('/register/vendor', authLimiter, registerVendor);
// guest_signup kill-switch — vendor registration intentionally NOT gated here.
router.post('/register/user', authLimiter, requireFeature('guest_signup'), registerUser);

// Google OAuth
router.get('/google', protect, googleAuth);                 // legacy: calendar connect (logged-in vendor)
router.get('/google/vendor', authLimiter, googleVendorAuth); // vendor signup/login entry (public)
router.get('/google/callback', googleCallback);

// OTP (for guest booking)
router.post('/send-otp', otpLimiter, sendOtp);
router.post('/verify-otp', otpLimiter, verifyOtp);

// Phone-primary user login: phone+password, OTP login, set-password
router.post('/login-phone', authLimiter, loginWithPhone);
router.post('/verify-otp-login', otpLimiter, verifyOtpLogin);
router.post('/set-password', protect, setPassword);

// Password reset (OTP-based, works for user/vendor/admin)
router.post('/forgot-password', otpLimiter, forgotPassword);
router.post('/reset-password', authLimiter, resetPassword);

// Shared
router.post('/login', authLimiter, login);
router.get('/me', protect, getMe);
router.put('/me', protect, updateMe);

module.exports = router;
