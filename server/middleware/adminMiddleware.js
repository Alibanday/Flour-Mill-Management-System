import jwt from "jsonwebtoken";

export const authAdmin = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, 'yourSecretKey');
    if (decoded.role !== "admin") {
      return res.status(403).json({ message: "Admin access required" });
    }
    req.user = decoded; // Attach user info to request
    next();
  } catch (error) {
    res.status(401).json({ message: "Invalid token" });
  }
};

export const authAdminOrSales = (req, res, next) => {
  console.log('--- Middleware Debug ---');
  
  if (!req.user) {
    console.log('No user found in request');
    return res.status(403).json({ message: "Access denied - no user" });
  }

  console.log('User role:', req.user.role);
  
  if (!["admin", "sale manager"].includes(req.user.role)) {
    console.log(`Role '${req.user.role}' not allowed`);
    return res.status(403).json({ 
      message: `Access denied. Your role: ${req.user.role}` 
    });
  }

  console.log('Access granted');
  next();
};


