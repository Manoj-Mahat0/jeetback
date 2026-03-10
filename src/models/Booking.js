const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        slotId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Slot',
            required: true,
        },
        bookingTime: {
            type: Date,
            default: Date.now,
        },
        checkInTime: {
            type: Date,
            default: null,
        },
        checkOutTime: {
            type: Date,
            default: null,
        },
        status: {
            type: String,
            enum: ['Pending', 'Active', 'Completed', 'Cancelled'],
            default: 'Pending',
        },
        totalAmount: {
            type: Number,
            default: 0,
        },
    },
    { timestamps: true }
);

module.exports = mongoose.model('Booking', bookingSchema);
