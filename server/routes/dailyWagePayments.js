import express from 'express';
import { body, validationResult } from 'express-validator';
import asyncHandler from 'express-async-handler';
import DailyWagePayment from '../model/DailyWagePayment.js';
import Employee from '../model/Employee.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

// Apply authentication to all routes
router.use(protect);

// Get all daily wage payments
router.get('/', authorize('Admin', 'Manager', 'General Manager'), asyncHandler(async (req, res) => {
  const { employee, startDate, endDate, paymentStatus, warehouse } = req.query;
  
  const query = {};
  
  if (employee) {
    query.employee = employee;
  }
  
  if (startDate || endDate) {
    query.paymentDate = {};
    if (startDate) {
      query.paymentDate.$gte = new Date(startDate);
    }
    if (endDate) {
      query.paymentDate.$lte = new Date(endDate);
    }
  }
  
  if (paymentStatus) {
    query.paymentStatus = paymentStatus;
  }
  
  if (warehouse) {
    query.warehouse = warehouse;
  }
  
  const payments = await DailyWagePayment.find(query)
    .populate('employee', 'employeeId firstName lastName email phone')
    .populate('warehouse', 'name location')
    .populate('createdBy', 'firstName lastName')
    .sort({ paymentDate: -1, createdAt: -1 });
  
  res.json({
    success: true,
    data: payments,
    count: payments.length
  });
}));

// Get daily wage payment by ID
router.get('/:id', authorize('Admin', 'Manager', 'General Manager'), asyncHandler(async (req, res) => {
  const payment = await DailyWagePayment.findById(req.params.id)
    .populate('employee', 'employeeId firstName lastName email phone dailyWageRate')
    .populate('warehouse', 'name location')
    .populate('createdBy', 'firstName lastName')
    .populate('updatedBy', 'firstName lastName');
  
  if (!payment) {
    return res.status(404).json({
      success: false,
      message: 'Daily wage payment not found'
    });
  }
  
  res.json({
    success: true,
    data: payment
  });
}));

// Create new daily wage payment
router.post('/', authorize('Admin', 'Manager', 'General Manager'), [
  body('employee').notEmpty().withMessage('Employee is required'),
  body('workDate').notEmpty().withMessage('Work date is required'),
  body('amount').isNumeric().withMessage('Amount must be a number'),
  body('amount').custom((value) => {
    if (value <= 0) {
      throw new Error('Amount must be greater than zero');
    }
    return true;
  }),
  body('wageRate').isNumeric().withMessage('Wage rate must be a number'),
  body('paymentMethod').isIn(['Cash', 'Bank Transfer', 'Cheque']).withMessage('Invalid payment method')
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
  }
  
  // Check if employee exists and is a daily wage employee
  const employee = await Employee.findById(req.body.employee);
  if (!employee) {
    return res.status(404).json({
      success: false,
      message: 'Employee not found'
    });
  }
  
  if (employee.employeeType !== 'Daily Wage') {
    return res.status(400).json({
      success: false,
      message: 'Employee is not a daily wage employee'
    });
  }
  
  // Generate payment number
  const paymentCount = await DailyWagePayment.countDocuments();
  const paymentNumber = `DWP-${String(paymentCount + 1).padStart(6, '0')}`;
  
  // Check if payment already exists for this employee and work date
  const existingPayment = await DailyWagePayment.findOne({
    employee: req.body.employee,
    workDate: new Date(req.body.workDate)
  });
  
  if (existingPayment) {
    return res.status(400).json({
      success: false,
      message: 'Payment already exists for this employee on this work date'
    });
  }
  
  const payment = new DailyWagePayment({
    ...req.body,
    paymentNumber,
    paymentDate: req.body.paymentDate || new Date(),
    wageRate: req.body.wageRate || employee.dailyWageRate || req.body.amount,
    warehouse: req.body.warehouse || employee.warehouse,
    createdBy: req.user._id
  });
  
  await payment.save();
  
  const populatedPayment = await DailyWagePayment.findById(payment._id)
    .populate('employee', 'employeeId firstName lastName email phone')
    .populate('warehouse', 'name location')
    .populate('createdBy', 'firstName lastName');
  
  res.status(201).json({
    success: true,
    data: populatedPayment,
    message: 'Daily wage payment created successfully'
  });
}));

// Update daily wage payment
router.put('/:id', authorize('Admin', 'Manager', 'General Manager'), [
  body('amount').optional().isNumeric().withMessage('Amount must be a number'),
  body('paymentMethod').optional().isIn(['Cash', 'Bank Transfer', 'Cheque']).withMessage('Invalid payment method'),
  body('paymentStatus').optional().isIn(['Pending', 'Paid', 'Failed']).withMessage('Invalid payment status')
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
  }
  
  const payment = await DailyWagePayment.findById(req.params.id);
  if (!payment) {
    return res.status(404).json({
      success: false,
      message: 'Daily wage payment not found'
    });
  }
  
  Object.assign(payment, req.body);
  payment.updatedBy = req.user._id;
  await payment.save();
  
  const updatedPayment = await DailyWagePayment.findById(payment._id)
    .populate('employee', 'employeeId firstName lastName email phone')
    .populate('warehouse', 'name location')
    .populate('createdBy', 'firstName lastName')
    .populate('updatedBy', 'firstName lastName');
  
  res.json({
    success: true,
    data: updatedPayment,
    message: 'Daily wage payment updated successfully'
  });
}));

// Delete daily wage payment
router.delete('/:id', authorize('Admin', 'Manager'), asyncHandler(async (req, res) => {
  const payment = await DailyWagePayment.findById(req.params.id);
  if (!payment) {
    return res.status(404).json({
      success: false,
      message: 'Daily wage payment not found'
    });
  }
  
  await payment.deleteOne();
  
  res.json({
    success: true,
    message: 'Daily wage payment deleted successfully'
  });
}));

// Get daily wage employees
router.get('/employees/daily-wage', authorize('Admin', 'Manager', 'General Manager'), asyncHandler(async (req, res) => {
  const employees = await Employee.find({ 
    employeeType: 'Daily Wage',
    status: 'active'
  })
    .populate('warehouse', 'name location')
    .sort({ firstName: 1, lastName: 1 });
  
  res.json({
    success: true,
    data: employees,
    count: employees.length
  });
}));

export default router;

