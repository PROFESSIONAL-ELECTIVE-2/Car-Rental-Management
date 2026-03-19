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

const mongoURI  = process.env.MONGODB_URI  || 'mongodb://localhost:27017/car_rental';
const JWT_SECRET = process.env.JWT_SECRET  || 'your_fallback_secret_key';

const tokenBlacklist = new Set();

const bookingSchema = new mongoose.Schema(
    {
        carId:          { type: mongoose.Schema.Types.ObjectId, ref: 'Car', required: true },
        qty:            { type: Number, required: true, min: 1, default: 1 },
        customerName:   { type: String, required: true, trim: true },
        customerEmail:  { type: String, trim: true, lowercase: true },
        customerPhone:  { type: String, trim: true },
        startDate:      { type: Date, required: true },
        endDate:        { type: Date, required: true },
        rentalDays:     { type: Number, required: true, min: 1 },
        pickupLocation: { type: String, trim: true },
        totalCost:      { type: Number, default: 0 },
        status:         { type: String, enum: ['Pending', 'Active', 'Completed', 'Cancelled'], default: 'Pending' },
    },
    { timestamps: true }
);

const Booking = mongoose.models.Booking || mongoose.model('Booking', bookingSchema, 'bookings');

const messageSchema = new mongoose.Schema(
    {
        name:    { type: String, required: true, trim: true },
        email:   { type: String, required: true, trim: true, lowercase: true },
        subject: { type: String, trim: true },
        message: { type: String, required: true, trim: true },
        status:  { type: String, enum: ['Unread', 'Read', 'Archived'], default: 'Unread' },
    },
    { timestamps: true }
);

const Message = mongoose.models.Message || mongoose.model('Message', messageSchema, 'messages');

function requireAdmin(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'No token provided.' });
    }
    const token = authHeader.split(' ')[1];
    if (tokenBlacklist.has(token)) {
        return res.status(401).json({ message: 'Session expired. Please log in again.' });
    }
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        if (decoded.role !== 'admin') {
            return res.status(403).json({ message: 'Access denied.' });
        }
        req.admin = decoded;
        req.token = token;
        next();
    } catch {
        return res.status(401).json({ message: 'Invalid or expired token.' });
    }
}

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
        const {
            carId, qty = 1, customerName, customerEmail,
            customerPhone, startDate, endDate, rentalDays, pickupLocation,
        } = req.body;

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
        if (car.stock < Number(qty)) {
            await session.abortTransaction();
            session.endSession();
            return res.status(400).json({ message: `Only ${car.stock} unit(s) available for ${car.title}.` });
        }

        const totalCost = (car.dailyRate ?? 0) * Number(qty) * Number(rentalDays);

        const [booking] = await Booking.create(
            [{
                carId,
                qty:            Number(qty),
                customerName:   customerName.trim(),
                customerEmail:  customerEmail?.trim()  || '',
                customerPhone:  customerPhone?.trim()  || '',
                startDate:      new Date(startDate),
                endDate:        new Date(endDate),
                rentalDays:     Number(rentalDays),
                pickupLocation: pickupLocation || '',
                totalCost,
                status: 'Pending',
            }],
            { session }
        );

        car.stock -= Number(qty);
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

