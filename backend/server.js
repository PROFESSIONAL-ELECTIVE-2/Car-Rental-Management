import express from 'express';
import { setServers } from 'node:dns/promises';
setServers(['1.1.1.1', '8.8.8.8']);
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import cors from 'cors';
import Car from './models/cars.js'; 

dotenv.config();
const app = express();

app.use(cors());
app.use(express.json());

const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/car_rental';


mongoose.connect(mongoURI)
    .then(() => {
        console.log('MongoDB Connected Successfully');
        console.log('Current Database Name:', mongoose.connection.name);
        console.log('Current Collection Name:', Car.collection.name);
    })
    .catch(err => console.log('MongoDB Connection Error:', err));
app.get('/api/cars', async (req, res) => {
    try {
        const cars = await Car.find(); 
        res.json(cars);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server Error: Could not retrieve cars." });
    }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

// Add this temporary route to server.js to test data insertion
app.get('/api/seed', async (req, res) => {
    try {
        const testCar = new Car({
            title: "Test Car",
            description: "If you see this, the database is working!",
            image: "2021_Fortuner-1.jpg",
            type: "SUV"
        });
        await testCar.save();
        res.send("Test car added successfully! Now refresh /api/cars");
    } catch (err) {
        res.status(500).send(err.message);
    }
});