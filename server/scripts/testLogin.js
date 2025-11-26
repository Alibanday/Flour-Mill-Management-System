/**
 * Script to test login credentials
 */

import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';
import User from '../model/user.js';

dotenv.config();

const connectDB = async () => {
  try {
    let mongoUrl = process.env.MONGO_URL || 
                   process.env.MONGODB_URI || 
                   process.env.MONGO_URI || 
                   'mongodb://localhost:27017/flourmill';
    
    if (mongoUrl.startsWith('MONGO_URL=')) {
      mongoUrl = mongoUrl.replace('MONGO_URL=', '');
    }
    if (mongoUrl.startsWith('MONGODB_URI=')) {
      mongoUrl = mongoUrl.replace('MONGODB_URI=', '');
    }
    
    mongoUrl = mongoUrl.replace(/\/+$/, '');
    const urlParts = mongoUrl.split('?');
    let baseUrl = urlParts[0].replace(/\/+$/, '');
    const queryString = urlParts[1] ? '?' + urlParts[1] : '';
    
    const hostMatch = baseUrl.match(/@([^/]+)/);
    const hostPart = hostMatch ? hostMatch[1] : '';
    const afterHost = baseUrl.substring(baseUrl.indexOf(hostPart) + hostPart.length);
    
    const targetDbName = 'flourmill';
    if (!afterHost.startsWith('/') || afterHost.split('/')[1] !== targetDbName) {
      baseUrl = baseUrl.replace(/\/[^/]*$/, '');
      mongoUrl = baseUrl + '/' + targetDbName + queryString;
    }
    
    const options = {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
    };
    
    const conn = await mongoose.connect(mongoUrl, options);
    return { connection: conn, dbName: conn.connection.name };
  } catch (error) {
    console.error(`❌ Error: ${error.message}`);
    process.exit(1);
  }
};

const testLogin = async (email, password) => {
  try {
    const { dbName } = await connectDB();
    console.log(`\n🔍 Testing login in database: "${dbName}"\n`);
    
    // Find user by email
    const user = await User.findOne({ email: email.toLowerCase().trim() });
    
    if (!user) {
      console.log(`❌ User not found with email: ${email}`);
      console.log('\n📋 Available users in database:');
      const allUsers = await User.find({}).select('email role status');
      if (allUsers.length === 0) {
        console.log('   No users found!');
      } else {
        allUsers.forEach(u => console.log(`   - ${u.email} (${u.role})`));
      }
      await mongoose.connection.close();
      process.exit(1);
    }
    
    console.log(`✅ User found: ${user.firstName} ${user.lastName}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Role: ${user.role}`);
    console.log(`   Status: ${user.status}`);
    
    // Check status
    if (user.status === 'Inactive') {
      console.log('\n❌ Login would fail: Account is Inactive');
      await mongoose.connection.close();
      process.exit(1);
    }
    
    // Test password
    console.log(`\n🔐 Testing password...`);
    const passwordMatch = await bcrypt.compare(password, user.password);
    
    if (passwordMatch) {
      console.log('✅ Password is CORRECT!');
      console.log('\n✅ Login should work with these credentials:');
      console.log(`   Email: ${email}`);
      console.log(`   Password: ${password}`);
    } else {
      console.log('❌ Password is INCORRECT!');
      console.log(`   The password "${password}" does not match the stored hash.`);
    }
    
    await mongoose.connection.close();
    process.exit(passwordMatch ? 0 : 1);
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  }
};

// Get email and password from command line arguments
const email = process.argv[2] || 'admin@flourmill.com';
const password = process.argv[3] || 'admin123';

testLogin(email, password);

