import express from "express";
const router = express.Router();
import { login } from "../controller/authController.js";

router.post("/login", login);

export default router;