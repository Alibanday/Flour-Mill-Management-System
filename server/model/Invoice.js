import mongoose from "mongoose";

const invoiceSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ["government", "private", "bag", "bagsale"],
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
    required: function () {
      return this.type === "government" || this.type === "private";
    },
  },
  ratePerKg: {
    type: Number,
    required: function () {
      return this.type === "government" || this.type === "private";
    },
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
   seller: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Account",
  },
  buyer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Account",
    required: function() {
      return this.type === "bagsale" || this.type === "private";
    }
  },
  items: [
    {
      bagType: {
        type: String,
        enum: ["Ata", "Maida", "Suji", "Fine"],
      },
      weight: Number, // kg
      quantity: Number,
      pricePerBag: Number,
    },
  ],
  gatepass: {
    type: Boolean,
    default: false,
  },
  warehouse: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Warehouse",
  },
}, { timestamps: true });

const Invoice = mongoose.model("Invoice", invoiceSchema);
export default Invoice;
