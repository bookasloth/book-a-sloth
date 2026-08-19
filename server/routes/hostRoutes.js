const express = require('express');
const router = express.Router();
const {
  getHostProfile, updateProfile, getMyCategories, updateCategories,
  createService, updateService, deleteService,
  getMyServices, setAvailability, getServiceBySlug, searchVendors, getAvailability,
} = require('../controllers/hostController');
const { changeUsername } = require('../controllers/usernameController');
const { protect, requireHost } = require('../middleware/authMiddleware');
const { attachPlan, checkServiceLimit } = require('../middleware/planMiddleware');
const { requireFeature } = require('../middleware/requireFeature');
const { validate, serviceWriteRules, updateProfileRules } = require('../middleware/validate');

router.get('/search', searchVendors);              // Task 11 — must come before /:username
router.get('/availability', protect, getAvailability); // GET current availability for dashboard
router.put('/profile', protect, requireHost, ...updateProfileRules, validate, updateProfile);
router.get('/categories', protect, getMyCategories);
router.put('/categories', protect, requireHost, attachPlan, updateCategories);
router.put('/username', protect, requireHost, changeUsername);  // gated, rate-limited username change
router.post('/services', protect, requireHost, requireFeature('services'), ...serviceWriteRules, validate, attachPlan, checkServiceLimit, createService);
router.get('/services', protect, getMyServices);
router.put('/services/:id', protect, requireHost, requireFeature('services'), ...serviceWriteRules, validate, updateService);
router.delete('/services/:id', protect, requireHost, deleteService);
router.put('/availability', protect, requireHost, requireFeature('availability_editor'), setAvailability);
router.get('/:username/:slug', getServiceBySlug);
router.get('/:username', getHostProfile);

module.exports = router;
