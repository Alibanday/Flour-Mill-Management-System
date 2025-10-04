import Employee from "../model/Employee.js";
import Salary from "../model/Salary.js";
import Attendance from "../model/Attendance.js";
import Warehouse from "../model/wareHouse.js";
import User from "../model/user.js";
import { sendRealtimeEvent } from "../utils/eventEmitter.js";
import NotificationService from "../services/notificationService.js";

// Create new employee
export const createEmployee = async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      email,
      phone,
      address,
      department,
      position,
      salary,
      hireDate,
      warehouse,
      cnic,
      emergencyContact,
      bankDetails,
      manager
    } = req.body;

    // Generate unique employee ID
    const employeeCount = await Employee.countDocuments();
    const year = new Date().getFullYear();
    const employeeId = `EMP${year}${String(employeeCount + 1).padStart(4, '0')}`;

    // Validate warehouse exists
    if (warehouse) {
      const warehouseExists = await Warehouse.findById(warehouse);
      if (!warehouseExists) {
        return res.status(400).json({
          success: false,
          message: "Warehouse not found"
        });
      }
    }

    // Validate manager exists if provided
    if (manager) {
      const managerExists = await Employee.findById(manager);
      if (!managerExists) {
        return res.status(400).json({
          success: false,
          message: "Manager not found"
        });
      }
    }

    const employee = new Employee({
      employeeId,
      firstName,
      lastName,
      email,
      phone,
      address,
      department,
      position,
      salary,
      hireDate: hireDate || new Date(),
      warehouse,
      cnic,
      emergencyContact,
      bankDetails,
      manager,
      createdBy: req.user._id
    });

    await employee.save();

    // Populate related fields
    await employee.populate([
      { path: 'warehouse', select: 'name location' },
      { path: 'manager', select: 'firstName lastName employeeId' },
      { path: 'createdBy', select: 'firstName lastName' }
    ]);

    // Generate automatic payroll for the new employee
    await generateAutomaticPayroll(employee, req.user._id);

    // Create notification for new employee
    await NotificationService.createNotification({
      type: 'user_activity',
      title: 'New Employee Added',
      message: `${firstName} ${lastName} has been added to the ${department} department as ${position}.`,
      priority: 'medium',
      user: req.user._id,
      relatedEntity: 'employee',
      entityId: employee._id,
      data: {
        employeeName: `${firstName} ${lastName}`,
        department,
        position,
        employeeId: employee.employeeId
      }
    });

    // Dispatch real-time event
    sendRealtimeEvent('employeeCreated', { employee: employee.toObject() });
    sendRealtimeEvent('dashboardUpdated', { message: 'New employee added' });

    res.status(201).json({
      success: true,
      message: "Employee created successfully",
      data: employee
    });
  } catch (error) {
    console.error("Create employee error:", error);
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "Employee with this email or CNIC already exists"
      });
    }
    res.status(500).json({
      success: false,
      message: "Error creating employee",
      error: error.message
    });
  }
};

// Get all employees with advanced filtering
export const getAllEmployees = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search,
      department,
      status,
      warehouse,
      position,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // Build filter object
    const filter = {};

    if (search) {
      filter.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { employeeId: { $regex: search, $options: 'i' } },
        { position: { $regex: search, $options: 'i' } }
      ];
    }

    if (department && department !== 'all') {
      filter.department = department;
    }

    if (status && status !== 'all') {
      filter.status = status;
    }

    if (warehouse && warehouse !== 'all') {
      filter.warehouse = warehouse;
    }

    if (position && position !== 'all') {
      filter.position = { $regex: position, $options: 'i' };
    }

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Get employees with pagination
    const employees = await Employee.find(filter)
      .populate('warehouse', 'name location')
      .populate('manager', 'firstName lastName employeeId')
      .populate('createdBy', 'firstName lastName')
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit));

    // Get total count for pagination
    const total = await Employee.countDocuments(filter);

    // Add virtual fields to each employee
    const employeesWithVirtuals = employees.map(emp => {
      const empObj = emp.toObject();
      empObj.fullName = `${emp.firstName} ${emp.lastName}`;
      empObj.tenure = calculateTenure(emp.hireDate);
      return empObj;
    });

    res.json({
      success: true,
      data: employeesWithVirtuals,
      pagination: {
        current: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error("Get employees error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching employees",
      error: error.message
    });
  }
};

