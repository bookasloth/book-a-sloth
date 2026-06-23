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
const { validate, createProductRules, updateProductRules } = require('../middleware/validate');

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
// validate(...): URL fields are http(s)-only — rejects javascript:/data: schemes
// before they're stored and later rendered as links (stored-XSS / phishing guard).
router.post('/', protect, requireHost, requireFeature('digital_products'), attachPlan, checkProductLimit, ...createProductRules, validate, createProduct);
router.get('/mine/all', protect, getMyProducts);
router.put('/:id', protect, requireHost, requireFeature('digital_products'), ...updateProductRules, validate, updateProduct);
router.delete('/:id', protect, requireHost, deleteProduct);

module.exports = router;
