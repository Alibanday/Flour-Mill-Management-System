import express from "express";
import { body, validationResult } from "express-validator";
import { protect, authorize } from "../middleware/auth.js";
import BagPurchase from "../model/BagPurchase.js";
import mongoose from "mongoose";

const router = express.Router();

// Apply authentication to all routes
router.use(protect);

// @route   GET /api/bag-purchases
// @desc    Get all bag purchases
// @access  Private (Manager, Admin, Employee)
router.get("/", [
  authorize("Manager", "Admin", "Employee")
], async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search,
      supplier,
      status,
      paymentStatus,
      startDate,
      endDate
    } = req.query;

    // Build filter object
    const filter = {};
    
    if (search) {
      filter.$or = [
        { purchaseNumber: { $regex: search, $options: 'i' } },
        { notes: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (supplier) filter.supplier = supplier;
    if (status) filter.status = status;
    if (paymentStatus) filter.paymentStatus = paymentStatus;
    
    if (startDate || endDate) {
      filter.purchaseDate = {};
      if (startDate) filter.purchaseDate.$gte = new Date(startDate);
      if (endDate) filter.purchaseDate.$lte = new Date(endDate);
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Get total count for pagination
    const total = await BagPurchase.countDocuments(filter);
    
    // Get bag purchases with pagination
    const bagPurchases = await BagPurchase.find(filter)
      .populate('supplier', 'name contactPerson email phone')
      .populate('warehouse', 'name location')
      .populate('createdBy', 'firstName lastName')
      .sort({ purchaseDate: -1, createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Calculate pagination info
    const totalPages = Math.ceil(total / parseInt(limit));
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    res.json({
      success: true,
      data: bagPurchases,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalRecords: total,
        hasNextPage,
        hasPrevPage,
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    console.error("Get bag purchases error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching bag purchases"
    });
  }
});

// @route   GET /api/bag-purchases/stats
// @desc    Get bag purchases statistics
// @access  Private (Manager, Admin, Employee)
router.get("/stats", [
  authorize("Manager", "Admin", "Employee")
], async (req, res) => {
  try {
    // Get real stats from database
    const total = await BagPurchase.countDocuments();
    const totalValue = await BagPurchase.aggregate([
      { $group: { _id: null, total: { $sum: "$totalAmount" } } }
    ]);
    const pendingPayments = await BagPurchase.aggregate([
      { $match: { paymentStatus: "Pending" } },
      { $group: { _id: null, total: { $sum: "$dueAmount" } } }
    ]);
    const completedPurchases = await BagPurchase.countDocuments({ status: "Completed" });
    
    const stats = {
      total: total || 0,
      totalValue: totalValue[0]?.total || 0,
      pendingPayments: pendingPayments[0]?.total || 0,
      completedPurchases: completedPurchases || 0,
      averageOrderValue: total > 0 ? (totalValue[0]?.total || 0) / total : 0
    };

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error("Get bag purchases stats error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching bag purchases stats"
    });
  }
});

// @route   POST /api/bag-purchases
// @desc    Create new bag purchase
// @access  Private (Manager, Admin)
router.post("/", [
  authorize("Manager", "Admin"),
  body("supplier").trim().notEmpty().withMessage("Supplier is required"),
  body("productType").trim().notEmpty().withMessage("Product type is required"),
  body("quantity").isNumeric().withMessage("Quantity must be a number"),
  body("unitPrice").isNumeric().withMessage("Unit price must be a number")
], async (req, res) => {
  try {
    // Debug: Log the incoming request data
    console.log('📥 Bag purchase request received:', {
      body: req.body,
      productType: req.body.productType,
      quantity: req.body.quantity,
      unit: req.body.unit,
      supplier: req.body.supplier
    });

    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('❌ Bag purchase validation errors:', errors.array());
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: errors.array()
      });
    }

    // Map flat structure to nested structure expected by model
    const { productType, quantity, unitPrice, totalPrice, supplier, purchaseDate, status, paymentStatus, notes, unit } = req.body;

    // Sanitize incoming status fields to match schema enums
    const allowedStatus = ["Pending", "Received", "Cancelled", "Completed"];
    const allowedPaymentStatus = ["Pending", "Partial", "Paid"];
    const safeStatus = allowedStatus.includes(status) ? status : "Pending";
    const safePaymentStatus = allowedPaymentStatus.includes(paymentStatus) ? paymentStatus : "Pending";
    
    // Create the bags object with the specific product type as Map
    const bags = new Map();
    
    // Normalize product type to uppercase (for compatibility)
    const normalizedProductType = productType.toUpperCase();
    
    // Set the values for the specific product type (use normalized type)
    bags.set(normalizedProductType, {
      quantity: parseFloat(quantity) || 0,
      unit: unit || "50kg bags", // Use provided unit or default
      unitPrice: parseFloat(unitPrice) || 0,
      totalPrice: parseFloat(totalPrice) || 0
    });

    // Generate purchase number manually if needed
    let purchaseNumber;
    try {
      const count = await BagPurchase.countDocuments();
      const year = new Date().getFullYear();
      const month = String(new Date().getMonth() + 1).padStart(2, '0');
      const day = String(new Date().getDate()).padStart(2, '0');
      purchaseNumber = `BP-${year}${month}${day}-${String(count + 1).padStart(4, '0')}`;
    } catch (error) {
      // Fallback to timestamp-based number if database query fails
      purchaseNumber = `BP-${Date.now()}`;
    }

    // Create bag purchase document
    const bagPurchaseData = {
      purchaseNumber: purchaseNumber, // Explicitly set purchase number
      supplier: mongoose.isValidObjectId(supplier) ? new mongoose.Types.ObjectId(supplier) : new mongoose.Types.ObjectId("507f1f77bcf86cd799439011"),
      bags,
      purchaseDate: purchaseDate ? new Date(purchaseDate) : new Date(),
      status: safeStatus,
      paymentStatus: safePaymentStatus,
      notes: notes || "",
      warehouse: new mongoose.Types.ObjectId("507f1f77bcf86cd799439011"),
      createdBy: new mongoose.Types.ObjectId(req.user._id || req.user.id || "507f1f77bcf86cd799439011")
    };

    const newPurchase = new BagPurchase(bagPurchaseData);
    await newPurchase.save();

    // Populate the response
    await newPurchase.populate('supplier', 'name contactPerson email phone');
    await newPurchase.populate('warehouse', 'name location');
    await newPurchase.populate('createdBy', 'firstName lastName');

    res.status(201).json({
      success: true,
      message: "Bag purchase created successfully",
      data: newPurchase
    });
  } catch (error) {
    console.error("Create bag purchase error:", error);
    console.error("Error details:", error.message);
    console.error("Error stack:", error.stack);
    res.status(500).json({
      success: false,
      message: "Server error while creating bag purchase",
      error: error.message
    });
  }
});

