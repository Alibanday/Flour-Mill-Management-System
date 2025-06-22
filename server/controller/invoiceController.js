import Invoice from "../model/Invoice.js";
import Stock from "../model/stock.js";

// 🔍 Get All Invoices with Pagination + Search
export const getAllInvoices = async (req, res) => {
  try {
    const { page = 1, limit = 10, search = "", type, status, startDate, endDate } = req.query;

    const query = {};

    if (search) {
      query.$or = [
        { sellerName: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
        { sellerDescription: { $regex: search, $options: "i" } },
      ];
    }

    if (type) {
      query.type = { $regex: type, $options: "i" };
    }

    if (status) {
      query.status = { $regex: status, $options: "i" };
    }

    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }

    const total = await Invoice.countDocuments(query);
    const invoices = await Invoice.find(query)
      .populate("prCenter", "name location")
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .sort({ createdAt: -1 });

    res.status(200).json({
      total,
      page: Number(page),
      totalPages: Math.ceil(total / limit),
      limit: Number(limit),
      invoices,
    });
  } catch (err) {
    console.error("Get Invoices Error:", err);
    res.status(500).json({ message: "Server error" });
  }
};


// 🔍 Get Invoice by ID
export const getInvoiceById = async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id).populate("prCenter");
    if (!invoice) return res.status(404).json({ message: "Invoice not found" });

    res.status(200).json(invoice);
  } catch (err) {
    console.error("Get Invoice by ID Error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// helper to update bag stock
const adjustBagStock = async (warehouseId, items, isPurchase) => {
  if (!warehouseId) return;
  for (const it of items) {
    const filter = {
      warehouse: warehouseId,
      itemName: it.bagType,
      itemType: "bags",
      subType: `${it.weight}kg`,
    };
    let stock = await Stock.findOne(filter);
    const delta = (isPurchase ? 1 : -1) * Number(it.quantity || 0);
    if (!stock) {
      if (delta < 0) continue; // cannot deduct
      stock = new Stock({
        ...filter,
        quantity: { value: delta, unit: "bags" },
        date: new Date(),
      });
    } else {
      stock.quantity.value = (stock.quantity.value || 0) + delta;
      if (stock.quantity.value < 0) stock.quantity.value = 0;
    }
    await stock.save();
  }
};

// ✅ Create Invoice (Admin or Sales Manager)
export const createInvoice = async (req, res) => {
  try {
    const invoice = new Invoice(req.body);
    await invoice.save();

    // Auto adjust stock for bag purchases / sales
    if (invoice.type === "bag" && invoice.warehouse) {
      await adjustBagStock(invoice.warehouse, invoice.items || [], true);
    }
    if (invoice.type === "bagsale" && invoice.warehouse) {
      await adjustBagStock(invoice.warehouse, invoice.items || [], false);
    }

    res.status(201).json({ message: "Invoice created", invoice });
  } catch (err) {
    console.error("Create Invoice Error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// ✏️ Update Invoice (Admin or Sales Manager)
export const updateInvoice = async (req, res) => {
  try {
    const invoice = await Invoice.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    if (!invoice) return res.status(404).json({ message: "Invoice not found" });

    res.status(200).json({ message: "Invoice updated", invoice });
  } catch (err) {
    console.error("Update Invoice Error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// ❌ Delete Invoice (Admin or Sales Manager)
export const deleteInvoice = async (req, res) => {
  try {
    const invoice = await Invoice.findByIdAndDelete(req.params.id);
    if (!invoice) return res.status(404).json({ message: "Invoice not found" });

    res.status(200).json({ message: "Invoice deleted" });
  } catch (err) {
    console.error("Delete Invoice Error:", err);
    res.status(500).json({ message: "Server error" });
  }
};
