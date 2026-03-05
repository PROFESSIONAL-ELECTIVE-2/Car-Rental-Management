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


app.post('/api/cars/rent/:id', async (req, res) => {
    try {
        const car = await Car.findById(req.params.id);
        
        if (!car) {
            return res.status(404).json({ message: "Car not found" });
        }

        if (car.stock <= 0) {
            return res.status(400).json({ message: "Out of stock" });
        }

        car.stock -= 1;
        await car.save();

        res.json({ message: "Rental successful!", updatedCar: car });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server Error: Could not process rental." });
    }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
