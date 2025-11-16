import mongoose from "mongoose";

const SalarySchema = new mongoose.Schema({
  salaryNumber: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  employee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee',
    required: true
  },
  month: {
    type: Number,
    required: true,
    min: 1,
    max: 12
  },
  year: {
    type: Number,
    required: true,
    min: 2020,
    max: 2030
  },
  
  // Salary details
  basicSalary: {
    type: Number,
    required: true,
    min: 0
  },
  allowances: {
    type: Number,
    default: 0,
    min: 0
  },
  deductions: {
    type: Number,
    default: 0,
    min: 0
  },
  netSalary: {
    type: Number,
    required: true,
    min: 0
  },
  
  // Payment details
  paymentDate: {
    type: Date,
    required: true
  },
  paymentMethod: {
    type: String,
    enum: ['Cash', 'Bank Transfer', 'Cheque'],
    required: true
  },
  paymentStatus: {
    type: String,
    enum: ['Pending', 'Paid', 'Failed'],
    default: 'Pending'
  },
  
  // Account details
  salaryAccount: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Account',
    required: true
  },
  cashAccount: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Account',
    required: true
  },
  
  // Additional details
  workingDays: {
    type: Number,
    required: true,
    min: 1,
    max: 31
  },
  totalDays: {
    type: Number,
    required: true,
    min: 28,
    max: 31
  },
  overtimeHours: {
    type: Number,
    default: 0,
    min: 0
  },
  overtimeRate: {
    type: Number,
    default: 0,
    min: 0
  },
  overtimeAmount: {
    type: Number,
    default: 0,
    min: 0
  },
  
  // Warehouse and user tracking
  warehouse: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Warehouse',
    required: false
  },
  processedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // Notes and attachments
  notes: {
    type: String,
    trim: true
  },
  attachments: [{
    filename: String,
    url: String,
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }]
}, { timestamps: true });

// Indexes for efficient queries
SalarySchema.index({ salaryNumber: 1 });
SalarySchema.index({ employee: 1 });
SalarySchema.index({ month: 1, year: 1 });
SalarySchema.index({ paymentStatus: 1 });
SalarySchema.index({ warehouse: 1 });

// Pre-save middleware to calculate net salary
SalarySchema.pre('save', function(next) {
  this.netSalary = this.basicSalary + this.allowances + this.overtimeAmount - this.deductions;
  next();
});

// Static method to get salary summary
SalarySchema.statics.getSalarySummary = async function(warehouseId, month, year) {
  try {
    const summary = await this.aggregate([
      {
        $match: {
          warehouse: warehouseId,
          month: month,
          year: year
        }
      },
      {
        $group: {
          _id: null,
          totalBasicSalary: { $sum: '$basicSalary' },
          totalAllowances: { $sum: '$allowances' },
          totalDeductions: { $sum: '$deductions' },
          totalNetSalary: { $sum: '$netSalary' },
          totalOvertime: { $sum: '$overtimeAmount' },
          employeeCount: { $sum: 1 }
        }
      }
    ]);
    
    return summary[0] || {
      totalBasicSalary: 0,
      totalAllowances: 0,
      totalDeductions: 0,
      totalNetSalary: 0,
      totalOvertime: 0,
      employeeCount: 0
    };
  } catch (error) {
    throw error;
  }
};

const Salary = mongoose.model("Salary", SalarySchema);

export default Salary;
