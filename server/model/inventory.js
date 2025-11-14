import mongoose from "mongoose";

/**
 * Inventory Model - Stock Levels Per Warehouse
 * This tracks the current stock quantity of each product in each warehouse
 * 
 * Relationship:
 * - Product (catalog) → One record per product type
 * - Inventory → One record per product per warehouse (stock levels)
 * - Stock (movements) → History of stock in/out
 */
const inventorySchema = new mongoose.Schema({
  // Reference to Product catalog (master product)
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product",
    required: false // Optional for backward compatibility, will be required in future
  },
  // Warehouse where this stock is located
  warehouse: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Warehouse",
    required: false // Optional for backward compatibility, will be required in future
  },
  // Current stock quantity (calculated from Stock movements)
  currentStock: {
    type: Number,
    min: [0, "Current stock cannot be negative"],
    default: 0
  },
  // Minimum stock level for alerts (can override product default)
  minimumStock: {
    type: Number,
    min: [0, "Minimum stock cannot be negative"],
    default: 0
  },
  // Status based on stock level
  status: {
    type: String,
    enum: ["Active", "Inactive", "Low Stock", "Out of Stock", "Discontinued"],
    default: "Active"
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  },
  // Legacy fields for backward compatibility (will be removed later)
  name: {
    type: String,
    trim: true
  },
  code: {
    type: String,
    trim: true
  },
  category: {
    type: String
  },
  subcategory: {
    type: String
  },
  weight: {
    type: Number,
    min: [0, "Weight cannot be negative"],
    default: 0
  },
  price: {
    type: Number,
    min: [0, "Price cannot be negative"],
    default: 0
  }
}, {
  timestamps: true
});

// Compound index: one inventory record per product per warehouse (only when both exist)
inventorySchema.index({ product: 1, warehouse: 1 }, { unique: true, sparse: true });
inventorySchema.index({ warehouse: 1 });
inventorySchema.index({ status: 1 });

// Virtual for stock status
inventorySchema.virtual("stockStatus").get(function() {
  // Use currentStock if available, otherwise fall back to weight for backward compatibility
  const stock = this.currentStock !== undefined ? this.currentStock : this.weight;
  if (stock === 0) return "Out of Stock";
  if (this.minimumStock && stock <= this.minimumStock) return "Low Stock";
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

// Pre-save middleware (merged)
inventorySchema.pre("save", async function(next) {
  try {
    // Auto-uppercase code
    if (this.code) {
      this.code = this.code.toUpperCase();
    }
    
    // Update lastUpdated
    this.lastUpdated = new Date();
    
    // Auto-update status based on currentStock (or weight for backward compatibility)
    const stock = this.currentStock !== undefined ? this.currentStock : (this.weight || 0);
    if (stock === 0) {
      this.status = "Out of Stock";
    } else if (this.minimumStock && stock <= this.minimumStock) {
      this.status = "Low Stock";
    } else if (this.status === "Out of Stock" || this.status === "Low Stock") {
      // Only change to Active if it was previously Out of Stock or Low Stock
      this.status = "Active";
    }
    
    // Populate product info for legacy fields if product exists
    if (this.product && (!this.name || !this.code)) {
      try {
        // Use mongoose.models to avoid circular dependency
        const ProductModel = mongoose.models.Product;
        if (ProductModel) {
          const product = await ProductModel.findById(this.product);
          if (product) {
            this.name = product.name;
            this.code = product.code;
            this.category = product.category;
            this.subcategory = product.subcategory;
            if (!this.minimumStock) {
              this.minimumStock = product.minimumStock || 0;
            }
          }
        }
      } catch (error) {
        // Silently fail if Product model not available yet (backward compatibility)
        console.warn('Product model not available during inventory save:', error.message);
      }
    }
    
    next();
  } catch (error) {
    console.error('Error in inventory pre-save:', error);
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
  return this.find({ 
    $or: [
      { currentStock: 0 },
      { currentStock: { $exists: false }, weight: 0 }
    ]
  });
};

// Check if model already exists to prevent overwrite errors
const Inventory = mongoose.models.Inventory || mongoose.model("Inventory", inventorySchema);

export default Inventory;
