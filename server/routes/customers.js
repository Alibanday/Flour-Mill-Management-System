import express from "express";
import { body, validationResult } from "express-validator";
import CustomerNew from "../model/CustomerNew.js";
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
    const { page = 1, limit = 10, search, status, customerType, creditStatus } = req.query;
    
    let query = {};
    
    if (search) {
      query.$or = [
        { customerId: { $regex: search, $options: 'i' } },
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
        { businessName: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (status) query.status = status;
    if (customerType) query.customerType = customerType;
    if (creditStatus) query['creditInfo.creditStatus'] = creditStatus;
    
    const customers = await CustomerNew.find(query)
      .populate('createdBy', 'firstName lastName')
      .populate('updatedBy', 'firstName lastName')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);
    
    const total = await CustomerNew.countDocuments(query);
    
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

// Search customers for sales form
router.get("/search", authorize("Admin", "Manager", "Cashier"), async (req, res) => {
  try {
    const { q, limit = 10 } = req.query;
    
    if (!q || q.trim().length < 2) {
      return res.json({
        success: true,
        data: []
      });
    }
    
    const customers = await CustomerNew.find({
      $or: [
        { firstName: { $regex: q, $options: 'i' } },
        { lastName: { $regex: q, $options: 'i' } },
        { email: { $regex: q, $options: 'i' } },
        { phone: { $regex: q, $options: 'i' } },
        { businessName: { $regex: q, $options: 'i' } }
      ]
    })
    .select('firstName lastName email phone businessName businessType customerType creditLimit creditUsed status address customerNumber _id')
    .limit(parseInt(limit))
    .lean();
    
    res.json({
      success: true,
      data: customers
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get customer by ID
router.get("/:id", authorize("Admin", "Manager", "Cashier"), async (req, res) => {
  try {
    const customer = await CustomerNew.findById(req.params.id)
      .populate('createdBy', 'firstName lastName')
      .populate('updatedBy', 'firstName lastName');
    
    if (!customer) {
      return res.status(404).json({ success: false, message: 'CustomerNew not found' });
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
  body('phone').notEmpty().withMessage('Phone number is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }
    
    // Check if email already exists
    const existingCustomer = await CustomerNew.findOne({ email: req.body.email });
    if (existingCustomer) {
      return res.status(400).json({
        success: false,
        message: 'Customer with this email already exists',
        field: 'email'
      });
    }
    
    // Generate unique customerNumber to avoid database index constraint
    const uniqueCustomerNumber = 'CUST-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5);
    
    const customerData = {
      firstName: req.body.firstName,
      lastName: req.body.lastName,
      email: req.body.email,
      phone: req.body.phone,
      businessName: req.body.businessName || '',
      businessType: req.body.businessType || 'Individual',
      customerType: req.body.customerType || 'New',
      status: req.body.status || 'Active',
      createdBy: req.user ? req.user.id : null,
      customerNumber: uniqueCustomerNumber
    };
    
    const customer = new CustomerNew(customerData);
    await customer.save();
    
    res.status(201).json({
      success: true,
      message: 'CustomerNew created successfully',
      data: customer
    });
  } catch (error) {
    console.log('CustomerNew creation error:', error);
    if (error.code === 11000) {
      return res.status(400).json({ 
        success: false, 
        message: 'CustomerNew with this email or phone already exists',
        details: error.message
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
    
    const customer = await CustomerNew.findById(req.params.id);
    if (!customer) {
      return res.status(404).json({ success: false, message: 'CustomerNew not found' });
    }
    
    const updatedData = {
      ...req.body,
      updatedBy: req.user.id
    };
    
    const updatedCustomerNew = await CustomerNew.findByIdAndUpdate(
      req.params.id,
      updatedData,
      { new: true, runValidators: true }
    );
    
    res.json({
      success: true,
      message: 'CustomerNew updated successfully',
      data: updatedCustomerNew
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ 
        success: false, 
        message: 'CustomerNew with this email or CNIC already exists' 
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
    
    const customer = await CustomerNew.findByIdAndUpdate(
      req.params.id,
      { 
        status,
        updatedBy: req.user.id
      },
      { new: true }
    );
    
    if (!customer) {
      return res.status(404).json({ success: false, message: 'CustomerNew not found' });
    }
    
    res.json({
      success: true,
      message: 'CustomerNew status updated successfully',
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
    
    const customer = await CustomerNew.findById(req.params.id);
    if (!customer) {
      return res.status(404).json({ success: false, message: 'CustomerNew not found' });
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
    
    const customer = await CustomerNew.findById(req.params.id);
    if (!customer) {
      return res.status(404).json({ success: false, message: 'CustomerNew not found' });
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
    
    const customer = await CustomerNew.findById(req.params.id);
    if (!customer) {
      return res.status(404).json({ success: false, message: 'CustomerNew not found' });
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
    const totalCustomerNews = await CustomerNew.countDocuments();
    const activeCustomerNews = await CustomerNew.countDocuments({ status: 'Active' });
    const inactiveCustomerNews = await CustomerNew.countDocuments({ status: 'Inactive' });
    
    // Get customers by type
    const customersByType = await CustomerNew.aggregate([
      { $group: { _id: '$customerType', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);
    
    // Get recent customers (last 5)
    const recentCustomerNews = await CustomerNew.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .select('firstName lastName businessName customerType createdAt')
      .lean();
    
    // Get top customers by business type
    const topCustomerNews = await CustomerNew.aggregate([
      { $group: { _id: '$businessType', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 }
    ]);
    
    res.json({
      success: true,
      data: {
        totalCustomers: totalCustomerNews,
        activeCustomers: activeCustomerNews,
        inactiveCustomers: inactiveCustomerNews,
        totalRevenue: 0, // Will be calculated from sales data later
        averageOrderValue: 0, // Will be calculated from sales data later
        customersByType,
        topCustomers: topCustomerNews,
        recentCustomers: recentCustomerNews
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Delete customer (soft delete)
router.delete("/:id", authorize("Admin"), async (req, res) => {
  try {
    const customer = await CustomerNew.findByIdAndUpdate(
      req.params.id,
      { 
        status: 'Inactive',
        updatedBy: req.user.id
      },
      { new: true }
    );
    
    if (!customer) {
      return res.status(404).json({ success: false, message: 'CustomerNew not found' });
    }
    
    res.json({
      success: true,
      message: 'CustomerNew deactivated successfully'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;

