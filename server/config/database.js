// Database Configuration
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { enableOfflineMode, isOfflineModeEnabled } from './offline-mode.js';

// Load environment variables
dotenv.config();

// MongoDB connection string from environment
// Prefer MONGO_URL, then MONGODB_URI, else use a safe local default
const MONGO_URL = process.env.MONGO_URL || process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/flour-mill-management';

// Database connection options
const options = {
  maxPoolSize: 10, // Maintain up to 10 socket connections
  serverSelectionTimeoutMS: 5000, // Keep trying to send operations for 5 seconds
  socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
  bufferCommands: true, // Enable mongoose buffering to handle operations before connection
};

// Connection function with retry logic and fallback
const connectWithRetry = async () => {
  try {
    console.log('🔄 Attempting to connect to MongoDB...');
    
    // Try primary environment-provided connection first
    await mongoose.connect(MONGO_URL, options);
    
    console.log('✅ Successfully connected to MongoDB Atlas');
    console.log(`📊 Database: ${mongoose.connection.name}`);
    console.log(`🌐 Host: ${mongoose.connection.host}`);
    
    return mongoose.connection;
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error.message);
    console.log('⚠️ Ensure MONGO_URL or MONGODB_URI is set in environment (.env)');
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
