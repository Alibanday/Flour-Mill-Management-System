import express from "express";
import { body, validationResult } from "express-validator";
import BagPurchase from "../model/BagPurchase.js";
import { protect, authorize } from "../middleware/auth.js";

const router = express.Router();

// Validation middleware
const validateBagPurchase = [
  body("purchaseNumber").trim().notEmpty().withMessage("Purchase number is required"),
  body("supplier").isMongoId().withMessage("Valid supplier ID is required"),
  body("warehouse").isMongoId().withMessage("Valid warehouse ID is required"),
  body("bags.ATA.quantity").isNumeric().withMessage("ATA quantity must be a number"),
  body("bags.MAIDA.quantity").isNumeric().withMessage("MAIDA quantity must be a number"),
  body("bags.SUJI.quantity").isNumeric().withMessage("SUJI quantity must be a number"),
  body("bags.FINE.quantity").isNumeric().withMessage("FINE quantity must be a number"),
];

// @desc    Create new bag purchase
// @route   POST /api/bag-purchases/create
// @access  Admin, Manager
router.post("/create", protect, authorize("Admin", "Manager"), validateBagPurchase, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const bagPurchase = new BagPurchase({
      ...req.body,
      createdBy: req.user.id,
    });

    await bagPurchase.save();
    await bagPurchase.populate("supplier", "name contactPerson");
    await bagPurchase.populate("warehouse", "name location");

    res.status(201).json({
      success: true,
      data: bagPurchase,
      message: "Bag purchase created successfully",
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "Purchase number already exists",
      });
    }
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
});

