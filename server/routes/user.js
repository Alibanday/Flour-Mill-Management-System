import express from "express";
import { createUser, getAllUsers, deleteUser, updateUser, getUser } from "../controller/userController.js";

const router = express.Router();

router.post("/create", createUser);
router.get("/all", getAllUsers);
router.get("/:id", getUser);
router.delete("/:id", deleteUser);
router.put("/:id", updateUser);

export default router;

