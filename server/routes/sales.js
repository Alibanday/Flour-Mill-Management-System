import express from "express";
import { body, validationResult } from "express-validator";
import Sale from "../model/Sale.js";
import Inventory from "../model/inventory.js";
import Warehouse from "../model/warehouse.js";
import CustomerNew from "../model/CustomerNew.js";
import { protect, authorize } from "../middleware/auth.js";
import { 
  createSale, 
  getAllSales, 
  getSaleById, 
  updateSale, 
  deleteSale, 
  processReturn 
} from "../controller/salesController.js";

const router = express.Router();

// Apply authentication to all routes
router.use(protect);

// @route   GET /api/sales/customers/search
// @desc    Search customers for sales form
// @access  Private (Manager, Admin, Cashier)
router.get("/customers/search", [
  authorize("Manager", "Admin", "Cashier")
], async (req, res) => {
  try {
    const { q, limit = 10 } = req.query;
    
    if (!q || q.trim().length < 2) {
      return res.json({
        success: true,
        data: []
      });
    }
    
    const customers = await CustomerNew.find({
      $or: [
        { firstName: { $regex: q, $options: 'i' } },
        { lastName: { $regex: q, $options: 'i' } },
        { email: { $regex: q, $options: 'i' } },
        { phone: { $regex: q, $options: 'i' } },
        { businessName: { $regex: q, $options: 'i' } }
      ]
    })
    .select('firstName lastName email phone businessName businessType customerType creditLimit creditUsed status')
    .limit(parseInt(limit))
    .lean();
    
    res.json({
      success: true,
      data: customers
    });
  } catch (error) {
    console.error("Search customers error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message
    });
  }
});

// @route   POST /api/sales
// @desc    Create new sale invoice (FR 19) - Base route
// @access  Private (Manager, Admin, Cashier)
router.post("/", [
  authorize("Manager", "Admin", "Cashier"),
  body("customer.name").trim().notEmpty().withMessage("Customer name is required"),
  body("items").isArray({ min: 1 }).withMessage("At least one item is required"),
  body("items.*.product").isMongoId().withMessage("Valid product ID is required"),
  body("items.*.quantity").isNumeric().withMessage("Quantity must be a number"),
  body("items.*.unitPrice").isNumeric().withMessage("Unit price must be a number"),
  body("warehouse").isMongoId().withMessage("Valid warehouse ID is required"),
  body("paymentMethod").isIn(["Cash", "Bank Transfer", "Cheque", "Credit"]).withMessage("Invalid payment method")
], createSale);

// @route   POST /api/sales/create
// @desc    Create new sale invoice (FR 19) - Create route
// @access  Private (Manager, Admin, Cashier)
router.post("/create", [
  authorize("Manager", "Admin", "Cashier"),
  body("customer.name").trim().notEmpty().withMessage("Customer name is required"),
  body("items").isArray({ min: 1 }).withMessage("At least one item is required"),
  body("items.*.product").isMongoId().withMessage("Valid product ID is required"),
  body("items.*.quantity").isNumeric().withMessage("Quantity must be a number"),
  body("items.*.unitPrice").isNumeric().withMessage("Unit price must be a number"),
  body("warehouse").isMongoId().withMessage("Valid warehouse ID is required"),
  body("paymentMethod").isIn(["Cash", "Bank Transfer", "Cheque", "Credit"]).withMessage("Invalid payment method")
], createSale);

