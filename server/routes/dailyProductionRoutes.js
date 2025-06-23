import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import { createDailyProduction, getDailyProductions, getDailyProductionById } from "../controller/dailyProductionController.js";

const router = express.Router();

router.post("/", protect, createDailyProduction);
router.get("/", protect, getDailyProductions);
router.get("/:id", protect, getDailyProductionById);

export default router; 