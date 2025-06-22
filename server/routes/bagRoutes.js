import express from "express";
import { getAllBags, createBag, updateBag, deleteBag } from "../controller/bagController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/", protect, getAllBags);
router.post("/", protect, createBag);
router.put("/:id", protect, updateBag);
router.delete("/:id", protect, deleteBag);

export default router; 