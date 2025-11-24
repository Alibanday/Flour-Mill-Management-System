// Simple script to add admin user
// Run: node addUser.mjs

import mongoose from 'mongoose';
import bcrypt from 'bcrypt';

const MONGODB_URI = 'mongodb+srv://finalflourmill:flourmill321@cluster1.rg0szrm.mongodb.net/flourmill?retryWrites=true&w=majority&appName=Cluster1';

const userSchema = new mongoose.Schema({
    firstName: String,
    lastName: String,
    email: { type: String, unique: true },
    password: String,
    role: String,
    status: String,
    assignedWarehouse: mongoose.Schema.Types.ObjectId
}, { timestamps: true });

const User = mongoose.model('User', userSchema);

async function addUser() {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        // Hash the password
        const hashedPassword = await bcrypt.hash('admin123', 10);

        // Create admin user
        const admin = await User.create({
            firstName: 'John',
            lastName: 'Doe',
            email: 'admin@flourmill.com',
            password: hashedPassword,
            role: 'Admin',
            status: 'Active'
        });

        console.log('✅ Admin user created!');
        console.log('Email:', admin.email);
        console.log('Password: admin123');
        console.log('Role:', admin.role);

        await mongoose.disconnect();
        process.exit(0);
    } catch (error) {
        if (error.code === 11000) {
            console.log('ℹ️  User already exists with this email');
        } else {
            console.error('❌ Error:', error.message);
        }
        process.exit(1);
    }
}

addUser();
