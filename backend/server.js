import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import cors from 'cors';

dotenv.config();
const app = express();


app.use(cors());
app.use(express.json());


const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/car_rental';

mongoose.connect(mongoURI)
    .then(() => console.log('MongoDB Connected Successfully'))
    .catch(err => console.log('MongoDB Connection Error:', err));


app.get('/api/cars', (req, res) => {
    res.json({ message: "Backend is connected!" });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));