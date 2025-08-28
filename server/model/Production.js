import mongoose from "mongoose";

const productionSchema = new mongoose.Schema({
  // Production Batch Information
  batchNumber: {
    type: String,
    required: [true, "Batch number is required"],
    unique: true,
    trim: true,
    uppercase: true
  },
  
  // Product Information
  productName: {
    type: String,
    required: [true, "Product name is required"],
    trim: true,
    enum: ["Wheat Flour", "Whole Wheat", "Premium Flour", "Maida", "Suji", "Fine", "Chokhar", "Refraction"]
  },
  
  productType: {
    type: String,
    required: [true, "Product type is required"],
    enum: ["Raw Materials", "Finished Goods", "Repacked Product"]
  },
  
  // Production Details
  productionDate: {
    type: Date,
    required: [true, "Production date is required"],
    default: Date.now
  },
  
  quantity: {
    value: {
      type: Number,
      required: [true, "Quantity value is required"],
      min: [0, "Quantity cannot be negative"]
    },
    unit: {
      type: String,
      required: [true, "Unit is required"],
      enum: ["kg", "tons", "bags", "pcs"],
      default: "kg"
    }
  },
  
  // Cost Calculation (FR 16)
  productionCost: {
    rawMaterialCost: {
      type: Number,
      required: [true, "Raw material cost is required"],
      min: [0, "Cost cannot be negative"]
    },
    laborCost: {
      type: Number,
      required: [true, "Labor cost is required"],
      min: [0, "Cost cannot be negative"]
    },
    overheadCost: {
      type: Number,
      required: [true, "Overhead cost is required"],
      min: [0, "Cost cannot be negative"]
    },
    totalCost: {
      type: Number,
      required: [true, "Total cost is required"],
      min: [0, "Cost cannot be negative"]
    },
    currency: {
      type: String,
      default: "PKR"
    }
  },
  
  // Wastage Tracking (FR 18)
  wastage: {
    quantity: {
      type: Number,
      min: [0, "Wastage quantity cannot be negative"],
      default: 0
    },
    unit: {
      type: String,
      enum: ["kg", "tons", "bags", "pcs"],
      default: "kg"
    },
    reason: {
      type: String,
      enum: ["Processing Loss", "Quality Issue", "Machine Error", "Human Error", "Other"],
      default: "Processing Loss"
    },
    cost: {
      type: Number,
      min: [0, "Wastage cost cannot be negative"],
      default: 0
    }
  },
  
  // Repacking Information (FR 17)
  repacking: {
    isRepacked: {
      type: Boolean,
      default: false
    },
    originalProduct: {
      type: String,
      trim: true
    },
    repackingDate: Date,
    repackingCost: {
      type: Number,
      min: [0, "Repacking cost cannot be negative"],
      default: 0
    },
    newProductName: {
      type: String,
      trim: true
    }
  },
  
  // Warehouse and Location
  warehouse: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Warehouse",
    required: [true, "Warehouse is required"]
  },
  
  // Quality Control
  quality: {
    grade: {
      type: String,
      enum: ["Premium", "Standard", "Economy"],
      default: "Standard"
    },
    moistureContent: {
      type: Number,
      min: [0, "Moisture content cannot be negative"]
    },
    proteinContent: {
      type: Number,
      min: [0, "Protein content cannot be negative"]
    },
    approved: {
      type: Boolean,
      default: false
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    },
    approvedAt: Date
  },
  
  // Production Process
  process: {
    startTime: Date,
    endTime: Date,
    duration: Number, // in minutes
    machineUsed: String,
    operator: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    }
  },
  
  // Status and Notes
  status: {
    type: String,
    enum: ["In Progress", "Completed", "Quality Check", "Approved", "Rejected", "Dispatched"],
    default: "In Progress"
  },
  
  notes: String,
  
  // Manager who added the production details (FR 14)
  addedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: [true, "Manager who added production is required"]
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

// Pre-save middleware to calculate total cost
productionSchema.pre("save", function(next) {
  // Calculate total production cost
  this.productionCost.totalCost = 
    this.productionCost.rawMaterialCost + 
    this.productionCost.laborCost + 
    this.productionCost.overheadCost;
  
  // Calculate production duration if both times are set
  if (this.process.startTime && this.process.endTime) {
    this.process.duration = Math.round(
      (this.process.endTime - this.process.startTime) / (1000 * 60)
    );
  }
  
  // Update timestamp
  this.updatedAt = new Date();
  
  next();
});

// Virtual for cost per unit
productionSchema.virtual("costPerUnit").get(function() {
  if (this.quantity.value > 0) {
    return this.productionCost.totalCost / this.quantity.value;
  }
  return 0;
});

// Virtual for wastage percentage
productionSchema.virtual("wastagePercentage").get(function() {
  if (this.quantity.value > 0) {
    return (this.wastage.quantity / this.quantity.value) * 100;
  }
  return 0;
});

// Methods
productionSchema.methods.getProductionSummary = function() {
  return {
    batchNumber: this.batchNumber,
    productName: this.productName,
    quantity: `${this.quantity.value} ${this.quantity.unit}`,
    totalCost: `${this.productionCost.totalCost} ${this.productionCost.currency}`,
    costPerUnit: `${this.costPerUnit.toFixed(2)} ${this.productionCost.currency}`,
    wastage: `${this.wastage.quantity} ${this.wastage.unit} (${this.wastagePercentage.toFixed(2)}%)`,
    status: this.status,
    quality: this.quality.grade
  };
};

// Statics for reporting
productionSchema.statics.getDailyProduction = function(date) {
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);
  
  return this.find({
    productionDate: {
      $gte: startOfDay,
      $lte: endOfDay
    },
    status: "Completed"
  });
};

productionSchema.statics.getProductionByDateRange = function(startDate, endDate) {
  return this.find({
    productionDate: {
      $gte: startDate,
      $lte: endDate
    }
  });
};

productionSchema.statics.getLowQualityProducts = function() {
  return this.find({
    "quality.grade": "Economy",
    status: "Completed"
  });
};

// Indexes for better performance
productionSchema.index({ productionDate: -1 });
productionSchema.index({ batchNumber: 1 });
productionSchema.index({ warehouse: 1 });
productionSchema.index({ status: 1 });
productionSchema.index({ "quality.grade": 1 });

const Production = mongoose.model("Production", productionSchema);

export default Production;
