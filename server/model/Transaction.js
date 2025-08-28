import mongoose from "mongoose";

const TransactionSchema = new mongoose.Schema({
  transactionNumber: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  transactionDate: {
    type: Date,
    required: true,
    default: Date.now
  },
  transactionType: {
    type: String,
    enum: ['Payment', 'Receipt', 'Purchase', 'Sale', 'Salary', 'Transfer', 'Adjustment', 'Other'],
    required: true
  },
  reference: {
    type: String,
    trim: true
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  currency: {
    type: String,
    default: 'PKR',
    enum: ['PKR', 'USD', 'EUR']
  },
  
  // Account details
  debitAccount: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Account',
    required: true
  },
  creditAccount: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Account',
    required: true
  },
  
  // Related entities
  relatedSale: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Sale'
  },
  relatedPurchase: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Purchase'
  },
  relatedUser: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  // Payment details
  paymentMethod: {
    type: String,
    enum: ['Cash', 'Bank Transfer', 'Cheque', 'Credit Card', 'Other'],
    required: true
  },
  paymentStatus: {
    type: String,
    enum: ['Pending', 'Completed', 'Failed', 'Cancelled'],
    default: 'Pending'
  },
  
  // Accounts payable/receivable tracking
  isPayable: {
    type: Boolean,
    default: false
  },
  isReceivable: {
    type: Boolean,
    default: false
  },
  dueDate: {
    type: Date
  },
  
  // Warehouse and user tracking
  warehouse: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Warehouse',
    required: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // Additional details
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
TransactionSchema.index({ transactionNumber: 1 });
TransactionSchema.index({ transactionDate: 1 });
TransactionSchema.index({ transactionType: 1 });
TransactionSchema.index({ debitAccount: 1 });
TransactionSchema.index({ creditAccount: 1 });
TransactionSchema.index({ warehouse: 1 });
TransactionSchema.index({ isPayable: 1 });
TransactionSchema.index({ isReceivable: 1 });
TransactionSchema.index({ dueDate: 1 });

// Pre-save middleware to update account balances
TransactionSchema.pre('save', async function(next) {
  try {
    if (this.isNew) {
      // Update debit account balance
      const debitAccount = await mongoose.model('Account').findById(this.debitAccount);
      if (debitAccount) {
        debitAccount.currentBalance += this.amount;
        await debitAccount.save();
      }
      
      // Update credit account balance
      const creditAccount = await mongoose.model('Account').findById(this.creditAccount);
      if (creditAccount) {
        creditAccount.currentBalance -= this.amount;
        await creditAccount.save();
      }
    }
    next();
  } catch (error) {
    next(error);
  }
});

const Transaction = mongoose.model("Transaction", TransactionSchema);

export default Transaction;
