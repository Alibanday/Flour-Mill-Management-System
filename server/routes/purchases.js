import express from "express";
import { body, validationResult } from "express-validator";
import Purchase from "../model/Purchase.js";
import Warehouse from "../model/warehouse.js";
import { protect, authorize } from "../middleware/auth.js";

const router = express.Router();

// Apply authentication to all routes
router.use(protect);

// @route   POST /api/purchases
// @desc    Create new purchase record (FR 23-24)
// @access  Private (Manager, Admin)
router.post("/", [
  authorize("manager", "admin"),
  body("purchaseNumber").trim().notEmpty().withMessage("Purchase number is required"),
  body("purchaseType").isIn(["Bags", "Food", "Other"]).withMessage("Invalid purchase type"),
  body("supplier.name").trim().notEmpty().withMessage("Supplier name is required"),
  body("warehouse").isMongoId().withMessage("Valid warehouse ID is required"),
  body("paymentMethod").isIn(["Cash", "Bank Transfer", "Cheque", "Credit"]).withMessage("Invalid payment method")
], async (req, res) => {
  try {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    // Check if purchase number already exists
    const existingPurchase = await Purchase.findOne({ purchaseNumber: req.body.purchaseNumber });
    if (existingPurchase) {
      return res.status(400).json({
        success: false,
        message: "Purchase number already exists"
      });
    }

    // Verify warehouse exists
    const warehouse = await Warehouse.findById(req.body.warehouse);
    if (!warehouse) {
      return res.status(404).json({
        success: false,
        message: "Warehouse not found"
      });
    }

    // Process bags data if purchase type is Bags
    if (req.body.purchaseType === "Bags" || req.body.purchaseType === "Other") {
      if (req.body.bags) {
        // Calculate total prices for bags
        if (req.body.bags.ata && req.body.bags.ata.quantity > 0) {
          req.body.bags.ata.totalPrice = req.body.bags.ata.quantity * req.body.bags.ata.unitPrice;
        }
        if (req.body.bags.maida && req.body.bags.maida.quantity > 0) {
          req.body.bags.maida.totalPrice = req.body.bags.maida.quantity * req.body.bags.maida.unitPrice;
        }
        if (req.body.bags.suji && req.body.bags.suji.quantity > 0) {
          req.body.bags.suji.totalPrice = req.body.bags.suji.quantity * req.body.bags.suji.unitPrice;
        }
        if (req.body.bags.fine && req.body.bags.fine.quantity > 0) {
          req.body.bags.fine.totalPrice = req.body.bags.fine.quantity * req.body.bags.fine.unitPrice;
        }
      }
    }

    // Process food data if purchase type is Food
    if (req.body.purchaseType === "Food" || req.body.purchaseType === "Other") {
      if (req.body.food && req.body.food.wheat && req.body.food.wheat.quantity > 0) {
        req.body.food.wheat.totalPrice = req.body.food.wheat.quantity * req.body.food.wheat.unitPrice;
      }
    }

    // Create purchase data
    const purchaseData = {
      ...req.body,
      createdBy: req.user.id
    };

    const purchase = new Purchase(purchaseData);
    await purchase.save();

    res.status(201).json({
      success: true,
      message: "Purchase record created successfully",
      data: purchase
    });

  } catch (error) {
    console.error("Create purchase error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while creating purchase record"
    });
  }
});

