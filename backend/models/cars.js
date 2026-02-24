import mongoose from 'mongoose';

const carSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String, required: true },
    image: { type: String, required: true },
    type: String, 
});

export default mongoose.model('Car', carSchema, 'cars');