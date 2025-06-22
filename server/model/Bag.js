import mongoose from "mongoose";

const bagSchema = new mongoose.Schema({
  bagName: { type: String, required: true },
  bagType: { type: String, enum: ["Ata", "Maida", "Suji", "Fine"], required: true },
  weight: { type: Number, required: true }, // kg
  quantity: { type: Number, required: true },
  pricePerBag: { type: Number },
  description: String,
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model("Bag", bagSchema); 