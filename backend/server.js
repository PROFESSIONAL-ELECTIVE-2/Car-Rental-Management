import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import cors from 'cors';
import Car from './models/cars.js'; // Ensure this line exists

dotenv.config();
const app = express();

app.use(cors());
app.use(express.json());

const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/car_rental';

mongoose.connect(mongoURI)
    .then(() => console.log('MongoDB Connected Successfully'))
    .catch(err => console.log('MongoDB Connection Error:', err));

// Change this to an async function to handle the database request
app.get('/api/cars', async (req, res) => {
    try {
        const cars = await Car.find(); // Fetches documents from the 'cars' collection
        res.json(cars);
    } catch (err) {
        console.error(err); // This will print the specific error in your terminal
        res.status(500).json({ message: "Server Error: Could not retrieve cars." });
    }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));