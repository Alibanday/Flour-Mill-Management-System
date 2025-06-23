// models/Stock.js
import mongoose from "mongoose";

const stockSchema = new mongoose.Schema({
  sellerName: { type: String },
  sellerDescription: String,
  itemName: { type: String, required: true },
  itemType: { 
    type: String, 
    required: true,
    enum: ['wheat', 'bags']
  },
  quantity: {
    value: { type: Number, required: true },
    unit: { type: String }
  },
  subType: {
    type: String,
    default: null
  },
  itemDescription: String,
  date: { type: Date, required: true },
  warehouse: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Warehouse',
    required: true
  },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  createdAt: { type: Date, default: Date.now }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better performance
stockSchema.index({ warehouse: 1, itemName: 1, itemType: 1 });
stockSchema.index({ warehouse: 1, date: -1 });
stockSchema.index({ itemName: 1, itemType: 1 });

// Virtual for formatted quantity
stockSchema.virtual('formattedQuantity').get(function() {
  return `${this.quantity.value} ${this.quantity.unit || ''}`.trim();
});

// Static method to get warehouse stock summary
stockSchema.statics.getWarehouseStock = async function(warehouseId) {
  const stock = await this.aggregate([
    { $match: { warehouse: new mongoose.Types.ObjectId(warehouseId) } },
    {
      $group: {
        _id: {
          itemName: '$itemName',
          itemType: '$itemType',
          subType: '$subType'
        },
        totalQuantity: { $sum: '$quantity.value' },
        unit: { $first: '$quantity.unit' },
        lastUpdated: { $max: '$date' }
      }
    },
    {
      $project: {
        itemName: '$_id.itemName',
        itemType: '$_id.itemType',
        subType: '$_id.subType',
        totalQuantity: 1,
        unit: 1,
        lastUpdated: 1
      }
    },
    { $sort: { itemName: 1 } }
  ]);
  
  return stock;
};

// Static method to get low stock items
stockSchema.statics.getLowStockItems = async function(warehouseId, threshold = 10) {
  const lowStock = await this.aggregate([
    { $match: { warehouse: new mongoose.Types.ObjectId(warehouseId) } },
    {
      $group: {
        _id: {
          itemName: '$itemName',
          itemType: '$itemType',
          subType: '$subType'
        },
        totalQuantity: { $sum: '$quantity.value' },
        unit: { $first: '$quantity.unit' }
      }
    },
    { $match: { totalQuantity: { $lte: threshold } } },
    {
      $project: {
        itemName: '$_id.itemName',
        itemType: '$_id.itemType',
        subType: '$_id.subType',
        totalQuantity: 1,
        unit: 1
      }
    }
  ]);
  
  return lowStock;
};

// Instance method to get stock movement history
stockSchema.methods.getMovementHistory = async function() {
  return await this.constructor.find({
    warehouse: this.warehouse,
    itemName: this.itemName,
    itemType: this.itemType
  }).sort({ date: -1 }).limit(10);
};

const Stock = mongoose.model("Stock", stockSchema);
export default Stock;
