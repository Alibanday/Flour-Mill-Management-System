/**
 * Script to create Admin user in the CORRECT database
 * This script will check what database the app uses and create admin there
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
    // Get connection string - use the SAME one as the application
    let mongoUrl = process.env.MONGO_URL || 
                   process.env.MONGODB_URI || 
                   process.env.MONGO_URI || 
                   'mongodb://localhost:27017/flour-mill-management';
    
    // Clean up the connection string if it has prefix
    if (mongoUrl.startsWith('MONGO_URL=')) {
      mongoUrl = mongoUrl.replace('MONGO_URL=', '');
    }
    if (mongoUrl.startsWith('MONGODB_URI=')) {
      mongoUrl = mongoUrl.replace('MONGODB_URI=', '');
    }
    
    // IMPORTANT: Use the correct database name - "flourmill" (not flour-mill-management)
    // Remove any trailing slashes first
    mongoUrl = mongoUrl.replace(/\/+$/, '');
    
    // Parse the connection string properly
    // Format: mongodb+srv://user:pass@host/database?options
    const urlParts = mongoUrl.split('?');
    let baseUrl = urlParts[0];
    const queryString = urlParts[1] ? '?' + urlParts[1] : '';
    
    // Remove trailing slash from base URL
    baseUrl = baseUrl.replace(/\/+$/, '');
    
    // Extract host part (everything after @ and before /)
    const hostMatch = baseUrl.match(/@([^/]+)/);
    const hostPart = hostMatch ? hostMatch[1] : '';
    
    // Check what comes after the host
    const afterHost = baseUrl.substring(baseUrl.indexOf(hostPart) + hostPart.length);
    
    // Target database name: "flourmill" (as used by the application)
    const targetDbName = 'flourmill';
    
    // If there's a slash after host, there might be a database name
    if (afterHost.startsWith('/')) {
      const dbName = afterHost.substring(1).split('/')[0];
      if (dbName && dbName === targetDbName) {
        // Already using correct database
        console.log(`   ✅ Using correct database: ${dbName}`);
      } else {
        // Replace with correct database name
        mongoUrl = baseUrl.replace(/\/[^/]*$/, '') + '/' + targetDbName + queryString;
        console.log(`   🔄 Setting database to: ${targetDbName}`);
      }
    } else {
      // No database name, add it
      mongoUrl = baseUrl + '/' + targetDbName + queryString;
      console.log(`   ➕ Adding database: ${targetDbName}`);
    }
    
    console.log('🔗 Connecting to MongoDB...');
    const displayUrl = mongoUrl.replace(/\/\/.*@/, '//***@');
    console.log(`   ${displayUrl.substring(0, 100)}...`);
    
    const options = {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
    };
    
    const conn = await mongoose.connect(mongoUrl, options);
    const dbName = conn.connection.name;
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    console.log(`📊 Database: ${dbName}`);
    console.log(`\n⚠️  IMPORTANT: Creating admin in database: "${dbName}"`);
    console.log(`   Make sure your application uses the SAME database!\n`);
    
    return { connection: conn, dbName };
  } catch (error) {
    console.error(`❌ Error connecting to MongoDB: ${error.message}`);
    process.exit(1);
  }
};

const createOrUpdateAdmin = async () => {
  try {
    // Connect to database
    const { dbName } = await connectDB();

    // Check if admin exists
    let adminUser = await User.findOne({ email: ADMIN_CREDENTIALS.email.toLowerCase().trim() });
    
    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(ADMIN_CREDENTIALS.password, salt);

    if (adminUser) {
      // Update existing admin
      console.log('⚠️  Admin user already exists. Updating password and details...');
      adminUser.password = hashedPassword;
      adminUser.firstName = ADMIN_CREDENTIALS.firstName;
      adminUser.lastName = ADMIN_CREDENTIALS.lastName;
      adminUser.role = ADMIN_CREDENTIALS.role;
      adminUser.status = ADMIN_CREDENTIALS.status;
      await adminUser.save();
      console.log('✅ Admin user updated!');
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

    // Verify user exists
    const verifyUser = await User.findOne({ email: ADMIN_CREDENTIALS.email.toLowerCase().trim() });
    if (!verifyUser) {
      console.error('❌ ERROR: User was not saved!');
      process.exit(1);
    }

    // Verify password
    const passwordCheck = await bcrypt.compare(ADMIN_CREDENTIALS.password, verifyUser.password);
    
    console.log('\n' + '='.repeat(60));
    console.log('📋 LOGIN CREDENTIALS');
    console.log('='.repeat(60));
    console.log('Database:  ' + dbName);
    console.log('Email:     ' + ADMIN_CREDENTIALS.email);
    console.log('Password:  ' + ADMIN_CREDENTIALS.password);
    console.log('Role:      ' + ADMIN_CREDENTIALS.role);
    console.log('Status:    ' + ADMIN_CREDENTIALS.status);
    console.log('Password Check: ' + (passwordCheck ? '✅ SUCCESS' : '❌ FAILED'));
    console.log('='.repeat(60));
    console.log('\n⚠️  IMPORTANT:');
    console.log('   1. Make sure your application connects to database: "' + dbName + '"');
    console.log('   2. Change password after first login!');
    console.log('   3. If login still fails, check your .env file MONGO_URL\n');

    // List all users in database for verification
    const allUsers = await User.find({}).select('email role status');
    console.log(`📊 Total users in "${dbName}" database: ${allUsers.length}`);
    if (allUsers.length > 0) {
      console.log('Users:');
      allUsers.forEach((u, i) => {
        console.log(`   ${i + 1}. ${u.email} (${u.role}) - ${u.status}`);
      });
    }

    // Close database connection
    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    if (error.code === 11000) {
      console.error('   Duplicate key error - email already exists');
    }
    process.exit(1);
  }
};

// Run the script
createOrUpdateAdmin();

