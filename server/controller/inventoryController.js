import Inventory from "../model/inventory.js";
import Warehouse from "../model/wareHouse.js";

// Create new inventory item
export const createInventory = async (req, res) => {
  try {
    console.log('📥 Inventory creation request received:', {
      body: req.body,
      name: req.body.name,
      warehouse: req.body.warehouse,
      currentStock: req.body.currentStock,
      unit: req.body.unit
    });

    const inventoryData = req.body;
    
    // Basic validation
    if (!inventoryData.name) {
      return res.status(400).json({
        success: false,
        message: "Item name is required"
      });
    }
    
    if (!inventoryData.warehouse) {
      return res.status(400).json({
        success: false,
        message: "Warehouse is required"
      });
    }

    if (!inventoryData.category) {
      return res.status(400).json({
        success: false,
        message: "Category is required"
      });
    }

    if (!inventoryData.subcategory) {
      return res.status(400).json({
        success: false,
        message: "Subcategory is required"
      });
    }

    if (!inventoryData.unit) {
      return res.status(400).json({
        success: false,
        message: "Unit is required"
      });
    }
    
    // Validate warehouse exists
    console.log('🔍 Looking up warehouse with ID:', inventoryData.warehouse);
    const warehouse = await Warehouse.findById(inventoryData.warehouse);
    if (!warehouse) {
      console.log('❌ Warehouse not found for ID:', inventoryData.warehouse);
      return res.status(400).json({
        success: false,
        message: "Warehouse not found"
      });
    }
    console.log('✅ Warehouse found:', warehouse.name);
    
    // Check warehouse capacity if adding stock
    if (inventoryData.currentStock > 0) {
      const currentUsage = warehouse.capacity?.currentUsage || 0;
      const totalCapacity = warehouse.capacity?.totalCapacity || 0;
      const warehouseUnit = warehouse.capacity?.unit || 'kg';
      const inventoryUnit = inventoryData.unit || 'kg';
      
      // Convert units to a common base for comparison (kg)
      let stockInKg = inventoryData.currentStock;
      let capacityInKg = totalCapacity;
      
      // Convert warehouse capacity to kg
      switch (warehouseUnit) {
        case 'tons':
          capacityInKg = totalCapacity * 1000;
          break;
        case 'quintals':
          capacityInKg = totalCapacity * 100;
          break;
        case '50kg bags':
          capacityInKg = totalCapacity * 50;
          break;
        case '25kg bags':
          capacityInKg = totalCapacity * 25;
          break;
        case '10kg bags':
          capacityInKg = totalCapacity * 10;
          break;
        case '5kg bags':
          capacityInKg = totalCapacity * 5;
          break;
        case '100kg sacks':
          capacityInKg = totalCapacity * 100;
          break;
        case '50kg sacks':
          capacityInKg = totalCapacity * 50;
          break;
        case '25kg sacks':
          capacityInKg = totalCapacity * 25;
          break;
        default:
          capacityInKg = totalCapacity; // Assume kg
      }
      
      // Convert inventory stock to kg
      switch (inventoryUnit) {
        case 'tons':
          stockInKg = inventoryData.currentStock * 1000;
          break;
        case 'quintals':
          stockInKg = inventoryData.currentStock * 100;
          break;
        case '50kg bags':
          stockInKg = inventoryData.currentStock * 50;
          break;
        case '25kg bags':
          stockInKg = inventoryData.currentStock * 25;
          break;
        case '10kg bags':
          stockInKg = inventoryData.currentStock * 10;
          break;
        case '5kg bags':
          stockInKg = inventoryData.currentStock * 5;
          break;
        case '100kg sacks':
          stockInKg = inventoryData.currentStock * 100;
          break;
        case '50kg sacks':
          stockInKg = inventoryData.currentStock * 50;
          break;
        case '25kg sacks':
          stockInKg = inventoryData.currentStock * 25;
          break;
        default:
          stockInKg = inventoryData.currentStock; // Assume kg
      }
      
      if (currentUsage + stockInKg > capacityInKg) {
        return res.status(400).json({
          success: false,
          message: `Cannot add inventory: Would exceed warehouse capacity. Current usage: ${currentUsage}kg, Adding: ${stockInKg}kg, Capacity: ${capacityInKg}kg`
        });
      }
    }
    
    // Create inventory object with all provided fields
    console.log('📦 Creating inventory with data:', inventoryData);
    
    // Ensure required fields have default values
    const safeInventoryData = {
      ...inventoryData,
      currentStock: inventoryData.currentStock || 0,
      minimumStock: inventoryData.minimumStock || 0,
      status: inventoryData.status || 'Active'
    };
    
    console.log('📦 Safe inventory data:', safeInventoryData);
    
    const inventory = new Inventory(safeInventoryData);
    
    // Save the inventory with the initial stock as provided
    console.log('💾 Saving inventory...');
    await inventory.save();
    console.log('✅ Inventory saved successfully with ID:', inventory._id);
    
    // Update warehouse capacity usage
    if (inventory.currentStock > 0) {
      const currentUsage = warehouse.capacity?.currentUsage || 0;
      const warehouseUnit = warehouse.capacity?.unit || 'kg';
      const inventoryUnit = inventoryData.unit || 'kg';
      
      // Convert inventory stock to kg for capacity calculation
      let stockInKg = inventoryData.currentStock;
      switch (inventoryUnit) {
        case 'tons':
          stockInKg = inventoryData.currentStock * 1000;
          break;
        case 'quintals':
          stockInKg = inventoryData.currentStock * 100;
          break;
        case '50kg bags':
          stockInKg = inventoryData.currentStock * 50;
          break;
        case '25kg bags':
          stockInKg = inventoryData.currentStock * 25;
          break;
        case '10kg bags':
          stockInKg = inventoryData.currentStock * 10;
          break;
        case '5kg bags':
          stockInKg = inventoryData.currentStock * 5;
          break;
        case '100kg sacks':
          stockInKg = inventoryData.currentStock * 100;
          break;
        case '50kg sacks':
          stockInKg = inventoryData.currentStock * 50;
          break;
        case '25kg sacks':
          stockInKg = inventoryData.currentStock * 25;
          break;
        default:
          stockInKg = inventoryData.currentStock; // Assume kg
      }
      
      // Update warehouse capacity usage
      try {
        await Warehouse.findByIdAndUpdate(warehouse._id, {
          $inc: { 'capacity.currentUsage': stockInKg }
        });
        
        console.log(`Updated warehouse capacity usage: +${stockInKg}kg (Total: ${currentUsage + stockInKg}kg)`);
      } catch (warehouseUpdateError) {
        console.error('Error updating warehouse capacity:', warehouseUpdateError);
        // Don't fail the entire operation if warehouse update fails
        console.log('Continuing without warehouse capacity update...');
      }
    }
    
    // Create a stock movement record for initial stock to track it properly
    if (inventory.currentStock > 0) {
      try {
        const Stock = (await import("../model/stock.js")).default;
        const stockMovement = new Stock({
          inventoryItem: inventory._id,
          movementType: 'in',
          quantity: inventory.currentStock,
          reason: 'Initial Stock',
          referenceNumber: `INIT-${inventory.code || inventory._id.toString().slice(-6)}`,
          warehouse: inventory.warehouse,
          createdBy: req.user?.id || null
        });
        
        await stockMovement.save();
        console.log('Initial stock movement created for inventory:', inventory.name, 'with quantity:', inventory.currentStock);
      } catch (stockError) {
        console.error('Error creating stock movement:', stockError);
        // Don't fail the entire operation if stock movement creation fails
        console.log('Continuing without stock movement record...');
      }
    }
    
    res.status(201).json({
      success: true,
      message: "Inventory item created successfully",
      data: inventory
    });
  } catch (error) {
    console.error("Create inventory error:", error);
    console.error("Error details:", error.message);
    console.error("Error stack:", error.stack);
    console.error("Request body:", req.body);
    
    res.status(500).json({
      success: false,
      message: "Error creating inventory item",
      error: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};


// Get all inventory items
export const getAllInventory = async (req, res) => {
  try {
    const { page = 1, limit = 10, search, category, subcategory, status, warehouse } = req.query;
    
    // Build filter object
    const filter = {};
    
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { code: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (category && category !== 'all') {
      filter.category = category;
    }
    
    if (subcategory && subcategory !== 'all') {
      filter.subcategory = subcategory;
    }
    
    if (status && status !== 'all') {
      filter.status = status;
    }
    
    if (warehouse && warehouse !== 'all') {
      filter.warehouse = warehouse;
    }
    
    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Get inventory with pagination and populate warehouse
    const inventory = await Inventory.find(filter)
      .populate('warehouse', 'name code address.city')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    // Add virtual fields to each inventory item
    const inventoryWithVirtuals = inventory.map(item => {
      const itemObj = item.toObject();
      itemObj.totalValue = item.totalValue; // Include the virtual field
      itemObj.stockStatus = item.stockStatus; // Include the virtual field
      itemObj.stockPercentage = item.stockPercentage; // Include the virtual field
      return itemObj;
    });
    
    // Get total count for pagination
    const total = await Inventory.countDocuments(filter);
    
    res.json({
      success: true,
      data: inventoryWithVirtuals,
      pagination: {
        current: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error("Get inventory error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching inventory items"
    });
  }
};

// Get single inventory item by ID
export const getInventoryById = async (req, res) => {
  try {
    const inventory = await Inventory.findById(req.params.id)
      .populate('warehouse', 'name code address.city address.state');
    
    if (!inventory) {
      return res.status(404).json({
        success: false,
        message: "Inventory item not found"
      });
    }
    
    res.json({
      success: true,
      data: inventory
    });
  } catch (error) {
    console.error("Get inventory by ID error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching inventory item"
    });
  }
};

// Update inventory item
export const updateInventory = async (req, res) => {
  try {
    const inventory = await Inventory.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('warehouse', 'name code');
    
    if (!inventory) {
      return res.status(404).json({
        success: false,
        message: "Inventory item not found"
      });
    }
    
    res.json({
      success: true,
      message: "Inventory item updated successfully",
      data: inventory
    });
  } catch (error) {
    console.error("Update inventory error:", error);
    res.status(500).json({
      success: false,
      message: "Error updating inventory item",
      error: error.message
    });
  }
};

// Delete inventory item
export const deleteInventory = async (req, res) => {
  try {
    const inventory = await Inventory.findByIdAndDelete(req.params.id);
    
    if (!inventory) {
      return res.status(404).json({
        success: false,
        message: "Inventory item not found"
      });
    }
    
    res.json({
      success: true,
      message: "Inventory item deleted successfully"
    });
  } catch (error) {
    console.error("Delete inventory error:", error);
    res.status(500).json({
      success: false,
      message: "Error deleting inventory item"
    });
  }
};

// Update inventory stock manually (for actual physical stock changes)
export const updateInventoryStock = async (req, res) => {
  try {
    const { itemId } = req.params;
    const { newStock, reason } = req.body;
    
    if (!itemId || newStock === undefined || newStock < 0) {
      return res.status(400).json({
        success: false,
        message: "Item ID and valid stock quantity are required"
      });
    }
    
    const inventory = await Inventory.findById(itemId);
    if (!inventory) {
      return res.status(404).json({
        success: false,
        message: "Inventory item not found"
      });
    }
    
    const oldStock = inventory.currentStock;
    const stockDifference = newStock - oldStock;
    
    // Update the inventory stock
    inventory.currentStock = newStock;
    
    // Update status based on new stock level
    if (newStock === 0) {
      inventory.status = "Out of Stock";
    } else if (newStock <= inventory.minimumStock) {
      inventory.status = "Low Stock";
    } else {
      inventory.status = "Active";
    }
    
    await inventory.save();
    
    // Create stock movement record to track the change
    if (stockDifference !== 0) {
      const Stock = (await import("../model/stock.js")).default;
      const stockMovement = new Stock({
        inventoryItem: itemId,
        movementType: stockDifference > 0 ? 'in' : 'out',
        quantity: Math.abs(stockDifference),
        reason: reason || 'Manual Stock Update',
        referenceNumber: `MANUAL-${Date.now()}`,
        warehouse: inventory.warehouse,
        createdBy: req.user?.id || null
      });
      
      await stockMovement.save();
    }
    
    res.json({
      success: true,
      message: "Inventory stock updated successfully",
      data: {
        item: inventory,
        oldStock,
        newStock,
        difference: stockDifference
      }
    });
  } catch (error) {
    console.error("Update inventory stock error:", error);
    res.status(500).json({
      success: false,
      message: "Error updating inventory stock",
      error: error.message
    });
  }
};

// Search inventory items
export const searchInventory = async (req, res) => {
  try {
    const { q } = req.query;
    
    if (!q) {
      return res.status(400).json({
        success: false,
        message: "Search query is required"
      });
    }
    
    const inventory = await Inventory.find({
      $or: [
        { name: { $regex: q, $options: 'i' } },
        { code: { $regex: q, $options: 'i' } },
        { description: { $regex: q, $options: 'i' } },
        { category: { $regex: q, $options: 'i' } }
      ]
    }).populate('warehouse', 'name code');
    
    res.json({
      success: true,
      data: inventory
    });
  } catch (error) {
    console.error("Search inventory error:", error);
    res.status(500).json({
      success: false,
      message: "Error searching inventory items"
    });
  }
};

// Get inventory by category
export const getInventoryByCategory = async (req, res) => {
  try {
    const inventory = await Inventory.find({ category: req.params.category })
      .populate('warehouse', 'name code');
    
    res.json({
      success: true,
      data: inventory
    });
  } catch (error) {
    console.error("Get inventory by category error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching inventory by category"
    });
  }
};

// Get low stock items
export const getLowStockItems = async (req, res) => {
  try {
    const inventory = await Inventory.find({
      $expr: {
        $and: [
          { $gt: ["$minimumStock", 0] },
          { $lte: ["$currentStock", "$minimumStock"] }
        ]
      }
    }).populate('warehouse', 'name code');
    
    res.json({
      success: true,
      data: inventory
    });
  } catch (error) {
    console.error("Get low stock items error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching low stock items"
    });
  }
};

// Get out of stock items
export const getOutOfStockItems = async (req, res) => {
  try {
    const inventory = await Inventory.find({ currentStock: 0 })
      .populate('warehouse', 'name code');
    
    res.json({
      success: true,
      data: inventory
    });
  } catch (error) {
    console.error("Get out of stock items error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching out of stock items"
    });
  }
};

// Update stock levels (Warehouse managers can update)
export const updateStockLevels = async (req, res) => {
  try {
    const { currentStock, minimumStock, reorderPoint } = req.body;
    
    // Validate stock levels
    if (currentStock < 0) {
      return res.status(400).json({
        success: false,
        message: "Current stock cannot be negative"
      });
    }
    
    if (minimumStock < 0) {
      return res.status(400).json({
        success: false,
        message: "Minimum stock cannot be negative"
      });
    }
    
    const inventory = await Inventory.findByIdAndUpdate(
      req.params.id,
      { currentStock, minimumStock, reorderPoint },
      { new: true, runValidators: true }
    ).populate('warehouse', 'name code');
    
    if (!inventory) {
      return res.status(404).json({
        success: false,
        message: "Inventory item not found"
      });
    }
    
    // Update status based on stock levels
    let newStatus = inventory.status;
    if (currentStock === 0) {
      newStatus = "Out of Stock";
    } else if (currentStock <= minimumStock) {
      newStatus = "Low Stock";
    } else {
      newStatus = "Active";
    }
    
    // Update status if it changed
    if (newStatus !== inventory.status) {
      await Inventory.findByIdAndUpdate(req.params.id, { status: newStatus });
      inventory.status = newStatus;
    }
    
    res.json({
      success: true,
      message: "Stock levels updated successfully",
      data: inventory
    });
  } catch (error) {
    console.error("Update stock levels error:", error);
    res.status(500).json({
      success: false,
      message: "Error updating stock levels",
      error: error.message
    });
  }
};

// Get inventory summary for dashboard
export const getInventorySummary = async (req, res) => {
  try {
    const totalItems = await Inventory.countDocuments();
    const lowStockItems = await Inventory.countDocuments({
      $expr: {
        $and: [
          { $gt: ["$minimumStock", 0] },
          { $lte: ["$currentStock", "$minimumStock"] }
        ]
      }
    });
    const outOfStockItems = await Inventory.countDocuments({ currentStock: 0 });
    const activeItems = await Inventory.countDocuments({ status: "Active" });
    
    // Calculate total value from all inventory items
    const inventoryItems = await Inventory.find({}, 'currentStock cost');
    const totalValue = inventoryItems.reduce((sum, item) => {
      const itemValue = item.currentStock * (item.cost?.purchasePrice || 0);
      return sum + itemValue;
    }, 0);
    
    res.json({
      success: true,
      data: {
        totalItems,
        lowStockItems,
        outOfStockItems,
        activeItems,
        totalValue
      }
    });
  } catch (error) {
    console.error("Get inventory summary error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching inventory summary"
    });
  }
};

// Update inventory status
export const updateInventoryStatus = async (req, res) => {
  try {
    const { status } = req.body;
    
    if (!status) {
      return res.status(400).json({
        success: false,
        message: "Status is required"
      });
    }

    const validStatuses = ["Active", "Inactive", "Low Stock", "Out of Stock", "Discontinued"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status value"
      });
    }

    const inventory = await Inventory.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true, runValidators: true }
    ).populate('warehouse', 'name code');
    
    if (!inventory) {
      return res.status(404).json({
        success: false,
        message: "Inventory item not found"
      });
    }
    
    res.json({
      success: true,
      message: "Status updated successfully",
      data: inventory
    });
  } catch (error) {
    console.error("Update status error:", error);
    res.status(500).json({
      success: false,
      message: "Error updating status",
      error: error.message
    });
  }
};

