import express from "express";
import { body, validationResult } from "express-validator";
import Supplier from "../model/Supplier.js";
import { protect, authorize, isAdmin, isManagerOrAdmin } from "../middleware/auth.js";

const router = express.Router();

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

// @desc    Create new supplier
// @route   POST /api/suppliers
// @access  Admin, Manager
router.post("/", protect, authorize("Admin", "Manager"), validateSupplier, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const supplier = new Supplier({
      ...req.body,
      createdBy: req.user.id,
    });

    await supplier.save();
    await supplier.populate("warehouse", "name location");

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
router.get("/", protect, authorize("Admin", "Manager", "Employee"), async (req, res) => {
  try {
    const { page = 1, limit = 10, search, status, businessType, warehouse } = req.query;
    
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
router.get("/:id", protect, authorize("Admin", "Manager", "Employee"), async (req, res) => {
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
router.put("/:id", protect, authorize("Admin", "Manager"), validateSupplier, async (req, res) => {
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
router.delete("/:id", protect, isAdmin, async (req, res) => {
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
router.patch("/:id/status", protect, authorize("Admin", "Manager"), async (req, res) => {
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
router.get("/outstanding", protect, authorize("Admin", "Manager"), async (req, res) => {
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
router.get("/summary", protect, authorize("Admin", "Manager"), async (req, res) => {
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

export default router;

