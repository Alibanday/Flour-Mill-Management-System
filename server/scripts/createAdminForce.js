/**
 * Script to create or reset Admin user password
 * This script will CREATE or UPDATE the admin user
 * 
 * Usage: node server/scripts/createAdminForce.js
 */

import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';
import User from '../model/user.js';

// Load environment variables
dotenv.config();

// Admin user credentials
const ADMIN_CREDENTIALS = {
  firstName: 'Admin',
  lastName: 'User',
  email: 'admin@flourmill.com',
  password: 'admin123',
  role: 'Admin',
  status: 'Active'
};

const connectDB = async () => {
  try {
    // Get connection string and clean it (remove MONGO_URL= prefix if present)
    let mongoUrl = process.env.MONGO_URL || process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://localhost:27017/flourmill';
    
    // Clean up the connection string if it has "MONGO_URL=" prefix
    if (mongoUrl.startsWith('MONGO_URL=')) {
      mongoUrl = mongoUrl.replace('MONGO_URL=', '');
    }
    if (mongoUrl.startsWith('MONGODB_URI=')) {
      mongoUrl = mongoUrl.replace('MONGODB_URI=', '');
    }
    
    // Ensure database name is in the connection string
    // If using MongoDB Atlas and no database name specified, add it
    if (mongoUrl.includes('mongodb+srv://') && !mongoUrl.includes('/?') && !mongoUrl.match(/\/[^/?]+(\?|$)/)) {
      // No database name in connection string, add it
      if (mongoUrl.includes('?')) {
        mongoUrl = mongoUrl.replace('?', '/flour-mill-management?');
      } else {
        mongoUrl = mongoUrl + '/flour-mill-management';
      }
    } else if (mongoUrl.includes('mongodb://localhost') && !mongoUrl.includes('/flour')) {
      // For local MongoDB, ensure database name
      mongoUrl = mongoUrl.replace(/\/[^/?]*(\?|$)/, '/flour-mill-management$1');
    }
    
    console.log('🔗 Connecting to MongoDB...');
    const displayUrl = mongoUrl.replace(/\/\/.*@/, '//***@'); // Hide password in logs
    console.log(`   Connection: ${displayUrl.substring(0, 80)}...`);
    
    const options = {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
    };
    
    const conn = await mongoose.connect(mongoUrl, options);
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    console.log(`📊 Database: ${conn.connection.name}`);
    console.log(`🔍 Using database: "${conn.connection.name}"`);
  } catch (error) {
    console.error(`❌ Error connecting to MongoDB: ${error.message}`);
    console.error('\n💡 Troubleshooting:');
    console.error('   1. Make sure MongoDB is running');
    console.error('   2. Check your .env file - MONGO_URL should not include "MONGO_URL=" prefix');
    console.error('   3. Format should be: mongodb+srv://user:pass@cluster.mongodb.net/dbname');
    process.exit(1);
  }
};

const createOrUpdateAdmin = async () => {
  try {
    // Connect to database
    await connectDB();

    // Check if admin exists
    let adminUser = await User.findOne({ email: ADMIN_CREDENTIALS.email.toLowerCase().trim() });
    
    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(ADMIN_CREDENTIALS.password, salt);

    if (adminUser) {
      // Update existing admin
      console.log('⚠️  Admin user already exists. Updating password...');
      adminUser.password = hashedPassword;
      adminUser.firstName = ADMIN_CREDENTIALS.firstName;
      adminUser.lastName = ADMIN_CREDENTIALS.lastName;
      adminUser.role = ADMIN_CREDENTIALS.role;
      adminUser.status = ADMIN_CREDENTIALS.status;
      await adminUser.save();
      console.log('✅ Admin user password updated!');
    } else {
      // Create new admin
      console.log('📝 Creating new admin user...');
      adminUser = new User({
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
      console.log('✅ Admin user created successfully!');
    }

    console.log('\n' + '='.repeat(50));
    console.log('📋 LOGIN CREDENTIALS');
    console.log('='.repeat(50));
    console.log('Email:    ' + ADMIN_CREDENTIALS.email);
    console.log('Password: ' + ADMIN_CREDENTIALS.password);
    console.log('Role:     ' + ADMIN_CREDENTIALS.role);
    console.log('Status:   ' + ADMIN_CREDENTIALS.status);
    console.log('='.repeat(50));
    console.log('\n⚠️  IMPORTANT: Change password after first login!\n');

    // Verify the user was saved correctly
    const verifyUser = await User.findOne({ email: ADMIN_CREDENTIALS.email.toLowerCase().trim() });
    if (verifyUser) {
      const passwordCheck = await bcrypt.compare(ADMIN_CREDENTIALS.password, verifyUser.password);
      if (passwordCheck) {
        console.log('✅ Password verification: SUCCESS');
      } else {
        console.log('❌ Password verification: FAILED');
      }
    }

    // Close database connection
    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    
    if (error.code === 11000) {
      console.error('   Duplicate key error - email already exists');
    }
    
    console.error('\nFull error:', error);
    process.exit(1);
  }
};

// Run the script
createOrUpdateAdmin();

