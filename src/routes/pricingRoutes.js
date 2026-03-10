const express = require('express');
const PricingController = require('../controllers/pricingController');
const { verifyToken, checkRole } = require('../middlewares/auth');

const router = express.Router();

/**
 * Advanced Pricing Routes
 * Base path: /api/v1/pricing
 */

// Calculate dynamic price (All authenticated users)
router.post('/calculate', verifyToken, PricingController.calculateDynamicPrice);

// Get price comparison for different durations (All authenticated users)
router.get('/compare/:vehicleType', verifyToken, PricingController.getPriceComparison);

// Calculate price for specific time slot (All authenticated users)
router.post('/timeslot', verifyToken, PricingController.calculateTimeSlotPrice);

// Get pricing recommendations (All authenticated users)
router.get('/recommendations/:vehicleType', verifyToken, PricingController.getPricingRecommendations);

// Get current pricing factors (All authenticated users)
router.get('/factors/:vehicleType', verifyToken, PricingController.getCurrentPricingFactors);

// Estimate booking cost (All authenticated users)
router.post('/estimate', verifyToken, PricingController.estimateBookingCost);

module.exports = router;