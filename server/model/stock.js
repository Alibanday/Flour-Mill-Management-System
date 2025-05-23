import mongoose from "mongoose";

const stockSchema = new mongoose.Schema({
  sellerName: { type: String, required: true },
  sellerDescription: String,
  itemName: { type: String, required: true },
  itemType: { 
    type: String, 
    required: true,
    enum: ['wheat', 'bags']
  },
  quantity: {
    value: { type: Number, required: true },
    unit: { type: String, required: false }
  },
  subType: {
    type: String,
    enum: ['flour', 'mada', 'choker', 'suji', 'fine', null],
    default: null
  },
  description: String,
  date: { type: Date, required: true },
  warehouse: { type: mongoose.Schema.Types.ObjectId, ref: 'Warehouse' },
  createdAt: { type: Date, default: Date.now }
});

const Stock = mongoose.model('Stock', stockSchema);;

export default Stock;