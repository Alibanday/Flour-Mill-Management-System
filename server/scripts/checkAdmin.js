/**
 * Script to check if admin user exists and verify credentials
 */

import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';
import User from '../model/user.js';

// Load environment variables
dotenv.config();

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI || process.env.MONGO_URL || process.env.MONGODB_URI || 'mongodb://localhost:27017/flourmill');
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`❌ Error connecting to MongoDB: ${error.message}`);
    process.exit(1);
  }
};

const checkAdmin = async () => {
  try {
    await connectDB();

    // Find all users
    const allUsers = await User.find({}).select('firstName lastName email role status');
    console.log('\n📋 All users in database:');
    console.log('========================');
    if (allUsers.length === 0) {
      console.log('❌ No users found in database!');
    } else {
      allUsers.forEach((user, index) => {
        console.log(`${index + 1}. ${user.firstName} ${user.lastName}`);
        console.log(`   Email: ${user.email}`);
        console.log(`   Role: ${user.role}`);
        console.log(`   Status: ${user.status}`);
        console.log('');
      });
    }

    // Check for admin user specifically
    const adminUser = await User.findOne({ email: 'admin@flourmill.com' });
    if (adminUser) {
      console.log('✅ Admin user found!');
      console.log('Email:', adminUser.email);
      console.log('Role:', adminUser.role);
      console.log('Status:', adminUser.status);
      
      // Test password
      const testPassword = 'admin123';
      const passwordMatch = await bcrypt.compare(testPassword, adminUser.password);
      if (passwordMatch) {
        console.log('✅ Password is correct for "admin123"');
      } else {
        console.log('❌ Password does NOT match "admin123"');
        console.log('   The stored password hash is different.');
      }
    } else {
      console.log('\n❌ Admin user NOT found with email: admin@flourmill.com');
      console.log('   You may need to create it again.');
    }

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

checkAdmin();

