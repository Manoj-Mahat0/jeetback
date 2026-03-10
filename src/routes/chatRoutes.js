const express = require('express');
const router = express.Router();
const axios = require('axios');

/**
 * POST /api/v1/chat
 * Proxies chat messages to Groq API
 */
router.post('/', async (req, res) => {
    try {
        const { messages } = req.body;

        if (!messages || !Array.isArray(messages)) {
            return res.status(400).json({ success: false, message: 'Messages array is required.' });
        }

        const GROQ_API_KEY = process.env.GROQ_API_KEY;
        const GROQ_MODEL = process.env.GROQ_MODEL || 'llama-3.1-8b-instant';

        if (!GROQ_API_KEY) {
            return res.status(500).json({ success: false, message: 'Groq API key not configured.' });
        }

        const systemPrompt = {
            role: 'system',
            content: `You are SmartPark AI, a helpful and friendly assistant for the SmartPark campus parking management system. You help users with:
- How to book parking slots
- Understanding parking rules and pricing
- Navigating the dashboard
- Answering questions about check-in/check-out procedures
- General parking and campus related queries

Be concise, friendly and helpful. Use emojis sparingly. If a user asks something unrelated to parking, you can still answer but gently guide them back. Keep responses under 150 words unless the question requires more detail.`
        };

        const response = await axios.post('https://api.groq.com/openai/v1/chat/completions', {
            model: GROQ_MODEL,
            messages: [systemPrompt, ...messages],
            temperature: 0.7,
            max_tokens: 512,
        }, {
            headers: {
                'Authorization': `Bearer ${GROQ_API_KEY}`,
                'Content-Type': 'application/json'
            }
        });

        const aiMessage = response.data.choices[0].message.content;
        res.json({ success: true, data: { message: aiMessage } });

    } catch (error) {
        console.error('Groq API Error:', error.response?.data || error.message);
        res.status(500).json({
            success: false,
            message: 'Failed to get AI response.',
            error: error.response?.data?.error?.message || error.message
        });
    }
});

module.exports = router;
