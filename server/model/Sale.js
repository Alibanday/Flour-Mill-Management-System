import mongoose from "mongoose";

const saleSchema = new mongoose.Schema({
  // Invoice Information (FR 19)
  invoiceNumber: {
    type: String,
    required: false, // Will be auto-generated
    unique: true,
    trim: true,
    uppercase: true
  },

  // Customer Information
  customer: {
    // Reference to CustomerNew model
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CustomerNew",
      required: false // Optional for backward compatibility
    },
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
      enum: ["kg", "tons", "bags", "pcs", "units", "25kg bags", "50kg bags", "10kg bags", "5kg bags", "100kg sacks", "50kg sacks", "25kg sacks"]
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

  // Alias for remainingAmount for consistency with frontend
  dueAmount: {
    type: Number,
    default: 0,
    min: [0, "Due amount cannot be negative"]
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
    enum: ["Draft", "Confirmed", "Shipped", "Delivered", "Cancelled", "Completed", "Pending"],
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

// Pre-save middleware to auto-generate invoice number
saleSchema.pre("save", async function(next) {
  if (this.isNew && !this.invoiceNumber) {
    try {
      const year = new Date().getFullYear();
      const month = String(new Date().getMonth() + 1).padStart(2, '0');
      const day = String(new Date().getDate()).padStart(2, '0');
      const datePrefix = `${year}${month}${day}`;
      
      // Find the highest invoice number for today
      const todayInvoices = await this.constructor.find({
        invoiceNumber: new RegExp(`^INV-${datePrefix}-`)
      }).sort({ invoiceNumber: -1 }).limit(1);
      
      let sequenceNumber = 1;
      if (todayInvoices.length > 0) {
        // Extract the sequence number from the last invoice
        const lastInvoice = todayInvoices[0].invoiceNumber;
        const match = lastInvoice.match(/-(\d+)$/);
        if (match) {
          sequenceNumber = parseInt(match[1], 10) + 1;
        }
      }
      
      // Generate invoice number with sequence
      this.invoiceNumber = `INV-${datePrefix}-${String(sequenceNumber).padStart(4, '0')}`;
      
      // Double-check for uniqueness (race condition protection)
      let attempts = 0;
      let isUnique = false;
      while (!isUnique && attempts < 10) {
        const existing = await this.constructor.findOne({ invoiceNumber: this.invoiceNumber });
        if (!existing) {
          isUnique = true;
        } else {
          sequenceNumber++;
          this.invoiceNumber = `INV-${datePrefix}-${String(sequenceNumber).padStart(4, '0')}`;
          attempts++;
        }
      }
      
      if (!isUnique) {
        // Fallback to timestamp-based number if we can't find a unique sequence
        const timestamp = Date.now();
        this.invoiceNumber = `INV-${datePrefix}-${timestamp}`;
      }
      
      console.log(`Generated invoice number: ${this.invoiceNumber}`);
    } catch (error) {
      console.error('Error generating invoice number:', error);
      // Fallback to timestamp-based number
      const timestamp = Date.now();
      const year = new Date().getFullYear();
      const month = String(new Date().getMonth() + 1).padStart(2, '0');
      const day = String(new Date().getDate()).padStart(2, '0');
      this.invoiceNumber = `INV-${year}${month}${day}-${timestamp}`;
    }
  }
  next();
});

// Pre-save middleware to calculate totals
saleSchema.pre("save", function(next) {
  try {
    // Calculate subtotal from items if items exist
    if (this.items && this.items.length > 0) {
      this.subtotal = this.items.reduce((sum, item) => sum + (parseFloat(item.totalPrice) || 0), 0);
    } else if (!this.subtotal) {
      this.subtotal = 0;
    }

    // Ensure discount object exists and has proper structure
    if (!this.discount) {
      this.discount = {
        type: 'none',
        value: 0,
        amount: 0
      };
    } else {
      // Ensure discount has all required fields
      if (!this.discount.type) {
        this.discount.type = 'none';
      }
      if (this.discount.value === undefined || this.discount.value === null) {
        this.discount.value = 0;
      }
      
      // Calculate discount amount based on type
      if (this.discount.type === "percentage") {
        this.discount.amount = (this.subtotal * (this.discount.value || 0)) / 100;
      } else if (this.discount.type === "fixed") {
        this.discount.amount = this.discount.value || 0;
      } else {
        // If type is 'none' or invalid, set amount to 0
        this.discount.amount = 0;
      }
    }

    // Calculate total amount
    const taxAmount = parseFloat(this.tax) || 0;
    const discountAmount = parseFloat(this.discount.amount) || 0;
    this.totalAmount = this.subtotal - discountAmount + taxAmount;

    // Calculate remaining amount
    const paidAmount = parseFloat(this.paidAmount) || 0;
    this.remainingAmount = Math.max(0, this.totalAmount - paidAmount);
    // Set dueAmount to same value as remainingAmount for consistency
    this.dueAmount = this.remainingAmount;

    // Update payment status if not explicitly set or if amounts changed
    // Only auto-update if paymentStatus wasn't explicitly provided or if it's a new document
    if (this.isNew || this.isModified('paidAmount') || this.isModified('totalAmount')) {
      // Only auto-set paymentStatus if it wasn't explicitly provided
      if (!this.paymentStatus || (this.isModified('paidAmount') && !this.$__.$ignorePaymentStatusUpdate)) {
        if (this.remainingAmount === 0) {
          this.paymentStatus = "Paid";
        } else if (this.paidAmount > 0) {
          this.paymentStatus = "Partial";
        } else {
          this.paymentStatus = "Pending";
        }
      }
    }

    // Update timestamp
    this.updatedAt = new Date();

    next();
  } catch (error) {
    console.error('Error in Sale pre-save middleware:', error);
    next(error);
  }
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
