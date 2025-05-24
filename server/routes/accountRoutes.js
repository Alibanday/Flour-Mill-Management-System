import express from "express";
import {
  createAccount,
  getAllAccounts,
  getAccountById,
  updateAccount,
  deleteAccount
} from "../controller/accountController.js";
import { checkRole } from "../middleware/roleMiddleware.js";
import { body, validationResult } from "express-validator";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// Validation rules for create/update
const accountValidationRules = [
  body("accountType")
    .isIn(["Payable", "Receivable", "Cash", "Bank", "Others"])
    .withMessage("Invalid account type"),
  body("accountName").notEmpty().withMessage("Account name is required"),
  body("phoneNumber")
    .optional()
    .matches(/^\d{10,15}$/)
    .withMessage("Invalid phone number"),
  body("whatsappNumber")
    .optional()
    .matches(/^\d{10,15}$/)
    .withMessage("Invalid WhatsApp number"),
  body("creditLimit")
    .optional()
    .isNumeric()
    .withMessage("Credit limit must be a number"),
  body("address").notEmpty().withMessage("Address is required"),
];

// Middleware to check validation result
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

// Routes:

// Get all accounts - accessible to all logged-in users
router.get("/",protect, getAllAccounts);

// Get single account by accountId - accessible to all logged-in users
router.get("/:id",protect, getAccountById);

// Create new account - only admin and sales_manager
router.post(
  "/",
  protect,
  checkRole("admin", "sales manager"),
  accountValidationRules,
  validate,
  createAccount
);

// Update account - only admin and sales_manager
router.put(
  "/:id",
  protect,
  checkRole("admin", "sales manager"),
  accountValidationRules,
  validate,
  updateAccount
);

// Delete account - only admin and sales_manager
router.delete("/:id",protect, checkRole("admin", "sales manager"), deleteAccount);

export default router;
