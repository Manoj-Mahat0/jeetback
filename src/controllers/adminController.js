const AdminService = require('../services/AdminService');
const { validationResult } = require('express-validator');

class AdminController {
    static async getDashboard(req, res, next) {
        try {
            const stats = await AdminService.getDashboardStats();
            res.json({ success: true, message: 'Dashboard stats retrieved.', data: stats });
        } catch (error) {
            next(error);
        }
    }

    static async getAllUsers(req, res, next) {
        try {
            const users = await AdminService.getAllUsers();
            res.json({ success: true, message: 'Users retrieved.', data: users });
        } catch (error) {
            next(error);
        }
    }

    static async createStaff(req, res, next) {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ success: false, message: errors.array()[0].msg, data: null });
            }
            const staff = await AdminService.createStaffAccount(req.body);
            res.status(201).json({
                success: true,
                message: 'Staff account created.',
                data: { id: staff._id, name: staff.name, email: staff.email, role: staff.role },
            });
        } catch (error) {
            next(error);
        }
    }

    static async toggleBan(req, res, next) {
        try {
            const user = await AdminService.toggleBan(req.params.userId);
            res.json({
                success: true,
                message: user.isBanned ? 'User banned.' : 'User unbanned.',
                data: { id: user._id, name: user.name, isBanned: user.isBanned },
            });
        } catch (error) {
            next(error);
        }
    }

    static async updatePricing(req, res, next) {
        try {
            const { vehicleType, hourlyRate } = req.body;
            const pricing = await AdminService.updatePricing(vehicleType, hourlyRate);
            res.json({ success: true, message: 'Pricing updated.', data: pricing });
        } catch (error) {
            next(error);
        }
    }

    static async getPricing(req, res, next) {
        try {
            const pricing = await AdminService.getPricing();
            res.json({ success: true, message: 'Pricing retrieved.', data: pricing });
        } catch (error) {
            next(error);
        }
    }

    static async getTransactions(req, res, next) {
        try {
            const transactions = await AdminService.getRecentTransactions();
            res.json({ success: true, message: 'Transactions retrieved.', data: transactions });
        } catch (error) {
            next(error);
        }
    }
}

module.exports = AdminController;
