import express from "express";
import { body, validationResult } from "express-validator";
import FoodPurchase from "../model/FoodPurchase.js";
import { protect, authorize } from "../middleware/auth.js";

const router = express.Router();

// Validation middleware
const validateFoodPurchase = [
  body("supplier").isMongoId().withMessage("Valid supplier ID is required"),
  body("foodItems").isArray({ min: 1 }).withMessage("At least one food item is required"),
  body("foodItems.*.name").trim().notEmpty().withMessage("Item name is required"),
  body("foodItems.*.quantity").isNumeric({ min: 0 }).withMessage("Quantity must be a positive number"),
  body("foodItems.*.unitPrice").isNumeric({ min: 0 }).withMessage("Unit price must be a positive number"),
];

// @desc    Create new food purchase
// @route   POST /api/food-purchases
// @access  Admin, Manager
router.post("/create", protect, authorize("Admin", "Manager"), validateFoodPurchase, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const purchaseData = {
      ...req.body,
      createdBy: req.user.id,
    };

    const foodPurchase = new FoodPurchase(purchaseData);
    await foodPurchase.save();

    res.status(201).json({
      success: true,
      data: foodPurchase,
      message: "Food purchase created successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
});

// @desc    Get all food purchases
// @route   GET /api/food-purchases
// @access  Admin, Manager, Employee
router.get("/all", protect, authorize("Admin", "Manager", "Employee"), async (req, res) => {
  try {
    const { page = 1, limit = 10, search, status, supplier, category, startDate, endDate } = req.query;
    
    const query = {};
    
    if (search) {
      query.$or = [
        { purchaseNumber: { $regex: search, $options: 'i' } },
        { 'foodItems.name': { $regex: search, $options: 'i' } }
      ];
    }
    
    if (status) query.status = status;
    if (supplier) query.supplier = supplier;
    if (category) query['foodItems.category'] = category;
    
    if (startDate || endDate) {
      query.purchaseDate = {};
      if (startDate) query.purchaseDate.$gte = new Date(startDate);
      if (endDate) query.purchaseDate.$lte = new Date(endDate);
    }

    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      populate: [
        { path: 'supplier', select: 'name contact address' },
        { path: 'createdBy', select: 'name email' },
        { path: 'approvedBy', select: 'name email' }
      ],
      sort: { createdAt: -1 }
    };

    const foodPurchases = await FoodPurchase.paginate(query, options);

    res.json({
      success: true,
      data: foodPurchases.docs,
      pagination: {
        page: foodPurchases.page,
        limit: foodPurchases.limit,
        totalDocs: foodPurchases.totalDocs,
        totalPages: foodPurchases.totalPages,
        hasNextPage: foodPurchases.hasNextPage,
        hasPrevPage: foodPurchases.hasPrevPage
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
});

// @desc    Get food purchase by ID
// @route   GET /api/food-purchases/:id
// @access  Admin, Manager, Employee
router.get("/:id", protect, authorize("Admin", "Manager", "Employee"), async (req, res) => {
  try {
    const foodPurchase = await FoodPurchase.findById(req.params.id)
      .populate('supplier', 'name contact address')
      .populate('createdBy', 'name email')
      .populate('approvedBy', 'name email');

    if (!foodPurchase) {
      return res.status(404).json({
        success: false,
        message: "Food purchase not found",
      });
    }

    res.json({
      success: true,
      data: foodPurchase,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
});

// @desc    Update food purchase
// @route   PUT /api/food-purchases/:id
// @access  Admin, Manager
router.put("/:id", protect, authorize("Admin", "Manager"), validateFoodPurchase, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const foodPurchase = await FoodPurchase.findByIdAndUpdate(
      req.params.id,
      { ...req.body, updatedAt: new Date() },
      { new: true, runValidators: true }
    ).populate('supplier', 'name contact address');

    if (!foodPurchase) {
      return res.status(404).json({
        success: false,
        message: "Food purchase not found",
      });
    }

    res.json({
      success: true,
      data: foodPurchase,
      message: "Food purchase updated successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
});

// @desc    Delete food purchase
// @route   DELETE /api/food-purchases/:id
// @access  Admin, Manager
router.delete("/:id", protect, authorize("Admin", "Manager"), async (req, res) => {
  try {
    const foodPurchase = await FoodPurchase.findByIdAndDelete(req.params.id);

    if (!foodPurchase) {
      return res.status(404).json({
        success: false,
        message: "Food purchase not found",
      });
    }

    res.json({
      success: true,
      message: "Food purchase deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
});

// @desc    Update food purchase status
// @route   PATCH /api/food-purchases/:id/status
// @access  Admin, Manager
router.patch("/:id/status", protect, authorize("Admin", "Manager"), async (req, res) => {
  try {
    const { status } = req.body;
    
    if (!['Draft', 'Pending', 'Approved', 'Completed', 'Cancelled'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status",
      });
    }

    const foodPurchase = await FoodPurchase.findByIdAndUpdate(
      req.params.id,
      { 
        status,
        approvedBy: status === 'Approved' ? req.user.id : undefined,
        updatedAt: new Date()
      },
      { new: true }
    ).populate('supplier', 'name contact address');

    if (!foodPurchase) {
      return res.status(404).json({
        success: false,
        message: "Food purchase not found",
      });
    }

    res.json({
      success: true,
      data: foodPurchase,
      message: "Food purchase status updated successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
});

// @desc    Update delivery status
// @route   PATCH /api/food-purchases/:id/delivery
// @access  Admin, Manager, Employee
router.patch("/:id/delivery", protect, authorize("Admin", "Manager", "Employee"), async (req, res) => {
  try {
    const { deliveryStatus, deliveryDate } = req.body;
    
    if (!['Pending', 'In Transit', 'Delivered'].includes(deliveryStatus)) {
      return res.status(400).json({
        success: false,
        message: "Invalid delivery status",
      });
    }

    const foodPurchase = await FoodPurchase.findByIdAndUpdate(
      req.params.id,
      { 
        deliveryStatus,
        deliveryDate: deliveryDate || new Date(),
        updatedAt: new Date()
      },
      { new: true }
    ).populate('supplier', 'name contact address');

    if (!foodPurchase) {
      return res.status(404).json({
        success: false,
        message: "Food purchase not found",
      });
    }

    res.json({
      success: true,
      data: foodPurchase,
      message: "Delivery status updated successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
});

// @desc    Update payment status
// @route   PATCH /api/food-purchases/:id/payment
// @access  Admin, Manager
router.patch("/:id/payment", protect, authorize("Admin", "Manager"), async (req, res) => {
  try {
    const { paymentStatus, paidAmount } = req.body;
    
    if (!['Pending', 'Partial', 'Completed'].includes(paymentStatus)) {
      return res.status(400).json({
        success: false,
        message: "Invalid payment status",
      });
    }

    const foodPurchase = await FoodPurchase.findByIdAndUpdate(
      req.params.id,
      { 
        paymentStatus,
        paidAmount: paidAmount || 0,
        updatedAt: new Date()
      },
      { new: true }
    ).populate('supplier', 'name contact address');

    if (!foodPurchase) {
      return res.status(404).json({
        success: false,
        message: "Food purchase not found",
      });
    }

    res.json({
      success: true,
      data: foodPurchase,
      message: "Payment status updated successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
});

// @desc    Get food purchase statistics
// @route   GET /api/food-purchases/stats
// @access  Admin, Manager
router.get("/stats", protect, authorize("Admin", "Manager"), async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    const query = {};
    if (startDate || endDate) {
      query.purchaseDate = {};
      if (startDate) query.purchaseDate.$gte = new Date(startDate);
      if (endDate) query.purchaseDate.$lte = new Date(endDate);
    }

    const [
      total,
      totalValue,
      pendingPayments,
      categoryStats,
      supplierStats
    ] = await Promise.all([
      FoodPurchase.countDocuments(query),
      FoodPurchase.aggregate([
        { $match: query },
        { $group: { _id: null, total: { $sum: "$totalAmount" } } }
      ]),
      FoodPurchase.aggregate([
        { $match: query },
        { $group: { _id: null, total: { $sum: "$dueAmount" } } }
      ]),
      FoodPurchase.aggregate([
        { $match: query },
        { $unwind: "$foodItems" },
        { $group: { _id: "$foodItems.category", total: { $sum: "$foodItems.totalPrice" } } }
      ]),
      FoodPurchase.aggregate([
        { $match: query },
        { $group: { _id: "$supplier", total: { $sum: "$totalAmount" } } }
      ])
    ]);

    res.json({
      success: true,
      data: {
        total: total || 0,
        totalValue: totalValue[0]?.total || 0,
        pendingPayments: pendingPayments[0]?.total || 0,
        categoryStats: categoryStats || [],
        supplierStats: supplierStats || []
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
});

export default router; 