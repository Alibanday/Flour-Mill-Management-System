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
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/create", protect, addWarehouse); // admin only
router.put("/:id", protect, updateWarehouse);  // admin only
router.delete("/:id", protect, deleteWarehouse); // admin only

router.get("/all", protect, getAllWarehouses); // all users
router.get("/search", protect, searchWarehouses); // all users
router.get("/active", protect, getActiveWarehouses); // all users
router.get("/:id", protect, getWarehouseById); // all users

export default router;
