import mongoose from "mongoose";

const invoiceSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ["government", "private"],
    required: true,
  },
  paymentMethod: {
    type: String,
    enum: ["cash", "bank"],
    required: true,
  },
  initialPayment: {
    type: Number,
    default: 0,
  },
  description: String,
  wheatQuantity: {
    type: Number,
    required: true,
  },
  ratePerKg: {
    type: Number,
    required: true,
  },
  totalAmount: {
    type: Number,
    required: true,
  },
  remainingAmount: {
    type: Number,
    required: true,
  },
  date: {
    type: Date,
    default: Date.now,
  },
  status: {
    type: String,
    enum: ["pending", "completed"],
    default: "pending",
  },
  prCenter: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "PrCenter",
  },
  sellerName: String,
  sellerDescription: String,
}, { timestamps: true });

const Invoice = mongoose.model("Invoice", invoiceSchema);
export default Invoice;
