import express from "express";
import { createUser, getAllUsers, deleteUser, updateUser, getUser } from "../controller/userController.js";
import { protect, authorize } from "../middleware/auth.js";

const router = express.Router();

// All routes require authentication
router.use(protect);

router.post("/create", authorize('Admin', 'Manager'), createUser);
router.get("/all", getAllUsers);
router.get("/:id", getUser);
router.delete("/:id", authorize('Admin'), deleteUser);
router.put("/:id", authorize('Admin', 'Manager'), updateUser);

export default router;

