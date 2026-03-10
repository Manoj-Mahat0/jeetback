const mongoose = require('mongoose');
const dotenv = require('dotenv');

// Load env
dotenv.config({ path: './.env' });

const User = require('./src/models/User');
const Slot = require('./src/models/Slot');
const Booking = require('./src/models/Booking');

mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(async () => {
    console.log('MongoDB Connected for Booking Seeding');

    // Find a Normal User
    const users = await User.find({ role: 'User' });
    if (users.length === 0) {
        console.log('No users found to create bookings for.');
        process.exit(1);
    }

    // Get all slots
    const slots = await Slot.find();
    if (slots.length < 5) {
        console.log('Not enough slots found.');
        process.exit(1);
    }

    // Clear existing bookings
    await Booking.deleteMany();
    console.log('Cleared existing bookings');

    // Create a Pending Booking (Arriving soon)
    await Booking.create({
        userId: users[0]._id,
        slotId: slots[0]._id,
        bookingTime: new Date(Date.now() - 30 * 60000), // 30 mins ago
        status: 'Pending'
    });
    // Mark slot as Booked
    slots[0].status = 'Booked';
    await slots[0].save();


    // Create an Active Booking (Currently Parked)
    await Booking.create({
        userId: users[1 % users.length]._id,
        slotId: slots[1]._id,
        bookingTime: new Date(Date.now() - 120 * 60000), // 2 hours ago
        checkInTime: new Date(Date.now() - 90 * 60000), // 1.5 hours ago
        status: 'Active'
    });
    // Mark slot as Occupied
    slots[1].status = 'Occupied';
    await slots[1].save();


    // Create a Completed Booking (Past)
    await Booking.create({
        userId: users[2 % users.length]._id,
        slotId: slots[2]._id,
        bookingTime: new Date(Date.now() - 24 * 3600000), // 24 hours ago
        checkInTime: new Date(Date.now() - 23 * 3600000), // 23 hours ago
        checkOutTime: new Date(Date.now() - 21 * 3600000), // Checked out 2 hours later
        status: 'Completed',
        totalAmount: 150 // Assuming 2 hours car
    });

    // Create another Completed Booking (Past)
    await Booking.create({
        userId: users[3 % users.length]._id,
        slotId: slots[3]._id,
        bookingTime: new Date(Date.now() - 48 * 3600000),
        checkInTime: new Date(Date.now() - 47 * 3600000),
        checkOutTime: new Date(Date.now() - 40 * 3600000),
        status: 'Completed',
        totalAmount: 350
    });

    console.log('Fake bookings generated successfully!');
    process.exit(0);
}).catch(err => {
    console.error(err);
    process.exit(1);
});
