import express from "express";
import { createUser, getAllUsers, deleteUser, updateUser, getUser } from "../controller/userController.js";
import { protect } from "../middleware/authMiddleware.js"

const router = express.Router();

router.post("/create",protect, createUser);
router.get("/all",protect, getAllUsers);
router.get("/:id",protect, getUser);
router.delete("/:id",protect, deleteUser);
router.put("/:id",protect, updateUser);

export default router;

