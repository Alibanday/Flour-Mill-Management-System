import mongoose from "mongoose";

const damageReportSchema = new mongoose.Schema({
  // Reference to inventory item
  inventoryItem: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Inventory',
    required: true
  },
  
  // Reference to warehouse
  warehouse: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Warehouse',
    required: true
  },
  
  // Quantity damaged
  quantityDamaged: {
    type: Number,
    required: true,
    min: 0
  },
  
  // Reason for damage
  reason: {
    type: String,
    required: true,
    enum: [
      'Water Damage',
      'Fire Damage',
      'Physical Damage',
      'Expired/Expired',
      'Contamination',
      'Pest Damage',
      'Temperature Damage',
      'Handling Error',
      'Transportation Damage',
      'Other'
    ]
  },
  
  // Detailed description
  description: {
    type: String,
    required: true,
    maxlength: 500
  },
  
  // Damage severity
  severity: {
    type: String,
    required: true,
    enum: ['Low', 'Medium', 'High', 'Critical'],
    default: 'Medium'
  },
  
  // Status of the damage report
  status: {
    type: String,
    enum: ['Reported', 'Under Review', 'Approved', 'Rejected', 'Resolved'],
    default: 'Reported'
  },
  
  // Estimated financial impact
  estimatedLoss: {
    type: Number,
    min: 0,
    default: 0
  },
  
  // Currency for estimated loss
  currency: {
    type: String,
    default: 'PKR'
  },
  
  // Photos or evidence (URLs)
  evidencePhotos: [String],
  
  // Reported by (warehouse manager)
  reportedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // Reviewed by (admin or general manager)
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  // Review notes
  reviewNotes: String,
  
  // Resolution notes
  resolutionNotes: String,
  
  // Date when damage occurred (if known)
  damageDate: {
    type: Date,
    default: Date.now
  },
  
  // Date when report was reviewed
  reviewedAt: Date,
  
  // Date when report was resolved
  resolvedAt: Date
}, {
  timestamps: true
});

// Indexes for better performance
damageReportSchema.index({ warehouse: 1, status: 1 });
damageReportSchema.index({ reportedBy: 1 });
damageReportSchema.index({ createdAt: -1 });
damageReportSchema.index({ damageDate: -1 });

// Virtual for total estimated loss with currency
damageReportSchema.virtual('estimatedLossDisplay').get(function() {
  if (!this.estimatedLoss || this.estimatedLoss === 0) return 'Not estimated';
  return `${this.estimatedLoss} ${this.currency}`;
});

// Virtual for days since damage occurred
damageReportSchema.virtual('daysSinceDamage').get(function() {
  const now = new Date();
  const damageDate = this.damageDate || this.createdAt;
  const diffTime = Math.abs(now - damageDate);
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

// Pre-save middleware to calculate estimated loss if not provided
damageReportSchema.pre('save', async function(next) {
  try {
    // If estimated loss is not provided, calculate it based on inventory item cost
    if (!this.estimatedLoss || this.estimatedLoss === 0) {
      const Inventory = mongoose.model('Inventory');
      const inventoryItem = await Inventory.findById(this.inventoryItem);
      
      if (inventoryItem && inventoryItem.cost && inventoryItem.cost.purchasePrice) {
        this.estimatedLoss = this.quantityDamaged * inventoryItem.cost.purchasePrice;
        this.currency = inventoryItem.cost.currency || 'PKR';
      }
    }
    
    next();
  } catch (error) {
    next(error);
  }
});

// Methods
damageReportSchema.methods.canBeEdited = function() {
  return this.status === 'Reported' || this.status === 'Under Review';
};

damageReportSchema.methods.canBeApproved = function() {
  return this.status === 'Under Review';
};

damageReportSchema.methods.canBeRejected = function() {
  return this.status === 'Under Review';
};

damageReportSchema.methods.canBeResolved = function() {
  return this.status === 'Approved';
};

// Statics
damageReportSchema.statics.getReportsByWarehouse = function(warehouseId) {
  return this.find({ warehouse: warehouseId })
    .populate('inventoryItem', 'name code category currentStock')
    .populate('reportedBy', 'firstName lastName email')
    .populate('reviewedBy', 'firstName lastName email')
    .sort({ createdAt: -1 });
};

damageReportSchema.statics.getReportsByStatus = function(status) {
  return this.find({ status })
    .populate('inventoryItem', 'name code category')
    .populate('warehouse', 'name warehouseNumber')
    .populate('reportedBy', 'firstName lastName email')
    .sort({ createdAt: -1 });
};

damageReportSchema.statics.getPendingReports = function() {
  return this.find({ status: { $in: ['Reported', 'Under Review'] } })
    .populate('inventoryItem', 'name code category')
    .populate('warehouse', 'name warehouseNumber')
    .populate('reportedBy', 'firstName lastName email')
    .sort({ createdAt: -1 });
};

const DamageReport = mongoose.model('DamageReport', damageReportSchema);

export default DamageReport;
