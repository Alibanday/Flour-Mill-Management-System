import express from "express";
import bodyParser from "body-parser";
import dotenv from "dotenv";
import cors from "cors";
import authRoutes from "./routes/auth.js";
import userRoutes from "./routes/user.js";
import employeeRoutes from "./routes/employees.js";
import attendanceRoutes from "./routes/attendance.js";
import warehouseRoutes from "./routes/warehouseRoutes.js";
import inventoryRoutes from "./routes/inventory.js";
import stockRoutes from "./routes/stockRoutes.js";
import productionRoutes from "./routes/production.js";
import salesRoutes from "./routes/sales.js";
import purchaseRoutes from "./routes/purchases.js";
import financialRoutes from "./routes/financial.js";
import supplierRoutes from "./routes/suppliers.js";
import bagPurchaseRoutes from "./routes/bagPurchases.js";
import foodPurchaseRoutes from "./routes/foodPurchases.js";
import gatePassRoutes from "./routes/gatePass.js";
import reportRoutes from "./routes/reports.js";
import reportGenerationRoutes from "./routes/reportGeneration.js";
import notificationRoutes from "./routes/notifications.js";
import systemConfigRoutes from "./routes/systemConfig.js";
import customerRoutes from "./routes/customers.js";
import stockTransferRoutes from "./routes/stockTransfers.js";
import repackingRoutes from "./routes/repacking.js";
import productionCostRoutes from "./routes/productionCosts.js";
import fileUpload from "express-fileupload";
import connectWithRetry from "./config/database.js";
import NotificationService from "./services/notificationService.js";

// Initialize dotenv before accessing any environment variables
dotenv.config();

const app = express();

app.use(fileUpload({
  useTempFiles: true,
}));

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:5173",
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  credentials: true
}));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Routes
app.use("/api/auth", authRoutes);

app.use("/api/users", userRoutes);
app.use("/api/employees", employeeRoutes);
app.use("/api/attendance", attendanceRoutes);

app.use("/api/warehouses", warehouseRoutes);

app.use("/api/inventory", inventoryRoutes);

app.use("/api/stock", stockRoutes);
app.use("/api/production", productionRoutes);
app.use("/api/sales", salesRoutes);
app.use("/api/purchases", purchaseRoutes);
app.use("/api/financial", financialRoutes);
app.use("/api/suppliers", supplierRoutes);
app.use("/api/bag-purchases", bagPurchaseRoutes);
app.use("/api/food-purchases", foodPurchaseRoutes);
app.use("/api/gate-pass", gatePassRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/reports", reportGenerationRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/system-config", systemConfigRoutes);
app.use("/api/customers", customerRoutes);
app.use("/api/stock-transfers", stockTransferRoutes);
app.use("/api/repacking", repackingRoutes);
app.use("/api/production-costs", productionCostRoutes);
        
        // Health check endpoint
app.get("/api/health", (_, res) => {
  res.status(200).json({ 
    status: "OK", 
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development'
  });
});

const PORT = process.env.PORT || 7000;

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
  
  // Connect to MongoDB
  connectWithRetry();

  // Lightweight scheduler for notifications (runs every 60s in dev)
  const intervalMs = parseInt(process.env.NOTIFICATION_CHECK_INTERVAL_MS || '60000');
  setInterval(async () => {
    try {
      await NotificationService.runAllChecks();
    } catch (e) {
      console.warn('Notification checks failed:', e.message);
    }
  }, intervalMs);
});