const Booking = require('../models/Booking');
const Slot = require('../models/Slot');
const User = require('../models/User');

/**
 * AIRecommendationService - Provides intelligent parking recommendations
 */
class AIRecommendationService {
    /**
     * Get personalized slot recommendations for a user
     * @param {String} userId 
     * @returns {Array} recommended slots with scores
     */
    static async getPersonalizedRecommendations(userId) {
        try {
            // Get user's booking history
            const userBookings = await Booking.find({ userId })
                .populate('slotId')
                .sort({ bookingTime: -1 })
                .limit(20);

            // Get all available slots
            const availableSlots = await Slot.find({ 
                status: 'Available', 
                isDisabled: false 
            });

            if (availableSlots.length === 0) {
                return [];
            }

            // Calculate recommendations based on user patterns
            const recommendations = await this._calculateRecommendationScores(
                userBookings, 
                availableSlots, 
                userId
            );

            return recommendations.sort((a, b) => b.score - a.score).slice(0, 5);
        } catch (error) {
            console.error('AI Recommendation Error:', error);
            return [];
        }
    }

    /**
     * Predict slot availability for next few hours
     * @param {String} slotId 
     * @returns {Object} availability prediction
     */
    static async predictSlotAvailability(slotId) {
        try {
            const slot = await Slot.findById(slotId);
            if (!slot) return null;

            // Get historical booking patterns for this slot
            const historicalBookings = await Booking.find({ 
                slotId,
                status: 'Completed'
            }).sort({ bookingTime: -1 }).limit(50);

            const currentHour = new Date().getHours();
            const currentDay = new Date().getDay();

            // Calculate probability based on historical patterns
            const probability = this._calculateAvailabilityProbability(
                historicalBookings, 
                currentHour, 
                currentDay
            );

            return {
                slotId,
                slotNumber: slot.slotNumber,
                currentStatus: slot.status,
                availabilityProbability: probability,
                recommendedBookingTime: this._getOptimalBookingTime(historicalBookings),
                peakHours: this._identifyPeakHours(historicalBookings)
            };
        } catch (error) {
            console.error('Availability Prediction Error:', error);
            return null;
        }
    }

    /**
     * Get smart parking insights for dashboard
     * @returns {Object} parking insights
     */
    static async getParkingInsights() {
        try {
            const now = new Date();
            const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            
            // Current occupancy
            const totalSlots = await Slot.countDocuments({ isDisabled: false });
            const occupiedSlots = await Slot.countDocuments({ status: 'Occupied' });
            const occupancyRate = (occupiedSlots / totalSlots) * 100;

            // Today's bookings
            const todayBookings = await Booking.countDocuments({
                bookingTime: { $gte: todayStart }
            });

            // Peak hours analysis
            const peakHours = await this._analyzePeakHours();
            
            // Demand forecast
            const demandForecast = await this._forecastDemand();

            return {
                occupancyRate: Math.round(occupancyRate * 100) / 100,
                totalSlots,
                occupiedSlots,
                availableSlots: totalSlots - occupiedSlots,
                todayBookings,
                peakHours,
                demandForecast,
                recommendations: {
                    bestTimeToBook: this._getBestBookingTime(peakHours),
                    congestionLevel: this._getCongestionLevel(occupancyRate),
                    waitTime: this._estimateWaitTime(occupancyRate)
                }
            };
        } catch (error) {
            console.error('Parking Insights Error:', error);
            return null;
        }
    }

    // Private helper methods
    static async _calculateRecommendationScores(userBookings, availableSlots, userId) {
        const user = await User.findById(userId);
        const userPreferences = this._analyzeUserPreferences(userBookings);
        
        return availableSlots.map(slot => {
            let score = 50; // Base score

            // Preference-based scoring
            if (userPreferences.preferredVehicleType === slot.vehicleType) {
                score += 20;
            }

            // Location preference (based on slot number patterns)
            if (userPreferences.preferredZones.includes(slot.slotNumber.charAt(0))) {
                score += 15;
            }

            // Time-based scoring
            const currentHour = new Date().getHours();
            if (userPreferences.preferredHours.includes(currentHour)) {
                score += 10;
            }

            // Availability confidence
            score += Math.random() * 10; // Add some randomness for variety

            return {
                slot,
                score: Math.min(100, Math.max(0, score)),
                reasons: this._generateRecommendationReasons(slot, userPreferences)
            };
        });
    }

    static _analyzeUserPreferences(bookings) {
        const preferences = {
            preferredVehicleType: 'Car',
            preferredZones: [],
            preferredHours: [],
            avgDuration: 0
        };

        if (bookings.length === 0) return preferences;

        // Analyze vehicle type preference
        const vehicleTypes = bookings.map(b => b.slotId?.vehicleType).filter(Boolean);
        preferences.preferredVehicleType = this._getMostFrequent(vehicleTypes) || 'Car';

        // Analyze zone preferences
        const zones = bookings.map(b => b.slotId?.slotNumber?.charAt(0)).filter(Boolean);
        preferences.preferredZones = [...new Set(zones)].slice(0, 3);

        // Analyze time preferences
        const hours = bookings.map(b => new Date(b.bookingTime).getHours());
        preferences.preferredHours = this._getFrequentHours(hours);

        return preferences;
    }

