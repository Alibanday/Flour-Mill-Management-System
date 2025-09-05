import express from "express";
import { body, validationResult } from "express-validator";
import Customer from "../model/Customer.js";
import { protect, authorize } from "../middleware/auth.js";

const router = express.Router();

// Apply authentication to all routes
router.use(protect);

// ========================================
// CUSTOMER MANAGEMENT ROUTES (FR 22)
// ========================================

// Get all customers
router.get("/all", authorize("Admin", "Manager", "Cashier"), async (req, res) => {
  try {
    const { page = 1, limit = 10, search, status, creditStatus } = req.query;
    
    let query = {};
    
    if (search) {
      query.$or = [
        { customerNumber: { $regex: search, $options: 'i' } },
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
        { 'businessInfo.businessName': { $regex: search, $options: 'i' } }
      ];
    }
    
    if (status) query.status = status;
    if (creditStatus) query['creditInfo.creditStatus'] = creditStatus;
    
    const customers = await Customer.find(query)
      .populate('createdBy', 'firstName lastName')
      .populate('updatedBy', 'firstName lastName')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);
    
    const total = await Customer.countDocuments(query);
    
    res.json({
      success: true,
      data: customers,
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

// Get customer by ID
router.get("/:id", authorize("Admin", "Manager", "Cashier"), async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id)
      .populate('createdBy', 'firstName lastName')
      .populate('updatedBy', 'firstName lastName');
    
    if (!customer) {
      return res.status(404).json({ success: false, message: 'Customer not found' });
    }
    
    res.json({ success: true, data: customer });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Create new customer
router.post("/create", [
  authorize("Admin", "Manager"),
  body('firstName').notEmpty().withMessage('First name is required'),
  body('lastName').notEmpty().withMessage('Last name is required'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('phone').notEmpty().withMessage('Phone number is required'),
  body('cnic').notEmpty().withMessage('CNIC is required'),
  body('address.street').notEmpty().withMessage('Street address is required'),
  body('address.city').notEmpty().withMessage('City is required'),
  body('address.state').notEmpty().withMessage('State is required'),
  body('address.zipCode').notEmpty().withMessage('Zip code is required'),
  body('creditInfo.creditLimit').isNumeric().withMessage('Credit limit must be a number')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }
    
    // Generate customer number
    const customerNumber = await Customer.generateCustomerNumber();
    
    const customerData = {
      ...req.body,
      customerNumber,
      createdBy: req.user.id
    };
    
    const customer = new Customer(customerData);
    await customer.save();
    
    res.status(201).json({
      success: true,
      message: 'Customer created successfully',
      data: customer
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ 
        success: false, 
        message: 'Customer with this email or CNIC already exists' 
      });
    }
    res.status(500).json({ success: false, message: error.message });
  }
});

// Update customer
router.put("/:id", [
  authorize("Admin", "Manager"),
  body('firstName').optional().notEmpty().withMessage('First name cannot be empty'),
  body('lastName').optional().notEmpty().withMessage('Last name cannot be empty'),
  body('email').optional().isEmail().withMessage('Valid email is required'),
  body('phone').optional().notEmpty().withMessage('Phone number cannot be empty'),
  body('creditInfo.creditLimit').optional().isNumeric().withMessage('Credit limit must be a number')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }
    
    const customer = await Customer.findById(req.params.id);
    if (!customer) {
      return res.status(404).json({ success: false, message: 'Customer not found' });
    }
    
    const updatedData = {
      ...req.body,
      updatedBy: req.user.id
    };
    
    const updatedCustomer = await Customer.findByIdAndUpdate(
      req.params.id,
      updatedData,
      { new: true, runValidators: true }
    );
    
    res.json({
      success: true,
      message: 'Customer updated successfully',
      data: updatedCustomer
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ 
        success: false, 
        message: 'Customer with this email or CNIC already exists' 
      });
    }
    res.status(500).json({ success: false, message: error.message });
  }
});

