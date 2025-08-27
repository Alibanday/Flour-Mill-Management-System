import mongoose from "mongoose";

const inventorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Inventory item name is required"],
    trim: true,
    maxlength: [100, "Item name cannot exceed 100 characters"]
  },
  code: {
    type: String,
    required: [true, "Inventory item code is required"],
    trim: true,
    unique: true,
    uppercase: true,
    maxlength: [20, "Item code cannot exceed 20 characters"]
  },
  category: {
    type: String,
    required: [true, "Category is required"],
    enum: ["Raw Materials", "Finished Goods", "Packaging", "Tools", "Machinery", "Other"],
    default: "Other"
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, "Description cannot exceed 500 characters"]
  },
  unit: {
    type: String,
    required: [true, "Unit is required"],
    enum: ["kg", "g", "l", "ml", "pcs", "boxes", "bags", "tons"],
    default: "kg"
  },
  currentStock: {
    type: Number,
    required: [true, "Current stock is required"],
    min: [0, "Stock cannot be negative"],
    default: 0
  },
  minimumStock: {
    type: Number,
    min: [0, "Minimum stock cannot be negative"],
    default: 0
  },
  maximumStock: {
    type: Number,
    min: [0, "Maximum stock cannot be negative"]
  },
  reorderPoint: {
    type: Number,
    min: [0, "Reorder point cannot be negative"]
  },
  cost: {
    purchasePrice: {
      type: Number,
      min: [0, "Purchase price cannot be negative"]
    },
    currency: {
      type: String,
      default: "PKR"
    }
  },
  warehouse: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Warehouse",
    required: [true, "Warehouse assignment is required"]
  },
  location: {
    aisle: String,
    shelf: String,
    bin: String
  },
  supplier: {
    name: String,
    contact: String,
    email: String
  },
  specifications: {
    type: Map,
    of: String
  },
  status: {
    type: String,
    enum: ["Active", "Inactive", "Low Stock", "Out of Stock", "Discontinued"],
    default: "Active"
  },
  tags: [String],
  expiryDate: Date,
  notes: String,
  lastUpdated: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Virtual for stock status
inventorySchema.virtual("stockStatus").get(function() {
  if (this.currentStock === 0) return "Out of Stock";
  if (this.currentStock <= this.minimumStock) return "Low Stock";
  return "In Stock";
});

// Virtual for stock percentage
inventorySchema.virtual("stockPercentage").get(function() {
  if (!this.maximumStock) return null;
  return Math.round((this.currentStock / this.maximumStock) * 100);
});

// Virtual for full location
inventorySchema.virtual("fullLocation").get(function() {
  const parts = [];
  if (this.location.aisle) parts.push(`Aisle: ${this.location.aisle}`);
  if (this.location.shelf) parts.push(`Shelf: ${this.location.shelf}`);
  if (this.location.bin) parts.push(`Bin: ${this.location.bin}`);
  return parts.length > 0 ? parts.join(", ") : "Not specified";
});

// Virtual for cost display
inventorySchema.virtual("costDisplay").get(function() {
  if (!this.cost.purchasePrice) return "Not specified";
  return `${this.cost.purchasePrice} ${this.cost.currency}`;
});

// Pre-save middleware
inventorySchema.pre("save", function(next) {
  // Auto-uppercase code
  if (this.code) {
    this.code = this.code.toUpperCase();
  }
  
  // Update lastUpdated
  this.lastUpdated = new Date();
  
  // Auto-update status based on stock levels
  if (this.currentStock === 0) {
    this.status = "Out of Stock";
  } else if (this.currentStock <= this.minimumStock) {
    this.status = "Low Stock";
  } else {
    this.status = "Active";
  }
  
  next();
});

// Methods
inventorySchema.methods.needsReorder = function() {
  return this.currentStock <= this.reorderPoint;
};

inventorySchema.methods.getStockSummary = function() {
  return {
    current: this.currentStock,
    minimum: this.minimumStock,
    maximum: this.maximumStock,
    status: this.stockStatus,
    percentage: this.stockPercentage
  };
};

// Statics
inventorySchema.statics.getLowStockItems = function() {
  return this.find({
    $expr: {
      $and: [
        { $gt: ["$minimumStock", 0] },
        { $lte: ["$currentStock", "$minimumStock"] }
      ]
    }
  });
};

inventorySchema.statics.getOutOfStockItems = function() {
  return this.find({ currentStock: 0 });
};

export default mongoose.model("Inventory", inventorySchema);
