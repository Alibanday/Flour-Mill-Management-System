import express from "express";
import { body, validationResult } from "express-validator";
import { protect, authorize } from "../middleware/auth.js";
import FoodPurchase from "../model/FoodPurchase.js";
import mongoose from "mongoose";

const router = express.Router();

// Apply authentication to all routes
router.use(protect);

// @route   GET /api/food-purchases
// @desc    Get all food purchases
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
    const total = await FoodPurchase.countDocuments(filter);
    
    // Get food purchases with pagination
    const foodPurchases = await FoodPurchase.find(filter)
      .populate('supplier', 'name contactPerson email phone')
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
      data: foodPurchases,
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
    console.error("Get food purchases error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching food purchases"
    });
  }
});

// @route   GET /api/food-purchases/stats
// @desc    Get food purchases statistics
// @access  Private (Manager, Admin, Employee)
router.get("/stats", [
  authorize("Manager", "Admin", "Employee")
], async (req, res) => {
  try {
    // Get real stats from database
    const total = await FoodPurchase.countDocuments();
    const totalValue = await FoodPurchase.aggregate([
      { $group: { _id: null, total: { $sum: "$totalAmount" } } }
    ]);
    const pendingPayments = await FoodPurchase.aggregate([
      { $match: { paymentStatus: "Pending" } },
      { $group: { _id: null, total: { $sum: "$dueAmount" } } }
    ]);
    const completedPurchases = await FoodPurchase.countDocuments({ status: "Completed" });
    
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
    console.error("Get food purchases stats error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching food purchases stats"
    });
  }
});

// @route   POST /api/food-purchases
// @desc    Create new food purchase
// @access  Private (Manager, Admin)
router.post("/", [
  authorize("Manager", "Admin"),
  body("supplier").trim().notEmpty().withMessage("Supplier is required"),
  body("productType").isIn(["Wheat Grain", "Corn", "Rice", "Barley", "Oats", "Rye", "Millet", "Other"]).withMessage("Invalid product type"),
  body("quantity").isNumeric().withMessage("Quantity must be a number"),
  body("unitPrice").isNumeric().withMessage("Unit price must be a number")
], async (req, res) => {
  try {
    // Debug: Log the incoming request data
    console.log('📥 Food purchase request received:', {
      body: req.body,
      productType: req.body.productType,
      quantity: req.body.quantity,
      unit: req.body.unit,
      supplier: req.body.supplier
    });

    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('❌ Food purchase validation errors:', errors.array());
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: errors.array()
      });
    }

    // Map flat structure to nested structure expected by model
    const { productType, quantity, unitPrice, totalPrice, supplier, purchaseDate, status, paymentStatus, notes, unit } = req.body;
    
    // Create the foodItems array with the single item
    const foodItems = [{
      name: productType,
      category: productType === "Wheat Grain" ? "Wheat Grain" : "Raw Materials", // Map category correctly
      quantity: parseFloat(quantity) || 0,
      unit: unit || "tons", // Use system standard unit
      unitPrice: parseFloat(unitPrice) || 0,
      totalPrice: parseFloat(totalPrice) || 0,
      quality: "Standard" // Add required quality field
    }];

    // Create food purchase document
    const foodPurchaseData = {
      // purchaseNumber will be auto-generated by the model
      supplier: mongoose.isValidObjectId(supplier) ? new mongoose.Types.ObjectId(supplier) : new mongoose.Types.ObjectId("507f1f77bcf86cd799439011"),
      foodItems,
      totalQuantity: parseFloat(quantity) || 0,
      subtotal: parseFloat(totalPrice) || 0,
      tax: 0,
      discount: 0,
      totalAmount: parseFloat(totalPrice) || 0,
      paymentMethod: "Cash",
      paymentStatus: paymentStatus || "Pending",
      paidAmount: 0,
      dueAmount: parseFloat(totalPrice) || 0,
      purchaseDate: purchaseDate ? new Date(purchaseDate) : new Date(),
      status: status || "Completed",
      notes: notes || "",
      createdBy: new mongoose.Types.ObjectId(req.user._id || req.user.id || "507f1f77bcf86cd799439011")
    };

    const newPurchase = new FoodPurchase(foodPurchaseData);
    await newPurchase.save();

    // Populate the response
    await newPurchase.populate('supplier', 'name contactPerson email phone');
    await newPurchase.populate('createdBy', 'firstName lastName');

    res.status(201).json({
      success: true,
      message: "Food purchase created successfully",
      data: newPurchase
    });
  } catch (error) {
    console.error("Create food purchase error:", error);
    console.error("Error details:", error.message);
    console.error("Error stack:", error.stack);
    res.status(500).json({
      success: false,
      message: "Server error while creating food purchase",
      error: error.message
    });
  }
});

// @route   PUT /api/food-purchases/:id
// @desc    Update food purchase
// @access  Private (Manager, Admin)
router.put("/:id", [
  authorize("Manager", "Admin"),
  body("purchaseNumber").optional().trim().notEmpty().withMessage("Purchase number cannot be empty"),
  body("supplier").optional().trim().notEmpty().withMessage("Supplier cannot be empty"),
  body("productType").optional().isIn(["Wheat Grain", "Corn", "Rice", "Barley", "Oats", "Rye", "Millet", "Other"]).withMessage("Invalid product type"),
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
      message: "Food purchase updated successfully",
      data: updatedPurchase
    });
  } catch (error) {
    console.error("Update food purchase error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while updating food purchase"
    });
  }
});

// @route   DELETE /api/food-purchases/:id
// @desc    Delete food purchase
// @access  Private (Admin only)
router.delete("/:id", [
  authorize("Admin")
], async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await FoodPurchase.findByIdAndDelete(id);
    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: "Food purchase not found"
      });
    }
    res.json({
      success: true,
      message: "Food purchase deleted successfully",
      data: { _id: id }
    });
  } catch (error) {
    console.error("Delete food purchase error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while deleting food purchase"
    });
  }
});

export default router; 