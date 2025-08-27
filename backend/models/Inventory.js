const mongoose = require('mongoose');

const inventorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Inventory item name is required'],
    trim: true,
    maxlength: [100, 'Item name cannot exceed 100 characters']
  },
  code: {
    type: String,
    required: [true, 'Inventory item code is required'],
    trim: true,
    unique: true,
    uppercase: true,
    maxlength: [20, 'Item code cannot exceed 20 characters']
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    enum: ['Raw Materials', 'Finished Goods', 'Packaging', 'Tools', 'Machinery', 'Other'],
    default: 'Other'
  },
  subCategory: {
    type: String,
    trim: true,
    maxlength: [50, 'Sub-category cannot exceed 50 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  unit: {
    type: String,
    required: [true, 'Unit of measurement is required'],
    enum: ['kg', 'tons', 'bags', 'pieces', 'liters', 'meters', 'units'],
    default: 'kg'
  },
  currentStock: {
    type: Number,
    required: [true, 'Current stock level is required'],
    min: [0, 'Stock cannot be negative'],
    default: 0
  },
  minimumStock: {
    type: Number,
    min: [0, 'Minimum stock cannot be negative'],
    default: 0
  },
  maximumStock: {
    type: Number,
    min: [0, 'Maximum stock cannot be negative']
  },
  reorderPoint: {
    type: Number,
    min: [0, 'Reorder point cannot be negative'],
    default: 0
  },
  cost: {
    purchasePrice: {
      type: Number,
      min: [0, 'Purchase price cannot be negative']
    },
    sellingPrice: {
      type: Number,
      min: [0, 'Selling price cannot be negative']
    },
    currency: {
      type: String,
      default: 'PKR',
      enum: ['PKR', 'USD', 'EUR']
    }
  },
  warehouse: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Warehouse',
    required: [true, 'Warehouse assignment is required']
  },
  location: {
    aisle: {
      type: String,
      trim: true,
      maxlength: [10, 'Aisle cannot exceed 10 characters']
    },
    shelf: {
      type: String,
      trim: true,
      maxlength: [10, 'Shelf cannot exceed 10 characters']
    },
    bin: {
      type: String,
      trim: true,
      maxlength: [10, 'Bin cannot exceed 10 characters']
    }
  },
  supplier: {
    name: {
      type: String,
      trim: true,
      maxlength: [100, 'Supplier name cannot exceed 100 characters']
    },
    contact: {
      type: String,
      trim: true
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email']
    }
  },
  specifications: {
    weight: {
      type: Number,
      min: [0, 'Weight cannot be negative']
    },
    dimensions: {
      length: { type: Number, min: 0 },
      width: { type: Number, min: 0 },
      height: { type: Number, min: 0 }
    },
    color: { type: String, trim: true },
    material: { type: String, trim: true }
  },
  status: {
    type: String,
    enum: ['Active', 'Inactive', 'Low Stock', 'Out of Stock', 'Discontinued'],
    default: 'Active'
  },
  tags: [{
    type: String,
    trim: true,
    maxlength: [30, 'Tag cannot exceed 30 characters']
  }],
  expiryDate: {
    type: Date
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  },
  notes: {
    type: String,
    trim: true,
    maxlength: [1000, 'Notes cannot exceed 1000 characters']
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better performance
inventorySchema.index({ name: 1, category: 1 });
inventorySchema.index({ warehouse: 1, status: 1 });
inventorySchema.index({ code: 1 }, { unique: true });

// Virtual for stock status
inventorySchema.virtual('stockStatus').get(function() {
  if (this.currentStock === 0) return 'Out of Stock';
  if (this.currentStock <= this.minimumStock) return 'Low Stock';
  if (this.currentStock >= this.maximumStock) return 'Overstocked';
  return 'Normal';
});

// Virtual for stock percentage
inventorySchema.virtual('stockPercentage').get(function() {
  if (!this.maximumStock || this.maximumStock === 0) return 0;
  return Math.round((this.currentStock / this.maximumStock) * 100);
});

// Virtual for full location
inventorySchema.virtual('fullLocation').get(function() {
  const loc = this.location;
  if (!loc.aisle && !loc.shelf && !loc.bin) return 'Not specified';
  
  const parts = [];
  if (loc.aisle) parts.push(`Aisle: ${loc.aisle}`);
  if (loc.shelf) parts.push(`Shelf: ${loc.shelf}`);
  if (loc.bin) parts.push(`Bin: ${loc.bin}`);
  
  return parts.join(', ');
});

// Virtual for cost display
inventorySchema.virtual('costDisplay').get(function() {
  if (!this.cost.purchasePrice) return 'Not specified';
  return `${this.cost.currency} ${this.cost.purchasePrice.toFixed(2)}`;
});

// Pre-save middleware
inventorySchema.pre('save', function(next) {
  // Auto-uppercase the code
  if (this.code) {
    this.code = this.code.toUpperCase();
  }
  
  // Update lastUpdated timestamp
  this.lastUpdated = new Date();
  
  // Auto-update status based on stock levels
  if (this.currentStock === 0) {
    this.status = 'Out of Stock';
  } else if (this.currentStock <= this.minimumStock) {
    this.status = 'Low Stock';
  } else if (this.status === 'Out of Stock' || this.status === 'Low Stock') {
    this.status = 'Active';
  }
  
  next();
});

// Method to check if reorder is needed
inventorySchema.methods.needsReorder = function() {
  return this.currentStock <= this.reorderPoint;
};

// Method to get stock summary
inventorySchema.methods.getStockSummary = function() {
  return {
    id: this._id,
    name: this.name,
    code: this.code,
    category: this.category,
    currentStock: this.currentStock,
    unit: this.unit,
    status: this.status,
    stockStatus: this.stockStatus,
    warehouse: this.warehouse
  };
};

// Static method to get low stock items
inventorySchema.statics.getLowStockItems = function() {
  return this.find({
    $expr: {
      $and: [
        { $gt: ['$minimumStock', 0] },
        { $lte: ['$currentStock', '$minimumStock'] }
      ]
    }
  }).populate('warehouse', 'name code');
};

// Static method to get out of stock items
inventorySchema.statics.getOutOfStockItems = function() {
  return this.find({ currentStock: 0 }).populate('warehouse', 'name code');
};

module.exports = mongoose.model('Inventory', inventorySchema);
