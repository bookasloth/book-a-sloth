const express = require('express');
const router = express.Router();
const { getInvoice } = require('../controllers/invoiceController');

// Token-gated public view/download of a GST tax invoice.
router.get('/:id', getInvoice);

module.exports = router;
