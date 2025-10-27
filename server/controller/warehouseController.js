import Warehouse from "../model/wareHouse.js";
import User from "../model/user.js";
import { isOfflineModeEnabled, mockDatabase } from "../config/offline-mode.js";

// Add new warehouse (Admin only)
export const addWarehouse = async (req, res) => {
  try {
    console.log('addWarehouse called with body:', req.body);
    console.log('🔍 Checking offline mode status:', isOfflineModeEnabled());
    
    // Check if offline mode is enabled
    if (isOfflineModeEnabled()) {
      console.log('🔄 Using offline mode for warehouse creation');
      const newWarehouse = await mockDatabase.warehouses.create(req.body);
      return res.status(201).json({ 
        success: true,
        message: "Warehouse added successfully (offline mode)", 
        data: newWarehouse 
      });
    }

    const { 
      name, 
      location, 
      status, 
      description, 
      manager, 
      capacity, 
      contact 
    } = req.body;

    console.log('Extracted data:', { name, location, status, description, manager, capacity, contact });

    // If manager is provided, fetch their contact information
    let managerContact = null;
    if (manager) {
      try {
        // In offline mode, skip user lookup
        if (isOfflineModeEnabled()) {
          console.log('🔄 Offline mode: Skipping manager contact lookup');
          managerContact = {
            name: 'Mock Manager',
            email: 'manager@example.com',
            phone: '123-456-7890',
            address: {
              street: 'Mock Street',
              city: 'Mock City',
              state: 'Mock State',
              zipCode: '12345',
              country: 'Pakistan'
            }
          };
        } else {
          const managerUser = await User.findById(manager).select('firstName lastName email mobile address');
          if (managerUser) {
            managerContact = {
              name: `${managerUser.firstName} ${managerUser.lastName}`,
              email: managerUser.email,
              phone: managerUser.mobile,
              address: {
                street: '',
                city: '',
                state: '',
                zipCode: '',
                country: managerUser.address || 'Pakistan'
              }
            };
            console.log('Fetched manager contact info:', managerContact);
          }
        }
      } catch (error) {
        console.error('Error fetching manager contact info:', error);
        // Continue without manager contact info
      }
    }

    try {
      const newWarehouse = new Warehouse({
        name,
        location,
        status,
        description,
        manager,
        capacity,
        contact: managerContact || contact // Use fetched manager contact or provided contact
      });

      console.log('Created warehouse object:', newWarehouse);

      await newWarehouse.save();

      console.log('Warehouse saved successfully');

      res.status(201).json({ 
        success: true,
        message: "Warehouse added successfully", 
        data: newWarehouse 
      });
    } catch (dbError) {
      console.log('🔄 Database operation failed, falling back to offline mode:', dbError.message);
      
      // Fallback to offline mode if database operation fails
      const newWarehouse = await mockDatabase.warehouses.create({
        name,
        location,
        status,
        description,
        manager,
        capacity,
        contact: managerContact || contact
      });
      
      res.status(201).json({ 
        success: true,
        message: "Warehouse added successfully (offline mode)", 
        data: newWarehouse 
      });
    }
  } catch (error) {
    console.error('Error in addWarehouse:', error);
    res.status(500).json({ 
      success: false,
      message: "Error adding warehouse", 
      error: error.message 
    });
  }
};

