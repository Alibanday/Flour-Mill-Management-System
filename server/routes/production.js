import express from "express";
import { body, validationResult } from "express-validator";
import Production from "../model/Production.js";
import Warehouse from "../model/warehouse.js";
import { protect, authorize } from "../middleware/auth.js";

const router = express.Router();

// Apply authentication to all routes
router.use(protect);

// @route   POST /api/production
// @desc    Add daily production details (base route)
// @access  Private (Manager only)
router.post("/", [
  authorize("Manager", "Admin"),
  body("batchNumber").trim().notEmpty().withMessage("Batch number is required"),
  body("productName").isIn(["Wheat Flour", "Whole Wheat", "Premium Flour", "Maida", "Suji", "Fine", "Chokhar", "Refraction"]).withMessage("Invalid product name"),
  body("productType").isIn(["Raw Materials", "Finished Goods", "Repacked Product"]).withMessage("Invalid product type"),
  body("quantity.value").isNumeric().withMessage("Quantity must be a number"),
  body("quantity.unit").isIn(["kg", "tons", "bags", "pcs"]).withMessage("Invalid unit"),
  body("productionCost.rawMaterialCost").isNumeric().withMessage("Raw material cost must be a number"),
  body("productionCost.laborCost").isNumeric().withMessage("Labor cost must be a number"),
  body("productionCost.overheadCost").isNumeric().withMessage("Overhead cost must be a number"),
  body("warehouse").isMongoId().withMessage("Valid warehouse ID is required")
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

    console.log("Production creation - User ID:", req.user._id || req.user.id);
    console.log("Production creation - User object:", req.user);

    const {
      batchNumber,
      productName,
      productType,
      quantity,
      productionCost,
      quality,
      productionDate,
      warehouse,
      notes
    } = req.body;

    // Check if batch number already exists
    const existingProduction = await Production.findOne({ batchNumber });
    if (existingProduction) {
      return res.status(400).json({
        success: false,
        message: "Batch number already exists"
      });
    }

    // Verify warehouse exists
    const warehouseExists = await Warehouse.findById(warehouse);
    if (!warehouseExists) {
      return res.status(400).json({
        success: false,
        message: "Warehouse not found"
      });
    }

    // Calculate total cost
    const totalCost = productionCost.rawMaterialCost + productionCost.laborCost + productionCost.overheadCost;
    
    // Create production record
    const production = new Production({
      batchNumber,
      productName,
      productType,
      quantity,
      productionCost: {
        ...productionCost,
        totalCost: totalCost
      },
      quality: {
        grade: quality?.grade || "Standard",
        moistureContent: quality?.moistureContent || quality?.moisture || 0,
        proteinContent: quality?.proteinContent || quality?.protein || 0
      },
      productionDate: productionDate ? new Date(productionDate) : new Date(),
      warehouse,
      notes,
      addedBy: req.user._id || req.user.id || "507f1f77bcf86cd799439011", // Add the required addedBy field
      status: "Completed"
    });

    await production.save();

    // Populate the response
    await production.populate('warehouse', 'name location');
    await production.populate('addedBy', 'firstName lastName');

    res.status(201).json({
      success: true,
      message: "Production record created successfully",
      data: production
    });
  } catch (error) {
    console.error("Create production error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while creating production record"
    });
  }
});

