const express = require('express');
const { body } = require('express-validator');
const AuthController = require('../controllers/authController');
const { verifyToken } = require('../middlewares/auth');

const router = express.Router();

router.post(
    '/register',
    [
        body('name').trim().notEmpty().withMessage('Name is required.'),
        body('email').isEmail().withMessage('Valid email is required.'),
        body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters.'),
    ],
    AuthController.register
);

router.post(
    '/login',
    [
        body('email').isEmail().withMessage('Valid email is required.'),
        body('password').notEmpty().withMessage('Password is required.'),
    ],
    AuthController.login
);

router.get('/me', verifyToken, AuthController.getMe);

module.exports = router;