// @route   GET /api/sales
// @desc    Get all sales with filtering and pagination - Base route
// @access  Private (Manager, Admin, Cashier, Employee)
router.get("/", [
  authorize("Manager", "Admin", "Cashier", "Employee")
], async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search,
      customerName,
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
        { invoiceNumber: { $regex: search, $options: "i" } },
        { "customer.name": { $regex: search, $options: "i" } },
        { notes: { $regex: search, $options: "i" } }
      ];
    }

    if (customerName && customerName !== "all") {
      filter["customer.name"] = { $regex: customerName, $options: "i" };
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
      filter.saleDate = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Get sales with pagination
    const sales = await Sale.find(filter)
      .populate("warehouse", "name location")
      .populate("createdBy", "firstName lastName")
      .sort({ saleDate: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Get total count for pagination
    const total = await Sale.countDocuments(filter);

    res.json({
      success: true,
      data: sales,
      pagination: {
        current: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });

  } catch (error) {
    console.error("Get sales error:", error);
    res.status(500).json({
        success: false,
        message: "Server error",
        error: error.message
      });
  }
});

// @route   GET /api/sales/all
// @desc    Get all sales with filtering and pagination - All route
// @access  Private (Manager, Admin, Cashier, Employee)
router.get("/all", [
  authorize("Manager", "Admin", "Cashier", "Employee")
], async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search,
      customerName,
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
        { invoiceNumber: { $regex: search, $options: "i" } },
        { "customer.name": { $regex: search, $options: "i" } },
        { notes: { $regex: search, $options: "i" } }
      ];
    }

    if (customerName && customerName !== "all") {
      filter["customer.name"] = { $regex: customerName, $options: "i" };
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
      filter.saleDate = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Get sales with pagination
    const sales = await Sale.find(filter)
      .populate("warehouse", "name location")
      .populate("createdBy", "firstName lastName")
      .sort({ saleDate: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Get total count for pagination
    const total = await Sale.countDocuments(filter);

    res.json({
      success: true,
      data: sales,
      pagination: {
        current: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });

  } catch (error) {
    console.error("Get sales error:", error);
    res.status(500).json({
        success: false,
        message: "Server error",
        error: error.message
      });
  }
});

// @route   GET /api/sales/:id
// @desc    Get single sale record
// @access  Private (Manager, Admin, Cashier, Employee)
router.get("/:id", [
  authorize("Manager", "Admin", "Cashier", "Employee")
], async (req, res) => {
  try {
    const sale = await Sale.findById(req.params.id)
      .populate("warehouse", "name location")
      .populate("createdBy", "firstName lastName");

    if (!sale) {
      return res.status(404).json({
        success: false,
        message: "Sale record not found"
      });
    }

    res.json({
      success: true,
      data: sale
    });

  } catch (error) {
    console.error("Get sale error:", error);
    res.status(500).json({
        success: false,
        message: "Server error",
        error: error.message
      });
  }
});

// @route   PUT /api/sales/:id
// @desc    Update sale record
// @access  Private (Manager, Admin)
router.put("/:id", [
  authorize("Manager", "Admin"),
  body("invoiceNumber").optional().trim().notEmpty().withMessage("Invoice number cannot be empty"),
  body("customer.name").optional().trim().notEmpty().withMessage("Customer name cannot be empty")
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

    // Check if sale exists
    const sale = await Sale.findById(req.params.id);
    if (!sale) {
      return res.status(404).json({
        success: false,
        message: "Sale record not found"
      });
    }

    // Check if invoice number is being changed and if it already exists
    if (req.body.invoiceNumber && req.body.invoiceNumber !== sale.invoiceNumber) {
      const existingInvoice = await Sale.findOne({
        invoiceNumber: req.body.invoiceNumber,
        _id: { $ne: req.params.id }
      });
      if (existingInvoice) {
        return res.status(400).json({
          success: false,
          message: "Invoice number already exists"
        });
      }
    }

    // Update sale record
    const updatedSale = await Sale.findByIdAndUpdate(
      req.params.id,
      { ...req.body, updatedAt: new Date() },
      { new: true, runValidators: true }
    ).populate("warehouse", "name location")
     .populate("createdBy", "firstName lastName");

    res.json({
      success: true,
      message: "Sale record updated successfully",
      data: updatedSale
    });

  } catch (error) {
    console.error("Update sale error:", error);
    res.status(500).json({
        success: false,
        message: "Server error",
        error: error.message
      });
  }
});

// @route   PATCH /api/sales/:id/return
// @desc    Handle product return (FR 20)
// @access  Private (Manager, Admin, Cashier)
router.patch("/:id/return", [
  authorize("Manager", "Admin", "Cashier"),
  body("itemId").isMongoId().withMessage("Valid item ID is required"),
  body("quantity").isNumeric().withMessage("Return quantity must be a number"),
  body("returnReason").isIn(["Quality Issue", "Wrong Product", "Customer Request", "Damaged", "Other"]).withMessage("Invalid return reason")
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

    // Check if sale exists
    const sale = await Sale.findById(req.params.id);
    if (!sale) {
      return res.status(404).json({
        success: false,
        message: "Sale record not found"
      });
    }

    // Find the item to return
    const item = sale.items.id(req.body.itemId);
    if (!item) {
      return res.status(404).json({
        success: false,
        message: "Item not found in sale"
      });
    }

    // Check if return quantity is valid
    if (req.body.quantity > item.quantity) {
      return res.status(400).json({
        success: false,
        message: "Return quantity cannot exceed sold quantity"
      });
    }

    // Calculate refund amount
    const refundAmount = (req.body.quantity / item.quantity) * item.totalPrice;

    // Add return record
    const returnData = {
      itemId: req.body.itemId,
      productName: item.productName,
      quantity: req.body.quantity,
      unit: item.unit,
      returnReason: req.body.returnReason,
      refundAmount: refundAmount
    };

    await sale.addReturn(returnData);

    res.json({
      success: true,
      message: "Product return processed successfully",
      data: sale
    });

  } catch (error) {
    console.error("Process return error:", error);
    res.status(500).json({
        success: false,
        message: "Server error",
        error: error.message
      });
  }
});

