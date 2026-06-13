const express = require('express');
const router = express.Router();
const {
  createOrder, verifyPayment,
  subscribePlan, verifySubscription,
  createProductOrder, verifyProductPayment,
  handleWebhook,
} = require('../controllers/paymentController');
const { protect } = require('../middleware/authMiddleware');
const { paymentLimiter } = require('../middleware/security');

// Razorpay server-side webhook — authoritative payment confirmation.
// Uses the raw body parser registered in server.js (must precede express.json).
// Verified by HMAC signature inside the handler; no app rate limiter so genuine
// Razorpay retries are never dropped.
router.post('/webhook', handleWebhook);

// Booking payments
router.post('/create-order', paymentLimiter, createOrder);
router.post('/verify', paymentLimiter, verifyPayment);

// Plan subscriptions (vendor must be logged in)
router.post('/subscribe', paymentLimiter, protect, subscribePlan);
router.post('/verify-subscription', paymentLimiter, protect, verifySubscription);

// Product purchases
router.post('/create-product-order', paymentLimiter, createProductOrder);
router.post('/verify-product', paymentLimiter, verifyProductPayment);

module.exports = router;
