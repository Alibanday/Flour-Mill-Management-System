import express from 'express';
import { body, validationResult } from 'express-validator';
import asyncHandler from 'express-async-handler';
import Attendance from '../model/Attendance.js';
import Employee from '../model/Employee.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// Apply authentication to all routes
router.use(protect);

// Validation middleware
const validateAttendance = [
  body('employeeId').isMongoId().withMessage('Valid employee ID is required'),
  body('date').isISO8601().withMessage('Valid date is required'),
  body('status').isIn(['present', 'absent', 'late', 'half-day', 'leave']).withMessage('Valid status is required')
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

// Mark attendance
router.post('/mark', validateAttendance, handleValidationErrors, asyncHandler(async (req, res) => {
  try {
    const { employeeId, date, status, checkIn, checkOut, notes } = req.body;

    // Check if attendance already exists for this date
    const existingAttendance = await Attendance.findOne({
      employee: employeeId,
      date: new Date(date)
    });

    if (existingAttendance) {
      return res.status(400).json({
        success: false,
        message: 'Attendance already marked for this date'
      });
    }

    const attendance = new Attendance({
      employee: employeeId,
      date: new Date(date),
      status,
      checkIn: checkIn ? new Date(`${date}T${checkIn}`) : null,
      checkOut: checkOut ? new Date(`${date}T${checkOut}`) : null,
      notes,
      markedBy: req.user.id
    });

    await attendance.save();

    // Populate employee details
    await attendance.populate('employee', 'firstName lastName employeeId department');

    res.status(201).json({
      success: true,
      message: 'Attendance marked successfully',
      data: attendance
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error marking attendance',
      error: error.message
    });
  }
}));

// Get attendance records
router.get('/records', asyncHandler(async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      employeeId, 
      startDate, 
      endDate, 
      status,
      department 
    } = req.query;

    let query = {};

    // Apply filters
    if (employeeId) query.employee = employeeId;
    if (status) query.status = status;
    if (startDate && endDate) {
      query.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    // If filtering by department, first get employees in that department
    if (department) {
      const employeesInDept = await Employee.find({ department }).select('_id');
      query.employee = { $in: employeesInDept.map(emp => emp._id) };
    }

    const attendance = await Attendance.find(query)
      .populate('employee', 'firstName lastName employeeId department')
      .populate('markedBy', 'firstName lastName')
      .sort({ date: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Attendance.countDocuments(query);

    res.json({
      success: true,
      data: attendance,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalRecords: total,
        hasNext: page * limit < total,
        hasPrev: page > 1
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching attendance records',
      error: error.message
    });
  }
}));

// Get attendance for specific employee
router.get('/employee/:employeeId', asyncHandler(async (req, res) => {
  try {
    const { employeeId } = req.params;
    const { startDate, endDate } = req.query;

    let query = { employee: employeeId };

    if (startDate && endDate) {
      query.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    const attendance = await Attendance.find(query)
      .populate('employee', 'firstName lastName employeeId department')
      .sort({ date: -1 });

    res.json({
      success: true,
      data: attendance
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching employee attendance',
      error: error.message
    });
  }
}));

// Update attendance
router.put('/:id', asyncHandler(async (req, res) => {
  try {
    const { status, checkIn, checkOut, notes } = req.body;

    const attendance = await Attendance.findById(req.params.id);

    if (!attendance) {
      return res.status(404).json({
        success: false,
        message: 'Attendance record not found'
      });
    }

    // Update fields
    if (status) attendance.status = status;
    if (checkIn) attendance.checkIn = new Date(`${attendance.date.toISOString().split('T')[0]}T${checkIn}`);
    if (checkOut) attendance.checkOut = new Date(`${attendance.date.toISOString().split('T')[0]}T${checkOut}`);
    if (notes !== undefined) attendance.notes = notes;

    attendance.updatedBy = req.user.id;
    await attendance.save();

    await attendance.populate('employee', 'firstName lastName employeeId department');

    res.json({
      success: true,
      message: 'Attendance updated successfully',
      data: attendance
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating attendance',
      error: error.message
    });
  }
}));

// Delete attendance record
router.delete('/:id', asyncHandler(async (req, res) => {
  try {
    const attendance = await Attendance.findById(req.params.id);

    if (!attendance) {
      return res.status(404).json({
        success: false,
        message: 'Attendance record not found'
      });
    }

    await Attendance.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Attendance record deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting attendance record',
      error: error.message
    });
  }
}));