app.post('/api/bookings/batch', async (req, res) => {
    const { bookings } = req.body;

    if (!Array.isArray(bookings) || bookings.length === 0) {
        return res.status(400).json({ message: 'bookings array is required.' });
    }

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const created = [];

        for (const item of bookings) {
            const {
                carId, qty = 1, customerName, customerEmail,
                customerPhone, startDate, endDate, rentalDays, pickupLocation,
            } = item;

            if (!carId || !customerName || !startDate || !endDate || !rentalDays) {
                await session.abortTransaction();
                session.endSession();
                return res.status(400).json({ message: 'Missing required fields in one or more bookings.' });
            }

            const car = await Car.findById(carId).session(session);
            if (!car) {
                await session.abortTransaction();
                session.endSession();
                return res.status(404).json({ message: `Car not found: ${carId}` });
            }
            if (car.stock < Number(qty)) {
                await session.abortTransaction();
                session.endSession();
                return res.status(400).json({
                    message: `Insufficient stock for "${car.title}". Requested: ${qty}, available: ${car.stock}.`,
                });
            }

            const totalCost = (car.dailyRate ?? 0) * Number(qty) * Number(rentalDays);

            const [booking] = await Booking.create(
                [{
                    carId,
                    qty:            Number(qty),
                    customerName:   customerName.trim(),
                    customerEmail:  customerEmail?.trim()  || '',
                    customerPhone:  customerPhone?.trim()  || '',
                    startDate:      new Date(startDate),
                    endDate:        new Date(endDate),
                    rentalDays:     Number(rentalDays),
                    pickupLocation: pickupLocation || '',
                    totalCost,
                    status: 'Pending',
                }],
                { session }
            );

            car.stock -= Number(qty);
            await car.save({ session });
            created.push(booking);
            console.log(`Batch booking: ${booking._id} | ${car.title} × ${qty}`);
        }

        await session.commitTransaction();
        session.endSession();

        return res.status(201).json({
            message:  `${created.length} booking(s) created successfully!`,
            bookings: created,
        });

    } catch (err) {
        await session.abortTransaction();
        session.endSession();
        console.error('Batch booking error:', err);
        return res.status(500).json({ message: 'Server Error: Could not process batch booking.' });
    }
});

app.post('/api/messages', async (req, res) => {
    try {
        const { name, email, subject, message } = req.body;
        if (!name || !email || !message) {
            return res.status(400).json({ message: 'Name, email, and message are required.' });
        }
        const msg = await Message.create({
            name: name.trim(),
            email: email.trim().toLowerCase(),
            subject: subject?.trim() || '',
            message: message.trim(),
        });
        console.log(`New message from: ${msg.email}`);
        return res.status(201).json({ message: 'Message received. Thank you!', id: msg._id });
    } catch (err) {
        console.error('Message error:', err);
        res.status(500).json({ message: 'Server Error: Could not save message.' });
    }
});

