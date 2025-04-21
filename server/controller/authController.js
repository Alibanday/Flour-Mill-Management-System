// server/controller/authController.js
import User from "../model/user.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

export const login = async (req, res) => {
  const { email, password } = req.body;
  
  try {
    // 1. Find user
    const user = await User.findOne({ email }).select("+password"); // Explicitly include password
    
    if (!user) {
      return res.status(400).json({ success: false, message: "Invalid credentials" });
    }

    // 2. Compare passwords
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: "Invalid credentials" });
    }

    // 3. Generate token
    const token = jwt.sign(
      { userId: user._id }, 
      process.env.JWT_SECRET || "your_fallback_secret",
      { expiresIn: "1d" }
    );

    // 4. Return response (without password)
    const userWithoutPassword = { ...user._doc };
    delete userWithoutPassword.password;

    res.json({
      success: true,
      token,
      user: userWithoutPassword
    });

  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};