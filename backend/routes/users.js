const express = require('express');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const { protect, authorize, isAdmin } = require('../middleware/auth');
const { upload, handleMulterError, deleteFile, getFileUrl } = require('../middleware/upload');

const router = express.Router();

// Apply authentication to all routes
router.use(protect);

// @route   GET /api/users
// @desc    Get all users with filtering and pagination
// @access  Private (Admin, Manager)
router.get('/', authorize('Admin', 'Manager'), async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      search, 
      role, 
      status, 
      warehouse 
    } = req.query;

    // Build filter object
    const filter = {};
    
    if (search) {
      filter.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
        { cnic: { $regex: search, $options: 'i' } }
      ];
    }

    if (role && role !== 'all') {
      filter.role = role;
    }

    if (status && status !== 'all') {
      filter.isActive = status === 'active';
    }

    if (warehouse && warehouse !== 'all') {
      filter.assignedWarehouses = warehouse;
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Get users with pagination
    const users = await User.find(filter)
      .populate('assignedWarehouses', 'name code')
      .select('-password')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Get total count for pagination
    const total = await User.countDocuments(filter);

    res.json({
      success: true,
      data: users,
      pagination: {
        current: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });

  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching users'
    });
  }
});

// @route   GET /api/users/:id
// @desc    Get single user by ID
// @access  Private (Admin, Manager, or self)
router.get('/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .populate('assignedWarehouses', 'name code')
      .select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if user can access this profile
    if (req.user.role !== 'Admin' && req.user.role !== 'Manager' && req.user._id.toString() !== req.params.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this user profile'
      });
    }

    res.json({
      success: true,
      data: user
    });

  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching user'
    });
  }
});

// @route   POST /api/users
// @desc    Create new user
// @access  Private (Admin only)
router.post('/', [
  isAdmin,
  upload.single('profilePicture'),
  body('firstName').trim().isLength({ min: 2, max: 50 }).withMessage('First name must be between 2 and 50 characters'),
  body('lastName').trim().isLength({ min: 2, max: 50 }).withMessage('Last name must be between 2 and 50 characters'),
  body('email').isEmail().normalizeEmail().withMessage('Please enter a valid email'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('phone').trim().notEmpty().withMessage('Phone number is required'),
  body('cnic').matches(/^\d{5}-\d{7}-\d$/).withMessage('CNIC format should be 12345-1234567-1'),
  body('role').isIn(['Admin', 'Manager', 'Employee', 'Cashier']).withMessage('Invalid role')
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
      firstName, lastName, email, password, phone, cnic, role, 
      address, city, state, zipCode, assignedWarehouses, isActive 
    } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ $or: [{ email }, { cnic }] });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: existingUser.email === email ? 'Email already registered' : 'CNIC already registered'
      });
    }

    // Parse assigned warehouses if provided
    let warehouseIds = [];
    if (assignedWarehouses) {
      try {
        warehouseIds = JSON.parse(assignedWarehouses);
      } catch (e) {
        warehouseIds = [];
      }
    }

    // Create user
    const userData = {
      firstName,
      lastName,
      email,
      password,
      phone,
      cnic,
      role,
      address,
      city,
      state,
      zipCode,
      assignedWarehouses: warehouseIds,
      isActive: isActive !== undefined ? isActive : true
    };

    // Add profile picture if uploaded
    if (req.file) {
      userData.profilePicture = getFileUrl(req.file.filename);
    }

    const user = new User(userData);
    await user.save();

    // Populate warehouse data for response
    await user.populate('assignedWarehouses', 'name code');

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      data: user.getProfile()
    });

  } catch (error) {
    console.error('Create user error:', error);
    
    // Delete uploaded file if user creation fails
    if (req.file) {
      deleteFile(req.file.filename);
    }

    res.status(500).json({
      success: false,
      message: 'Server error while creating user'
    });
  }
});

