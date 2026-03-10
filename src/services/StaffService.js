const Booking = require('../models/Booking');
const Slot = require('../models/Slot');
const Pricing = require('../models/Pricing');
const BillingHelper = require('../utils/BillingHelper');

/**
 * StaffService - Check-in and Check-out operations for parking staff
 */
class StaffService {
    /**
     * Check-in: Mark booking as Active, slot as Occupied
     * @param {String} bookingId
     * @returns {Object} updated booking
     */
    static async checkIn(bookingId) {
        const booking = await Booking.findById(bookingId).populate('slotId');
        if (!booking) {
            const error = new Error('Booking not found.');
            error.statusCode = 404;
            throw error;
        }

        if (booking.status !== 'Pending') {
            const error = new Error('Only pending bookings can be checked in.');
            error.statusCode = 400;
            throw error;
        }

        // Update booking
        booking.status = 'Active';
        booking.checkInTime = new Date();
        await booking.save();

        // Update slot
        await Slot.findByIdAndUpdate(booking.slotId._id, { status: 'Occupied' });

        await booking.populate('userId', 'name email vehicleNumber');
        return booking;
    }

    /**
     * Check-out: Calculate billing, mark booking Completed, slot Available
     * @param {String} bookingId
     * @returns {Object} booking with billing info
     */
    static async checkOut(bookingId) {
        const booking = await Booking.findById(bookingId)
            .populate('slotId')
            .populate('userId', 'name email vehicleNumber');

        if (!booking) {
            const error = new Error('Booking not found.');
            error.statusCode = 404;
            throw error;
        }

        if (booking.status !== 'Active') {
            const error = new Error('Only active bookings can be checked out.');
            error.statusCode = 400;
            throw error;
        }

        // Get pricing for this vehicle type
        const pricing = await Pricing.findOne({
            vehicleType: booking.slotId.vehicleType,
        });
        if (!pricing) {
            const error = new Error(
                `No pricing configured for ${booking.slotId.vehicleType}. Please contact admin.`
            );
            error.statusCode = 400;
            throw error;
        }

        // Calculate bill
        const checkOutTime = new Date();
        const { durationHours, totalAmount } = BillingHelper.calculate(
            booking.checkInTime,
            checkOutTime,
            pricing.hourlyRate
        );

        // Update booking
        booking.checkOutTime = checkOutTime;
        booking.totalAmount = totalAmount;
        booking.status = 'Completed';
        await booking.save();

        // Reset slot to Available
        await Slot.findByIdAndUpdate(booking.slotId._id, { status: 'Available' });

        return {
            booking,
            billing: {
                durationHours,
                hourlyRate: pricing.hourlyRate,
                totalAmount,
            },
        };
    }

    /**
     * Get all active (occupied) bookings for monitoring
     * @returns {Array} active bookings
     */
    static async getActiveBookings() {
        return await Booking.find({ status: 'Active' })
            .populate('userId', 'name email vehicleNumber')
            .populate('slotId')
            .sort({ checkInTime: -1 });
    }

    /**
     * Get all pending bookings awaiting check-in
     * @returns {Array} pending bookings
     */
    static async getPendingBookings() {
        return await Booking.find({ status: 'Pending' })
            .populate('userId', 'name email vehicleNumber')
            .populate('slotId')
            .sort({ bookingTime: -1 });
    }
}

module.exports = StaffService;
