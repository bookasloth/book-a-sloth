const express = require('express');
const router = express.Router();
const {
  createOrder, verifyPayment,
  subscribePlan, verifySubscription,
  createProductOrder, verifyProductPayment,
} = require('../controllers/paymentController');
const { protect } = require('../middleware/authMiddleware');

// Booking payments
router.post('/create-order', createOrder);
router.post('/verify', verifyPayment);

// Plan subscriptions (vendor must be logged in)
router.post('/subscribe', protect, subscribePlan);
router.post('/verify-subscription', protect, verifySubscription);

// Product purchases
router.post('/create-product-order', createProductOrder);
router.post('/verify-product', verifyProductPayment);

module.exports = router;
