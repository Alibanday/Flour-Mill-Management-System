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
  body('fromWarehouse').isMongoId().withMessage('Valid from warehouse ID is required'),
  body('toWarehouse').isMongoId().withMessage('Valid to warehouse ID is required'),
  body('items').isArray({ min: 1 }).withMessage('At least one item is required'),
  body('items.*.inventoryItem').isMongoId().withMessage('Valid inventory item ID is required'),
  body('items.*.requestedQuantity').custom(value => {
    const quantity = Number(value);
    if (Number.isNaN(quantity)) {
      throw new Error('Requested quantity must be a number');
    }
    if (quantity <= 0) {
      throw new Error('Requested quantity must be greater than zero');
    }
    return true;
  })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const firstError = errors.array()[0];
      return res.status(400).json({ 
        success: false, 
        message: firstError?.msg || 'Invalid transfer data provided',
        errors: errors.array() 
      });
    }
    
    const { fromWarehouse, toWarehouse, items } = req.body;

    // Enrich items with inventory defaults
    const formattedItems = await Promise.all(items.map(async (item) => {
      const inventory = await Inventory.findById(item.inventoryItem).populate('product');
      if (!inventory) {
        throw new Error('Inventory item not found');
      }

      const requestedQuantity = Number(item.requestedQuantity ?? item.quantity ?? 0);
      if (Number.isNaN(requestedQuantity) || requestedQuantity <= 0) {
        throw new Error(`Requested quantity must be greater than zero for ${inventory.name || 'selected item'}`);
      }

      const unitPrice = Number(item.unitPrice ?? inventory.price ?? 0);
      const productName = item.productName || inventory.name || inventory.product?.name || 'Inventory Item';
      const productCode = item.productCode || inventory.code || inventory.product?.code || 'N/A';
      const unit = item.unit || inventory.unit || inventory.product?.unit || 'units';

      return {
        inventoryItem: item.inventoryItem,
        productName,
        productCode,
        requestedQuantity,
        actualQuantity: item.actualQuantity || 0,
        unit,
        unitPrice,
        totalValue: unitPrice * requestedQuantity,
        batchNumber: item.batchNumber || inventory.batchNumber,
        expiryDate: item.expiryDate || inventory.expiryDate
      };
    }));

    // Validate stock availability using enriched items
    await StockTransfer.validateStockAvailability(fromWarehouse, formattedItems);
    
    // Generate transfer number
    const transferNumber = await StockTransfer.generateTransferNumber();
    
    const transferData = {
      fromWarehouse,
      toWarehouse,
      transferNumber,
      transferType: req.body.transferType || 'Warehouse to Warehouse',
      items: formattedItems,
      transferDetails: {
        transferDate: req.body.transferDetails?.transferDate || new Date(),
        expectedDeliveryDate: req.body.transferDetails?.expectedDeliveryDate || req.body.expectedDate || null,
        reason: req.body.transferDetails?.reason || req.body.reason || 'Stock transfer',
        priority: req.body.transferDetails?.priority || 'Normal',
        transportMethod: req.body.transferDetails?.transportMethod || 'Internal',
        vehicleNumber: req.body.transferDetails?.vehicleNumber || '',
        driverName: req.body.transferDetails?.driverName || '',
        driverContact: req.body.transferDetails?.driverContact || ''
      },
      notes: req.body.notes || '',
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
    console.error('Error creating stock transfer:', error);
    const knownError = /stock|warehouse|quantity|Inventory item|transfer/i.test(error.message);
    const statusCode = knownError ? 400 : 500;
    res.status(statusCode).json({ success: false, message: error.message || 'Unable to create stock transfer' });
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

