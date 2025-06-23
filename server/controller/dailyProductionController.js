import DailyProduction from "../model/DailyProduction.js";
import Stock from "../model/stock.js";

// Helper to adjust stock values
const adjustStock = async ({ warehouseId, itemName, itemType, subType, delta }) => {
  if (!warehouseId) return;
  const filter = { warehouse: warehouseId, itemName, itemType, subType };
  let stock = await Stock.findOne(filter);
  if (!stock) {
    if (delta < 0) return; // cannot deduct
    stock = new Stock({
      ...filter,
      quantity: { value: delta, unit: itemType === "wheat" ? "kg" : "bags" },
      date: new Date(),
      sellerName: "production", // placeholder
    });
  } else {
    stock.quantity.value = (stock.quantity.value || 0) + delta;
    if (stock.quantity.value < 0) stock.quantity.value = 0;
  }
  await stock.save();
};

export const createDailyProduction = async (req, res) => {
  try {
    const {
      productionId,
      date,
      wheatWarehouse,
      grindingDetails,
      productionItems,
      outputWarehouse,
    } = req.body;

    // Calculate totals
    const totalWheatUsed = grindingDetails.reduce((acc, g) => acc + Number(g.quantity || 0), 0);
    const grossWeightExcludingBran = productionItems.reduce((acc, p) => {
      if (p.item.toLowerCase() === "bran") return acc;
      return acc + Number(p.bagWeight || 0) * Number(p.bagQty || 0);
    }, 0);

    // Compute gross for each item
    const itemsWithGross = productionItems.map((p) => ({
      ...p,
      grossWeight: Number(p.bagWeight || 0) * Number(p.bagQty || 0),
    }));

    const doc = new DailyProduction({
      productionId,
      date,
      wheatWarehouse,
      grindingDetails,
      productionItems: itemsWithGross,
      outputWarehouse,
      totalWheatUsed,
      grossWeightExcludingBran,
      createdBy: req.user?._id,
    });
    await doc.save();

    // Update wheat stock (deduct)
    await adjustStock({
      warehouseId: wheatWarehouse,
      itemName: "wheat",
      itemType: "wheat",
      subType: null,
      delta: -totalWheatUsed,
    });

    // Add finished goods stock per item except bran
    for (const p of itemsWithGross) {
      const delta = Number(p.bagQty || 0);
      const subType = `${p.bagWeight}kg`;
      await adjustStock({
        warehouseId: outputWarehouse,
        itemName: p.item.toLowerCase(),
        itemType: "bags",
        subType,
        delta,
      });
    }

    res.status(201).json({ message: "Daily production recorded", production: doc });
  } catch (err) {
    console.error("Create daily production error", err);
    res.status(500).json({ message: "Server error" });
  }
};

export const getDailyProductions = async (req, res) => {
  try {
    const { page = 1, limit = 10, search = "" } = req.query;
    const filter = {};
    if (search) {
      filter.$or = [
        { productionId: { $regex: search, $options: "i" } },
      ];
    }
    const total = await DailyProduction.countDocuments(filter);
    const list = await DailyProduction.find(filter)
      .populate("wheatWarehouse", "name")
      .populate("outputWarehouse", "name")
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .sort({ createdAt: -1 });
    res.status(200).json({ total, page: Number(page), totalPages: Math.ceil(total / limit), productions: list });
  } catch (err) {
    console.error("Get productions error", err);
    res.status(500).json({ message: "Server error" });
  }
};

export const getDailyProductionById = async (req, res) => {
  try {
    const doc = await DailyProduction.findById(req.params.id)
      .populate("wheatWarehouse", "name")
      .populate("outputWarehouse", "name");
    if (!doc) return res.status(404).json({ message: "Not found" });
    res.status(200).json(doc);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
}; 