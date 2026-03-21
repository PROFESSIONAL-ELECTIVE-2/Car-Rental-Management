import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import nodemailer from 'nodemailer';
import { setServers } from 'node:dns/promises';
import Car from './models/cars.js';
import Admin from './models/Admin.js';

setServers(['1.1.1.1', '8.8.8.8']);
dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const mongoURI   = process.env.MONGODB_URI  || 'mongodb://localhost:27017/car_rental';
const JWT_SECRET = process.env.JWT_SECRET   || 'your_fallback_secret_key';

const tokenBlacklist = new Set();

const transporter = nodemailer.createTransport({
    service: process.env.EMAIL_SERVICE || 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

transporter.verify((err) => {
    if (err) console.warn('  Email transporter not ready:', err.message);
    else     console.log('  Email transporter ready');
});

const BRAND = 'Triple R and A Car Rental';

function htmlShell(title, body, accent = '#2563eb') {
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <title>${title}</title>
  <style>
    body{margin:0;padding:0;background:#f3f4f8;font-family:'Segoe UI',Arial,sans-serif;color:#111827}
    .wrap{max-width:600px;margin:32px auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,.08)}
    .header{background:${accent};padding:32px 40px 24px;color:#fff}
    .header h1{margin:0;font-size:1.5rem;font-weight:800;letter-spacing:-.5px}
    .header p{margin:6px 0 0;font-size:.9rem;opacity:.85}
    .body{padding:32px 40px}
    .body p{font-size:.95rem;line-height:1.7;margin:0 0 14px}
    .reply-box{background:#f8fafc;border-left:4px solid ${accent};border-radius:0 8px 8px 0;padding:18px 20px;margin:20px 0;font-size:.92rem;line-height:1.75;color:#1e293b;white-space:pre-wrap}
    .original-box{background:#f1f5f9;border-radius:8px;padding:16px 18px;margin:20px 0;font-size:.85rem;color:#475569;line-height:1.6}
    .original-box .label{font-size:.75rem;font-weight:700;letter-spacing:.05em;text-transform:uppercase;color:#94a3b8;margin-bottom:8px}
    .footer{background:#f9fafb;padding:20px 40px;text-align:center;font-size:.8rem;color:#9ca3af;border-top:1px solid #f1f5f9}
  </style>
</head>
<body>
  <div class="wrap">
    <div class="header">
      <h1>${BRAND}</h1>
      <p>${title}</p>
    </div>
    <div class="body">${body}</div>
    <div class="footer">
      &copy; ${new Date().getFullYear()} ${BRAND} &nbsp;&bull;&nbsp; All rights reserved.<br/>
      This is a reply from our support team — please do not reply directly to this email.
    </div>
  </div>
</body>
</html>`;
}

function fmtDate(iso) {
    return new Date(iso).toLocaleDateString('en-PH', {
        year: 'numeric', month: 'long', day: 'numeric',
        hour: '2-digit', minute: '2-digit',
    });
}

function fmtPeso(n) {
    return `₱${Number(n ?? 0).toLocaleString('en-PH')}`;
}

function bookingTable(booking, carTitle) {
    const qty = booking.qty ?? 1;
    return `
    <table style="width:100%;border-collapse:collapse;margin:20px 0">
      <tr><td style="padding:10px 14px;font-size:.9rem;border-bottom:1px solid #f1f5f9;font-weight:600;color:#374151;width:38%">Reference</td><td style="padding:10px 14px;font-size:.9rem;border-bottom:1px solid #f1f5f9;color:#111827">#${String(booking._id).slice(-8).toUpperCase()}</td></tr>
      <tr><td style="padding:10px 14px;font-size:.9rem;border-bottom:1px solid #f1f5f9;font-weight:600;color:#374151">Vehicle</td><td style="padding:10px 14px;font-size:.9rem;border-bottom:1px solid #f1f5f9;color:#111827">${carTitle}</td></tr>
      ${qty > 1 ? `<tr><td style="padding:10px 14px;font-size:.9rem;border-bottom:1px solid #f1f5f9;font-weight:600;color:#374151">Quantity</td><td style="padding:10px 14px;font-size:.9rem;border-bottom:1px solid #f1f5f9;color:#111827">${qty} unit(s)</td></tr>` : ''}
      <tr><td style="padding:10px 14px;font-size:.9rem;border-bottom:1px solid #f1f5f9;font-weight:600;color:#374151">Pickup Date</td><td style="padding:10px 14px;font-size:.9rem;border-bottom:1px solid #f1f5f9;color:#111827">${new Date(booking.startDate).toLocaleDateString('en-PH',{year:'numeric',month:'long',day:'numeric'})}</td></tr>
      <tr><td style="padding:10px 14px;font-size:.9rem;border-bottom:1px solid #f1f5f9;font-weight:600;color:#374151">Return Date</td><td style="padding:10px 14px;font-size:.9rem;border-bottom:1px solid #f1f5f9;color:#111827">${new Date(booking.endDate).toLocaleDateString('en-PH',{year:'numeric',month:'long',day:'numeric'})}</td></tr>
      <tr><td style="padding:10px 14px;font-size:.9rem;border-bottom:1px solid #f1f5f9;font-weight:600;color:#374151">Rental Days</td><td style="padding:10px 14px;font-size:.9rem;border-bottom:1px solid #f1f5f9;color:#111827">${booking.rentalDays} day${booking.rentalDays !== 1 ? 's' : ''}</td></tr>
      ${booking.pickupLocation ? `<tr><td style="padding:10px 14px;font-size:.9rem;border-bottom:1px solid #f1f5f9;font-weight:600;color:#374151">Pickup Location</td><td style="padding:10px 14px;font-size:.9rem;border-bottom:1px solid #f1f5f9;color:#111827">${booking.pickupLocation}</td></tr>` : ''}
      <tr><td style="padding:10px 14px;font-size:.9rem;font-weight:600;color:#374151">Total Cost</td><td style="padding:10px 14px;font-size:.9rem;color:#111827"><strong>${fmtPeso(booking.totalCost)}</strong></td></tr>
    </table>`;
}

function buildSubmittedEmail(booking, carTitle) {
    const subject = `Booking Received – #${String(booking._id).slice(-8).toUpperCase()} | ${BRAND}`;
    const body = `
      <p>Hi <strong>${booking.customerName}</strong>,</p>
      <p>Thank you for choosing <strong>${BRAND}</strong>! We have successfully received your booking request and it is currently <span style="display:inline-block;padding:3px 10px;border-radius:20px;font-size:.78rem;font-weight:700;background:#fef9c3;color:#854d0e">Pending</span> review.</p>
      <p>Our team will confirm your reservation shortly. Here is a summary of your booking:</p>
      ${bookingTable(booking, carTitle)}
      <p>If you have any questions in the meantime, feel free to contact our support team.</p>
      <p>We look forward to serving you!</p>`;
    return { subject, html: htmlShell('Booking Confirmation', body, '#f59e0b') };
}

function buildActiveEmail(booking, carTitle) {
    const subject = `Your Rental is Now Active – #${String(booking._id).slice(-8).toUpperCase()} | ${BRAND}`;
    const body = `
      <p>Hi <strong>${booking.customerName}</strong>,</p>
      <p>Great news! Your booking has been confirmed and is now <span style="display:inline-block;padding:3px 10px;border-radius:20px;font-size:.78rem;font-weight:700;background:#d1fae5;color:#065f46">Active</span>. Your vehicle is ready for pick-up.</p>
      ${bookingTable(booking, carTitle)}
      <p>Please bring a valid government-issued ID and your booking reference number when collecting your vehicle.</p>
      <p>Enjoy your trip, and drive safely!</p>`;
    return { subject, html: htmlShell('Your Rental is Active', body, '#16a34a') };
}

function buildCompletedEmail(booking, carTitle) {
    const subject = `Rental Completed – Thank You! | ${BRAND}`;
    const body = `
      <p>Hi <strong>${booking.customerName}</strong>,</p>
      <p>Your rental has been marked as <span style="display:inline-block;padding:3px 10px;border-radius:20px;font-size:.78rem;font-weight:700;background:#dbeafe;color:#1e40af">Completed</span>. We hope you had a great experience with us!</p>
      ${bookingTable(booking, carTitle)}
      <p>We would love to have you back. Feel free to explore our fleet for your next journey.</p>
      <p>Thank you for choosing <strong>${BRAND}</strong>!</p>`;
    return { subject, html: htmlShell('Rental Completed – Thank You!', body, '#2563eb') };
}

function buildReplyEmail(msg, replySubject, replyBody) {
    const subject = replySubject || `Re: ${msg.subject || 'Your enquiry'} | ${BRAND}`;
    const body = `
      <p>Hi <strong>${msg.name}</strong>,</p>
      <p>Thank you for reaching out to us. Our support team has responded to your enquiry below.</p>
      <div class="reply-box">${replyBody.replace(/\n/g, '<br/>')}</div>
      <div class="original-box">
        <div class="label">Your original message</div>
        <p style="margin:0;font-style:italic">"${msg.message}"</p>
        <p style="margin:6px 0 0;font-size:.78rem;color:#94a3b8">Sent on ${fmtDate(msg.createdAt)}</p>
      </div>
      <p>If you have further questions, please don't hesitate to get in touch again through our <a href="#" style="color:#2563eb">Contact page</a>.</p>
      <p>Warm regards,<br/><strong>${BRAND} Support Team</strong></p>`;
    return { subject, html: htmlShell(`Reply to your enquiry`, body, '#2563eb') };
}

async function sendEmail(to, subject, html) {
    if (!to || !process.env.EMAIL_USER) return;
    try {
        await transporter.sendMail({
            from:    `"${BRAND}" <${process.env.EMAIL_USER}>`,
            to,
            subject,
            html,
        });
        console.log(`📧  Email sent → ${to} [${subject}]`);
    } catch (err) {
        console.error('📧  Email send error:', err.message);
    }
}

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

const replySchema = new mongoose.Schema(
    {
        subject: { type: String, trim: true },
        body:    { type: String, required: true, trim: true },
        sentBy:  { type: String, default: 'Admin' },
        sentAt:  { type: Date, default: Date.now },
    },
    { _id: true }
);

const messageSchema = new mongoose.Schema(
    {
        name:    { type: String, required: true, trim: true },
        email:   { type: String, required: true, trim: true, lowercase: true },
        subject: { type: String, trim: true },
        message: { type: String, required: true, trim: true },
        status:  { type: String, enum: ['Unread', 'Read', 'Archived'], default: 'Unread' },
        replies: { type: [replySchema], default: [] },
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

        if (booking.customerEmail) {
            const { subject, html } = buildSubmittedEmail(booking, car.title);
            sendEmail(booking.customerEmail, subject, html);
        }

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
        const created    = [];
        const emailQueue = [];

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
            emailQueue.push({ booking, carTitle: car.title });
            console.log(`Batch booking: ${booking._id} | ${car.title} × ${qty}`);
        }

        await session.commitTransaction();
        session.endSession();

        for (const { booking, carTitle } of emailQueue) {
            if (booking.customerEmail) {
                const { subject, html } = buildSubmittedEmail(booking, carTitle);
                sendEmail(booking.customerEmail, subject, html);
            }
        }

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

    const terminalStatuses = ['Completed', 'Cancelled'];

    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const booking = await Booking.findById(req.params.id).session(session);
        if (!booking) {
            await session.abortTransaction();
            session.endSession();
            return res.status(404).json({ message: 'Booking not found.' });
        }

        const wasTerminal = terminalStatuses.includes(booking.status);
        const isNowTerminal = terminalStatuses.includes(status);

        let car = null;
        if (isNowTerminal && !wasTerminal) {
            car = await Car.findById(booking.carId).session(session);
            if (car) {
                car.stock += booking.qty ?? 1;
                await car.save({ session });
                console.log(`Stock restored: ${car.title} → stock now ${car.stock}`);
            }
        }

        booking.status = status;
        await booking.save({ session });
        await session.commitTransaction();
        session.endSession();

        const populated = await Booking.findById(booking._id)
            .populate('carId', 'title type image');

        console.log(`Booking ${booking._id} → ${status}`);

        if (booking.customerEmail) {
            const carTitle = populated.carId?.title || car?.title || 'your vehicle';
            if (status === 'Active') {
                const { subject, html } = buildActiveEmail(booking, carTitle);
                sendEmail(booking.customerEmail, subject, html);
            } else if (status === 'Completed') {
                const { subject, html } = buildCompletedEmail(booking, carTitle);
                sendEmail(booking.customerEmail, subject, html);
            }
        }

        res.json({ message: 'Status updated.', booking: populated });

    } catch (err) {
        await session.abortTransaction();
        session.endSession();
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

app.post('/api/admin/messages/:id/reply', requireAdmin, async (req, res) => {
    const { subject, body } = req.body;

    if (!body || !body.trim()) {
        return res.status(400).json({ message: 'Reply body is required.' });
    }

    try {
        const msg = await Message.findById(req.params.id);
        if (!msg) return res.status(404).json({ message: 'Message not found.' });

        
        const reply = {
            subject: subject?.trim() || `Re: ${msg.subject || 'Your enquiry'}`,
            body:    body.trim(),
            sentBy:  'Admin',
            sentAt:  new Date(),
        };

        msg.replies.push(reply);

        
        if (msg.status === 'Unread') {
            msg.status = 'Read';
        }

        await msg.save();

        
        const { subject: emailSubject, html } = buildReplyEmail(msg, reply.subject, reply.body);
        sendEmail(msg.email, emailSubject, html);

        console.log(`📧  Admin replied to message ${msg._id} → ${msg.email}`);

        res.status(200).json({
            message: 'Reply sent successfully.',
            msg,
        });
    } catch (err) {
        console.error('Reply error:', err);
        res.status(500).json({ message: 'Server Error: Could not send reply.' });
    }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));