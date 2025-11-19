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
  body("email").isEmail().withMessage("Valid email is required"),
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

    const supplierData = {
      ...req.body,
      supplierCode,
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
    if (req.body.email && req.body.email !== supplier.email) {
      const existingEmail = await Supplier.findOne({ email: req.body.email, _id: { $ne: req.params.id } });
      if (existingEmail) {
        return res.status(400).json({
          success: false,
          message: "Email already exists",
        });
      }
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
      message: `Payment of ${amount} recorded successfully. Outstanding balance updated.`,
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

