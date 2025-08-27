const express = require('express');
const { body, validationResult } = require('express-validator');
const Inventory = require('../models/Inventory');
const Warehouse = require('../models/Warehouse');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// Apply authentication to all routes
router.use(protect);

// @route   GET /api/inventory
// @desc    Get all inventory items with filtering and pagination
// @access  Private (Admin, Manager, Employee)
router.get('/', [
  authorize('Admin', 'Manager', 'Employee')
], async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      search, 
      category, 
      status, 
      warehouse,
      lowStock,
      outOfStock
    } = req.query;

    // Build filter object
    const filter = {};
    
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { code: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } }
      ];
    }

    if (category && category !== 'all') {
      filter.category = category;
    }

    if (status && status !== 'all') {
      filter.status = status;
    }

    if (warehouse && warehouse !== 'all') {
      filter.warehouse = warehouse;
    }

    if (lowStock === 'true') {
      filter.$expr = {
        $and: [
          { $gt: ['$minimumStock', 0] },
          { $lte: ['$currentStock', '$minimumStock'] }
        ]
      };
    }

    if (outOfStock === 'true') {
      filter.currentStock = 0;
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Get inventory with pagination and populate warehouse
    const inventory = await Inventory.find(filter)
      .populate('warehouse', 'name code address.city')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Get total count for pagination
    const total = await Inventory.countDocuments(filter);

    res.json({
      success: true,
      data: inventory,
      pagination: {
        current: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });

  } catch (error) {
    console.error('Get inventory error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching inventory'
    });
  }
});

// @route   GET /api/inventory/:id
// @desc    Get single inventory item by ID
// @access  Private (Admin, Manager, Employee)
router.get('/:id', [
  authorize('Admin', 'Manager', 'Employee')
], async (req, res) => {
  try {
    const inventory = await Inventory.findById(req.params.id)
      .populate('warehouse', 'name code address.city address.state');

    if (!inventory) {
      return res.status(404).json({
        success: false,
        message: 'Inventory item not found'
      });
    }

    res.json({
      success: true,
      data: inventory
    });

  } catch (error) {
    console.error('Get inventory item error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching inventory item'
    });
  }
});

// @route   POST /api/inventory
// @desc    Create new inventory item
// @access  Private (Admin, Manager)
router.post('/', [
  authorize('Admin', 'Manager'),
  body('name').trim().isLength({ min: 2, max: 100 }).withMessage('Item name must be between 2 and 100 characters'),
  body('code').trim().isLength({ min: 2, max: 20 }).withMessage('Item code must be between 2 and 20 characters'),
  body('category').isIn(['Raw Materials', 'Finished Goods', 'Packaging', 'Tools', 'Machinery', 'Other']).withMessage('Invalid category'),
  body('unit').isIn(['kg', 'tons', 'bags', 'pieces', 'liters', 'meters', 'units']).withMessage('Invalid unit'),
  body('currentStock').isNumeric().withMessage('Current stock must be a number'),
  body('minimumStock').optional().isNumeric().withMessage('Minimum stock must be a number'),
  body('maximumStock').optional().isNumeric().withMessage('Maximum stock must be a number'),
  body('reorderPoint').optional().isNumeric().withMessage('Reorder point must be a number'),
  body('warehouse').isMongoId().withMessage('Valid warehouse ID is required'),
  body('cost.purchasePrice').optional().isNumeric().withMessage('Purchase price must be a number'),
  body('cost.sellingPrice').optional().isNumeric().withMessage('Selling price must be a number'),
  body('cost.currency').optional().isIn(['PKR', 'USD', 'EUR']).withMessage('Invalid currency'),
  body('supplier.email').optional().isEmail().withMessage('Invalid supplier email')
], async (req, res) => {
  try {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { 
      name, code, category, subCategory, description, unit, currentStock,
      minimumStock, maximumStock, reorderPoint, cost, warehouse, location,
      supplier, specifications, tags, expiryDate, notes
    } = req.body;

    // Check if inventory item already exists
    const existingItem = await Inventory.findOne({ code });
    if (existingItem) {
      return res.status(400).json({
        success: false,
        message: 'Inventory item with this code already exists'
      });
    }

    // Verify warehouse exists
    const warehouseExists = await Warehouse.findById(warehouse);
    if (!warehouseExists) {
      return res.status(400).json({
        success: false,
        message: 'Warehouse not found'
      });
    }

    // Create inventory item
    const inventory = new Inventory({
      name,
      code,
      category,
      subCategory,
      description,
      unit,
      currentStock,
      minimumStock,
      maximumStock,
      reorderPoint,
      cost,
      warehouse,
      location,
      supplier,
      specifications,
      tags,
      expiryDate,
      notes
    });

    await inventory.save();

    // Populate warehouse info for response
    await inventory.populate('warehouse', 'name code address.city');

    res.status(201).json({
      success: true,
      message: 'Inventory item created successfully',
      data: inventory
    });

  } catch (error) {
    console.error('Create inventory error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while creating inventory item'
    });
  }
});

