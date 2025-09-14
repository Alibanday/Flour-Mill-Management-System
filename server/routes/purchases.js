import express from "express";
import { body, validationResult } from "express-validator";
import mongoose from "mongoose";
import Purchase from "../model/Purchase.js";
import Warehouse from "../model/warehouse.js";
import { protect, authorize } from "../middleware/auth.js";

const router = express.Router();

// Apply authentication to all routes
// router.use(protect); // Temporarily disabled for testing

// @route   POST /api/purchases/create
// @desc    Create new purchase record (FR 23-24)
// @access  Private (Manager, Admin)
router.post("/create", [
  authorize("Manager", "Admin"),
  body("purchaseNumber").trim().notEmpty().withMessage("Purchase number is required"),
  body("purchaseType").isIn(["Bags", "Food", "Other"]).withMessage("Invalid purchase type"),
  body("supplier.name").trim().notEmpty().withMessage("Supplier name is required"),
  body("warehouse").isMongoId().withMessage("Valid warehouse ID is required"),
  body("paymentMethod").isIn(["Cash", "Bank Transfer", "Cheque", "Credit"]).withMessage("Invalid payment method")
], async (req, res) => {
  try {
    // Debug: Log the incoming request data
    console.log('📥 Purchase request received (create):', {
      body: req.body,
      warehouse: req.body.warehouse,
      supplier: req.body.supplier,
      purchaseType: req.body.purchaseType
    });

    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('❌ Validation errors (create):', errors.array());
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

    // Validate warehouse ID format first
    if (!req.body.warehouse || !mongoose.Types.ObjectId.isValid(req.body.warehouse)) {
      // Try to get the first available warehouse as fallback
      const firstWarehouse = await Warehouse.findOne({ status: 'Active' });
      if (firstWarehouse) {
        console.log('⚠️ No valid warehouse provided (create), using fallback:', firstWarehouse._id);
        req.body.warehouse = firstWarehouse._id.toString();
      } else {
        return res.status(400).json({ 
          success: false, 
          message: "Valid warehouse ID is required and no warehouses available" 
        });
      }
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

    // Normalize nested structures to satisfy schema and pre-save
    const safeBags = {
      ata: { quantity: 0, unit: 'pcs', unitPrice: 0, totalPrice: 0 },
      maida: { quantity: 0, unit: 'pcs', unitPrice: 0, totalPrice: 0 },
      suji: { quantity: 0, unit: 'pcs', unitPrice: 0, totalPrice: 0 },
      fine: { quantity: 0, unit: 'pcs', unitPrice: 0, totalPrice: 0 }
    };
    if (req.body.bags) {
      safeBags.ata = { ...safeBags.ata, ...(req.body.bags.ata || {}) };
      safeBags.maida = { ...safeBags.maida, ...(req.body.bags.maida || {}) };
      safeBags.suji = { ...safeBags.suji, ...(req.body.bags.suji || {}) };
      safeBags.fine = { ...safeBags.fine, ...(req.body.bags.fine || {}) };
    }

    const safeFood = {
      wheat: { quantity: 0, unit: 'kg', unitPrice: 0, totalPrice: 0, source: 'Government', quality: 'Standard' }
    };
    if (req.body.food) {
      safeFood.wheat = { ...safeFood.wheat, ...(req.body.food.wheat || {}) };
    }

    // Calculate subtotal before creating purchase
    let calculatedSubtotal = 0;
    Object.values(safeBags).forEach(bag => {
      calculatedSubtotal += bag.totalPrice || 0;
    });
    if (safeFood.wheat) {
      calculatedSubtotal += safeFood.wheat.totalPrice || 0;
    }

    // Ensure supplier type is valid
    const validSupplierTypes = ['Government', 'Private', 'Wholesaler', 'Manufacturer'];
    const supplierType = validSupplierTypes.includes(req.body.supplier?.type) 
      ? req.body.supplier.type 
      : 'Private';

    const purchaseData = {
      ...req.body,
      supplier: {
        ...req.body.supplier,
        type: supplierType
      },
      tax: typeof req.body.tax === 'number' ? req.body.tax : parseFloat(req.body.tax) || 0,
      shippingCost: typeof req.body.shippingCost === 'number' ? req.body.shippingCost : parseFloat(req.body.shippingCost) || 0,
      bags: safeBags,
      food: safeFood,
      subtotal: calculatedSubtotal,
      totalAmount: calculatedSubtotal + (typeof req.body.tax === 'number' ? req.body.tax : parseFloat(req.body.tax) || 0) + (typeof req.body.shippingCost === 'number' ? req.body.shippingCost : parseFloat(req.body.shippingCost) || 0),
      createdBy: (req.user && (req.user._id || req.user.id)) || '507f1f77bcf86cd799439011'
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
    console.error("Error details:", {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    res.status(500).json({
        success: false,
        message: "Server error",
        error: error.message,
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
  }
});

// @route   POST /api/purchases
// @desc    Create new purchase record (alias to /create for frontend compatibility)
// @access  Private (Manager, Admin)
router.post("/", [
  authorize("Manager", "Admin"),
  body("purchaseNumber").trim().notEmpty().withMessage("Purchase number is required"),
  body("purchaseType").isIn(["Bags", "Food", "Other"]).withMessage("Invalid purchase type"),
  body("supplier.name").trim().notEmpty().withMessage("Supplier name is required"),
  body("warehouse").isMongoId().withMessage("Valid warehouse ID is required"),
  body("paymentMethod").isIn(["Cash", "Bank Transfer", "Cheque", "Credit"]).withMessage("Invalid payment method")
], async (req, res) => {
  try {
    // Debug: Log the incoming request data
    console.log('📥 Purchase request received:', {
      body: req.body,
      warehouse: req.body.warehouse,
      supplier: req.body.supplier,
      purchaseType: req.body.purchaseType
    });

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('❌ Validation errors:', errors.array());
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const existingPurchase = await Purchase.findOne({ purchaseNumber: req.body.purchaseNumber });
    if (existingPurchase) {
      return res.status(400).json({ success: false, message: "Purchase number already exists" });
    }

    // Validate warehouse ID format first
    if (!req.body.warehouse || !mongoose.Types.ObjectId.isValid(req.body.warehouse)) {
      // Try to get the first available warehouse as fallback
      const firstWarehouse = await Warehouse.findOne({ status: 'Active' });
      if (firstWarehouse) {
        console.log('⚠️ No valid warehouse provided, using fallback:', firstWarehouse._id);
        req.body.warehouse = firstWarehouse._id.toString();
      } else {
        return res.status(400).json({ 
          success: false, 
          message: "Valid warehouse ID is required and no warehouses available" 
        });
      }
    }

    const warehouse = await Warehouse.findById(req.body.warehouse);
    if (!warehouse) {
      return res.status(404).json({ success: false, message: "Warehouse not found" });
    }

    // Normalize nested structures
    const aliasSafeBags = {
      ata: { quantity: 0, unit: 'pcs', unitPrice: 0, totalPrice: 0 },
      maida: { quantity: 0, unit: 'pcs', unitPrice: 0, totalPrice: 0 },
      suji: { quantity: 0, unit: 'pcs', unitPrice: 0, totalPrice: 0 },
      fine: { quantity: 0, unit: 'pcs', unitPrice: 0, totalPrice: 0 }
    };
    if (req.body.bags) {
      aliasSafeBags.ata = { ...aliasSafeBags.ata, ...(req.body.bags.ata || {}) };
      aliasSafeBags.maida = { ...aliasSafeBags.maida, ...(req.body.bags.maida || {}) };
      aliasSafeBags.suji = { ...aliasSafeBags.suji, ...(req.body.bags.suji || {}) };
      aliasSafeBags.fine = { ...aliasSafeBags.fine, ...(req.body.bags.fine || {}) };
      // Calculate totals if quantities provided
      Object.keys(aliasSafeBags).forEach(k => {
        const b = aliasSafeBags[k];
        b.totalPrice = (parseFloat(b.quantity) || 0) * (parseFloat(b.unitPrice) || 0);
      });
    }

    const aliasSafeFood = {
      wheat: { quantity: 0, unit: 'kg', unitPrice: 0, totalPrice: 0, source: 'Government', quality: 'Standard' }
    };
    if (req.body.food && req.body.food.wheat) {
      const w = { ...aliasSafeFood.wheat, ...req.body.food.wheat };
      w.totalPrice = (parseFloat(w.quantity) || 0) * (parseFloat(w.unitPrice) || 0);
      aliasSafeFood.wheat = w;
    }

    // Calculate subtotal before creating purchase
    let calculatedSubtotal = 0;
    Object.values(aliasSafeBags).forEach(bag => {
      calculatedSubtotal += bag.totalPrice || 0;
    });
    if (aliasSafeFood.wheat) {
      calculatedSubtotal += aliasSafeFood.wheat.totalPrice || 0;
    }

    // Ensure supplier type is valid
    const validSupplierTypes = ['Government', 'Private', 'Wholesaler', 'Manufacturer'];
    const supplierType = validSupplierTypes.includes(req.body.supplier?.type) 
      ? req.body.supplier.type 
      : 'Private';

    const aliasPurchaseData = {
      ...req.body,
      supplier: {
        ...req.body.supplier,
        type: supplierType
      },
      tax: typeof req.body.tax === 'number' ? req.body.tax : parseFloat(req.body.tax) || 0,
      shippingCost: typeof req.body.shippingCost === 'number' ? req.body.shippingCost : parseFloat(req.body.shippingCost) || 0,
      bags: aliasSafeBags,
      food: aliasSafeFood,
      subtotal: calculatedSubtotal,
      totalAmount: calculatedSubtotal + (typeof req.body.tax === 'number' ? req.body.tax : parseFloat(req.body.tax) || 0) + (typeof req.body.shippingCost === 'number' ? req.body.shippingCost : parseFloat(req.body.shippingCost) || 0),
      createdBy: (req.user && (req.user._id || req.user.id)) || '507f1f77bcf86cd799439011'
    };
    const purchase = new Purchase(aliasPurchaseData);
    await purchase.save();

    res.status(201).json({ success: true, message: "Purchase record created successfully", data: purchase });
  } catch (error) {
    console.error("Create purchase (alias) error:", error);
    console.error("Error details:", {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    res.status(500).json({ 
      success: false, 
      message: "Server error", 
      error: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// @route   GET /api/purchases
// @desc    Get all purchases with filtering and pagination - Base route
// @access  Private (Manager, Admin, Employee)
router.get("/", [
  authorize("Manager", "Admin", "Employee")
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
        message: "Server error",
        error: error.message
      });
  }
});

// @route   GET /api/purchases/all
// @desc    Get all purchases with filtering and pagination - All route
// @access  Private (Manager, Admin, Employee)
router.get("/all", [
  authorize("Manager", "Admin", "Employee")
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
        message: "Server error",
        error: error.message
      });
  }
});

// @route   GET /api/purchases/:id
// @desc    Get single purchase record
// @access  Private (Manager, Admin, Employee)
router.get("/:id", [
  authorize("Manager", "Admin", "Employee")
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
        message: "Server error",
        error: error.message
      });
  }
});

// @route   PUT /api/purchases/:id
// @desc    Update purchase record
// @access  Private (Manager, Admin)
router.put("/:id", [
  authorize("Manager", "Admin"),
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
        message: "Server error",
        error: error.message
      });
  }
});

// @route   PATCH /api/purchases/:id/receive
// @desc    Mark purchase as received
// @access  Private (Manager, Admin)
router.patch("/:id/receive", [
  authorize("Manager", "Admin")
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
        message: "Server error",
        error: error.message
      });
  }
});

