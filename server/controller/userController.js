import { v2 as cloudinary } from "cloudinary";
import bcrypt from "bcrypt";
import User from "../model/user.js";
import mongoose from "mongoose";

cloudinary.config({
  cloud_name: 'dqm4dcnqf',
  api_key: '182398791371529',
  api_secret: '7Psdvk7EDDmj2W4dTrW7Sz_53FE',
});

export const createUser = async (req, res) => {
  try {
    let profileUrl = "";

    if (req.files?.profileImage) {
      const result = await cloudinary.uploader.upload(req.files.profileImage.tempFilePath, {
        folder: "profiles",
      });
      profileUrl = result.secure_url;
    }

    // Hash password before saving
    const userData = { ...req.body, profileImage: profileUrl };
    if (userData.password) {
      const salt = await bcrypt.genSalt(10);
      userData.password = await bcrypt.hash(userData.password, salt);
    }

    const user = new User(userData);
    await user.save();

    // Remove password from response
    const userResponse = user.toObject();
    delete userResponse.password;

    res.status(201).json({ message: "User created successfully", user: userResponse });
  } catch (err) {
    console.error(err);

    if (err.code === 11000 && err.keyPattern?.email) {
      return res.status(400).json({ message: "Email already exists!" });
    }

    res.status(500).json({ message: "Server error" });
  }
};

export const getAllUsers = async (req, res) => {
  try {
    const { role } = req.query;
    
    let query = {};
    
    // Filter by role if provided
    if (role) {
      query.role = role;
    } else {
      // Exclude admin users by default unless specifically requested
      query.role = { $ne: "Admin" };
    }
    
    const users = await User.find(query).select('-password');
    
    res.status(200).json({ 
      success: true,
      data: users,
      total: users.length 
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ 
      success: false,
      message: "Server error" 
    });
  }
};

export const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findByIdAndDelete(id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.status(200).json({ message: "User deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

export const updateUser = async (req, res) => {
  try {
    const { id } = req.params;

    const updatedData = { ...req.body };

    if (req.files?.profileImage) {
      const result = await cloudinary.uploader.upload(req.files.profileImage.tempFilePath, {
        folder: "profiles",
      });
      updatedData.profileImage = result.secure_url;
    }

    // Hash password if provided
    if (updatedData.password) {
      const salt = await bcrypt.genSalt(10);
      updatedData.password = await bcrypt.hash(updatedData.password, salt);
    }

    const user = await User.findByIdAndUpdate(id, updatedData, { new: true, runValidators: true });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Remove password from response
    const userResponse = user.toObject();
    delete userResponse.password;

    res.status(200).json({ message: "User updated successfully", user: userResponse });
  } catch (err) {
    console.error(err);

    if (err.code === 11000 && err.keyPattern?.email) {
      return res.status(400).json({ message: "Email already exists!" });
    }

    res.status(500).json({ message: "Server error while updating user" });
  }
};

export const getUser = async (req, res) => {
    try {
      const { id } = req.params;
  
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ message: 'Invalid user ID' });
      }
  
      const user = await User.findById(id);
  
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
  
      res.status(200).json(user);
    } catch (error) {
      console.error('Error fetching user:', error);
      res.status(500).json({ message: 'Server error' });
    }
  };