// @route   PUT /api/users/:id
// @desc    Update user
// @access  Private (Admin, or self for basic info)
router.put('/:id', [
  upload.single('profilePicture'),
  body('firstName').optional().trim().isLength({ min: 2, max: 50 }).withMessage('First name must be between 2 and 50 characters'),
  body('lastName').optional().trim().isLength({ min: 2, max: 50 }).withMessage('Last name must be between 2 and 50 characters'),
  body('email').optional().isEmail().normalizeEmail().withMessage('Please enter a valid email'),
  body('phone').optional().trim().notEmpty().withMessage('Phone number is required'),
  body('cnic').optional().matches(/^\d{5}-\d{7}-\d$/).withMessage('CNIC format should be 12345-1234567-1'),
  body('role').optional().isIn(['Admin', 'Manager', 'Employee', 'Cashier']).withMessage('Invalid role')
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

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check authorization
    if (req.user.role !== 'Admin' && req.user._id.toString() !== req.params.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this user'
      });
    }

    // Only admin can change role and status
    if (req.user.role !== 'Admin') {
      delete req.body.role;
      delete req.body.isActive;
      delete req.body.assignedWarehouses;
    }

    // Check if email/CNIC already exists (if being changed)
    if (req.body.email && req.body.email !== user.email) {
      const existingUser = await User.findOne({ email: req.body.email, _id: { $ne: req.params.id } });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'Email already registered'
        });
      }
    }

    if (req.body.cnic && req.body.cnic !== user.cnic) {
      const existingUser = await User.findOne({ cnic: req.body.cnic, _id: { $ne: req.params.id } });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'CNIC already registered'
        });
      }
    }

    // Parse assigned warehouses if provided
    if (req.body.assignedWarehouses) {
      try {
        req.body.assignedWarehouses = JSON.parse(req.body.assignedWarehouses);
      } catch (e) {
        req.body.assignedWarehouses = [];
      }
    }

    // Update user
    const updateData = { ...req.body };
    
    // Handle profile picture
    if (req.file) {
      // Delete old profile picture if exists
      if (user.profilePicture) {
        const oldFilename = user.profilePicture.split('/').pop();
        deleteFile(oldFilename);
      }
      updateData.profilePicture = getFileUrl(req.file.filename);
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).populate('assignedWarehouses', 'name code');

    res.json({
      success: true,
      message: 'User updated successfully',
      data: updatedUser.getProfile()
    });

  } catch (error) {
    console.error('Update user error:', error);
    
    // Delete uploaded file if update fails
    if (req.file) {
      deleteFile(req.file.filename);
    }

    res.status(500).json({
      success: false,
      message: 'Server error while updating user'
    });
  }
});

// @route   DELETE /api/users/:id
// @desc    Delete user
// @access  Private (Admin only)
router.delete('/:id', isAdmin, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Prevent admin from deleting themselves
    if (req.user._id.toString() === req.params.id) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete your own account'
      });
    }

    // Delete profile picture if exists
    if (user.profilePicture) {
      const filename = user.profilePicture.split('/').pop();
      deleteFile(filename);
    }

    await User.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'User deleted successfully'
    });

  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting user'
    });
  }
});

// @route   PATCH /api/users/:id/status
// @desc    Toggle user status (active/inactive)
// @access  Private (Admin, Manager)
router.patch('/:id/status', authorize('Admin', 'Manager'), async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Prevent deactivating own account
    if (req.user._id.toString() === req.params.id) {
      return res.status(400).json({
        success: false,
        message: 'Cannot deactivate your own account'
      });
    }

    user.isActive = !user.isActive;
    await user.save();

    res.json({
      success: true,
      message: `User ${user.isActive ? 'activated' : 'deactivated'} successfully`,
      data: {
        id: user._id,
        isActive: user.isActive
      }
    });

  } catch (error) {
    console.error('Toggle user status error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating user status'
    });
  }
});

// Error handling for multer
router.use(handleMulterError);

module.exports = router;
