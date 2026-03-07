import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { setServers } from 'node:dns/promises';
import Car from './models/cars.js';
import Admin from './models/Admin.js';

setServers(['1.1.1.1', '8.8.8.8']);
dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/car_rental';
const JWT_SECRET = process.env.JWT_SECRET || 'your_fallback_secret_key';

const bookingSchema = new mongoose.Schema(
    {
        carId:         { type: mongoose.Schema.Types.ObjectId, ref: 'Car', required: true },
        customerName:  { type: String, required: true, trim: true },
        customerEmail: { type: String, trim: true, lowercase: true },
        customerPhone: { type: String, trim: true },
        startDate:     { type: Date, required: true },
        endDate:       { type: Date, required: true },
        rentalDays:    { type: Number, required: true, min: 1 },
        totalCost:     { type: Number, default: 0 },
        status:        { type: String, enum: ['Pending', 'Active', 'Completed', 'Cancelled'], default: 'Pending' },
    },
    { timestamps: true }
);

const Booking = mongoose.models.Booking || mongoose.model('Booking', bookingSchema, 'bookings');

mongoose.connect(mongoURI)
    .then(() => {
        console.log('--- Database Info ---');
        console.log('MongoDB Connected Successfully');
        console.log('DB Name:', mongoose.connection.name);
        console.log('Using Collection for Admins:', Admin.collection.name);
        console.log('Using Collection for Bookings:', Booking.collection.name);
        console.log('----------------------');
    })
    .catch(err => console.log('MongoDB Connection Error:', err));

app.get('/api/cars', async (req, res) => {
    try {
        const cars = await Car.find();
        res.json(cars);
    } catch (err) {
        res.status(500).json({ message: 'Server Error: Could not retrieve cars.' });
    }
});

app.post('/api/bookings', async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const { carId, customerName, customerEmail, customerPhone, startDate, endDate, rentalDays } = req.body;

        if (!carId || !customerName || !startDate || !endDate || !rentalDays) {
            await session.abortTransaction();
            session.endSession();
            return res.status(400).json({ message: 'Missing required booking fields.' });
        }

        const car = await Car.findById(carId).session(session);

        if (!car) {
            await session.abortTransaction();
            session.endSession();
            return res.status(404).json({ message: 'Car not found.' });
        }

        if (car.stock <= 0) {
            await session.abortTransaction();
            session.endSession();
            return res.status(400).json({ message: 'This vehicle is currently out of stock.' });
        }

        const totalCost = (car.dailyRate ?? 0) * Number(rentalDays);

        const [booking] = await Booking.create(
            [{
                carId,
                customerName:  customerName.trim(),
                customerEmail: customerEmail?.trim() || '',
                customerPhone: customerPhone?.trim() || '',
                startDate:     new Date(startDate),
                endDate:       new Date(endDate),
                rentalDays:    Number(rentalDays),
                totalCost,
                status: 'Pending',
            }],
            { session }
        );

        car.stock -= 1;
        await car.save({ session });

        await session.commitTransaction();
        session.endSession();

        console.log(`New booking: ${booking._id} for car ${car.title}`);
        return res.status(201).json({ message: 'Booking created successfully!', booking });

    } catch (err) {
        await session.abortTransaction();
        session.endSession();
        console.error('Booking error:', err);
        return res.status(500).json({ message: 'Server Error: Could not create booking.' });
    }
});

app.get('/api/bookings', async (req, res) => {
    try {
        const bookings = await Booking.find()
            .sort({ createdAt: -1 })
            .populate('carId', 'title type image');
        res.json(bookings);
    } catch (err) {
        res.status(500).json({ message: 'Server Error: Could not retrieve bookings.' });
    }
});

app.get('/api/dashboard/analytics', async (req, res) => {
    try {
        const revenueAgg = await Booking.aggregate([
            { $match: { status: 'Completed' } },
            { $group: { _id: null, total: { $sum: '$totalCost' } } },
        ]);
        const totalRevenue = revenueAgg[0]?.total ?? 0;

        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        sevenDaysAgo.setHours(0, 0, 0, 0);

        const dailyRevenue = await Booking.aggregate([
            { $match: { status: 'Completed', updatedAt: { $gte: sevenDaysAgo } } },
            { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$updatedAt' } }, revenue: { $sum: '$totalCost' } } },
            { $sort: { _id: 1 } },
        ]);

        const last7Days = [];
        for (let i = 6; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const dateStr = d.toISOString().split('T')[0];
            const found = dailyRevenue.find(r => r._id === dateStr);
            last7Days.push({ date: dateStr, revenue: found?.revenue ?? 0 });
        }

        const fleetAgg = await Car.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]);
        const fleetMap = fleetAgg.reduce((acc, x) => { acc[x._id] = x.count; return acc; }, {});
        const totalCars = await Car.countDocuments();

        const fleet = {
            total:       totalCars,
            available:   fleetMap['Available']   ?? 0,
            rented:      fleetMap['Rented']      ?? 0,
            maintenance: fleetMap['Maintenance'] ?? 0,
        };

        const recent = await Booking.find()
            .sort({ createdAt: -1 })
            .limit(5)
            .populate('carId', 'title type licensePlate')
            .lean();

        const recentBookings = recent.map(b => ({
            id:            b._id,
            customerName:  b.customerName,
            customerEmail: b.customerEmail || 'N/A',
            car:           b.carId?.title || 'Unknown Vehicle',
            licensePlate:  b.carId?.licensePlate || '—',
            startDate:     b.startDate,
            endDate:       b.endDate,
            totalCost:     b.totalCost,
            status:        b.status,
            createdAt:     b.createdAt,
        }));

        const statusAgg = await Booking.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]);
        const bookingStats = statusAgg.reduce(
            (acc, x) => { acc[x._id.toLowerCase()] = x.count; return acc; },
            { pending: 0, active: 0, completed: 0, cancelled: 0 }
        );

        return res.status(200).json({
            success: true,
            data: { revenue: { total: totalRevenue, last7Days }, fleet, recentBookings, bookingStats },
        });

    } catch (err) {
        console.error('Dashboard analytics error:', err);
        res.status(500).json({ success: false, message: 'Server Error: Could not load analytics.' });
    }
});

app.post('/api/admin/login', async (req, res) => {
    const { identifier, password, rememberMe } = req.body;

    console.log('\n--- Login Attempt ---');
    console.log('Searching for:', identifier, 'in collection:', Admin.collection.name);

    try {
        const user = await Admin.findOne({
            username: { $regex: new RegExp(`^${identifier}$`, 'i') }
        });

        if (!user) {
            console.log('Result: User not found');
            return res.status(401).json({ message: 'User not found.' });
        }

        if (user.role !== 'admin') {
            console.log('Result: Role is', user.role, 'not admin');
            return res.status(403).json({ message: 'Access denied.' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            console.log('Result: Password incorrect');
            return res.status(401).json({ message: 'Invalid credentials.' });
        }

        const token = jwt.sign(
            { id: user._id, role: user.role },
            JWT_SECRET,
            { expiresIn: rememberMe ? '30d' : '24h' }
        );

        console.log('Login Successful for:', user.username);
        res.json({ token, message: 'Welcome back!' });

    } catch (err) {
        console.error('Error:', err);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));