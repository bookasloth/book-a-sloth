const express = require('express');
const router = express.Router();
const { getInvoice, listMyInvoices } = require('../controllers/invoiceController');
const { protect } = require('../middleware/authMiddleware');

// Logged-in user's own invoices (subscriptions + bookings billed to them).
// Must be registered before `/:id` so it isn't shadowed.
router.get('/mine', protect, listMyInvoices);

// Token-gated public view/download of a GST tax invoice.
router.get('/:id', getInvoice);

module.exports = router;
