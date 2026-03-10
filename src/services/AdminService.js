const Booking = require('../models/Booking');
const Slot = require('../models/Slot');
const User = require('../models/User');
const Pricing = require('../models/Pricing');

/**
 * AdminService - Dashboard analytics and admin management operations
 */
class AdminService {
    /**
     * Get dashboard statistics
     * @returns {Object} dashboard data
     */
    static async getDashboardStats() {
        const now = new Date();
        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const weekStart = new Date(todayStart);
        weekStart.setDate(weekStart.getDate() - 7);
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

        // Slot stats
        const totalSlots = await Slot.countDocuments({ isDisabled: false });
        const availableSlots = await Slot.countDocuments({ status: 'Available', isDisabled: false });
        const bookedSlots = await Slot.countDocuments({ status: 'Booked', isDisabled: false });
        const occupiedSlots = await Slot.countDocuments({ status: 'Occupied', isDisabled: false });

        // Booking stats
        const activeBookings = await Booking.countDocuments({
            status: { $in: ['Pending', 'Active'] },
        });
        const totalBookings = await Booking.countDocuments();

        // Revenue calculations
        const revenueToday = await AdminService.calcRevenue(todayStart, now);
        const revenueWeek = await AdminService.calcRevenue(weekStart, now);
        const revenueMonth = await AdminService.calcRevenue(monthStart, now);
        const revenueTotal = await AdminService.calcRevenue(new Date(0), now);

        // User stats
        const totalUsers = await User.countDocuments({ role: 'User' });
        const totalStaff = await User.countDocuments({ role: 'Staff' });

        return {
            slots: { total: totalSlots, available: availableSlots, booked: bookedSlots, occupied: occupiedSlots },
            bookings: { active: activeBookings, total: totalBookings },
            revenue: { today: revenueToday, week: revenueWeek, month: revenueMonth, total: revenueTotal },
            users: { total: totalUsers, staff: totalStaff },
        };
    }

    /**
     * Calculate total revenue in a date range
     */
    static async calcRevenue(from, to) {
        const result = await Booking.aggregate([
            {
                $match: {
                    status: 'Completed',
                    checkOutTime: { $gte: from, $lte: to },
                },
            },
            {
                $group: {
                    _id: null,
                    total: { $sum: '$totalAmount' },
                },
            },
        ]);
        return result.length > 0 ? result[0].total : 0;
    }

    /**
     * Get all users (for admin management)
     */
    static async getAllUsers() {
        return await User.find().select('-password').sort({ createdAt: -1 });
    }

    /**
     * Create a staff account (Admin only)
     */
    static async createStaffAccount({ name, email, password }) {
        const bcrypt = require('bcryptjs');
        const existing = await User.findOne({ email });
        if (existing) {
            const error = new Error('User with this email already exists.');
            error.statusCode = 400;
            throw error;
        }
        const salt = await bcrypt.genSalt(12);
        const hashedPassword = await bcrypt.hash(password, salt);
        return await User.create({
            name,
            email,
            password: hashedPassword,
            role: 'Staff',
        });
    }

    /**
     * Ban/Unban a user
     */
    static async toggleBan(userId) {
        const user = await User.findById(userId);
        if (!user) {
            const error = new Error('User not found.');
            error.statusCode = 404;
            throw error;
        }
        user.isBanned = !user.isBanned;
        await user.save();
        return user;
    }

    /**
     * Update pricing
     */
    static async updatePricing(vehicleType, hourlyRate) {
        const pricing = await Pricing.findOneAndUpdate(
            { vehicleType },
            { hourlyRate },
            { new: true, upsert: true, runValidators: true }
        );
        return pricing;
    }

    /**
     * Get all pricing
     */
    static async getPricing() {
        return await Pricing.find();
    }

    /**
     * Get recent transactions for reports
     */
    static async getRecentTransactions(limit = 50) {
        return await Booking.find({ status: 'Completed' })
            .populate('userId', 'name email vehicleNumber')
            .populate('slotId', 'slotNumber vehicleType')
            .sort({ checkOutTime: -1 })
            .limit(limit);
    }
}

module.exports = AdminService;
