import mongoose from "mongoose";
import mongoosePaginate from "mongoose-paginate-v2";

const bagPurchaseSchema = new mongoose.Schema(
  {
    purchaseNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    supplier: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Supplier",
      required: true,
    },
    purchaseDate: {
      type: Date,
      required: true,
      default: Date.now,
    },
    bags: {
      ATA: {
        quantity: {
          type: Number,
          default: 0,
          min: 0,
        },
        unit: {
          type: String,
          enum: ["tons", "quintals", "50kg bags", "25kg bags", "10kg bags", "5kg bags", "100kg sacks", "50kg sacks", "25kg sacks", "bags", "pieces", "rolls", "sheets", "boxes", "packets", "bundles", "units", "sets", "kits", "pairs", "meters", "liters"],
          default: "50kg bags"
        },
        unitPrice: {
          type: Number,
          default: 0,
          min: 0,
        },
        totalPrice: {
          type: Number,
          default: 0,
          min: 0,
        },
      },
      MAIDA: {
        quantity: {
          type: Number,
          default: 0,
          min: 0,
        },
        unit: {
          type: String,
          enum: ["tons", "quintals", "50kg bags", "25kg bags", "10kg bags", "5kg bags", "100kg sacks", "50kg sacks", "25kg sacks", "bags", "pieces", "rolls", "sheets", "boxes", "packets", "bundles", "units", "sets", "kits", "pairs", "meters", "liters"],
          default: "50kg bags"
        },
        unitPrice: {
          type: Number,
          default: 0,
          min: 0,
        },
        totalPrice: {
          type: Number,
          default: 0,
          min: 0,
        },
      },
      SUJI: {
        quantity: {
          type: Number,
          default: 0,
          min: 0,
        },
        unit: {
          type: String,
          enum: ["tons", "quintals", "50kg bags", "25kg bags", "10kg bags", "5kg bags", "100kg sacks", "50kg sacks", "25kg sacks", "bags", "pieces", "rolls", "sheets", "boxes", "packets", "bundles", "units", "sets", "kits", "pairs", "meters", "liters"],
          default: "50kg bags"
        },
        unitPrice: {
          type: Number,
          default: 0,
          min: 0,
        },
        totalPrice: {
          type: Number,
          default: 0,
          min: 0,
        },
      },
      FINE: {
        quantity: {
          type: Number,
          default: 0,
          min: 0,
        },
        unit: {
          type: String,
          enum: ["tons", "quintals", "50kg bags", "25kg bags", "10kg bags", "5kg bags", "100kg sacks", "50kg sacks", "25kg sacks", "bags", "pieces", "rolls", "sheets", "boxes", "packets", "bundles", "units", "sets", "kits", "pairs", "meters", "liters"],
          default: "50kg bags"
        },
        unitPrice: {
          type: Number,
          default: 0,
          min: 0,
        },
        totalPrice: {
          type: Number,
          default: 0,
          min: 0,
        },
      },
    },
    totalQuantity: {
      type: Number,
      default: 0,
      min: 0,
    },
    subtotal: {
      type: Number,
      default: 0,
      min: 0,
    },
    tax: {
      type: Number,
      default: 0,
      min: 0,
    },
    discount: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    paymentMethod: {
      type: String,
      enum: ["Cash", "Bank Transfer", "Check", "Credit"],
      default: "Cash",
    },
    paymentStatus: {
      type: String,
      enum: ["Pending", "Partial", "Paid"],
      default: "Pending",
    },
    paidAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    dueAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    dueDate: {
      type: Date,
    },
    status: {
      type: String,
      enum: ["Pending", "Received", "Cancelled", "Completed"],
      default: "Pending",
    },
    receivedDate: {
      type: Date,
    },
    notes: {
      type: String,
      trim: true,
    },
    warehouse: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Warehouse",
      required: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
  }
);

// Add pagination plugin
bagPurchaseSchema.plugin(mongoosePaginate);

// Index for better query performance
bagPurchaseSchema.index({ purchaseNumber: 1, warehouse: 1 });
bagPurchaseSchema.index({ supplier: 1, warehouse: 1 });
bagPurchaseSchema.index({ purchaseDate: 1, warehouse: 1 });
bagPurchaseSchema.index({ status: 1, warehouse: 1 });

// Pre-save middleware to auto-generate purchase number
bagPurchaseSchema.pre("save", async function(next) {
  if (this.isNew && !this.purchaseNumber) {
    try {
      const count = await this.constructor.countDocuments();
      const year = new Date().getFullYear();
      const month = String(new Date().getMonth() + 1).padStart(2, '0');
      const day = String(new Date().getDate()).padStart(2, '0');
      this.purchaseNumber = `BP-${year}${month}${day}-${String(count + 1).padStart(4, '0')}`;
      console.log('Generated bag purchase number:', this.purchaseNumber);
    } catch (error) {
      console.error('Error generating bag purchase number:', error);
      // Fallback to timestamp-based number
      this.purchaseNumber = `BP-${Date.now()}`;
    }
  }
  next();
});

// Pre-save middleware to calculate totals
bagPurchaseSchema.pre("save", function (next) {
  // Calculate bag totals
  const bagTypes = ["ATA", "MAIDA", "SUJI", "FINE"];
  let totalQty = 0;
  let subtotal = 0;

  bagTypes.forEach((type) => {
    if (this.bags[type].quantity > 0) {
      this.bags[type].totalPrice = this.bags[type].quantity * this.bags[type].unitPrice;
      totalQty += this.bags[type].quantity;
      subtotal += this.bags[type].totalPrice;
    }
  });

  this.totalQuantity = totalQty;
  this.subtotal = subtotal;
  this.totalAmount = this.subtotal + this.tax - this.discount;
  this.dueAmount = this.totalAmount - this.paidAmount;

  next();
});

// Method to mark as received
bagPurchaseSchema.methods.markAsReceived = function () {
  this.status = "Received";
  this.receivedDate = new Date();
  return this.save();
};

// Method to update payment
bagPurchaseSchema.methods.updatePayment = function (amount) {
  this.paidAmount += amount;
  this.dueAmount = Math.max(0, this.totalAmount - this.paidAmount);
  
  if (this.dueAmount === 0) {
    this.paymentStatus = "Paid";
  } else if (this.paidAmount > 0) {
    this.paymentStatus = "Partial";
  }
  
  return this.save();
};

// Virtual for total bags
bagPurchaseSchema.virtual("totalBags").get(function () {
  return Object.values(this.bags).reduce((total, bag) => total + (bag.quantity || 0), 0);
});

const BagPurchase = mongoose.model("BagPurchase", bagPurchaseSchema);

export default BagPurchase;

