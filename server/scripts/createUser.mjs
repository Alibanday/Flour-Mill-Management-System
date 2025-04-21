// server/scripts/createUser.mjs
import mongoose from "mongoose";
import bcrypt from "bcrypt";
import User from "../model/user.js";
import dotenv from "dotenv";

dotenv.config();

const createUser = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URL);
    console.log("✅ Connected to MongoDB");

    const email = "admin@example.com";
    const plainPassword = "test1234"; // Test password
    
    const existing = await User.findOne({ email });
    if (existing) {
      console.log("⚠️ User already exists, deleting old record...");
      await User.deleteOne({ email }); // Remove old user
    }

    const hashedPassword = await bcrypt.hash(plainPassword, 10);
    console.log("🔑 Password hashed:", hashedPassword);

    const user = await User.create({
      email,
      password: hashedPassword // Store the HASHED password
    });

    console.log("✅ Test user created:", {
      email: user.email,
      password: user.password // Should show the hashed version
    });
    
    process.exit(0);
  } catch (err) {
    console.error("❌ Error creating user:", err);
    process.exit(1);
  }
};

createUser();