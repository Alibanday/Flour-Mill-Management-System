// server/scripts/createUser.mjs
import mongoose from "mongoose";
import bcrypt from "bcrypt";
import User from "../model/user.js";
import Warehouse from "../model/warehouse.js";
import dotenv from "dotenv";

dotenv.config();

const createUser = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URL);
    console.log("✅ Connected to MongoDB");

    // First create a test warehouse
    let warehouse = await Warehouse.findOne({ name: "Test Warehouse" });
    if (!warehouse) {
      warehouse = await Warehouse.create({
        warehouseNumber: "WH001",
        name: "Test Warehouse",
        location: "Test Location",
        status: "Active",
        description: "Test warehouse for development"
      });
      console.log("✅ Test warehouse created:", warehouse.name);
    }

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
      firstName: "Admin",
      lastName: "User",
      email,
      password: hashedPassword,
      role: "Admin",
      warehouse: warehouse._id,
      cnic: "12345-1234567-1",
      mobile: "0300-1234567",
      address: "Test Address"
    });

    console.log("✅ Test user created:", {
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role
    });
    
    process.exit(0);
  } catch (err) {
    console.error("❌ Error creating user:", err);
    process.exit(1);
  }
};

createUser();