// models/Warehouse.js

import mongoose from "mongoose";

const warehouseSchema = new mongoose.Schema({
  warehouseNumber: {
    type: String,
    required: false, // Auto-generated, not required in input
    unique: true,
    trim: true,
    uppercase: true
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
  // Warehouse manager assignment
  manager: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false
  },
  // Warehouse capacity and storage info
  capacity: {
    totalCapacity: {
      type: Number,
      min: 0,
      required: true
    },
    unit: {
      type: String,
      enum: ['tons', 'quintals', '50kg bags', '25kg bags', '10kg bags', '5kg bags', '100kg sacks', '50kg sacks', '25kg sacks'],
      default: '50kg bags'
    },
    currentUsage: {
      type: Number,
      default: 0,
      min: 0
    }
  },
  // Warehouse contact information
  contact: {
    phone: String,
    email: String,
    address: {
      street: String,
      city: String,
      state: String,
      zipCode: String,
      country: {
        type: String,
        default: 'Pakistan'
      }
    }
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Pre-save middleware to auto-generate warehouse number
warehouseSchema.pre('save', async function(next) {
  try {
    // Always generate a new warehouse number if not provided
    if (!this.warehouseNumber) {
      let attempts = 0;
      const maxAttempts = 10;
      let warehouseNumber;
      
      do {
        const timestamp = Date.now().toString().slice(-6);
        const randomSuffix = Math.random().toString(36).substring(2, 4).toUpperCase();
        warehouseNumber = `WH${timestamp}${randomSuffix}`;
        
        attempts++;
        
        // Check if warehouse number already exists
        const existingWarehouse = await mongoose.model('Warehouse').findOne({ warehouseNumber });
        if (!existingWarehouse) {
          break;
        }
        
        if (attempts >= maxAttempts) {
          throw new Error('Unable to generate unique warehouse number after maximum attempts');
        }
      } while (attempts < maxAttempts);
      
      this.warehouseNumber = warehouseNumber;
      console.log('Generated unique warehouse number:', this.warehouseNumber);
    }
    next();
  } catch (error) {
    console.error('Error generating warehouse number:', error);
    next(error);
  }
});

// Virtual for capacity status
warehouseSchema.virtual("capacityStatus").get(function() {
  if (!this.capacity || !this.capacity.totalCapacity) return "Unknown";
  const usagePercentage = (this.capacity.currentUsage / this.capacity.totalCapacity) * 100;
  if (usagePercentage >= 100) return "Full";
  if (usagePercentage >= 90) return "Near Full";
  if (usagePercentage >= 75) return "High Usage";
  return "Available";
});

// Virtual for available capacity
warehouseSchema.virtual("availableCapacity").get(function() {
  if (!this.capacity || !this.capacity.totalCapacity) return 0;
  return Math.max(0, this.capacity.totalCapacity - this.capacity.currentUsage);
});

// Virtual for capacity percentage
warehouseSchema.virtual("capacityPercentage").get(function() {
  if (!this.capacity || !this.capacity.totalCapacity) return 0;
  return Math.round((this.capacity.currentUsage / this.capacity.totalCapacity) * 100);
});

export default mongoose.model("Warehouse", warehouseSchema);
