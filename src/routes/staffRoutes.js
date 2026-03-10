const express = require('express');
const StaffController = require('../controllers/staffController');
const { verifyToken, checkRole } = require('../middlewares/auth');

const router = express.Router();

// All staff routes require Staff or Admin role
router.use(verifyToken, checkRole(['Staff', 'Admin']));

router.put('/check-in/:bookingId', StaffController.checkIn);
router.put('/check-out/:bookingId', StaffController.checkOut);
router.get('/active', StaffController.getActiveBookings);
router.get('/pending', StaffController.getPendingBookings);

module.exports = router;
