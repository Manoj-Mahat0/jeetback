const mongoose = require('mongoose');

const pricingSchema = new mongoose.Schema(
    {
        vehicleType: {
            type: String,
            enum: ['Car', 'Bike'],
            required: true,
            unique: true,
        },
        hourlyRate: {
            type: Number,
            required: [true, 'Hourly rate is required'],
            min: 0,
        },
    },
    { timestamps: true }
);

module.exports = mongoose.model('Pricing', pricingSchema);
