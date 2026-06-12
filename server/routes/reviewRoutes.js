const express = require('express');
const router = express.Router();
const { createReview, getHostReviews, getBookingReview } = require('../controllers/reviewController');
const { protect } = require('../middleware/authMiddleware');

router.post('/', protect, createReview);
router.get('/booking/:id', protect, getBookingReview);
router.get('/:username', getHostReviews);

module.exports = router;
