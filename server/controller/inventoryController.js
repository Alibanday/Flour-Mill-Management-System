import mongoose from "mongoose";
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
    const { page = 1, limit = 10, search, category, subcategory, status, warehouse } = req.query;
    
    // Build filter object
    const filter = {};
    
    // IMPORTANT: Only show inventory items that have a warehouse (actual stock levels)
    // Filter out legacy catalog-only items that don't have warehouse
    // This ensures we only show stock levels, not catalog items
    const warehouseFilter = [];
    
    // If specific warehouse is requested, filter by it
    if (warehouse && warehouse !== 'all') {
      warehouseFilter.push({ warehouse: warehouse });
    } else {
      // Otherwise, only show items with any warehouse (exclude null/undefined)
      warehouseFilter.push({ warehouse: { $exists: true, $ne: null } });
    }
    
    filter.$and = warehouseFilter;
    
    // Apply warehouse scoping ONLY for Warehouse Manager
    if (req.user?.role === 'Warehouse Manager') {
      try {
        const Warehouse = (await import('../model/wareHouse.js')).default;
        const managedWarehouses = await Warehouse.find({ manager: req.user._id }).select('_id');
        const warehouseIds = managedWarehouses.map(w => w._id);
        // If none assigned, return empty result
        if (warehouseIds.length === 0) {
          return res.json({ success: true, data: [], pagination: { current: parseInt(page), limit: parseInt(limit), total: 0, pages: 0 } });
        }
        // Override the $and filter for warehouse managers
        filter.$and = [
          { warehouse: { $in: warehouseIds } }
        ];
      } catch (e) {
        console.warn('Warehouse scoping failed, proceeding without data:', e.message);
        return res.json({ success: true, data: [], pagination: { current: parseInt(page), limit: parseInt(limit), total: 0, pages: 0 } });
      }
    }
    
    // Search filter - will be applied after population
    // Category and subcategory will also be filtered after population to check product fields
    
    if (status && status !== 'all') {
      filter.status = status;
    }
    
    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Get inventory with pagination - populate product and warehouse
    let inventory = await Inventory.find(filter)
      .populate('product', 'name code category subcategory unit price purchasePrice') // Populate product catalog
      .populate('warehouse', 'name code address') // Populate warehouse
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    // Filter results after population for search, category, and subcategory
    // (can't search/filter populated fields directly in MongoDB query)
    if (search || (category && category !== 'all') || (subcategory && subcategory !== 'all')) {
      const searchLower = search ? search.toLowerCase() : '';
      const categoryMatch = category && category !== 'all' ? category : null;
      const subcategoryMatch = subcategory && subcategory !== 'all' ? subcategory : null;
      
      inventory = inventory.filter(item => {
        const product = item.product;
        const warehouse = item.warehouse;
        
        // Search filter
        if (search) {
          const matchesSearch = (
            (item.name && item.name.toLowerCase().includes(searchLower)) ||
            (item.code && item.code.toLowerCase().includes(searchLower)) ||
            (product && product.name && product.name.toLowerCase().includes(searchLower)) ||
            (product && product.code && product.code.toLowerCase().includes(searchLower)) ||
            (warehouse && warehouse.name && warehouse.name.toLowerCase().includes(searchLower))
          );
          if (!matchesSearch) return false;
        }
        
        // Category filter - check both legacy field and product
        if (categoryMatch) {
          const itemCategory = item.category || (product && product.category);
          if (itemCategory !== categoryMatch) return false;
        }
        
        // Subcategory filter - check both legacy field and product
        if (subcategoryMatch) {
          const itemSubcategory = item.subcategory || (product && product.subcategory);
          if (itemSubcategory !== subcategoryMatch) return false;
        }
        
        return true;
      });
    }
    
    // Add virtual fields and ensure product/warehouse data is available
    const inventoryWithVirtuals = inventory.map(item => {
      const itemObj = item.toObject();
      
      // If product is populated, use product data for display
      if (itemObj.product) {
        itemObj.productName = itemObj.product.name;
        itemObj.productCode = itemObj.product.code;
        itemObj.category = itemObj.product.category || itemObj.category;
        itemObj.subcategory = itemObj.product.subcategory || itemObj.subcategory;
        itemObj.unit = itemObj.product.unit || itemObj.unit;
      } else {
        // Fallback to legacy fields
        itemObj.productName = itemObj.name;
        itemObj.productCode = itemObj.code;
      }
      
      // If warehouse is populated, use warehouse data
      if (itemObj.warehouse) {
        itemObj.warehouseName = itemObj.warehouse.name;
        itemObj.warehouseCode = itemObj.warehouse.code;
      }
      
      // Use currentStock (from Stock movements) or fallback to weight for backward compatibility
      itemObj.stock = itemObj.currentStock !== undefined ? itemObj.currentStock : (itemObj.weight || 0);
      
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
    // Use currentStock (from Stock movements) or fallback to weight
    const inventory = await Inventory.find({
      $or: [
        { currentStock: 0 },
        { currentStock: { $exists: false }, weight: 0 }
      ]
    })
    .populate('product', 'name code category subcategory unit')
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

// Get inventory summary for dashboard - aggregates from all sources (purchases, sales, production, stock)
export const getInventorySummary = async (req, res) => {
  try {
    // IMPORTANT: Only count inventory items that have a warehouse (actual stock levels)
    // Filter out legacy catalog-only items that don't have warehouse
    const warehouseFilter = {
      warehouse: { $exists: true, $ne: null }
    };
    
    // Apply warehouse scoping ONLY for Warehouse Manager
    if (req.user?.role === 'Warehouse Manager') {
      try {
        const Warehouse = (await import('../model/wareHouse.js')).default;
        const managedWarehouses = await Warehouse.find({ manager: req.user._id }).select('_id');
        const warehouseIds = managedWarehouses.map(w => w._id);
        if (warehouseIds.length > 0) {
          warehouseFilter.warehouse = { $in: warehouseIds };
        } else {
          // No warehouses assigned, return empty stats
          return res.json({
            success: true,
            data: {
              totalItems: 0,
              outOfStockItems: 0,
              activeItems: 0,
              totalValue: 0
            }
          });
        }
      } catch (e) {
        console.warn('Warehouse scoping failed:', e.message);
      }
    }
    
    // Count total inventory records (one per product per warehouse)
    const totalItems = await Inventory.countDocuments(warehouseFilter);
    
    // Count out of stock items using currentStock (from Stock movements)
    const outOfStockFilter = {
      ...warehouseFilter,
      $or: [
        { currentStock: 0 },
        { currentStock: { $exists: false }, weight: 0 }
      ]
    };
    const outOfStockItems = await Inventory.countDocuments(outOfStockFilter);
    
    // Count active items (have stock)
    const activeItemsFilter = {
      ...warehouseFilter,
      status: "Active",
      $or: [
        { currentStock: { $gt: 0 } },
        { currentStock: { $exists: false }, weight: { $gt: 0 } }
      ]
    };
    const activeItems = await Inventory.countDocuments(activeItemsFilter);
    
    // Calculate total value from all inventory items
    // Get inventory with populated product to get price
    const inventoryItems = await Inventory.find(warehouseFilter)
      .populate('product', 'price purchasePrice')
      .populate('warehouse', 'name')
      .select('currentStock weight product price');
    
    const totalValue = inventoryItems.reduce((sum, item) => {
      // Use product price if available, otherwise legacy price
      const price = item.product?.price || item.price || 0;
      // Use currentStock (from Stock movements) or fallback to weight
      const stock = item.currentStock !== undefined ? item.currentStock : (item.weight || 0);
      const itemValue = price * stock;
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
      message: "Error fetching inventory summary",
      error: error.message
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
    const { warehouseId } = req.params;
    const { category, status, search, includeSummary } = req.query;

    if (!warehouseId || !mongoose.Types.ObjectId.isValid(warehouseId)) {
      return res.status(400).json({
        success: false,
        message: "Valid warehouseId is required"
      });
    }

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
        { code: { $regex: search, $options: 'i' } }
      ];
    }

    const inventoryItems = await Inventory.find(filter)
      .populate('product', 'name code category unit minimumStock')
      .sort({ name: 1 });

    const items = inventoryItems.map(item => ({
      _id: item._id,
      name: item.name || item.product?.name,
      code: item.code || item.product?.code,
      category: item.category || item.product?.category,
      currentStock: item.currentStock ?? item.weight ?? 0,
      minimumStock: item.minimumStock ?? item.product?.minimumStock ?? 0,
      unit: item.unit || item.product?.unit || 'units',
      status: item.status,
      product: item.product,
      warehouse: item.warehouse
    }));

    let summary = null;
    if (includeSummary === 'true') {
      const totalQuantity = items.reduce((sum, item) => sum + (item.currentStock || 0), 0);
      const groupedCategories = items.reduce((acc, item) => {
        const key = item.category || 'Uncategorized';
        acc[key] = (acc[key] || 0) + (item.currentStock || 0);
        return acc;
      }, {});

      summary = {
        totalItems: items.length,
        totalQuantity,
        categories: groupedCategories
      };
    }

    res.json({
      success: true,
      data: items,
      summary
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
