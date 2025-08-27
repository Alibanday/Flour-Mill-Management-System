const express = require('express');
const { body, validationResult } = require('express-validator');
const Warehouse = require('../models/Warehouse');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// Apply authentication to all routes
router.use(protect);

// @route   GET /api/warehouses
// @desc    Get all warehouses with filtering and pagination
// @access  Private (Admin, Manager)
router.get('/', authorize('Admin', 'Manager'), async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      search, 
      type, 
      status, 
      city 
    } = req.query;

    // Build filter object
    const filter = {};
    
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { code: { $regex: search, $options: 'i' } },
        { 'address.city': { $regex: search, $options: 'i' } },
        { 'address.state': { $regex: search, $options: 'i' } }
      ];
    }

    if (type && type !== 'all') {
      filter.type = type;
    }

    if (status && status !== 'all') {
      filter.status = status;
    }

    if (city && city !== 'all') {
      filter['address.city'] = city;
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Get warehouses with pagination
    const warehouses = await Warehouse.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Get total count for pagination
    const total = await Warehouse.countDocuments(filter);

    res.json({
      success: true,
      data: warehouses,
      pagination: {
        current: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });

  } catch (error) {
    console.error('Get warehouses error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching warehouses'
    });
  }
});

// @route   GET /api/warehouses/:id
// @desc    Get single warehouse by ID
// @access  Private (Admin, Manager)
router.get('/:id', authorize('Admin', 'Manager'), async (req, res) => {
  try {
    const warehouse = await Warehouse.findById(req.params.id);

    if (!warehouse) {
      return res.status(404).json({
        success: false,
        message: 'Warehouse not found'
      });
    }

    res.json({
      success: true,
      data: warehouse
    });

  } catch (error) {
    console.error('Get warehouse error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching warehouse'
    });
  }
});

// @route   POST /api/warehouses
// @desc    Create new warehouse
// @access  Private (Admin only)
router.post('/', [
  authorize('Admin'),
  body('name').trim().isLength({ min: 2, max: 100 }).withMessage('Warehouse name must be between 2 and 100 characters'),
  body('code').trim().isLength({ min: 2, max: 10 }).withMessage('Warehouse code must be between 2 and 10 characters'),
  body('address.street').trim().notEmpty().withMessage('Street address is required'),
  body('address.city').trim().notEmpty().withMessage('City is required'),
  body('address.state').trim().notEmpty().withMessage('State is required'),
  body('contact.phone').trim().notEmpty().withMessage('Phone number is required'),
  body('capacity.total').isNumeric().withMessage('Capacity must be a number'),
  body('type').optional().isIn(['Production', 'Storage', 'Distribution', 'Mixed']).withMessage('Invalid warehouse type'),
  body('status').optional().isIn(['Active', 'Inactive', 'Maintenance']).withMessage('Invalid status')
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
      name, code, address, contact, capacity, type, status, description, 
      location, operatingHours 
    } = req.body;

    // Check if warehouse already exists
    const existingWarehouse = await Warehouse.findOne({ 
      $or: [{ name }, { code }] 
    });
    
    if (existingWarehouse) {
      return res.status(400).json({
        success: false,
        message: existingWarehouse.name === name ? 'Warehouse name already exists' : 'Warehouse code already exists'
      });
    }

    // Create warehouse
    const warehouse = new Warehouse({
      name,
      code,
      address,
      contact,
      capacity,
      type: type || 'Mixed',
      status: status || 'Active',
      description,
      location,
      operatingHours
    });

    await warehouse.save();

    res.status(201).json({
      success: true,
      message: 'Warehouse created successfully',
      data: warehouse
    });

  } catch (error) {
    console.error('Create warehouse error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while creating warehouse'
    });
  }
});

