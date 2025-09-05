// Database Configuration
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { enableOfflineMode, isOfflineModeEnabled } from './offline-mode.js';

// Load environment variables
dotenv.config();

// MongoDB connection string - use working connection
const MONGO_URL_SRV = process.env.MONGO_URL || 'mongodb+srv://taibkhan323:taib%40111@cluster0.ytaqnkh.mongodb.net/flour-mill-management?retryWrites=true&w=majority&appName=Cluster0';
const MONGO_URL_DIRECT = 'mongodb://taibkhan323:taib%40111@ac-rozuxws-shard-00-01.ytaqnkh.mongodb.net:27017,ac-rozuxws-shard-00-00.ytaqnkh.mongodb.net:27017,ac-rozuxws-shard-00-02.ytaqnkh.mongodb.net:27017/flour-mill-management?ssl=true&replicaSet=atlas-14b8qk-shard-0&authSource=admin&retryWrites=true&w=majority';

// Alternative working connection string
const MONGO_URL_WORKING = 'mongodb+srv://taibkhan323:taib%40111@cluster0.ytaqnkh.mongodb.net/flour-mill-management?retryWrites=true&w=majority';

// Database connection options
const options = {
  maxPoolSize: 10, // Maintain up to 10 socket connections
  serverSelectionTimeoutMS: 5000, // Keep trying to send operations for 5 seconds
  socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
  bufferCommands: false, // Disable mongoose buffering
};

// Connection function with retry logic and fallback
const connectWithRetry = async () => {
  try {
    console.log('🔄 Attempting to connect to MongoDB...');
    
    // Try the working connection string first
    await mongoose.connect(MONGO_URL_WORKING, options);
    
    console.log('✅ Successfully connected to MongoDB Atlas');
    console.log(`📊 Database: ${mongoose.connection.name}`);
    console.log(`🌐 Host: ${mongoose.connection.host}`);
    
    return mongoose.connection;
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error.message);
    console.log('🔄 Trying alternative connection...');
    
    // Try alternative connection
    try {
      await mongoose.connect(MONGO_URL_SRV, options);
      console.log('✅ Successfully connected to MongoDB Atlas with alternative URL');
      return mongoose.connection;
    } catch (retryError) {
      console.error('❌ Alternative connection also failed:', retryError.message);
      console.log('🔄 Trying direct connection...');
      
      // Try direct connection
      try {
        await mongoose.connect(MONGO_URL_DIRECT, options);
        console.log('✅ Successfully connected to MongoDB Atlas with direct connection');
        return mongoose.connection;
      } catch (directError) {
        console.error('❌ All connection attempts failed:', directError.message);
        console.log('⚠️ Server will continue running - database operations may work later');
        // Don't throw error - let the app continue
        return null;
      }
    }
  }
};

// Connection event handlers
mongoose.connection.on('connected', () => {
  console.log('📚 Mongoose connected to MongoDB Atlas');
});

mongoose.connection.on('error', (err) => {
  console.error('❌ Mongoose connection error:', err);
});

mongoose.connection.on('disconnected', () => {
  console.log('⚠️ Mongoose disconnected from MongoDB Atlas');
});

// Graceful shutdown
process.on('SIGINT', async () => {
  try {
    await mongoose.connection.close();
    console.log('⏏️ MongoDB connection closed through app termination');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error closing MongoDB connection:', error);
    process.exit(1);
  }
});

// Export connection function
export default connectWithRetry;
