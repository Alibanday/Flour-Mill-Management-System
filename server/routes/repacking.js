import express from "express";
import { body, validationResult } from "express-validator";
import Repacking from "../model/Repacking.js";
import Inventory from "../model/inventory.js";
import Stock from "../model/stock.js";
import { protect, authorize } from "../middleware/auth.js";

const router = express.Router();

// Apply authentication to all routes
router.use(protect);

// ========================================
// REPACKING ROUTES (FR 17)
// ========================================

// Get all repacking records
router.get("/all", authorize("'Admin'", "'Manager'", "'Employee'"), async (req, res) => {
  try {
    const { page = 1, limit = 10, search, status, warehouse, repackingType } = req.query;
    
    let query = {};
    
    if (search) {
      query.$or = [
        { repackingNumber: { $regex: search, $options: 'i' } },
        { batchNumber: { $regex: search, $options: 'i' } },
        { 'sourceProduct.productName': { $regex: search, $options: 'i' } }
      ];
    }
    
    if (status) query.status = status;
    if (warehouse) query.warehouse = warehouse;
    if (repackingType) query['repackingDetails.repackingType'] = repackingType;
    
    const repackings = await Repacking.find(query)
      .populate('warehouse', 'name')
      .populate('sourceProduct.productId', 'name code')
      .populate('targetProducts.productId', 'name code')
      .populate('assignedTo', 'firstName lastName')
      .populate('approvedBy', 'firstName lastName')
      .populate('qualityControl.checkedBy', 'firstName lastName')
      .populate('createdBy', 'firstName lastName')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);
    
    const total = await Repacking.countDocuments(query);
    
    res.json({
      success: true,
      data: repackings,
      pagination: {
        totalPages: Math.ceil(total / limit),
        currentPage: parseInt(page),
        total
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get repacking by ID
router.get("/:id", authorize("'Admin'", "'Manager'", "'Employee'"), async (req, res) => {
  try {
    const repacking = await Repacking.findById(req.params.id)
      .populate('warehouse', 'name')
      .populate('sourceProduct.productId', 'name code')
      .populate('targetProducts.productId', 'name code')
      .populate('assignedTo', 'firstName lastName')
      .populate('approvedBy', 'firstName lastName')
      .populate('qualityControl.checkedBy', 'firstName lastName')
      .populate('createdBy', 'firstName lastName');
    
    if (!repacking) {
      return res.status(404).json({ success: false, message: 'Repacking record not found' });
    }
    
    res.json({ success: true, data: repacking });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Create new repacking record
router.post("/create", [
  authorize("'Admin'", "'Manager'", "'Employee'"),
  body('batchNumber').notEmpty().withMessage('Batch number is required'),
  body('sourceProduct.productId').isMongoId().withMessage('Valid source product ID is required'),
  body('sourceProduct.currentQuantity').isNumeric().withMessage('Current quantity must be a number'),
  body('sourceProduct.currentWeight').isNumeric().withMessage('Current weight must be a number'),
  body('targetProducts').isArray({ min: 1 }).withMessage('At least one target product is required'),
  body('targetProducts.*.productId').isMongoId().withMessage('Valid target product ID is required'),
  body('targetProducts.*.targetQuantity').isNumeric().withMessage('Target quantity must be a number'),
  body('targetProducts.*.targetWeight').isNumeric().withMessage('Target weight must be a number'),
  body('targetProducts.*.bagType').isIn(['ATA', 'MAIDA', 'SUJI', 'FINE', 'CUSTOM']).withMessage('Invalid bag type'),
  body('warehouse').isMongoId().withMessage('Valid warehouse ID is required'),
  body('repackingDetails.repackingType').isIn(['Bulk to Bags', 'Bag Size Change', 'Quality Separation', 'Custom']).withMessage('Invalid repacking type'),
  body('repackingDetails.reason').notEmpty().withMessage('Repacking reason is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }
    
    // Generate repacking number
    const repackingNumber = await Repacking.generateRepackingNumber();
    
    const repackingData = {
      ...req.body,
      repackingNumber,
      createdBy: req.user.id
    };
    
    const repacking = new Repacking(repackingData);
    await repacking.save();
    
    res.status(201).json({
      success: true,
      message: 'Repacking record created successfully',
      data: repacking
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Start repacking
router.patch("/:id/start", authorize("'Admin'", "'Manager'", "'Employee'"), async (req, res) => {
  try {
    const repacking = await Repacking.findById(req.params.id);
    if (!repacking) {
      return res.status(404).json({ success: false, message: 'Repacking record not found' });
    }
    
    if (repacking.status !== 'Pending') {
      return res.status(400).json({ 
        success: false, 
        message: 'Only pending repacking records can be started' 
      });
    }
    
    await repacking.startRepacking(req.user.id);
    
    res.json({
      success: true,
      message: 'Repacking started successfully',
      data: repacking
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Complete repacking
router.patch("/:id/complete", authorize("'Admin'", "'Manager'", "'Employee'"), [
  body('qualityData.preRepackingWeight').isNumeric().withMessage('Pre-repacking weight must be a number'),
  body('qualityData.postRepackingWeight').isNumeric().withMessage('Post-repacking weight must be a number'),
  body('qualityData.qualityCheck').isIn(['Passed', 'Failed', 'Pending']).withMessage('Invalid quality check status'),
  body('qualityData.qualityNotes').optional().isString().withMessage('Quality notes must be a string')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }
    
    const repacking = await Repacking.findById(req.params.id);
    if (!repacking) {
      return res.status(404).json({ success: false, message: 'Repacking record not found' });
    }
    
    if (repacking.status !== 'In Progress') {
      return res.status(400).json({ 
        success: false, 
        message: 'Only in-progress repacking records can be completed' 
      });
    }
    
    const qualityData = {
      ...req.body.qualityData,
      checkedBy: req.user.id,
      checkedAt: new Date()
    };
    
    await repacking.completeRepacking(qualityData);
    
    res.json({
      success: true,
      message: 'Repacking completed successfully',
      data: repacking
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Approve repacking
router.patch("/:id/approve", authorize("'Admin'", "'Manager'"), [
  body('notes').optional().isString().withMessage('Notes must be a string')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }
    
    const repacking = await Repacking.findById(req.params.id);
    if (!repacking) {
      return res.status(404).json({ success: false, message: 'Repacking record not found' });
    }
    
    if (repacking.status !== 'Quality Check') {
      return res.status(400).json({ 
        success: false, 
        message: 'Only quality-checked repacking records can be approved' 
      });
    }
    
    await repacking.approveRepacking(req.user.id, req.body.notes);
    
    // Update stock levels
    await updateStockAfterRepacking(repacking);
    
    res.json({
      success: true,
      message: 'Repacking approved successfully',
      data: repacking
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Update repacking cost
router.patch("/:id/cost", authorize("'Admin'", "'Manager'"), [
  body('laborCost').optional().isNumeric().withMessage('Labor cost must be a number'),
  body('materialCost').optional().isNumeric().withMessage('Material cost must be a number'),
  body('overheadCost').optional().isNumeric().withMessage('Overhead cost must be a number')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }
    
    const repacking = await Repacking.findById(req.params.id);
    if (!repacking) {
      return res.status(404).json({ success: false, message: 'Repacking record not found' });
    }
    
    const { laborCost, materialCost, overheadCost } = req.body;
    
    if (laborCost !== undefined) repacking.costCalculation.laborCost = laborCost;
    if (materialCost !== undefined) repacking.costCalculation.materialCost = materialCost;
    if (overheadCost !== undefined) repacking.costCalculation.overheadCost = overheadCost;
    
    repacking.updatedBy = req.user.id;
    await repacking.save();
    
    res.json({
      success: true,
      message: 'Repacking cost updated successfully',
      data: repacking
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get repacking statistics
router.get("/stats/overview", authorize("'Admin'", "'Manager'"), async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    let matchQuery = {};
    if (startDate && endDate) {
      matchQuery['repackingDetails.repackingDate'] = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }
    
    const stats = await Repacking.getRepackingStats(startDate, endDate);
    
    const totalRepackings = await Repacking.countDocuments(matchQuery);
    const statusBreakdown = await Repacking.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);
    
    res.json({
      success: true,
      data: {
        totalRepackings,
        statusBreakdown,
        ...stats[0]
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Helper function to update stock after repacking approval
async function updateStockAfterRepacking(repacking) {
  try {
    // Reduce source product stock
    await Stock.findOneAndUpdate(
      { 
        warehouse: repacking.warehouse, 
        inventoryItem: repacking.sourceProduct.productId 
      },
      { $inc: { quantity: -repacking.sourceProduct.currentQuantity } },
      { new: true }
    );
    
    // Add target products to stock
    for (const targetProduct of repacking.targetProducts) {
      const existingStock = await Stock.findOne({
        warehouse: repacking.warehouse,
        inventoryItem: targetProduct.productId
      });
      
      if (existingStock) {
        existingStock.quantity += targetProduct.targetQuantity;
        await existingStock.save();
      } else {
        const inventory = await Inventory.findById(targetProduct.productId);
        const newStock = new Stock({
          warehouse: repacking.warehouse,
          inventoryItem: targetProduct.productId,
          quantity: targetProduct.targetQuantity,
          unit: inventory.unit,
          createdBy: repacking.createdBy
        });
        await newStock.save();
      }
    }
  } catch (error) {
    console.error('Error updating stock after repacking:', error);
    throw error;
  }
}

export default router;

