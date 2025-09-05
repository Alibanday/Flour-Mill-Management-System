import express from "express";
import { body, validationResult } from "express-validator";
import StockTransfer from "../model/StockTransfer.js";
import Stock from "../model/stock.js";
import Inventory from "../model/inventory.js";
import { protect, authorize } from "../middleware/auth.js";

const router = express.Router();

// Apply authentication to all routes
router.use(protect);

// ========================================
// STOCK TRANSFER ROUTES (FR 12)
// ========================================

// Get all stock transfers
router.get("/all", authorize("'Admin'", "'Manager'", "'Employee'"), async (req, res) => {
  try {
    const { page = 1, limit = 10, search, status, fromWarehouse, toWarehouse, transferType } = req.query;
    
    let query = {};
    
    if (search) {
      query.$or = [
        { transferNumber: { $regex: search, $options: 'i' } },
        { 'items.productName': { $regex: search, $options: 'i' } },
        { 'items.productCode': { $regex: search, $options: 'i' } }
      ];
    }
    
    if (status) query.status = status;
    if (fromWarehouse) query.fromWarehouse = fromWarehouse;
    if (toWarehouse) query.toWarehouse = toWarehouse;
    if (transferType) query.transferType = transferType;
    
    const transfers = await StockTransfer.find(query)
      .populate('fromWarehouse', 'name')
      .populate('toWarehouse', 'name')
      .populate('items.inventoryItem', 'name code')
      .populate('createdBy', 'firstName lastName')
      .populate('approval.approvedBy', 'firstName lastName')
      .populate('dispatch.dispatchedBy', 'firstName lastName')
      .populate('receipt.receivedBy', 'firstName lastName')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);
    
    const total = await StockTransfer.countDocuments(query);
    
    res.json({
      success: true,
      data: transfers,
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

// Get transfer by ID
router.get("/:id", authorize("'Admin'", "'Manager'", "'Employee'"), async (req, res) => {
  try {
    const transfer = await StockTransfer.findById(req.params.id)
      .populate('fromWarehouse', 'name')
      .populate('toWarehouse', 'name')
      .populate('items.inventoryItem', 'name code')
      .populate('createdBy', 'firstName lastName')
      .populate('approval.approvedBy', 'firstName lastName')
      .populate('dispatch.dispatchedBy', 'firstName lastName')
      .populate('receipt.receivedBy', 'firstName lastName');
    
    if (!transfer) {
      return res.status(404).json({ success: false, message: 'Transfer not found' });
    }
    
    res.json({ success: true, data: transfer });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Create new stock transfer
router.post("/create", [
  authorize("'Admin'", "'Manager'", "'Employee'"),
  body('transferType').isIn(['Warehouse to Warehouse', 'Production to Warehouse', 'Warehouse to Production', 'Return Transfer', 'Adjustment']).withMessage('Invalid transfer type'),
  body('fromWarehouse').isMongoId().withMessage('Valid from warehouse ID is required'),
  body('toWarehouse').isMongoId().withMessage('Valid to warehouse ID is required'),
  body('items').isArray({ min: 1 }).withMessage('At least one item is required'),
  body('items.*.inventoryItem').isMongoId().withMessage('Valid inventory item ID is required'),
  body('items.*.requestedQuantity').isNumeric().withMessage('Requested quantity must be a number'),
  body('items.*.unitPrice').isNumeric().withMessage('Unit price must be a number'),
  body('transferDetails.reason').notEmpty().withMessage('Transfer reason is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }
    
    // Validate stock availability
    await StockTransfer.validateStockAvailability(req.body.fromWarehouse, req.body.items);
    
    // Generate transfer number
    const transferNumber = await StockTransfer.generateTransferNumber();
    
    const transferData = {
      ...req.body,
      transferNumber,
      createdBy: req.user.id
    };
    
    const transfer = new StockTransfer(transferData);
    await transfer.save();
    
    res.status(201).json({
      success: true,
      message: 'Stock transfer created successfully',
      data: transfer
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Approve stock transfer
router.patch("/:id/approve", authorize("'Admin'", "'Manager'"), [
  body('approvalNotes').optional().isString().withMessage('Approval notes must be a string')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }
    
    const transfer = await StockTransfer.findById(req.params.id);
    if (!transfer) {
      return res.status(404).json({ success: false, message: 'Transfer not found' });
    }
    
    if (transfer.status !== 'Pending') {
      return res.status(400).json({ 
        success: false, 
        message: 'Only pending transfers can be approved' 
      });
    }
    
    // Validate stock availability again before approval
    await StockTransfer.validateStockAvailability(transfer.fromWarehouse, transfer.items);
    
    await transfer.approveTransfer(req.user.id, req.body.approvalNotes);
    
    res.json({
      success: true,
      message: 'Transfer approved successfully',
      data: transfer
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Dispatch stock transfer
router.patch("/:id/dispatch", authorize("'Admin'", "'Manager'", "'Employee'"), [
  body('dispatchNotes').optional().isString().withMessage('Dispatch notes must be a string')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }
    
    const transfer = await StockTransfer.findById(req.params.id);
    if (!transfer) {
      return res.status(404).json({ success: false, message: 'Transfer not found' });
    }
    
    if (transfer.status !== 'Approved') {
      return res.status(400).json({ 
        success: false, 
        message: 'Only approved transfers can be dispatched' 
      });
    }
    
    await transfer.dispatchTransfer(req.user.id, req.body.dispatchNotes);
    
    // Update stock in source warehouse
    for (const item of transfer.items) {
      await Stock.findOneAndUpdate(
        { 
          warehouse: transfer.fromWarehouse, 
          inventoryItem: item.inventoryItem 
        },
        { $inc: { quantity: -item.requestedQuantity } },
        { new: true }
      );
    }
    
    res.json({
      success: true,
      message: 'Transfer dispatched successfully',
      data: transfer
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Receive stock transfer
router.patch("/:id/receive", authorize("'Admin'", "'Manager'", "'Employee'"), [
  body('receivedItems').isArray().withMessage('Received items must be an array'),
  body('receivedItems.*.inventoryItem').isMongoId().withMessage('Valid inventory item ID is required'),
  body('receivedItems.*.actualQuantity').isNumeric().withMessage('Actual quantity must be a number'),
  body('receiptNotes').optional().isString().withMessage('Receipt notes must be a string')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }
    
    const transfer = await StockTransfer.findById(req.params.id);
    if (!transfer) {
      return res.status(404).json({ success: false, message: 'Transfer not found' });
    }
    
    if (transfer.status !== 'In Transit') {
      return res.status(400).json({ 
        success: false, 
        message: 'Only in-transit transfers can be received' 
      });
    }
    
    await transfer.receiveTransfer(req.user.id, req.body.receivedItems, req.body.receiptNotes);
    
    // Update stock in destination warehouse
    for (const receivedItem of req.body.receivedItems) {
      const existingStock = await Stock.findOne({
        warehouse: transfer.toWarehouse,
        inventoryItem: receivedItem.inventoryItem
      });
      
      if (existingStock) {
        existingStock.quantity += receivedItem.actualQuantity;
        await existingStock.save();
      } else {
        const inventory = await Inventory.findById(receivedItem.inventoryItem);
        const newStock = new Stock({
          warehouse: transfer.toWarehouse,
          inventoryItem: receivedItem.inventoryItem,
          quantity: receivedItem.actualQuantity,
          unit: inventory.unit,
          createdBy: req.user.id
        });
        await newStock.save();
      }
    }
    
    res.json({
      success: true,
      message: 'Transfer received successfully',
      data: transfer
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Complete stock transfer
router.patch("/:id/complete", authorize("'Admin'", "'Manager'"), async (req, res) => {
  try {
    const transfer = await StockTransfer.findById(req.params.id);
    if (!transfer) {
      return res.status(404).json({ success: false, message: 'Transfer not found' });
    }
    
    if (transfer.status !== 'Delivered') {
      return res.status(400).json({ 
        success: false, 
        message: 'Only delivered transfers can be completed' 
      });
    }
    
    await transfer.completeTransfer();
    
    res.json({
      success: true,
      message: 'Transfer completed successfully',
      data: transfer
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Cancel stock transfer
router.patch("/:id/cancel", authorize("'Admin'", "'Manager'"), [
  body('reason').notEmpty().withMessage('Cancellation reason is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }
    
    const transfer = await StockTransfer.findById(req.params.id);
    if (!transfer) {
      return res.status(404).json({ success: false, message: 'Transfer not found' });
    }
    
    if (!['Pending', 'Approved'].includes(transfer.status)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Only pending or approved transfers can be cancelled' 
      });
    }
    
    transfer.status = 'Cancelled';
    transfer.notes = req.body.reason;
    transfer.updatedBy = req.user.id;
    await transfer.save();
    
    res.json({
      success: true,
      message: 'Transfer cancelled successfully',
      data: transfer
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get transfer statistics
router.get("/stats/overview", authorize("'Admin'", "'Manager'"), async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    let matchQuery = {};
    if (startDate && endDate) {
      matchQuery['transferDetails.transferDate'] = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }
    
    const stats = await StockTransfer.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalValue: { $sum: '$totalValue' },
          totalQuantity: { $sum: '$totalQuantity' }
        }
      }
    ]);
    
    const totalTransfers = await StockTransfer.countDocuments(matchQuery);
    const totalValue = await StockTransfer.aggregate([
      { $match: matchQuery },
      { $group: { _id: null, total: { $sum: '$totalValue' } } }
    ]);
    
    res.json({
      success: true,
      data: {
        totalTransfers,
        totalValue: totalValue[0]?.total || 0,
        statusBreakdown: stats
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get transfer trends
router.get("/stats/trends", authorize("'Admin'", "'Manager'"), async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    if (!startDate || !endDate) {
      return res.status(400).json({ 
        success: false, 
        message: 'Start date and end date are required' 
      });
    }
    
    const trends = await StockTransfer.getTransferStats(startDate, endDate);
    
    res.json({
      success: true,
      data: trends
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;

