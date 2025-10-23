// Database Configuration
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { enableOfflineMode, isOfflineModeEnabled } from './offline-mode.js';

// Load environment variables
dotenv.config();

// MongoDB connection string from environment
// Prefer MONGO_URL, then MONGODB_URI, else use a safe local default
const MONGO_URL = process.env.MONGO_URL || process.env.MONGODB_URI || 'mongodb://localhost:27017/flourmill';

// Database connection options
const options = {
  maxPoolSize: 10, // Maintain up to 10 socket connections
  serverSelectionTimeoutMS: 5000, // Keep trying to send operations for 5 seconds
  socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
  bufferCommands: false, // Disable mongoose buffering to fail fast if no connection
};

// Connection function with retry logic and fallback
const connectWithRetry = async () => {
  try {
    console.log('🔄 Attempting to connect to MongoDB...');
    console.log(`🔗 Connection string: ${MONGO_URL}`);
    
    // Try primary environment-provided connection first
    await mongoose.connect(MONGO_URL, options);
    
    console.log('✅ Successfully connected to MongoDB');
    console.log(`📊 Database: ${mongoose.connection.name}`);
    console.log(`🌐 Host: ${mongoose.connection.host}`);
    
    return mongoose.connection;
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error.message);
    console.log('⚠️ MongoDB is not running or connection string is invalid');
    console.log('💡 Please start MongoDB locally or set MONGO_URL in .env file');
    
    // Enable offline mode for development
    console.log('🔄 Enabling offline mode for development...');
    enableOfflineMode();
    
    return null;
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
