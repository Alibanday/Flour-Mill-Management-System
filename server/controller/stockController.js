import Stock from "../model/stock.js";
import Warehouse from "../model/wareHouse.js";


export const addStock = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Only admin can add stock" });
    }

    const {
      sellerName,
      sellerDescription,
      itemName,
      itemType,
      quantity,  // This should be { value, unit }
      subType,
      itemDescription,
      date,
      warehouse
    } = req.body;

    // Validate quantity structure
    if (!quantity || typeof quantity.value !== "number") {
      return res.status(400).json({ message: "Quantity with value is required" });
    }

    const stock = new Stock({
      sellerName,
      sellerDescription,
      itemName,
      itemType,
      quantity,
      subType,
      itemDescription,
      date: date || new Date(),
      warehouse,
      createdBy: req.user._id,
    });

    await stock.save();
    res.status(201).json(stock);
  } catch (err) {
    console.error("Add stock error:", err);
    res.status(500).json({ message: "Error adding stock", error: err.message });
  }
};


export const updateStock = async (req, res) => {
  try {
    const stock = await Stock.findById(req.params.id);
    if (!stock) return res.status(404).json({ message: "Stock not found" });

    if (req.user.role !== "admin") return res.status(403).json({ message: "Only admin can update stock" });

    Object.assign(stock, req.body);
    await stock.save();
    res.json(stock);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const deleteStock = async (req, res) => {
  try {
    const stock = await Stock.findById(req.params.id);
    if (!stock) return res.status(404).json({ message: "Stock not found" });

    if (req.user.role !== "admin") return res.status(403).json({ message: "Only admin can delete stock" });

    await stock.remove();
    res.json({ message: "Stock deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
export const getAllStocks = async (req, res) => {
  try {
    const { page = 1, limit = 10, search = "" } = req.query;

    const skip = (Number(page) - 1) * Number(limit);

    const filter = {
      $or: [
        { itemName: { $regex: search, $options: "i" } },
        { itemType: { $regex: search, $options: "i" } },
        { subType: { $regex: search, $options: "i" } },
        { sellerName: { $regex: search, $options: "i" } },
        { sellerDescription: { $regex: search, $options: "i" } }
      ]
    };

    const [stocks, total] = await Promise.all([
      Stock.find(filter).skip(skip).limit(Number(limit)).sort({ createdAt: -1 }),
      Stock.countDocuments(filter)
    ]);

    res.status(200).json({
      stocks,
      total,
      currentPage: Number(page),
      totalPages: Math.ceil(total / limit),
    });
  } catch (err) {
    console.error("Failed to fetch stock:", err);
    res.status(500).json({ message: "Error retrieving stock data" });
  }
};

export const searchStock = async (req, res) => {
  try {
    const query = req.query.q;
    const stocks = await Stock.find({
      $or: [
        { sellerName: { $regex: query, $options: "i" } },
        { itemName: { $regex: query, $options: "i" } }
      ]
    });
    res.json(stocks);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getStockById = async (req, res) => {
  try {
    const stock = await Stock.findById(req.params.id);
    if (!stock) return res.status(404).json({ message: "Stock not found" });
    res.json(stock);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const transferStockToWarehouse = async (req, res) => {
  try {
    const { warehouseId, transferQuantity } = req.body;
    const stock = await Stock.findById(req.params.id);

    if (!stock) return res.status(404).json({ message: "Stock not found" });
    if (stock.itemQuantity < transferQuantity) return res.status(400).json({ message: "Not enough stock to transfer" });

    const warehouse = await Warehouse.findById(warehouseId);
    if (!warehouse || warehouse.status !== "Active") return res.status(400).json({ message: "Invalid or inactive warehouse" });

    stock.itemQuantity -= transferQuantity;
    await stock.save();

    res.json({ message: `Transferred ${transferQuantity} units to warehouse ${warehouse.name}`, stock });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
