import express from "express";
import { body, validationResult } from "express-validator";
import Supplier from "../model/Supplier.js";
import Purchase from "../model/Purchase.js";
import BagPurchase from "../model/BagPurchase.js";
import FoodPurchase from "../model/FoodPurchase.js";
import { protect, authorize, isAdmin, isManagerOrAdmin } from "../middleware/auth.js";

const router = express.Router();


// Apply authentication to all routes
router.use(protect);
// Validation middleware
const validateSupplier = [
  body("supplierCode").trim().notEmpty().withMessage("Supplier code is required"),
  body("name").trim().notEmpty().withMessage("Supplier name is required"),
  body("contactPerson").trim().notEmpty().withMessage("Contact person is required"),
  body("email").optional({ checkFalsy: true, values: 'falsy' }).isEmail().withMessage("Valid email is required if provided"),
  body("phone").trim().notEmpty().withMessage("Phone number is required"),
  body("address.street").trim().notEmpty().withMessage("Street address is required"),
  body("address.city").trim().notEmpty().withMessage("City is required"),
  body("address.state").trim().notEmpty().withMessage("State is required"),
  body("address.postalCode").trim().notEmpty().withMessage("Postal code is required"),
  body("warehouse").isMongoId().withMessage("Valid warehouse ID is required"),
];

