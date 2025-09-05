import mongoose from 'mongoose';

const customerSchema = new mongoose.Schema({
  customerNumber: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  firstName: {
    type: String,
    required: true,
    trim: true
  },
  lastName: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  phone: {
    type: String,
    required: true,
    trim: true
  },
  cnic: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  address: {
    street: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    zipCode: { type: String, required: true },
    country: { type: String, default: 'Pakistan' }
  },
  businessInfo: {
    businessName: { type: String, trim: true },
    businessType: { 
      type: String, 
      enum: ['Retailer', 'Wholesaler', 'Distributor', 'Individual', 'Other'],
      default: 'Individual'
    },
    taxNumber: { type: String, trim: true }
  },
  creditInfo: {
    creditLimit: {
      type: Number,
      required: true,
      default: 0,
      min: 0
    },
    currentBalance: {
      type: Number,
      default: 0
    },
    availableCredit: {
      type: Number,
      default: 0
    },
    creditTerms: {
      type: Number,
      default: 30, // days
      min: 0
    },
    creditStatus: {
      type: String,
      enum: ['Active', 'Suspended', 'Blocked'],
      default: 'Active'
    }
  },
  salesInfo: {
    totalPurchases: {
      type: Number,
      default: 0
    },
    totalAmount: {
      type: Number,
      default: 0
    },
    lastPurchaseDate: {
      type: Date
    },
    averageOrderValue: {
      type: Number,
      default: 0
    }
  },
  status: {
    type: String,
    enum: ['Active', 'Inactive', 'Suspended'],
    default: 'Active'
  },
  notes: {
    type: String,
    trim: true
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
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for full name
customerSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName}`;
});

// Virtual for available credit calculation
customerSchema.virtual('availableCreditAmount').get(function() {
  return Math.max(0, this.creditInfo.creditLimit - this.creditInfo.currentBalance);
});

// Pre-save middleware to update available credit
customerSchema.pre('save', function(next) {
  this.creditInfo.availableCredit = this.availableCreditAmount;
  next();
});

// Indexes for better performance
customerSchema.index({ customerNumber: 1 });
customerSchema.index({ email: 1 });
customerSchema.index({ phone: 1 });
customerSchema.index({ cnic: 1 });
customerSchema.index({ 'creditInfo.creditStatus': 1 });
customerSchema.index({ status: 1 });
customerSchema.index({ createdAt: -1 });

// Static method to generate customer number
customerSchema.statics.generateCustomerNumber = async function() {
  const count = await this.countDocuments();
  return `CUST${String(count + 1).padStart(6, '0')}`;
};

// Static method to check credit availability
customerSchema.statics.checkCreditAvailability = async function(customerId, amount) {
  const customer = await this.findById(customerId);
  if (!customer) {
    throw new Error('Customer not found');
  }
  
  if (customer.creditInfo.creditStatus !== 'Active') {
    throw new Error('Customer credit is not active');
  }
  
  if (customer.creditInfo.availableCredit < amount) {
    throw new Error('Insufficient credit limit');
  }
  
  return true;
};

// Instance method to update credit balance
customerSchema.methods.updateCreditBalance = function(amount, type = 'debit') {
  if (type === 'debit') {
    this.creditInfo.currentBalance += amount;
  } else if (type === 'credit') {
    this.creditInfo.currentBalance = Math.max(0, this.creditInfo.currentBalance - amount);
  }
  
  this.creditInfo.availableCredit = this.availableCreditAmount;
  return this.save();
};

// Instance method to check if customer can make purchase
customerSchema.methods.canMakePurchase = function(amount) {
  return this.status === 'Active' && 
         this.creditInfo.creditStatus === 'Active' && 
         this.creditInfo.availableCredit >= amount;
};

export default mongoose.model('Customer', customerSchema);

