// Database Setup Script for Flour Mill Management System
import mongoose from 'mongoose';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// MongoDB connection string with your credentials
const MONGO_URL = 'mongodb+srv://taibkhan323:taib%40111@cluster0.ytaqnkh.mongodb.net/flour-mill-management?retryWrites=true&w=majority&appName=Cluster0';

// Test database connection
const testConnection = async () => {
  try {
    console.log('🔄 Testing MongoDB connection...');
    console.log('📊 Database: flour-mill-management');
    console.log('👤 Username: taibkhan323');
    
    await mongoose.connect(MONGO_URL, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      bufferCommands: false
    });
    
    console.log('✅ Successfully connected to MongoDB Atlas!');
    console.log(`📊 Database: ${mongoose.connection.name}`);
    console.log(`🌐 Host: ${mongoose.connection.host}`);
    console.log(`🔗 Connection State: ${mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected'}`);
    
    // Test basic operations
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log(`📁 Collections found: ${collections.length}`);
    
    if (collections.length > 0) {
      console.log('📋 Existing collections:');
      collections.forEach(col => console.log(`   - ${col.name}`));
    } else {
      console.log('📋 No collections found - database is empty');
    }
    
    await mongoose.connection.close();
    console.log('✅ Connection test completed successfully!');
    
  } catch (error) {
    console.error('❌ Connection failed:', error.message);
    
    if (error.message.includes('authentication failed')) {
      console.log('💡 Tip: Check your username and password');
    } else if (error.message.includes('network')) {
      console.log('💡 Tip: Check your internet connection and MongoDB Atlas network access');
    } else if (error.message.includes('cluster')) {
      console.log('💡 Tip: Check your cluster URL and make sure the cluster is running');
    }
  }
};

// Run the test
testConnection();
