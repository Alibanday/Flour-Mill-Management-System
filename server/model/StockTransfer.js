import mongoose from 'mongoose';

const stockTransferSchema = new mongoose.Schema({
  transferNumber: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  transferType: {
    type: String,
    enum: ['Warehouse to Warehouse', 'Production to Warehouse', 'Warehouse to Production', 'Return Transfer', 'Adjustment'],
    required: true
  },
  fromWarehouse: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Warehouse',
    required: true
  },
  toWarehouse: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Warehouse',
    required: true
  },
  items: [{
    inventoryItem: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Inventory',
      required: true
    },
    productName: {
      type: String,
      required: true
    },
    productCode: {
      type: String,
      required: true
    },
    requestedQuantity: {
      type: Number,
      required: true,
      min: 0
    },
    actualQuantity: {
      type: Number,
      default: 0,
      min: 0
    },
    unit: {
      type: String,
      required: true
    },
    unitPrice: {
      type: Number,
      required: true,
      min: 0
    },
    totalValue: {
      type: Number,
      required: true,
      min: 0
    },
    batchNumber: {
      type: String,
      trim: true
    },
    expiryDate: {
      type: Date
    },
    condition: {
      type: String,
      enum: ['Good', 'Damaged', 'Expired', 'Near Expiry'],
      default: 'Good'
    }
  }],
  transferDetails: {
    transferDate: {
      type: Date,
      required: true,
      default: Date.now
    },
    expectedDeliveryDate: {
      type: Date
    },
    actualDeliveryDate: {
      type: Date
    },
    reason: {
      type: String,
      required: true,
      trim: true
    },
    priority: {
      type: String,
      enum: ['Low', 'Medium', 'High', 'Urgent'],
      default: 'Medium'
    },
    transportMethod: {
      type: String,
      enum: ['Internal', 'External', 'Manual', 'Vehicle'],
      default: 'Internal'
    },
    vehicleNumber: {
      type: String,
      trim: true
    },
    driverName: {
      type: String,
      trim: true
    },
    driverContact: {
      type: String,
      trim: true
    }
  },
  status: {
    type: String,
    enum: ['Pending', 'Approved', 'In Transit', 'Delivered', 'Completed', 'Cancelled', 'Rejected'],
    default: 'Pending'
  },
  approval: {
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    approvedAt: {
      type: Date
    },
    approvalNotes: {
      type: String,
      trim: true
    }
  },
  dispatch: {
    dispatchedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    dispatchedAt: {
      type: Date
    },
    dispatchNotes: {
      type: String,
      trim: true
    }
  },
  receipt: {
    receivedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    receivedAt: {
      type: Date
    },
    receiptNotes: {
      type: String,
      trim: true
    },
    discrepancies: [{
      itemId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Inventory'
      },
      productName: String,
      expectedQuantity: Number,
      receivedQuantity: Number,
      difference: Number,
      reason: String
    }]
  },
  documents: {
    transferNote: {
      type: String,
      trim: true
    },
    deliveryNote: {
      type: String,
      trim: true
    },
    receiptNote: {
      type: String,
      trim: true
    }
  },
  totalValue: {
    type: Number,
    default: 0,
    min: 0
  },
  notes: {
    type: String,
    trim: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for total items count
stockTransferSchema.virtual('totalItems').get(function() {
  return this.items.length;
});

// Virtual for total quantity
stockTransferSchema.virtual('totalQuantity').get(function() {
  return this.items.reduce((total, item) => total + item.requestedQuantity, 0);
});

// Virtual for actual total quantity
stockTransferSchema.virtual('actualTotalQuantity').get(function() {
  return this.items.reduce((total, item) => total + item.actualQuantity, 0);
});

// Pre-save middleware to calculate total value
stockTransferSchema.pre('save', function(next) {
  this.totalValue = this.items.reduce((total, item) => {
    return total + (item.actualQuantity * item.unitPrice);
  }, 0);
  next();
});

// Indexes for better performance
stockTransferSchema.index({ transferNumber: 1 });
stockTransferSchema.index({ fromWarehouse: 1 });
stockTransferSchema.index({ toWarehouse: 1 });
stockTransferSchema.index({ status: 1 });
stockTransferSchema.index({ 'transferDetails.transferDate': -1 });
stockTransferSchema.index({ createdBy: 1 });

// Static method to generate transfer number
stockTransferSchema.statics.generateTransferNumber = async function() {
  const count = await this.countDocuments();
  return `TRF${String(count + 1).padStart(6, '0')}`;
};

// Static method to validate stock availability
stockTransferSchema.statics.validateStockAvailability = async function(warehouseId, items = []) {
  if (!warehouseId) {
    throw new Error('Source warehouse is required for stock validation');
  }

  const Inventory = mongoose.model('Inventory');
  const Stock = mongoose.model('Stock');
  const sourceWarehouseId = warehouseId.toString();

  for (const item of items) {
    if (!item?.inventoryItem) {
      throw new Error('Each transfer item must reference an inventory record');
    }

    const inventory = await Inventory.findById(item.inventoryItem).lean();
    const stockMovements = await Stock.find({
      warehouse: warehouseId,
      inventoryItem: item.inventoryItem
    }).lean();

    if (!inventory && stockMovements.length === 0) {
      throw new Error('Inventory item not found for transfer');
    }

    const inventoryWarehouseId = inventory?.warehouse?.toString();
    if (inventoryWarehouseId && inventoryWarehouseId !== sourceWarehouseId && stockMovements.length === 0) {
      throw new Error(`${inventory?.name || 'Selected item'} is not stored in the chosen source warehouse`);
    }

    const inventoryAvailable = inventory ? (inventory.currentStock ?? inventory.weight ?? 0) : 0;
    const stockAvailable = stockMovements.reduce((total, movement) => {
      if (movement.movementType === 'out') {
        return total - (movement.quantity || 0);
      }
      return total + (movement.quantity || 0);
    }, 0);

    const availableStock = stockAvailable > 0 ? stockAvailable : inventoryAvailable;

    if (availableStock < item.requestedQuantity) {
      const itemName = inventory?.name || stockMovements[0]?.productName || 'selected item';
      throw new Error(`Insufficient stock for ${itemName}. Available: ${availableStock}, Requested: ${item.requestedQuantity}`);
    }
  }

  return true;
};

// Static method to get transfer statistics
stockTransferSchema.statics.getTransferStats = async function(startDate, endDate) {
  const pipeline = [
    {
      $match: {
        'transferDetails.transferDate': {
          $gte: new Date(startDate),
          $lte: new Date(endDate)
        }
      }
    },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        totalValue: { $sum: '$totalValue' },
        totalQuantity: { $sum: '$totalQuantity' }
      }
    }
  ];
  
  return await this.aggregate(pipeline);
};