// @route   PUT /api/inventory/:id
// @desc    Update inventory item
// @access  Private (Admin, Manager)
router.put('/:id', [
  authorize('Admin', 'Manager'),
  body('name').optional().trim().isLength({ min: 2, max: 100 }).withMessage('Item name must be between 2 and 100 characters'),
  body('code').optional().trim().isLength({ min: 2, max: 20 }).withMessage('Item code must be between 2 and 20 characters'),
  body('category').optional().isIn(['Raw Materials', 'Finished Goods', 'Packaging', 'Tools', 'Machinery', 'Other']).withMessage('Invalid category'),
  body('unit').optional().isIn(['kg', 'tons', 'bags', 'pieces', 'liters', 'meters', 'units']).withMessage('Invalid unit'),
  body('currentStock').optional().isNumeric().withMessage('Current stock must be a number'),
  body('minimumStock').optional().isNumeric().withMessage('Minimum stock must be a number'),
  body('maximumStock').optional().isNumeric().withMessage('Maximum stock must be a number'),
  body('reorderPoint').optional().isNumeric().withMessage('Reorder point must be a number'),
  body('warehouse').optional().isMongoId().withMessage('Valid warehouse ID is required'),
  body('cost.purchasePrice').optional().isNumeric().withMessage('Purchase price must be a number'),
  body('cost.sellingPrice').optional().isNumeric().withMessage('Selling price must be a number'),
  body('cost.currency').optional().isIn(['PKR', 'USD', 'EUR']).withMessage('Invalid currency'),
  body('supplier.email').optional().isEmail().withMessage('Invalid supplier email')
], async (req, res) => {
  try {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const inventory = await Inventory.findById(req.params.id);
    if (!inventory) {
      return res.status(404).json({
        success: false,
        message: 'Inventory item not found'
      });
    }

    // Check if code is being changed and if new code already exists
    if (req.body.code && req.body.code !== inventory.code) {
      const existingItem = await Inventory.findOne({ code: req.body.code });
      if (existingItem) {
        return res.status(400).json({
          success: false,
          message: 'Inventory item with this code already exists'
        });
      }
    }

    // Verify warehouse exists if being changed
    if (req.body.warehouse && req.body.warehouse !== inventory.warehouse.toString()) {
      const warehouseExists = await Warehouse.findById(req.body.warehouse);
      if (!warehouseExists) {
        return res.status(400).json({
          success: false,
          message: 'Warehouse not found'
        });
      }
    }

    // Update inventory item
    const updatedInventory = await Inventory.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('warehouse', 'name code address.city');

    res.json({
      success: true,
      message: 'Inventory item updated successfully',
      data: updatedInventory
    });

  } catch (error) {
    console.error('Update inventory error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating inventory item'
    });
  }
});

// @route   DELETE /api/inventory/:id
// @desc    Delete inventory item
// @access  Private (Admin only)
router.delete('/:id', [
  authorize('Admin')
], async (req, res) => {
  try {
    const inventory = await Inventory.findById(req.params.id);
    if (!inventory) {
      return res.status(404).json({
        success: false,
        message: 'Inventory item not found'
      });
    }

    await Inventory.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Inventory item deleted successfully'
    });

  } catch (error) {
    console.error('Delete inventory error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting inventory item'
    });
  }
});

