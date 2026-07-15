// crmRoutes.js — Studio Client CRM. Every route is Studio-gated (requireCrm) and
// host-scoped in the controller. attachPlan MUST run before requireCrm.
const express = require('express');
const router = express.Router();
const { protect, requireHost } = require('../middleware/authMiddleware');
const { attachPlan, requireCrm } = require('../middleware/planMiddleware');
const c = require('../controllers/crmController');

// Studio gate applied to the whole router.
router.use(protect, requireHost, attachPlan, requireCrm);

router.get('/customers.csv', c.exportCsv);
router.get('/customers', c.listCustomers);
router.get('/customers/:id', c.getCustomer);

router.get('/customers/:id/notes', c.listNotes);
router.post('/customers/:id/notes', c.addNote);
router.delete('/customers/:id/notes/:noteId', c.deleteNote);

router.patch('/customers/:id/attributes', c.patchAttributes);

router.post('/manual-booking', c.createManualBooking);

module.exports = router;
