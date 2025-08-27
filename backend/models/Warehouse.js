const mongoose = require('mongoose');

const warehouseSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Warehouse name is required'],
    trim: true,
    maxlength: [100, 'Warehouse name cannot exceed 100 characters'],
    unique: true
  },
  code: {
    type: String,
    required: [true, 'Warehouse code is required'],
    trim: true,
    unique: true,
    uppercase: true,
    maxlength: [10, 'Warehouse code cannot exceed 10 characters']
  },
  address: {
    street: {
      type: String,
      required: [true, 'Street address is required'],
      trim: true
    },
    city: {
      type: String,
      required: [true, 'City is required'],
      trim: true
    },
    state: {
      type: String,
      required: [true, 'State is required'],
      trim: true
    },
    zipCode: {
      type: String,
      trim: true
    },
    country: {
      type: String,
      default: 'Pakistan',
      trim: true
    }
  },
  contact: {
    phone: {
      type: String,
      required: [true, 'Phone number is required'],
      trim: true
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email']
    },
    manager: {
      type: String,
      trim: true
    }
  },
  capacity: {
    total: {
      type: Number,
      required: [true, 'Total capacity is required'],
      min: [1, 'Capacity must be at least 1']
    },
    unit: {
      type: String,
      enum: ['tons', 'kg', 'bags', 'units'],
      default: 'tons'
    }
  },
  type: {
    type: String,
    enum: ['Production', 'Storage', 'Distribution', 'Mixed'],
    default: 'Mixed'
  },
  status: {
    type: String,
    enum: ['Active', 'Inactive', 'Maintenance'],
    default: 'Active'
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  location: {
    coordinates: {
      type: [Number], // [longitude, latitude]
      index: '2dsphere'
    },
    address: String
  },
  operatingHours: {
    open: {
      type: String,
      default: '08:00'
    },
    close: {
      type: String,
      default: '18:00'
    },
    days: {
      type: [String],
      enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
      default: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
    }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for full address
warehouseSchema.virtual('fullAddress').get(function() {
  const addr = this.address;
  return `${addr.street}, ${addr.city}, ${addr.state} ${addr.zipCode}, ${addr.country}`;
});

// Virtual for capacity display
warehouseSchema.virtual('capacityDisplay').get(function() {
  return `${this.capacity.total} ${this.capacity.unit}`;
});

// Indexes for better performance
warehouseSchema.index({ name: 1, code: 1, status: 1, type: 1 });
warehouseSchema.index({ 'address.city': 1, 'address.state': 1 });

// Pre-save middleware to ensure code is uppercase
warehouseSchema.pre('save', function(next) {
  if (this.isModified('code')) {
    this.code = this.code.toUpperCase();
  }
  next();
});

// Method to get warehouse summary
warehouseSchema.methods.getSummary = function() {
  return {
    id: this._id,
    name: this.name,
    code: this.code,
    type: this.type,
    status: this.status,
    city: this.address.city,
    capacity: this.capacityDisplay
  };
};

module.exports = mongoose.model('Warehouse', warehouseSchema);
