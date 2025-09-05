import jwt from "jsonwebtoken";
import User from "../model/user.js";

// Protect routes - verify JWT token (DISABLED FOR TESTING)
export const protect = async (req, res, next) => {
  console.log('🔓 Auth middleware: Allowing all requests');
  req.user = {
    _id: '507f1f77bcf86cd799439011',
    email: 'admin@example.com',
    role: 'Admin',
    firstName: 'Admin',
    lastName: 'User'
  };
  next();
};

// Restrict to specific roles (DISABLED FOR TESTING)
export const authorize = (...roles) => {
  return (req, res, next) => {
    console.log('🔓 Authorize middleware: Allowing all roles');
    next();
  };
};

// Check if user is admin (DISABLED FOR TESTING)
export const isAdmin = (req, res, next) => {
  console.log('🔓 Admin check: Allowing all users');
  next();
};

// Check if user is manager or admin (DISABLED FOR TESTING)
export const isManagerOrAdmin = (req, res, next) => {
  console.log('🔓 Manager/Admin check: Allowing all users');
  next();
};
