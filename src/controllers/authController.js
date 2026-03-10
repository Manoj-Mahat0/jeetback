const AuthService = require('../services/AuthService');
const { validationResult } = require('express-validator');

class AuthController {
    static async register(req, res, next) {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ success: false, message: errors.array()[0].msg, data: null });
            }
            const result = await AuthService.register(req.body);
            res.status(201).json({ success: true, message: 'Registration successful.', data: result });
        } catch (error) {
            next(error);
        }
    }

    static async login(req, res, next) {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ success: false, message: errors.array()[0].msg, data: null });
            }
            const { email, password } = req.body;
            const result = await AuthService.login(email, password);
            res.json({ success: true, message: 'Login successful.', data: result });
        } catch (error) {
            next(error);
        }
    }

    static async getMe(req, res) {
        res.json({ success: true, message: 'Profile retrieved.', data: req.user });
    }
}

module.exports = AuthController;
