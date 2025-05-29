import Invoice from "../model/Invoice.js";

// 🔍 Get All Invoices with Pagination + Search
export const getAllInvoices = async (req, res) => {
  try {
    const { page = 1, limit = 10, search = "", type } = req.query;

    const query = {
      $and: [
        {
          $or: [
            { sellerName: { $regex: search, $options: "i" } },
            { description: { $regex: search, $options: "i" } },
            { sellerDescription: { $regex: search, $options: "i" } },
          ],
        },
      ],
    };

    // If `type` is provided, add it to query
    if (type) {
      query.$and.push({ type: { $regex: type, $options: "i" } }); // case-insensitive
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

// ✅ Create Invoice (Admin or Sales Manager)
export const createInvoice = async (req, res) => {
  try {
    const invoice = new Invoice(req.body);
    await invoice.save();
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
