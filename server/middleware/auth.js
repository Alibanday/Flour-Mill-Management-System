import jwt from "jsonwebtoken";
import User from "../model/user.js";

// Protect routes - Verify JWT token
export const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    try {
      // Get token from header
      token = req.headers.authorization.split(" ")[1];

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET || "yourSecretKey");

      // Get user from the token
      req.user = await User.findById(decoded.id).select("-password");

      if (!req.user) {
        return res.status(401).json({ success: false, message: "Not authorized, user not found" });
      }

      next();
    } catch (error) {
      console.error(error);
      res.status(401).json({ success: false, message: "Not authorized, token failed" });
    }
  } else {
    res.status(401).json({ success: false, message: "Not authorized, no token" });
  }
};

// Grant access to specific roles
export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: "User not authenticated" });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `User role ${req.user.role} is not authorized to access this route`
      });
    }
    next();
  };
};

// Helper for backward compatibility or specific checks
export const isAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'Admin') {
    next();
  } else {
    res.status(403).json({ success: false, message: "Not authorized as admin" });
  }
};

export const isManagerOrAdmin = (req, res, next) => {
  if (req.user && (req.user.role === 'Admin' || req.user.role === 'General Manager' || req.user.role === 'Manager')) {
    next();
  } else {
    res.status(403).json({ success: false, message: "Not authorized as manager or admin" });
  }
};

// Warehouse Manager Access Control
export const isWarehouseManager = (req, res, next) => {
  if (req.user && (req.user.role === 'Warehouse Manager' || req.user.role === 'Admin' || req.user.role === 'General Manager')) {
    next();
  } else {
    res.status(403).json({ success: false, message: "Not authorized as Warehouse Manager" });
  }
};
