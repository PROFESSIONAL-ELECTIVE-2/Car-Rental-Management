import mongoose from 'mongoose';

const adminSchema = new mongoose.Schema({
    username: { type: String, required: true },
    password: { type: String, required: true },
    role: { type: String }
});

// The third argument 'Users' forces Mongoose to use your existing collection
export default mongoose.model('Admin', adminSchema, 'users');