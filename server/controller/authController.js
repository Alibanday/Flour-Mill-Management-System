
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import User from "../model/user.js";

export const login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ 
        success: false,
        message: "User not found" 
      });
    }

    {/*if (!user.warehouse) {
      return res.status(403).json({ message: "Warehouse not assigned. Contact admin." });
    }*/}

    // Check if user is active
    if (user.status === 'Inactive') {
      return res.status(403).json({ 
        success: false,
        message: "Account is deactivated. Please contact administrator." 
      });
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(401).json({ 
        success: false,
        message: "Incorrect password" 
      });
    }

    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET || "yourSecretKey", { expiresIn: "9d" });

    res.json({ 
      success: true,
      token, 
      user: { 
        id: user._id, 
        email: user.email, 
        role: user.role,
        firstName: user.firstName,
        lastName: user.lastName,
        warehouse: user.warehouse
      } 
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ 
      success: false,
      message: "Server error" 
    });
  }
};