// Get single employee by ID
export const getEmployeeById = async (req, res) => {
  try {
    const employee = await Employee.findById(req.params.id)
      .populate('warehouse', 'name location')
      .populate('manager', 'firstName lastName employeeId')
      .populate('createdBy', 'firstName lastName')
      .populate('updatedBy', 'firstName lastName');

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: "Employee not found"
      });
    }

    // Get employee's recent attendance
    const recentAttendance = await Attendance.find({ employee: employee._id })
      .sort({ date: -1 })
      .limit(10)
      .select('date checkIn checkOut status');

    // Get employee's salary history
    const salaryHistory = await Salary.find({ employee: employee._id })
      .sort({ year: -1, month: -1 })
      .limit(12)
      .select('month year basicSalary netSalary paymentStatus');

    // Add virtual fields
    const employeeObj = employee.toObject();
    employeeObj.fullName = `${employee.firstName} ${employee.lastName}`;
    employeeObj.tenure = calculateTenure(employee.hireDate);
    employeeObj.recentAttendance = recentAttendance;
    employeeObj.salaryHistory = salaryHistory;

    res.json({
      success: true,
      data: employeeObj
    });
  } catch (error) {
    console.error("Get employee error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching employee",
      error: error.message
    });
  }
};

// Update employee
export const updateEmployee = async (req, res) => {
  try {
    const employee = await Employee.findById(req.params.id);

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: "Employee not found"
      });
    }

    // Validate warehouse if provided
    if (req.body.warehouse) {
      const warehouseExists = await Warehouse.findById(req.body.warehouse);
      if (!warehouseExists) {
        return res.status(400).json({
          success: false,
          message: "Warehouse not found"
        });
      }
    }

    // Validate manager if provided
    if (req.body.manager) {
      const managerExists = await Employee.findById(req.body.manager);
      if (!managerExists) {
        return res.status(400).json({
          success: false,
          message: "Manager not found"
        });
      }
    }

    // Update employee fields
    Object.keys(req.body).forEach(key => {
      if (req.body[key] !== undefined && key !== '_id') {
        employee[key] = req.body[key];
      }
    });

    employee.updatedBy = req.user._id;
    await employee.save();

    // Populate related fields
    await employee.populate([
      { path: 'warehouse', select: 'name location' },
      { path: 'manager', select: 'firstName lastName employeeId' },
      { path: 'updatedBy', select: 'firstName lastName' }
    ]);

    // Create notification for employee update
    await NotificationService.createNotification({
      type: 'user_activity',
      title: 'Employee Updated',
      message: `${employee.firstName} ${employee.lastName}'s information has been updated.`,
      priority: 'low',
      user: req.user._id,
      relatedEntity: 'employee',
      entityId: employee._id,
      data: {
        employeeName: `${employee.firstName} ${employee.lastName}`,
        employeeId: employee.employeeId
      }
    });

    // Dispatch real-time event
    sendRealtimeEvent('employeeUpdated', { employee: employee.toObject() });

    res.json({
      success: true,
      message: "Employee updated successfully",
      data: employee
    });
  } catch (error) {
    console.error("Update employee error:", error);
    res.status(500).json({
      success: false,
      message: "Error updating employee",
      error: error.message
    });
  }
};

