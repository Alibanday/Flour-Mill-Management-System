import Stock from "../model/stock.js";
import Warehouse from "../model/wareHouse.js";


export const addStock = async (req, res) => {
  try {
    if (req.user.role !== "admin") return res.status(403).json({ message: "Only admin can add stock" });

    const stock = new Stock({ ...req.body, createdBy: req.user._id });
    await stock.save();
    res.status(201).json(stock);
  } catch (err) {
    res.status(500).json({ message: err.message });
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
    const stocks = await Stock.find().populate("createdBy", "name");
    res.json(stocks);
  } catch (err) {
    res.status(500).json({ message: err.message });
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