// @route   PUT /api/bag-purchases/:id
// @desc    Update bag purchase
// @access  Private (Manager, Admin)
router.put("/:id", [
  authorize("Manager", "Admin"),
  body("purchaseNumber").optional().trim().notEmpty().withMessage("Purchase number cannot be empty"),
  body("supplier").optional().trim().notEmpty().withMessage("Supplier cannot be empty"),
  body("productType").optional().isIn(["ATA", "MAIDA", "SUJI", "FINE"]).withMessage("Invalid product type"),
  body("quantity").optional().isNumeric().withMessage("Quantity must be a number"),
  body("unitPrice").optional().isNumeric().withMessage("Unit price must be a number")
], async (req, res) => {
  try {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: errors.array()
      });
    }

    // Mock update - replace with actual database update
    const updatedPurchase = {
      _id: req.params.id,
      ...req.body,
      totalPrice: req.body.quantity ? req.body.quantity * (req.body.unitPrice || 0) : 0,
      updatedAt: new Date()
    };

    res.json({
      success: true,
      message: "Bag purchase updated successfully",
      data: updatedPurchase
    });
  } catch (error) {
    console.error("Update bag purchase error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while updating bag purchase"
    });
  }
});

// @route   DELETE /api/bag-purchases/:id
// @desc    Delete bag purchase
// @access  Private (Admin only)
router.delete("/:id", [
  authorize("Admin")
], async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await BagPurchase.findByIdAndDelete(id);
    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: "Bag purchase not found"
      });
    }
    res.json({
      success: true,
      message: "Bag purchase deleted successfully",
      data: { _id: id }
    });
  } catch (error) {
    console.error("Delete bag purchase error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while deleting bag purchase"
    });
  }
});

export default router; 