// Update employee status
export const updateEmployeeStatus = async (req, res) => {
  try {
    const { status } = req.body;

    if (!['active', 'inactive', 'terminated'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status. Must be active, inactive, or terminated"
      });
    }

    const employee = await Employee.findByIdAndUpdate(
      req.params.id,
      { status, updatedBy: req.user._id },
      { new: true }
    ).populate('warehouse', 'name location');

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: "Employee not found"
      });
    }

    // Create notification for status change
    await NotificationService.createNotification({
      type: 'user_activity',
      title: 'Employee Status Changed',
      message: `${employee.firstName} ${employee.lastName}'s status has been changed to ${status}.`,
      priority: status === 'terminated' ? 'high' : 'medium',
      user: req.user._id,
      relatedEntity: 'employee',
      entityId: employee._id,
      data: {
        employeeName: `${employee.firstName} ${employee.lastName}`,
        status,
        employeeId: employee.employeeId
      }
    });

    // Dispatch real-time event
    sendRealtimeEvent('employeeStatusUpdated', { employee: employee.toObject() });

    res.json({
      success: true,
      message: `Employee status updated to ${status}`,
      data: employee
    });
  } catch (error) {
    console.error("Update employee status error:", error);
    res.status(500).json({
      success: false,
      message: "Error updating employee status",
      error: error.message
    });
  }
};

// Assign warehouse to employee
export const assignWarehouse = async (req, res) => {
  try {
    const { warehouseId } = req.body;

    const warehouse = await Warehouse.findById(warehouseId);
    if (!warehouse) {
      return res.status(404).json({
        success: false,
        message: "Warehouse not found"
      });
    }

    const employee = await Employee.findByIdAndUpdate(
      req.params.id,
      { warehouse: warehouseId, updatedBy: req.user._id },
      { new: true }
    ).populate('warehouse', 'name location');

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: "Employee not found"
      });
    }

    // Create notification for warehouse assignment
    await NotificationService.createNotification({
      type: 'warehouse',
      title: 'Employee Assigned to Warehouse',
      message: `${employee.firstName} ${employee.lastName} has been assigned to ${warehouse.name}.`,
      priority: 'low',
      user: req.user._id,
      relatedEntity: 'employee',
      entityId: employee._id,
      data: {
        employeeName: `${employee.firstName} ${employee.lastName}`,
        warehouseName: warehouse.name,
        employeeId: employee.employeeId
      }
    });

    // Dispatch real-time event
    sendRealtimeEvent('employeeWarehouseAssigned', { employee: employee.toObject() });

    res.json({
      success: true,
      message: "Warehouse assigned to employee",
      data: employee
    });
  } catch (error) {
    console.error("Assign warehouse error:", error);
    res.status(500).json({
      success: false,
      message: "Error assigning warehouse",
      error: error.message
    });
  }
};

// Delete employee
export const deleteEmployee = async (req, res) => {
  try {
    const employee = await Employee.findById(req.params.id);

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: "Employee not found"
      });
    }

    // Check if employee has any active salary records
    const activeSalary = await Salary.findOne({
      employee: employee._id,
      paymentStatus: { $in: ['Pending', 'Processing'] }
    });

    if (activeSalary) {
      return res.status(400).json({
        success: false,
        message: "Cannot delete employee with active salary records. Please process pending salaries first."
      });
    }

    // Delete associated records
    await Salary.deleteMany({ employee: employee._id });
    await Attendance.deleteMany({ employee: employee._id });

    // Delete the employee
    await Employee.findByIdAndDelete(req.params.id);

    // Create notification for employee deletion
    await NotificationService.createNotification({
      type: 'user_activity',
      title: 'Employee Deleted',
      message: `${employee.firstName} ${employee.lastName} and all associated records have been deleted.`,
      priority: 'high',
      user: req.user._id,
      relatedEntity: 'employee',
      entityId: employee._id,
      data: {
        employeeName: `${employee.firstName} ${employee.lastName}`,
        employeeId: employee.employeeId
      }
    });

    // Dispatch real-time event
    sendRealtimeEvent('employeeDeleted', { employeeId: employee._id });

    res.json({
      success: true,
      message: "Employee and associated records deleted successfully"
    });
  } catch (error) {
    console.error("Delete employee error:", error);
    res.status(500).json({
      success: false,
      message: "Error deleting employee",
      error: error.message
    });
  }
};

