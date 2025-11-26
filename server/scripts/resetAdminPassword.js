/**
 * Script to reset admin user password
 * Usage: node server/scripts/resetAdminPassword.js <email> <newPassword>
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
    return { connection: conn, dbName: conn.connection.name };
  } catch (error) {
    console.error(`❌ Error: ${error.message}`);
    process.exit(1);
  }
};

const resetPassword = async (email, newPassword) => {
  try {
    const { dbName } = await connectDB();
    console.log(`\n🔍 Resetting password in database: "${dbName}"\n`);
    
    // Find user by email (case-insensitive search)
    const user = await User.findOne({ 
      email: { $regex: new RegExp(`^${email}$`, 'i') }
    });
    
    if (!user) {
      console.log(`❌ User not found with email: ${email}`);
      console.log('\n📋 Available users:');
      const allUsers = await User.find({}).select('email role');
      allUsers.forEach(u => console.log(`   - ${u.email} (${u.role})`));
      await mongoose.connection.close();
      process.exit(1);
    }
    
    console.log(`✅ User found: ${user.firstName} ${user.lastName}`);
    console.log(`   Current email: ${user.email}`);
    console.log(`   Role: ${user.role}`);
    
    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);
    
    // Update password
    user.password = hashedPassword;
    user.status = 'Active'; // Ensure user is active
    await user.save();
    
    console.log(`\n✅ Password reset successfully!`);
    console.log('\n' + '='.repeat(60));
    console.log('📋 UPDATED LOGIN CREDENTIALS');
    console.log('='.repeat(60));
    console.log(`Email:    ${user.email}`);
    console.log(`Password: ${newPassword}`);
    console.log('='.repeat(60));
    console.log('\n⚠️  IMPORTANT: Change password after first login!\n');
    
    // Verify password works
    const passwordCheck = await bcrypt.compare(newPassword, user.password);
    console.log(`Password verification: ${passwordCheck ? '✅ SUCCESS' : '❌ FAILED'}`);
    
    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  }
};

// Get email and password from command line arguments
// Default to Admin@gmail.com with a strong password
const email = process.argv[2] || 'Admin@gmail.com';
const newPassword = process.argv[3] || 'Admin@123';

if (!email || !newPassword) {
  console.log('Usage: node server/scripts/resetAdminPassword.js <email> <newPassword>');
  console.log('Example: node server/scripts/resetAdminPassword.js Admin@gmail.com Admin@123');
  process.exit(1);
}

resetPassword(email, newPassword);

