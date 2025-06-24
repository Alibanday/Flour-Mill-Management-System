import Invoice from "../model/Invoice.js";
import Stock from "../model/stock.js";
import Account from "../model/Account.js";

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
      .populate("warehouse", "name location")
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
    const invoice = await Invoice.findById(req.params.id)
      .populate("prCenter", "name location")
      .populate("warehouse", "name location");
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

// helper to update wheat stock
const adjustWheatStock = async (warehouseId, wheatQuantity, description = "Government Purchase") => {
  if (!warehouseId || !wheatQuantity) {
    console.log("adjustWheatStock: Missing warehouseId or wheatQuantity", { warehouseId, wheatQuantity });
    return;
  }
  
  console.log("adjustWheatStock: Adding wheat stock", { warehouseId, wheatQuantity, description });
  
  const filter = {
    warehouse: warehouseId,
    itemName: "Wheat",
    itemType: "wheat",
  };
  
  let stock = await Stock.findOne(filter);
  const quantity = Number(wheatQuantity);
  
  if (!stock) {
    console.log("adjustWheatStock: Creating new wheat stock entry");
    stock = new Stock({
      ...filter,
      sellerName: "Government",
      sellerDescription: description,
      quantity: { value: quantity, unit: "kg" },
      date: new Date(),
      itemDescription: "Wheat from government purchase",
    });
  } else {
    console.log("adjustWheatStock: Updating existing wheat stock", { 
      currentQuantity: stock.quantity.value, 
      addingQuantity: quantity,
      newTotal: stock.quantity.value + quantity 
    });
    stock.quantity.value = (stock.quantity.value || 0) + quantity;
    stock.date = new Date(); // Update the date to reflect latest addition
  }
  
  await stock.save();
  console.log("adjustWheatStock: Wheat stock updated successfully", { 
    warehouseId, 
    finalQuantity: stock.quantity.value 
  });
};

// ✅ Create Invoice (Admin or Sales Manager)
export const createInvoice = async (req, res) => {
  try {
    const { buyer, totalAmount, type, status } = req.body;
    
    // Only validate buyer for invoice types that require it
    if (type === "bagsale" || type === "private") {
      if (!buyer) return res.status(400).json({ message: "Buyer (account) is required" });

      // Fetch buyer account
      const account = await Account.findById(buyer);
      if (!account) return res.status(404).json({ message: "Account not found" });

      // Calculate outstanding (sum of remainingAmount for all unpaid invoices)
      const unpaidInvoices = await Invoice.find({ buyer, status: { $in: ["pending", "overdue"] } });
      const outstanding = unpaidInvoices.reduce((sum, inv) => sum + (inv.remainingAmount || 0), 0);
      const creditLimit = account.creditLimit || 0;
      const remainingAmount = req.body.remainingAmount || 0;
      if ((outstanding + remainingAmount) > creditLimit) {
        return res.status(400).json({ message: `Credit limit exceeded. Outstanding: Rs. ${outstanding}, New Remaining: Rs. ${remainingAmount}, Credit Limit: Rs. ${creditLimit}` });
      }
    }

    const invoice = new Invoice(req.body);
    await invoice.save();

    // Only adjust stock if status is "completed"
    if (status === "completed") {
      // Auto adjust stock for bag purchases / sales
      if (invoice.type === "bag" && invoice.warehouse) {
        await adjustBagStock(invoice.warehouse, invoice.items || [], true);
      }
      if (invoice.type === "bagsale" && invoice.warehouse) {
        await adjustBagStock(invoice.warehouse, invoice.items || [], false);
      }
      
      // Auto adjust wheat stock for government purchases
      if (invoice.type === "government" && invoice.warehouse && invoice.wheatQuantity) {
        await adjustWheatStock(invoice.warehouse, invoice.wheatQuantity, invoice.description);
      }
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

// 🔄 Update Invoice Status and Handle Stock Adjustment
export const updateInvoiceStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const { id } = req.params;

    // Get the current invoice
    const currentInvoice = await Invoice.findById(id);
    if (!currentInvoice) {
      return res.status(404).json({ message: "Invoice not found" });
    }

    // Update the invoice status
    const updatedInvoice = await Invoice.findByIdAndUpdate(
      id, 
      { status }, 
      { new: true }
    );

    // If status is changing to "completed" and it was previously "pending"
    if (status === "completed" && currentInvoice.status === "pending") {
      // Adjust stock for government purchases
      if (updatedInvoice.type === "government" && updatedInvoice.warehouse && updatedInvoice.wheatQuantity) {
        await adjustWheatStock(updatedInvoice.warehouse, updatedInvoice.wheatQuantity, updatedInvoice.description);
      }
      
      // Adjust stock for bag purchases
      if (updatedInvoice.type === "bag" && updatedInvoice.warehouse) {
        await adjustBagStock(updatedInvoice.warehouse, updatedInvoice.items || [], true);
      }
      
      // Adjust stock for bag sales
      if (updatedInvoice.type === "bagsale" && updatedInvoice.warehouse) {
        await adjustBagStock(updatedInvoice.warehouse, updatedInvoice.items || [], false);
      }
    }

    res.status(200).json({ 
      message: "Invoice status updated successfully", 
      invoice: updatedInvoice 
    });
  } catch (err) {
    console.error("Update Invoice Status Error:", err);
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

// Get all invoices for a specific account (buyer)
export const getInvoicesByAccount = async (req, res) => {
  try {
    const { accountId } = req.params;
    const invoices = await Invoice.find({ buyer: accountId }).sort({ date: -1 });
    res.status(200).json({ invoices });
  } catch (err) {
    console.error("Get Invoices By Account Error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// Get dashboard statistics
export const getDashboardStats = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Cash in hand - sum of today's cash sales (bagsale invoices with cash payment)
    const cashInHand = await Invoice.aggregate([
      {
        $match: {
          type: "bagsale",
          paymentMethod: "cash",
          date: { $gte: today, $lt: tomorrow }
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: "$initialPayment" }
        }
      }
    ]);

    // Total Debit - sum of all pending/overdue remaining amounts (money owed to us)
    const totalDebit = await Invoice.aggregate([
      {
        $match: {
          status: { $in: ["pending", "overdue"] }
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: "$remainingAmount" }
        }
      }
    ]);

    // Total Credit - sum of all accounts' credit limits
    const totalCredit = await Account.aggregate([
      {
        $group: {
          _id: null,
          total: { $sum: { $ifNull: ["$creditLimit", 0] } }
        }
      }
    ]);

    res.status(200).json({
      cashInHand: cashInHand[0]?.total || 0,
      totalDebit: totalDebit[0]?.total || 0,
      totalCredit: totalCredit[0]?.total || 0
    });
  } catch (err) {
    console.error("Get Dashboard Stats Error:", err);
    res.status(500).json({ message: "Server error" });
  }
};
