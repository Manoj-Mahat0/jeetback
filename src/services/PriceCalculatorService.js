const Pricing = require('../models/Pricing');
const Booking = require('../models/Booking');
const Slot = require('../models/Slot');

/**
 * PriceCalculatorService - Advanced pricing with dynamic calculations
 */
class PriceCalculatorService {
    /**
     * Calculate dynamic price based on demand, time, and other factors
     * @param {String} vehicleType 
     * @param {Number} duration 
     * @param {Date} startTime 
     * @returns {Object} pricing breakdown
     */
    static async calculateDynamicPrice(vehicleType, duration = 1, startTime = new Date()) {
        try {
            // Get base pricing
            const basePricing = await Pricing.findOne({ vehicleType });
            if (!basePricing) {
                throw new Error(`Pricing not found for vehicle type: ${vehicleType}`);
            }

            const baseRate = basePricing.hourlyRate;
            
            // Calculate various pricing factors
            const demandMultiplier = await this._calculateDemandMultiplier();
            const timeMultiplier = this._calculateTimeMultiplier(startTime);
            const durationDiscount = this._calculateDurationDiscount(duration);
            const seasonalMultiplier = this._calculateSeasonalMultiplier(startTime);
            
            // Apply minimum duration (1 hour)
            const billableDuration = Math.max(1, Math.ceil(duration));
            
            // Calculate final price
            let finalRate = baseRate * demandMultiplier * timeMultiplier * seasonalMultiplier;
            let totalPrice = finalRate * billableDuration;
            
            // Apply duration discount
            totalPrice = totalPrice * (1 - durationDiscount);
            
            // Round to 2 decimal places
            totalPrice = Math.round(totalPrice * 100) / 100;
            finalRate = Math.round(finalRate * 100) / 100;

            return {
                success: true,
                pricing: {
                    baseRate,
                    finalRate,
                    duration: billableDuration,
                    totalPrice,
                    breakdown: {
                        baseAmount: baseRate * billableDuration,
                        demandSurcharge: (demandMultiplier - 1) * baseRate * billableDuration,
                        timeSurcharge: (timeMultiplier - 1) * baseRate * billableDuration,
                        seasonalAdjustment: (seasonalMultiplier - 1) * baseRate * billableDuration,
                        durationDiscount: durationDiscount * finalRate * billableDuration
                    },
                    factors: {
                        demandMultiplier: Math.round(demandMultiplier * 100) / 100,
                        timeMultiplier: Math.round(timeMultiplier * 100) / 100,
                        durationDiscount: Math.round(durationDiscount * 100) / 100,
                        seasonalMultiplier: Math.round(seasonalMultiplier * 100) / 100
                    }
                }
            };
        } catch (error) {
            console.error('Price calculation error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Get price comparison for different durations
     * @param {String} vehicleType 
     * @param {Array} durations 
     * @returns {Object} price comparison
     */
    static async getPriceComparison(vehicleType, durations = [1, 2, 4, 8, 12, 24]) {
        try {
            const comparisons = [];
            
            for (const duration of durations) {
                const pricing = await this.calculateDynamicPrice(vehicleType, duration);
                if (pricing.success) {
                    comparisons.push({
                        duration,
                        totalPrice: pricing.pricing.totalPrice,
                        hourlyRate: pricing.pricing.finalRate,
                        savings: duration > 1 ? this._calculateSavings(pricing.pricing.totalPrice, duration, pricing.pricing.baseRate) : 0
                    });
                }
            }

            return {
                success: true,
                vehicleType,
                comparisons,
                bestValue: this._findBestValue(comparisons)
            };
        } catch (error) {
            console.error('Price comparison error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Calculate price for specific time slots
     * @param {String} vehicleType 
     * @param {Date} startTime 
     * @param {Date} endTime 
     * @returns {Object} time-based pricing
     */
    static async calculateTimeSlotPrice(vehicleType, startTime, endTime) {
        try {
            const duration = (endTime - startTime) / (1000 * 60 * 60); // hours
            
            if (duration <= 0) {
                throw new Error('Invalid time range');
            }

            const pricing = await this.calculateDynamicPrice(vehicleType, duration, startTime);
            
            if (!pricing.success) {
                return pricing;
            }

            // Add time slot specific information
            const timeSlotInfo = {
                startTime: startTime.toISOString(),
                endTime: endTime.toISOString(),
                duration: Math.round(duration * 100) / 100,
                peakHours: this._identifyPeakHours(startTime, endTime),
                congestionLevel: await this._getCongestionLevel(startTime)
            };

            return {
                ...pricing,
                timeSlotInfo
            };
        } catch (error) {
            console.error('Time slot pricing error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Get pricing recommendations for optimal booking
     * @param {String} vehicleType 
     * @param {Number} estimatedDuration 
     * @returns {Object} pricing recommendations
     */
    static async getPricingRecommendations(vehicleType, estimatedDuration = 2) {
        try {
            const currentTime = new Date();
            const recommendations = [];

            // Check next 24 hours in 2-hour intervals
            for (let i = 0; i < 24; i += 2) {
                const startTime = new Date(currentTime.getTime() + i * 60 * 60 * 1000);
                const pricing = await this.calculateDynamicPrice(vehicleType, estimatedDuration, startTime);
                
                if (pricing.success) {
                    recommendations.push({
                        startTime: startTime.toISOString(),
                        price: pricing.pricing.totalPrice,
                        savings: 0, // Will be calculated relative to current price
                        demandLevel: this._getDemandLevel(pricing.pricing.factors.demandMultiplier),
                        recommendation: this._getRecommendationLevel(pricing.pricing.factors)
                    });
                }
            }

            // Calculate savings relative to current price
            const currentPrice = recommendations[0]?.price || 0;
            recommendations.forEach(rec => {
                rec.savings = Math.round((currentPrice - rec.price) * 100) / 100;
            });

            // Sort by best value (lowest price)
            recommendations.sort((a, b) => a.price - b.price);

            return {
                success: true,
                vehicleType,
                estimatedDuration,
                currentPrice,
                recommendations: recommendations.slice(0, 10), // Top 10 recommendations
                bestTime: recommendations[0],
                worstTime: recommendations[recommendations.length - 1]
            };
        } catch (error) {
            console.error('Pricing recommendations error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    // Private helper methods
    static async _calculateDemandMultiplier() {
        try {
            // Get current occupancy rate
            const totalSlots = await Slot.countDocuments({ isDisabled: false });
            const occupiedSlots = await Slot.countDocuments({ status: { $in: ['Booked', 'Occupied'] } });
            
            const occupancyRate = totalSlots > 0 ? occupiedSlots / totalSlots : 0;
            
            // Demand-based pricing multiplier
            if (occupancyRate >= 0.9) return 1.5;      // 50% surcharge when 90%+ occupied
            if (occupancyRate >= 0.8) return 1.3;      // 30% surcharge when 80%+ occupied
            if (occupancyRate >= 0.7) return 1.2;      // 20% surcharge when 70%+ occupied
            if (occupancyRate >= 0.5) return 1.1;      // 10% surcharge when 50%+ occupied
            if (occupancyRate <= 0.2) return 0.9;      // 10% discount when low demand
            
            return 1.0; // No adjustment for normal demand
        } catch (error) {
            console.error('Demand calculation error:', error);
            return 1.0;
        }
    }

    static _calculateTimeMultiplier(startTime) {
        const hour = startTime.getHours();
        const day = startTime.getDay(); // 0 = Sunday, 6 = Saturday
        
        // Peak hours (higher rates)
        const peakHours = [8, 9, 10, 12, 13, 14, 17, 18, 19];
        const offPeakHours = [0, 1, 2, 3, 4, 5, 6, 22, 23];
        
        // Weekend adjustment
        const isWeekend = day === 0 || day === 6;
        
        if (peakHours.includes(hour)) {
            return isWeekend ? 1.1 : 1.2; // Lower peak surcharge on weekends
        } else if (offPeakHours.includes(hour)) {
            return 0.8; // Off-peak discount
        }
        
        return isWeekend ? 0.95 : 1.0; // Slight weekend discount for normal hours
    }

    static _calculateDurationDiscount(duration) {
        // Longer stays get better rates
        if (duration >= 24) return 0.2;    // 20% discount for full day
        if (duration >= 12) return 0.15;   // 15% discount for half day
        if (duration >= 8) return 0.1;     // 10% discount for 8+ hours
        if (duration >= 4) return 0.05;    // 5% discount for 4+ hours
        
        return 0; // No discount for short stays
    }

    static _calculateSeasonalMultiplier(startTime) {
        const month = startTime.getMonth(); // 0-11
        
        // Seasonal adjustments (example: higher rates during exam periods)
        const highDemandMonths = [3, 4, 10, 11]; // April, May, November, December
        const lowDemandMonths = [5, 6, 7]; // June, July, August (summer break)
        
        if (highDemandMonths.includes(month)) return 1.1;
        if (lowDemandMonths.includes(month)) return 0.9;
        
        return 1.0;
    }

    static _calculateSavings(totalPrice, duration, baseRate) {
        const standardPrice = baseRate * duration;
        return Math.round((standardPrice - totalPrice) * 100) / 100;
    }

    static _findBestValue(comparisons) {
        if (comparisons.length === 0) return null;
        
        // Find the option with best price per hour considering discounts
        return comparisons.reduce((best, current) => {
            const currentValue = current.totalPrice / current.duration;
            const bestValue = best.totalPrice / best.duration;
            return currentValue < bestValue ? current : best;
        });
    }

    static _identifyPeakHours(startTime, endTime) {
        const peakHours = [8, 9, 10, 12, 13, 14, 17, 18, 19];
        const startHour = startTime.getHours();
        const endHour = endTime.getHours();
        
        const hoursInRange = [];
        for (let hour = startHour; hour <= endHour; hour++) {
            hoursInRange.push(hour);
        }
        
        return hoursInRange.filter(hour => peakHours.includes(hour));
    }

    static async _getCongestionLevel(startTime) {
        try {
            const hour = startTime.getHours();
            
            // Get historical booking data for this hour
            const bookingsAtHour = await Booking.countDocuments({
                bookingTime: {
                    $gte: new Date(startTime.getFullYear(), startTime.getMonth(), startTime.getDate(), hour),
                    $lt: new Date(startTime.getFullYear(), startTime.getMonth(), startTime.getDate(), hour + 1)
                }
            });
            
            if (bookingsAtHour >= 20) return 'Very High';
            if (bookingsAtHour >= 15) return 'High';
            if (bookingsAtHour >= 10) return 'Medium';
            if (bookingsAtHour >= 5) return 'Low';
            return 'Very Low';
        } catch (error) {
            return 'Unknown';
        }
    }

    static _getDemandLevel(demandMultiplier) {
        if (demandMultiplier >= 1.4) return 'Very High';
        if (demandMultiplier >= 1.2) return 'High';
        if (demandMultiplier >= 1.1) return 'Medium';
        if (demandMultiplier <= 0.9) return 'Low';
        return 'Normal';
    }

    static _getRecommendationLevel(factors) {
        const { demandMultiplier, timeMultiplier, durationDiscount } = factors;
        
        const score = (2 - demandMultiplier) + (2 - timeMultiplier) + durationDiscount;
        
        if (score >= 1.5) return 'Excellent';
        if (score >= 1.0) return 'Good';
        if (score >= 0.5) return 'Fair';
        return 'Poor';
    }
}

module.exports = PriceCalculatorService;