// Update customer status
router.patch("/:id/status", authorize("Admin", "Manager"), async (req, res) => {
  try {
    const { status } = req.body;
    
    if (!['Active', 'Inactive', 'Suspended'].includes(status)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid status. Must be Active, Inactive, or Suspended' 
      });
    }
    
    const customer = await Customer.findByIdAndUpdate(
      req.params.id,
      { 
        status,
        updatedBy: req.user.id
      },
      { new: true }
    );
    
    if (!customer) {
      return res.status(404).json({ success: false, message: 'Customer not found' });
    }
    
    res.json({
      success: true,
      message: 'Customer status updated successfully',
      data: customer
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Update credit limit
router.patch("/:id/credit-limit", authorize("Admin", "Manager"), [
  body('creditLimit').isNumeric().withMessage('Credit limit must be a number'),
  body('creditStatus').optional().isIn(['Active', 'Suspended', 'Blocked']).withMessage('Invalid credit status')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }
    
    const { creditLimit, creditStatus } = req.body;
    
    const customer = await Customer.findById(req.params.id);
    if (!customer) {
      return res.status(404).json({ success: false, message: 'Customer not found' });
    }
    
    customer.creditInfo.creditLimit = creditLimit;
    if (creditStatus) {
      customer.creditInfo.creditStatus = creditStatus;
    }
    customer.updatedBy = req.user.id;
    
    await customer.save();
    
    res.json({
      success: true,
      message: 'Credit limit updated successfully',
      data: customer
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Update credit balance
router.patch("/:id/credit-balance", authorize("Admin", "Manager", "Cashier"), [
  body('amount').isNumeric().withMessage('Amount must be a number'),
  body('type').isIn(['debit', 'credit']).withMessage('Type must be debit or credit')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }
    
    const { amount, type } = req.body;
    
    const customer = await Customer.findById(req.params.id);
    if (!customer) {
      return res.status(404).json({ success: false, message: 'Customer not found' });
    }
    
    await customer.updateCreditBalance(amount, type);
    
    res.json({
      success: true,
      message: 'Credit balance updated successfully',
      data: customer
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Check credit availability
router.post("/:id/check-credit", authorize("Admin", "Manager", "Cashier"), [
  body('amount').isNumeric().withMessage('Amount must be a number')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }
    
    const { amount } = req.body;
    
    const customer = await Customer.findById(req.params.id);
    if (!customer) {
      return res.status(404).json({ success: false, message: 'Customer not found' });
    }
    
    const canPurchase = customer.canMakePurchase(amount);
    
    res.json({
      success: true,
      data: {
        canPurchase,
        availableCredit: customer.creditInfo.availableCredit,
        creditLimit: customer.creditInfo.creditLimit,
        currentBalance: customer.creditInfo.currentBalance,
        creditStatus: customer.creditInfo.creditStatus
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get customer statistics
router.get("/stats/overview", authorize("Admin", "Manager"), async (req, res) => {
  try {
    const totalCustomers = await Customer.countDocuments();
    const activeCustomers = await Customer.countDocuments({ status: 'Active' });
    const customersWithCredit = await Customer.countDocuments({ 
      'creditInfo.creditLimit': { $gt: 0 } 
    });
    const customersOverCreditLimit = await Customer.countDocuments({
      $expr: { $gt: ['$creditInfo.currentBalance', '$creditInfo.creditLimit'] }
    });
    
    const totalCreditLimit = await Customer.aggregate([
      { $group: { _id: null, total: { $sum: '$creditInfo.creditLimit' } } }
    ]);
    
    const totalOutstanding = await Customer.aggregate([
      { $group: { _id: null, total: { $sum: '$creditInfo.currentBalance' } } }
    ]);
    
    res.json({
      success: true,
      data: {
        totalCustomers,
        activeCustomers,
        customersWithCredit,
        customersOverCreditLimit,
        totalCreditLimit: totalCreditLimit[0]?.total || 0,
        totalOutstanding: totalOutstanding[0]?.total || 0
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Delete customer (soft delete)
router.delete("/:id", authorize("Admin"), async (req, res) => {
  try {
    const customer = await Customer.findByIdAndUpdate(
      req.params.id,
      { 
        status: 'Inactive',
        updatedBy: req.user.id
      },
      { new: true }
    );
    
    if (!customer) {
      return res.status(404).json({ success: false, message: 'Customer not found' });
    }
    
    res.json({
      success: true,
      message: 'Customer deactivated successfully'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;