// Get inventory by warehouse (for warehouse tracking)
export const getInventoryByWarehouse = async (req, res) => {
  try {
    const warehouseId = req.params.warehouseId;
    const { category, status, search } = req.query;
    
    // Build filter
    const filter = { warehouse: warehouseId };
    
    if (category && category !== 'all') {
      filter.category = category;
    }
    
    if (status && status !== 'all') {
      filter.status = status;
    }
    
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { code: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }
    
    const inventory = await Inventory.find(filter)
      .populate('warehouse', 'name location')
      .sort({ createdAt: -1 });
    
    res.json({
      success: true,
      data: inventory
    });
  } catch (error) {
    console.error("Get inventory by warehouse error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching inventory by warehouse",
      error: error.message
    });
  }
};

// Get low stock alerts for warehouse managers
export const getLowStockAlerts = async (req, res) => {
  try {
    const { warehouseId } = req.query;
    
    let filter = {
      $expr: {
        $and: [
          { $gt: ["$minimumStock", 0] },
          { $lte: ["$currentStock", "$minimumStock"] }
        ]
      }
    };
    
    if (warehouseId) {
      filter.warehouse = warehouseId;
    }
    
    const lowStockItems = await Inventory.find(filter)
      .populate('warehouse', 'name location')
      .sort({ currentStock: 1 });
    
    res.json({
      success: true,
      data: lowStockItems,
      count: lowStockItems.length
    });
  } catch (error) {
    console.error("Get low stock alerts error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching low stock alerts",
      error: error.message
    });
  }
};

