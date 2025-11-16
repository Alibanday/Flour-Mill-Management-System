import express from "express";
import { body, validationResult } from "express-validator";
import mongoose from "mongoose";
import GatePass from "../model/GatePass.js";
import { protect, authorize, isAdmin, isManagerOrAdmin } from "../middleware/auth.js";
import NotificationService from "../services/notificationService.js";

const router = express.Router();

// Validation middleware
const validateGatePass = [
  body("type").isIn(["Person", "Vehicle", "Material", "Equipment", "Visitor"]).withMessage("Valid type is required"),
  body("purpose").trim().notEmpty().withMessage("Purpose is required"),
  body("issuedTo.name").trim().notEmpty().withMessage("Issued to name is required"),
  body("issuedTo.contact").trim().notEmpty().withMessage("Contact is required"),
  body("validUntil").isISO8601().withMessage("Valid until date is required"),
  body("warehouse").isMongoId().withMessage("Valid warehouse ID is required"),
];

// @desc    Get all gate passes (base route)
// @route   GET /api/gate-pass
// @access  Admin, Manager, Employee
router.get("/", protect, authorize("Admin", "Manager", "Employee"), async (req, res) => {
  try {
    const { page = 1, limit = 10, status, type, warehouse, relatedSale, relatedPurchase } = req.query;
    const query = {};
    
    if (status) query.status = status;
    if (type) query.type = type;
    if (warehouse) query.warehouse = warehouse;
    if (relatedSale) query.relatedSale = relatedSale;
    if (relatedPurchase) query.relatedPurchase = relatedPurchase;
    
    // Check if database is connected
    if (mongoose.connection.readyState !== 1) {
      console.log("Database not connected, returning empty data");
      return res.json({
        success: true,
        data: [],
        pagination: {
          current: parseInt(page),
          pages: 0,
          total: 0
        }
      });
    }
    
    const gatePasses = await GatePass.find(query)
      .populate('warehouse', 'name location')
      .populate('issuedBy', 'firstName lastName')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);
    
    const total = await GatePass.countDocuments(query);
    
    res.json({
      success: true,
      data: gatePasses,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (error) {
    console.error("Get gate passes error:", error);
    
    // Handle database connection errors gracefully
    if (error.name === 'MongooseError' && error.message.includes('buffering timed out')) {
      return res.json({
        success: true,
        data: [],
        pagination: {
          current: parseInt(req.query.page || 1),
          pages: 0,
          total: 0
        },
        message: "Database connection issue - returning empty data"
      });
    }
    
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message
    });
  }
});

