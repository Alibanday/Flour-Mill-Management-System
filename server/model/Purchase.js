import mongoose from "mongoose";

const purchaseSchema = new mongoose.Schema({
  // Purchase Information
  purchaseNumber: {
    type: String,
    required: false, // Will be auto-generated
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

  // Original Purchase Type from Frontend
  originalPurchaseType: {
    type: String,
    required: false,
    enum: ["Raw Materials", "Finished Products", "Packaging Materials", "Maintenance Supplies", "Bags", "Food", "Other"]
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
        enum: ["tons", "quintals", "50kg bags", "25kg bags", "10kg bags", "5kg bags", "100kg sacks", "50kg sacks", "25kg sacks", "bags", "pieces", "rolls", "sheets", "boxes", "packets", "bundles", "units", "sets", "kits", "pairs", "meters", "liters"],
        default: "50kg bags"
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
        enum: ["tons", "quintals", "50kg bags", "25kg bags", "10kg bags", "5kg bags", "100kg sacks", "50kg sacks", "25kg sacks", "bags", "pieces", "rolls", "sheets", "boxes", "packets", "bundles", "units", "sets", "kits", "pairs", "meters", "liters"],
        default: "50kg bags"
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
        enum: ["tons", "quintals", "50kg bags", "25kg bags", "10kg bags", "5kg bags", "100kg sacks", "50kg sacks", "25kg sacks", "bags", "pieces", "rolls", "sheets", "boxes", "packets", "bundles", "units", "sets", "kits", "pairs", "meters", "liters"],
        default: "50kg bags"
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
        enum: ["tons", "quintals", "50kg bags", "25kg bags", "10kg bags", "5kg bags", "100kg sacks", "50kg sacks", "25kg sacks", "bags", "pieces", "rolls", "sheets", "boxes", "packets", "bundles", "units", "sets", "kits", "pairs", "meters", "liters"],
        default: "50kg bags"
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
        enum: ["tons", "quintals", "50kg bags", "25kg bags", "10kg bags", "5kg bags", "100kg sacks", "50kg sacks", "25kg sacks"],
        default: "tons"
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
      },
      grade: {
        type: String,
        enum: ["A", "B", "C"],
        default: "A"
      },
      governmentApproval: {
        type: String,
        default: ""
      },
      procurementDate: {
        type: Date,
        default: null
      },
      expiryDate: {
        type: Date,
        default: null
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

// Pre-save middleware to auto-generate purchase number
purchaseSchema.pre("save", async function(next) {
  if (this.isNew && !this.purchaseNumber) {
    try {
      const count = await this.constructor.countDocuments();
      const year = new Date().getFullYear();
      const month = String(new Date().getMonth() + 1).padStart(2, '0');
      const day = String(new Date().getDate()).padStart(2, '0');
      this.purchaseNumber = `PUR-${year}${month}${day}-${String(count + 1).padStart(4, '0')}`;
    } catch (error) {
      console.error('Error generating purchase number:', error);
      // Fallback to timestamp-based number
      this.purchaseNumber = `PUR-${Date.now()}`;
    }
  }
  next();
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
