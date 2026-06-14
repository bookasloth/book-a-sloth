const express = require('express');
const router = express.Router();
const {
  createBooking, getHostBookings, getGuestBookings,
  cancelBooking, completeBooking, rescheduleBooking, confirmReschedule,
  getServiceById, getBookedSlots, getAvailableSlots,
} = require('../controllers/bookingController');
const { protect, optionalProtect } = require('../middleware/authMiddleware');
const { requireFeature } = require('../middleware/requireFeature');

router.get('/service/:id', getServiceById);
router.get('/slots', getBookedSlots);              // Task 3: ?host_id=&date= (legacy)
router.get('/available-slots', getAvailableSlots); // v2.5: server-computed availability
// optionalProtect: sets req.user if logged in; createBooking derives guest_id
// server-side and never trusts a client-supplied id.
router.post('/', optionalProtect, requireFeature('guest_booking'), createBooking);
router.get('/host', protect, getHostBookings);
router.get('/guest', protect, getGuestBookings);
router.put('/:id/cancel', protect, cancelBooking);
router.put('/:id/complete', protect, completeBooking);
router.put('/:id/reschedule', protect, requireFeature('reschedule'), rescheduleBooking); // Task 5
router.get('/:id/confirm-reschedule', requireFeature('reschedule'), confirmReschedule);

module.exports = router;
