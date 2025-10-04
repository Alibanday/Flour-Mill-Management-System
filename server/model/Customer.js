import mongoose from "mongoose";

const customerSchema = new mongoose.Schema({
  customerId: {
    type: String,
    required: false
  },
  // Personal Information
  firstName: {
    type: String,
    required: [true, "First name is required"],
    trim: true
  },
  lastName: {
    type: String,
    required: [true, "Last name is required"],
    trim: true
  },
  email: {
    type: String,
    required: [true, "Email is required"],
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, "Please enter a valid email"]
  },
  phone: {
    type: String,
    required: [true, "Phone number is required"]
  },
  alternatePhone: {
    type: String,
    default: ""
  },
  
  // Business Information
  businessName: {
    type: String,
    default: ""
  },
  businessType: {
    type: String,
    enum: ["Individual", "Retailer", "Wholesaler", "Restaurant", "Bakery", "Distributor", "Other"],
    default: "Individual"
  },
  businessRegistrationNumber: {
    type: String,
    default: ""
  },
  
  // Address Information
  address: {
    street: {
      type: String,
      default: ""
    },
    city: {
      type: String,
      default: ""
    },
    state: {
      type: String,
      default: ""
    },
    zipCode: {
      type: String,
      default: ""
    },
    country: {
      type: String,
      default: "Pakistan"
    }
  },
  
  // Customer Classification
  customerType: {
    type: String,
    enum: ["Regular", "Premium", "VIP", "New"],
    default: "New"
  },
  creditLimit: {
    type: Number,
    default: 0,
    min: 0
  },
  creditUsed: {
    type: Number,
    default: 0,
    min: 0
  },
  
  // Payment Information
  paymentTerms: {
    type: String,
    enum: ["Cash", "Credit", "Net 15", "Net 30", "Net 60", "COD"],
    default: "Cash"
  },
  preferredPaymentMethod: {
    type: String,
    enum: ["Cash", "Bank Transfer", "Cheque", "Credit Card", "Mobile Payment"],
    default: "Cash"
  },
  
  // Business Relationship
  assignedSalesRep: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee',
    default: null
  },
  warehouse: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Warehouse',
    default: null
  },
  
  // Customer Status
  status: {
    type: String,
    enum: ["Active", "Inactive", "Suspended", "Blacklisted"],
    default: "Active"
  },
  
  // Additional Information
  notes: {
    type: String,
    default: ""
  },
  tags: [{
    type: String,
    trim: true
  }],
  
  // Contact Preferences
  contactPreferences: {
    emailNotifications: {
      type: Boolean,
      default: true
    },
    smsNotifications: {
      type: Boolean,
      default: true
    },
    phoneCalls: {
      type: Boolean,
      default: true
    }
  },
  
  // Statistics
  totalOrders: {
    type: Number,
    default: 0
  },
  totalSpent: {
    type: Number,
    default: 0
  },
  lastOrderDate: {
    type: Date,
    default: null
  },
  averageOrderValue: {
    type: Number,
    default: 0
  },
  
  // System Fields
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
customerSchema.index({ customerId: 1 });
customerSchema.index({ email: 1 });
customerSchema.index({ phone: 1 });
customerSchema.index({ businessName: 1 });
customerSchema.index({ customerType: 1 });
customerSchema.index({ status: 1 });
customerSchema.index({ assignedSalesRep: 1 });
customerSchema.index({ warehouse: 1 });
customerSchema.index({ createdAt: -1 });

// Virtual for full name
customerSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName}`;
});

// Virtual for available credit
customerSchema.virtual('availableCredit').get(function() {
  return Math.max(0, this.creditLimit - this.creditUsed);
});

// Virtual for customer status color
customerSchema.virtual('statusColor').get(function() {
  const statusColors = {
    'Active': 'green',
    'Inactive': 'gray',
    'Suspended': 'yellow',
    'Blacklisted': 'red'
  };
  return statusColors[this.status] || 'gray';
});

// Virtual for customer type badge
customerSchema.virtual('typeBadge').get(function() {
  const typeBadges = {
    'Regular': 'blue',
    'Premium': 'purple',
    'VIP': 'gold',
    'New': 'green'
  };
  return typeBadges[this.customerType] || 'blue';
});

// Pre-save middleware to generate customer ID
customerSchema.pre('save', async function(next) {
  try {
    if (!this.customerId) {
      let attempts = 0;
      const maxAttempts = 10;
      let customerId;
      
      do {
        const year = new Date().getFullYear();
        const count = await mongoose.model('Customer').countDocuments();
        const sequence = String(count + 1).padStart(4, '0');
        customerId = `CUST${year}${sequence}`;
        
        attempts++;
        
        // Check if customer ID already exists
        const existingCustomer = await mongoose.model('Customer').findOne({ customerId });
        if (!existingCustomer) {
          break;
        }
        
        if (attempts >= maxAttempts) {
          throw new Error('Unable to generate unique customer ID after maximum attempts');
        }
      } while (attempts < maxAttempts);
      
      this.customerId = customerId;
      console.log('Generated unique customer ID:', this.customerId);
    }
    next();
  } catch (error) {
    console.error('Error generating customer ID:', error);
    next(error);
  }
});

// Static method to get customer statistics
customerSchema.statics.getCustomerStats = async function() {
  const stats = await this.aggregate([
    {
      $group: {
        _id: null,
        totalCustomers: { $sum: 1 },
        activeCustomers: { $sum: { $cond: [{ $eq: ["$status", "Active"] }, 1, 0] } },
        totalRevenue: { $sum: "$totalSpent" },
        averageOrderValue: { $avg: "$averageOrderValue" }
      }
    }
  ]);
  
  return stats[0] || {
    totalCustomers: 0,
    activeCustomers: 0,
    totalRevenue: 0,
    averageOrderValue: 0
  };
};

// Static method to get customers by type
customerSchema.statics.getCustomersByType = async function() {
  return await this.aggregate([
    {
      $group: {
        _id: "$customerType",
        count: { $sum: 1 },
        totalSpent: { $sum: "$totalSpent" }
      }
    },
    { $sort: { count: -1 } }
  ]);
};

// Static method to get top customers
customerSchema.statics.getTopCustomers = async function(limit = 10) {
  return await this.find({ status: "Active" })
    .sort({ totalSpent: -1 })
    .limit(limit)
    .select('customerId firstName lastName businessName totalSpent totalOrders')
    .populate('assignedSalesRep', 'firstName lastName')
    .populate('warehouse', 'name location');
};

// Method to update customer statistics
customerSchema.methods.updateStats = async function(orderValue) {
  this.totalOrders += 1;
  this.totalSpent += orderValue;
  this.lastOrderDate = new Date();
  this.averageOrderValue = this.totalSpent / this.totalOrders;
  
  await this.save();
};

// Method to check if customer can make credit purchase
customerSchema.methods.canMakeCreditPurchase = function(amount) {
  if (this.paymentTerms === 'Cash') return false;
  return (this.creditUsed + amount) <= this.creditLimit;
};

// Pre-save middleware to auto-generate customerId
customerSchema.pre('save', async function(next) {
  if (!this.customerId) {
    const count = await Customer.countDocuments();
    this.customerId = `CUST-${String(count + 1).padStart(6, '0')}`;
  }
  next();
});

// Force new model definition to avoid existing indexes
const Customer = mongoose.model('CustomerNew', customerSchema);

export default Customer;