// Instance method to approve transfer
stockTransferSchema.methods.approveTransfer = function(userId, notes) {
  this.status = 'Approved';
  this.approval.approvedBy = userId;
  this.approval.approvedAt = new Date();
  if (notes) this.approval.approvalNotes = notes;
  return this.save();
};

// Instance method to dispatch transfer
stockTransferSchema.methods.dispatchTransfer = function(userId, notes) {
  this.status = 'In Transit';
  this.dispatch.dispatchedBy = userId;
  this.dispatch.dispatchedAt = new Date();
  if (notes) this.dispatch.dispatchNotes = notes;
  return this.save();
};

// Instance method to receive transfer
stockTransferSchema.methods.receiveTransfer = function(userId, receivedItems, notes) {
  this.status = 'Delivered';
  this.receipt.receivedBy = userId;
  this.receipt.receivedAt = new Date();
  if (notes) this.receipt.receiptNotes = notes;
  
  // Update actual quantities and check for discrepancies
  if (receivedItems) {
    this.items.forEach(item => {
      const receivedItem = receivedItems.find(ri => ri.inventoryItem.toString() === item.inventoryItem.toString());
      if (receivedItem) {
        item.actualQuantity = receivedItem.actualQuantity;
        
        // Check for discrepancies
        if (item.actualQuantity !== item.requestedQuantity) {
          this.receipt.discrepancies.push({
            itemId: item.inventoryItem,
            productName: item.productName,
            expectedQuantity: item.requestedQuantity,
            receivedQuantity: item.actualQuantity,
            difference: item.actualQuantity - item.requestedQuantity,
            reason: receivedItem.discrepancyReason || 'Quantity mismatch'
          });
        }
      }
    });
  }
  
  return this.save();
};

// Instance method to complete transfer
stockTransferSchema.methods.completeTransfer = function() {
  this.status = 'Completed';
  this.transferDetails.actualDeliveryDate = new Date();
  return this.save();
};

export default mongoose.model('StockTransfer', stockTransferSchema);

