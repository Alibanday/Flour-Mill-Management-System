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
  getTotalBagsStock
} from "../controller/stockController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/add", protect, addStock);
router.put("/:id", protect, updateStock);
router.delete("/:id", protect, deleteStock);
router.get("/", protect, getAllStocks);
router.get("/search", protect, searchStock);
router.get("/total-bags", protect, getTotalBagsStock);
router.get("/:id", protect, getStockById);
router.post("/transfer/:id", protect, transferStockToWarehouse);

export default router;