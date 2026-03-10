const AIRecommendationService = require('../services/AIRecommendationService');

/**
 * AI Controller - Handles AI recommendation endpoints
 */
class AIController {
    /**
     * Get personalized slot recommendations
     */
    static async getRecommendations(req, res) {
        try {
            const userId = req.user.id;
            
            const recommendations = await AIRecommendationService.getPersonalizedRecommendations(userId);
            
            res.status(200).json({
                success: true,
                message: 'Recommendations retrieved successfully',
                data: {
                    recommendations,
                    count: recommendations.length
                }
            });
        } catch (error) {
            console.error('Get recommendations error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to get recommendations',
                data: null
            });
        }
    }

    /**
     * Predict slot availability
     */
    static async predictAvailability(req, res) {
        try {
            const { slotId } = req.params;
            
            const prediction = await AIRecommendationService.predictSlotAvailability(slotId);
            
            if (!prediction) {
                return res.status(404).json({
                    success: false,
                    message: 'Slot not found or prediction unavailable',
                    data: null
                });
            }
            
            res.status(200).json({
                success: true,
                message: 'Availability prediction retrieved successfully',
                data: prediction
            });
        } catch (error) {
            console.error('Predict availability error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to predict availability',
                data: null
            });
        }
    }

    /**
     * Get parking insights and analytics
     */
    static async getParkingInsights(req, res) {
        try {
            const insights = await AIRecommendationService.getParkingInsights();
            
            if (!insights) {
                return res.status(500).json({
                    success: false,
                    message: 'Failed to generate insights',
                    data: null
                });
            }
            
            res.status(200).json({
                success: true,
                message: 'Parking insights retrieved successfully',
                data: insights
            });
        } catch (error) {
            console.error('Get parking insights error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to get parking insights',
                data: null
            });
        }
    }
}

module.exports = AIController;