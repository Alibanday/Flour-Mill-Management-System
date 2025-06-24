import express from "express";
import {
  markAttendance,
  updateAttendance,
  getAllAttendance,
  getAttendanceById,
  deleteAttendance,
  getAttendanceSummary,
  getEmployeeAttendanceSummary,
  bulkMarkAttendance
} from "../../controller/attendancesystem/attendanceController.js";
import { protect } from "../../middleware/authMiddleware.js";
import { checkRole } from "../../middleware/roleMiddleware.js";

const router = express.Router();

// Apply authentication middleware to all routes
router.use(protect);

// Apply role-based authorization for admin and manager routes
const adminOrManager = checkRole("admin", "manager");

// Mark attendance for an employee
router.post("/mark", adminOrManager, markAttendance);

// Bulk mark attendance for multiple employees
router.post("/bulk-mark", adminOrManager, bulkMarkAttendance);

// Update attendance record
router.put("/:id", adminOrManager, updateAttendance);

// Get all attendance records with pagination and filters
router.get("/", getAllAttendance);

// Get attendance summary for dashboard
router.get("/summary", getAttendanceSummary);

// Get employee attendance summary
router.get("/employee/:employeeId/summary", getEmployeeAttendanceSummary);

// Get attendance by ID
router.get("/:id", getAttendanceById);

// Delete attendance record (soft delete)
router.delete("/:id", adminOrManager, deleteAttendance);

export default router; 