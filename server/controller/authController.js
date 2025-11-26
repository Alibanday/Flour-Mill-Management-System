
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import User from "../model/user.js";

export const login = async (req, res) => {
  const { email, password } = req.body;

  try {
    // Case-insensitive email search
    const user = await User.findOne({ 
      email: { $regex: new RegExp(`^${email}$`, 'i') }
    });
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

    // If user doesn't have assignedWarehouse field but is a warehouse manager, try to find warehouse by manager field
    let warehouseId = user.assignedWarehouse;
    if (!warehouseId && user.role === 'Warehouse Manager') {
      try {
        const Warehouse = (await import("../model/wareHouse.js")).default;
        const warehouse = await Warehouse.findOne({ manager: user._id });
        if (warehouse) {
          warehouseId = warehouse._id;
          // Update user's assignedWarehouse field for future logins
          await User.findByIdAndUpdate(user._id, { assignedWarehouse: warehouse._id });
          console.log('Found and assigned warehouse to manager:', warehouse._id);
        } else {
          console.log('No warehouse found for manager:', user._id);
        }
      } catch (err) {
        console.error('Error finding warehouse for manager:', err);
      }
    }

    // Convert warehouseId to string if it exists (MongoDB ObjectId serialization)
    const warehouseIdString = warehouseId ? warehouseId.toString() : null;

    res.json({
      success: true,
      token,
      user: {
        _id: user._id.toString(),
        id: user._id.toString(), // Keep both for compatibility
        email: user.email,
        role: user.role,
        firstName: user.firstName,
        lastName: user.lastName,
        assignedWarehouse: warehouseIdString
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
