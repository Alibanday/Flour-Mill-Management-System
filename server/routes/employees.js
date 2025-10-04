import express from 'express';
import { body, validationResult } from 'express-validator';
import asyncHandler from 'express-async-handler';
import Employee from '../model/Employee.js';
import Salary from '../model/Salary.js';
import { protect, authorize } from '../middleware/auth.js';
import {
  createEmployee,
  getAllEmployees,
  getEmployeeById,
  updateEmployee,
  updateEmployeeStatus,
  assignWarehouse,
  deleteEmployee,
  getEmployeeStats,
  getEmployeesByDepartment,
  getEmployeesByWarehouse
} from '../controller/employeeController.js';

const router = express.Router();

// Apply authentication to all routes
router.use(protect);

// Validation middleware
const validateEmployee = [
  body('firstName').notEmpty().withMessage('First name is required'),
  body('lastName').notEmpty().withMessage('Last name is required'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('phone').notEmpty().withMessage('Phone number is required'),
  body('department').isIn(['Production', 'Warehouse', 'Sales', 'Finance', 'HR', 'IT', 'Maintenance']).withMessage('Valid department is required'),
  body('position').notEmpty().withMessage('Position is required'),
  body('salary').isNumeric().withMessage('Salary must be a number'),
  body('hireDate').isISO8601().withMessage('Valid hire date is required'),
  body('warehouse').notEmpty().withMessage('Warehouse is required')
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


// Create new employee (FR 01)
router.post('/create', authorize('Admin', 'Manager'), validateEmployee, handleValidationErrors, createEmployee);

// Get all employees
router.get('/all', getAllEmployees);

// Get employee statistics
router.get('/stats/overview', getEmployeeStats);

// Get employees by department
router.get('/department/:department', getEmployeesByDepartment);

// Get employees by warehouse
router.get('/warehouse/:warehouseId', getEmployeesByWarehouse);

// Get employee reports
router.get('/reports', asyncHandler(async (req, res) => {
  try {
    const { reportType, startDate, endDate, department, warehouse, status } = req.query;
    
    let filter = {};
    
    // Apply date filter if provided
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) filter.createdAt.$lte = new Date(endDate);
    }
    
    // Apply other filters
    if (department) filter.department = department;
    if (warehouse) filter.warehouse = warehouse;
    if (status) filter.status = status;
    
    let reportData = [];
    
    switch (reportType) {
      case 'department':
        reportData = await Employee.aggregate([
          { $match: filter },
          {
            $group: {
              _id: '$department',
              count: { $sum: 1 },
              avgSalary: { $avg: '$salary' },
              totalSalary: { $sum: '$salary' }
            }
          },
          { $sort: { count: -1 } }
        ]);
        break;
        
      case 'salary':
        reportData = await Employee.find(filter)
          .populate('warehouse', 'name location')
          .select('firstName lastName department salary warehouse')
          .sort({ salary: -1 });
        break;
        
      case 'attendance':
        // This would integrate with attendance data
        reportData = await Employee.find(filter)
          .populate('warehouse', 'name location')
          .select('firstName lastName department warehouse');
        break;
        
      case 'performance':
        // This would integrate with performance data
        reportData = await Employee.find(filter)
          .populate('warehouse', 'name location')
          .select('firstName lastName department performance warehouse');
        break;
        
      default:
        return res.status(400).json({
          success: false,
          message: 'Invalid report type'
        });
    }
    
    res.json({
      success: true,
      data: reportData
    });
  } catch (error) {
    console.error('Get employee reports error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching employee reports',
      error: error.message
    });
  }
}));

// Get employee by ID
router.get('/:id', getEmployeeById);

// Update employee (FR 03)
router.put('/:id', authorize('Admin', 'Manager'), updateEmployee);

// Update employee role/status (FR 02, FR 04)
router.patch('/:id/status', authorize('Admin'), updateEmployeeStatus);

// Assign warehouse to employee (FR 06)
router.patch('/:id/warehouse', authorize('Admin'), assignWarehouse);

// Delete employee
router.delete('/:id', authorize('Admin'), deleteEmployee);

export default router;
