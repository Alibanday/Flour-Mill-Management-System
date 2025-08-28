import mongoose from "mongoose";

const purchaseSchema = new mongoose.Schema({
  // Purchase Information
  purchaseNumber: {
    type: String,
    required: [true, "Purchase number is required"],
    unique: true,
    trim: true,
    uppercase: true
  },

  // Purchase Type (FR 23-24)
  purchaseType: {
    type: String,
    required: [true, "Purchase type is required"],
    enum: ["Bags", "Food", "Other"]
  },

  // Bags Purchasing (FR 23)
  bags: {
    ata: {
      quantity: {
        type: Number,
        default: 0,
        min: [0, "Quantity cannot be negative"]
      },
      unit: {
        type: String,
        enum: ["pcs", "boxes", "bundles"],
        default: "pcs"
      },
      unitPrice: {
        type: Number,
        default: 0,
        min: [0, "Unit price cannot be negative"]
      },
      totalPrice: {
        type: Number,
        default: 0,
        min: [0, "Total price cannot be negative"]
      }
    },
    maida: {
      quantity: {
        type: Number,
        default: 0,
        min: [0, "Quantity cannot be negative"]
      },
      unit: {
        type: String,
        enum: ["pcs", "boxes", "bundles"],
        default: "pcs"
      },
      unitPrice: {
        type: Number,
        default: 0,
        min: [0, "Unit price cannot be negative"]
      },
      totalPrice: {
        type: Number,
        default: 0,
        min: [0, "Total price cannot be negative"]
      }
    },
    suji: {
      quantity: {
        type: Number,
        default: 0,
        min: [0, "Quantity cannot be negative"]
      },
      unit: {
        type: String,
        enum: ["pcs", "boxes", "bundles"],
        default: "pcs"
      },
      unitPrice: {
        type: Number,
        default: 0,
        min: [0, "Unit price cannot be negative"]
      },
      totalPrice: {
        type: Number,
        default: 0,
        min: [0, "Total price cannot be negative"]
      }
    },
    fine: {
      quantity: {
        type: Number,
        default: 0,
        min: [0, "Quantity cannot be negative"]
      },
      unit: {
        type: String,
        enum: ["pcs", "boxes", "bundles"],
        default: "pcs"
      },
      unitPrice: {
        type: Number,
        default: 0,
        min: [0, "Unit price cannot be negative"]
      },
      totalPrice: {
        type: Number,
        default: 0,
        min: [0, "Total price cannot be negative"]
      }
    }
  },

  // Food Purchasing (FR 24) - Wheat from Govt
  food: {
    wheat: {
      quantity: {
        type: Number,
        default: 0,
        min: [0, "Quantity cannot be negative"]
      },
      unit: {
        type: String,
        enum: ["kg", "tons", "bags"],
        default: "kg"
      },
      unitPrice: {
        type: Number,
        default: 0,
        min: [0, "Unit price cannot be negative"]
      },
      totalPrice: {
        type: Number,
        default: 0,
        min: [0, "Total price cannot be negative"]
      },
      source: {
        type: String,
        enum: ["Government", "Private", "Other"],
        default: "Government"
      },
      quality: {
        type: String,
        enum: ["Premium", "Standard", "Economy"],
        default: "Standard"
      }
    }
  },

  // Supplier Information
  supplier: {
    name: {
      type: String,
      required: [true, "Supplier name is required"],
      trim: true
    },
    contact: {
      phone: String,
      email: String,
      address: String
    },
    type: {
      type: String,
      enum: ["Government", "Private", "Wholesaler", "Manufacturer"],
      default: "Private"
    }
  },

  // Purchase Details
  purchaseDate: {
    type: Date,
    required: [true, "Purchase date is required"],
    default: Date.now
  },

  deliveryDate: {
    type: Date
  },

  // Pricing
  subtotal: {
    type: Number,
    required: [true, "Subtotal is required"],
    min: [0, "Subtotal cannot be negative"]
  },

  tax: {
    type: Number,
    default: 0,
    min: [0, "Tax cannot be negative"]
  },

  shippingCost: {
    type: Number,
    default: 0,
    min: [0, "Shipping cost cannot be negative"]
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

  // Warehouse and Location
  warehouse: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Warehouse",
    required: [true, "Warehouse is required"]
  },

  // Status and Notes
  status: {
    type: String,
    enum: ["Draft", "Ordered", "Received", "Cancelled"],
    default: "Draft"
  },

  notes: String,

  // Created by
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: [true, "User who created purchase is required"]
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
purchaseSchema.pre("save", function(next) {
  let total = 0;

  // Calculate bags total
  if (this.purchaseType === "Bags" || this.purchaseType === "Other") {
    total += this.bags.ata.totalPrice + this.bags.maida.totalPrice + 
             this.bags.suji.totalPrice + this.bags.fine.totalPrice;
  }

  // Calculate food total
  if (this.purchaseType === "Food" || this.purchaseType === "Other") {
    total += this.food.wheat.totalPrice;
  }

  this.subtotal = total;
  this.totalAmount = this.subtotal + this.tax + this.shippingCost;
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

// Virtual for total bags quantity
purchaseSchema.virtual("totalBagsQuantity").get(function() {
  return this.bags.ata.quantity + this.bags.maida.quantity + 
         this.bags.suji.quantity + this.bags.fine.quantity;
});

// Virtual for total bags value
purchaseSchema.virtual("totalBagsValue").get(function() {
  return this.bags.ata.totalPrice + this.bags.maida.totalPrice + 
         this.bags.suji.totalPrice + this.bags.fine.totalPrice;
});

// Methods
purchaseSchema.methods.getPurchaseSummary = function() {
  return {
    purchaseNumber: this.purchaseNumber,
    purchaseType: this.purchaseType,
    supplierName: this.supplier.name,
    totalAmount: this.totalAmount,
    paymentStatus: this.paymentStatus,
    status: this.status,
    purchaseDate: this.purchaseDate
  };
};

purchaseSchema.methods.updatePayment = function(amount) {
  this.paidAmount += amount;
  this.remainingAmount = this.totalAmount - this.paidAmount;
  
  if (this.remainingAmount === 0) {
    this.paymentStatus = "Paid";
  } else if (this.paidAmount > 0) {
    this.paymentStatus = "Partial";
  }
  
  return this.save();
};

purchaseSchema.methods.markAsReceived = function() {
  this.status = "Received";
  this.deliveryDate = new Date();
  return this.save();
};

// Statics for reporting
purchaseSchema.statics.getPurchasesByDateRange = function(startDate, endDate) {
  return this.find({
    purchaseDate: {
      $gte: startDate,
      $lte: endDate
    }
  }).populate("supplier", "name contact");
};

purchaseSchema.statics.getOverduePayments = function() {
  return this.find({
    paymentStatus: { $in: ["Pending", "Partial"] },
    remainingAmount: { $gt: 0 }
  }).populate("supplier", "name contact");
};

purchaseSchema.statics.getBagsInventory = function() {
  return this.aggregate([
    {
      $match: {
        status: "Received",
        $or: [
          { "bags.ata.quantity": { $gt: 0 } },
          { "bags.maida.quantity": { $gt: 0 } },
          { "bags.suji.quantity": { $gt: 0 } },
          { "bags.fine.quantity": { $gt: 0 } }
        ]
      }
    },
    {
      $group: {
        _id: null,
        totalAta: { $sum: "$bags.ata.quantity" },
        totalMaida: { $sum: "$bags.maida.quantity" },
        totalSuji: { $sum: "$bags.suji.quantity" },
        totalFine: { $sum: "$bags.fine.quantity" }
      }
    }
  ]);
};

// Indexes for better performance
purchaseSchema.index({ purchaseNumber: 1 });
purchaseSchema.index({ purchaseDate: -1 });
purchaseSchema.index({ "supplier.name": 1 });
purchaseSchema.index({ purchaseType: 1 });
purchaseSchema.index({ paymentStatus: 1 });
purchaseSchema.index({ status: 1 });
purchaseSchema.index({ warehouse: 1 });

const Purchase = mongoose.model("Purchase", purchaseSchema);

export default Purchase;
