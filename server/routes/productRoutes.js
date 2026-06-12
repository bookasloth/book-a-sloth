const express = require('express');
const router = express.Router();
const {
  createProduct, getMyProducts, updateProduct, deleteProduct,
  getHostProducts, getProduct, downloadProduct, freeDownload,
} = require('../controllers/productController');
const { protect } = require('../middleware/authMiddleware');
const { attachPlan, checkProductLimit } = require('../middleware/planMiddleware');

// Public
router.get('/host/:username', getHostProducts);
router.get('/download/:token', downloadProduct);
router.get('/:id', getProduct);
router.post('/free-download', freeDownload);

// Vendor (protected + plan-gated)
router.post('/', protect, attachPlan, checkProductLimit, createProduct);
router.get('/mine/all', protect, getMyProducts);
router.put('/:id', protect, updateProduct);
router.delete('/:id', protect, deleteProduct);

module.exports = router;