// @route   GET /api/purchases
// @desc    Get all purchases with filtering and pagination
// @access  Private (Manager, Admin, Employee)
router.get("/", [
  authorize("manager", "admin", "employee")
], async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search,
      purchaseType,
      status,
      paymentStatus,
      warehouse,
      startDate,
      endDate
    } = req.query;

    // Build filter object
    const filter = {};

    if (search) {
      filter.$or = [
        { purchaseNumber: { $regex: search, $options: "i" } },
        { "supplier.name": { $regex: search, $options: "i" } },
        { notes: { $regex: search, $options: "i" } }
      ];
    }

    if (purchaseType && purchaseType !== "all") {
      filter.purchaseType = purchaseType;
    }

    if (status && status !== "all") {
      filter.status = status;
    }

    if (paymentStatus && paymentStatus !== "all") {
      filter.paymentStatus = paymentStatus;
    }

    if (warehouse && warehouse !== "all") {
      filter.warehouse = warehouse;
    }

    if (startDate && endDate) {
      filter.purchaseDate = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Get purchases with pagination
    const purchases = await Purchase.find(filter)
      .populate("warehouse", "name location")
      .populate("createdBy", "firstName lastName")
      .sort({ purchaseDate: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Get total count for pagination
    const total = await Purchase.countDocuments(filter);

    res.json({
      success: true,
      data: purchases,
      pagination: {
        current: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });

  } catch (error) {
    console.error("Get purchases error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching purchases"
    });
  }
});

// @route   GET /api/purchases/:id
// @desc    Get single purchase record
// @access  Private (Manager, Admin, Employee)
router.get("/:id", [
  authorize("manager", "admin", "employee")
], async (req, res) => {
  try {
    const purchase = await Purchase.findById(req.params.id)
      .populate("warehouse", "name location")
      .populate("createdBy", "firstName lastName");

    if (!purchase) {
      return res.status(404).json({
        success: false,
        message: "Purchase record not found"
      });
    }

    res.json({
      success: true,
      data: purchase
    });

  } catch (error) {
    console.error("Get purchase error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching purchase record"
    });
  }
});

// @route   PUT /api/purchases/:id
// @desc    Update purchase record
// @access  Private (Manager, Admin)
router.put("/:id", [
  authorize("manager", "admin"),
  body("purchaseNumber").optional().trim().notEmpty().withMessage("Purchase number cannot be empty"),
  body("supplier.name").optional().trim().notEmpty().withMessage("Supplier name cannot be empty")
], async (req, res) => {
  try {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    // Check if purchase exists
    const purchase = await Purchase.findById(req.params.id);
    if (!purchase) {
      return res.status(404).json({
        success: false,
        message: "Purchase record not found"
      });
    }

    // Check if purchase number is being changed and if it already exists
    if (req.body.purchaseNumber && req.body.purchaseNumber !== purchase.purchaseNumber) {
      const existingPurchase = await Purchase.findOne({
        purchaseNumber: req.body.purchaseNumber,
        _id: { $ne: req.params.id }
      });
      if (existingPurchase) {
        return res.status(400).json({
          success: false,
          message: "Purchase number already exists"
        });
      }
    }

    // Update purchase record
    const updatedPurchase = await Purchase.findByIdAndUpdate(
      req.params.id,
      { ...req.body, updatedAt: new Date() },
      { new: true, runValidators: true }
    ).populate("warehouse", "name location")
     .populate("createdBy", "firstName lastName");

    res.json({
      success: true,
      message: "Purchase record updated successfully",
      data: updatedPurchase
    });

  } catch (error) {
    console.error("Update purchase error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while updating purchase record"
    });
  }
});

// @route   PATCH /api/purchases/:id/receive
// @desc    Mark purchase as received
// @access  Private (Manager, Admin)
router.patch("/:id/receive", [
  authorize("manager", "admin")
], async (req, res) => {
  try {
    // Check if purchase exists
    const purchase = await Purchase.findById(req.params.id);
    if (!purchase) {
      return res.status(404).json({
        success: false,
        message: "Purchase record not found"
      });
    }

    // Mark as received
    await purchase.markAsReceived();

    res.json({
      success: true,
      message: "Purchase marked as received successfully",
      data: purchase
    });

  } catch (error) {
    console.error("Mark received error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while marking purchase as received"
    });
  }
});