// Add stock to existing inventory item
export const addStockToExisting = async (req, res) => {
  try {
    const { quantity, reason, referenceNumber } = req.body;
    const itemId = req.params.id; // Get ID from URL parameter
    
    if (!itemId || !quantity || quantity <= 0) {
      return res.status(400).json({
        success: false,
        message: "Item ID and positive quantity are required"
      });
    }
    
    // Find the inventory item
    const inventoryItem = await Inventory.findById(itemId);
    if (!inventoryItem) {
      return res.status(404).json({
        success: false,
        message: "Inventory item not found"
      });
    }
    
    // Get old stock before adding
    const oldStock = inventoryItem.currentStock;
    
    // Create stock movement record (this will automatically update inventory stock via pre-save middleware)
    const Stock = (await import("../model/stock.js")).default;
    const stockMovement = new Stock({
      inventoryItem: itemId,
      movementType: 'in',
      quantity: quantity,
      reason: reason || 'Stock Addition',
      referenceNumber: referenceNumber,
      warehouse: inventoryItem.warehouse,
      createdBy: req.user?.id || null // Handle case where user is not authenticated
    });
    
    await stockMovement.save();
    
    // Refresh the inventory item to get updated stock
    const updatedInventoryItem = await Inventory.findById(itemId);
    
    res.json({
      success: true,
      message: "Stock added successfully",
      data: {
        item: updatedInventoryItem,
        oldStock,
        newStock: updatedInventoryItem.currentStock,
        addedQuantity: quantity
      }
    });
  } catch (error) {
    console.error("Add stock to existing error:", error);
    res.status(500).json({
      success: false,
      message: "Error adding stock to existing item",
      error: error.message
    });
  }
};

// Find existing inventory item by name and warehouse
export const findExistingItem = async (req, res) => {
  try {
    const { name, warehouse } = req.query;
    
    console.log('Find existing item request:', { name, warehouse });
    
    if (!name || !warehouse) {
      return res.status(400).json({
        success: false,
        message: "Item name and warehouse are required"
      });
    }
    
    const existingItem = await Inventory.findOne({
      name: { $regex: name, $options: 'i' },
      warehouse: warehouse
    }).populate('warehouse', 'name location');
    
    console.log('Found existing item:', existingItem);
    
    res.json({
      success: true,
      data: existingItem,
      exists: !!existingItem
    });
  } catch (error) {
    console.error("Find existing item error:", error);
    res.status(500).json({
      success: false,
      message: "Error finding existing item",
      error: error.message
    });
  }
};
