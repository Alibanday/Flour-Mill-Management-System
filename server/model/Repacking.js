import mongoose from 'mongoose';

const repackingSchema = new mongoose.Schema({
  repackingNumber: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  batchNumber: {
    type: String,
    required: true,
    index: true
  },
  sourceProduct: {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Inventory',
      required: true
    },
    productName: {
      type: String,
      required: true
    },
    currentQuantity: {
      type: Number,
      required: true,
      min: 0
    },
    currentUnit: {
      type: String,
      required: true
    },
    currentWeight: {
      type: Number,
      required: true,
      min: 0
    }
  },
  targetProducts: [{
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Inventory',
      required: true
    },
    productName: {
      type: String,
      required: true
    },
    targetQuantity: {
      type: Number,
      required: true,
      min: 0
    },
    targetUnit: {
      type: String,
      required: true
    },
    targetWeight: {
      type: Number,
      required: true,
      min: 0
    },
    bagType: {
      type: String,
      enum: ['ATA', 'MAIDA', 'SUJI', 'FINE', 'CUSTOM'],
      required: true
    },
    bagSize: {
      type: String,
      required: true // e.g., "1kg", "5kg", "10kg", "25kg"
    }
  }],
  warehouse: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Warehouse',
    required: true
  },
  repackingDetails: {
    repackingDate: {
      type: Date,
      required: true,
      default: Date.now
    },
    repackingTime: {
      startTime: { type: Date },
      endTime: { type: Date },
      duration: { type: Number } // in minutes
    },
    repackingType: {
      type: String,
      enum: ['Bulk to Bags', 'Bag Size Change', 'Quality Separation', 'Custom'],
      required: true
    },
    reason: {
      type: String,
      required: true,
      trim: true
    }
  },
  qualityControl: {
    preRepackingWeight: {
      type: Number,
      required: true,
      min: 0
    },
    postRepackingWeight: {
      type: Number,
      required: true,
      min: 0
    },
    weightDifference: {
      type: Number,
      default: 0
    },
    qualityCheck: {
      type: String,
      enum: ['Passed', 'Failed', 'Pending'],
      default: 'Pending'
    },
    qualityNotes: {
      type: String,
      trim: true
    },
    checkedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    checkedAt: {
      type: Date
    }
  },
  wastage: {
    totalWastage: {
      type: Number,
      default: 0,
      min: 0
    },
    wastagePercentage: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },
    wastageReason: {
      type: String,
      trim: true
    },
    wastageType: {
      type: String,
      enum: ['Normal', 'Excessive', 'Contamination', 'Spillage', 'Other'],
      default: 'Normal'
    }
  },
  costCalculation: {
    laborCost: {
      type: Number,
      default: 0,
      min: 0
    },
    materialCost: {
      type: Number,
      default: 0,
      min: 0
    },
    overheadCost: {
      type: Number,
      default: 0,
      min: 0
    },
    totalCost: {
      type: Number,
      default: 0,
      min: 0
    },
    costPerUnit: {
      type: Number,
      default: 0,
      min: 0
    }
  },
  status: {
    type: String,
    enum: ['Pending', 'In Progress', 'Completed', 'Quality Check', 'Approved', 'Rejected'],
    default: 'Pending'
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  approvedAt: {
    type: Date
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

// Virtual for total target quantity
repackingSchema.virtual('totalTargetQuantity').get(function() {
  return this.targetProducts.reduce((total, product) => total + product.targetQuantity, 0);
});

// Virtual for total target weight
repackingSchema.virtual('totalTargetWeight').get(function() {
  return this.targetProducts.reduce((total, product) => total + product.targetWeight, 0);
});

// Virtual for efficiency percentage
repackingSchema.virtual('efficiencyPercentage').get(function() {
  if (this.qualityControl.preRepackingWeight === 0) return 0;
  return ((this.qualityControl.postRepackingWeight / this.qualityControl.preRepackingWeight) * 100).toFixed(2);
});

// Pre-save middleware to calculate weight difference and wastage
repackingSchema.pre('save', function(next) {
  if (this.qualityControl.preRepackingWeight && this.qualityControl.postRepackingWeight) {
    this.qualityControl.weightDifference = this.qualityControl.preRepackingWeight - this.qualityControl.postRepackingWeight;
    
    if (this.qualityControl.preRepackingWeight > 0) {
      this.wastage.wastagePercentage = ((this.qualityControl.weightDifference / this.qualityControl.preRepackingWeight) * 100).toFixed(2);
    }
  }
  
  // Calculate total cost
  this.costCalculation.totalCost = this.costCalculation.laborCost + this.costCalculation.materialCost + this.costCalculation.overheadCost;
  
  // Calculate cost per unit
  if (this.totalTargetQuantity > 0) {
    this.costCalculation.costPerUnit = this.costCalculation.totalCost / this.totalTargetQuantity;
  }
  
  next();
});

// Indexes for better performance
repackingSchema.index({ repackingNumber: 1 });
repackingSchema.index({ batchNumber: 1 });
repackingSchema.index({ 'sourceProduct.productId': 1 });
repackingSchema.index({ warehouse: 1 });
repackingSchema.index({ status: 1 });
repackingSchema.index({ 'repackingDetails.repackingDate': -1 });
repackingSchema.index({ createdBy: 1 });

// Static method to generate repacking number
repackingSchema.statics.generateRepackingNumber = async function() {
  const count = await this.countDocuments();
  return `REP${String(count + 1).padStart(6, '0')}`;
};

// Static method to get repacking statistics
repackingSchema.statics.getRepackingStats = async function(startDate, endDate) {
  const pipeline = [
    {
      $match: {
        'repackingDetails.repackingDate': {
          $gte: new Date(startDate),
          $lte: new Date(endDate)
        }
      }
    },
    {
      $group: {
        _id: null,
        totalRepackings: { $sum: 1 },
        totalWastage: { $sum: '$wastage.totalWastage' },
        averageWastagePercentage: { $avg: '$wastage.wastagePercentage' },
        totalCost: { $sum: '$costCalculation.totalCost' },
        averageEfficiency: { $avg: '$efficiencyPercentage' }
      }
    }
  ];
  
  return await this.aggregate(pipeline);
};

// Instance method to start repacking
repackingSchema.methods.startRepacking = function(userId) {
  this.status = 'In Progress';
  this.assignedTo = userId;
  this.repackingDetails.repackingTime.startTime = new Date();
  return this.save();
};

// Instance method to complete repacking
repackingSchema.methods.completeRepacking = function(qualityData) {
  this.status = 'Quality Check';
  this.repackingDetails.repackingTime.endTime = new Date();
  
  if (this.repackingDetails.repackingTime.startTime) {
    this.repackingDetails.repackingTime.duration = 
      (this.repackingDetails.repackingTime.endTime - this.repackingDetails.repackingTime.startTime) / (1000 * 60);
  }
  
  if (qualityData) {
    this.qualityControl = { ...this.qualityControl, ...qualityData };
  }
  
  return this.save();
};

// Instance method to approve repacking
repackingSchema.methods.approveRepacking = function(userId, notes) {
  this.status = 'Approved';
  this.approvedBy = userId;
  this.approvedAt = new Date();
  if (notes) this.notes = notes;
  return this.save();
};

export default mongoose.model('Repacking', repackingSchema);

