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
  productionId: { type: String, unique: true },
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

// Auto-generate productionId
dailyProductionSchema.pre('validate', async function(next){
  if(this.productionId) return next();
  try {
    const last = await this.constructor.findOne().sort({ createdAt: -1 }).select('productionId');
    let nextNum = 1;
    if(last && last.productionId){
      const num = parseInt(last.productionId,10);
      if(!isNaN(num)) nextNum = num + 1;
    }
    this.productionId = String(nextNum).padStart(3,'0');
    next();
  } catch(err){
    next(err);
  }
});

const DailyProduction = mongoose.model("DailyProduction", dailyProductionSchema);
export default DailyProduction; 