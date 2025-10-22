import jwt from "jsonwebtoken";
import User from "../model/user.js";

// TEST MODE: Allow all requests and inject a default Admin user
export const protect = async (req, res, next) => {
  req.user = {
    _id: '507f1f77bcf86cd799439011',
    id: '507f1f77bcf86cd799439011',
    email: 'admin@example.com',
    role: 'Admin',
    firstName: 'Admin',
    lastName: 'User'
  };
  next();
};

// TEST MODE: Allow all roles
export const authorize = (...roles) => {
  return (req, res, next) => {
    next();
  };
};

// TEST MODE helpers
export const isAdmin = (req, res, next) => { next(); };
export const isManagerOrAdmin = (req, res, next) => { next(); };
