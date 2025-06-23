import express from "express";
import mongoose from "mongoose";
import bodyParser from "body-parser";
import dotenv from "dotenv";
import cors from "cors";
import authRoutes from "./routes/auth.js";
import userRoutes from "./routes/user.js";
import warehouseRoutes from "./routes/warehouseRoutes.js";
import stockRoutes from "./routes/stockRoutes.js";
import fileUpload from "express-fileupload";
import prCenterRoutes from "./routes/prCenterRoutes.js";
import accountRoutes from "./routes/accountRoutes.js";
import invoiceRoutes from "./routes/invoiceRoutes.js";
import bagRoutes from "./routes/bagRoutes.js";
import dailyProductionRoutes from "./routes/dailyProductionRoutes.js";
import itemRoutes from "./routes/itemRoutes.js";
// Initialize dotenv before accessing any environment variables
dotenv.config();

// Verify required environment variables
if (!process.env.MONGO_URL) {
  console.error("❌ FATAL ERROR: MONGO_URL is not defined in .env file");
  process.exit(1);
}

const app = express();

app.use(fileUpload({
  useTempFiles: true,
}));

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:5173",
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  credentials: true
}));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Routes
app.use("/api/auth", authRoutes);

app.use("/api/users", userRoutes);

app.use("/api/warehouse", warehouseRoutes);

app.use("/api/stock", stockRoutes);

app.use("/api/prcenter", prCenterRoutes);

app.use("/api/accounts", accountRoutes);

app.use("/api/invoice", invoiceRoutes);

app.use("/api/bags", bagRoutes);

app.use("/api/dailyproduction", dailyProductionRoutes);

app.use("/api/items", itemRoutes);

// Health check endpoint
app.get("/api/health", (_, res) => {
  res.status(200).json({ status: "OK", dbStatus: mongoose.connection.readyState });
});

const PORT = process.env.PORT || 7000;

// Database connection with retry logic
const connectWithRetry = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URL, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("✅ Connected to MongoDB");
  } catch (err) {
    console.error("❌ Failed to connect to MongoDB:", err.message);
    console.log("🔄 Retrying connection in 5 seconds...");
    setTimeout(connectWithRetry, 5000);
  }
};

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  connectWithRetry();
});

// Event listeners for MongoDB connection
mongoose.connection.on("connected", () => {
  console.log("📚 MongoDB connected");
});

mongoose.connection.on("error", (err) => {
  console.error("❌ MongoDB connection error:", err);
});

mongoose.connection.on("disconnected", () => {
  console.log("⚠️ MongoDB disconnected");
});

// Graceful shutdown
process.on("SIGINT", async () => {
  await mongoose.connection.close();
  console.log("⏏️ MongoDB connection closed through app termination");
  process.exit(0);
});