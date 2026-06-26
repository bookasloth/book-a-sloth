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
const { protect, requireHost } = require('../middleware/authMiddleware');
// BUG-04: import plan middlewares so the new /api/services endpoint enforces limits
const { attachPlan, checkServiceLimit } = require('../middleware/planMiddleware');
const { requireFeature } = require('../middleware/requireFeature');
const { validate, serviceWriteRules } = require('../middleware/validate');

// Public routes — no auth (specific before dynamic)
router.get('/public/:profileSlug/:serviceSlug', getPublicServiceByProfileAndSlug);
router.get('/public/:slug', getPublicServiceBySlug);

// Protected routes — vendor dashboard
router.get('/',               protect, getMyServices);
router.post('/',              protect, requireHost, requireFeature('services'), ...serviceWriteRules, validate, attachPlan, checkServiceLimit, createService); // BUG-04 fixed
router.get('/:id',            protect, getServiceById);
router.put('/:id',            protect, requireHost, requireFeature('services'), ...serviceWriteRules, validate, updateService);
router.delete('/:id',         protect, requireHost, deleteService);
router.post('/:id/duplicate', protect, requireHost, requireFeature('services'), duplicateService);
router.put('/:id/toggle',     protect, requireHost, toggleService);

module.exports = router;