// @route   PATCH /api/sales/:id/payment
// @desc    Update payment information
// @access  Private (Manager, Admin, Cashier)
router.patch("/:id/payment", [
  authorize("Manager", "Admin", "Cashier"),
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

    // Check if sale exists
    const sale = await Sale.findById(req.params.id);
    if (!sale) {
      return res.status(404).json({
        success: false,
        message: "Sale record not found"
      });
    }

    // Update payment
    if (req.body.paymentMethod) {
      sale.paymentMethod = req.body.paymentMethod;
    }

    await sale.updatePayment(req.body.amount);

    res.json({
      success: true,
      message: "Payment updated successfully",
      data: sale
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

// @route   GET /api/sales/daily/:date
// @desc    Get daily sales summary
// @access  Private (Manager, Admin, Cashier, Employee)
router.get("/daily/:date", [
  authorize("Manager", "Admin", "Cashier", "Employee")
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

    const dailySales = await Sale.find({
      saleDate: {
        $gte: startOfDay,
        $lte: endOfDay
      }
    });

    // Calculate daily summary
    const dailySummary = {
      date: req.params.date,
      totalInvoices: dailySales.length,
      totalAmount: dailySales.reduce((sum, sale) => sum + sale.totalAmount, 0),
      totalItems: dailySales.reduce((sum, sale) => sum + sale.totalItems, 0),
      paymentMethods: dailySales.reduce((acc, sale) => {
        acc[sale.paymentMethod] = (acc[sale.paymentMethod] || 0) + 1;
        return acc;
      }, {}),
      sales: dailySales.map(sale => ({
        invoiceNumber: sale.invoiceNumber,
        customerName: sale.customer.name,
        totalAmount: sale.totalAmount,
        paymentStatus: sale.paymentStatus,
        status: sale.status
      }))
    };

    res.json({
      success: true,
      data: dailySummary
    });

  } catch (error) {
    console.error("Get daily sales error:", error);
    res.status(500).json({
        success: false,
        message: "Server error",
        error: error.message
      });
  }
});

// @route   GET /api/sales/overdue
// @desc    Get overdue payments
// @access  Private (Manager, Admin)
router.get("/overdue", [
  authorize("Manager", "Admin")
], async (req, res) => {
  try {
    const overdueSales = await Sale.getOverduePayments();

    res.json({
      success: true,
      data: overdueSales
    });

  } catch (error) {
    console.error("Get overdue sales error:", error);
    res.status(500).json({
        success: false,
        message: "Server error",
        error: error.message
      });
  }
});

// @route   PATCH /api/sales/:id/customer-credit
// @desc    Update customer credit limit and outstanding balance (FR 22)
// @access  Private (Manager, Admin)
router.patch("/:id/customer-credit", [
  authorize("Manager", "Admin"),
  body("creditLimit").optional().isNumeric().withMessage("Credit limit must be a number"),
  body("outstandingBalance").optional().isNumeric().withMessage("Outstanding balance must be a number")
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

    // Check if sale exists
    const sale = await Sale.findById(req.params.id);
    if (!sale) {
      return res.status(404).json({
        success: false,
        message: "Sale record not found"
      });
    }

    // Update customer credit information
    if (req.body.creditLimit !== undefined) {
      sale.customer.creditLimit = req.body.creditLimit;
    }
    if (req.body.outstandingBalance !== undefined) {
      sale.customer.outstandingBalance = req.body.outstandingBalance;
    }

    await sale.save();

    res.json({
      success: true,
      message: "Customer credit information updated successfully",
      data: sale
    });

  } catch (error) {
    console.error("Update customer credit error:", error);
    res.status(500).json({
        success: false,
        message: "Server error",
        error: error.message
      });
  }
});

// @route   DELETE /api/sales/:id
// @desc    Delete sale record (Admin only)
// @access  Private (Admin only)
router.delete("/:id", [
  authorize("Admin")
], async (req, res) => {
  try {
    const sale = await Sale.findById(req.params.id);
    if (!sale) {
      return res.status(404).json({
        success: false,
        message: "Sale record not found"
      });
    }

    await Sale.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: "Sale record deleted successfully"
    });

  } catch (error) {
    console.error("Delete sale error:", error);
    res.status(500).json({
        success: false,
        message: "Server error",
        error: error.message
      });
  }
});

export default router;
