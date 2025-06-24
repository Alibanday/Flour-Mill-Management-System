import Attendance from "../../model/attendancesystem/Attendance.js";
import User from "../../model/user.js";

// Mark attendance for an employee
export const markAttendance = async (req, res) => {
  try {
    const { employeeId, date, checkInTime, checkOutTime, status, notes } = req.body;

    // Validate required fields
    if (!employeeId || !date) {
      return res.status(400).json({ message: "Employee ID and date are required" });
    }

    // Check if employee exists
    const employee = await User.findById(employeeId);
    if (!employee) {
      return res.status(404).json({ message: "Employee not found" });
    }

    // Check if attendance already exists for this date
    const existingAttendance = await Attendance.findOne({
      employee: employeeId,
      date: new Date(date)
    });

    if (existingAttendance) {
      return res.status(400).json({ message: "Attendance already marked for this date" });
    }

    // Create attendance record
    const attendanceData = {
      employee: employeeId,
      date: new Date(date),
      checkIn: {
        time: checkInTime ? new Date(checkInTime) : new Date(),
        location: req.body.checkInLocation || "Office",
        method: "manual"
      },
      status: status || "present",
      notes: notes || "",
      markedBy: req.user._id
    };

    // Add check-out if provided
    if (checkOutTime) {
      attendanceData.checkOut = {
        time: new Date(checkOutTime),
        location: req.body.checkOutLocation || "Office",
        method: "manual"
      };
    }

    const attendance = new Attendance(attendanceData);
    await attendance.save();

    // Populate employee details for response
    await attendance.populate('employee', 'name email role');
    await attendance.populate('markedBy', 'name');

    res.status(201).json({
      success: true,
      message: "Attendance marked successfully",
      attendance
    });

  } catch (error) {
    console.error("Mark attendance error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Update attendance
export const updateAttendance = async (req, res) => {
  try {
    const { id } = req.params;
    const { checkInTime, checkOutTime, status, notes } = req.body;

    const attendance = await Attendance.findById(id);
    if (!attendance) {
      return res.status(404).json({ message: "Attendance record not found" });
    }

    // Update fields
    if (checkInTime) {
      attendance.checkIn.time = new Date(checkInTime);
    }
    if (checkOutTime) {
      attendance.checkOut.time = new Date(checkOutTime);
    }
    if (status) {
      attendance.status = status;
    }
    if (notes !== undefined) {
      attendance.notes = notes;
    }

    await attendance.save();

    // Populate employee details for response
    await attendance.populate('employee', 'name email role');
    await attendance.populate('markedBy', 'name');

    res.status(200).json({
      success: true,
      message: "Attendance updated successfully",
      attendance
    });

  } catch (error) {
    console.error("Update attendance error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Get all attendance records with pagination and filters
export const getAllAttendance = async (req, res) => {
  try {
    const { page = 1, limit = 10, employeeId, startDate, endDate, status, role } = req.query;

    const query = { isActive: true };

    // Add filters
    if (employeeId) {
      query.employee = employeeId;
    }
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }
    if (status) {
      query.status = status;
    }

    // Handle role filtering
    let populateOptions = {
      path: 'employee',
      select: 'name email role'
    };

    if (role) {
      populateOptions.match = { role: role };
    }

    const total = await Attendance.countDocuments(query);
    let attendance = await Attendance.find(query)
      .populate(populateOptions)
      .populate('markedBy', 'name')
      .sort({ date: -1, 'checkIn.time': -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    // If role filter is applied, filter out records where employee doesn't match the role
    if (role) {
      attendance = attendance.filter(record => record.employee && record.employee.role === role);
    }

    res.status(200).json({
      success: true,
      total: attendance.length,
      page: Number(page),
      totalPages: Math.ceil(attendance.length / limit),
      limit: Number(limit),
      attendance
    });

  } catch (error) {
    console.error("Get all attendance error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Get attendance by ID
export const getAttendanceById = async (req, res) => {
  try {
    const { id } = req.params;

    const attendance = await Attendance.findById(id)
      .populate('employee', 'name email role')
      .populate('markedBy', 'name');

    if (!attendance) {
      return res.status(404).json({ message: "Attendance record not found" });
    }

    res.status(200).json({
      success: true,
      attendance
    });

  } catch (error) {
    console.error("Get attendance by ID error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Delete attendance record
export const deleteAttendance = async (req, res) => {
  try {
    const { id } = req.params;

    const attendance = await Attendance.findById(id);
    if (!attendance) {
      return res.status(404).json({ message: "Attendance record not found" });
    }

    // Soft delete by setting isActive to false
    attendance.isActive = false;
    await attendance.save();

    res.status(200).json({
      success: true,
      message: "Attendance record deleted successfully"
    });

  } catch (error) {
    console.error("Delete attendance error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Get attendance summary for dashboard
export const getAttendanceSummary = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const start = startDate ? new Date(startDate) : new Date(new Date().setDate(new Date().getDate() - 30));
    const end = endDate ? new Date(endDate) : new Date();

    // Get total employees
    const totalEmployees = await User.countDocuments({ role: { $in: ["employee", "manager"] } });

    // Get attendance summary
    const summary = await Attendance.aggregate([
      {
        $match: {
          date: { $gte: start, $lte: end },
          isActive: true
        }
      },
      {
        $group: {
          _id: null,
          totalRecords: { $sum: 1 },
          presentDays: {
            $sum: { $cond: [{ $eq: ["$status", "present"] }, 1, 0] }
          },
          absentDays: {
            $sum: { $cond: [{ $eq: ["$status", "absent"] }, 1, 0] }
          },
          lateDays: {
            $sum: { $cond: [{ $eq: ["$status", "late"] }, 1, 0] }
          },
          totalWorkHours: { $sum: "$workHours" },
          totalOvertime: { $sum: "$overtime" }
        }
      }
    ]);

    // Get today's attendance
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todayAttendance = await Attendance.find({
      date: { $gte: today, $lt: tomorrow },
      isActive: true
    }).populate('employee', 'name email role');

    const summaryData = summary[0] || {
      totalRecords: 0,
      presentDays: 0,
      absentDays: 0,
      lateDays: 0,
      totalWorkHours: 0,
      totalOvertime: 0
    };

    res.status(200).json({
      success: true,
      summary: {
        ...summaryData,
        totalEmployees,
        attendanceRate: totalEmployees > 0 ? Math.round((summaryData.presentDays / (summaryData.totalRecords || 1)) * 100) : 0
      },
      todayAttendance
    });

  } catch (error) {
    console.error("Get attendance summary error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Get employee attendance summary
export const getEmployeeAttendanceSummary = async (req, res) => {
  try {
    const { employeeId } = req.params;
    const { startDate, endDate } = req.query;

    const start = startDate ? new Date(startDate) : new Date(new Date().setDate(new Date().getDate() - 30));
    const end = endDate ? new Date(endDate) : new Date();

    const summary = await Attendance.getEmployeeSummary(employeeId, start, end);

    res.status(200).json({
      success: true,
      summary
    });

  } catch (error) {
    console.error("Get employee attendance summary error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Bulk mark attendance for multiple employees
export const bulkMarkAttendance = async (req, res) => {
  try {
    const { date, attendanceData } = req.body;

    if (!date || !attendanceData || !Array.isArray(attendanceData)) {
      return res.status(400).json({ message: "Date and attendance data array are required" });
    }

    const results = [];
    const errors = [];

    for (const record of attendanceData) {
      try {
        const { employeeId, checkInTime, checkOutTime, status, notes } = record;

        // Check if attendance already exists
        const existingAttendance = await Attendance.findOne({
          employee: employeeId,
          date: new Date(date)
        });

        if (existingAttendance) {
          errors.push({ employeeId, error: "Attendance already marked for this date" });
          continue;
        }

        // Create attendance record
        const attendanceData = {
          employee: employeeId,
          date: new Date(date),
          checkIn: {
            time: checkInTime ? new Date(checkInTime) : new Date(),
            location: record.checkInLocation || "Office",
            method: "manual"
          },
          status: status || "present",
          notes: notes || "",
          markedBy: req.user._id
        };

        if (checkOutTime) {
          attendanceData.checkOut = {
            time: new Date(checkOutTime),
            location: record.checkOutLocation || "Office",
            method: "manual"
          };
        }

        const attendance = new Attendance(attendanceData);
        await attendance.save();
        await attendance.populate('employee', 'name email role');

        results.push(attendance);
      } catch (error) {
        errors.push({ employeeId: record.employeeId, error: error.message });
      }
    }

    res.status(200).json({
      success: true,
      message: `Successfully marked attendance for ${results.length} employees`,
      results,
      errors
    });

  } catch (error) {
    console.error("Bulk mark attendance error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
}; 