// Get employee statistics
export const getEmployeeStats = async (req, res) => {
  try {
    const totalEmployees = await Employee.countDocuments();
    const activeEmployees = await Employee.countDocuments({ status: 'active' });
    const inactiveEmployees = await Employee.countDocuments({ status: 'inactive' });
    const terminatedEmployees = await Employee.countDocuments({ status: 'terminated' });

    // Department statistics
    const departmentStats = await Employee.aggregate([
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

    // Warehouse statistics
    const warehouseStats = await Employee.aggregate([
      {
        $match: { warehouse: { $ne: null } }
      },
      {
        $group: {
          _id: '$warehouse',
          count: { $sum: 1 }
        }
      },
      {
        $lookup: {
          from: 'warehouses',
          localField: '_id',
          foreignField: '_id',
          as: 'warehouse'
        }
      },
      {
        $unwind: '$warehouse'
      },
      {
        $project: {
          warehouseName: '$warehouse.name',
          count: 1
        }
      }
    ]);

    // Recent hires (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentHires = await Employee.find({
      hireDate: { $gte: thirtyDaysAgo }
    })
      .sort({ hireDate: -1 })
      .limit(5)
      .select('firstName lastName department position hireDate');

    // Salary statistics
    const salaryStats = await Employee.aggregate([
      {
        $group: {
          _id: null,
          avgSalary: { $avg: '$salary' },
          minSalary: { $min: '$salary' },
          maxSalary: { $max: '$salary' },
          totalSalary: { $sum: '$salary' }
        }
      }
    ]);

    res.json({
      success: true,
      data: {
        totalEmployees,
        activeEmployees,
        inactiveEmployees,
        terminatedEmployees,
        departmentStats,
        warehouseStats,
        recentHires,
        salaryStats: salaryStats[0] || {}
      }
    });
  } catch (error) {
    console.error("Get employee stats error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching employee statistics",
      error: error.message
    });
  }
};

// Get employees by department
export const getEmployeesByDepartment = async (req, res) => {
  try {
    const { department } = req.params;

    const employees = await Employee.find({ department })
      .populate('warehouse', 'name location')
      .populate('manager', 'firstName lastName employeeId')
      .sort({ firstName: 1 });

    res.json({
      success: true,
      data: employees
    });
  } catch (error) {
    console.error("Get employees by department error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching employees by department",
      error: error.message
    });
  }
};

// Get employees by warehouse
export const getEmployeesByWarehouse = async (req, res) => {
  try {
    const { warehouseId } = req.params;

    const employees = await Employee.find({ warehouse: warehouseId })
      .populate('warehouse', 'name location')
      .populate('manager', 'firstName lastName employeeId')
      .sort({ firstName: 1 });

    res.json({
      success: true,
      data: employees
    });
  } catch (error) {
    console.error("Get employees by warehouse error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching employees by warehouse",
      error: error.message
    });
  }
};

// Helper function to generate automatic payroll
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

    // Create automatic payroll record
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
      salaryAccount: employee.warehouse || null,
      cashAccount: employee.warehouse || null,
      warehouse: employee.warehouse || null,
      processedBy: createdBy
    });

    await salary.save();
    console.log(`Automatic payroll generated for employee ${employee.employeeId}: ${salaryNumber}`);
  } catch (error) {
    console.error('Error generating automatic payroll:', error);
    // Don't throw error - employee creation should still succeed
  }
};

// Helper function to calculate tenure
const calculateTenure = (hireDate) => {
  const now = new Date();
  const diffTime = Math.abs(now - hireDate);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  const years = Math.floor(diffDays / 365);
  const months = Math.floor((diffDays % 365) / 30);
  
  if (years > 0) {
    return `${years} year${years > 1 ? 's' : ''} ${months} month${months > 1 ? 's' : ''}`;
  } else if (months > 0) {
    return `${months} month${months > 1 ? 's' : ''}`;
  } else {
    return `${diffDays} day${diffDays > 1 ? 's' : ''}`;
  }
};
