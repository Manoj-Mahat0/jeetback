const PriceCalculatorService = require('../services/PriceCalculatorService');

/**
 * Pricing Controller - Handles advanced pricing calculations
 */
class PricingController {
    /**
     * Calculate dynamic price for booking
     */
    static async calculateDynamicPrice(req, res) {
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
            console.error('Calculate dynamic price error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to calculate price',
                data: null
            });
        }
    }

    /**
     * Get price comparison for different durations
     */
    static async getPriceComparison(req, res) {
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
            console.error('Get price comparison error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to get price comparison',
                data: null
            });
        }
    }

    /**
     * Calculate price for specific time slot
     */
    static async calculateTimeSlotPrice(req, res) {
        try {
            const { vehicleType, startTime, endTime } = req.body;
            
            if (!vehicleType || !startTime || !endTime) {
                return res.status(400).json({
                    success: false,
                    message: 'Vehicle type, start time, and end time are required',
                    data: null
                });
            }

            const start = new Date(startTime);
            const end = new Date(endTime);
            
            if (start >= end) {
                return res.status(400).json({
                    success: false,
                    message: 'End time must be after start time',
                    data: null
                });
            }

            const pricing = await PriceCalculatorService.calculateTimeSlotPrice(
                vehicleType, 
                start, 
                end
            );
            
            res.status(pricing.success ? 200 : 500).json({
                success: pricing.success,
                message: pricing.success ? 'Time slot price calculated' : pricing.error,
                data: pricing.success ? pricing : null
            });
        } catch (error) {
            console.error('Calculate time slot price error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to calculate time slot price',
                data: null
            });
        }
    }

    /**
     * Get pricing recommendations for optimal booking
     */
    static async getPricingRecommendations(req, res) {
        try {
            const { vehicleType } = req.params;
            const { estimatedDuration } = req.query;
            
            const duration = estimatedDuration ? parseFloat(estimatedDuration) : 2;
            
            const recommendations = await PriceCalculatorService.getPricingRecommendations(
                vehicleType, 
                duration
            );
            
            res.status(recommendations.success ? 200 : 500).json({
                success: recommendations.success,
                message: recommendations.success ? 'Pricing recommendations retrieved' : recommendations.error,
                data: recommendations.success ? recommendations : null
            });
        } catch (error) {
            console.error('Get pricing recommendations error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to get pricing recommendations',
                data: null
            });
        }
    }

    /**
     * Get current pricing factors (for transparency)
     */
    static async getCurrentPricingFactors(req, res) {
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
            console.error('Get current pricing factors error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to get pricing factors',
                data: null
            });
        }
    }

    /**
     * Estimate total cost for a booking
     */
    static async estimateBookingCost(req, res) {
        try {
            const { vehicleType, estimatedDuration, preferredStartTime } = req.body;
            
            if (!vehicleType || !estimatedDuration) {
                return res.status(400).json({
                    success: false,
                    message: 'Vehicle type and estimated duration are required',
                    data: null
                });
            }

            const startTime = preferredStartTime ? new Date(preferredStartTime) : new Date();
            
            // Calculate pricing
            const pricing = await PriceCalculatorService.calculateDynamicPrice(
                vehicleType, 
                estimatedDuration, 
                startTime
            );

            if (!pricing.success) {
                return res.status(500).json({
                    success: false,
                    message: pricing.error,
                    data: null
                });
            }

            // Get alternative recommendations
            const recommendations = await PriceCalculatorService.getPricingRecommendations(
                vehicleType, 
                estimatedDuration
            );

            res.status(200).json({
                success: true,
                message: 'Booking cost estimated successfully',
                data: {
                    estimate: pricing.pricing,
                    alternatives: recommendations.success ? recommendations.recommendations.slice(0, 3) : [],
                    savings: recommendations.success ? {
                        bestTime: recommendations.bestTime,
                        potentialSavings: Math.max(0, pricing.pricing.totalPrice - recommendations.bestTime.price)
                    } : null
                }
            });
        } catch (error) {
            console.error('Estimate booking cost error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to estimate booking cost',
                data: null
            });
        }
    }
}

module.exports = PricingController;