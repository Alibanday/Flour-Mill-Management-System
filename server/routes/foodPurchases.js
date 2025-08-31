import express from "express";
import { body, validationResult } from "express-validator";
import { protect, authorize } from "../middleware/auth.js";

const router = express.Router();

// Validation middleware
const validateFoodPurchase = [
  body("purchaseNumber").trim().notEmpty().withMessage("Purchase number is required"),
  body("supplier").isMongoId().withMessage("Valid supplier ID is required"),
  body("warehouse").isMongoId().withMessage("Valid warehouse ID is required"),
  body("item").trim().notEmpty().withMessage("Item name is required"),
  body("quantity").isNumeric().withMessage("Quantity must be a number"),
  body("unit").trim().notEmpty().withMessage("Unit is required"),
  body("unitPrice").isNumeric().withMessage("Unit price must be a number"),
];

// @desc    Create new food purchase
// @route   POST /api/food-purchases
// @access  Admin, Manager
router.post("/", protect, authorize("Admin", "Manager"), validateFoodPurchase, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    // Calculate total amount
    const totalAmount = req.body.quantity * req.body.unitPrice;

    const foodPurchase = {
      ...req.body,
      totalAmount,
      createdBy: req.user.id,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // For now, we'll use a simple in-memory storage
    // In production, this should use a proper database model
    const purchaseId = Date.now().toString();
    foodPurchase._id = purchaseId;

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
router.get("/", protect, authorize("Admin", "Manager", "Employee"), async (req, res) => {
  try {
    const { page = 1, limit = 10, search, status, warehouse, supplier } = req.query;
    
    // Mock data for demonstration
    const mockFoodPurchases = [
      {
        _id: "1",
        purchaseNumber: "FP-001",
        supplier: { _id: "1", name: "Wheat Suppliers Ltd" },
        purchaseDate: "2024-01-12",
        item: "Wheat",
        quantity: 5000,
        unit: "kg",
        unitPrice: 45,
        totalAmount: 225000,
        status: "Received",
        warehouse: { _id: "1", name: "Main Warehouse" },
        paymentStatus: "Partial",
        createdBy: { _id: "1", name: "Admin User" },
        createdAt: "2024-01-12T00:00:00.000Z"
      },
      {
        _id: "2",
        purchaseNumber: "FP-002",
        supplier: { _id: "2", name: "Grain Traders" },
        purchaseDate: "2024-01-08",
        item: "Wheat",
        quantity: 3000,
        unit: "kg",
        unitPrice: 44,
        totalAmount: 132000,
        status: "Received",
        warehouse: { _id: "2", name: "Secondary Warehouse" },
        paymentStatus: "Paid",
        createdBy: { _id: "1", name: "Admin User" },
        createdAt: "2024-01-08T00:00:00.000Z"
      }
    ];

    let filteredPurchases = mockFoodPurchases;
    
    // Search filter
    if (search) {
      filteredPurchases = filteredPurchases.filter(purchase => 
        purchase.purchaseNumber.toLowerCase().includes(search.toLowerCase()) ||
        purchase.supplier.name.toLowerCase().includes(search.toLowerCase()) ||
        purchase.item.toLowerCase().includes(search.toLowerCase())
      );
    }
    
    // Status filter
    if (status && status !== "all") {
      filteredPurchases = filteredPurchases.filter(purchase => purchase.status === status);
    }
    
    // Warehouse filter
    if (warehouse && warehouse !== "all") {
      filteredPurchases = filteredPurchases.filter(purchase => purchase.warehouse._id === warehouse);
    }

    // Supplier filter
    if (supplier && supplier !== "all") {
      filteredPurchases = filteredPurchases.filter(purchase => purchase.supplier._id === supplier);
    }

    // Pagination
    const total = filteredPurchases.length;
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedPurchases = filteredPurchases.slice(startIndex, endIndex);

    res.json({
      success: true,
      data: paginatedPurchases,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: parseInt(limit),
      },
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
    // Mock data for demonstration
    const mockFoodPurchase = {
      _id: req.params.id,
      purchaseNumber: "FP-001",
      supplier: { _id: "1", name: "Wheat Suppliers Ltd" },
      purchaseDate: "2024-01-12",
      item: "Wheat",
      quantity: 5000,
      unit: "kg",
      unitPrice: 45,
      totalAmount: 225000,
      status: "Received",
      warehouse: { _id: "1", name: "Main Warehouse" },
      paymentStatus: "Partial",
      createdBy: { _id: "1", name: "Admin User" },
      createdAt: "2024-01-12T00:00:00.000Z"
    };

    if (!mockFoodPurchase) {
      return res.status(404).json({
        success: false,
        message: "Food purchase not found",
      });
    }

    res.json({
      success: true,
      data: mockFoodPurchase,
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

    // Calculate total amount
    const totalAmount = req.body.quantity * req.body.unitPrice;

    const updatedFoodPurchase = {
      ...req.body,
      totalAmount,
      updatedBy: req.user.id,
      updatedAt: new Date()
    };

    res.json({
      success: true,
      data: updatedFoodPurchase,
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
// @access  Admin only
router.delete("/:id", protect, authorize("Admin"), async (req, res) => {
  try {
    // Check if purchase can be deleted
    const mockFoodPurchase = {
      _id: req.params.id,
      status: "Pending"
    };

    if (mockFoodPurchase.status === "Received") {
      return res.status(400).json({
        success: false,
        message: "Cannot delete received purchase",
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

// @desc    Mark food purchase as received
// @route   PATCH /api/food-purchases/:id/receive
// @access  Admin, Manager
router.patch("/:id/receive", protect, authorize("Admin", "Manager"), async (req, res) => {
  try {
    const mockFoodPurchase = {
      _id: req.params.id,
      status: "Pending"
    };

    if (!mockFoodPurchase) {
      return res.status(404).json({
        success: false,
        message: "Food purchase not found",
      });
    }

    if (mockFoodPurchase.status === "Received") {
      return res.status(400).json({
        success: false,
        message: "Purchase is already marked as received",
      });
    }

    mockFoodPurchase.status = "Received";
    mockFoodPurchase.receivedDate = new Date();
    mockFoodPurchase.updatedBy = req.user.id;

    res.json({
      success: true,
      data: mockFoodPurchase,
      message: "Food purchase marked as received successfully",
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
    const { paidAmount } = req.body;
    
    if (!paidAmount || paidAmount < 0) {
      return res.status(400).json({
        success: false,
        message: "Valid paid amount is required",
      });
    }

    const mockFoodPurchase = {
      _id: req.params.id,
      totalAmount: 225000,
      paidAmount: 0
    };

    if (!mockFoodPurchase) {
      return res.status(404).json({
        success: false,
        message: "Food purchase not found",
      });
    }

    mockFoodPurchase.paidAmount = paidAmount;
    mockFoodPurchase.dueAmount = Math.max(0, mockFoodPurchase.totalAmount - paidAmount);
    
    if (mockFoodPurchase.dueAmount === 0) {
      mockFoodPurchase.paymentStatus = "Paid";
    } else if (mockFoodPurchase.paidAmount > 0) {
      mockFoodPurchase.paymentStatus = "Partial";
    }
    
    mockFoodPurchase.updatedBy = req.user.id;

    res.json({
      success: true,
      data: mockFoodPurchase,
      message: "Payment updated successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
});

// @desc    Get food purchases summary
// @route   GET /api/food-purchases/summary
// @access  Admin, Manager
router.get("/summary", protect, authorize("Admin", "Manager"), async (req, res) => {
  try {
    // Mock summary data
    const summary = {
      totalPurchases: 2,
      pendingPurchases: 0,
      receivedPurchases: 2,
      totalAmount: 357000,
      totalPaid: 132000,
      itemSummary: [
        {
          item: "Wheat",
          totalQuantity: 8000,
          totalValue: 357000,
          unit: "kg"
        }
      ]
    };

    res.json({
      success: true,
      data: summary,
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