// @route   POST /api/production/create
// @desc    Add daily production details (FR 14)
// @access  Private (Manager only)
router.post("/create", [
  authorize("Manager", "Admin"),
  body("batchNumber").trim().notEmpty().withMessage("Batch number is required"),
  body("productName").isIn(["Wheat Flour", "Whole Wheat", "Premium Flour", "Maida", "Suji", "Fine", "Chokhar", "Refraction"]).withMessage("Invalid product name"),
  body("productType").isIn(["Raw Materials", "Finished Goods", "Repacked Product"]).withMessage("Invalid product type"),
  body("quantity.value").isNumeric().withMessage("Quantity must be a number"),
  body("quantity.unit").isIn(["kg", "tons", "bags", "pcs"]).withMessage("Invalid unit"),
  body("productionCost.rawMaterialCost").isNumeric().withMessage("Raw material cost must be a number"),
  body("productionCost.laborCost").isNumeric().withMessage("Labor cost must be a number"),
  body("productionCost.overheadCost").isNumeric().withMessage("Overhead cost must be a number"),
  body("warehouse").isMongoId().withMessage("Valid warehouse ID is required")
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

    // Check if batch number already exists
    const existingBatch = await Production.findOne({ batchNumber: req.body.batchNumber });
    if (existingBatch) {
      return res.status(400).json({
        success: false,
        message: "Batch number already exists"
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

    // Create production record
    const productionData = {
      ...req.body,
      addedBy: req.user._id || req.user.id || "507f1f77bcf86cd799439011",
      productionDate: req.body.productionDate || new Date()
    };

    const production = new Production(productionData);
    await production.save();

    res.status(201).json({
      success: true,
      message: "Production record created successfully",
      data: production
    });

  } catch (error) {
    console.error("Create production error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while creating production record"
    });
  }
});

// @route   GET /api/production
// @desc    Get all production records with filtering and pagination (base route)
// @access  Private (Manager, Admin, Employee)
router.get("/", [
  authorize("Manager", "Admin", "Employee")
], async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search,
      productName,
      status,
      warehouse,
      startDate,
      endDate,
      quality
    } = req.query;

    // Build filter object
    const filter = {};
    
    if (search) {
      filter.$or = [
        { batchNumber: { $regex: search, $options: 'i' } },
        { productName: { $regex: search, $options: 'i' } },
        { productType: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (productName) filter.productName = productName;
    if (status) filter.status = status;
    if (warehouse) filter.warehouse = warehouse;
    if (quality) filter.quality = quality;
    
    if (startDate || endDate) {
      filter.productionDate = {};
      if (startDate) filter.productionDate.$gte = new Date(startDate);
      if (endDate) filter.productionDate.$lte = new Date(endDate);
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Get total count for pagination
    const total = await Production.countDocuments(filter);
    
    // Get production records with pagination
    const productions = await Production.find(filter)
      .populate('warehouse', 'name location')
      .populate('addedBy', 'firstName lastName')
      .sort({ productionDate: -1, createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Calculate pagination info
    const totalPages = Math.ceil(total / parseInt(limit));
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    res.json({
      success: true,
      data: productions,
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
    console.error("Get productions error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message
    });
  }
});

// @route   GET /api/production/all
// @desc    Get all production records with filtering and pagination
// @access  Private (Manager, Admin, Employee)
router.get("/all", [
  authorize("Manager", "Admin", "Employee")
], async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search,
      productName,
      status,
      warehouse,
      startDate,
      endDate,
      quality
    } = req.query;

    // Build filter object
    const filter = {};

    if (search) {
      filter.$or = [
        { batchNumber: { $regex: search, $options: "i" } },
        { productName: { $regex: search, $options: "i" } },
        { notes: { $regex: search, $options: "i" } }
      ];
    }

    if (productName && productName !== "all") {
      filter.productName = productName;
    }

    if (status && status !== "all") {
      filter.status = status;
    }

    if (warehouse && warehouse !== "all") {
      filter.warehouse = warehouse;
    }

    if (quality && quality !== "all") {
      filter["quality.grade"] = quality;
    }

    if (startDate && endDate) {
      filter.productionDate = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Get production records with pagination
    const productions = await Production.find(filter)
      .populate("warehouse", "name location")
      .populate("addedBy", "firstName lastName")
      .populate("process.operator", "firstName lastName")
      .populate("quality.approvedBy", "firstName lastName")
      .sort({ productionDate: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Get total count for pagination
    const total = await Production.countDocuments(filter);

    res.json({
      success: true,
      data: productions,
      pagination: {
        current: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });

  } catch (error) {
    console.error("Get productions error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching production records"
    });
  }
});

// @route   GET /api/production/:id
// @desc    Get single production record
// @access  Private (Manager, Admin, Employee)
router.get("/:id", [
  authorize("Manager", "Admin", "Employee")
], async (req, res) => {
  try {
    const production = await Production.findById(req.params.id)
      .populate("warehouse", "name location")
      .populate("addedBy", "firstName lastName")
      .populate("process.operator", "firstName lastName")
      .populate("quality.approvedBy", "firstName lastName");

    if (!production) {
      return res.status(404).json({
        success: false,
        message: "Production record not found"
      });
    }

    res.json({
      success: true,
      data: production
    });

  } catch (error) {
    console.error("Get production error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching production record"
    });
  }
});

// @route   PUT /api/production/:id
// @desc    Edit production entry (FR 15)
// @access  Private (Manager, Admin)
router.put("/:id", [
  authorize("Manager", "Admin"),
  body("batchNumber").optional().trim().notEmpty().withMessage("Batch number cannot be empty"),
  body("productName").optional().isIn(["Wheat Flour", "Whole Wheat", "Premium Flour", "Maida", "Suji", "Fine", "Chokhar", "Refraction"]).withMessage("Invalid product name"),
  body("quantity.value").optional().isNumeric().withMessage("Quantity must be a number"),
  body("productionCost.rawMaterialCost").optional().isNumeric().withMessage("Raw material cost must be a number"),
  body("productionCost.laborCost").optional().isNumeric().withMessage("Labor cost must be a number"),
  body("productionCost.overheadCost").optional().isNumeric().withMessage("Overhead cost must be a number")
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

    // Check if production record exists
    const production = await Production.findById(req.params.id);
    if (!production) {
      return res.status(404).json({
        success: false,
        message: "Production record not found"
      });
    }

    // Check if batch number is being changed and if it already exists
    if (req.body.batchNumber && req.body.batchNumber !== production.batchNumber) {
      const existingBatch = await Production.findOne({ 
        batchNumber: req.body.batchNumber,
        _id: { $ne: req.params.id }
      });
      if (existingBatch) {
        return res.status(400).json({
          success: false,
          message: "Batch number already exists"
        });
      }
    }

    // Update production record
    const updatedProduction = await Production.findByIdAndUpdate(
      req.params.id,
      { ...req.body, updatedAt: new Date() },
      { new: true, runValidators: true }
    ).populate("warehouse", "name location")
     .populate("addedBy", "firstName lastName");

    res.json({
      success: true,
      message: "Production record updated successfully",
      data: updatedProduction
    });

  } catch (error) {
    console.error("Update production error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while updating production record"
    });
  }
});

// @route   PATCH /api/production/:id/repack
// @desc    Product repacking and save new product (FR 17)
// @access  Private (Manager, Admin)
router.patch("/:id/repack", [
  authorize("Manager", "Admin"),
  body("newProductName").trim().notEmpty().withMessage("New product name is required"),
  body("repackingCost").isNumeric().withMessage("Repacking cost must be a number"),
  body("quantity.value").isNumeric().withMessage("New quantity must be a number"),
  body("quantity.unit").isIn(["kg", "tons", "bags", "pcs"]).withMessage("Invalid unit")
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

    // Check if production record exists
    const production = await Production.findById(req.params.id);
    if (!production) {
      return res.status(404).json({
        success: false,
        message: "Production record not found"
      });
    }

    // Update repacking information
    production.repacking = {
      isRepacked: true,
      originalProduct: production.productName,
      repackingDate: new Date(),
      repackingCost: req.body.repackingCost,
      newProductName: req.body.newProductName
    };

    // Update product information
    production.productName = req.body.newProductName;
    production.productType = "Repacked Product";
    production.quantity = req.body.quantity;
    production.status = "Quality Check";
    production.notes = req.body.notes || production.notes;

    await production.save();

    res.json({
      success: true,
      message: "Product repacked successfully",
      data: production
    });

  } catch (error) {
    console.error("Repack production error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while repacking product"
    });
  }
});

