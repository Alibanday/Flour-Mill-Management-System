import express from 'express';
import { body, validationResult } from 'express-validator';
import asyncHandler from 'express-async-handler';
import { protect, authorize } from '../middleware/auth.js';
import {
  createCustomer,
  getAllCustomers,
  getCustomerById,
  updateCustomer,
  updateCustomerStatus,
  assignSalesRep,
  deleteCustomer,
  getCustomerStats,
  getCustomersBySalesRep,
  searchCustomersForSales,
  updateCustomerCredit,
  getCustomerDashboard
} from '../controller/customerController.js';

const router = express.Router();

// Apply authentication to all routes
router.use(protect);

// Validation middleware
const validateCustomer = [
  body('firstName').notEmpty().withMessage('First name is required'),
  body('lastName').notEmpty().withMessage('Last name is required'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('phone').notEmpty().withMessage('Phone number is required'),
  body('address.street').notEmpty().withMessage('Street address is required'),
  body('address.city').notEmpty().withMessage('City is required'),
  body('address.state').notEmpty().withMessage('State is required'),
  body('address.zipCode').notEmpty().withMessage('Zip code is required'),
  body('businessType').isIn(['Individual', 'Retailer', 'Wholesaler', 'Restaurant', 'Bakery', 'Distributor', 'Other']).withMessage('Valid business type is required'),
  body('customerType').isIn(['Regular', 'Premium', 'VIP', 'New']).withMessage('Valid customer type is required'),
  body('paymentTerms').isIn(['Cash', 'Credit', 'Net 15', 'Net 30', 'Net 60', 'COD']).withMessage('Valid payment terms are required')
];

const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
  }
  next();
};

// Create new customer (Admin, Manager, Sales)
router.post('/create', authorize('Admin', 'Manager', 'Sales'), validateCustomer, handleValidationErrors, createCustomer);

// Get all customers
router.get('/all', getAllCustomers);

// Get customer statistics
router.get('/stats/overview', getCustomerStats);

// Search customers for sales (used in sales module)
router.get('/search', searchCustomersForSales);

// Get customers by sales representative
router.get('/sales-rep/:salesRepId', getCustomersBySalesRep);

// Get customer dashboard
router.get('/dashboard/:customerId', getCustomerDashboard);

// Get customer by ID
router.get('/:id', getCustomerById);

// Update customer (Admin, Manager, Sales)
router.put('/:id', authorize('Admin', 'Manager', 'Sales'), updateCustomer);

// Update customer status (Admin, Manager)
router.patch('/:id/status', authorize('Admin', 'Manager'), updateCustomerStatus);

// Assign sales representative (Admin, Manager)
router.patch('/:id/assign-sales-rep', authorize('Admin', 'Manager'), assignSalesRep);

// Update customer credit (Admin, Manager)
router.patch('/:id/credit', authorize('Admin', 'Manager'), updateCustomerCredit);

// Delete customer (Admin only)
router.delete('/:id', authorize('Admin'), deleteCustomer);

export default router;
