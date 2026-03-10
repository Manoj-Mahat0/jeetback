const express = require('express');
const PriceCalculatorService = require('../services/PriceCalculatorService');

const router = express.Router();

/**
 * Public Routes - No authentication required
 * Base path: /api/v1/public
 */

/**
 * Calculate dynamic price (Public access)
 */
const calculatePublicPrice = async (req, res) => {
    try {
        const { vehicleType, duration, startTime } = req.body;
        
        if (!vehicleType) {
            return res.status(400).json({
                success: false,
                message: 'Vehicle type is required',
                data: null
            });
        }

        const start = startTime ? new Date(startTime) : new Date();
        const pricing = await PriceCalculatorService.calculateDynamicPrice(
            vehicleType, 
            duration, 
            start
        );
        
        res.status(pricing.success ? 200 : 500).json({
            success: pricing.success,
            message: pricing.success ? 'Price calculated successfully' : pricing.error,
            data: pricing.success ? pricing.pricing : null
        });
    } catch (error) {
        console.error('Calculate public price error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to calculate price',
            data: null
        });
    }
};

/**
 * Get price comparison (Public access)
 */
const getPublicPriceComparison = async (req, res) => {
    try {
        const { vehicleType } = req.params;
        const { durations } = req.query;
        
        let durationArray = [1, 2, 4, 8, 12, 24]; // Default durations
        if (durations) {
            durationArray = durations.split(',').map(d => parseFloat(d));
        }
        
        const comparison = await PriceCalculatorService.getPriceComparison(
            vehicleType, 
            durationArray
        );
        
        res.status(comparison.success ? 200 : 500).json({
            success: comparison.success,
            message: comparison.success ? 'Price comparison retrieved' : comparison.error,
            data: comparison.success ? comparison : null
        });
    } catch (error) {
        console.error('Get public price comparison error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get price comparison',
            data: null
        });
    }
};

/**
 * Get current pricing factors (Public access)
 */
const getPublicPricingFactors = async (req, res) => {
    try {
        const { vehicleType } = req.params;
        
        // Get current pricing with breakdown
        const pricing = await PriceCalculatorService.calculateDynamicPrice(vehicleType, 1);
        
        if (!pricing.success) {
            return res.status(500).json({
                success: false,
                message: pricing.error,
                data: null
            });
        }

        res.status(200).json({
            success: true,
            message: 'Current pricing factors retrieved',
            data: {
                vehicleType,
                baseRate: pricing.pricing.baseRate,
                currentRate: pricing.pricing.finalRate,
                factors: pricing.pricing.factors,
                breakdown: pricing.pricing.breakdown,
                lastUpdated: new Date().toISOString()
            }
        });
    } catch (error) {
        console.error('Get public pricing factors error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get pricing factors',
            data: null
        });
    }
};

// Public pricing routes
router.post('/pricing/calculate', calculatePublicPrice);
router.get('/pricing/compare/:vehicleType', getPublicPriceComparison);
router.get('/pricing/factors/:vehicleType', getPublicPricingFactors);

module.exports = router;