// backend/models/cars.js
import mongoose from 'mongoose';

const carSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String, required: true },
    image: { type: String, required: true },
    type: { type: String, required: true },
    stock: { type: Number, default: 1 } // Add this line to track quantity
});

export default mongoose.model('Car', carSchema, 'cars');