// @route   PUT /api/warehouses/:id
// @desc    Update warehouse
// @access  Private (Admin only)
router.put('/:id', [
  authorize('Admin'),
  body('name').optional().trim().isLength({ min: 2, max: 100 }).withMessage('Warehouse name must be between 2 and 100 characters'),
  body('code').optional().trim().isLength({ min: 2, max: 10 }).withMessage('Warehouse code must be between 2 and 10 characters'),
  body('address.street').optional().trim().notEmpty().withMessage('Street address cannot be empty'),
  body('address.city').optional().trim().notEmpty().withMessage('City cannot be empty'),
  body('address.state').optional().trim().notEmpty().withMessage('State cannot be empty'),
  body('contact.phone').optional().trim().notEmpty().withMessage('Phone number cannot be empty'),
  body('capacity.total').optional().isNumeric().withMessage('Capacity must be a number'),
  body('type').optional().isIn(['Production', 'Storage', 'Distribution', 'Mixed']).withMessage('Invalid warehouse type'),
  body('status').optional().isIn(['Active', 'Inactive', 'Maintenance']).withMessage('Invalid status')
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

    const warehouse = await Warehouse.findById(req.params.id);
    if (!warehouse) {
      return res.status(404).json({
        success: false,
        message: 'Warehouse not found'
      });
    }

    // Check if name/code already exists (if being changed)
    if (req.body.name && req.body.name !== warehouse.name) {
      const existingWarehouse = await Warehouse.findOne({ 
        name: req.body.name, 
        _id: { $ne: req.params.id } 
      });
      if (existingWarehouse) {
        return res.status(400).json({
          success: false,
          message: 'Warehouse name already exists'
        });
      }
    }

    if (req.body.code && req.body.code !== warehouse.code) {
      const existingWarehouse = await Warehouse.findOne({ 
        code: req.body.code, 
        _id: { $ne: req.params.id } 
      });
      if (existingWarehouse) {
        return res.status(400).json({
          success: false,
          message: 'Warehouse code already exists'
        });
      }
    }

    // Update warehouse
    const updatedWarehouse = await Warehouse.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    res.json({
      success: true,
      message: 'Warehouse updated successfully',
      data: updatedWarehouse
    });

  } catch (error) {
    console.error('Update warehouse error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating warehouse'
    });
  }
});

// @route   DELETE /api/warehouses/:id
// @desc    Delete warehouse
// @access  Private (Admin only)
router.delete('/:id', authorize('Admin'), async (req, res) => {
  try {
    const warehouse = await Warehouse.findById(req.params.id);
    if (!warehouse) {
      return res.status(404).json({
        success: false,
        message: 'Warehouse not found'
      });
    }

    // Check if warehouse is assigned to any users
    const User = require('../models/User');
    const usersWithWarehouse = await User.find({ 
      assignedWarehouses: req.params.id 
    });

    if (usersWithWarehouse.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete warehouse. It is assigned to users.',
        assignedUsers: usersWithWarehouse.length
      });
    }

    await Warehouse.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Warehouse deleted successfully'
    });

  } catch (error) {
    console.error('Delete warehouse error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting warehouse'
    });
  }
});

// @route   PATCH /api/warehouses/:id/status
// @desc    Update warehouse status
// @access  Private (Admin only)
router.patch('/:id/status', authorize('Admin'), [
  body('status').isIn(['Active', 'Inactive', 'Maintenance']).withMessage('Invalid status')
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

    const warehouse = await Warehouse.findById(req.params.id);
    if (!warehouse) {
      return res.status(404).json({
        success: false,
        message: 'Warehouse not found'
      });
    }

    warehouse.status = status;
    await warehouse.save();

    res.json({
      success: true,
      message: `Warehouse status updated to ${status}`,
      data: {
        id: warehouse._id,
        status: warehouse.status
      }
    });

  } catch (error) {
    console.error('Update warehouse status error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating warehouse status'
    });
  }
});

// @route   GET /api/warehouses/summary/list
// @desc    Get warehouse summary list for dropdowns
// @access  Private (Admin, Manager)
router.get('/summary/list', authorize('Admin', 'Manager'), async (req, res) => {
  try {
    const warehouses = await Warehouse.find({ status: 'Active' })
      .select('name code type city')
      .sort({ name: 1 });

    res.json({
      success: true,
      data: warehouses
    });

  } catch (error) {
    console.error('Get warehouse summary error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching warehouse summary'
    });
  }
});

module.exports = router;