// @desc    Create new gate pass (base route)
// @route   POST /api/gate-pass
// @access  Admin, Manager, Employee
router.post("/", protect, authorize("Admin", "Manager", "Employee"), validateGatePass, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: errors.array()
      });
    }

    // Check if database is connected
    if (mongoose.connection.readyState !== 1) {
      console.log("Database not connected, cannot create gate pass");
      return res.status(503).json({
        success: false,
        message: "Database connection unavailable. Cannot create gate pass at this time.",
        error: "Database connection required for creating gate passes"
      });
    }

    // Generate gate pass number
    let gatePassNumber;
    try {
      const count = await GatePass.countDocuments();
      const year = new Date().getFullYear();
      gatePassNumber = `GP${year}${String(count + 1).padStart(4, "0")}`;
    } catch (error) {
      // If database is not connected, generate a timestamp-based number
      console.log("Database not connected, generating timestamp-based gate pass number");
      const timestamp = Date.now();
      gatePassNumber = `GP${timestamp}`;
    }

    const gatePassData = {
      ...req.body,
      issuedBy: req.user._id,
      status: 'Active',
      gatePassNumber: gatePassNumber
    };

    const gatePass = new GatePass(gatePassData);
    await gatePass.save();

    await gatePass.populate('warehouse', 'name location');
    await gatePass.populate('issuedBy', 'firstName lastName');

    // Notify warehouse managers/admins based on gatepass purpose
    try {
      if (gatePass.warehouse) {
        const warehouseId = gatePass.warehouse._id || gatePass.warehouse;
        const Warehouse = (await import('../model/wareHouse.js')).default;
        const User = (await import('../model/user.js')).default;
        const Notification = (await import('../model/Notification.js')).default;
        
        // Find warehouse document to get manager
        const warehouseDoc = await Warehouse.findById(warehouseId).populate('manager', '_id email firstName lastName');
        
        // Determine notification message based on purpose
        const isReceiving = gatePass.purpose && (
          gatePass.purpose.toLowerCase().includes('receiving') || 
          gatePass.purpose.toLowerCase().includes('receive') ||
          gatePass.purpose.toLowerCase().includes('purchase')
        );
        
        const notificationTitle = isReceiving 
          ? 'Gate Pass Issued - Goods Receiving'
          : 'Gate Pass Issued - Stock Dispatch';
        const notificationMessage = isReceiving
          ? `Gate Pass ${gatePass.gatePassNumber} issued for goods receiving. Prepare to receive goods at ${warehouseDoc?.name || 'warehouse'}.`
          : `Gate Pass ${gatePass.gatePassNumber} issued. Prepare stock for dispatch from ${warehouseDoc?.name || 'warehouse'}.`;
        
        // Find warehouse managers - check if warehouse has a manager field
        const managers = [];
        
        if (warehouseDoc?.manager) {
          const managerId = warehouseDoc.manager._id || warehouseDoc.manager;
          if (managerId) {
            managers.push(managerId.toString());
          }
        }
        
        // Also find all warehouse managers assigned to this warehouse (via User.warehouse field)
        const warehouseManagers = await User.find({
          $or: [
            { role: 'Warehouse Manager', warehouse: warehouseId },
            { role: 'Manager', warehouse: warehouseId },
            { role: 'Admin' }
          ]
        }).select('_id').limit(10);
        
        // Add managers to list (avoid duplicates)
        const managerIds = new Set(managers);
        warehouseManagers.forEach(m => {
          if (m._id) {
            managerIds.add(m._id.toString());
          }
        });
        
        // Create notifications for all managers
        for (const managerId of managerIds) {
          try {
            await Notification.create({
              type: 'warehouse_transfer',
              title: notificationTitle,
              message: notificationMessage,
              priority: 'high',
              recipient: managerId,
              user: managerId,
              relatedEntity: 'warehouse',
              entityId: gatePass._id,
              status: 'unread',
              metadata: { 
                gatePassNumber: gatePass.gatePassNumber, 
                warehouse: warehouseDoc?.name || 'Warehouse',
                purpose: gatePass.purpose,
                isReceiving: isReceiving
              },
              data: {
                gatePassId: gatePass._id,
                gatePassNumber: gatePass.gatePassNumber,
                warehouseId: warehouseId,
                warehouseName: warehouseDoc?.name || 'Warehouse',
                purpose: gatePass.purpose,
                items: gatePass.items || []
              }
            });
            console.log(`✅ Notification sent to warehouse manager: ${managerId}`);
          } catch (notifyErr) {
            console.warn(`Failed to send notification to manager ${managerId}:`, notifyErr.message);
          }
        }
      }
    } catch (notifyErr) {
      console.warn('Gate Pass notification create failed:', notifyErr.message);
    }

    res.status(201).json({
      success: true,
      message: 'Gate pass created successfully',
      data: gatePass
    });
  } catch (error) {
    console.error("Create gate pass error:", error);
    
    // Handle database connection errors gracefully
    if (error.name === 'MongooseError' && error.message.includes('buffering timed out')) {
      return res.status(503).json({
        success: false,
        message: "Database connection timeout. Please try again later.",
        error: "Database connection timeout"
      });
    }
    
    // Handle validation errors
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        error: error.message
      });
    }
    
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message
    });
  }
});

// @desc    Create new gate pass (create route)
// @route   POST /api/gate-pass/create
// @access  Admin, Manager, Employee
router.post("/create", protect, authorize("Admin", "Manager", "Employee"), validateGatePass, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    // Check if database is connected
    if (mongoose.connection.readyState !== 1) {
      console.log("Database not connected, cannot create gate pass");
      return res.status(503).json({
        success: false,
        message: "Database connection unavailable. Cannot create gate pass at this time.",
        error: "Database connection required for creating gate passes"
      });
    }

    // Generate gate pass number
    let gatePassNumber;
    try {
      const count = await GatePass.countDocuments();
      const year = new Date().getFullYear();
      gatePassNumber = `GP${year}${String(count + 1).padStart(4, "0")}`;
    } catch (error) {
      // If database is not connected, generate a timestamp-based number
      console.log("Database not connected, generating timestamp-based gate pass number");
      const timestamp = Date.now();
      gatePassNumber = `GP${timestamp}`;
    }

    const gatePass = new GatePass({
      ...req.body,
      issuedBy: req.user.id,
      gatePassNumber: gatePassNumber
    });

    await gatePass.save();
    await gatePass.populate([
      { path: "issuedBy", select: "name email" },
      { path: "warehouse", select: "name location" },
    ]);

    res.status(201).json({
      success: true,
      data: gatePass,
      message: "Gate pass created successfully",
    });
  } catch (error) {
    console.error("Create gate pass error:", error);
    
    // Handle database connection errors gracefully
    if (error.name === 'MongooseError' && error.message.includes('buffering timed out')) {
      return res.status(503).json({
        success: false,
        message: "Database connection timeout. Please try again later.",
        error: "Database connection timeout"
      });
    }
    
    // Handle duplicate key errors
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "Gate pass number already exists",
      });
    }
    
    // Handle validation errors
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        error: error.message
      });
    }
    
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
});

