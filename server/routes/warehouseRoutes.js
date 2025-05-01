import express from "express";
import {
  addWarehouse,
  getAllWarehouses,
  getWarehouseById,
  updateWarehouse,
  deleteWarehouse,
  searchWarehouses,
  getActiveWarehouses
} from "../controller/warehouseController.js";

const router = express.Router();

// Route to add a new warehouse
router.post("/create", addWarehouse);

// Route to get all warehouses
router.get("/all", getAllWarehouses);

// Route to search warehouses
router.get("/search", searchWarehouses);

// Route to get a single warehouse by ID
router.get("/:id", getWarehouseById);

// Route to update a warehouse by ID
router.put("/:id", updateWarehouse);

// Route to delete a warehouse by ID
router.delete("/:id", deleteWarehouse);

router.get("/active", getActiveWarehouses);

export default router;
