require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const connectDB = require('./src/config/db');
const errorHandler = require('./src/middlewares/errorHandler');

// Import routes
const authRoutes = require('./src/routes/authRoutes');
const slotRoutes = require('./src/routes/slotRoutes');
const bookingRoutes = require('./src/routes/bookingRoutes');
const staffRoutes = require('./src/routes/staffRoutes');
const adminRoutes = require('./src/routes/adminRoutes');
const chatRoutes = require('./src/routes/chatRoutes');
const aiRoutes = require('./src/routes/aiRoutes');
const pricingRoutes = require('./src/routes/pricingRoutes');
const publicRoutes = require('./src/routes/publicRoutes');

const app = express();

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// API Routes
app.use('/api/v1/public', publicRoutes);
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/slots', slotRoutes);
app.use('/api/v1/bookings', bookingRoutes);
app.use('/api/v1/staff', staffRoutes);
app.use('/api/v1/admin', adminRoutes);
app.use('/api/v1/chat', chatRoutes);
app.use('/api/v1/ai', aiRoutes);
app.use('/api/v1/pricing', pricingRoutes);

// Root route
app.get('/', (req, res) => {
    res.json({ success: true, message: 'Smart Parking API is active.', version: '1.0.0' });
});

// Health check
app.get('/api/v1/health', (req, res) => {
    res.json({ success: true, message: 'Smart Parking API is running.', data: null });
});

// Global error handler
app.use(errorHandler);

// Start server
const PORT = process.env.PORT || 5000;

const startServer = async () => {
    try {
        await connectDB();

        // Seed default pricing if empty
        const Pricing = require('./src/models/Pricing');
        const count = await Pricing.countDocuments();
        if (count === 0) {
            await Pricing.create([
                { vehicleType: 'Car', hourlyRate: 40 },
                { vehicleType: 'Bike', hourlyRate: 20 },
            ]);
            console.log('✅ Default pricing seeded (Car: ₹40/hr, Bike: ₹20/hr)');
        }

        if (process.env.NODE_ENV !== 'production') {
            app.listen(PORT, () => {
                console.log(`🚀 Server running on http://localhost:${PORT}`);
            });
        }
    } catch (error) {
        console.error('❌ Server start failed:', error);
    }
};

// Only call startServer if not on Vercel or if explicitly needed
// Vercel will handle the DB connection if we put it in the middleware or call it globally
connectDB();
startServer();

module.exports = app;
