import mongoose from 'mongoose';

const adminSchema = new mongoose.Schema({
    username: { type: String, required: true },
    password: { type: String, required: true },
    role: { type: String }
});

export default mongoose.model('Admin', adminSchema, 'users');