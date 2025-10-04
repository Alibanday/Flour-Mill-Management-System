import Sale from "../model/Sale.js";
import Inventory from "../model/inventory.js";
import Stock from "../model/stock.js";
import Warehouse from "../model/warehouse.js";
import Notification from "../model/Notification.js";

// Create sale with real-time inventory integration
export const createSale = async (req, res) => {
  try {
    console.log("Sale creation - User ID:", req.user._id || req.user.id);
    console.log("Sale creation - User object:", req.user);

    const {
      customer,
      items,
      warehouse,
      paymentMethod,
      discount,
      tax,
      notes
    } = req.body;

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

    // REAL-TIME INVENTORY INTEGRATION - Check stock availability first
    for (const item of items) {
      // Verify product exists
      const product = await Inventory.findById(item.product);
      if (!product) {
        return res.status(404).json({
          success: false,
          message: `Product with ID ${item.product} not found`
        });
      }

      // Check if product belongs to the selected warehouse
      if (product.warehouse.toString() !== warehouse) {
        return res.status(400).json({
          success: false,
          message: `Product ${product.name} is not available in the selected warehouse`
        });
      }

      // Check stock availability
      if (product.currentStock < item.quantity) {
        return res.status(400).json({
          success: false,
          message: `Insufficient stock for ${product.name}. Available: ${product.currentStock}, Requested: ${item.quantity}`
        });
      }

      // Calculate total price for item
      const totalPrice = item.quantity * item.unitPrice;
      subtotal += totalPrice;

      processedItems.push({
        product: item.product,
        productName: product.name,
        quantity: item.quantity,
        unit: item.unit || product.unit || 'kg',
        unitPrice: item.unitPrice,
        totalPrice: totalPrice
      });
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

    // Create sale data
    const saleData = {
      customer,
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
      createdBy: req.user._id || req.user.id,
      status: paymentMethod === 'Credit' ? 'Pending' : 'Completed'
    };

    const sale = new Sale(saleData);
    await sale.save();

    // REAL-TIME INVENTORY INTEGRATION - Deduct stock from inventory
    console.log("Starting real-time inventory integration for sales...");

    for (const item of processedItems) {
      // Create stock out movement for each sold item
      const stockOut = new Stock({
        inventoryItem: item.product,
        movementType: 'out',
        quantity: item.quantity,
        reason: `Sale - Invoice ${sale.invoiceNumber}`,
        referenceNumber: sale.invoiceNumber,
        warehouse: warehouse,
        createdBy: req.user._id || req.user.id
      });

      await stockOut.save();
      console.log(`Deducted ${item.quantity} units of ${item.productName} for sale`);

      // Check if item is now low stock or out of stock
      const updatedProduct = await Inventory.findById(item.product);
      if (updatedProduct.currentStock === 0) {
        // Create low stock notification
        const notification = new Notification({
          title: "Product Out of Stock",
          message: `${item.productName} is now out of stock after sale`,
          type: "inventory",
          priority: "high",
          user: req.user._id || req.user.id,
          relatedEntity: "inventory",
          entityId: item.product,
          data: {
            productId: item.product,
            productName: item.productName,
            currentStock: 0,
            invoiceNumber: sale.invoiceNumber
          }
        });
        await notification.save();
      } else if (updatedProduct.currentStock <= updatedProduct.minimumStock) {
        // Create low stock notification
        const notification = new Notification({
          title: "Low Stock Alert",
          message: `${item.productName} is running low (${updatedProduct.currentStock} units remaining)`,
          type: "inventory",
          priority: "medium",
          user: req.user._id || req.user.id,
          relatedEntity: "inventory",
          entityId: item.product,
          data: {
            productId: item.product,
            productName: item.productName,
            currentStock: updatedProduct.currentStock,
            minimumStock: updatedProduct.minimumStock,
            invoiceNumber: sale.invoiceNumber
          }
        });
        await notification.save();
      }
    }

    // Create sale completion notification
    const saleNotification = new Notification({
      title: "Sale Completed",
      message: `Sale invoice ${sale.invoiceNumber} has been processed successfully`,
      type: "sales",
      priority: "low",
      user: req.user._id || req.user.id,
      relatedEntity: "sale",
      entityId: sale._id,
      data: {
        saleId: sale._id,
        invoiceNumber: sale.invoiceNumber,
        totalAmount: totalAmount,
        customerName: customer.name
      }
    });

    await saleNotification.save();

    // Populate the response
    await sale.populate('warehouse', 'name location');
    await sale.populate('createdBy', 'firstName lastName');

    res.status(201).json({
      success: true,
      message: "Sale created successfully with real-time inventory integration",
      data: sale
    });

  } catch (error) {
    console.error("Create sale error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while creating sale",
      error: error.message
    });
  }
};

