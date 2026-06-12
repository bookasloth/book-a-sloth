const express = require('express');
const router = express.Router();
const {
  createBooking, getHostBookings, getGuestBookings,
  cancelBooking, completeBooking, rescheduleBooking, confirmReschedule,
  getServiceById, getBookedSlots, getAvailableSlots,
} = require('../controllers/bookingController');
const { protect } = require('../middleware/authMiddleware');

router.get('/service/:id', getServiceById);
router.get('/slots', getBookedSlots);              // Task 3: ?host_id=&date= (legacy)
router.get('/available-slots', getAvailableSlots); // v2.5: server-computed availability
router.post('/', createBooking);
router.get('/host', protect, getHostBookings);
router.get('/guest', protect, getGuestBookings);
router.put('/:id/cancel', protect, cancelBooking);
router.put('/:id/complete', protect, completeBooking);
router.put('/:id/reschedule', protect, rescheduleBooking); // Task 5
router.get('/:id/confirm-reschedule', confirmReschedule);

module.exports = router;
