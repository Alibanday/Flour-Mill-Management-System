import mongoose from "mongoose";

const attendanceSchema = new mongoose.Schema({
  employee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  date: {
    type: Date,
    required: true,
    default: Date.now
  },
  checkIn: {
    time: {
      type: Date,
      required: true
    },
    location: {
      type: String,
      default: "Office"
    },
    method: {
      type: String,
      enum: ["manual", "automatic"],
      default: "manual"
    }
  },
  checkOut: {
    time: {
      type: Date,
      default: null
    },
    location: {
      type: String,
      default: "Office"
    },
    method: {
      type: String,
      enum: ["manual", "automatic"],
      default: "manual"
    }
  },
  status: {
    type: String,
    enum: ["present", "absent", "late", "half-day", "leave"],
    default: "present"
  },
  workHours: {
    type: Number,
    default: 0,
    min: 0
  },
  overtime: {
    type: Number,
    default: 0,
    min: 0
  },
  notes: {
    type: String,
    trim: true,
    maxlength: 500
  },
  markedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Indexes for better performance
attendanceSchema.index({ employee: 1, date: 1 }, { unique: true });
attendanceSchema.index({ date: 1 });
attendanceSchema.index({ status: 1 });

// Virtual for formatted date
attendanceSchema.virtual('formattedDate').get(function() {
  return this.date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
});

// Virtual for formatted check-in time
attendanceSchema.virtual('formattedCheckIn').get(function() {
  if (!this.checkIn.time) return null;
  return this.checkIn.time.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });
});

// Virtual for formatted check-out time
attendanceSchema.virtual('formattedCheckOut').get(function() {
  if (!this.checkOut.time) return null;
  return this.checkOut.time.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });
});

// Virtual for total work hours
attendanceSchema.virtual('totalWorkHours').get(function() {
  if (!this.checkIn.time || !this.checkOut.time) return 0;
  const diffMs = this.checkOut.time - this.checkIn.time;
  const diffHours = diffMs / (1000 * 60 * 60);
  return Math.round(diffHours * 100) / 100;
});

// Pre-save middleware to calculate work hours
attendanceSchema.pre('save', function(next) {
  if (this.checkIn.time && this.checkOut.time) {
    const diffMs = this.checkOut.time - this.checkIn.time;
    const diffHours = diffMs / (1000 * 60 * 60);
    this.workHours = Math.round(diffHours * 100) / 100;
    
    // Calculate overtime (assuming 8 hours is normal work day)
    if (this.workHours > 8) {
      this.overtime = Math.round((this.workHours - 8) * 100) / 100;
    }
  }
  next();
});

// Static method to get attendance summary for an employee
attendanceSchema.statics.getEmployeeSummary = async function(employeeId, startDate, endDate) {
  const summary = await this.aggregate([
    {
      $match: {
        employee: new mongoose.Types.ObjectId(employeeId),
        date: { $gte: startDate, $lte: endDate },
        isActive: true
      }
    },
    {
      $group: {
        _id: null,
        totalDays: { $sum: 1 },
        presentDays: {
          $sum: {
            $cond: [{ $eq: ["$status", "present"] }, 1, 0]
          }
        },
        absentDays: {
          $sum: {
            $cond: [{ $eq: ["$status", "absent"] }, 1, 0]
          }
        },
        lateDays: {
          $sum: {
            $cond: [{ $eq: ["$status", "late"] }, 1, 0]
          }
        },
        totalWorkHours: { $sum: "$workHours" },
        totalOvertime: { $sum: "$overtime" }
      }
    }
  ]);
  
  return summary[0] || {
    totalDays: 0,
    presentDays: 0,
    absentDays: 0,
    lateDays: 0,
    totalWorkHours: 0,
    totalOvertime: 0
  };
};

// Static method to get attendance by date range
attendanceSchema.statics.getAttendanceByDateRange = async function(startDate, endDate, employeeId = null) {
  const match = {
    date: { $gte: startDate, $lte: endDate },
    isActive: true
  };
  
  if (employeeId) {
    match.employee = new mongoose.Types.ObjectId(employeeId);
  }
  
  return await this.find(match)
    .populate('employee', 'name email role')
    .populate('markedBy', 'name')
    .sort({ date: -1, 'checkIn.time': -1 });
};

const Attendance = mongoose.model("Attendance", attendanceSchema);

export default Attendance; 