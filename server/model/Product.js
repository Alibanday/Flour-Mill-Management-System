import mongoose from "mongoose";

/**
 * Product Model - Product Catalog (Master Product List)
 * This is the master list of all products you deal with
 * One record per product type (e.g., "50kg ATA Bag", "Wheat Grain")
 * 
 * Inventory = Stock levels per warehouse (one per product per warehouse)
 * Product = Master catalog (one per product type)
 */
const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Product name is required"],
    trim: true,
    maxlength: [100, "Product name cannot exceed 100 characters"]
  },
  code: {
    type: String,
    required: false, // Auto-generated
    trim: true,
    unique: true,
    uppercase: true,
    maxlength: [20, "Product code cannot exceed 20 characters"]
  },
  category: {
    type: String,
    required: [true, "Category is required"],
    enum: ["Raw Materials", "Finished Goods", "Packaging Materials"],
    default: "Raw Materials"
  },
  subcategory: {
    type: String,
    required: [true, "Subcategory is required"],
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  unit: {
    type: String,
    required: [true, "Unit is required"],
    default: "kg"
  },
  // Multiple weight variants (e.g., 20kg, 25kg, 50kg) with different prices
  weightVariants: [{
    weight: {
      type: Number,
      required: [true, "Weight is required"],
      min: [0, "Weight cannot be negative"]
    },
    price: {
      type: Number,
      required: [true, "Price is required"],
      min: [0, "Price cannot be negative"]
    },
    unit: {
      type: String,
      default: "kg"
    },
    isActive: {
      type: Boolean,
      default: true
    }
  }],
  // Legacy fields for backward compatibility
  weight: {
    type: Number,
    min: [0, "Weight cannot be negative"],
    default: 0
  },
  // Default selling price (for backward compatibility)
  price: {
    type: Number,
    min: [0, "Price cannot be negative"],
    default: 0
  },
  // Default purchase price
  purchasePrice: {
    type: Number,
    min: [0, "Purchase price cannot be negative"],
    default: 0
  },
  // Minimum stock level for alerts (applies to all warehouses)
  minimumStock: {
    type: Number,
    min: [0, "Minimum stock cannot be negative"],
    default: 0
  },
  status: {
    type: String,
    enum: ["Active", "Inactive", "Discontinued"],
    default: "Active"
  },
  // Additional product information
  specifications: {
    type: Map,
    of: String,
    default: {}
  },
  tags: [{
    type: String,
    trim: true
  }],
  lastUpdated: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Indexes for better performance
productSchema.index({ code: 1 });
productSchema.index({ category: 1, subcategory: 1 });
productSchema.index({ status: 1 });
productSchema.index({ name: 'text', description: 'text' }); // Text search

// Pre-save middleware
productSchema.pre("save", function(next) {
  // Auto-uppercase code
  if (this.code) {
    this.code = this.code.toUpperCase();
  }
  
  // Update lastUpdated
  this.lastUpdated = new Date();
  
  next();
});

// Pre-save middleware to auto-generate product code
productSchema.pre('save', async function(next) {
  try {
    if (!this.code) {
      let attempts = 0;
      const maxAttempts = 10;
      let code;
      
      do {
        const categoryPrefix = this.category.substring(0, 3).toUpperCase();
        const timestamp = Date.now().toString().slice(-6);
        const randomSuffix = Math.random().toString(36).substring(2, 6);
        const processId = process.pid ? process.pid.toString().slice(-2) : '00';
        code = `PRD-${categoryPrefix}${timestamp}${randomSuffix}${processId}`;
        
        attempts++;
        
        // Check if code already exists
        const existingProduct = await mongoose.model('Product').findOne({ code });
        if (!existingProduct) {
          break;
        }
        
        if (attempts >= maxAttempts) {
          throw new Error('Unable to generate unique product code after maximum attempts');
        }
      } while (attempts < maxAttempts);
      
      this.code = code;
      console.log('Generated unique product code:', this.code);
    }
    next();
  } catch (error) {
    console.error('Error generating product code:', error);
    next(error);
  }
});

// Methods
productSchema.methods.getProductSummary = function() {
  return {
    name: this.name,
    code: this.code,
    category: this.category,
    subcategory: this.subcategory,
    price: this.price,
    purchasePrice: this.purchasePrice,
    status: this.status
  };
};

// Statics
productSchema.statics.getActiveProducts = function() {
  return this.find({ status: 'Active' });
};

productSchema.statics.getByCategory = function(category) {
  return this.find({ category, status: 'Active' });
};

// Check if model already exists to prevent overwrite errors
const Product = mongoose.models.Product || mongoose.model("Product", productSchema);

export default Product;

