import mongoose from "mongoose";

const grindingSchema = new mongoose.Schema({
  wheatType: { type: String, required: true },
  quantity: { type: Number, required: true }
}, { _id: false });

const productItemSchema = new mongoose.Schema({
  item: { type: String, required: true },
  bagWeight: { type: Number, required: true },
  bagQty: { type: Number, required: true },
  grossWeight: { type: Number, required: true }
}, { _id: false });

const dailyProductionSchema = new mongoose.Schema({
  productionId: { type: String, required: true, unique: true },
  date: { type: Date, required: true },
  wheatWarehouse: { type: mongoose.Schema.Types.ObjectId, ref: "Warehouse", required: true },
  grindingDetails: [grindingSchema],
  productionItems: [productItemSchema],
  outputWarehouse: { type: mongoose.Schema.Types.ObjectId, ref: "Warehouse", required: true },
  totalWheatUsed: { type: Number },
  grossWeightExcludingBran: { type: Number },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  createdAt: { type: Date, default: Date.now }
});

const DailyProduction = mongoose.model("DailyProduction", dailyProductionSchema);
export default DailyProduction; 