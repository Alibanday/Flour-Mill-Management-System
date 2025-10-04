import express from "express";
import {
  addWarehouse,
  getAllWarehouses,
  getWarehouseById,
  updateWarehouse,
  deleteWarehouse,
  searchWarehouses,
  getActiveWarehouses,
  updateWarehouseStatus,
  assignWarehouseManager,
  getWarehouseInventorySummary,
  getWarehouseCapacityStatus
} from "../controller/warehouseController.js";
import { protect, authorize } from "../middleware/auth.js";

const router = express.Router();

// All routes require authentication
router.use(protect);

// Test endpoint
router.get("/test", (req, res) => {
  res.json({ message: "Warehouse routes working!", timestamp: new Date() });
});

// Route to add a new warehouse
router.post("/create", authorize('Admin', 'Manager'), addWarehouse);

// Route to get all warehouses - Base route
router.get("/", getAllWarehouses);

// Route to get all warehouses - All route
router.get("/all", getAllWarehouses);

// Route to search warehouses
router.get("/search", searchWarehouses);

// Route to get active warehouses
router.get("/active", getActiveWarehouses);

// Route to get a single warehouse by ID
router.get("/:id", getWarehouseById);

// Route to update a warehouse by ID
router.put("/:id", authorize('Admin', 'Manager'), updateWarehouse);

// Route to delete a warehouse by ID
router.delete("/:id", authorize('Admin'), deleteWarehouse);

// Route to update warehouse status
router.patch("/:id/status", authorize('Admin', 'Manager'), updateWarehouseStatus);

// Route to assign warehouse manager (Admin only)
router.patch("/:id/assign-manager", authorize('Admin'), assignWarehouseManager);

// Route to get warehouse inventory summary
router.get("/:id/inventory-summary", getWarehouseInventorySummary);

// Route to get warehouse capacity status
router.get("/capacity/status", getWarehouseCapacityStatus);

// Route to get warehouse statistics
router.get("/stats", async (req, res) => {
  try {
    const Warehouse = (await import("../model/warehouse.js")).default;
    
    // Get total warehouses
    const totalWarehouses = await Warehouse.countDocuments();
    
    // Get active warehouses
    const activeWarehouses = await Warehouse.countDocuments({ status: 'Active' });
    
    // Get warehouses in maintenance
    const inMaintenance = await Warehouse.countDocuments({ status: 'Maintenance' });
    
    // Calculate total capacity
    const capacityStats = await Warehouse.aggregate([
      {
        $group: {
          _id: null,
          totalCapacity: { $sum: "$capacity.totalCapacity" },
          totalCurrentUsage: { $sum: "$capacity.currentUsage" }
        }
      }
    ]);
    
    const totalCapacity = capacityStats.length > 0 ? capacityStats[0].totalCapacity : 0;
    const totalCurrentUsage = capacityStats.length > 0 ? capacityStats[0].totalCurrentUsage : 0;
    
    res.json({
      success: true,
      data: {
        totalWarehouses,
        activeWarehouses,
        inMaintenance,
        totalCapacity,
        totalCurrentUsage,
        availableCapacity: totalCapacity - totalCurrentUsage
      }
    });
  } catch (error) {
    console.error("Get warehouse stats error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching warehouse statistics",
      error: error.message
    });
  }
});

export default router;
