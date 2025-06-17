const express = require('express');
const router = express.Router();
const BookingCOntroller = require('../controllers/bookings.ctrl');
const Auth = require('../middleware/Authentication')
const RoleValidation = require('../middleware/RoleValidation');


router.post('/create', Auth, BookingCOntroller.createBooking);
router.get('/my-bookings', Auth, BookingCOntroller.myBookings);
router.get('/assigned-bookings', Auth, BookingCOntroller.assignedBookings);
router.put('/update-status/:bookingId', Auth, BookingCOntroller.updateBookingStatus);
router.get('/recent-bookings', Auth, BookingCOntroller.getRecentBookingByWorkerId);
router.get('/:bookingId', Auth, BookingCOntroller.getBookingById);
router.post('/reschedule/:bookingId', Auth, BookingCOntroller.rescheduleBooking);
router.get('/all', Auth, RoleValidation('admin'), BookingCOntroller.getAllBookings);
router.post('/verify-job/:bookingId', Auth, BookingCOntroller.verifyJobCode);
router.get('/stats/dashboard', Auth, RoleValidation('admin'), BookingCOntroller.getDashboardStats);

module.exports = router