// @route   PATCH /api/production/:id/wastage
// @desc    Update wastage information (FR 18)
// @access  Private (Manager, Admin)
router.patch("/:id/wastage", [
  authorize("Manager", "Admin"),
  body("wastage.quantity").isNumeric().withMessage("Wastage quantity must be a number"),
  body("wastage.reason").isIn(["Processing Loss", "Quality Issue", "Machine Error", "Human Error", "Other"]).withMessage("Invalid wastage reason"),
  body("wastage.cost").optional().isNumeric().withMessage("Wastage cost must be a number")
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

    // Check if production record exists
    const production = await Production.findById(req.params.id);
    if (!production) {
      return res.status(404).json({
        success: false,
        message: "Production record not found"
      });
    }

    // Update wastage information
    production.wastage = {
      ...production.wastage,
      ...req.body.wastage,
      unit: req.body.wastage.unit || production.wastage.unit
    };

    await production.save();

    res.json({
      success: true,
      message: "Wastage information updated successfully",
      data: production
    });

  } catch (error) {
    console.error("Update wastage error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while updating wastage information"
    });
  }
});

// @route   PATCH /api/production/:id/status
// @desc    Update production status
// @access  Private (Manager, Admin)
router.patch("/:id/status", [
  authorize("Manager", "Admin"),
  body("status").isIn(["In Progress", "Completed", "Quality Check", "Approved", "Rejected", "Dispatched"]).withMessage("Invalid status"),
  body("notes").optional().trim()
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

    // Check if production record exists
    const production = await Production.findById(req.params.id);
    if (!production) {
      return res.status(404).json({
        success: false,
        message: "Production record not found"
      });
    }

    // Update status and notes
    production.status = req.body.status;
    if (req.body.notes) {
      production.notes = req.body.notes;
    }

    // Set approval information if status is Approved
    if (req.body.status === "Approved") {
      production.quality.approved = true;
      production.quality.approvedBy = req.user.id;
      production.quality.approvedAt = new Date();
    }

    await production.save();

    res.json({
      success: true,
      message: "Production status updated successfully",
      data: production
    });

  } catch (error) {
    console.error("Update status error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while updating production status"
    });
  }
});

