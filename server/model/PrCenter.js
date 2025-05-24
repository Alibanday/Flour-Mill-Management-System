import mongoose from "mongoose";

const prCenterSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  location: {
    type: String,
    required: true,
    trim: true
  },
  contact: {
    type: String,
    required: true,
    trim: true
  },
}, {
  timestamps: true
});

const PrCenter = mongoose.model("PrCenter", prCenterSchema);
export default PrCenter;
