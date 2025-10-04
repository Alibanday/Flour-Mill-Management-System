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
    required: false, // Auto-generated, not required in input
    trim: true,
    unique: true,
    uppercase: true,
    maxlength: [20, "Item code cannot exceed 20 characters"]
  },
  category: {
    type: String,
    required: [true, "Category is required"],
    enum: ["Raw Materials", "Finished Products", "Packaging Materials", "Maintenance Supplies"],
    default: "Raw Materials"
  },
  subcategory: {
    type: String,
    required: [true, "Subcategory is required"],
    enum: [
      // Raw Materials
      "Wheat Grain", "Corn", "Rice", "Barley", "Oats", "Rye", "Millet",
      // Finished Products  
      "Flour", "Maida", "Suji", "Chokhar", "Fine Flour", "Whole Wheat Flour", "Bread Flour", "Cake Flour",
      // Packaging Materials
      "Bags", "Sacks", "Labels", "Tape", "Twine", "Plastic Sheets",
      // Maintenance Supplies
      "Machine Parts", "Lubricants", "Cleaning Supplies", "Safety Equipment", "Tools"
    ],
    default: "Wheat Grain"
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, "Description cannot exceed 500 characters"]
  },
  unit: {
    type: String,
    required: [true, "Unit is required"],
    enum: [
      "tons", "quintals",
      "50kg bags", "25kg bags", "10kg bags", "5kg bags",
      "100kg sacks", "50kg sacks", "25kg sacks",
      "bags", "pieces", "rolls", "sheets", "boxes", "packets", "bundles",
      "units", "sets", "kits", "pairs", "meters", "liters"
    ],
    default: "50kg bags"
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

// Virtual for total value calculation
inventorySchema.virtual("totalValue").get(function() {
  if (!this.cost || !this.cost.purchasePrice) return 0;
  return this.currentStock * this.cost.purchasePrice;
});

// Virtual for stock percentage (based on minimum stock as reference)
inventorySchema.virtual("stockPercentage").get(function() {
  if (!this.minimumStock || this.minimumStock === 0) return null;
  return Math.round((this.currentStock / this.minimumStock) * 100);
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

// Pre-save middleware to auto-generate item code
inventorySchema.pre('save', async function(next) {
  try {
    // Always generate a new code if not provided
    if (!this.code) {
      let attempts = 0;
      const maxAttempts = 10;
      let code;
      
      do {
        const categoryPrefix = this.category.substring(0, 3).toUpperCase();
        const timestamp = Date.now().toString().slice(-6);
        const randomSuffix = Math.random().toString(36).substring(2, 6);
        const processId = process.pid ? process.pid.toString().slice(-2) : '00';
        code = `${categoryPrefix}${timestamp}${randomSuffix}${processId}`;
        
        attempts++;
        
        // Check if code already exists
        const existingItem = await mongoose.model('Inventory').findOne({ code });
        if (!existingItem) {
          break;
        }
        
        if (attempts >= maxAttempts) {
          throw new Error('Unable to generate unique code after maximum attempts');
        }
      } while (attempts < maxAttempts);
      
      this.code = code;
      console.log('Generated unique code:', this.code);
    }
    next();
  } catch (error) {
    console.error('Error generating code:', error);
    next(error);
  }
});

// Methods
inventorySchema.methods.needsReorder = function() {
  return this.currentStock <= this.reorderPoint;
};

inventorySchema.methods.getStockSummary = function() {
  return {
    current: this.currentStock,
    minimum: this.minimumStock,
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

// Check if model already exists to prevent overwrite errors
const Inventory = mongoose.models.Inventory || mongoose.model("Inventory", inventorySchema);

export default Inventory;