// Get all warehouses with pagination
export const getAllWarehouses = async (req, res) => {
  try {
    console.log('getAllWarehouses called with query:', req.query);

    // Check if offline mode is enabled
    if (isOfflineModeEnabled()) {
      console.log('🔄 Using offline mode for warehouse listing');
      const warehouses = await mockDatabase.warehouses.find();
      return res.status(200).json({
        success: true,
        message: "Warehouses retrieved successfully (offline mode)",
        data: warehouses,
        pagination: {
          current: 1,
          limit: warehouses.length,
          total: warehouses.length,
          pages: 1
        }
      });
    }

    const { page = 1, limit = 10, status } = req.query;
    
    // Build filter
    const filter = {};
    if (status && status !== 'all') {
      filter.status = status;
    }
    
    console.log('Filter:', filter);
    
    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    console.log('Pagination:', { page, limit, skip });
    
    // Get warehouses with pagination
    const warehouses = await Warehouse.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    console.log('Found warehouses:', warehouses.length);
    
    // Get total count for pagination
    const total = await Warehouse.countDocuments(filter);
    
    console.log('Total count:', total);
    
    res.status(200).json({
      success: true,
      data: warehouses,
      pagination: {
        current: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Error in getAllWarehouses:', error);
    res.status(500).json({ 
      success: false,
      message: "Error retrieving warehouses",
      error: error.message 
    });
  }
};

// Get a single warehouse by ID
export const getWarehouseById = async (req, res) => {
  try {
    const warehouse = await Warehouse.findById(req.params.id);
    if (!warehouse) {
      return res.status(404).json({ message: "Warehouse not found" });
    }
    res.status(200).json({
      success: true,
      data: warehouse
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ 
      success: false,
      message: "Error retrieving warehouse", 
      error: error.message 
    });
  }
};

// Update a warehouse by ID
export const updateWarehouse = async (req, res) => {
  try {
    const { warehouseNumber, name, location, status, description } = req.body;

    const updatedWarehouse = await Warehouse.findByIdAndUpdate(
      req.params.id,
      { warehouseNumber, name, location, status, description },
      { new: true }
    );

    if (!updatedWarehouse) {
      return res.status(404).json({ 
        success: false,
        message: "Warehouse not found" 
      });
    }

    res.status(200).json({ 
      success: true,
      message: "Warehouse updated successfully", 
      data: updatedWarehouse 
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ 
      success: false,
      message: "Error updating warehouse", 
      error: error.message 
    });
  }
};

// Delete a warehouse by ID
export const deleteWarehouse = async (req, res) => {
  try {
    const deletedWarehouse = await Warehouse.findByIdAndDelete(req.params.id);
    if (!deletedWarehouse) {
      return res.status(404).json({ 
        success: false,
        message: "Warehouse not found" 
      });
    }
    res.status(200).json({ 
      success: true,
      message: "Warehouse deleted successfully" 
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ 
      success: false,
      message: "Error deleting warehouse", 
      error: error.message 
    });
  }
};

// Search warehouses by query parameters
export const searchWarehouses = async (req, res) => {
    try {
      const { warehouseNumber, name, location, status } = req.query;
  
      // Build query filter
      const filter = {};
  
      if (warehouseNumber) filter.warehouseNumber = { $regex: warehouseNumber, $options: "i" }; // Case-insensitive search
      if (name) filter.name = { $regex: name, $options: "i" };
      if (location) filter.location = { $regex: location, $options: "i" };
      if (status) filter.status = status;
  
      // Find warehouses based on filter
      const warehouses = await Warehouse.find(filter);
  
      res.status(200).json({
        success: true,
        data: warehouses
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ 
        success: false,
        message: "Error searching warehouses", 
        error: error.message 
      });
    }
  };

  export const getActiveWarehouses = async (req, res) => {
    try {
      const activeWarehouses = await Warehouse.find({ status: "Active" });
      res.status(200).json({
        success: true,
        data: activeWarehouses
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ 
        success: false,
        message: "Error retrieving active warehouses", 
        error: error.message 
      });
    }
  };

// Update warehouse status
export const updateWarehouseStatus = async (req, res) => {
  try {
    const { status } = req.body;
    
    if (!status || !['Active', 'Inactive'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Status must be either 'Active' or 'Inactive'"
      });
    }

    const updatedWarehouse = await Warehouse.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );

    if (!updatedWarehouse) {
      return res.status(404).json({
        success: false,
        message: "Warehouse not found"
      });
    }

    res.status(200).json({
      success: true,
      message: "Warehouse status updated successfully",
      data: updatedWarehouse
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Error updating warehouse status",
      error: error.message
    });
  }
};

// Assign warehouse manager (Admin only)
export const assignWarehouseManager = async (req, res) => {
  try {
    const { managerId } = req.body;
    
    if (!managerId) {
      return res.status(400).json({
        success: false,
        message: "Manager ID is required"
      });
    }

    const updatedWarehouse = await Warehouse.findByIdAndUpdate(
      req.params.id,
      { manager: managerId },
      { new: true }
    ).populate('manager', 'firstName lastName email role');

    if (!updatedWarehouse) {
      return res.status(404).json({
        success: false,
        message: "Warehouse not found"
      });
    }

    res.status(200).json({
      success: true,
      message: "Warehouse manager assigned successfully",
      data: updatedWarehouse
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Error assigning warehouse manager",
      error: error.message
    });
  }
};

// Get warehouse inventory summary
export const getWarehouseInventorySummary = async (req, res) => {
  try {
    const warehouseId = req.params.id;
    
    // Import Inventory model
    const Inventory = (await import("../model/inventory.js")).default;
    
    // Get inventory items for this warehouse
    const inventoryItems = await Inventory.find({ warehouse: warehouseId });
    
    // Calculate summary
    const summary = {
      totalItems: inventoryItems.length,
      lowStockItems: inventoryItems.filter(item => item.currentStock <= item.minimumStock).length,
      outOfStockItems: inventoryItems.filter(item => item.currentStock === 0).length,
      totalValue: inventoryItems.reduce((sum, item) => sum + (item.currentStock * (item.cost?.purchasePrice || 0)), 0),
      categories: [...new Set(inventoryItems.map(item => item.category))]
    };

    res.status(200).json({
      success: true,
      data: summary
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Error retrieving warehouse inventory summary",
      error: error.message
    });
  }
};

// Get warehouse capacity status
export const getWarehouseCapacityStatus = async (req, res) => {
  try {
    const warehouses = await Warehouse.find({ status: 'Active' });
    
    const capacityStatus = warehouses.map(warehouse => ({
      id: warehouse._id,
      name: warehouse.name,
      location: warehouse.location,
      totalCapacity: warehouse.capacity?.totalCapacity || 0,
      currentUsage: warehouse.capacity?.currentUsage || 0,
      availableCapacity: warehouse.availableCapacity,
      capacityPercentage: warehouse.capacityPercentage,
      capacityStatus: warehouse.capacityStatus,
      unit: warehouse.capacity?.unit || '50kg bags'
    }));
    
    res.json({
      success: true,
      data: capacityStatus
    });
  } catch (error) {
    console.error("Get warehouse capacity status error:", error);
    res.status(500).json({
      success: false,
      message: "Error getting warehouse capacity status",
      error: error.message
    });
  }
};

// Get warehouse details with complete inventory
export const getWarehouseInventoryDetails = async (req, res) => {
  try {
    const warehouseId = req.params.id;
    
    // Import required models
    const Purchase = (await import("../model/Purchase.js")).default;
    const BagPurchase = (await import("../model/BagPurchase.js")).default;
    const FoodPurchase = (await import("../model/FoodPurchase.js")).default;
    const Production = (await import("../model/Production.js")).default;
    
    // Get warehouse
    const warehouse = await Warehouse.findById(warehouseId);
    if (!warehouse) {
      return res.status(404).json({
        success: false,
        message: "Warehouse not found"
      });
    }
    
    // Get all purchases for this warehouse (include all statuses except Cancelled)
    const purchases = await Purchase.find({ 
      warehouse: warehouseId,
      status: { $in: ['Draft', 'Pending', 'Ordered', 'Received'] }
    }).sort({ purchaseDate: -1 });
    
    // Get all bag purchases for this warehouse
    const bagPurchases = await BagPurchase.find({ 
      warehouse: warehouseId,
      status: { $in: ['Pending', 'Received', 'Completed'] }
    }).sort({ purchaseDate: -1 });
    
    // Get all food purchases for this warehouse
    const foodPurchases = await FoodPurchase.find({ 
      warehouse: warehouseId,
      status: { $in: ['Pending', 'Approved', 'Completed'] }
    }).sort({ purchaseDate: -1 });
    
    // Get all production records for this warehouse (destination warehouse)
    const productionRecords = await Production.find({ 
      destinationWarehouse: warehouseId,
      status: { $in: ['In Progress', 'Completed', 'Quality Check', 'Approved'] }
    }).sort({ productionDate: -1 });
    
    // Calculate bags inventory from purchases
    const bagsInventory = {
      ata: { totalBags: 0, bags: [] },
      maida: { totalBags: 0, bags: [] },
      suji: { totalBags: 0, bags: [] },
      fine: { totalBags: 0, bags: [] }
    };
    
    // Process regular purchases (with ata, maida, suji, fine structure)
    purchases.forEach(purchase => {
      if (purchase.purchaseType === 'Bags' || purchase.purchaseType === 'Other') {
        if (purchase.bags?.ata?.quantity > 0) {
          bagsInventory.ata.totalBags += purchase.bags.ata.quantity;
          bagsInventory.ata.bags.push({
            purchaseNumber: purchase.purchaseNumber,
            quantity: purchase.bags.ata.quantity,
            unit: purchase.bags.ata.unit,
            date: purchase.purchaseDate
          });
        }
        if (purchase.bags?.maida?.quantity > 0) {
          bagsInventory.maida.totalBags += purchase.bags.maida.quantity;
          bagsInventory.maida.bags.push({
            purchaseNumber: purchase.purchaseNumber,
            quantity: purchase.bags.maida.quantity,
            unit: purchase.bags.maida.unit,
            date: purchase.purchaseDate
          });
        }
        if (purchase.bags?.suji?.quantity > 0) {
          bagsInventory.suji.totalBags += purchase.bags.suji.quantity;
          bagsInventory.suji.bags.push({
            purchaseNumber: purchase.purchaseNumber,
            quantity: purchase.bags.suji.quantity,
            unit: purchase.bags.suji.unit,
            date: purchase.purchaseDate
          });
        }
        if (purchase.bags?.fine?.quantity > 0) {
          bagsInventory.fine.totalBags += purchase.bags.fine.quantity;
          bagsInventory.fine.bags.push({
            purchaseNumber: purchase.purchaseNumber,
            quantity: purchase.bags.fine.quantity,
            unit: purchase.bags.fine.unit,
            date: purchase.purchaseDate
          });
        }
      }
    });
    
    // Process bag purchases (with Map structure)
    bagPurchases.forEach(purchase => {
      if (purchase.bags) {
        // Handle Map structure
        if (purchase.bags instanceof Map) {
          purchase.bags.forEach((bagData, productType) => {
            const typeLower = productType.toLowerCase();
            let inventoryType = 'ata'; // default
            
            if (typeLower.includes('ata')) inventoryType = 'ata';
            else if (typeLower.includes('maida')) inventoryType = 'maida';
            else if (typeLower.includes('suji')) inventoryType = 'suji';
            else if (typeLower.includes('fine')) inventoryType = 'fine';
            
            if (bagData && bagData.quantity > 0) {
              bagsInventory[inventoryType].totalBags += bagData.quantity;
              bagsInventory[inventoryType].bags.push({
                purchaseNumber: purchase.purchaseNumber,
                quantity: bagData.quantity,
                unit: bagData.unit,
                date: purchase.purchaseDate
              });
            }
          });
        } 
        // Handle object structure
        else if (typeof purchase.bags === 'object') {
          Object.keys(purchase.bags).forEach(productType => {
            const bagData = purchase.bags[productType];
            const typeLower = productType.toLowerCase();
            let inventoryType = 'ata'; // default
            
            if (typeLower.includes('ata')) inventoryType = 'ata';
            else if (typeLower.includes('maida')) inventoryType = 'maida';
            else if (typeLower.includes('suji')) inventoryType = 'suji';
            else if (typeLower.includes('fine')) inventoryType = 'fine';
            
            if (bagData && bagData.quantity > 0) {
              bagsInventory[inventoryType].totalBags += bagData.quantity;
              bagsInventory[inventoryType].bags.push({
                purchaseNumber: purchase.purchaseNumber,
                quantity: bagData.quantity,
                unit: bagData.unit,
                date: purchase.purchaseDate
              });
            }
          });
        }
      }
    });
    
    // Calculate wheat inventory from purchases
    const wheatInventory = {
      totalWheat: 0,
      wheat: []
    };
    
    // Process regular purchases for wheat
    purchases.forEach(purchase => {
      if ((purchase.purchaseType === 'Food' || purchase.purchaseType === 'Other') && purchase.food?.wheat?.quantity > 0) {
        wheatInventory.totalWheat += purchase.food.wheat.quantity;
        wheatInventory.wheat.push({
          purchaseNumber: purchase.purchaseNumber,
          quantity: purchase.food.wheat.quantity,
          unit: purchase.food.wheat.unit,
          date: purchase.purchaseDate,
          source: purchase.food.wheat.source,
          quality: purchase.food.wheat.quality
        });
      }
    });
    
    // Process food purchases
    foodPurchases.forEach(purchase => {
      if (purchase.foodItems && purchase.foodItems.length > 0) {
        purchase.foodItems.forEach(foodItem => {
          wheatInventory.totalWheat += foodItem.quantity;
          wheatInventory.wheat.push({
            purchaseNumber: purchase.purchaseNumber,
            quantity: foodItem.quantity,
            unit: foodItem.unit,
            date: purchase.purchaseDate,
            source: 'Private',
            quality: foodItem.quality || 'Standard'
          });
        });
      }
    });
    
    // Calculate production output inventory
    const productionInventory = {
      products: []
    };
    
    productionRecords.forEach(production => {
      production.outputProducts.forEach(product => {
        const existingProduct = productionInventory.products.find(p => 
          p.productName === product.productName && p.unit === product.unit
        );
        
        if (existingProduct) {
          existingProduct.totalQuantity += product.quantity;
          existingProduct.totalWeight += product.totalWeight || 0;
        } else {
          productionInventory.products.push({
            productName: product.productName,
            quantity: product.quantity,
            weight: product.weight,
            unit: product.unit,
            totalQuantity: product.quantity,
            totalWeight: product.totalWeight || 0,
            batchNumber: production.batchNumber,
            productionDate: production.productionDate
          });
        }
      });
    });
    
    // Get actual stock levels from Stock movements
    const Stock = (await import("../model/stock.js")).default;
    const Inventory = (await import("../model/inventory.js")).default;
    
    // Get all stock movements for this warehouse
    const stockMovements = await Stock.find({ warehouse: warehouseId })
      .populate('inventoryItem')
      .sort({ createdAt: -1 });
    
    // Calculate actual inventory by aggregating stock movements
    const actualInventory = {};
    
    stockMovements.forEach(movement => {
      if (!movement.inventoryItem) return;
      
      const productId = movement.inventoryItem._id.toString();
      const productName = movement.inventoryItem.name || 'Unknown';
      
      if (!actualInventory[productId]) {
        actualInventory[productId] = {
          productId,
          productName,
          unit: movement.inventoryItem.unit || 'kg',
          category: movement.inventoryItem.category || 'Unknown',
          currentStock: 0,
          movements: []
        };
      }
      
      // Aggregate stock movements
      if (movement.movementType === 'in') {
        actualInventory[productId].currentStock += movement.quantity;
      } else if (movement.movementType === 'out') {
        actualInventory[productId].currentStock -= movement.quantity;
      }
      
      // Store movement details
      actualInventory[productId].movements.push({
        type: movement.movementType,
        quantity: movement.quantity,
        reason: movement.reason,
        referenceNumber: movement.referenceNumber,
        date: movement.createdAt
      });
    });
    
    // Convert to array and filter out products with 0 stock
    const actualInventoryArray = Object.values(actualInventory)
      .filter(item => item.currentStock > 0)
      .sort((a, b) => b.currentStock - a.currentStock);
    
    // Calculate totals
    const totalBags = bagsInventory.ata.totalBags + bagsInventory.maida.totalBags + 
                      bagsInventory.suji.totalBags + bagsInventory.fine.totalBags;
    
    const totalWheat = wheatInventory.totalWheat;
    const totalProductionProducts = productionInventory.products.length;
    
    // Calculate actual stock totals
    const actualStockTotals = {
      totalItems: actualInventoryArray.length,
      totalQuantity: actualInventoryArray.reduce((sum, item) => sum + item.currentStock, 0),
      totalValue: actualInventoryArray.reduce((sum, item) => {
        const inventoryItem = stockMovements.find(m => m.inventoryItem?._id?.toString() === item.productId)?.inventoryItem;
        const price = inventoryItem?.cost?.purchasePrice || 0;
        return sum + (item.currentStock * price);
      }, 0)
    };
    
    const response = {
      success: true,
      data: {
        warehouse: {
          _id: warehouse._id,
          warehouseNumber: warehouse.warehouseNumber,
          name: warehouse.name,
          location: warehouse.location,
          status: warehouse.status,
          capacity: warehouse.capacity,
          createdAt: warehouse.createdAt
        },
        inventory: {
          // Historical data from purchases
          bags: bagsInventory,
          wheat: wheatInventory,
          production: productionInventory,
          // Actual current stock
          actualStock: actualInventoryArray,
          actualStockTotals,
          summary: {
            totalBags,
            totalWheat,
            totalProductionProducts
          }
        }
      }
    };
    
    res.status(200).json(response);
  } catch (error) {
    console.error("Error in getWarehouseInventoryDetails:", error);
    res.status(500).json({
      success: false,
      message: "Error retrieving warehouse inventory details",
      error: error.message
    });
  }
};