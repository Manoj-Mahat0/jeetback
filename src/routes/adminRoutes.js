const express = require('express');
const { body } = require('express-validator');
const AdminController = require('../controllers/adminController');
const { verifyToken, checkRole } = require('../middlewares/auth');

const router = express.Router();

// All admin routes require Admin role
router.use(verifyToken, checkRole(['Admin']));

router.get('/dashboard', AdminController.getDashboard);
router.get('/users', AdminController.getAllUsers);
router.post(
    '/staff',
    [
        body('name').trim().notEmpty().withMessage('Name is required.'),
        body('email').isEmail().withMessage('Valid email is required.'),
        body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters.'),
    ],
    AdminController.createStaff
);
router.put('/users/:userId/ban', AdminController.toggleBan);
router.get('/pricing', AdminController.getPricing);
router.put('/pricing', AdminController.updatePricing);
router.get('/transactions', AdminController.getTransactions);

module.exports = router;
