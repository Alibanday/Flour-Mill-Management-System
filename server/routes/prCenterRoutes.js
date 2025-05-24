import express from "express";
import {
  createPrCenter,
  getAllPrCenters,
  getPrCenterById,
  updatePrCenter,
  deletePrCenter
} from "../controller/prCenterController.js";
import { authAdmin } from "../middleware/adminMiddleware.js";

const router = express.Router();

// Public Routes
router.get("/", getAllPrCenters);           // GET all
router.get("/:id", getPrCenterById);        // GET single by ID

// Admin Routes
router.post("/create", authAdmin, createPrCenter);     // CREATE
router.put("/:id", authAdmin, updatePrCenter);         // UPDATE
router.delete("/:id", authAdmin, deletePrCenter);      // DELETE

export default router;

