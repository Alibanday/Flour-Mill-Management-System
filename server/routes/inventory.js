import express from "express";
import {
  createInventory,
  getAllInventory,
  getInventoryById,
  updateInventory,
  deleteInventory,
  searchInventory,
  getInventoryByCategory,
  getLowStockItems,
  getOutOfStockItems,
  updateStockLevels,
  getInventorySummary,
  updateInventoryStatus
} from "../controller/inventoryController.js";
import { protect, authorize } from "../middleware/auth.js";

const router = express.Router();

// Create new inventory item
router.post("/create", protect, authorize(['Admin', 'Manager']), createInventory);

// Get all inventory items
router.get("/all", protect, getAllInventory);

// Search inventory items
router.get("/search", protect, searchInventory);

// Get inventory by category
router.get("/category/:category", protect, getInventoryByCategory);

// Get all categories
router.get("/category/all", protect, async (req, res) => {
  try {
    const Inventory = (await import("../model/inventory.js")).default;
    const categories = await Inventory.distinct("category");
    res.json({
      success: true,
      data: categories
    });
  } catch (error) {
    console.error("Get categories error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching categories"
    });
  }
});

// Get low stock items
router.get("/low-stock", protect, getLowStockItems);

// Get out of stock items
router.get("/out-of-stock", protect, getOutOfStockItems);

// Get inventory summary for dashboard
router.get("/summary", protect, getInventorySummary);

// Get single inventory item by ID
router.get("/:id", protect, getInventoryById);

// Update inventory item
router.put("/:id", protect, authorize(['Admin', 'Manager']), updateInventory);

// Update stock levels
router.patch("/:id/stock", protect, authorize(['Admin', 'Manager']), updateStockLevels);

// Update inventory status
router.patch("/:id/status", protect, authorize(['Admin', 'Manager']), updateInventoryStatus);

// Delete inventory item
router.delete("/:id", protect, authorize(['Admin', 'Manager']), deleteInventory);

export default router;
