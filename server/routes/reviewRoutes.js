const express = require('express');
const router = express.Router();
const { createReview, getReceivedReviews, getHostReviews, getBookingReview } = require('../controllers/reviewController');
const { protect } = require('../middleware/authMiddleware');
const { requireFeature } = require('../middleware/requireFeature');

router.post('/', protect, requireFeature('review_submission'), createReview);
router.get('/received', protect, getReceivedReviews);
router.get('/booking/:id', protect, getBookingReview);
router.get('/:username', getHostReviews); // public — keep last (dynamic param)

module.exports = router;
