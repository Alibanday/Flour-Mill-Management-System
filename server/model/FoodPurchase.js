import mongoose from "mongoose";
import mongoosePaginate from "mongoose-paginate-v2";

const foodPurchaseSchema = new mongoose.Schema(
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
    foodItems: [{
      name: {
        type: String,
        required: true,
        trim: true,
      },
      category: {
        type: String,
        required: true,
        enum: ["Wheat", "Raw Materials", "Other"],
        default: "Wheat",
      },
      quantity: {
        type: Number,
        required: true,
        min: 0,
      },
      unit: {
        type: String,
        required: true,
        enum: ["KG", "TON", "BAG", "LITER"],
        default: "KG",
      },
      unitPrice: {
        type: Number,
        required: true,
        min: 0,
      },
      totalPrice: {
        type: Number,
        required: true,
        min: 0,
      },
      quality: {
        type: String,
        enum: ["Premium", "Standard", "Basic"],
        default: "Standard",
      },
      expiryDate: {
        type: Date,
      },
    }],
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
      required: true,
      min: 0,
    },
    paymentMethod: {
      type: String,
      required: true,
      enum: ["Cash", "Bank Transfer", "Check", "Credit"],
      default: "Cash",
    },
    paymentStatus: {
      type: String,
      required: true,
      enum: ["Pending", "Partial", "Completed"],
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
    deliveryDate: {
      type: Date,
    },
    deliveryStatus: {
      type: String,
      enum: ["Pending", "In Transit", "Delivered"],
      default: "Pending",
    },
    notes: {
      type: String,
      trim: true,
    },
    attachments: [{
      filename: String,
      path: String,
      uploadedAt: {
        type: Date,
        default: Date.now,
      },
    }],
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    status: {
      type: String,
      enum: ["Draft", "Pending", "Approved", "Completed", "Cancelled"],
      default: "Draft",
    },
  },
  {
    timestamps: true,
  }
);

// Add pagination plugin
foodPurchaseSchema.plugin(mongoosePaginate);

// Generate purchase number
foodPurchaseSchema.pre("save", async function (next) {
  if (this.isNew && !this.purchaseNumber) {
    const count = await this.constructor.countDocuments();
    const year = new Date().getFullYear();
    this.purchaseNumber = `FP${year}${String(count + 1).padStart(4, "0")}`;
  }
  next();
});

// Calculate totals
foodPurchaseSchema.pre("save", function (next) {
  // Calculate total quantity
  this.totalQuantity = this.foodItems.reduce((total, item) => total + item.quantity, 0);
  
  // Calculate subtotal
  this.subtotal = this.foodItems.reduce((total, item) => total + item.totalPrice, 0);
  
  // Calculate total amount
  this.totalAmount = this.subtotal + this.tax - this.discount;
  
  // Calculate due amount
  this.dueAmount = this.totalAmount - this.paidAmount;
  
  next();
});

// Check if purchase is overdue
foodPurchaseSchema.methods.isOverdue = function () {
  if (this.deliveryDate && this.deliveryStatus !== "Delivered") {
    return new Date() > this.deliveryDate;
  }
  return false;
};

// Get payment percentage
foodPurchaseSchema.methods.getPaymentPercentage = function () {
  if (this.totalAmount === 0) return 0;
  return (this.paidAmount / this.totalAmount) * 100;
};

const FoodPurchase = mongoose.model("FoodPurchase", foodPurchaseSchema);

export default FoodPurchase;