// @desc    Get all bag purchases
// @route   GET /api/bag-purchases/all
// @access  Admin, Manager, Employee
router.get("/all", protect, authorize("Admin", "Manager", "Employee"), async (req, res) => {
  try {
    const { page = 1, limit = 10, search, status, warehouse, supplier } = req.query;
    
    const query = {};
    
    // Search filter
    if (search) {
      query.$or = [
        { purchaseNumber: { $regex: search, $options: "i" } },
        { "supplier.name": { $regex: search, $options: "i" } },
      ];
    }
    
    // Status filter
    if (status) {
      query.status = status;
    }
    
    // Warehouse filter
    if (warehouse) {
      query.warehouse = warehouse;
    }

    // Supplier filter
    if (supplier) {
      query.supplier = supplier;
    }

    const bagPurchases = await BagPurchase.find(query)
      .populate("supplier", "name contactPerson email phone")
      .populate("warehouse", "name location")
      .populate("createdBy", "name email")
      .populate("updatedBy", "name email")
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await BagPurchase.countDocuments(query);

    res.json({
      success: true,
      data: bagPurchases,
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

// @desc    Get bag purchase by ID
// @route   GET /api/bag-purchases/:id
// @access  Admin, Manager, Employee
router.get("/:id", protect, authorize("Admin", "Manager", "Employee"), async (req, res) => {
  try {
    const bagPurchase = await BagPurchase.findById(req.params.id)
      .populate("supplier", "name contactPerson email phone")
      .populate("warehouse", "name location")
      .populate("createdBy", "name email")
      .populate("updatedBy", "name email");

    if (!bagPurchase) {
      return res.status(404).json({
        success: false,
        message: "Bag purchase not found",
      });
    }

    res.json({
      success: true,
      data: bagPurchase,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
});

// @desc    Update bag purchase
// @route   PUT /api/bag-purchases/:id
// @access  Admin, Manager
router.put("/:id", protect, authorize("Admin", "Manager"), validateBagPurchase, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const bagPurchase = await BagPurchase.findById(req.params.id);
    if (!bagPurchase) {
      return res.status(404).json({
        success: false,
        message: "Bag purchase not found",
      });
    }

    // Check if purchase number is being changed and if it already exists
    if (req.body.purchaseNumber && req.body.purchaseNumber !== bagPurchase.purchaseNumber) {
      const existingPurchase = await BagPurchase.findOne({ 
        purchaseNumber: req.body.purchaseNumber, 
        _id: { $ne: req.params.id } 
      });
      if (existingPurchase) {
        return res.status(400).json({
          success: false,
          message: "Purchase number already exists",
        });
      }
    }

    const updatedBagPurchase = await BagPurchase.findByIdAndUpdate(
      req.params.id,
      {
        ...req.body,
        updatedBy: req.user.id,
      },
      { new: true, runValidators: true }
    ).populate("supplier", "name contactPerson")
     .populate("warehouse", "name location");

    res.json({
      success: true,
      data: updatedBagPurchase,
      message: "Bag purchase updated successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
});

// @desc    Delete bag purchase
// @route   DELETE /api/bag-purchases/:id
// @access  Admin only
router.delete("/:id", protect, authorize("Admin"), async (req, res) => {
  try {
    const bagPurchase = await BagPurchase.findById(req.params.id);
    if (!bagPurchase) {
      return res.status(404).json({
        success: false,
        message: "Bag purchase not found",
      });
    }

    // Check if purchase can be deleted
    if (bagPurchase.status === "Received") {
      return res.status(400).json({
        success: false,
        message: "Cannot delete received purchase",
      });
    }

    await BagPurchase.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: "Bag purchase deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
});

// @desc    Mark bag purchase as received
// @route   PATCH /api/bag-purchases/:id/receive
// @access  Admin, Manager
router.patch("/:id/receive", protect, authorize("Admin", "Manager"), async (req, res) => {
  try {
    const bagPurchase = await BagPurchase.findById(req.params.id);
    if (!bagPurchase) {
      return res.status(404).json({
        success: false,
        message: "Bag purchase not found",
      });
    }

    if (bagPurchase.status === "Received") {
      return res.status(400).json({
        success: false,
        message: "Purchase is already marked as received",
      });
    }

    bagPurchase.status = "Received";
    bagPurchase.receivedDate = new Date();
    bagPurchase.updatedBy = req.user.id;

    await bagPurchase.save();
    await bagPurchase.populate("supplier", "name contactPerson");
    await bagPurchase.populate("warehouse", "name location");

    res.json({
      success: true,
      data: bagPurchase,
      message: "Bag purchase marked as received successfully",
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
// @route   PATCH /api/bag-purchases/:id/payment
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

    const bagPurchase = await BagPurchase.findById(req.params.id);
    if (!bagPurchase) {
      return res.status(404).json({
        success: false,
        message: "Bag purchase not found",
      });
    }

    bagPurchase.paidAmount = paidAmount;
    bagPurchase.dueAmount = Math.max(0, bagPurchase.totalAmount - paidAmount);
    
    if (bagPurchase.dueAmount === 0) {
      bagPurchase.paymentStatus = "Paid";
    } else if (bagPurchase.paidAmount > 0) {
      bagPurchase.paymentStatus = "Partial";
    }
    
    bagPurchase.updatedBy = req.user.id;

    await bagPurchase.save();
    await bagPurchase.populate("supplier", "name contactPerson");
    await bagPurchase.populate("warehouse", "name location");

    res.json({
      success: true,
      data: bagPurchase,
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

// @desc    Get bag purchases summary
// @route   GET /api/bag-purchases/summary
// @access  Admin, Manager
router.get("/summary", protect, authorize("Admin", "Manager"), async (req, res) => {
  try {
    const totalPurchases = await BagPurchase.countDocuments();
    const pendingPurchases = await BagPurchase.countDocuments({ status: "Pending" });
    const receivedPurchases = await BagPurchase.countDocuments({ status: "Received" });
    const totalAmount = await BagPurchase.aggregate([
      { $group: { _id: null, total: { $sum: "$totalAmount" } } }
    ]);
    const totalPaid = await BagPurchase.aggregate([
      { $group: { _id: null, total: { $sum: "$paidAmount" } } }
    ]);

    const bagTypeSummary = await BagPurchase.aggregate([
      { $unwind: "$bags" },
      { $group: { 
        _id: "$bags.type", 
        totalQuantity: { $sum: "$bags.quantity" },
        totalValue: { $sum: "$bags.totalPrice" }
      }},
      { $sort: { totalQuantity: -1 } }
    ]);

    res.json({
      success: true,
      data: {
        totalPurchases,
        pendingPurchases,
        receivedPurchases,
        totalAmount: totalAmount[0]?.total || 0,
        totalPaid: totalPaid[0]?.total || 0,
        bagTypeSummary
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

export default router; 