const express = require('express');
const { body } = require('express-validator');
const SlotController = require('../controllers/slotController');
const { verifyToken, checkRole } = require('../middlewares/auth');

const router = express.Router();

// All authenticated users can view slots
router.get('/', verifyToken, SlotController.getAll);
router.get('/available', verifyToken, SlotController.getAvailable);

// Admin only - create and delete
router.post(
    '/',
    verifyToken,
    checkRole(['Admin']),
    [
        body('slotNumber').trim().notEmpty().withMessage('Slot number is required.'),
        body('vehicleType').isIn(['Car', 'Bike']).withMessage('Vehicle type must be Car or Bike.'),
    ],
    SlotController.create
);

router.put('/:id', verifyToken, checkRole(['Admin', 'Staff']), SlotController.update);
router.delete('/:id', verifyToken, checkRole(['Admin']), SlotController.delete);

module.exports = router;
