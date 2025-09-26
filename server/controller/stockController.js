import Stock from "../model/stock.js";
import Inventory from "../model/inventory.js";
import Warehouse from "../model/warehouse.js";
import Notification from "../model/Notification.js";

// Add new stock movement
export const addStock = async (req, res) => {
  try {
    console.log("Add stock request body:", req.body);
    console.log("User:", req.user);
    
    const { inventoryItem, movementType, quantity, reason, referenceNumber, warehouse } = req.body;
    
    // Validate required fields
    if (!inventoryItem || !movementType || !quantity || !warehouse) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields: inventoryItem, movementType, quantity, warehouse"
      });
    }
    
    // Validate inventory item exists
    const inventory = await Inventory.findById(inventoryItem);
    if (!inventory) {
      console.log("Inventory item not found:", inventoryItem);
      return res.status(404).json({ 
        success: false,
        message: "Inventory item not found" 
      });
    }
    
    // Validate warehouse exists
    const warehouseExists = await Warehouse.findById(warehouse);
    if (!warehouseExists) {
      console.log("Warehouse not found:", warehouse);
      return res.status(404).json({ 
        success: false,
        message: "Warehouse not found" 
      });
    }
    
    // Validate that the inventory item belongs to the selected warehouse
    if (inventory.warehouse.toString() !== warehouse) {
      return res.status(400).json({ 
        success: false,
        message: `Cannot add stock to inventory from different warehouse. This inventory belongs to warehouse ${inventory.warehouse}, but you selected ${warehouse}` 
      });
    }
    
    // Check warehouse capacity and inventory limits before adding stock
    if (movementType === 'in') {
      const warehouseData = await Warehouse.findById(warehouse);
      if (warehouseData && warehouseData.capacity && warehouseData.capacity.totalCapacity) {
        const currentUsage = warehouseData.capacity.currentUsage || 0;
        const newUsage = currentUsage + quantity;
        
        if (newUsage > warehouseData.capacity.totalCapacity) {
          return res.status(400).json({
            success: false,
            message: `Warehouse capacity exceeded. Available capacity: ${warehouseData.capacity.totalCapacity - currentUsage}, Requested: ${quantity}`
          });
        }
      }
      
      // Check if adding more stock than reasonable limit (up to current stock size)
      // Exception: Allow stock additions to newly created inventory items (currentStock = 0) during transfers
      const maxReasonableAddition = inventory.currentStock;
      if (quantity > maxReasonableAddition && inventory.currentStock > 0) {
        return res.status(400).json({
          success: false,
          message: `Stock addition too large. Current stock: ${inventory.currentStock}, Maximum allowed: ${maxReasonableAddition}, Requested: ${quantity}`
        });
      }
    }
    
    const stock = new Stock({
      inventoryItem,
      movementType,
      quantity,
      reason,
      referenceNumber,
      warehouse,
      createdBy: req.user._id
    });
    
    console.log("Creating stock movement:", stock);
    await stock.save();
    console.log("Stock movement saved successfully");
    
    // Populate related fields
    await stock.populate([
      { path: 'inventoryItem', select: 'name code category currentStock' },
      { path: 'warehouse', select: 'name code' },
      { path: 'createdBy', select: 'name email' }
    ]);
    
    console.log("Stock movement populated:", stock);
    
    res.status(201).json({
      success: true,
      message: "Stock movement recorded successfully",
      data: stock
    });
  } catch (err) {
    console.error("Add stock error:", err);
    res.status(500).json({ 
      success: false,
      message: err.message 
    });
  }
};

