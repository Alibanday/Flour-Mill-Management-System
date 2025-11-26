/**
 * Script to create an Admin user
 * Run this script when you need to create an admin user after database reset
 * 
 * Usage: node server/scripts/createAdmin.js
 * Or: npm run create-admin
 */

import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';
import User from '../model/user.js';

// Load environment variables
dotenv.config();

// Admin user credentials (you can change these)
const ADMIN_CREDENTIALS = {
  firstName: 'Admin',
  lastName: 'User',
  email: 'admin@flourmill.com',
  password: 'admin123', // Change this after first login!
  role: 'Admin',
  status: 'Active'
};

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI || process.env.MONGO_URL || process.env.MONGODB_URI || 'mongodb://localhost:27017/flourmill');
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`❌ Error connecting to MongoDB: ${error.message}`);
    process.exit(1);
  }
};

const createAdmin = async () => {
  try {
    // Connect to database
    await connectDB();

    // Check if admin already exists
    const existingAdmin = await User.findOne({ email: ADMIN_CREDENTIALS.email });
    if (existingAdmin) {
      console.log('⚠️  Admin user already exists with email:', ADMIN_CREDENTIALS.email);
      console.log('   If you want to reset the password, delete the user first or use update script.');
      process.exit(0);
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(ADMIN_CREDENTIALS.password, salt);

    // Create admin user
    const adminUser = new User({
      firstName: ADMIN_CREDENTIALS.firstName,
      lastName: ADMIN_CREDENTIALS.lastName,
      email: ADMIN_CREDENTIALS.email.toLowerCase().trim(),
      password: hashedPassword,
      role: ADMIN_CREDENTIALS.role,
      status: ADMIN_CREDENTIALS.status,
      address: '',
      phone: '',
      mobile: ''
    });

    await adminUser.save();

    console.log('\n✅ Admin user created successfully!');
    console.log('\n📋 Login Credentials:');
    console.log('   Email:', ADMIN_CREDENTIALS.email);
    console.log('   Password:', ADMIN_CREDENTIALS.password);
    console.log('\n⚠️  IMPORTANT: Change the password after first login!');
    console.log('\n');

    // Close database connection
    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating admin user:', error);
    
    if (error.code === 11000) {
      console.error('   Email already exists in database');
    }
    
    process.exit(1);
  }
};

// Run the script
createAdmin();