app.post('/api/admin/login', async (req, res) => {
    const { identifier, password, rememberMe } = req.body;

    console.log('\n--- Login Attempt ---');
    console.log('Searching for:', identifier, 'as username or email');

    try {
        const user = await Admin.findOne({
            $or: [
                { username: { $regex: new RegExp(`^${identifier}$`, 'i') } },
                { email:    { $regex: new RegExp(`^${identifier}$`, 'i') } },
            ],
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


app.post('/api/admin/logout', requireAdmin, (req, res) => {
    tokenBlacklist.add(req.token);
    console.log(`\nToken blacklisted for admin id: ${req.admin.id}`);
    res.json({ message: 'Logged out successfully.' });
});

app.get('/api/bookings', requireAdmin, async (req, res) => {
    try {
        const bookings = await Booking.find()
            .sort({ createdAt: -1 })
            .populate('carId', 'title type image');
        res.json(bookings);
    } catch (err) {
        res.status(500).json({ message: 'Server Error: Could not retrieve bookings.' });
    }
});

app.put('/api/admin/bookings/:id/status', requireAdmin, async (req, res) => {
    const { status } = req.body;
    const allowed = ['Pending', 'Active', 'Completed', 'Cancelled'];
    if (!allowed.includes(status)) {
        return res.status(400).json({ message: `Invalid status. Must be one of: ${allowed.join(', ')}` });
    }
    try {
        const booking = await Booking.findByIdAndUpdate(
            req.params.id,
            { status },
            { new: true }
        ).populate('carId', 'title type image');
        if (!booking) return res.status(404).json({ message: 'Booking not found.' });
        console.log(`Booking ${booking._id} → ${status}`);
        res.json({ message: 'Status updated.', booking });
    } catch (err) {
        console.error('Status update error:', err);
        res.status(500).json({ message: 'Server Error: Could not update status.' });
    }
});

app.get('/api/admin/cars', requireAdmin, async (req, res) => {
    try {
        const cars = await Car.find().sort({ createdAt: -1 });
        res.json(cars);
    } catch (err) {
        res.status(500).json({ message: 'Server Error: Could not retrieve cars.' });
    }
});

app.post('/api/admin/cars', requireAdmin, async (req, res) => {
    try {
        const { title, description, image, type, stock, dailyRate } = req.body;
        if (!title || !description || !image || !type) {
            return res.status(400).json({ message: 'title, description, image, and type are required.' });
        }
        const car = await Car.create({
            title, description, image, type,
            stock:     Number(stock)     || 1,
            dailyRate: Number(dailyRate) || 0,
        });
        console.log(`New car added: ${car.title}`);
        res.status(201).json({ message: 'Car added successfully.', car });
    } catch (err) {
        console.error('Add car error:', err);
        res.status(500).json({ message: 'Server Error: Could not add car.' });
    }
});

app.put('/api/admin/cars/:id', requireAdmin, async (req, res) => {
    try {
        const { title, description, image, type, stock, dailyRate } = req.body;
        const update = {};
        if (title       !== undefined) update.title       = title;
        if (description !== undefined) update.description = description;
        if (image       !== undefined) update.image       = image;
        if (type        !== undefined) update.type        = type;
        if (stock       !== undefined) update.stock       = Math.max(0, Number(stock));
        if (dailyRate   !== undefined) update.dailyRate   = Math.max(0, Number(dailyRate));

        const car = await Car.findByIdAndUpdate(req.params.id, update, { new: true });
        if (!car) return res.status(404).json({ message: 'Car not found.' });
        res.json({ message: 'Car updated.', car });
    } catch (err) {
        console.error('Update car error:', err);
        res.status(500).json({ message: 'Server Error: Could not update car.' });
    }
});

// DELETE remove car
app.delete('/api/admin/cars/:id', requireAdmin, async (req, res) => {
    try {
        const car = await Car.findByIdAndDelete(req.params.id);
        if (!car) return res.status(404).json({ message: 'Car not found.' });
        console.log(`Car deleted: ${car.title}`);
        res.json({ message: `"${car.title}" deleted successfully.` });
    } catch (err) {
        console.error('Delete car error:', err);
        res.status(500).json({ message: 'Server Error: Could not delete car.' });
    }
});

// GET dashboard analytics
app.get('/api/dashboard/analytics', requireAdmin, async (req, res) => {
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
            last7Days.push({ date: dateStr, revenue: dailyRevenue.find(r => r._id === dateStr)?.revenue ?? 0 });
        }

        const fleetAgg = await Car.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]);
        const fleetMap = fleetAgg.reduce((acc, x) => { acc[x._id] = x.count; return acc; }, {});
        const fleet = {
            total:       await Car.countDocuments(),
            available:   fleetMap['Available']   ?? 0,
            rented:      fleetMap['Rented']       ?? 0,
            maintenance: fleetMap['Maintenance']  ?? 0,
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
            car:           b.carId?.title  || 'Unknown Vehicle',
            licensePlate:  b.carId?.licensePlate || '—',
            qty:           b.qty ?? 1,
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

app.get('/api/admin/messages', requireAdmin, async (req, res) => {
    try {
        const messages = await Message.find().sort({ createdAt: -1 });
        res.json(messages);
    } catch (err) {
        res.status(500).json({ message: 'Server Error: Could not retrieve messages.' });
    }
});

app.put('/api/admin/messages/:id/status', requireAdmin, async (req, res) => {
    const { status } = req.body;
    const allowed = ['Unread', 'Read', 'Archived'];
    if (!allowed.includes(status)) {
        return res.status(400).json({ message: `Invalid status. Must be one of: ${allowed.join(', ')}` });
    }
    try {
        const msg = await Message.findByIdAndUpdate(req.params.id, { status }, { new: true });
        if (!msg) return res.status(404).json({ message: 'Message not found.' });
        res.json({ message: 'Status updated.', msg });
    } catch (err) {
        res.status(500).json({ message: 'Server Error: Could not update message.' });
    }
});

app.delete('/api/admin/messages/:id', requireAdmin, async (req, res) => {
    try {
        const msg = await Message.findByIdAndDelete(req.params.id);
        if (!msg) return res.status(404).json({ message: 'Message not found.' });
        res.json({ message: 'Message deleted.' });
    } catch (err) {
        res.status(500).json({ message: 'Server Error: Could not delete message.' });
    }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));