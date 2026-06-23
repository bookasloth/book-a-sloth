const express = require('express');
const router = express.Router();
const {
  createProduct, getMyProducts, updateProduct, deleteProduct,
  getHostProducts, getProduct, downloadProduct, freeDownload,
} = require('../controllers/productController');
const { protect, optionalProtect, requireHost } = require('../middleware/authMiddleware');
const { attachPlan, checkProductLimit } = require('../middleware/planMiddleware');
const { requireFeature } = require('../middleware/requireFeature');
const { freeDownloadLimiter, freeDownloadIpLimiter } = require('../middleware/security');

// Public
router.get('/host/:username', getHostProducts);
router.get('/download/:token', downloadProduct);
router.get('/:id', getProduct);
// optionalProtect: links the download to the logged-in buyer if present;
// buyer_id is never taken from the body.
// Stack both limiters: email-keyed (per-victim) + IP-keyed (stops buyer_email
// rotation from spamming purchase rows from one IP).
router.post('/free-download', freeDownloadIpLimiter, freeDownloadLimiter, optionalProtect, requireFeature('product_purchase'), freeDownload);

// Vendor (protected + plan-gated)
router.post('/', protect, requireHost, requireFeature('digital_products'), attachPlan, checkProductLimit, createProduct);
router.get('/mine/all', protect, getMyProducts);
router.put('/:id', protect, requireHost, requireFeature('digital_products'), updateProduct);
router.delete('/:id', protect, requireHost, deleteProduct);

module.exports = router;