// @route   PATCH /api/purchases/:id/payment
// @desc    Update payment information
// @access  Private (Manager, Admin)
router.patch("/:id/payment", [
  authorize("Manager", "Admin"),
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
        message: "Server error",
        error: error.message
      });
  }
});

// @route   GET /api/purchases/daily/:date
// @desc    Get daily purchase summary
// @access  Private (Manager, Admin, Employee)
router.get("/daily/:date", [
  authorize("Manager", "Admin", "Employee")
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
        message: "Server error",
        error: error.message
      });
  }
});

// @route   GET /api/purchases/bags/inventory
// @desc    Get bags inventory summary (FR 23)
// @access  Private (Manager, Admin, Employee)
router.get("/bags/inventory", [
  authorize("Manager", "Admin", "Employee")
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
        message: "Server error",
        error: error.message
      });
  }
});

// @route   GET /api/purchases/overdue
// @desc    Get overdue payments
// @access  Private (Manager, Admin)
router.get("/overdue", [
  authorize("Manager", "Admin")
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
        message: "Server error",
        error: error.message
      });
  }
});

// @route   DELETE /api/purchases/:id
// @desc    Delete purchase record (Admin only)
// @access  Private (Admin only)
router.delete("/:id", [
  authorize("Admin")
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
        message: "Server error",
        error: error.message
      });
  }
});

export default router;