// @route   PATCH /api/inventory/:id/stock
// @desc    Update inventory stock levels
// @access  Private (Admin, Manager)
router.patch('/:id/stock', [
  authorize('Admin', 'Manager'),
  body('currentStock').isNumeric().withMessage('Current stock must be a number'),
  body('operation').optional().isIn(['add', 'subtract', 'set']).withMessage('Invalid operation'),
  body('quantity').optional().isNumeric().withMessage('Quantity must be a number')
], async (req, res) => {
  try {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { currentStock, operation, quantity } = req.body;
    const inventory = await Inventory.findById(req.params.id);

    if (!inventory) {
      return res.status(404).json({
        success: false,
        message: 'Inventory item not found'
      });
    }

    let newStock = currentStock;

    // Handle different operations
    if (operation === 'add' && quantity) {
      newStock = inventory.currentStock + quantity;
    } else if (operation === 'subtract' && quantity) {
      newStock = Math.max(0, inventory.currentStock - quantity);
    } else if (operation === 'set') {
      newStock = currentStock;
    }

    // Update stock
    inventory.currentStock = newStock;
    await inventory.save();

    // Populate warehouse info for response
    await inventory.populate('warehouse', 'name code address.city');

    res.json({
      success: true,
      message: 'Stock updated successfully',
      data: inventory
    });

  } catch (error) {
    console.error('Update stock error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating stock'
    });
  }
});

// @route   PATCH /api/inventory/:id/status
// @desc    Update inventory status
// @access  Private (Admin, Manager)
router.patch('/:id/status', [
  authorize('Admin', 'Manager'),
  body('status').isIn(['Active', 'Inactive', 'Low Stock', 'Out of Stock', 'Discontinued']).withMessage('Invalid status')
], async (req, res) => {
  try {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { status } = req.body;
    const inventory = await Inventory.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true, runValidators: true }
    ).populate('warehouse', 'name code address.city');

    if (!inventory) {
      return res.status(404).json({
        success: false,
        message: 'Inventory item not found'
      });
    }

    res.json({
      success: true,
      message: 'Status updated successfully',
      data: inventory
    });

  } catch (error) {
    console.error('Update status error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating status'
    });
  }
});

// @route   GET /api/inventory/summary/dashboard
// @desc    Get inventory summary for dashboard
// @access  Private (Admin, Manager, Employee)
router.get('/summary/dashboard', [
  authorize('Admin', 'Manager', 'Employee')
], async (req, res) => {
  try {
    const [
      totalItems,
      lowStockItems,
      outOfStockItems,
      totalValue
    ] = await Promise.all([
      Inventory.countDocuments(),
      Inventory.countDocuments({
        $expr: {
          $and: [
            { $gt: ['$minimumStock', 0] },
            { $lte: ['$currentStock', '$minimumStock'] }
          ]
        }
      }),
      Inventory.countDocuments({ currentStock: 0 }),
      Inventory.aggregate([
        {
          $group: {
            _id: null,
            totalValue: {
              $sum: {
                $multiply: ['$currentStock', { $ifNull: ['$cost.purchasePrice', 0] }]
              }
            }
          }
        }
      ])
    ]);

    res.json({
      success: true,
      data: {
        totalItems,
        lowStockItems,
        outOfStockItems,
        totalValue: totalValue[0]?.totalValue || 0
      }
    });

  } catch (error) {
    console.error('Get dashboard summary error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching dashboard summary'
    });
  }
});

// @route   GET /api/inventory/summary/list
// @desc    Get inventory summary list for dropdowns
// @access  Private (Admin, Manager, Employee)
router.get('/summary/list', [
  authorize('Admin', 'Manager', 'Employee')
], async (req, res) => {
  try {
    const inventory = await Inventory.find({ status: 'Active' })
      .select('name code category currentStock unit warehouse')
      .populate('warehouse', 'name code')
      .sort({ name: 1 });

    res.json({
      success: true,
      data: inventory
    });

  } catch (error) {
    console.error('Get inventory summary error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching inventory summary'
    });
  }
});

// @route   GET /api/inventory/categories/list
// @desc    Get list of all categories
// @access  Private (Admin, Manager, Employee)
router.get('/categories/list', [
  authorize('Admin', 'Manager', 'Employee')
], async (req, res) => {
  try {
    const categories = await Inventory.distinct('category');
    res.json({
      success: true,
      data: categories
    });
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching categories'
    });
  }
});

module.exports = router;
