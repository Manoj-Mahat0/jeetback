const express = require('express');
const AIController = require('../controllers/aiController');
const { verifyToken, checkRole } = require('../middlewares/auth');

const router = express.Router();

/**
 * AI Recommendation Routes
 * Base path: /api/v1/ai
 */

// Get personalized slot recommendations (All authenticated users)
router.get('/recommendations', verifyToken, AIController.getRecommendations);

// Predict slot availability (All authenticated users)
router.get('/predict/:slotId', verifyToken, AIController.predictAvailability);

// Get parking insights (All authenticated users)
router.get('/insights', verifyToken, AIController.getParkingInsights);

module.exports = router;