require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./src/models/User');
const Slot = require('./src/models/Slot');
const Pricing = require('./src/models/Pricing');

const seedData = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('🌱 Connected to MongoDB for seeding...');

        // Clear existing data
        await User.deleteMany({});
        await Slot.deleteMany({});
        await Pricing.deleteMany({});

        console.log('🗑️ Existing data cleared.');

        // Seed Admin
        const salt = await bcrypt.genSalt(12);
        const hashedAdminPassword = await bcrypt.hash('admin123', salt);
        const hashedStaffPassword = await bcrypt.hash('staff123', salt);
        const hashedUserPassword = await bcrypt.hash('user123', salt);

        await User.create([
            { name: 'Admin User', email: 'admin@parking.com', password: hashedAdminPassword, role: 'Admin' },
            { name: 'Staff User', email: 'staff@parking.com', password: hashedStaffPassword, role: 'Staff' },
            { name: 'Student User', email: 'student@parking.com', password: hashedUserPassword, role: 'User', vehicleNumber: 'KA-01-MJ-1234' }
        ]);

        console.log('👤 Users seeded (admin/staff/student @parking.com, pass: admin123/staff123/user123)');

        // Seed Pricing
        await Pricing.create([
            { vehicleType: 'Car', hourlyRate: 40 },
            { vehicleType: 'Bike', hourlyRate: 20 }
        ]);

        console.log('💰 Pricing seeded.');

        // Seed Slots
        const slots = [];
        // 5 Car slots
        for (let i = 1; i <= 5; i++) {
            slots.push({ slotNumber: `C${i}`, vehicleType: 'Car', status: 'Available' });
        }
        // 5 Bike slots
        for (let i = 1; i <= 5; i++) {
            slots.push({ slotNumber: `B${i}`, vehicleType: 'Bike', status: 'Available' });
        }
        await Slot.insertMany(slots);

        console.log('🅿️ 10 Slots seeded (C1-C5, B1-B5)');

        console.log('✅ Seeding complete! Exiting...');
        process.exit(0);
    } catch (err) {
        console.error('❌ Seeding failed:', err);
        process.exit(1);
    }
};

seedData();
