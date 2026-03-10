const Booking = require('../models/Booking');
const Slot = require('../models/Slot');

/**
 * BookingService - Enforces booking rules and manages booking lifecycle
 */
class BookingService {
    /**
     * Book a slot for a user
     * Enforces: 1 active booking per user, no double-booking of slots
     * @param {String} userId
     * @param {String} slotId
     * @returns {Object} booking
     */
    static async bookSlot(userId, slotId) {
        // Rule: Only ONE active booking per user (Pending or Active)
        const activeBooking = await Booking.findOne({
            userId,
            status: { $in: ['Pending', 'Active'] },
        });
        if (activeBooking) {
            const error = new Error('You already have an active booking.');
            error.statusCode = 400;
            throw error;
        }

        // Check slot availability
        const slot = await Slot.findById(slotId);
        if (!slot) {
            const error = new Error('Slot not found.');
            error.statusCode = 404;
            throw error;
        }
        if (slot.status !== 'Available' || slot.isDisabled) {
            const error = new Error('This slot is not available for booking.');
            error.statusCode = 400;
            throw error;
        }

        // Create booking and update slot status
        const booking = await Booking.create({
            userId,
            slotId,
            bookingTime: new Date(),
            status: 'Pending',
        });

        slot.status = 'Booked';
        await slot.save();

        // Populate and return
        await booking.populate('slotId');
        return booking;
    }

    /**
     * Cancel a booking (only before check-in, i.e., status = Pending)
     * @param {String} bookingId
     * @param {String} userId
     * @returns {Object} cancelled booking
     */
    static async cancelBooking(bookingId, userId) {
        const booking = await Booking.findById(bookingId);
        if (!booking) {
            const error = new Error('Booking not found.');
            error.statusCode = 404;
            throw error;
        }

        // Ensure the user owns this booking
        if (booking.userId.toString() !== userId) {
            const error = new Error('You can only cancel your own bookings.');
            error.statusCode = 403;
            throw error;
        }

        if (booking.status !== 'Pending') {
            const error = new Error('Can only cancel bookings before check-in.');
            error.statusCode = 400;
            throw error;
        }

        // Cancel and reset slot
        booking.status = 'Cancelled';
        await booking.save();

        await Slot.findByIdAndUpdate(booking.slotId, { status: 'Available' });

        return booking;
    }

    /**
     * Get booking history for a user
     * @param {String} userId
     * @returns {Array} bookings
     */
    static async getUserBookings(userId) {
        return await Booking.find({ userId })
            .populate('slotId')
            .sort({ createdAt: -1 });
    }

    /**
     * Get all bookings (Admin/Staff)
     * @returns {Array} bookings
     */
    static async getAllBookings() {
        return await Booking.find()
            .populate('userId', 'name email vehicleNumber')
            .populate('slotId')
            .sort({ createdAt: -1 });
    }
}

module.exports = BookingService;
