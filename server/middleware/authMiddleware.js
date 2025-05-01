// middleware/authMiddleware.js
import jwt from "jsonwebtoken";
import User from "../model/user.js";

export const protect = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) throw new Error("No token");

    const decoded = jwt.verify(token, 'yourSecretKey');
    req.user = await User.findById(decoded.id).select("-password");
    if (!req.user) throw new Error("User not found");

    next();
  } catch (err) {
    res.status(401).json({ message: "Not authorized" });
  }
};
