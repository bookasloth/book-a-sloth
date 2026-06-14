const express = require('express');
const router = express.Router();
const { createReview, getHostReviews, getBookingReview } = require('../controllers/reviewController');
const { protect } = require('../middleware/authMiddleware');
const { requireFeature } = require('../middleware/requireFeature');

router.post('/', protect, requireFeature('review_submission'), createReview);
router.get('/booking/:id', protect, getBookingReview);
router.get('/:username', getHostReviews);

module.exports = router;
