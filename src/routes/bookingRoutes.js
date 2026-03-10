const express = require('express');
const BookingController = require('../controllers/bookingController');
const { verifyToken, checkRole } = require('../middlewares/auth');

const router = express.Router();

// User routes
router.post('/', verifyToken, checkRole(['User']), BookingController.bookSlot);
router.put('/:id/cancel', verifyToken, checkRole(['User']), BookingController.cancelBooking);
router.get('/my', verifyToken, BookingController.getMyBookings);

// Admin/Staff can view all bookings
router.get('/all', verifyToken, checkRole(['Admin', 'Staff']), BookingController.getAllBookings);

module.exports = router;
