const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * AuthService - Encapsulates authentication business logic
 */
class AuthService {
    /**
     * Register a new user
     * @param {Object} userData - { name, email, password, vehicleNumber }
     * @returns {Object} { user, token }
     */
    static async register({ name, email, password, vehicleNumber }) {
        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            const error = new Error('User with this email already exists.');
            error.statusCode = 400;
            throw error;
        }

        // Hash password
        const salt = await bcrypt.genSalt(12);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Create user
        const user = await User.create({
            name,
            email,
            password: hashedPassword,
            vehicleNumber: vehicleNumber || '',
            role: 'User',
        });

        // Generate JWT
        const token = AuthService.generateToken(user);

        return {
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                vehicleNumber: user.vehicleNumber,
            },
            token,
        };
    }

    /**
     * Login an existing user
     * @param {String} email
     * @param {String} password
     * @returns {Object} { user, token }
     */
    static async login(email, password) {
        // Find user
        const user = await User.findOne({ email });
        if (!user) {
            const error = new Error('Invalid email or password.');
            error.statusCode = 401;
            throw error;
        }

        if (user.isBanned) {
            const error = new Error('Your account has been suspended.');
            error.statusCode = 403;
            throw error;
        }

        // Verify password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            const error = new Error('Invalid email or password.');
            error.statusCode = 401;
            throw error;
        }

        // Generate JWT
        const token = AuthService.generateToken(user);

        return {
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                vehicleNumber: user.vehicleNumber,
            },
            token,
        };
    }

    /**
     * Generate JWT token
     * @param {Object} user
     * @returns {String} token
     */
    static generateToken(user) {
        return jwt.sign(
            { id: user._id, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
        );
    }
}

module.exports = AuthService;
