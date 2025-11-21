import mongoose from "mongoose";
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

      // Update User model to set warehouse field when manager is assigned
      if (manager) {
        try {
          await User.findByIdAndUpdate(
            manager,
            { warehouse: newWarehouse._id },
            { new: true }
          );
          console.log('Updated user warehouse field for manager:', manager);
        } catch (userUpdateError) {
          console.error('Error updating user warehouse field:', userUpdateError);
          // Don't fail the whole operation if user update fails
        }
      }

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
    const { warehouseNumber, name, location, status, description, manager, capacity, contact } = req.body;
    
    // Get the current warehouse to check for manager changes
    const currentWarehouse = await Warehouse.findById(req.params.id);
    if (!currentWarehouse) {
      return res.status(404).json({ 
        success: false,
        message: "Warehouse not found" 
      });
    }

    // Prepare update data
    const updateData = {};
    if (warehouseNumber !== undefined) updateData.warehouseNumber = warehouseNumber;
    if (name !== undefined) updateData.name = name;
    if (location !== undefined) updateData.location = location;
    if (status !== undefined) updateData.status = status;
    if (description !== undefined) updateData.description = description;
    if (manager !== undefined) updateData.manager = manager;
    if (capacity !== undefined) updateData.capacity = capacity;
    if (contact !== undefined) updateData.contact = contact;

    const updatedWarehouse = await Warehouse.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    );

    if (!updatedWarehouse) {
      return res.status(404).json({ 
        success: false,
        message: "Warehouse not found" 
      });
    }

    // Handle manager assignment changes
    const oldManagerId = currentWarehouse.manager?.toString();
    const newManagerId = manager ? manager.toString() : null;

    // If manager changed, update User models
    if (oldManagerId !== newManagerId) {
      try {
        // Clear warehouse field from old manager if exists
        if (oldManagerId) {
          await User.findByIdAndUpdate(
            oldManagerId,
            { $unset: { warehouse: "" } },
            { new: true }
          );
          console.log('Cleared warehouse field from old manager:', oldManagerId);
        }

        // Set warehouse field for new manager
        if (newManagerId) {
          await User.findByIdAndUpdate(
            newManagerId,
            { warehouse: updatedWarehouse._id },
            { new: true }
          );
          console.log('Updated warehouse field for new manager:', newManagerId);
        }
      } catch (userUpdateError) {
        console.error('Error updating user warehouse fields:', userUpdateError);
        // Don't fail the whole operation if user update fails
      }
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

    // Get current warehouse to check for manager changes
    const currentWarehouse = await Warehouse.findById(req.params.id);
    if (!currentWarehouse) {
      return res.status(404).json({
        success: false,
        message: "Warehouse not found"
      });
    }

    const oldManagerId = currentWarehouse.manager?.toString();
    const newManagerId = managerId.toString();

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

    // Update User models when manager changes
    if (oldManagerId !== newManagerId) {
      try {
        // Clear warehouse field from old manager if exists
        if (oldManagerId) {
          await User.findByIdAndUpdate(
            oldManagerId,
            { $unset: { warehouse: "" } },
            { new: true }
          );
          console.log('Cleared warehouse field from old manager:', oldManagerId);
        }

        // Set warehouse field for new manager
        await User.findByIdAndUpdate(
          newManagerId,
          { warehouse: updatedWarehouse._id },
          { new: true }
        );
        console.log('Updated warehouse field for new manager:', newManagerId);
      } catch (userUpdateError) {
        console.error('Error updating user warehouse fields:', userUpdateError);
        // Don't fail the whole operation if user update fails
      }
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
    const Inventory = (await import("../model/inventory.js")).default;
    
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
    
    // Calculate bags inventory - purchase history kept for reference only
    // Actual stock comes from Inventory collection (centralized table)
    const bagsInventory = {
      ata: { totalBags: 0, currentStock: 0, bags: [] },
      maida: { totalBags: 0, currentStock: 0, bags: [] },
      suji: { totalBags: 0, currentStock: 0, bags: [] },
      fine: { totalBags: 0, currentStock: 0, bags: [] }
    };
    
    // Process regular purchases (for history/reference only, not for totals)
    purchases.forEach(purchase => {
      if (purchase.purchaseType === 'Bags' || purchase.purchaseType === 'Other') {
        if (purchase.bags?.ata?.quantity > 0) {
          bagsInventory.ata.bags.push({
            purchaseNumber: purchase.purchaseNumber,
            quantity: purchase.bags.ata.quantity,
            unit: purchase.bags.ata.unit,
            date: purchase.purchaseDate,
            type: 'Purchase History'
          });
        }
        if (purchase.bags?.maida?.quantity > 0) {
          bagsInventory.maida.bags.push({
            purchaseNumber: purchase.purchaseNumber,
            quantity: purchase.bags.maida.quantity,
            unit: purchase.bags.maida.unit,
            date: purchase.purchaseDate,
            type: 'Purchase History'
          });
        }
        if (purchase.bags?.suji?.quantity > 0) {
          bagsInventory.suji.bags.push({
            purchaseNumber: purchase.purchaseNumber,
            quantity: purchase.bags.suji.quantity,
            unit: purchase.bags.suji.unit,
            date: purchase.purchaseDate,
            type: 'Purchase History'
          });
        }
        if (purchase.bags?.fine?.quantity > 0) {
          bagsInventory.fine.bags.push({
            purchaseNumber: purchase.purchaseNumber,
            quantity: purchase.bags.fine.quantity,
            unit: purchase.bags.fine.unit,
            date: purchase.purchaseDate,
            type: 'Purchase History'
          });
        }
      }
    });
    
    // Process bag purchases (for history/reference only)
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
              bagsInventory[inventoryType].bags.push({
                purchaseNumber: purchase.purchaseNumber,
                quantity: bagData.quantity,
                unit: bagData.unit,
                date: purchase.purchaseDate,
                type: 'Purchase History'
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
              bagsInventory[inventoryType].bags.push({
                purchaseNumber: purchase.purchaseNumber,
                quantity: bagData.quantity,
                unit: bagData.unit,
                date: purchase.purchaseDate,
                type: 'Purchase History'
              });
            }
          });
        }
      }
    });
    
    // Calculate wheat inventory - prioritize live inventory from Inventory collection
    // Purchase history is kept for reference but actual stock comes from Inventory
    const wheatInventory = {
      totalWheat: 0,
      currentStock: 0, // This will be set from live inventory
      wheat: [] // Purchase history for reference
    };
    
    // Process regular purchases for wheat (for history/reference only)
    purchases.forEach(purchase => {
      if ((purchase.purchaseType === 'Food' || purchase.purchaseType === 'Other') && purchase.food?.wheat?.quantity > 0) {
        wheatInventory.wheat.push({
          purchaseNumber: purchase.purchaseNumber,
          quantity: purchase.food.wheat.quantity,
          unit: purchase.food.wheat.unit,
          date: purchase.purchaseDate,
          source: purchase.food.wheat.source,
          quality: purchase.food.wheat.quality,
          type: 'Purchase History'
        });
      }
    });
    
    // Process food purchases (for history/reference only)
    foodPurchases.forEach(purchase => {
      if (purchase.foodItems && purchase.foodItems.length > 0) {
        purchase.foodItems.forEach(foodItem => {
          wheatInventory.wheat.push({
            purchaseNumber: purchase.purchaseNumber,
            quantity: foodItem.quantity,
            unit: foodItem.unit,
            date: purchase.purchaseDate,
            source: 'Private',
            quality: foodItem.quality || 'Standard',
            type: 'Purchase History'
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
    
    // Pull live inventory from Inventory collection
    const inventoryItems = await Inventory.find({ warehouse: warehouseId })
      .populate('product', 'name code category unit minimumStock')
      .sort({ updatedAt: -1 });

    const bagTypes = ['ata', 'maida', 'suji', 'fine'];
    const liveBags = bagTypes.reduce((acc, type) => {
      acc[type] = { total: 0, entries: [] };
      return acc;
    }, {});
    const liveWheat = { total: 0, entries: [] };

    const actualInventoryArray = inventoryItems
      .map(item => {
        const quantity = item.currentStock ?? item.weight ?? 0;
        return {
          productId: item._id.toString(),
          productName: item.name || item.product?.name || 'Inventory Item',
          unit: item.unit || item.product?.unit || 'units',
          category: item.category || item.product?.category || 'Uncategorized',
          currentStock: quantity,
          minimumStock: item.minimumStock ?? item.product?.minimumStock ?? 0,
          updatedAt: item.updatedAt || item.createdAt
        };
      })
      .filter(item => item.currentStock > 0)
      .sort((a, b) => b.currentStock - a.currentStock);

    actualInventoryArray.forEach(item => {
      const normalizedName = item.productName.toLowerCase();
      const normalizedCategory = item.category?.toLowerCase() || '';
      const record = {
        purchaseNumber: 'Current Stock',
        quantity: item.currentStock,
        unit: item.unit,
        date: item.updatedAt
      };
      
      bagTypes.forEach(type => {
        if (normalizedName.includes(type) || normalizedCategory.includes(type)) {
          liveBags[type].total += item.currentStock;
          liveBags[type].entries.push(record);
        }
      });

      if (normalizedCategory.includes('wheat') || normalizedName.includes('wheat')) {
        liveWheat.total += item.currentStock;
        liveWheat.entries.push({
          ...record,
          source: 'Inventory',
          quality: 'Current'
        });
      }
    });

    // ALWAYS use live inventory as the source of truth for bags
    // Purchase history is kept for reference but actual stock comes from Inventory collection
    bagTypes.forEach(type => {
      if (liveBags[type].total > 0) {
        // Use live inventory as the actual current stock
        bagsInventory[type].currentStock = liveBags[type].total;
        bagsInventory[type].totalBags = liveBags[type].total; // This is the actual available stock
        // Add live inventory entries at the top (most important)
        bagsInventory[type].bags = [
          ...liveBags[type].entries.map(entry => ({
            ...entry,
            type: 'Current Stock',
            source: 'Inventory'
          })),
          ...(bagsInventory[type].bags || [])
        ];
      } else {
        // If no live inventory, set to 0 (don't show purchase history as available stock)
        bagsInventory[type].currentStock = 0;
        bagsInventory[type].totalBags = 0;
        // Still show purchase history for reference, but mark it clearly
        bagsInventory[type].bags = (bagsInventory[type].bags || []).map(item => ({
          ...item,
          type: item.type || 'Purchase History (Not Available)'
        }));
      }
    });

    // ALWAYS use live inventory as the source of truth for current stock
    // Purchase history is kept for reference but actual stock comes from Inventory collection
    if (liveWheat.total > 0) {
      // Use live inventory as the actual current stock
      wheatInventory.currentStock = liveWheat.total;
      wheatInventory.totalWheat = liveWheat.total; // This is the actual available stock
      
      // Add live inventory entries at the top (most important)
      wheatInventory.wheat = [
        ...liveWheat.entries.map(entry => ({
          ...entry,
          type: 'Current Stock',
          source: 'Inventory'
        })),
        ...(wheatInventory.wheat || [])
      ];
    } else {
      // If no live inventory, set to 0 (don't show purchase history as available stock)
      wheatInventory.currentStock = 0;
      wheatInventory.totalWheat = 0;
      // Still show purchase history for reference, but mark it clearly
      wheatInventory.wheat = (wheatInventory.wheat || []).map(item => ({
        ...item,
        type: 'Purchase History (Not Available)'
      }));
    }
    
    // Calculate totals from actual current stock (centralized Inventory table)
    // Use currentStock which comes from Inventory collection, not purchase history
    const totalBags = bagsInventory.ata.currentStock + bagsInventory.maida.currentStock + 
                      bagsInventory.suji.currentStock + bagsInventory.fine.currentStock;
    
    // Use currentStock if available (from Inventory), otherwise totalWheat (which should be currentStock)
    const totalWheat = wheatInventory.currentStock || wheatInventory.totalWheat || 0;
    const totalProductionProducts = productionInventory.products.length;
    
    // Calculate actual stock totals
    const actualStockTotals = {
      totalItems: actualInventoryArray.length,
      totalQuantity: actualInventoryArray.reduce((sum, item) => sum + item.currentStock, 0),
      totalValue: actualInventoryArray.reduce((sum, item) => {
        const inventoryItem = inventoryItems.find(inv => inv._id.toString() === item.productId);
        const price = inventoryItem?.price || 0;
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