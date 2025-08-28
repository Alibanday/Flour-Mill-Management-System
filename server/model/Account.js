import mongoose from "mongoose";

const AccountSchema = new mongoose.Schema({
  accountNumber: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  accountName: {
    type: String,
    required: true,
    trim: true
  },
  accountType: {
    type: String,
    enum: ['Asset', 'Liability', 'Equity', 'Revenue', 'Expense'],
    required: true
  },
  category: {
    type: String,
    enum: ['Cash', 'Bank', 'Accounts Receivable', 'Accounts Payable', 'Inventory', 'Equipment', 'Salary Expense', 'Purchase Expense', 'Sales Revenue', 'Other'],
    required: true
  },
  description: {
    type: String,
    trim: true
  },
  openingBalance: {
    type: Number,
    default: 0,
    required: true
  },
  currentBalance: {
    type: Number,
    default: 0,
    required: true
  },
  currency: {
    type: String,
    default: 'PKR',
    enum: ['PKR', 'USD', 'EUR']
  },
  status: {
    type: String,
    enum: ['Active', 'Inactive'],
    default: 'Active'
  },
  warehouse: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Warehouse',
    required: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, { timestamps: true });

// Index for efficient queries
AccountSchema.index({ accountNumber: 1 });
AccountSchema.index({ accountType: 1 });
AccountSchema.index({ category: 1 });
AccountSchema.index({ warehouse: 1 });

const Account = mongoose.model("Account", AccountSchema);

export default Account;
