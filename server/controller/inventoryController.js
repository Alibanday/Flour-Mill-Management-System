import Inventory from "../model/inventory.js";
import Warehouse from "../model/warehouse.js";

// Create new inventory item
export const createInventory = async (req, res) => {
  try {
    const inventoryData = req.body;
    
    // Validate warehouse exists
    if (inventoryData.warehouse) {
      const warehouse = await Warehouse.findById(inventoryData.warehouse);
      if (!warehouse) {
        return res.status(400).json({
          success: false,
          message: "Warehouse not found"
        });
      }
    }
    
    const inventory = new Inventory(inventoryData);
    await inventory.save();
    
    res.status(201).json({
      success: true,
      message: "Inventory item created successfully",
      data: inventory
    });
  } catch (error) {
    console.error("Create inventory error:", error);
    res.status(500).json({
      success: false,
      message: "Error creating inventory item",
      error: error.message
    });
  }
};

// Get all inventory items
export const getAllInventory = async (req, res) => {
  try {
    const { page = 1, limit = 10, search, category, status, warehouse } = req.query;
    
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
    
    // Get total count for pagination
    const total = await Inventory.countDocuments(filter);
    
    res.json({
      success: true,
      data: inventory,
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

// Update stock levels
export const updateStockLevels = async (req, res) => {
  try {
    const { currentStock, minimumStock, maximumStock } = req.body;
    
    const inventory = await Inventory.findByIdAndUpdate(
      req.params.id,
      { currentStock, minimumStock, maximumStock },
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
    
    res.json({
      success: true,
      data: {
        totalItems,
        lowStockItems,
        outOfStockItems,
        activeItems
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
