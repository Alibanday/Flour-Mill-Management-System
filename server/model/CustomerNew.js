import mongoose from "mongoose";

const customerNewSchema = new mongoose.Schema({
  customerId: {
    type: String,
    required: false
  },
  customerNumber: {
    type: String,
    required: false,
    unique: true,
    sparse: true
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
  
  // Customer Classification
  customerType: {
    type: String,
    enum: ["New", "Regular", "Premium", "VIP"],
    default: "New"
  },
  
  // Financial Information
  creditLimit: {
    type: Number,
    default: 0
  },
  creditUsed: {
    type: Number,
    default: 0
  },
  paymentTerms: {
    type: String,
    enum: ["Cash", "Credit", "Net 15", "Net 30", "Net 60"],
    default: "Cash"
  },
  preferredPaymentMethod: {
    type: String,
    enum: ["Cash", "Bank Transfer", "Cheque", "Credit Card", "Other"],
    default: "Cash"
  },
  
  // Sales Information
  assignedSalesRep: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  warehouse: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Warehouse',
    default: null
  },
  
  // Status and Metadata
  status: {
    type: String,
    enum: ["Active", "Inactive", "Suspended"],
    default: "Active"
  },
  notes: {
    type: String,
    default: ""
  },
  tags: [{
    type: String
  }],
  
  // Sales Statistics
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
  
  // Audit Fields
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  }
}, {
  timestamps: true
});

// Pre-save middleware to auto-generate customerId
customerNewSchema.pre('save', async function(next) {
  if (!this.customerId) {
    const count = await CustomerNew.countDocuments();
    this.customerId = `CUST-${String(count + 1).padStart(6, '0')}`;
  }
  next();
});

// Create new model with new collection
const CustomerNew = mongoose.model('CustomerNew', customerNewSchema, 'customers_new');

export default CustomerNew;
