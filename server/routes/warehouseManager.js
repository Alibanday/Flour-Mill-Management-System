import express from 'express';
import mongoose from 'mongoose';
import { protect } from '../middleware/authMiddleware.js';
import Warehouse from '../model/wareHouse.js';
import Inventory from '../model/inventory.js';
import Stock from '../model/stock.js';
import DamageReport from '../model/DamageReport.js';

const router = express.Router();

// Middleware to check if user is a warehouse manager
const isWarehouseManager = (req, res, next) => {
  if (req.user.role !== 'Warehouse Manager') {
    return res.status(403).json({ message: 'Access denied. Warehouse Manager role required.' });
  }
  next();
};

// Get warehouse manager's assigned warehouse
router.get('/warehouse', protect, isWarehouseManager, async (req, res) => {
  try {
    // First try: Get warehouse from manager field (warehouse.manager = user._id)
    let warehouse = await Warehouse.findOne({ manager: req.user._id })
      .populate('manager', 'firstName lastName email');

    // Fallback: If no warehouse found via manager field, try user's assignedWarehouse field
    if (!warehouse && req.user.assignedWarehouse) {
      warehouse = await Warehouse.findById(req.user.assignedWarehouse)
        .populate('manager', 'firstName lastName email');
    }

    if (!warehouse) {
      return res.status(404).json({ message: 'No warehouse assigned to this manager' });
    }

    res.json(warehouse);
  } catch (error) {
    console.error('Error fetching warehouse:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get stock items for warehouse manager's assigned warehouse
router.get('/stock', protect, isWarehouseManager, async (req, res) => {
  try {
    console.log('🔍 Fetching stock for warehouse manager:', req.user._id);
    console.log('📦 User warehouse field:', req.user.warehouse);

    // First try: Get warehouse from manager field (warehouse.manager = user._id)
    let warehouse = await Warehouse.findOne({ manager: req.user._id });
    console.log('🏭 Warehouse found via manager field:', warehouse ? warehouse._id : 'None');

    // Fallback: If no warehouse found via manager field, try user's assignedWarehouse field
    if (!warehouse && req.user.assignedWarehouse) {
      console.log('🔄 Trying fallback: user.assignedWarehouse field');
      warehouse = await Warehouse.findById(req.user.assignedWarehouse);
      console.log('🏭 Warehouse found via user.assignedWarehouse field:', warehouse ? warehouse._id : 'None');
    }

    if (!warehouse) {
      console.error('❌ No warehouse found for manager:', req.user._id);
      return res.status(404).json({ message: 'No warehouse assigned to this manager' });
    }

    console.log('✅ Using warehouse:', warehouse._id, warehouse.name);
    console.log('🔍 Warehouse ID type:', typeof warehouse._id, warehouse._id.toString());

    // Get inventory items for this warehouse
    // MongoDB should handle ObjectId comparison automatically, but we'll ensure it's correct
    const warehouseId = warehouse._id;

    console.log('🔍 Searching for inventory with warehouse ID:', warehouseId);

    // First, try direct query (most common case)
    let stockItems = await Inventory.find({ warehouse: warehouseId })
      .select('name code category currentStock minimumStock unit status location cost warehouse')
      .sort({ name: 1 });

    console.log(`📊 Direct query found ${stockItems.length} items`);

    // If no items found, try with ObjectId conversion (in case of type mismatch)
    if (stockItems.length === 0 && mongoose.Types.ObjectId.isValid(warehouseId)) {
      console.log('🔄 Trying with ObjectId conversion...');
      const warehouseObjectId = new mongoose.Types.ObjectId(warehouseId);
      stockItems = await Inventory.find({ warehouse: warehouseObjectId })
        .select('name code category currentStock minimumStock unit status location cost warehouse')
        .sort({ name: 1 });
      console.log(`📊 ObjectId query found ${stockItems.length} items`);
    }

    // If still no items, try string comparison (in case warehouse is stored as string)
    if (stockItems.length === 0) {
      console.log('🔄 Trying with string comparison...');
      stockItems = await Inventory.find({ warehouse: warehouseId.toString() })
        .select('name code category currentStock minimumStock unit status location cost warehouse')
        .sort({ name: 1 });
      console.log(`📊 String query found ${stockItems.length} items`);
    }

    console.log(`✅ Found ${stockItems.length} stock items for warehouse ${warehouse._id}`);

    // Debug: Log first few items to see their warehouse field
    if (stockItems.length > 0) {
      console.log('📦 Sample stock items:');
      stockItems.slice(0, 3).forEach((item, idx) => {
        console.log(`  ${idx + 1}. ${item.name} - warehouse: ${item.warehouse} (type: ${typeof item.warehouse})`);
      });
    } else {
      // If no items found, check if there are any inventory items at all
      const totalInventory = await Inventory.countDocuments({});
      const inventoryWithWarehouse = await Inventory.countDocuments({ warehouse: { $exists: true, $ne: null } });
      console.log(`⚠️ No stock items found. Total inventory: ${totalInventory}, With warehouse: ${inventoryWithWarehouse}`);

      // Try to find any inventory items and log their warehouse IDs
      const sampleItems = await Inventory.find({ warehouse: { $exists: true, $ne: null } })
        .select('name warehouse')
        .limit(5);
      console.log('📋 Sample inventory items with warehouses:');
      sampleItems.forEach(item => {
        const itemWarehouseId = item.warehouse?.toString() || item.warehouse;
        const targetWarehouseId = warehouseId.toString();
        const match = itemWarehouseId === targetWarehouseId;
        console.log(`  - ${item.name}: warehouse = ${itemWarehouseId} (type: ${typeof item.warehouse}) ${match ? '✅ MATCH' : '❌ NO MATCH'}`);
      });

      // Also check if there are inventory items with this exact warehouse ID but stored differently
      const allInventory = await Inventory.find({})
        .select('name warehouse')
        .limit(20);
      console.log('🔍 Checking all inventory items for warehouse match:');
      allInventory.forEach(item => {
        if (item.warehouse) {
          const itemWarehouseId = item.warehouse.toString();
          const targetWarehouseId = warehouseId.toString();
          if (itemWarehouseId === targetWarehouseId) {
            console.log(`  ✅ MATCH FOUND: ${item.name} has warehouse ${itemWarehouseId}`);
          }
        }
      });
    }

    res.json(stockItems);
  } catch (error) {
    console.error('❌ Error fetching stock items:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get damage reports for warehouse manager's assigned warehouse
router.get('/damage-reports', protect, isWarehouseManager, async (req, res) => {
  try {
    // First try: Get warehouse from manager field (warehouse.manager = user._id)
    let warehouse = await Warehouse.findOne({ manager: req.user._id });

    // Fallback: If no warehouse found via manager field, try user's warehouse field
    if (!warehouse && req.user.warehouse) {
      warehouse = await Warehouse.findById(req.user.warehouse);
    }

    if (!warehouse) {
      return res.status(404).json({ message: 'No warehouse assigned to this manager' });
    }

    const damageReports = await DamageReport.find({ warehouse: warehouse._id })
      .populate('inventoryItem', 'name code category currentStock')
      .populate('reportedBy', 'firstName lastName email')
      .populate('reviewedBy', 'firstName lastName email')
      .sort({ createdAt: -1 });

    res.json(damageReports);
  } catch (error) {
    console.error('Error fetching damage reports:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create damage report
router.post('/damage-reports', protect, isWarehouseManager, async (req, res) => {
  try {
    const {
      inventoryItem,
      quantityDamaged,
      reason,
      severity,
      description,
      estimatedLoss,
      damageDate,
      evidencePhotos
    } = req.body;

    // First try: Get warehouse from manager field (warehouse.manager = user._id)
    let warehouse = await Warehouse.findOne({ manager: req.user._id });

    // Fallback: If no warehouse found via manager field, try user's assignedWarehouse field
    if (!warehouse && req.user.assignedWarehouse) {
      warehouse = await Warehouse.findById(req.user.assignedWarehouse);
    }

    if (!warehouse) {
      return res.status(404).json({ message: 'No warehouse assigned to this manager' });
    }

    // Validate inventory item belongs to this warehouse
    const inventory = await Inventory.findOne({
      _id: inventoryItem,
      warehouse: warehouse._id
    });

    if (!inventory) {
      return res.status(400).json({ message: 'Inventory item not found in your warehouse' });
    }

    // Validate quantity doesn't exceed current stock
    if (quantityDamaged > inventory.currentStock) {
      return res.status(400).json({
        message: `Quantity damaged (${quantityDamaged}) cannot exceed current stock (${inventory.currentStock})`
      });
    }

    const damageReport = new DamageReport({
      inventoryItem,
      warehouse: warehouse._id,
      quantityDamaged,
      reason,
      severity: severity || 'Medium',
      description,
      estimatedLoss: estimatedLoss || 0,
      damageDate: damageDate || new Date(),
      evidencePhotos: evidencePhotos || [],
      reportedBy: req.user._id,
      status: 'Reported'
    });

    await damageReport.save();

    // Populate the response
    await damageReport.populate([
      { path: 'inventoryItem', select: 'name code category' },
      { path: 'reportedBy', select: 'firstName lastName email' }
    ]);

    res.status(201).json(damageReport);
  } catch (error) {
    console.error('Error creating damage report:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update damage report (only if status allows editing)
router.put('/damage-reports/:id', protect, isWarehouseManager, async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // First try: Get warehouse from manager field (warehouse.manager = user._id)
    let warehouse = await Warehouse.findOne({ manager: req.user._id });

    // Fallback: If no warehouse found via manager field, try user's assignedWarehouse field
    if (!warehouse && req.user.assignedWarehouse) {
      warehouse = await Warehouse.findById(req.user.assignedWarehouse);
    }

    if (!warehouse) {
      return res.status(404).json({ message: 'No warehouse assigned to this manager' });
    }

    const damageReport = await DamageReport.findOne({
      _id: id,
      warehouse: warehouse._id,
      reportedBy: req.user._id
    });

    if (!damageReport) {
      return res.status(404).json({ message: 'Damage report not found' });
    }

    // Check if report can be edited
    if (!damageReport.canBeEdited()) {
      return res.status(400).json({ message: 'This damage report cannot be edited in its current status' });
    }

    // Update the report
    Object.assign(damageReport, updateData);
    await damageReport.save();

    // Populate the response
    await damageReport.populate([
      { path: 'inventoryItem', select: 'name code category' },
      { path: 'reportedBy', select: 'firstName lastName email' }
    ]);

    res.json(damageReport);
  } catch (error) {
    console.error('Error updating damage report:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get stock movement history for warehouse manager's assigned warehouse
router.get('/stock-history', protect, isWarehouseManager, async (req, res) => {
  try {
    // First try: Get warehouse from manager field (warehouse.manager = user._id)
    let warehouse = await Warehouse.findOne({ manager: req.user._id });

    // Fallback: If no warehouse found via manager field, try user's assignedWarehouse field
    if (!warehouse && req.user.assignedWarehouse) {
      warehouse = await Warehouse.findById(req.user.assignedWarehouse);
    }

    if (!warehouse) {
      return res.status(404).json({ message: 'No warehouse assigned to this manager' });
    }

    const { page = 1, limit = 50, movementType, startDate, endDate } = req.query;

    const query = { warehouse: warehouse._id };

    if (movementType) {
      query.movementType = movementType;
    }

    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    const stockHistory = await Stock.find(query)
      .populate('inventoryItem', 'name code category')
      .populate('createdBy', 'firstName lastName email')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Stock.countDocuments(query);

    res.json({
      stockHistory,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    console.error('Error fetching stock history:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get warehouse statistics
router.get('/statistics', protect, isWarehouseManager, async (req, res) => {
  try {
    // First try: Get warehouse from manager field (warehouse.manager = user._id)
    let warehouse = await Warehouse.findOne({ manager: req.user._id });

    // Fallback: If no warehouse found via manager field, try user's assignedWarehouse field
    if (!warehouse && req.user.assignedWarehouse) {
      warehouse = await Warehouse.findById(req.user.assignedWarehouse);
    }

    if (!warehouse) {
      return res.status(404).json({ message: 'No warehouse assigned to this manager' });
    }

    // Get inventory statistics
    const totalItems = await Inventory.countDocuments({ warehouse: warehouse._id });
    const lowStockItems = await Inventory.countDocuments({
      warehouse: warehouse._id,
      $expr: {
        $and: [
          { $gt: ["$minimumStock", 0] },
          { $lte: ["$currentStock", "$minimumStock"] }
        ]
      }
    });
    const outOfStockItems = await Inventory.countDocuments({
      warehouse: warehouse._id,
      currentStock: 0
    });

    // Get damage report statistics
    const totalDamageReports = await DamageReport.countDocuments({ warehouse: warehouse._id });
    const pendingDamageReports = await DamageReport.countDocuments({
      warehouse: warehouse._id,
      status: { $in: ['Reported', 'Under Review'] }
    });

    // Get recent stock movements (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentStockMovements = await Stock.countDocuments({
      warehouse: warehouse._id,
      createdAt: { $gte: thirtyDaysAgo }
    });

    res.json({
      warehouse: {
        name: warehouse.name,
        warehouseNumber: warehouse.warehouseNumber,
        capacity: warehouse.capacity
      },
      inventory: {
        totalItems,
        lowStockItems,
        outOfStockItems,
        activeItems: totalItems - outOfStockItems
      },
      damageReports: {
        total: totalDamageReports,
        pending: pendingDamageReports,
        resolved: totalDamageReports - pendingDamageReports
      },
      activity: {
        recentStockMovements
      }
    });
  } catch (error) {
    console.error('Error fetching statistics:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
