/**
 * exploreRoutes.js — Public Explore page endpoints
 * Mounted at /api/explore in server.js
 */
const router = require('express').Router();
const explore = require('../controllers/exploreController');

router.get('/',            explore.listVendors);
router.get('/featured',    explore.getFeatured);
router.get('/categories',  explore.getCategories);
router.get('/collections', explore.getCollections);
router.get('/sponsored',   explore.getSponsored);

module.exports = router;
