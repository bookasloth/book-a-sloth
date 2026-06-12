const express = require('express');
const router = express.Router();
const {
  createService,
  getMyServices,
  getServiceById,
  updateService,
  deleteService,
  duplicateService,
  toggleService,
  getPublicServiceBySlug,
  getPublicServiceByProfileAndSlug,
} = require('../controllers/serviceController');
const { protect } = require('../middleware/authMiddleware');
// BUG-04: import plan middlewares so the new /api/services endpoint enforces limits
const { attachPlan, checkServiceLimit } = require('../middleware/planMiddleware');

// Public routes — no auth (specific before dynamic)
router.get('/public/:profileSlug/:serviceSlug', getPublicServiceByProfileAndSlug);
router.get('/public/:slug', getPublicServiceBySlug);

// Protected routes — vendor dashboard
router.get('/',               protect, getMyServices);
router.post('/',              protect, attachPlan, checkServiceLimit, createService); // BUG-04 fixed
router.get('/:id',            protect, getServiceById);
router.put('/:id',            protect, updateService);
router.delete('/:id',         protect, deleteService);
router.post('/:id/duplicate', protect, duplicateService);
router.put('/:id/toggle',     protect, toggleService);

module.exports = router;
