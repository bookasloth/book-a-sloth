const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
  getTransactions,
  getPayoutBalance,
  getPayoutRequests,
  requestPayout,
  toggleService,
} = require('../controllers/vendorController');

// All vendor routes require auth
router.use(protect);

// Transactions
router.get('/transactions', getTransactions);

// Payouts
router.get('/payout/balance', getPayoutBalance);
router.get('/payout/requests', getPayoutRequests);
router.post('/payout/request', requestPayout);

// Service toggle (soft-disable / enable)
router.put('/services/:id/toggle', toggleService);

module.exports = router;
