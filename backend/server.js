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

mongoose.connect(mongoURI)
    .then(() => {
        console.log('--- Database Info ---');
        console.log('MongoDB Connected Successfully');
        console.log('DB Name:', mongoose.connection.name);
        console.log('Using Collection for Admins:', Admin.collection.name);
        console.log('----------------------');
    })
    .catch(err => console.log('MongoDB Connection Error:', err));

app.get('/api/cars', async (req, res) => {
    try {
        const cars = await Car.find(); 
        res.json(cars);
    } catch (err) {
        res.status(500).json({ message: "Server Error: Could not retrieve cars." });
    }
});

app.post('/api/cars/rent/:id', async (req, res) => {
    try {
        const car = await Car.findById(req.params.id);
        if (!car || car.stock <= 0) {
            return res.status(400).json({ message: "Car unavailable" });
        }
        car.stock -= 1;
        await car.save();
        res.json({ message: "Rental successful!", updatedCar: car });
    } catch (err) {
        res.status(500).json({ message: "Server Error: Could not process rental." });
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
            console.log(' Result: User not found in "users"');
            return res.status(401).json({ message: 'User not found.' });
        }

        if (user.role !== 'admin') {
            console.log(' Result: Role is', user.role, 'not admin');
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