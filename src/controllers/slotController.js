const SlotService = require('../services/SlotService');
const { validationResult } = require('express-validator');

class SlotController {
    static async getAll(req, res, next) {
        try {
            const slots = await SlotService.getAll();
            res.json({ success: true, message: 'Slots retrieved.', data: slots });
        } catch (error) {
            next(error);
        }
    }

    static async getAvailable(req, res, next) {
        try {
            const { vehicleType } = req.query;
            const slots = await SlotService.getAvailable(vehicleType);
            res.json({ success: true, message: 'Available slots retrieved.', data: slots });
        } catch (error) {
            next(error);
        }
    }

    static async create(req, res, next) {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ success: false, message: errors.array()[0].msg, data: null });
            }
            const slot = await SlotService.create(req.body);
            res.status(201).json({ success: true, message: 'Slot created successfully.', data: slot });
        } catch (error) {
            next(error);
        }
    }

    static async update(req, res, next) {
        try {
            const slot = await SlotService.update(req.params.id, req.body);
            res.json({ success: true, message: 'Slot updated.', data: slot });
        } catch (error) {
            next(error);
        }
    }

    static async delete(req, res, next) {
        try {
            await SlotService.delete(req.params.id);
            res.json({ success: true, message: 'Slot deleted.', data: null });
        } catch (error) {
            next(error);
        }
    }
}

module.exports = SlotController;
