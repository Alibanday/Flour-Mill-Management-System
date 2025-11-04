// middleware/authMiddleware.js
import jwt from "jsonwebtoken";
import User from "../model/user.js";
import mongoose from "mongoose";

export const protect = async (req, res, next) => {
  try {
    console.log('\n🔐 ========== AUTH MIDDLEWARE CALLED ==========');
    console.log('📍 Route:', req.method, req.path);
    
    // Check database connection first
    const dbState = mongoose.connection.readyState;
    console.log('📊 Database connection state:', dbState === 1 ? '✅ Connected' : dbState === 2 ? '⏳ Connecting' : '❌ Disconnected');
    
    if (dbState !== 1) {
      console.error('❌ Database not connected! State:', dbState);
      return res.status(503).json({ 
        message: "Service temporarily unavailable - Database connection issue",
        dbState: dbState
      });
    }
    
    const authHeader = req.headers.authorization;
    console.log('🔑 Authorization header:', authHeader ? authHeader.substring(0, 30) + '...' : '❌ MISSING');
    
    if (!authHeader) {
      console.log('❌ No Authorization header found');
      return res.status(401).json({ message: "Not authorized - No token provided" });
    }

    const token = authHeader.split(" ")[1];
    if (!token) {
      console.log('❌ No token found in Authorization header');
      return res.status(401).json({ message: "Not authorized - No token provided" });
    }

    console.log('🔑 Token extracted:', token.substring(0, 30) + '...');
    
    // Verify token
    let decoded;
    try {
      const jwtSecret = process.env.JWT_SECRET || 'yourSecretKey';
      console.log('🔐 Using JWT secret:', jwtSecret.substring(0, 10) + '...');
      decoded = jwt.verify(token, jwtSecret);
      console.log('✅ Token decoded successfully');
      console.log('📋 Decoded payload:', JSON.stringify(decoded, null, 2));
    } catch (jwtError) {
      console.error('❌ JWT verification failed:', jwtError.message);
      console.error('❌ Error name:', jwtError.name);
      if (jwtError.name === 'JsonWebTokenError') {
        return res.status(401).json({ message: "Not authorized - Invalid token" });
      }
      if (jwtError.name === 'TokenExpiredError') {
        return res.status(401).json({ message: "Not authorized - Token expired" });
      }
      return res.status(401).json({ message: "Not authorized - Token verification failed" });
    }
    
    // Find user by ID with timeout
    let user;
    try {
      const userId = decoded.id;
      console.log('🔍 Looking up user with ID:', userId);
      
      // Add timeout to prevent hanging
      const userQuery = User.findById(userId).select("-password");
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Database query timeout')), 5000)
      );
      
      user = await Promise.race([userQuery, timeoutPromise]);
      
      if (!user) {
        console.log('❌ User not found for ID:', userId);
        return res.status(401).json({ message: "Not authorized - User not found" });
      }
      
      console.log('✅ User found:', user.email, user.role);
      console.log('✅ User ID:', user._id);
    } catch (dbError) {
      console.error('❌ Database error finding user:', dbError.message);
      if (dbError.message === 'Database query timeout') {
        console.error('❌ Query timed out - database might be slow or disconnected');
        return res.status(503).json({ message: "Service temporarily unavailable - Database timeout" });
      }
      console.error('❌ Database error stack:', dbError.stack);
      return res.status(500).json({ message: "Server error - Database connection issue" });
    }
    
    req.user = user;
    console.log('✅ Auth middleware passed - proceeding to route handler');
    console.log('🔐 ========== END AUTH MIDDLEWARE ==========\n');
    next();
  } catch (err) {
    console.error('❌ Auth middleware error:', err.message);
    console.error('❌ Auth middleware stack:', err.stack);
    res.status(401).json({ message: "Not authorized" });
  }
};