// @desc    Get all gate passes
// @route   GET /api/gate-pass
// @access  Admin, Manager, Employee
router.get("/all", protect, authorize("Admin", "Manager", "Employee"), async (req, res) => {
  try {
    const { page = 1, limit = 10, search, status, type, warehouse, dateFrom, dateTo } = req.query;
    
    const query = {};
    
    // Search filter
    if (search) {
      query.$or = [
        { gatePassNumber: { $regex: search, $options: "i" } },
        { "issuedTo.name": { $regex: search, $options: "i" } },
        { purpose: { $regex: search, $options: "i" } },
      ];
    }
    
    // Status filter
    if (status) {
      query.status = status;
    }
    
    // Type filter
    if (type) {
      query.type = type;
    }
    
    // Warehouse filter
    if (warehouse) {
      query.warehouse = warehouse;
    }
    
    // Date range filter
    if (dateFrom || dateTo) {
      query.validFrom = {};
      if (dateFrom) query.validFrom.$gte = new Date(dateFrom);
      if (dateTo) query.validFrom.$lte = new Date(dateTo);
    }

    const gatePasses = await GatePass.find(query)
      .populate("issuedBy", "name email")
      .populate("approvedBy", "name email")
      .populate("warehouse", "name location")
      .populate("stockDispatch.confirmedBy", "name email")
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await GatePass.countDocuments(query);

    res.json({
      success: true,
      data: gatePasses,
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

// @desc    Get gate pass by ID
// @route   GET /api/gate-pass/:id
// @access  Admin, Manager, Employee
router.get("/:id", protect, authorize("Admin", "Manager", "Employee"), async (req, res) => {
  try {
    const gatePass = await GatePass.findById(req.params.id)
      .populate("issuedBy", "name email")
      .populate("approvedBy", "name email")
      .populate("warehouse", "name location")
      .populate("stockDispatch.confirmedBy", "name email");

    if (!gatePass) {
      return res.status(404).json({
        success: false,
        message: "Gate pass not found",
      });
    }

    res.json({
      success: true,
      data: gatePass,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
});

// @desc    Update gate pass
// @route   PUT /api/gate-pass/:id
// @access  Admin, Manager, Employee (only if issued by them)
router.put("/:id", protect, authorize("Admin", "Manager", "Employee"), validateGatePass, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const gatePass = await GatePass.findById(req.params.id);
    if (!gatePass) {
      return res.status(404).json({
        success: false,
        message: "Gate pass not found",
      });
    }

    // Check if user can edit this gate pass
    if (gatePass.issuedBy.toString() !== req.user.id && !["Admin", "Manager"].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to edit this gate pass",
      });
    }

    // Don't allow editing if already completed or cancelled
    if (["Completed", "Cancelled"].includes(gatePass.status)) {
      return res.status(400).json({
        success: false,
        message: "Cannot edit completed or cancelled gate pass",
      });
    }

    const updatedGatePass = await GatePass.findByIdAndUpdate(
      req.params.id,
      { ...req.body, updatedBy: req.user.id },
      { new: true, runValidators: true }
    ).populate([
      { path: "issuedBy", select: "name email" },
      { path: "warehouse", select: "name location" },
    ]);

    res.json({
      success: true,
      data: updatedGatePass,
      message: "Gate pass updated successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
});

// @desc    Delete gate pass
// @route   DELETE /api/gate-pass/:id
// @access  Admin, Manager (only if issued by them)
router.delete("/:id", protect, authorize("Admin", "Manager"), async (req, res) => {
  try {
    const gatePass = await GatePass.findById(req.params.id);
    if (!gatePass) {
      return res.status(404).json({
        success: false,
        message: "Gate pass not found",
      });
    }

    // Check if user can delete this gate pass
    if (gatePass.issuedBy.toString() !== req.user.id && req.user.role !== "Admin") {
      return res.status(403).json({
        success: false,
        message: "Not authorized to delete this gate pass",
      });
    }

    await GatePass.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: "Gate pass deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
});

// @desc    Approve gate pass
// @route   PATCH /api/gate-pass/:id/approve
// @access  Admin, Manager
router.patch("/:id/approve", protect, authorize("Admin", "Manager"), async (req, res) => {
  try {
    const gatePass = await GatePass.findById(req.params.id);
    if (!gatePass) {
      return res.status(404).json({
        success: false,
        message: "Gate pass not found",
      });
    }

    if (gatePass.status !== "Pending") {
      return res.status(400).json({
        success: false,
        message: "Gate pass is not pending approval",
      });
    }

    gatePass.status = "Approved";
    gatePass.approvedBy = req.user.id;
    await gatePass.save();

    await gatePass.populate([
      { path: "issuedBy", select: "name email" },
      { path: "approvedBy", select: "name email" },
      { path: "warehouse", select: "name location" },
    ]);

    res.json({
      success: true,
      data: gatePass,
      message: "Gate pass approved successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
});

// @desc    Activate gate pass
// @route   PATCH /api/gate-pass/:id/activate
// @access  Admin, Manager
router.patch("/:id/activate", protect, authorize("Admin", "Manager"), async (req, res) => {
  try {
    const gatePass = await GatePass.findById(req.params.id);
    if (!gatePass) {
      return res.status(404).json({
        success: false,
        message: "Gate pass not found",
      });
    }

    if (gatePass.status !== "Approved") {
      return res.status(400).json({
        success: false,
        message: "Gate pass must be approved before activation",
      });
    }

    gatePass.status = "Active";
    await gatePass.save();

    await gatePass.populate([
      { path: "issuedBy", select: "name email" },
      { path: "approvedBy", select: "name email" },
      { path: "warehouse", select: "name location" },
    ]);

    res.json({
      success: true,
      data: gatePass,
      message: "Gate pass activated successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
});

// @desc    Complete gate pass
// @route   PATCH /api/gate-pass/:id/complete
// @access  Admin, Manager, Employee
router.patch("/:id/complete", protect, authorize("Admin", "Manager", "Employee"), async (req, res) => {
  try {
    const gatePass = await GatePass.findById(req.params.id);
    if (!gatePass) {
      return res.status(404).json({
        success: false,
        message: "Gate pass not found",
      });
    }

    if (gatePass.status !== "Active") {
      return res.status(400).json({
        success: false,
        message: "Gate pass must be active to complete",
      });
    }

    gatePass.status = "Completed";
    await gatePass.save();

    await gatePass.populate([
      { path: "issuedBy", select: "name email" },
      { path: "approvedBy", select: "name email" },
      { path: "warehouse", select: "name location" },
    ]);

    res.json({
      success: true,
      data: gatePass,
      message: "Gate pass completed successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
});

// @desc    Cancel gate pass
// @route   PATCH /api/gate-pass/:id/cancel
// @access  Admin, Manager (only if issued by them)
router.patch("/:id/cancel", protect, authorize("Admin", "Manager"), async (req, res) => {
  try {
    const gatePass = await GatePass.findById(req.params.id);
    if (!gatePass) {
      return res.status(404).json({
        success: false,
        message: "Gate pass not found",
      });
    }

    // Check if user can cancel this gate pass
    if (gatePass.issuedBy.toString() !== req.user.id && req.user.role !== "Admin") {
      return res.status(403).json({
        success: false,
        message: "Not authorized to cancel this gate pass",
      });
    }

    if (["Completed", "Cancelled"].includes(gatePass.status)) {
      return res.status(400).json({
        success: false,
        message: "Cannot cancel completed or already cancelled gate pass",
      });
    }

    gatePass.status = "Cancelled";
    await gatePass.save();

    await gatePass.populate([
      { path: "issuedBy", select: "name email" },
      { path: "approvedBy", select: "name email" },
      { path: "warehouse", select: "name location" },
    ]);

    res.json({
      success: true,
      data: gatePass,
      message: "Gate pass cancelled successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
});

// @desc    Confirm stock dispatch
// @route   PATCH /api/gate-pass/:id/confirm-dispatch
// @access  Admin, Manager, Employee
router.patch("/:id/confirm-dispatch", protect, authorize("Admin", "Manager", "Employee"), async (req, res) => {
  try {
    const { notes } = req.body;
    
    const gatePass = await GatePass.findById(req.params.id);
    if (!gatePass) {
      return res.status(404).json({
        success: false,
        message: "Gate pass not found",
      });
    }

    if (gatePass.status !== "Active") {
      return res.status(400).json({
        success: false,
        message: "Gate pass must be active to confirm dispatch",
      });
    }

    if (gatePass.stockDispatch.confirmed) {
      return res.status(400).json({
        success: false,
        message: "Stock dispatch already confirmed",
      });
    }

    gatePass.stockDispatch.confirmed = true;
    gatePass.stockDispatch.confirmedBy = req.user.id;
    gatePass.stockDispatch.confirmedAt = new Date();
    gatePass.stockDispatch.notes = notes || "";
    
    await gatePass.save();

    await gatePass.populate([
      { path: "issuedBy", select: "name email" },
      { path: "approvedBy", select: "name email" },
      { path: "warehouse", select: "name location" },
      { path: "stockDispatch.confirmedBy", select: "name email" },
    ]);

    res.json({
      success: true,
      data: gatePass,
      message: "Stock dispatch confirmed successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
});

// @desc    Mark WhatsApp shared
// @route   PATCH /api/gate-pass/:id/whatsapp-shared
// @access  Admin, Manager, Employee
router.patch("/:id/whatsapp-shared", protect, authorize("Admin", "Manager", "Employee"), async (req, res) => {
  try {
    const gatePass = await GatePass.findById(req.params.id);
    if (!gatePass) {
      return res.status(404).json({
        success: false,
        message: "Gate pass not found",
      });
    }

    gatePass.whatsappShared = true;
    gatePass.whatsappSharedAt = new Date();
    gatePass.whatsappSharedBy = req.user.id;
    
    await gatePass.save();

    await gatePass.populate([
      { path: "issuedBy", select: "name email" },
      { path: "warehouse", select: "name location" },
      { path: "whatsappSharedBy", select: "name email" },
    ]);

    res.json({
      success: true,
      data: gatePass,
      message: "WhatsApp shared status updated",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
});

// @desc    Get gate pass statistics
// @route   GET /api/gate-pass/stats/summary
// @access  Admin, Manager
router.get("/stats/summary", protect, authorize("Admin", "Manager"), async (req, res) => {
  try {
    // Check if database is connected
    if (mongoose.connection.readyState !== 1) {
      console.log("Database not connected, returning empty stats");
      return res.json({
        success: true,
        data: {
          total: 0,
          active: 0,
          pending: 0,
          approved: 0,
          completed: 0,
          expired: 0,
          statusBreakdown: [],
        },
        message: "Database connection issue - returning empty stats"
      });
    }

    const stats = await GatePass.aggregate([
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        },
      },
    ]);

    const total = await GatePass.countDocuments();
    const active = await GatePass.countDocuments({ status: "Active" });
    const pending = await GatePass.countDocuments({ status: "Pending" });
    const approved = await GatePass.countDocuments({ status: "Approved" });
    const completed = await GatePass.countDocuments({ status: "Completed" });
    const expired = await GatePass.countDocuments({ 
      validUntil: { $lt: new Date() },
      status: { $in: ["Active", "Approved"] }
    });

    res.json({
      success: true,
      data: {
        total,
        active,
        pending,
        approved,
        completed,
        expired,
        statusBreakdown: stats,
      },
    });
  } catch (error) {
    console.error("Get gate pass stats error:", error);
    
    // Handle database connection errors gracefully
    if (error.name === 'MongooseError' && error.message.includes('buffering timed out')) {
      return res.json({
        success: true,
        data: {
          total: 0,
          active: 0,
          pending: 0,
          approved: 0,
          completed: 0,
          expired: 0,
          statusBreakdown: [],
        },
        message: "Database connection issue - returning empty stats"
      });
    }
    
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
});

// @desc    Get active gate passes for warehouse manager
// @route   GET /api/gate-pass/warehouse/:warehouseId/active
// @access  Admin, Manager, Employee
router.get("/warehouse/:warehouseId/active", protect, authorize("Admin", "Manager", "Employee"), async (req, res) => {
  try {
    const activeGatePasses = await GatePass.find({
      warehouse: req.params.warehouseId,
      status: "Active",
      validUntil: { $gte: new Date() },
    })
      .populate("issuedBy", "name email")
      .populate("warehouse", "name location")
      .sort({ validUntil: 1 });

    res.json({
      success: true,
      data: activeGatePasses,
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
