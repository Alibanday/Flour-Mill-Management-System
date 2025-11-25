import mongoose from 'mongoose';

const attendanceSchema = new mongoose.Schema({
  employee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee',
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  status: {
    type: String,
    required: true,
    enum: ['present', 'absent', 'late', 'half-day', 'leave'],
    default: 'absent'
  },
  checkIn: {
    type: Date,
    default: null
  },
  checkOut: {
    type: Date,
    default: null
  },
  workingHours: {
    type: Number,
    default: 0,
    min: 0,
    max: 24
  },
  overtime: {
    type: Number,
    default: 0,
    min: 0
  },
  notes: {
    type: String,
    trim: true
  },
  markedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Index for efficient querying
attendanceSchema.index({ employee: 1, date: 1 }, { unique: true });
attendanceSchema.index({ date: -1 });
attendanceSchema.index({ status: 1 });

// Pre-save middleware to calculate working hours
attendanceSchema.pre('save', function(next) {
  if (this.checkIn && this.checkOut) {
    const diffInMs = this.checkOut - this.checkIn;
    this.workingHours = Math.round(diffInMs / (1000 * 60 * 60) * 100) / 100; // Round to 2 decimal places
    
    // Calculate overtime (assuming 8 hours is standard)
    if (this.workingHours > 8) {
      this.overtime = this.workingHours - 8;
    }
  }
  next();
});

// Virtual for attendance status display
attendanceSchema.virtual('statusDisplay').get(function() {
  const statusMap = {
    'present': 'Present',
    'absent': 'Absent',
    'late': 'Late',
    'half-day': 'Half Day',
    'leave': 'Leave'
  };
  return statusMap[this.status] || this.status;
});

// Virtual for working hours display
attendanceSchema.virtual('workingHoursDisplay').get(function() {
  if (this.workingHours === 0) return 'N/A';
  const hours = Math.floor(this.workingHours);
  const minutes = Math.round((this.workingHours - hours) * 60);
  return `${hours}h ${minutes}m`;
});

// Methods
attendanceSchema.methods.isLate = function() {
  if (!this.checkIn) return false;
  const checkInTime = new Date(this.checkIn);
  const standardTime = new Date(this.date);
  standardTime.setHours(9, 0, 0, 0); // Assuming 9 AM is standard start time
  return checkInTime > standardTime;
};

attendanceSchema.methods.getAttendanceSummary = function() {
  return {
    date: this.date,
    status: this.statusDisplay,
    checkIn: this.checkIn ? this.checkIn.toLocaleTimeString() : 'N/A',
    checkOut: this.checkOut ? this.checkOut.toLocaleTimeString() : 'N/A',
    workingHours: this.workingHoursDisplay,
    overtime: this.overtime > 0 ? `${this.overtime}h` : 'None'
  };
};

// Statics
attendanceSchema.statics.getMonthlyAttendance = function(employeeId, year, month) {
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0);
  
  return this.find({
    employee: employeeId,
    date: {
      $gte: startDate,
      $lte: endDate
    }
  }).sort({ date: 1 });
};

attendanceSchema.statics.getAttendanceStats = function(employeeId, startDate, endDate) {
  return this.aggregate([
    {
      $match: {
        employee: mongoose.Types.ObjectId(employeeId),
        date: {
          $gte: new Date(startDate),
          $lte: new Date(endDate)
        }
      }
    },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 }
      }
    }
  ]);
};

const Attendance = mongoose.model('Attendance', attendanceSchema);

export default Attendance;
