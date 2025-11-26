/**
 * Script to list all users in the database
 */

import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';
import User from '../model/user.js';

dotenv.config();

const connectDB = async () => {
  try {
    // Use same connection logic as createAdminInCorrectDB.js
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
    
    // IMPORTANT: Use the correct database name - "flourmill"
    mongoUrl = mongoUrl.replace(/\/+$/, '');
    const urlParts = mongoUrl.split('?');
    let baseUrl = urlParts[0].replace(/\/+$/, '');
    const queryString = urlParts[1] ? '?' + urlParts[1] : '';
    
    const hostMatch = baseUrl.match(/@([^/]+)/);
    const hostPart = hostMatch ? hostMatch[1] : '';
    
    // Check what comes after the host
    const afterHost = baseUrl.substring(baseUrl.indexOf(hostPart) + hostPart.length);
    
    // Target database name: "flourmill"
    const targetDbName = 'flourmill';
    
    // If there's a slash after host, there might be a database name
    if (afterHost.startsWith('/')) {
      const dbName = afterHost.substring(1).split('/')[0];
      if (dbName && dbName === targetDbName) {
        // Already using correct database
        console.log(`   ✅ Using database: ${dbName}`);
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
    
    const options = {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
    };
    
    const conn = await mongoose.connect(mongoUrl, options);
    console.log(`✅ Connected to database: ${conn.connection.name}`);
    return { connection: conn, dbName: conn.connection.name };
  } catch (error) {
    console.error(`❌ Error: ${error.message}`);
    process.exit(1);
  }
};

const listUsers = async () => {
  try {
    const { dbName } = await connectDB();

    // Get all users
    const allUsers = await User.find({}).select('firstName lastName email role status createdAt');
    
    console.log('\n' + '='.repeat(70));
    console.log(`📊 ALL USERS IN DATABASE: "${dbName}"`);
    console.log('='.repeat(70));
    console.log(`Total Users: ${allUsers.length}\n`);
    
    if (allUsers.length === 0) {
      console.log('❌ No users found in database!\n');
    } else {
      allUsers.forEach((user, index) => {
        console.log(`${index + 1}. ${user.firstName} ${user.lastName}`);
        console.log(`   Email:    ${user.email}`);
        console.log(`   Role:     ${user.role}`);
        console.log(`   Status:   ${user.status}`);
        console.log(`   Created:  ${user.createdAt ? new Date(user.createdAt).toLocaleString() : 'N/A'}`);
        console.log('');
      });
      
      // List admin users specifically
      const adminUsers = allUsers.filter(u => u.role === 'Admin');
      console.log('='.repeat(70));
      console.log(`👑 ADMIN USERS: ${adminUsers.length}`);
      console.log('='.repeat(70));
      if (adminUsers.length > 0) {
        adminUsers.forEach((user, index) => {
          console.log(`${index + 1}. ${user.email} - ${user.status}`);
        });
      } else {
        console.log('❌ No Admin users found!');
      }
    }

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  }
};

listUsers();

