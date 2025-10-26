import mongoose from "mongoose";

const productionSchema = new mongoose.Schema({
  // Production Batch Information
  batchNumber: {
    type: String,
    required: false, // Auto-generated, not required in input
    unique: true,
    trim: true,
    uppercase: true
  },
  
  // Source Warehouse (where wheat is taken from)
  sourceWarehouse: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Warehouse",
    required: [true, "Source warehouse is required"]
  },
  
  // Wheat quantity used in production
  wheatQuantity: {
    type: Number,
    required: [true, "Wheat quantity is required"],
    min: [0, "Wheat quantity cannot be negative"]
  },
  
  // Output products array
  outputProducts: [{
    productName: {
      type: String,
      required: true,
      trim: true
    },
    weight: {
      type: Number,
      required: true,
      min: 0
    },
    quantity: {
      type: Number,
      required: true,
      min: 1
    },
    unit: {
      type: String,
      enum: ["bags", "pcs", "kg"],
      default: "bags"
    },
    totalWeight: {
      type: Number,
      default: 0
    }
  }],
  
  // Destination warehouse (where output products are stored)
  destinationWarehouse: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Warehouse",
    required: [true, "Destination warehouse is required"]
  },
  
  // Production Details
  productionDate: {
    type: Date,
    required: [true, "Production date is required"],
    default: Date.now
  },
  
  // Legacy fields for backward compatibility (will be removed later)
  productName: {
    type: String,
    required: false,
    trim: true
  },
  
  productType: {
    type: String,
    required: false,
    enum: ["Raw Materials", "Finished Goods", "Repacked Product"]
  },
  
  quantity: {
    value: {
      type: Number,
      required: false,
      min: [0, "Quantity cannot be negative"]
    },
    unit: {
      type: String,
      required: false,
      enum: ["kg", "tons", "bags", "pcs"],
      default: "kg"
    }
  },
  
  // Cost Calculation (Optional)
  productionCost: {
    rawMaterialCost: {
      type: Number,
      required: false,
      min: [0, "Cost cannot be negative"],
      default: 0
    },
    laborCost: {
      type: Number,
      required: false,
      min: [0, "Cost cannot be negative"],
      default: 0
    },
    overheadCost: {
      type: Number,
      required: false,
      min: [0, "Cost cannot be negative"],
      default: 0
    },
    totalCost: {
      type: Number,
      required: false,
      min: [0, "Cost cannot be negative"],
      default: 0
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

// Pre-save middleware to auto-generate batch number and calculate values
productionSchema.pre("save", async function(next) {
  try {
    // Auto-generate batch number if not provided
    if (!this.batchNumber && this.isNew) {
      const count = await this.constructor.countDocuments();
      const year = new Date().getFullYear();
      const month = String(new Date().getMonth() + 1).padStart(2, '0');
      const day = String(new Date().getDate()).padStart(2, '0');
      this.batchNumber = `BATCH-${year}${month}${day}-${String(count + 1).padStart(4, '0')}`;
      console.log('Generated production batch number:', this.batchNumber);
    }
    
    // Calculate total weight for each output product
    this.outputProducts = this.outputProducts.map(product => ({
      ...product,
      totalWeight: (product.weight || 0) * (product.quantity || 0)
    }));
    
    // Calculate wastage if not provided
    if (this.wastage.quantity === undefined || this.wastage.quantity === null) {
      const totalOutputWeight = this.outputProducts.reduce((sum, product) => 
        sum + ((product.weight || 0) * (product.quantity || 0)), 0);
      this.wastage.quantity = Math.max(0, (this.wheatQuantity || 0) - totalOutputWeight);
      this.wastage.unit = 'kg';
      this.wastage.reason = this.wastage.reason || 'Processing Loss';
      this.wastage.cost = 0;
    }
    
    // Calculate total production cost if provided
    if (this.productionCost.rawMaterialCost || this.productionCost.laborCost || this.productionCost.overheadCost) {
      this.productionCost.totalCost = 
        (this.productionCost.rawMaterialCost || 0) + 
        (this.productionCost.laborCost || 0) + 
        (this.productionCost.overheadCost || 0);
    }
    
    // Calculate production duration if both times are set
    if (this.process.startTime && this.process.endTime) {
      this.process.duration = Math.round(
        (this.process.endTime - this.process.startTime) / (1000 * 60)
      );
    }
    
    // Update timestamp
    this.updatedAt = new Date();
    
    next();
  } catch (error) {
    console.error('Error in production pre-save middleware:', error);
    next(error);
  }
});

// Virtual for cost per unit
productionSchema.virtual("costPerUnit").get(function() {
  const wheatQty = this.wheatQuantity || 0;
  if (wheatQty > 0 && this.productionCost.totalCost > 0) {
    return this.productionCost.totalCost / wheatQty;
  }
  return 0;
});

// Virtual for wastage percentage
productionSchema.virtual("wastagePercentage").get(function() {
  const wheatQty = this.wheatQuantity || 0;
  if (wheatQty > 0 && this.wastage.quantity) {
    return (this.wastage.quantity / wheatQty) * 100;
  }
  return 0;
});

// Methods
productionSchema.methods.getProductionSummary = function() {
  return {
    batchNumber: this.batchNumber,
    wheatQuantity: `${this.wheatQuantity} kg`,
    outputProducts: this.outputProducts.length,
    totalCost: `${this.productionCost.totalCost} ${this.productionCost.currency}`,
    costPerUnit: `${this.costPerUnit.toFixed(2)} ${this.productionCost.currency}`,
    wastage: `${this.wastage.quantity.toFixed(2)} ${this.wastage.unit} (${this.wastagePercentage.toFixed(2)}%)`,
    status: this.status,
    quality: this.quality?.grade || 'Standard'
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
