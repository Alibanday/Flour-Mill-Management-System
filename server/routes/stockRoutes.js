// routes/stockRoutes.js
import express from "express";
import {
  addStock,
  updateStock,
  deleteStock,
  getAllStocks,
  searchStock,
  getStockById,
  transferStockToWarehouse,
  transferStock,
  getLowStockItems,
  getStockByCategory,
  getStockSummary,
  updateStockQuantity,
  getStockAlerts
} from "../controller/stockController.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

// Stock CRUD operations
router.post("/add", protect, addStock);
router.get("/all", protect, getAllStocks);
router.get("/search", protect, searchStock);

// Stock analytics and reports (must be before /:id route)
router.get("/low-stock", protect, getLowStockItems);
router.get("/category/:category", protect, getStockByCategory);
router.get("/summary", protect, getStockSummary);
router.get("/alerts", protect, getStockAlerts);

// Stock management operations (Warehouse managers can update stock)
router.post("/transfer", protect, transferStockToWarehouse);
router.post("/transfer-between", protect, transferStock);
router.put("/quantity/:id", protect, updateStockQuantity);

// Individual stock operations (must be last)
router.get("/:id", protect, getStockById);
router.put("/:id", protect, updateStock);
router.delete("/:id", protect, deleteStock);

export default router;