    static _calculateAvailabilityProbability(bookings, currentHour, currentDay) {
        if (bookings.length === 0) return 0.7; // Default probability

        const relevantBookings = bookings.filter(booking => {
            const bookingHour = new Date(booking.bookingTime).getHours();
            const bookingDay = new Date(booking.bookingTime).getDay();
            return Math.abs(bookingHour - currentHour) <= 1 && bookingDay === currentDay;
        });

        const totalRelevant = relevantBookings.length;
        const totalPossible = Math.min(bookings.length, 20); // Consider last 20 bookings

        return Math.max(0.1, 1 - (totalRelevant / totalPossible));
    }

    static _getMostFrequent(arr) {
        return arr.sort((a, b) =>
            arr.filter(v => v === a).length - arr.filter(v => v === b).length
        ).pop();
    }

    static _getFrequentHours(hours) {
        const hourCounts = {};
        hours.forEach(hour => {
            hourCounts[hour] = (hourCounts[hour] || 0) + 1;
        });

        return Object.entries(hourCounts)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 3)
            .map(([hour]) => parseInt(hour));
    }

    static async _analyzePeakHours() {
        const bookings = await Booking.find({
            bookingTime: { 
                $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Last 7 days
            }
        });

        const hourCounts = {};
        bookings.forEach(booking => {
            const hour = new Date(booking.bookingTime).getHours();
            hourCounts[hour] = (hourCounts[hour] || 0) + 1;
        });

        return Object.entries(hourCounts)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 5)
            .map(([hour, count]) => ({ hour: parseInt(hour), bookings: count }));
    }

    static async _forecastDemand() {
        const currentHour = new Date().getHours();
        const nextHours = [];

        for (let i = 1; i <= 6; i++) {
            const hour = (currentHour + i) % 24;
            const demand = await this._predictHourlyDemand(hour);
            nextHours.push({ hour, demandLevel: demand });
        }

        return nextHours;
    }

    static async _predictHourlyDemand(hour) {
        // Simple demand prediction based on historical patterns
        const peakHours = [8, 9, 10, 12, 13, 14, 17, 18, 19];
        const moderateHours = [7, 11, 15, 16, 20];
        
        if (peakHours.includes(hour)) return 'High';
        if (moderateHours.includes(hour)) return 'Medium';
        return 'Low';
    }

    static _getBestBookingTime(peakHours) {
        const currentHour = new Date().getHours();
        const peakHoursList = peakHours.map(p => p.hour);
        
        // Find next non-peak hour
        for (let i = 1; i <= 12; i++) {
            const nextHour = (currentHour + i) % 24;
            if (!peakHoursList.includes(nextHour)) {
                return `${nextHour}:00`;
            }
        }
        return 'Now';
    }

    static _getCongestionLevel(occupancyRate) {
        if (occupancyRate >= 90) return 'Very High';
        if (occupancyRate >= 70) return 'High';
        if (occupancyRate >= 50) return 'Medium';
        if (occupancyRate >= 30) return 'Low';
        return 'Very Low';
    }

    static _estimateWaitTime(occupancyRate) {
        if (occupancyRate >= 95) return '30+ minutes';
        if (occupancyRate >= 85) return '15-30 minutes';
        if (occupancyRate >= 70) return '5-15 minutes';
        return 'No wait';
    }

    static _generateRecommendationReasons(slot, preferences) {
        const reasons = [];
        
        if (preferences.preferredVehicleType === slot.vehicleType) {
            reasons.push(`Matches your ${slot.vehicleType.toLowerCase()} preference`);
        }
        
        if (preferences.preferredZones.includes(slot.slotNumber.charAt(0))) {
            reasons.push(`In your preferred zone ${slot.slotNumber.charAt(0)}`);
        }
        
        reasons.push('Currently available');
        
        return reasons;
    }

    static _getOptimalBookingTime(bookings) {
        if (bookings.length === 0) return 'Anytime';
        
        const avgDuration = bookings.reduce((sum, booking) => {
            if (booking.checkInTime && booking.checkOutTime) {
                const duration = (new Date(booking.checkOutTime) - new Date(booking.checkInTime)) / (1000 * 60 * 60);
                return sum + duration;
            }
            return sum;
        }, 0) / bookings.length;
        
        return avgDuration > 2 ? 'Book 30 minutes early' : 'Book just in time';
    }

    static _identifyPeakHours(bookings) {
        const hourCounts = {};
        bookings.forEach(booking => {
            const hour = new Date(booking.bookingTime).getHours();
            hourCounts[hour] = (hourCounts[hour] || 0) + 1;
        });

        return Object.entries(hourCounts)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 3)
            .map(([hour]) => parseInt(hour));
    }
}

module.exports = AIRecommendationService;