// @route   PATCH /api/purchases/:id/payment
// @desc    Update payment information
// @access  Private (Manager, Admin)
router.patch("/:id/payment", [
  authorize("manager", "admin"),
  body("amount").isNumeric().withMessage("Payment amount must be a number"),
  body("paymentMethod").optional().isIn(["Cash", "Bank Transfer", "Cheque", "Credit"]).withMessage("Invalid payment method")
], async (req, res) => {
  try {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    // Check if purchase exists
    const purchase = await Purchase.findById(req.params.id);
    if (!purchase) {
      return res.status(404).json({
        success: false,
        message: "Purchase record not found"
      });
    }

    // Update payment
    if (req.body.paymentMethod) {
      purchase.paymentMethod = req.body.paymentMethod;
    }

    await purchase.updatePayment(req.body.amount);

    res.json({
      success: true,
      message: "Payment updated successfully",
      data: purchase
    });

  } catch (error) {
    console.error("Update payment error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while updating payment"
    });
  }
});

// @route   GET /api/purchases/daily/:date
// @desc    Get daily purchase summary
// @access  Private (Manager, Admin, Employee)
router.get("/daily/:date", [
  authorize("manager", "admin", "employee")
], async (req, res) => {
  try {
    const date = new Date(req.params.date);
    if (isNaN(date.getTime())) {
      return res.status(400).json({
        success: false,
        message: "Invalid date format"
      });
    }

    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const dailyPurchases = await Purchase.find({
      purchaseDate: {
        $gte: startOfDay,
        $lte: endOfDay
      }
    });

    // Calculate daily summary
    const dailySummary = {
      date: req.params.date,
      totalPurchases: dailyPurchases.length,
      totalAmount: dailyPurchases.reduce((sum, purchase) => sum + purchase.totalAmount, 0),
      purchaseTypes: dailyPurchases.reduce((acc, purchase) => {
        acc[purchase.purchaseType] = (acc[purchase.purchaseType] || 0) + 1;
        return acc;
      }, {}),
      purchases: dailyPurchases.map(purchase => ({
        purchaseNumber: purchase.purchaseNumber,
        purchaseType: purchase.purchaseType,
        supplierName: purchase.supplier.name,
        totalAmount: purchase.totalAmount,
        paymentStatus: purchase.paymentStatus,
        status: purchase.status
      }))
    };

    res.json({
      success: true,
      data: dailySummary
    });

  } catch (error) {
    console.error("Get daily purchases error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching daily purchase summary"
    });
  }
});

// @route   GET /api/purchases/bags/inventory
// @desc    Get bags inventory summary (FR 23)
// @access  Private (Manager, Admin, Employee)
router.get("/bags/inventory", [
  authorize("manager", "admin", "employee")
], async (req, res) => {
  try {
    const bagsInventory = await Purchase.getBagsInventory();

    res.json({
      success: true,
      data: bagsInventory[0] || {
        totalAta: 0,
        totalMaida: 0,
        totalSuji: 0,
        totalFine: 0
      }
    });

  } catch (error) {
    console.error("Get bags inventory error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching bags inventory"
    });
  }
});

// @route   GET /api/purchases/overdue
// @desc    Get overdue payments
// @access  Private (Manager, Admin)
router.get("/overdue", [
  authorize("manager", "admin")
], async (req, res) => {
  try {
    const overduePurchases = await Purchase.getOverduePayments();

    res.json({
      success: true,
      data: overduePurchases
    });

  } catch (error) {
    console.error("Get overdue purchases error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching overdue payments"
    });
  }
});

// @route   DELETE /api/purchases/:id
// @desc    Delete purchase record (Admin only)
// @access  Private (Admin only)
router.delete("/:id", [
  authorize("admin")
], async (req, res) => {
  try {
    const purchase = await Purchase.findById(req.params.id);
    if (!purchase) {
      return res.status(404).json({
        success: false,
        message: "Purchase record not found"
      });
    }

    await Purchase.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: "Purchase record deleted successfully"
    });

  } catch (error) {
    console.error("Delete purchase error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while deleting purchase record"
    });
  }
});

export default router;