// @route   GET /api/production/daily/:date
// @desc    Get daily production summary (FR 16 - Cost calculation)
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

    const dailyProductions = await Production.getDailyProduction(date);

    // Calculate daily totals
    const dailySummary = {
      date: req.params.date,
      totalBatches: dailyProductions.length,
      totalQuantity: dailyProductions.reduce((sum, prod) => sum + prod.quantity.value, 0),
      totalCost: dailyProductions.reduce((sum, prod) => sum + prod.productionCost.totalCost, 0),
      totalWastage: dailyProductions.reduce((sum, prod) => sum + prod.wastage.quantity, 0),
      products: dailyProductions.map(prod => ({
        batchNumber: prod.batchNumber,
        productName: prod.productName,
        quantity: prod.quantity.value,
        unit: prod.quantity.unit,
        cost: prod.productionCost.totalCost,
        wastage: prod.wastage.quantity
      }))
    };

    res.json({
      success: true,
      data: dailySummary
    });

  } catch (error) {
    console.error("Get daily production error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching daily production summary"
    });
  }
});

// @route   DELETE /api/production/:id
// @desc    Delete production record (Admin only)
// @access  Private (Admin only)
router.delete("/:id", [
  authorize("Admin")
], async (req, res) => {
  try {
    const production = await Production.findById(req.params.id);
    if (!production) {
      return res.status(404).json({
        success: false,
        message: "Production record not found"
      });
    }

    await Production.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: "Production record deleted successfully"
    });

  } catch (error) {
    console.error("Delete production error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while deleting production record"
    });
  }
});

export default router;