// Bulk mark attendance
router.post('/bulk-mark', asyncHandler(async (req, res) => {
  try {
    const { date, attendanceRecords } = req.body;

    if (!date || !attendanceRecords || !Array.isArray(attendanceRecords)) {
      return res.status(400).json({
        success: false,
        message: 'Date and attendanceRecords array are required'
      });
    }

    const results = {
      created: [],
      updated: [],
      errors: []
    };

    for (const record of attendanceRecords) {
      try {
        const { employeeId, status, checkIn, checkOut, notes } = record;

        if (!employeeId || !status) {
          results.errors.push({
            employeeId,
            error: 'Employee ID and status are required'
          });
          continue;
        }

        // Validate status
        const validStatuses = ['present', 'absent', 'late', 'half-day', 'leave'];
        if (!validStatuses.includes(status)) {
          results.errors.push({
            employeeId,
            error: 'Invalid status'
          });
          continue;
        }

        // Check if attendance already exists
        const existingAttendance = await Attendance.findOne({
          employee: employeeId,
          date: new Date(date)
        });

        if (existingAttendance) {
          // Update existing attendance
          existingAttendance.status = status;
          if (checkIn) existingAttendance.checkIn = new Date(`${date}T${checkIn}`);
          if (checkOut) existingAttendance.checkOut = new Date(`${date}T${checkOut}`);
          if (notes !== undefined) existingAttendance.notes = notes;
          existingAttendance.updatedBy = req.user.id;

          await existingAttendance.save();
          results.updated.push(existingAttendance._id);
        } else {
          // Create new attendance
          const attendance = new Attendance({
            employee: employeeId,
            date: new Date(date),
            status,
            checkIn: checkIn ? new Date(`${date}T${checkIn}`) : null,
            checkOut: checkOut ? new Date(`${date}T${checkOut}`) : null,
            notes,
            markedBy: req.user.id
          });

          await attendance.save();
          results.created.push(attendance._id);
        }
      } catch (error) {
        results.errors.push({
          employeeId: record.employeeId,
          error: error.message
        });
      }
    }

    res.json({
      success: true,
      message: `Bulk attendance marked: ${results.created.length} created, ${results.updated.length} updated, ${results.errors.length} errors`,
      data: results
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error bulk marking attendance',
      error: error.message
    });
  }
}));

// Get attendance for a specific date (to check what's already marked)
router.get('/date/:date', asyncHandler(async (req, res) => {
  try {
    const { date } = req.params;
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const attendance = await Attendance.find({
      date: {
        $gte: startOfDay,
        $lte: endOfDay
      }
    })
      .populate('employee', 'firstName lastName employeeId department position')
      .sort({ 'employee.department': 1, 'employee.firstName': 1 });

    res.json({
      success: true,
      data: attendance
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching attendance for date',
      error: error.message
    });
  }
}));

// Get attendance statistics
router.get('/stats/overview', asyncHandler(async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    let dateFilter = {};
    if (startDate && endDate) {
      dateFilter = {
        date: {
          $gte: new Date(startDate),
          $lte: new Date(endDate)
        }
      };
    }

    const totalRecords = await Attendance.countDocuments(dateFilter);
    const presentCount = await Attendance.countDocuments({ ...dateFilter, status: 'present' });
    const absentCount = await Attendance.countDocuments({ ...dateFilter, status: 'absent' });
    const lateCount = await Attendance.countDocuments({ ...dateFilter, status: 'late' });

    const departmentStats = await Attendance.aggregate([
      { $match: dateFilter },
      {
        $lookup: {
          from: 'employees',
          localField: 'employee',
          foreignField: '_id',
          as: 'employee'
        }
      },
      { $unwind: '$employee' },
      {
        $group: {
          _id: '$employee.department',
          totalRecords: { $sum: 1 },
          present: { $sum: { $cond: [{ $eq: ['$status', 'present'] }, 1, 0] } },
          absent: { $sum: { $cond: [{ $eq: ['$status', 'absent'] }, 1, 0] } },
          late: { $sum: { $cond: [{ $eq: ['$status', 'late'] }, 1, 0] } }
        }
      }
    ]);

    res.json({
      success: true,
      data: {
        totalRecords,
        presentCount,
        absentCount,
        lateCount,
        attendanceRate: totalRecords > 0 ? (presentCount / totalRecords) * 100 : 0,
        departmentStats
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching attendance statistics',
      error: error.message
    });
  }
}));

export default router;
