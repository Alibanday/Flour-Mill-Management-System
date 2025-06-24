import express from "express";
import {
  getAllInvoices,
  getInvoiceById,
  createInvoice,
  updateInvoice,
  updateInvoiceStatus,
  deleteInvoice,
  getInvoicesByAccount,
  getDashboardStats
} from "../controller/invoiceController.js";

import { authAdmin, authAdminOrSales } from "../middleware/adminMiddleware.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/account/:accountId", getInvoicesByAccount); // Get all invoices for a specific account
router.get("/dashboard/stats", getDashboardStats);
router.get("/", getAllInvoices); // View + Search for all
router.get("/:id", getInvoiceById); // View one

router.post("/",protect, authAdminOrSales, createInvoice); // Admin/Sales
router.put("/:id", protect, authAdminOrSales, updateInvoice);
router.patch("/:id/status", protect, authAdminOrSales, updateInvoiceStatus); // Update status specifically
router.delete("/:id", protect, authAdminOrSales, deleteInvoice);

export default router;
