import express from 'express';
import { body, validationResult } from 'express-validator';
import asyncHandler from 'express-async-handler';
import Employee from '../model/Employee.js';
import Salary from '../model/Salary.js';
import { protect, authorize } from '../middleware/auth.js';

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

// Generate unique employee ID
const generateEmployeeId = async () => {
  const count = await Employee.countDocuments();
  const year = new Date().getFullYear();
  return `EMP${year}${String(count + 1).padStart(4, '0')}`;
};

// Generate automatic payroll for new employee
const generateAutomaticPayroll = async (employee, createdBy) => {
  try {
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth() + 1;
    const currentYear = currentDate.getFullYear();

    // Check if payroll already exists for this employee for current month
    const existingSalary = await Salary.findOne({
      employee: employee._id,
      month: currentMonth,
      year: currentYear
    });

    if (existingSalary) {
      console.log(`Payroll already exists for employee ${employee.employeeId} for ${currentMonth}/${currentYear}`);
      return;
    }

    // Generate salary number
    const salaryCount = await Salary.countDocuments();
    const salaryNumber = `SAL-${String(salaryCount + 1).padStart(6, '0')}`;

    // Create automatic payroll record - simplified to match employee form
    const salary = new Salary({
      salaryNumber,
      employee: employee._id,
      month: currentMonth,
      year: currentYear,
      basicSalary: employee.salary || 0,
      allowances: 0,
      deductions: 0,
      netSalary: employee.salary || 0,
      workingDays: 30,
      totalDays: 30,
      overtimeHours: 0,
      overtimeRate: 0,
      overtimeAmount: 0,
      paymentDate: currentDate,
      paymentMethod: 'Bank Transfer',
      paymentStatus: 'Pending',
      salaryAccount: employee.warehouse || '68c49d0884b60adb796082ef',
      cashAccount: employee.warehouse || '68c49d0884b60adb796082ef',
      warehouse: employee.warehouse || '68c49d0884b60adb796082ef',
      processedBy: createdBy
    });

    await salary.save();
    console.log(`Automatic payroll generated for employee ${employee.employeeId}: ${salaryNumber}`);
  } catch (error) {
    console.error('Error generating automatic payroll:', error);
    // Don't throw error - employee creation should still succeed
  }
};

// Create new employee (FR 01)
router.post('/create', authorize('Admin', 'Manager'), validateEmployee, handleValidationErrors, asyncHandler(async (req, res) => {
  try {
    const employeeId = await generateEmployeeId();
    
    const employee = new Employee({
      ...req.body,
      employeeId,
      createdBy: req.user.id
    });

    await employee.save();

    // Generate automatic payroll for the new employee
    await generateAutomaticPayroll(employee, req.user.id);

    res.status(201).json({
      success: true,
      message: 'Employee created successfully',
      data: employee
    });
  } catch (error) {
    console.error('Error creating employee:', error);
    if (error.code === 11000) {
      res.status(400).json({
        success: false,
        message: 'Employee with this email already exists'
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Error creating employee',
        error: error.message
      });
    }
  }
}));

// Get all employees
router.get('/all', asyncHandler(async (req, res) => {
  try {
    const { page = 1, limit = 10, department, status, search } = req.query;
    
    let query = {};
    
    // Apply filters
    if (department) query.department = department;
    if (status) query.status = status;
    if (search) {
      query.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { employeeId: { $regex: search, $options: 'i' } }
      ];
    }

    const employees = await Employee.find(query)
      .populate('manager', 'firstName lastName employeeId')
      .populate('warehouse', 'name location')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Employee.countDocuments(query);

    res.json({
      success: true,
      data: employees,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalEmployees: total,
        hasNext: page * limit < total,
        hasPrev: page > 1
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching employees',
      error: error.message
    });
  }
}));

// Get employee by ID
router.get('/:id', asyncHandler(async (req, res) => {
  try {
    const employee = await Employee.findById(req.params.id)
      .populate('manager', 'firstName lastName employeeId')
      .populate('warehouse', 'name location');

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found'
      });
    }

    res.json({
      success: true,
      data: employee
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching employee',
      error: error.message
    });
  }
}));

// Update employee (FR 03)
router.put('/:id', authorize('Admin', 'Manager'), asyncHandler(async (req, res) => {
  try {
    const employee = await Employee.findById(req.params.id);

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found'
      });
    }

    // Update employee information
    Object.keys(req.body).forEach(key => {
      if (req.body[key] !== undefined) {
        employee[key] = req.body[key];
      }
    });

    employee.updatedBy = req.user.id;
    await employee.save();

    res.json({
      success: true,
      message: 'Employee updated successfully',
      data: employee
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating employee',
      error: error.message
    });
  }
}));

// Update employee role/status (FR 02, FR 04)
router.patch('/:id/status', authorize('Admin'), asyncHandler(async (req, res) => {
  try {
    const { status } = req.body;
    
    if (!['active', 'inactive', 'terminated'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Must be active, inactive, or terminated'
      });
    }

    const employee = await Employee.findByIdAndUpdate(
      req.params.id,
      { status, updatedBy: req.user.id },
      { new: true }
    );

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found'
      });
    }

    res.json({
      success: true,
      message: `Employee status updated to ${status}`,
      data: employee
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating employee status',
      error: error.message
    });
  }
}));

// Assign warehouse to employee (FR 06)
router.patch('/:id/warehouse', authorize('Admin'), asyncHandler(async (req, res) => {
  try {
    const { warehouseId } = req.body;

    const employee = await Employee.findByIdAndUpdate(
      req.params.id,
      { warehouse: warehouseId, updatedBy: req.user.id },
      { new: true }
    ).populate('warehouse', 'name location');

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found'
      });
    }

    res.json({
      success: true,
      message: 'Warehouse assigned to employee',
      data: employee
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error assigning warehouse',
      error: error.message
    });
  }
}));

// Delete employee
router.delete('/:id', authorize('Admin'), asyncHandler(async (req, res) => {
  try {
    const employee = await Employee.findById(req.params.id);

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found'
      });
    }

    // Delete associated salary records
    await Salary.deleteMany({ employee: req.params.id });
    console.log(`Deleted salary records for employee ${employee.employeeId}`);

    // Delete the employee
    await Employee.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Employee and associated payroll records deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting employee:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting employee',
      error: error.message
    });
  }
}));

// Get employee statistics
router.get('/stats/overview', asyncHandler(async (req, res) => {
  try {
    const totalEmployees = await Employee.countDocuments();
    const activeEmployees = await Employee.countDocuments({ status: 'active' });
    const inactiveEmployees = await Employee.countDocuments({ status: 'inactive' });
    const terminatedEmployees = await Employee.countDocuments({ status: 'terminated' });

    const departmentStats = await Employee.aggregate([
      {
        $group: {
          _id: '$department',
          count: { $sum: 1 },
          avgSalary: { $avg: '$salary' }
        }
      }
    ]);

    const recentHires = await Employee.find()
      .sort({ hireDate: -1 })
      .limit(5)
      .select('firstName lastName department hireDate');

    res.json({
      success: true,
      data: {
        totalEmployees,
        activeEmployees,
        inactiveEmployees,
        terminatedEmployees,
        departmentStats,
        recentHires
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching employee statistics',
      error: error.message
    });
  }
}));


export default router;
