import Purchase from "../model/Purchase.js";
import Inventory from "../model/inventory.js";
import Stock from "../model/stock.js";
import Warehouse from "../model/warehouse.js";
import Notification from "../model/Notification.js";

// Create purchase with real-time inventory integration
export const createPurchase = async (req, res) => {
  try {
    console.log("Purchase creation - User ID:", req.user._id || req.user.id);
    console.log("Purchase creation - User object:", req.user);

    const {
      purchaseNumber,
      supplier,
      items,
      warehouse,
      paymentMethod,
      discount,
      tax,
      notes,
      purchaseDate
    } = req.body;

    // Check if purchase number already exists
    const existingPurchase = await Purchase.findOne({ purchaseNumber });
    if (existingPurchase) {
      return res.status(400).json({
        success: false,
        message: "Purchase number already exists"
      });
    }

    // Verify warehouse exists
    const warehouseExists = await Warehouse.findById(warehouse);
    if (!warehouseExists) {
      return res.status(404).json({
        success: false,
        message: "Warehouse not found"
      });
    }

    // Process items and calculate totals
    const processedItems = [];
    let subtotal = 0;

    // REAL-TIME INVENTORY INTEGRATION - Process each item
    for (const item of items) {
      // Check if product already exists in warehouse
      let inventoryItem = await Inventory.findOne({
        name: item.productName,
        warehouse: warehouse,
        category: item.category || "Raw Materials"
      });

      if (!inventoryItem) {
        // Create new inventory item
        inventoryItem = new Inventory({
          name: item.productName,
          category: item.category || "Raw Materials",
          subcategory: item.subcategory || item.productName,
          description: item.description || `Purchased from ${supplier.name}`,
          unit: item.unit || 'kg',
          currentStock: 0, // Will be updated by stock movement
          minimumStock: item.minimumStock || 10,
          warehouse: warehouse,
          cost: {
            purchasePrice: item.unitPrice,
            currency: "PKR"
          },
          status: "Active"
        });

        await inventoryItem.save();
        console.log(`Created new inventory item: ${item.productName}`);
      }

      // Calculate total price for item
      const totalPrice = item.quantity * item.unitPrice;
      subtotal += totalPrice;

      processedItems.push({
        product: inventoryItem._id,
        productName: item.productName,
        quantity: item.quantity,
        unit: item.unit || inventoryItem.unit,
        unitPrice: item.unitPrice,
        totalPrice: totalPrice
      });

      // Add stock to inventory
      const stockIn = new Stock({
        inventoryItem: inventoryItem._id,
        movementType: 'in',
        quantity: item.quantity,
        reason: `Purchase - ${purchaseNumber}`,
        referenceNumber: purchaseNumber,
        warehouse: warehouse,
        createdBy: req.user._id || req.user.id
      });

      await stockIn.save();
      console.log(`Added ${item.quantity} units of ${item.productName} to inventory`);
    }

    // Calculate discount amount
    let discountAmount = 0;
    if (discount?.type === 'percentage') {
      discountAmount = (subtotal * (discount.value || 0)) / 100;
    } else if (discount?.type === 'fixed') {
      discountAmount = discount.value || 0;
    }

    // Calculate total amount
    const taxAmount = tax || 0;
    const totalAmount = subtotal - discountAmount + taxAmount;

    // Create purchase data
    const purchaseData = {
      purchaseNumber,
      supplier,
      items: processedItems,
      subtotal: subtotal,
      totalAmount: totalAmount,
      discount: discount ? {
        type: discount.type,
        value: discount.value,
        amount: discountAmount
      } : null,
      tax: taxAmount,
      paymentMethod,
      warehouse,
      notes,
      purchaseDate: purchaseDate ? new Date(purchaseDate) : new Date(),
      createdBy: req.user._id || req.user.id,
      status: paymentMethod === 'Credit' ? 'Pending' : 'Completed'
    };

    const purchase = new Purchase(purchaseData);
    await purchase.save();

    // Create purchase completion notification
    const notification = new Notification({
      title: "Purchase Completed",
      message: `Purchase ${purchaseNumber} has been processed and inventory updated`,
      type: "purchase",
      priority: "low",
      user: req.user._id || req.user.id,
      data: {
        purchaseId: purchase._id,
        purchaseNumber: purchaseNumber,
        totalAmount: totalAmount,
        supplierName: supplier.name,
        itemsCount: items.length
      }
    });

    await notification.save();

    // Populate the response
    await purchase.populate('warehouse', 'name location');
    await purchase.populate('createdBy', 'firstName lastName');

    res.status(201).json({
      success: true,
      message: "Purchase created successfully with real-time inventory integration",
      data: purchase
    });

  } catch (error) {
    console.error("Create purchase error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while creating purchase",
      error: error.message
    });
  }
};

