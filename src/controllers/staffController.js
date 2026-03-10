const StaffService = require('../services/StaffService');

class StaffController {
    static async checkIn(req, res, next) {
        try {
            const booking = await StaffService.checkIn(req.params.bookingId);
            res.json({ success: true, message: 'Check-in successful.', data: booking });
        } catch (error) {
            next(error);
        }
    }

    static async checkOut(req, res, next) {
        try {
            const result = await StaffService.checkOut(req.params.bookingId);
            res.json({ success: true, message: 'Check-out successful. Bill generated.', data: result });
        } catch (error) {
            next(error);
        }
    }

    static async getActiveBookings(req, res, next) {
        try {
            const bookings = await StaffService.getActiveBookings();
            res.json({ success: true, message: 'Active bookings retrieved.', data: bookings });
        } catch (error) {
            next(error);
        }
    }

    static async getPendingBookings(req, res, next) {
        try {
            const bookings = await StaffService.getPendingBookings();
            res.json({ success: true, message: 'Pending bookings retrieved.', data: bookings });
        } catch (error) {
            next(error);
        }
    }
}

module.exports = StaffController;
