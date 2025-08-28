import mongoose from "mongoose";

const saleSchema = new mongoose.Schema({
  // Invoice Information (FR 19)
  invoiceNumber: {
    type: String,
    required: [true, "Invoice number is required"],
    unique: true,
    trim: true,
    uppercase: true
  },

  // Customer Information
  customer: {
    name: {
      type: String,
      required: [true, "Customer name is required"],
      trim: true
    },
    contact: {
      phone: String,
      email: String,
      address: String
    },
    creditLimit: {
      type: Number,
      default: 0,
      min: [0, "Credit limit cannot be negative"]
    },
    outstandingBalance: {
      type: Number,
      default: 0,
      min: [0, "Outstanding balance cannot be negative"]
    }
  },

  // Sale Details
  saleDate: {
    type: Date,
    required: [true, "Sale date is required"],
    default: Date.now
  },

  // Product Items
  items: [{
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Inventory",
      required: [true, "Product reference is required"]
    },
    productName: {
      type: String,
      required: [true, "Product name is required"]
    },
    quantity: {
      type: Number,
      required: [true, "Quantity is required"],
      min: [0, "Quantity cannot be negative"]
    },
    unit: {
      type: String,
      required: [true, "Unit is required"],
      enum: ["kg", "tons", "bags", "pcs"]
    },
    unitPrice: {
      type: Number,
      required: [true, "Unit price is required"],
      min: [0, "Unit price cannot be negative"]
    },
    totalPrice: {
      type: Number,
      required: [true, "Total price is required"],
      min: [0, "Total price cannot be negative"]
    }
  }],

  // Pricing and Discounts (FR 21)
  subtotal: {
    type: Number,
    required: [true, "Subtotal is required"],
    min: [0, "Subtotal cannot be negative"]
  },

  discount: {
    type: {
      type: String,
      enum: ["percentage", "fixed", "none"],
      default: "none"
    },
    value: {
      type: Number,
      default: 0,
      min: [0, "Discount value cannot be negative"]
    },
    amount: {
      type: Number,
      default: 0,
      min: [0, "Discount amount cannot be negative"]
    }
  },

  // Tax and Total
  tax: {
    type: Number,
    default: 0,
    min: [0, "Tax cannot be negative"]
  },

  totalAmount: {
    type: Number,
    required: [true, "Total amount is required"],
    min: [0, "Total amount cannot be negative"]
  },

  // Payment Information
  paymentMethod: {
    type: String,
    enum: ["Cash", "Bank Transfer", "Cheque", "Credit"],
    required: [true, "Payment method is required"]
  },

  paymentStatus: {
    type: String,
    enum: ["Paid", "Partial", "Pending", "Overdue"],
    default: "Pending"
  },

  paidAmount: {
    type: Number,
    default: 0,
    min: [0, "Paid amount cannot be negative"]
  },

  remainingAmount: {
    type: Number,
    default: 0,
    min: [0, "Remaining amount cannot be negative"]
  },

  // Return Information (FR 20)
  returns: [{
    itemId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true
    },
    productName: String,
    quantity: Number,
    unit: String,
    returnReason: {
      type: String,
      enum: ["Quality Issue", "Wrong Product", "Customer Request", "Damaged", "Other"]
    },
    returnDate: {
      type: Date,
      default: Date.now
    },
    refundAmount: Number,
    status: {
      type: String,
      enum: ["Pending", "Approved", "Rejected", "Processed"],
      default: "Pending"
    }
  }],

  // Warehouse and Location
  warehouse: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Warehouse",
    required: [true, "Warehouse is required"]
  },

  // Status and Notes
  status: {
    type: String,
    enum: ["Draft", "Confirmed", "Shipped", "Delivered", "Cancelled"],
    default: "Draft"
  },

  notes: String,

  // Created by
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: [true, "User who created sale is required"]
  },

  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Pre-save middleware to calculate totals
saleSchema.pre("save", function(next) {
  // Calculate subtotal from items
  this.subtotal = this.items.reduce((sum, item) => sum + item.totalPrice, 0);

  // Calculate discount amount
  if (this.discount.type === "percentage") {
    this.discount.amount = (this.subtotal * this.discount.value) / 100;
  } else if (this.discount.type === "fixed") {
    this.discount.amount = this.discount.value;
  }

  // Calculate total amount
  this.totalAmount = this.subtotal - this.discount.amount + this.tax;

  // Calculate remaining amount
  this.remainingAmount = this.totalAmount - this.paidAmount;

  // Update payment status
  if (this.remainingAmount === 0) {
    this.paymentStatus = "Paid";
  } else if (this.paidAmount > 0) {
    this.paymentStatus = "Partial";
  } else {
    this.paymentStatus = "Pending";
  }

  // Update timestamp
  this.updatedAt = new Date();

  next();
});

// Virtual for total items
saleSchema.virtual("totalItems").get(function() {
  return this.items.reduce((sum, item) => sum + item.quantity, 0);
});

// Virtual for discount percentage
saleSchema.virtual("discountPercentage").get(function() {
  if (this.subtotal > 0 && this.discount.amount > 0) {
    return (this.discount.amount / this.subtotal) * 100;
  }
  return 0;
});

// Methods
saleSchema.methods.getSaleSummary = function() {
  return {
    invoiceNumber: this.invoiceNumber,
    customerName: this.customer.name,
    totalAmount: this.totalAmount,
    paymentStatus: this.paymentStatus,
    status: this.status,
    saleDate: this.saleDate
  };
};

saleSchema.methods.addReturn = function(returnData) {
  this.returns.push(returnData);
  return this.save();
};

saleSchema.methods.updatePayment = function(amount) {
  this.paidAmount += amount;
  this.remainingAmount = this.totalAmount - this.paidAmount;
  
  if (this.remainingAmount === 0) {
    this.paymentStatus = "Paid";
  } else if (this.paidAmount > 0) {
    this.paymentStatus = "Partial";
  }
  
  return this.save();
};

// Statics for reporting
saleSchema.statics.getSalesByDateRange = function(startDate, endDate) {
  return this.find({
    saleDate: {
      $gte: startDate,
      $lte: endDate
    }
  }).populate("customer", "name contact");
};

saleSchema.statics.getOverduePayments = function() {
  return this.find({
    paymentStatus: { $in: ["Pending", "Partial"] },
    remainingAmount: { $gt: 0 }
  }).populate("customer", "name contact outstandingBalance");
};

saleSchema.statics.getCustomerSales = function(customerId) {
  return this.find({
    "customer._id": customerId
  }).sort({ saleDate: -1 });
};

// Indexes for better performance
saleSchema.index({ invoiceNumber: 1 });
saleSchema.index({ saleDate: -1 });
saleSchema.index({ "customer.name": 1 });
saleSchema.index({ paymentStatus: 1 });
saleSchema.index({ status: 1 });
saleSchema.index({ warehouse: 1 });

const Sale = mongoose.model("Sale", saleSchema);

export default Sale;
