import express from "express";
import {
  addWarehouse,
  getAllWarehouses,
  getWarehouseById,
  updateWarehouse,
  deleteWarehouse,
  searchWarehouses,
  getActiveWarehouses,
  updateWarehouseStatus
} from "../controller/warehouseController.js";
import { protect, authorize } from "../middleware/auth.js";

const router = express.Router();

// All routes require authentication
// router.use(protect); // Temporarily disabled for testing

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

export default router;
