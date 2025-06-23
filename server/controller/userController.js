import { v2 as cloudinary } from "cloudinary";
import User from "../model/user.js";
import mongoose from "mongoose";
import bcrypt from "bcrypt";

cloudinary.config({
  cloud_name: 'dqm4dcnqf',
  api_key: '182398791371529',
  api_secret: '7Psdvk7EDDmj2W4dTrW7Sz_53FE',
});


export const createUser = async (req, res) => {
  try {
    if (!req.user || req.user.role !== 'admin') {
      return res.status(403).json({ message: "Only admin can create users" });
    }

    let profileUrl = "";
    if (req.files?.profileImage) {
      const result = await cloudinary.uploader.upload(req.files.profileImage.tempFilePath, {
        folder: "profiles",
      });
      profileUrl = result.secure_url;
    }

    // Hash the password before saving
    const plainPassword = req.body.password;
    const hashedPassword = await bcrypt.hash(plainPassword, 10);

    const user = new User({
      ...req.body,
      password: hashedPassword,  // Use hashed password
      profileImage: profileUrl,
    });

    await user.save();

    res.status(201).json({ message: "User created successfully", user });
  } catch (err) {
    console.error("User creation failed:", err);
    if (err.name === "ValidationError") {
      return res.status(400).json({ message: err.message, errors: err.errors });
    }
    if (err.code === 11000 && err.keyPattern?.email) {
      return res.status(400).json({ message: "Email already exists!" });
    }
    res.status(500).json({ message: "Server error" });
  }
};


// Get All Users (accessible to any authenticated user)
export const getAllUsers = async (req, res) => {
  try {
    const users = await User.find(); // Fetch all users without filtering by role
    res.status(200).json(users);
  } catch (err) {
    console.error("Error fetching users:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// Get Users by Role (accessible to any authenticated user)
export const getUsersByRole = async (req, res) => {
  try {
    const { role } = req.params;
    
    if (!role) {
      return res.status(400).json({ message: "Role parameter is required" });
    }

    const users = await User.find({ role: role, status: 'active' }).select('-password');
    res.status(200).json(users);
  } catch (err) {
    console.error("Error fetching users by role:", err);
    res.status(500).json({ message: "Server error" });
  }
};


// Get Single User (accessible to any authenticated user)
export const getUser = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid user ID" });
    }

    const user = await User.findById(id);
    if (!user) return res.status(404).json({ message: "User not found" });

    res.status(200).json(user);
  } catch (err) {
    console.error("Error fetching user:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// Update User (admin only)
export const updateUser = async (req, res) => {
  try {
    if (!req.user || req.user.role !== 'admin') {
      return res.status(403).json({ message: "Only admin can update users" });
    }

    const { id } = req.params;
    const updatedData = { ...req.body };

    if (req.files?.profileImage) {
      const result = await cloudinary.uploader.upload(req.files.profileImage.tempFilePath, {
        folder: "profiles",
      });
      updatedData.profileImage = result.secure_url;
    }

    const user = await User.findByIdAndUpdate(id, updatedData, { new: true, runValidators: true });

    if (!user) return res.status(404).json({ message: "User not found" });

    res.status(200).json({ message: "User updated successfully", user });
  } catch (err) {
    console.error("Error updating user:", err);
    if (err.name === "ValidationError") {
      return res.status(400).json({ message: err.message, errors: err.errors });
    }
    if (err.code === 11000 && err.keyPattern?.email) {
      return res.status(400).json({ message: "Email already exists!" });
    }
    res.status(500).json({ message: "Server error" });
  }
};

// Delete User (admin only)
export const deleteUser = async (req, res) => {
  try {
    if (!req.user || req.user.role !== 'admin') {
      return res.status(403).json({ message: "Only admin can delete users" });
    }

    const { id } = req.params;

    const user = await User.findByIdAndDelete(id);
    if (!user) return res.status(404).json({ message: "User not found" });

    res.status(200).json({ message: "User deleted successfully" });
  } catch (err) {
    console.error("Error deleting user:", err);
    res.status(500).json({ message: "Server error" });
  }
};