// Get all purchases
export const getAllPurchases = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search,
      status,
      warehouse,
      startDate,
      endDate,
      paymentMethod,
      supplier
    } = req.query;

    // Build filter object
    const filter = {};
    
    if (search) {
      filter.$or = [
        { purchaseNumber: { $regex: search, $options: 'i' } },
        { 'supplier.name': { $regex: search, $options: 'i' } },
        { 'supplier.email': { $regex: search, $options: 'i' } }
      ];
    }
    
    if (status) filter.status = status;
    if (warehouse) filter.warehouse = warehouse;
    if (paymentMethod) filter.paymentMethod = paymentMethod;
    if (supplier) filter['supplier.name'] = { $regex: supplier, $options: 'i' };
    
    if (startDate || endDate) {
      filter.purchaseDate = {};
      if (startDate) filter.purchaseDate.$gte = new Date(startDate);
      if (endDate) filter.purchaseDate.$lte = new Date(endDate);
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Get total count for pagination
    const total = await Purchase.countDocuments(filter);
    
    // Get purchases with pagination
    const purchases = await Purchase.find(filter)
      .populate('warehouse', 'name location')
      .populate('createdBy', 'firstName lastName')
      .sort({ purchaseDate: -1, createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Calculate pagination info
    const totalPages = Math.ceil(total / parseInt(limit));
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    res.json({
      success: true,
      data: purchases,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalRecords: total,
        hasNextPage,
        hasPrevPage,
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    console.error("Get purchases error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching purchases",
      error: error.message
    });
  }
};

// Get single purchase
export const getPurchaseById = async (req, res) => {
  try {
    const purchase = await Purchase.findById(req.params.id)
      .populate("warehouse", "name location")
      .populate("createdBy", "firstName lastName");

    if (!purchase) {
      return res.status(404).json({
        success: false,
        message: "Purchase not found"
      });
    }

    res.json({
      success: true,
      data: purchase
    });

  } catch (error) {
    console.error("Get purchase error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching purchase",
      error: error.message
    });
  }
};

// Update purchase
export const updatePurchase = async (req, res) => {
  try {
    // Check if purchase exists
    const purchase = await Purchase.findById(req.params.id);
    if (!purchase) {
      return res.status(404).json({
        success: false,
        message: "Purchase not found"
      });
    }

    // Update purchase record
    const updatedPurchase = await Purchase.findByIdAndUpdate(
      req.params.id,
      { ...req.body, updatedAt: new Date() },
      { new: true, runValidators: true }
    ).populate("warehouse", "name location")
     .populate("createdBy", "firstName lastName");

    res.json({
      success: true,
      message: "Purchase updated successfully",
      data: updatedPurchase
    });

  } catch (error) {
    console.error("Update purchase error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while updating purchase",
      error: error.message
    });
  }
};

// Delete purchase
export const deletePurchase = async (req, res) => {
  try {
    const purchase = await Purchase.findById(req.params.id);
    if (!purchase) {
      return res.status(404).json({
        success: false,
        message: "Purchase not found"
      });
    }

    await Purchase.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: "Purchase deleted successfully"
    });

  } catch (error) {
    console.error("Delete purchase error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while deleting purchase",
      error: error.message
    });
  }
};

// Get purchase summary
export const getPurchaseSummary = async (req, res) => {
  try {
    const { startDate, endDate, warehouse } = req.query;

    // Build filter object
    const filter = {};
    
    if (warehouse) filter.warehouse = warehouse;
    
    if (startDate || endDate) {
      filter.purchaseDate = {};
      if (startDate) filter.purchaseDate.$gte = new Date(startDate);
      if (endDate) filter.purchaseDate.$lte = new Date(endDate);
    }

    // Get purchase statistics
    const totalPurchases = await Purchase.countDocuments(filter);
    const totalAmount = await Purchase.aggregate([
      { $match: filter },
      { $group: { _id: null, total: { $sum: "$totalAmount" } } }
    ]);

    const averagePurchase = totalAmount.length > 0 ? totalAmount[0].total / totalPurchases : 0;

    // Get top suppliers
    const topSuppliers = await Purchase.aggregate([
      { $match: filter },
      { $group: { 
        _id: "$supplier.name", 
        totalAmount: { $sum: "$totalAmount" },
        purchaseCount: { $sum: 1 }
      }},
      { $sort: { totalAmount: -1 } },
      { $limit: 5 }
    ]);

    // Get recent purchases
    const recentPurchases = await Purchase.find(filter)
      .populate('warehouse', 'name location')
      .sort({ purchaseDate: -1 })
      .limit(5);

    res.json({
      success: true,
      data: {
        totalPurchases,
        totalAmount: totalAmount.length > 0 ? totalAmount[0].total : 0,
        averagePurchase,
        topSuppliers,
        recentPurchases
      }
    });

  } catch (error) {
    console.error("Get purchase summary error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching purchase summary",
      error: error.message
    });
  }
};
