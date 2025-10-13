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
    enum: ["Raw Materials", "Finished Goods"],
    default: "Raw Materials"
  },
  subcategory: {
    type: String,
    required: [true, "Subcategory is required"],
    enum: [
      // Raw Materials
      "Wheat", "Choker",
      // Finished Goods  
      "Bags"
    ],
    default: "Wheat"
  },
  weight: {
    type: Number,
    required: [true, "Weight is required"],
    min: [0, "Weight cannot be negative"],
    default: 0
  },
  price: {
    type: Number,
    required: [true, "Price is required"],
    min: [0, "Price cannot be negative"],
    default: 0
  },
  status: {
    type: String,
    enum: ["Active", "Inactive", "Low Stock", "Out of Stock", "Discontinued"],
    default: "Active"
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Virtual for stock status
inventorySchema.virtual("stockStatus").get(function() {
  if (this.weight === 0) return "Out of Stock";
  return "In Stock";
});

// Virtual for total value calculation
inventorySchema.virtual("totalValue").get(function() {
  if (!this.price) return 0;
  // Price is always for the complete item
  return this.price;
});

// Virtual for price display
inventorySchema.virtual("priceDisplay").get(function() {
  if (!this.price) return "Not specified";
  return `${this.price} PKR per item`;
});

// Pre-save middleware
inventorySchema.pre("save", function(next) {
  // Auto-uppercase code
  if (this.code) {
    this.code = this.code.toUpperCase();
  }
  
  // Update lastUpdated
  this.lastUpdated = new Date();
  
  // Auto-update status based on weight
  if (this.weight === 0) {
    this.status = "Out of Stock";
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
inventorySchema.methods.getStockSummary = function() {
  return {
    weight: this.weight,
    status: this.stockStatus,
    totalValue: this.totalValue,
    pricePerKg: this.price
  };
};

// Statics
inventorySchema.statics.getOutOfStockItems = function() {
  return this.find({ weight: 0 });
};

// Check if model already exists to prevent overwrite errors
const Inventory = mongoose.models.Inventory || mongoose.model("Inventory", inventorySchema);

export default Inventory;
