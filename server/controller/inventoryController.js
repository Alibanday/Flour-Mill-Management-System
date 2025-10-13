import Inventory from "../model/inventory.js";

// Create new inventory item
export const createInventory = async (req, res) => {
  try {
    console.log('📥 Inventory creation request received:', {
      body: req.body,
      name: req.body.name,
      weight: req.body.weight,
      price: req.body.price
    });

    const inventoryData = req.body;
    
    // Basic validation
    if (!inventoryData.name) {
      return res.status(400).json({
        success: false,
        message: "Item name is required"
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

    if (!inventoryData.weight && inventoryData.weight !== 0) {
      return res.status(400).json({
        success: false,
        message: "Weight is required"
      });
    }

    if (!inventoryData.price && inventoryData.price !== 0) {
      return res.status(400).json({
        success: false,
        message: "Price is required"
      });
    }
    
    
    // Create inventory object with all provided fields
    console.log('📦 Creating inventory with data:', inventoryData);
    
    // Ensure required fields have default values
    const safeInventoryData = {
      ...inventoryData,
      weight: inventoryData.weight || 0,
      price: inventoryData.price || 0,
      status: inventoryData.status || 'Active'
    };
    
    console.log('📦 Safe inventory data:', safeInventoryData);
    
    const inventory = new Inventory(safeInventoryData);
    
    // Save the inventory with the initial stock as provided
    console.log('💾 Saving inventory...');
    await inventory.save();
    console.log('✅ Inventory saved successfully with ID:', inventory._id);
    
    
    // Log the inventory creation
    console.log('Inventory created successfully:', inventory.name, 'with weight:', inventory.weight, 'kg');
    
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
    const { page = 1, limit = 10, search, category, subcategory, status } = req.query;
    
    // Build filter object
    const filter = {};
    
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { code: { $regex: search, $options: 'i' } }
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
    
    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Get inventory with pagination
    const inventory = await Inventory.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    // Add virtual fields to each inventory item
    const inventoryWithVirtuals = inventory.map(item => {
      const itemObj = item.toObject();
      itemObj.totalValue = item.totalValue; // Include the virtual field
      itemObj.stockStatus = item.stockStatus; // Include the virtual field
      itemObj.priceDisplay = item.priceDisplay; // Include the virtual field
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
    const inventory = await Inventory.findById(req.params.id);
    
    if (!inventory) {
      return res.status(404).json({
        success: false,
        message: "Inventory item not found"
      });
    }
    
    // Add virtual fields
    const itemObj = inventory.toObject();
    itemObj.totalValue = inventory.totalValue;
    itemObj.stockStatus = inventory.stockStatus;
    itemObj.priceDisplay = inventory.priceDisplay;
    
    res.json({
      success: true,
      data: itemObj
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
    );
    
    if (!inventory) {
      return res.status(404).json({
        success: false,
        message: "Inventory item not found"
      });
    }
    
    // Add virtual fields
    const itemObj = inventory.toObject();
    itemObj.totalValue = inventory.totalValue;
    itemObj.stockStatus = inventory.stockStatus;
    itemObj.priceDisplay = inventory.priceDisplay;
    
    res.json({
      success: true,
      message: "Inventory item updated successfully",
      data: itemObj
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
    });
    
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
    });
    
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
    const inventory = await Inventory.find({ weight: 0 });
    
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

// Update weight levels
export const updateStockLevels = async (req, res) => {
  try {
    const { weight } = req.body;
    
    // Validate weight
    if (weight < 0) {
      return res.status(400).json({
        success: false,
        message: "Weight cannot be negative"
      });
    }
    
    const inventory = await Inventory.findByIdAndUpdate(
      req.params.id,
      { weight },
      { new: true, runValidators: true }
    );
    
    if (!inventory) {
      return res.status(404).json({
        success: false,
        message: "Inventory item not found"
      });
    }
    
    // Update status based on weight
    let newStatus = inventory.status;
    if (weight === 0) {
      newStatus = "Out of Stock";
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
      message: "Weight updated successfully",
      data: inventory
    });
  } catch (error) {
    console.error("Update weight error:", error);
    res.status(500).json({
      success: false,
      message: "Error updating weight",
      error: error.message
    });
  }
};

// Get inventory summary for dashboard
export const getInventorySummary = async (req, res) => {
  try {
    const totalItems = await Inventory.countDocuments();
    const outOfStockItems = await Inventory.countDocuments({ weight: 0 });
    const activeItems = await Inventory.countDocuments({ status: "Active" });
    
    // Calculate total value from all inventory items
    const inventoryItems = await Inventory.find({}, 'weight price');
    const totalValue = inventoryItems.reduce((sum, item) => {
      const itemValue = item.price || 0; // Price is per complete item
      return sum + itemValue;
    }, 0);
    
    res.json({
      success: true,
      data: {
        totalItems,
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
    );
    
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

// Get inventory by category and status
export const getInventoryByWarehouse = async (req, res) => {
  try {
    const { category, status, search } = req.query;
    
    // Build filter
    const filter = {};
    
    if (category && category !== 'all') {
      filter.category = category;
    }
    
    if (status && status !== 'all') {
      filter.status = status;
    }
    
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { code: { $regex: search, $options: 'i' } }
      ];
    }
    
    const inventory = await Inventory.find(filter)
      .sort({ createdAt: -1 });
    
    res.json({
      success: true,
      data: inventory
    });
  } catch (error) {
    console.error("Get inventory by category error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching inventory by category",
      error: error.message
    });
  }
};

// Get out of stock alerts
export const getLowStockAlerts = async (req, res) => {
  try {
    const outOfStockItems = await Inventory.find({ weight: 0 })
      .sort({ name: 1 });
    
    res.json({
      success: true,
      data: outOfStockItems,
      count: outOfStockItems.length
    });
  } catch (error) {
    console.error("Get out of stock alerts error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching out of stock alerts",
      error: error.message
    });
  }
};

// Add weight to existing inventory item
export const addStockToExisting = async (req, res) => {
  try {
    const { quantity } = req.body;
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
    
    // Get old weight before adding
    const oldWeight = inventoryItem.weight;
    
    // Update the weight
    inventoryItem.weight += quantity;
    await inventoryItem.save();
    
    res.json({
      success: true,
      message: "Weight added successfully",
      data: {
        item: inventoryItem,
        oldWeight,
        newWeight: inventoryItem.weight,
        addedQuantity: quantity
      }
    });
  } catch (error) {
    console.error("Add weight to existing error:", error);
    res.status(500).json({
      success: false,
      message: "Error adding weight to existing item",
      error: error.message
    });
  }
};

// Find existing inventory item by name
export const findExistingItem = async (req, res) => {
  try {
    const { name } = req.query;
    
    console.log('Find existing item request:', { name });
    
    if (!name) {
      return res.status(400).json({
        success: false,
        message: "Item name is required"
      });
    }
    
    const existingItem = await Inventory.findOne({
      name: { $regex: name, $options: 'i' }
    });
    
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