// Get all sales
export const getAllSales = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search,
      status,
      warehouse,
      startDate,
      endDate,
      paymentMethod
    } = req.query;

    // Build filter object
    const filter = {};
    
    if (search) {
      filter.$or = [
        { invoiceNumber: { $regex: search, $options: 'i' } },
        { 'customer.name': { $regex: search, $options: 'i' } },
        { 'customer.email': { $regex: search, $options: 'i' } }
      ];
    }
    
    if (status) filter.status = status;
    if (warehouse) filter.warehouse = warehouse;
    if (paymentMethod) filter.paymentMethod = paymentMethod;
    
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) filter.createdAt.$lte = new Date(endDate);
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Get total count for pagination
    const total = await Sale.countDocuments(filter);
    
    // Get sales with pagination
    const sales = await Sale.find(filter)
      .populate('warehouse', 'name location')
      .populate('createdBy', 'firstName lastName')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Calculate pagination info
    const totalPages = Math.ceil(total / parseInt(limit));
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    res.json({
      success: true,
      data: sales,
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
    console.error("Get sales error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching sales",
      error: error.message
    });
  }
};

// Get single sale
export const getSaleById = async (req, res) => {
  try {
    const sale = await Sale.findById(req.params.id)
      .populate("warehouse", "name location")
      .populate("createdBy", "firstName lastName");

    if (!sale) {
      return res.status(404).json({
        success: false,
        message: "Sale not found"
      });
    }

    res.json({
      success: true,
      data: sale
    });

  } catch (error) {
    console.error("Get sale error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching sale",
      error: error.message
    });
  }
};

// Update sale
export const updateSale = async (req, res) => {
  try {
    // Check if sale exists
    const sale = await Sale.findById(req.params.id);
    if (!sale) {
      return res.status(404).json({
        success: false,
        message: "Sale not found"
      });
    }

    // Update sale record
    const updatedSale = await Sale.findByIdAndUpdate(
      req.params.id,
      { ...req.body, updatedAt: new Date() },
      { new: true, runValidators: true }
    ).populate("warehouse", "name location")
     .populate("createdBy", "firstName lastName");

    res.json({
      success: true,
      message: "Sale updated successfully",
      data: updatedSale
    });

  } catch (error) {
    console.error("Update sale error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while updating sale",
      error: error.message
    });
  }
};

// Delete sale
export const deleteSale = async (req, res) => {
  try {
    const sale = await Sale.findById(req.params.id);
    if (!sale) {
      return res.status(404).json({
        success: false,
        message: "Sale not found"
      });
    }

    await Sale.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: "Sale deleted successfully"
    });

  } catch (error) {
    console.error("Delete sale error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while deleting sale",
      error: error.message
    });
  }
};

// Process return with real-time inventory integration
export const processReturn = async (req, res) => {
  try {
    const { saleId, items, reason } = req.body;

    // Get the original sale
    const sale = await Sale.findById(saleId);
    if (!sale) {
      return res.status(404).json({
        success: false,
        message: "Sale not found"
      });
    }

    // Process return items
    for (const returnItem of items) {
      // Find the original item in the sale
      const originalItem = sale.items.find(item => item.product.toString() === returnItem.product);
      if (!originalItem) {
        return res.status(400).json({
          success: false,
          message: `Product not found in original sale`
        });
      }

      if (returnItem.quantity > originalItem.quantity) {
        return res.status(400).json({
          success: false,
          message: `Return quantity (${returnItem.quantity}) cannot exceed original quantity (${originalItem.quantity})`
        });
      }

      // Add stock back to inventory
      const stockIn = new Stock({
        inventoryItem: returnItem.product,
        movementType: 'in',
        quantity: returnItem.quantity,
        reason: `Return - Sale ${sale.invoiceNumber}`,
        referenceNumber: `RETURN-${sale.invoiceNumber}`,
        warehouse: sale.warehouse,
        createdBy: req.user._id || req.user.id
      });

      await stockIn.save();
      console.log(`Added ${returnItem.quantity} units back to inventory for return`);
    }

    // Create return notification
    const notification = new Notification({
      title: "Product Return Processed",
      message: `Return processed for sale ${sale.invoiceNumber}`,
      type: "sales",
      priority: "medium",
      user: req.user._id || req.user.id,
      relatedEntity: "sale",
      entityId: sale._id,
      data: {
        saleId: sale._id,
        invoiceNumber: sale.invoiceNumber,
        returnReason: reason
      }
    });

    await notification.save();

    res.json({
      success: true,
      message: "Return processed successfully with inventory restocked",
      data: {
        saleId: sale._id,
        invoiceNumber: sale.invoiceNumber,
        returnedItems: items
      }
    });

  } catch (error) {
    console.error("Process return error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while processing return",
      error: error.message
    });
  }
};