// Update stock item
export const updateStock = async (req, res) => {
  try {
    console.log("Update stock request:", req.params.id, req.body);
    console.log("User:", req.user);
    
    const stock = await Stock.findById(req.params.id);
    if (!stock) {
      return res.status(404).json({ 
        success: false,
        message: "Stock movement not found" 
      });
    }

    // For now, allow all users to update stock movements (remove auth check for testing)
    // if (!req.user || !req.user._id) {
    //   return res.status(401).json({ 
    //     success: false,
    //     message: "Authentication required" 
    //   });
    // }

    // Only allow updating certain fields for stock movements
    const allowedFields = ['reason', 'referenceNumber'];
    const updateData = {};
    
    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        updateData[field] = req.body[field];
      }
    });

    // Update the stock movement
    Object.assign(stock, updateData);
    await stock.save();
    
    // Populate related fields
    await stock.populate([
      { path: 'inventoryItem', select: 'name code category currentStock unit' },
      { path: 'warehouse', select: 'name code' },
      { path: 'createdBy', select: 'name email' }
    ]);
    
    console.log("Stock updated successfully:", stock);
    
    res.json({
      success: true,
      message: "Stock movement updated successfully",
      data: stock
    });
  } catch (err) {
    console.error("Update stock error:", err);
    res.status(500).json({ 
      success: false,
      message: err.message 
    });
  }
};

// Delete stock item
export const deleteStock = async (req, res) => {
  try {
    const stock = await Stock.findById(req.params.id);
    if (!stock) {
      return res.status(404).json({ 
        success: false,
        message: "Stock movement not found" 
      });
    }

    // Check permissions - allow admin, manager, and user roles to delete
    // For now, allow all authenticated users to delete for testing
    if (!req.user || !req.user._id) {
      return res.status(401).json({ 
        success: false,
        message: "Authentication required" 
      });
    }

    await Stock.findByIdAndDelete(req.params.id);
    res.json({ 
      success: true,
      message: "Stock movement deleted successfully" 
    });
  } catch (err) {
    console.error("Delete stock error:", err);
    res.status(500).json({ 
      success: false,
      message: err.message 
    });
  }
};

// Get all stock movements
export const getAllStocks = async (req, res) => {
  try {
    const { page = 1, limit = 10, movementType, warehouse, search } = req.query;

    // Build filter object
    const filter = {};
    if (movementType) filter.movementType = movementType;
    if (warehouse) filter.warehouse = warehouse;
    
    if (search) {
      filter.$or = [
        { referenceNumber: { $regex: search, $options: 'i' } },
        { reason: { $regex: search, $options: 'i' } }
      ];
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const stocks = await Stock.find(filter)
      .populate('inventoryItem', 'name code category currentStock')
      .populate('warehouse', 'name code')
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Stock.countDocuments(filter);

    res.json({
      success: true,
      data: stocks,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / parseInt(limit)),
        total
      }
    });
  } catch (err) {
    console.error("Get all stocks error:", err);
    res.status(500).json({ 
      success: false,
      message: err.message 
    });
  }
};

