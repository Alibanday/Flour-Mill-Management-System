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

// Apply authentication to all routes
// router.use(protect); // Temporarily disabled for testing

// Create new inventory item
router.post("/create", authorize("Admin", "Manager"), createInventory);

// Get all inventory items - Base route
router.get("/", getAllInventory);

// Get all inventory items - All route
router.get("/all", getAllInventory);

// Search inventory items
router.get("/search", searchInventory);

// Get inventory by category
router.get("/category/:category", getInventoryByCategory);

// Get all categories
router.get("/category/all", async (req, res) => {
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
router.get("/low-stock", getLowStockItems);

// Get out of stock items
router.get("/out-of-stock", getOutOfStockItems);

// Get inventory summary for dashboard
router.get("/summary", getInventorySummary);

// Get single inventory item by ID
router.get("/:id", getInventoryById);

// Update inventory item
router.put("/:id", authorize("Admin", "Manager"), updateInventory);

// Update stock levels
router.patch("/:id/stock", authorize("Admin", "Manager"), updateStockLevels);

// Update inventory status
router.patch("/:id/status", authorize("Admin", "Manager"), updateInventoryStatus);

// Delete inventory item
router.delete("/:id", authorize("Admin", "Manager"), deleteInventory);

export default router;
