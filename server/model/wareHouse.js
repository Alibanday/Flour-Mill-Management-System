// models/Warehouse.js

import mongoose from "mongoose";

const warehouseSchema = new mongoose.Schema({
  warehouseNumber: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  location: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ["Active", "Inactive"],
    default: "Active"
  },
  description: {
    type: String,
    default: ""
  },
  manager: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: false // Optional - can be assigned later
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better performance
warehouseSchema.index({ status: 1 });
warehouseSchema.index({ warehouseNumber: 1 });

// Virtual for warehouse full name
warehouseSchema.virtual('fullName').get(function() {
  return `${this.name} (${this.warehouseNumber})`;
});

// Virtual for warehouse location info
warehouseSchema.virtual('locationInfo').get(function() {
  return `${this.name} - ${this.location}`;
});

// Static method to get warehouse with stock summary
warehouseSchema.statics.getWarehouseWithStock = async function(warehouseId) {
  const Stock = mongoose.model('Stock');
  
  const warehouse = await this.findById(warehouseId);
  if (!warehouse) return null;
  
  const stock = await Stock.getWarehouseStock(warehouseId);
  const lowStock = await Stock.getLowStockItems(warehouseId);
  
  return {
    warehouse,
    stock,
    lowStock,
    totalItems: stock.length,
    lowStockCount: lowStock.length
  };
};

// Static method to get all warehouses with stock summary
warehouseSchema.statics.getAllWarehousesWithStock = async function() {
  const Stock = mongoose.model('Stock');
  
  const warehouses = await this.find({ status: "Active" }).sort({ name: 1 });
  
  const warehousesWithStock = await Promise.all(
    warehouses.map(async (warehouse) => {
      const stock = await Stock.getWarehouseStock(warehouse._id);
      const lowStock = await Stock.getLowStockItems(warehouse._id);
      
      return {
        ...warehouse.toObject(),
        stockCount: stock.length,
        lowStockCount: lowStock.length,
        totalQuantity: stock.reduce((sum, item) => sum + item.totalQuantity, 0)
      };
    })
  );
  
  return warehousesWithStock;
};

// Instance method to get warehouse stock
warehouseSchema.methods.getStock = async function() {
  const Stock = mongoose.model('Stock');
  return await Stock.getWarehouseStock(this._id);
};

// Instance method to get low stock items
warehouseSchema.methods.getLowStockItems = async function(threshold = 10) {
  const Stock = mongoose.model('Stock');
  return await Stock.getLowStockItems(this._id, threshold);
};

// Instance method to get warehouse stock movement
warehouseSchema.methods.getStockMovement = async function(days = 30) {
  const Stock = mongoose.model('Stock');
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  
  return await Stock.find({
    warehouse: this._id,
    date: { $gte: startDate }
  }).sort({ date: -1 });
};

export default mongoose.model("Warehouse", warehouseSchema);
