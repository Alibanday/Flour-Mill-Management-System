import mongoose from "mongoose";
import dotenv from "dotenv";
import User from "./model/user.js";

dotenv.config();

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URL, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("✅ Connected to MongoDB");
  } catch (err) {
    console.error("❌ Failed to connect to MongoDB:", err.message);
    process.exit(1);
  }
};

const testUsers = async () => {
  try {
    await connectDB();
    
    // Count all users
    const userCount = await User.countDocuments();
    console.log(`Total users in database: ${userCount}`);
    
    // Get all users
    const users = await User.find().select('-password');
    console.log("Users found:");
    users.forEach((user, index) => {
      console.log(`${index + 1}. ${user.name} (${user.email}) - Role: ${user.role}`);
    });
    
    if (users.length === 0) {
      console.log("No users found in database!");
    }
    
  } catch (error) {
    console.error("Error:", error);
  } finally {
    await mongoose.connection.close();
    console.log("Database connection closed");
  }
};

testUsers(); 