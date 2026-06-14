const express = require('express');
const router = express.Router();
const {
  getHostProfile, updateProfile, createService, updateService, deleteService,
  getMyServices, setAvailability, getServiceBySlug, searchVendors, getAvailability,
} = require('../controllers/hostController');
const { protect } = require('../middleware/authMiddleware');
const { attachPlan, checkServiceLimit } = require('../middleware/planMiddleware');
const { requireFeature } = require('../middleware/requireFeature');

router.get('/search', searchVendors);              // Task 11 — must come before /:username
router.get('/availability', protect, getAvailability); // GET current availability for dashboard
router.put('/profile', protect, updateProfile);
router.post('/services', protect, requireFeature('services'), attachPlan, checkServiceLimit, createService);
router.get('/services', protect, getMyServices);
router.put('/services/:id', protect, requireFeature('services'), updateService);
router.delete('/services/:id', protect, deleteService);
router.put('/availability', protect, requireFeature('availability_editor'), setAvailability);
router.get('/:username/:slug', getServiceBySlug);
router.get('/:username', getHostProfile);

module.exports = router;
