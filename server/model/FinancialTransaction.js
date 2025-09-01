import mongoose from "mongoose";

const financialTransactionSchema = new mongoose.Schema({
  transactionType: {
    type: String,
    required: true,
    enum: ['income', 'expense', 'transfer', 'adjustment']
  },
  category: {
    type: String,
    required: true,
    enum: ['sales', 'purchases', 'salaries', 'utilities', 'maintenance', 'other']
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  description: {
    type: String,
    required: true
  },
  date: {
    type: Date,
    required: true,
    default: Date.now
  },
  account: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Account',
    required: true
  },
  reference: {
    type: String,
    default: ''
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'cancelled'],
    default: 'completed'
  }
}, {
  timestamps: true
});

// Indexes for efficient querying
financialTransactionSchema.index({ transactionType: 1, date: -1 });
financialTransactionSchema.index({ category: 1, date: -1 });
financialTransactionSchema.index({ account: 1, date: -1 });

const FinancialTransaction = mongoose.model('FinancialTransaction', financialTransactionSchema);

export default FinancialTransaction;
