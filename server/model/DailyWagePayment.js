import mongoose from "mongoose";

const dailyWagePaymentSchema = new mongoose.Schema({
  paymentNumber: {
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
  paymentDate: {
    type: Date,
    required: true,
    default: Date.now
  },
  workDate: {
    type: Date,
    required: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  hoursWorked: {
    type: Number,
    default: 8,
    min: 0,
    max: 24
  },
  wageRate: {
    type: Number,
    required: true,
    min: 0
  },
  paymentMethod: {
    type: String,
    enum: ['Cash', 'Bank Transfer', 'Cheque'],
    default: 'Cash',
    required: true
  },
  paymentStatus: {
    type: String,
    enum: ['Pending', 'Paid', 'Failed'],
    default: 'Paid'
  },
  description: {
    type: String,
    trim: true
  },
  warehouse: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Warehouse',
    required: false
  },
  createdBy: {
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

// Indexes for efficient querying
dailyWagePaymentSchema.index({ employee: 1, workDate: 1 });
dailyWagePaymentSchema.index({ paymentDate: 1 });
dailyWagePaymentSchema.index({ paymentStatus: 1 });
dailyWagePaymentSchema.index({ warehouse: 1 });

// Check if model already exists to prevent overwrite errors
const DailyWagePayment = mongoose.models.DailyWagePayment || mongoose.model('DailyWagePayment', dailyWagePaymentSchema);

export default DailyWagePayment;

