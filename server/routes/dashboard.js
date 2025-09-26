import express from "express";
import { protect, authorize } from "../middleware/auth.js";
import { getRealTimeDashboard, getModuleData } from "../controller/dashboardController.js";

const router = express.Router();

// Apply authentication to all routes
router.use(protect);

// @route   GET /api/dashboard/real-time
// @desc    Get real-time dashboard data
// @access  Private (All authenticated users)
router.get("/real-time", getRealTimeDashboard);

// @route   GET /api/dashboard/module/:module
// @desc    Get module-specific real-time data
// @access  Private (All authenticated users)
router.get("/module/:module", getModuleData);

export default router;