// @desc    Get all suppliers (base route)
// @route   GET /api/suppliers
// @access  Admin, Manager, Employee
router.get("/", async (req, res) => {
  try {
    const { page = 1, limit = 10, search, status, warehouse, supplierType } = req.query;
    
    let query = {};
    
    if (search) {
      query.$or = [
        { supplierCode: { $regex: search, $options: 'i' } },
        { name: { $regex: search, $options: 'i' } },
        { contactPerson: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (status && status !== 'all') {
      query.status = status;
    }
    
    if (warehouse) {
      query.warehouse = warehouse;
    }
    
    if (supplierType && supplierType !== 'all') {
      query.supplierType = supplierType;
    }
    
    const suppliers = await Supplier.find(query)
      .populate('warehouse', 'name location')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);
    
    const total = await Supplier.countDocuments(query);
    
    res.json({
      success: true,
      data: suppliers,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (error) {
    console.error("Get suppliers error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message
    });
  }
});

// @desc    Create new supplier (base route)
// @route   POST /api/suppliers
// @access  Admin, Manager
router.post("/", authorize("Admin", "Manager"), async (req, res) => {
  try {
    // Check if email already exists
    if (req.body.email) {
      const existingSupplier = await Supplier.findOne({ email: req.body.email.toLowerCase().trim() });
      if (existingSupplier) {
        return res.status(400).json({
          success: false,
          message: `A supplier with email "${req.body.email}" already exists`,
          field: 'email'
        });
      }
    }

    // Generate supplier code automatically
    const supplierType = req.body.supplierType || 'Private';
    const prefix = supplierType === 'Government' ? 'GOV' : 'PRV';
    
    // Find the last supplier of this type to get the next number
    const lastSupplier = await Supplier.findOne({ 
      supplierCode: { $regex: `^${prefix}` } 
    }).sort({ supplierCode: -1 });
    
    let nextNumber = 1;
    if (lastSupplier) {
      const lastNumber = parseInt(lastSupplier.supplierCode.replace(prefix, ''));
      nextNumber = lastNumber + 1;
    }
    
    const supplierCode = `${prefix}${nextNumber.toString().padStart(3, '0')}`;

    // Check if supplier code already exists (shouldn't happen, but just in case)
    const existingCode = await Supplier.findOne({ supplierCode });
    if (existingCode) {
      // Try next number
      nextNumber += 1;
      const newSupplierCode = `${prefix}${nextNumber.toString().padStart(3, '0')}`;
      const existingCode2 = await Supplier.findOne({ supplierCode: newSupplierCode });
      if (existingCode2) {
        // Find the highest number
        const highestSupplier = await Supplier.findOne({ 
          supplierCode: { $regex: `^${prefix}` } 
        }).sort({ supplierCode: -1 });
        if (highestSupplier) {
          const highestNumber = parseInt(highestSupplier.supplierCode.replace(prefix, ''));
          nextNumber = highestNumber + 1;
        }
      }
    }

    const finalSupplierCode = `${prefix}${nextNumber.toString().padStart(3, '0')}`;

    const supplierData = {
      ...req.body,
      email: req.body.email && req.body.email.trim() ? req.body.email.toLowerCase().trim() : undefined,
      supplierCode: finalSupplierCode,
      createdBy: req.user._id,
    };

    const supplier = new Supplier(supplierData);
    await supplier.save();

    await supplier.populate('createdBy', 'firstName lastName');

    res.status(201).json({
      success: true,
      message: 'Supplier created successfully',
      data: supplier
    });
  } catch (error) {
    console.error("Create supplier error:", error);
    
    // Handle MongoDB duplicate key error
    if (error.code === 11000) {
      const field = error.keyPattern ? Object.keys(error.keyPattern)[0] : 'field';
      const value = error.keyValue ? Object.values(error.keyValue)[0] : 'value';
      return res.status(400).json({
        success: false,
        message: `A supplier with this ${field === 'email' ? 'email' : 'supplier code'} already exists`,
        field: field
      });
    }
    
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message
    });
  }
});

// @desc    Create new supplier (create route)
// @route   POST /api/suppliers/create
// @access  Admin, Manager
router.post("/create", authorize("Admin", "Manager"), async (req, res) => {
  try {
    // Generate supplier code automatically
    const supplierType = req.body.supplierType || 'Private';
    const prefix = supplierType === 'Government' ? 'GOV' : 'PRV';
    
    // Find the last supplier of this type to get the next number
    const lastSupplier = await Supplier.findOne({ 
      supplierCode: { $regex: `^${prefix}` } 
    }).sort({ supplierCode: -1 });
    
    let nextNumber = 1;
    if (lastSupplier) {
      const lastNumber = parseInt(lastSupplier.supplierCode.replace(prefix, ''));
      nextNumber = lastNumber + 1;
    }
    
    const supplierCode = `${prefix}${nextNumber.toString().padStart(3, '0')}`;

    const supplier = new Supplier({
      ...req.body,
      supplierCode,
      createdBy: req.user.id,
    });

    await supplier.save();

    res.status(201).json({
      success: true,
      data: supplier,
      message: "Supplier created successfully",
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "Supplier code or email already exists",
      });
    }
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
});

// @desc    Get all suppliers
// @route   GET /api/suppliers
// @access  Admin, Manager, Employee
router.get("/all", authorize("Admin", "Manager", "Employee"), async (req, res) => {
  try {
    const { page = 1, limit = 10, search, status, businessType, warehouse, supplierType } = req.query;
    
    const query = {};
    
    // Search filter
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { supplierCode: { $regex: search, $options: "i" } },
        { contactPerson: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ];
    }
    
    // Status filter
    if (status) {
      query.status = status;
    }
    
    // Business type filter
    if (businessType) {
      query.businessType = businessType;
    }
    
    // Warehouse filter
    if (warehouse) {
      query.warehouse = warehouse;
    }
    
    // Supplier type filter
    if (supplierType) {
      query.supplierType = supplierType;
    }

    const suppliers = await Supplier.find(query)
      .populate("warehouse", "name location")
      .populate("createdBy", "name email")
      .populate("updatedBy", "name email")
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Supplier.countDocuments(query);

    res.json({
      success: true,
      data: suppliers,
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

// @desc    Get supplier by ID
// @route   GET /api/suppliers/:id
// @access  Admin, Manager, Employee
router.get("/:id", authorize("Admin", "Manager", "Employee"), async (req, res) => {
  try {
    const supplier = await Supplier.findById(req.params.id)
      .populate("warehouse", "name location")
      .populate("createdBy", "name email")
      .populate("updatedBy", "name email");

    if (!supplier) {
      return res.status(404).json({
        success: false,
        message: "Supplier not found",
      });
    }

    res.json({
      success: true,
      data: supplier,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
});

// @desc    Update supplier
// @route   PUT /api/suppliers/:id
// @access  Admin, Manager
router.put("/:id", authorize("Admin", "Manager"), validateSupplier, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const supplier = await Supplier.findById(req.params.id);
    if (!supplier) {
      return res.status(404).json({
        success: false,
        message: "Supplier not found",
      });
    }

    // Check if email or supplier code is being changed and if it already exists
    if (req.body.email && req.body.email.trim() && req.body.email !== supplier.email) {
      const existingEmail = await Supplier.findOne({ email: req.body.email.toLowerCase().trim(), _id: { $ne: req.params.id } });
      if (existingEmail) {
        return res.status(400).json({
          success: false,
          message: "Email already exists",
        });
      }
    }
    
    // Handle email: if empty string, set to undefined; if provided, normalize it
    if (req.body.email !== undefined) {
      req.body.email = req.body.email && req.body.email.trim() ? req.body.email.toLowerCase().trim() : undefined;
    }

    if (req.body.supplierCode && req.body.supplierCode !== supplier.supplierCode) {
      const existingCode = await Supplier.findOne({ supplierCode: req.body.supplierCode, _id: { $ne: req.params.id } });
      if (existingCode) {
        return res.status(400).json({
          success: false,
          message: "Supplier code already exists",
        });
      }
    }

    const updatedSupplier = await Supplier.findByIdAndUpdate(
      req.params.id,
      {
        ...req.body,
        updatedBy: req.user.id,
      },
      { new: true, runValidators: true }
    ).populate("warehouse", "name location");

    res.json({
      success: true,
      data: updatedSupplier,
      message: "Supplier updated successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
});

// @desc    Delete supplier
// @route   DELETE /api/suppliers/:id
// @access  Admin only
router.delete("/:id", isAdmin, async (req, res) => {
  try {
    const supplier = await Supplier.findById(req.params.id);
    if (!supplier) {
      return res.status(404).json({
        success: false,
        message: "Supplier not found",
      });
    }

    // Check if supplier has outstanding balance
    if (supplier.outstandingBalance > 0) {
      return res.status(400).json({
        success: false,
        message: "Cannot delete supplier with outstanding balance",
      });
    }

    await Supplier.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: "Supplier deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
});

// @desc    Update supplier status
// @route   PATCH /api/suppliers/:id/status
// @access  Admin, Manager
router.patch("/:id/status", authorize("Admin", "Manager"), async (req, res) => {
  try {
    const { status } = req.body;
    
    if (!["Active", "Inactive", "Suspended"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status",
      });
    }

    const supplier = await Supplier.findByIdAndUpdate(
      req.params.id,
      { status, updatedBy: req.user.id },
      { new: true, runValidators: true }
    ).populate("warehouse", "name location");

    if (!supplier) {
      return res.status(404).json({
        success: false,
        message: "Supplier not found",
      });
    }

    res.json({
      success: true,
      data: supplier,
      message: "Supplier status updated successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
});

// @desc    Get suppliers with outstanding balance
// @route   GET /api/suppliers/outstanding
// @access  Admin, Manager
router.get("/outstanding", authorize("Admin", "Manager"), async (req, res) => {
  try {
    const suppliers = await Supplier.find({ outstandingBalance: { $gt: 0 } })
      .populate("warehouse", "name location")
      .sort({ outstandingBalance: -1 });

    res.json({
      success: true,
      data: suppliers,
      totalOutstanding: suppliers.reduce((sum, supplier) => sum + supplier.outstandingBalance, 0),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
});

// @desc    Get suppliers summary
// @route   GET /api/suppliers/summary
// @access  Admin, Manager
router.get("/summary", authorize("Admin", "Manager"), async (req, res) => {
  try {
    const totalSuppliers = await Supplier.countDocuments();
    const activeSuppliers = await Supplier.countDocuments({ status: "Active" });
    const totalOutstanding = await Supplier.aggregate([
      { $group: { _id: null, total: { $sum: "$outstandingBalance" } } }
    ]);

    const businessTypeCount = await Supplier.aggregate([
      { $group: { _id: "$businessType", count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    res.json({
      success: true,
      data: {
        totalSuppliers,
        activeSuppliers,
        totalOutstanding: totalOutstanding[0]?.total || 0,
        businessTypeCount,
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

// @desc    Record payment to supplier (reduce outstanding balance)
// @route   PATCH /api/suppliers/:id/payment
// @access  Admin, Manager
router.patch("/:id/payment", authorize("Admin", "Manager"), async (req, res) => {
  try {
    const { amount, paymentMethod, notes } = req.body;
    
    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: "Payment amount must be greater than zero",
      });
    }

    const supplier = await Supplier.findById(req.params.id);
    if (!supplier) {
      return res.status(404).json({
        success: false,
        message: "Supplier not found",
      });
    }

    // Calculate actual due amount from all purchases
    // Get all purchases for this supplier
    const regularPurchases = await Purchase.find({
      "supplier.name": supplier.name
    });
    const bagPurchases = await BagPurchase.find({
      supplier: supplier._id
    });
    const foodPurchases = await FoodPurchase.find({
      supplier: supplier._id
    });

    // Calculate total due
    const regularDue = regularPurchases.reduce((sum, p) => {
      const total = parseFloat(p.totalAmount) || 0;
      const paid = parseFloat(p.paidAmount) || 0;
      return sum + Math.max(0, total - paid);
    }, 0);

    const bagDue = bagPurchases.reduce((sum, p) => {
      const total = parseFloat(p.totalAmount) || 0;
      const paid = parseFloat(p.paidAmount) || 0;
      return sum + Math.max(0, total - paid);
    }, 0);

    const foodDue = foodPurchases.reduce((sum, p) => {
      const total = parseFloat(p.totalAmount) || 0;
      const paid = parseFloat(p.paidAmount) || 0;
      return sum + Math.max(0, total - paid);
    }, 0);

    const calculatedTotalDue = regularDue + bagDue + foodDue;

    // Use calculated total due for validation, not database outstandingBalance
    if (amount > calculatedTotalDue) {
      return res.status(400).json({
        success: false,
        message: `Payment amount (${amount}) cannot exceed total due amount (${calculatedTotalDue})`,
      });
    }

    // Apply payment to purchases (oldest first)
    let remainingPayment = amount;

    // Sort purchases by date (oldest first) to apply payment chronologically
    const allPurchasesWithDue = [
      ...regularPurchases.map(p => ({ ...p.toObject(), type: 'regular', due: Math.max(0, (parseFloat(p.totalAmount) || 0) - (parseFloat(p.paidAmount) || 0)) })),
      ...bagPurchases.map(p => ({ ...p.toObject(), type: 'bag', due: Math.max(0, (parseFloat(p.totalAmount) || 0) - (parseFloat(p.paidAmount) || 0)) })),
      ...foodPurchases.map(p => ({ ...p.toObject(), type: 'food', due: Math.max(0, (parseFloat(p.totalAmount) || 0) - (parseFloat(p.paidAmount) || 0)) }))
    ]
      .filter(p => p.due > 0)
      .sort((a, b) => {
        const dateA = new Date(a.purchaseDate || a.createdAt || 0);
        const dateB = new Date(b.purchaseDate || b.createdAt || 0);
        return dateA - dateB;
      });

    // Apply payment to each purchase until payment is exhausted
    for (const purchase of allPurchasesWithDue) {
      if (remainingPayment <= 0) break;

      const currentDue = purchase.due;
      const paymentToApply = Math.min(remainingPayment, currentDue);
      const newPaidAmount = (parseFloat(purchase.paidAmount) || 0) + paymentToApply;
      const newDueAmount = Math.max(0, (parseFloat(purchase.totalAmount) || 0) - newPaidAmount);

      // Update the purchase record
      if (purchase.type === 'regular') {
        await Purchase.findByIdAndUpdate(purchase._id, {
          $set: {
            paidAmount: newPaidAmount,
            remainingAmount: newDueAmount,
            paymentStatus: newDueAmount === 0 ? 'Paid' : (newPaidAmount > 0 ? 'Partial' : 'Pending')
          }
        });
      } else if (purchase.type === 'bag') {
        await BagPurchase.findByIdAndUpdate(purchase._id, {
          $set: {
            paidAmount: newPaidAmount,
            dueAmount: newDueAmount,
            paymentStatus: newDueAmount === 0 ? 'Paid' : (newPaidAmount > 0 ? 'Partial' : 'Pending')
          }
        });
      } else if (purchase.type === 'food') {
        await FoodPurchase.findByIdAndUpdate(purchase._id, {
          $set: {
            paidAmount: newPaidAmount,
            dueAmount: newDueAmount,
            paymentStatus: newDueAmount === 0 ? 'Paid' : (newPaidAmount > 0 ? 'Partial' : 'Pending')
          }
        });
      }

      remainingPayment -= paymentToApply;
    }

    // Update outstanding balance
    await supplier.updateOutstandingBalance(amount, "decrease");

    // Reload supplier with updated data
    const updatedSupplier = await Supplier.findById(req.params.id)
      .populate("warehouse", "name location")
      .populate("createdBy", "name email")
      .populate("updatedBy", "name email");

    res.json({
      success: true,
      data: updatedSupplier,
      message: `Payment of ${amount} recorded successfully. Outstanding balance and purchase records updated.`,
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

