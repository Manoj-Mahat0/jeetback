const BookingService = require('../services/BookingService');

class BookingController {
    static async bookSlot(req, res, next) {
        try {
            const booking = await BookingService.bookSlot(req.user._id, req.body.slotId);
            res.status(201).json({ success: true, message: 'Slot booked successfully.', data: booking });
        } catch (error) {
            next(error);
        }
    }

    static async cancelBooking(req, res, next) {
        try {
            const booking = await BookingService.cancelBooking(req.params.id, req.user._id.toString());
            res.json({ success: true, message: 'Booking cancelled.', data: booking });
        } catch (error) {
            next(error);
        }
    }

    static async getMyBookings(req, res, next) {
        try {
            const bookings = await BookingService.getUserBookings(req.user._id);
            res.json({ success: true, message: 'Bookings retrieved.', data: bookings });
        } catch (error) {
            next(error);
        }
    }

    static async getAllBookings(req, res, next) {
        try {
            const bookings = await BookingService.getAllBookings();
            res.json({ success: true, message: 'All bookings retrieved.', data: bookings });
        } catch (error) {
            next(error);
        }
    }
}

module.exports = BookingController;
