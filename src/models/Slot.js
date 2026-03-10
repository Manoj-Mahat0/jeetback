const mongoose = require('mongoose');

const slotSchema = new mongoose.Schema(
    {
        slotNumber: {
            type: String,
            required: [true, 'Slot number is required'],
            unique: true,
            trim: true,
        },
        status: {
            type: String,
            enum: ['Available', 'Booked', 'Occupied'],
            default: 'Available',
        },
        vehicleType: {
            type: String,
            enum: ['Car', 'Bike'],
            required: [true, 'Vehicle type is required'],
        },
        isDisabled: {
            type: Boolean,
            default: false,
        },
    },
    { timestamps: true }
);

module.exports = mongoose.model('Slot', slotSchema);