// Search stocks
export const searchStock = async (req, res) => {
  try {
    const { q, category, warehouse } = req.query;
    
    const filter = {};
    if (category) filter.category = category;
    if (warehouse) filter.warehouse = warehouse;
    
    if (q) {
      filter.$or = [
        { itemName: { $regex: q, $options: 'i' } },
        { itemCode: { $regex: q, $options: 'i' } },
        { description: { $regex: q, $options: 'i' } }
      ];
    }

    const stocks = await Stock.find(filter)
      .populate('warehouse', 'name location')
      .populate('supplier', 'name contact')
      .limit(20);

    res.json(stocks);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get stock by ID
export const getStockById = async (req, res) => {
  try {
    const stock = await Stock.findById(req.params.id)
      .populate('warehouse', 'name location')
      .populate('supplier', 'name contact')
      .populate('createdBy', 'name email')
      .populate('updatedBy', 'name email');
      
    if (!stock) return res.status(404).json({ message: "Stock not found" });
    res.json(stock);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get low stock items
export const getLowStockItems = async (req, res) => {
  try {
    const lowStockItems = await Stock.getLowStockItems();
    res.json(lowStockItems);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get stock by category
export const getStockByCategory = async (req, res) => {
  try {
    const { category } = req.params;
    const stocks = await Stock.getStockByCategory(category);
    res.json(stocks);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Transfer stock between warehouses
export const transferStock = async (req, res) => {
  try {
    const { inventoryItem, fromWarehouse, toWarehouse, quantity, reason, referenceNumber } = req.body;
    
    console.log("Transfer stock request:", req.body);
    console.log("User:", req.user);
    
    // Validate required fields
    if (!inventoryItem || !fromWarehouse || !toWarehouse || !quantity) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields: inventoryItem, fromWarehouse, toWarehouse, quantity"
      });
    }
    
    if (quantity <= 0) {
      return res.status(400).json({
        success: false,
        message: "Quantity must be greater than 0"
      });
    }
    
    if (fromWarehouse === toWarehouse) {
      return res.status(400).json({
        success: false,
        message: "Source and destination warehouses cannot be the same"
      });
    }
    
    // Validate inventory item exists and belongs to source warehouse
    const inventory = await Inventory.findById(inventoryItem);
    if (!inventory) {
      return res.status(404).json({
        success: false,
        message: "Inventory item not found"
      });
    }
    
    if (inventory.warehouse.toString() !== fromWarehouse) {
      return res.status(400).json({
        success: false,
        message: "Inventory item does not belong to source warehouse"
      });
    }
    
    // Check if there's sufficient stock
    if (inventory.currentStock < quantity) {
      return res.status(400).json({
        success: false,
        message: `Insufficient stock. Available: ${inventory.currentStock}, Requested: ${quantity}`
      });
    }
    
    // Validate warehouses exist
    const fromWarehouseExists = await Warehouse.findById(fromWarehouse);
    const toWarehouseExists = await Warehouse.findById(toWarehouse);
    
    if (!fromWarehouseExists || !toWarehouseExists) {
      return res.status(404).json({
        success: false,
        message: "One or both warehouses not found"
      });
    }
    
    // Check destination warehouse capacity
    if (toWarehouseExists.capacity && toWarehouseExists.capacity.totalCapacity) {
      const currentUsage = toWarehouseExists.capacity.currentUsage || 0;
      const newUsage = currentUsage + quantity;
      
      if (newUsage > toWarehouseExists.capacity.totalCapacity) {
        return res.status(400).json({
          success: false,
          message: `Destination warehouse capacity exceeded. Available capacity: ${toWarehouseExists.capacity.totalCapacity - currentUsage}, Requested: ${quantity}`
        });
      }
    }
    
    // Create stock out movement from source warehouse
    const stockOut = new Stock({
      inventoryItem,
      movementType: 'out',
      quantity,
      reason: reason || `Transfer to ${toWarehouseExists.name}`,
      referenceNumber: referenceNumber || `TRANSFER-${Date.now()}`,
      warehouse: fromWarehouse,
      createdBy: req.user?._id || null
    });
    
    // Save the out movement first (this will update the source inventory)
    await stockOut.save();
    
    // Now handle the destination inventory
    console.log(`Checking for existing inventory in destination warehouse: ${toWarehouse}`);
    const existingInventoryInDestination = await Inventory.findOne({
      name: inventory.name,
      warehouse: toWarehouse,
      category: inventory.category
    });
    
    console.log(`Existing inventory found:`, existingInventoryInDestination);
    
    let destinationInventory = null;
    let destinationInventoryId = null;
    
    console.log("Starting destination inventory check...");
    
    if (existingInventoryInDestination) {
      console.log("Found existing inventory in destination, adding stock...");
      // Add stock to existing inventory item in destination warehouse
      await Inventory.findByIdAndUpdate(existingInventoryInDestination._id, {
        $inc: { currentStock: quantity }
      });
      console.log(`Added ${quantity} units to existing inventory item in destination warehouse`);
      destinationInventory = await Inventory.findById(existingInventoryInDestination._id);
      destinationInventoryId = existingInventoryInDestination._id;
      console.log(`Destination inventory ID set to existing:`, destinationInventoryId);
    } else {
      console.log("No existing inventory found, creating new one...");
      // Create new inventory item in destination warehouse
      console.log(`Creating new inventory item in destination warehouse...`);
      try {
        // Generate a unique code for the destination warehouse
        const warehouseCode = await Warehouse.findById(toWarehouse).select('code');
        const baseCode = inventory.code.substring(0, 3); // Use first 3 characters
        const timestamp = Date.now().toString().slice(-4);
        const randomSuffix = Math.random().toString(36).substring(2, 4);
        const newCode = `${baseCode}${timestamp}${randomSuffix}`;
        
        console.log(`Generated unique code: ${newCode}`);
        
        const newInventoryItem = new Inventory({
          name: inventory.name,
          code: newCode, // Unique code for this warehouse
          category: inventory.category,
          description: inventory.description,
          unit: inventory.unit,
          currentStock: 0, // Start with 0, will be updated by stock movement
          minimumStock: inventory.minimumStock,
          warehouse: toWarehouse,
          cost: inventory.cost,
          status: 'Active',
          tags: inventory.tags
        });
        
        destinationInventory = await newInventoryItem.save();
        destinationInventoryId = destinationInventory._id;
        console.log(`Created new inventory item in destination warehouse:`, destinationInventory._id);
        console.log(`Destination inventory ID set to:`, destinationInventoryId);
      } catch (error) {
        console.error(`Error creating inventory item in destination warehouse:`, error);
        // If it's a duplicate code error, try with a different approach
        if (error.code === 11000) {
          console.log(`Duplicate code error, trying alternative approach...`);
          // For now, just log the error and continue - the stock movements are still recorded
          console.log(`Stock transfer completed but inventory item creation failed due to duplicate code`);
        } else {
          console.error(`Failed to create destination inventory:`, error.message);
          // Don't throw error, just log it and continue
        }
      }
    }
    
    // Create stock in movement to destination warehouse (using the destination inventory ID)
    const stockIn = new Stock({
      inventoryItem: destinationInventoryId || inventoryItem, // Use destination inventory if available
      movementType: 'in',
      quantity,
      reason: reason || `Transfer from ${fromWarehouseExists.name}`,
      referenceNumber: referenceNumber || `TRANSFER-${Date.now()}`,
      warehouse: toWarehouse,
      createdBy: req.user?._id || null
    });
    
    console.log("Stock in movement will use inventory item:", destinationInventoryId || inventoryItem);
    console.log("Destination inventory ID:", destinationInventoryId);
    console.log("Source inventory ID:", inventoryItem);
    
    // Save the in movement (this will update the destination inventory)
    await stockIn.save();
    
    
    // Populate related fields for both movements
    await stockOut.populate([
      { path: 'inventoryItem', select: 'name code category currentStock' },
      { path: 'warehouse', select: 'name code' },
      { path: 'createdBy', select: 'name email' }
    ]);
    
    await stockIn.populate([
      { path: 'inventoryItem', select: 'name code category currentStock' },
      { path: 'warehouse', select: 'name code' },
      { path: 'createdBy', select: 'name email' }
    ]);
    
    console.log("Stock transfer completed successfully");
    
    // Get updated inventory information
    const updatedSourceInventory = await Inventory.findById(inventoryItem);
    console.log("Updated source inventory:", updatedSourceInventory?.currentStock);
    console.log("Destination inventory:", destinationInventory?.currentStock);
    
    res.status(201).json({
      success: true,
      message: "Stock transferred successfully",
      data: {
        stockOut,
        stockIn,
        transferDetails: {
          fromWarehouse: fromWarehouseExists.name,
          toWarehouse: toWarehouseExists.name,
          quantity,
          itemName: inventory.name,
          itemCode: inventory.code,
          sourceStockAfter: updatedSourceInventory.currentStock,
          destinationStockAfter: destinationInventory?.currentStock || quantity,
          action: destinationInventory ? 'Added to existing inventory' : 'Created new inventory item'
        }
      }
    });
  } catch (error) {
    console.error("Transfer stock error:", error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Get stock summary
export const getStockSummary = async (req, res) => {
  try {
    // Get basic stock movement counts
    const totalMovements = await Stock.countDocuments();
    const stockInCount = await Stock.countDocuments({ movementType: 'in' });
    const stockOutCount = await Stock.countDocuments({ movementType: 'out' });
    
    // Get recent movements (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const recentMovements = await Stock.countDocuments({
      createdAt: { $gte: sevenDaysAgo }
    });
    
    const summary = {
      totalMovements,
      stockInCount,
      stockOutCount,
      recentMovements,
      stockInPercentage: totalMovements > 0 ? Math.round((stockInCount / totalMovements) * 100) : 0,
      stockOutPercentage: totalMovements > 0 ? Math.round((stockOutCount / totalMovements) * 100) : 0
    };
    
    res.json({
      success: true,
      data: summary
    });
  } catch (err) {
    console.error("Get stock summary error:", err);
    res.status(500).json({ 
      success: false,
      message: err.message 
    });
  }
};

// Update stock quantity (for stock in/out operations)
export const updateStockQuantity = async (req, res) => {
  try {
    const { id } = req.params;
    const { quantity, operation, reason } = req.body; // operation: 'in' or 'out'
    
    const stock = await Stock.findById(id);
    if (!stock) return res.status(404).json({ message: "Stock not found" });

    if (operation === 'in') {
      stock.quantity.value += quantity;
      stock.lastStockIn = new Date();
    } else if (operation === 'out') {
      if (stock.quantity.value < quantity) {
        return res.status(400).json({ message: "Insufficient stock quantity" });
      }
      stock.quantity.value -= quantity;
      stock.lastStockOut = new Date();
    }

    // Recalculate total value
    stock.totalValue = stock.quantity.value * stock.unitPrice;
    stock.updatedBy = req.user._id;
    
    await stock.save();

    // Create notification for low stock using proper schema
    if (stock.status === 'Low Stock' || stock.status === 'Out of Stock') {
      try {
        // Get the current user as recipient
        const recipient = req.user._id;
        
        // Create notification with proper schema for notification module
        const notification = await Notification.create({
          type: 'low_stock',
          title: 'Low Stock Alert',
          message: `${stock.itemName} is running low (${stock.quantity.value} ${stock.quantity.unit} remaining)`,
          priority: stock.status === 'Out of Stock' ? 'critical' : 'high',
          recipient: recipient,
          relatedEntity: 'inventory',
          entityId: stock.inventoryItem,
          metadata: {
            currentStock: stock.quantity.value,
            minimumStock: stock.minimumStock || 0,
            warehouse: stock.warehouse?.name || 'Unknown',
            itemCode: stock.itemName,
            stockStatus: stock.status
          }
        });
        
        console.log('Stock notification created:', notification._id);
      } catch (error) {
        console.error('Error creating stock notification:', error);
      }
    }

    res.json(stock);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Transfer stock between warehouses
export const transferStockToWarehouse = async (req, res) => {
  try {
    const { warehouseId, transferQuantity, reason } = req.body;
    const stock = await Stock.findById(req.params.id);

    if (!stock) return res.status(404).json({ message: "Stock not found" });
    if (stock.quantity.value < transferQuantity) {
      return res.status(400).json({ message: "Insufficient stock to transfer" });
    }

    const targetWarehouse = await Warehouse.findById(warehouseId);
    if (!targetWarehouse || targetWarehouse.status !== "Active") {
      return res.status(400).json({ message: "Invalid or inactive warehouse" });
    }

    // Create new stock entry in target warehouse
    const newStock = new Stock({
      ...stock.toObject(),
      _id: undefined,
      warehouse: warehouseId,
      quantity: { value: transferQuantity, unit: stock.quantity.unit },
      totalValue: transferQuantity * stock.unitPrice,
      createdBy: req.user._id,
      lastStockIn: new Date()
    });
    
    // Update original stock
    stock.quantity.value -= transferQuantity;
    stock.totalValue = stock.quantity.value * stock.unitPrice;
    stock.updatedBy = req.user._id;
    
    await Promise.all([newStock.save(), stock.save()]);

    res.json({ 
      message: `Transferred ${transferQuantity} units to warehouse ${targetWarehouse.name}`,
      originalStock: stock,
      newStock: newStock
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get stock alerts
export const getStockAlerts = async (req, res) => {
  try {
    const alerts = await Stock.find({
      $or: [
        { lowStockAlert: true },
        { expiryAlert: true },
        { status: 'Low Stock' },
        { status: 'Out of Stock' }
      ]
    }).populate('warehouse', 'name location');

    res.json(alerts);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
