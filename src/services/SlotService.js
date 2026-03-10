const Slot = require('../models/Slot');

/**
 * SlotService - Encapsulates parking slot CRUD operations
 */
class SlotService {
    /**
     * Get all parking slots
     * @returns {Array} slots
     */
    static async getAll() {
        return await Slot.find().sort({ slotNumber: 1 });
    }

    /**
     * Get available slots, optionally filtered by vehicle type
     * @param {String} vehicleType - optional filter
     * @returns {Array} available slots
     */
    static async getAvailable(vehicleType) {
        const filter = { status: 'Available', isDisabled: false };
        if (vehicleType) filter.vehicleType = vehicleType;
        return await Slot.find(filter).sort({ slotNumber: 1 });
    }

    /**
     * Create a new slot (Admin only)
     * @param {Object} slotData - { slotNumber, vehicleType }
     * @returns {Object} created slot
     */
    static async create({ slotNumber, vehicleType }) {
        const existing = await Slot.findOne({ slotNumber });
        if (existing) {
            const error = new Error(`Slot ${slotNumber} already exists.`);
            error.statusCode = 400;
            throw error;
        }
        return await Slot.create({ slotNumber, vehicleType });
    }

    /**
     * Update slot (Admin/Staff)
     * @param {String} slotId
     * @param {Object} updateData
     * @returns {Object} updated slot
     */
    static async update(slotId, updateData) {
        const slot = await Slot.findByIdAndUpdate(slotId, updateData, {
            new: true,
            runValidators: true,
        });
        if (!slot) {
            const error = new Error('Slot not found.');
            error.statusCode = 404;
            throw error;
        }
        return slot;
    }

    /**
     * Delete a slot (Admin only)
     * @param {String} slotId
     */
    static async delete(slotId) {
        const slot = await Slot.findByIdAndDelete(slotId);
        if (!slot) {
            const error = new Error('Slot not found.');
            error.statusCode = 404;
            throw error;
        }
        return slot;
    }
}

module.exports = SlotService;
