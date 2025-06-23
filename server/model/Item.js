import mongoose from 'mongoose';

const itemSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  category: {
    type: String,
    required: true,
    enum: ['wheat', 'bags'],
    lowercase: true
  },
  weight: {
    type: Number,
    required: function() {
      return this.category === 'bags';
    },
    enum: [10, 15, 20, 40, 80]
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  description: {
    type: String,
    trim: true,
    default: ''
  }
}, {
  timestamps: true
});

// Compound index to ensure unique combination of name, category, and weight
itemSchema.index({ name: 1, category: 1, weight: 1 }, { unique: true });

// Virtual for price unit
itemSchema.virtual('priceUnit').get(function() {
  return this.category === 'wheat' ? 'per kg' : 'per bag';
});

// Method to get display name
itemSchema.methods.getDisplayName = function() {
  if (this.category === 'bags') {
    return `${this.name} (${this.weight} kg)`;
  }
  return this.name;
};

export default mongoose.model('Item', itemSchema); 