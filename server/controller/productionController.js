import Production from "../model/Production.js";
import Inventory from "../model/inventory.js";
import Stock from "../model/stock.js";
import Warehouse from "../model/warehouse.js";
import Notification from "../model/Notification.js";

// Create production with real-time inventory integration
export const createProduction = async (req, res) => {
  try {
    console.log("Production creation - User ID:", req.user._id || req.user.id);
    console.log("Production creation - User object:", req.user);

    const {
      batchNumber,
      productName,
      productType,
      quantity,
      productionCost,
      quality,
      productionDate,
      warehouse,
      notes,
      rawMaterials // New field for raw materials used
    } = req.body;

    // Check if batch number already exists
    const existingProduction = await Production.findOne({ batchNumber });
    if (existingProduction) {
      return res.status(400).json({
        success: false,
        message: "Batch number already exists"
      });
    }

    // Verify warehouse exists
    const warehouseExists = await Warehouse.findById(warehouse);
    if (!warehouseExists) {
      return res.status(400).json({
        success: false,
        message: "Warehouse not found"
      });
    }

    // Calculate total cost
    const totalCost = productionCost.rawMaterialCost + productionCost.laborCost + productionCost.overheadCost;
    
    // Create production record
    const production = new Production({
      batchNumber,
      productName,
      productType,
      quantity,
      productionCost: {
        ...productionCost,
        totalCost: totalCost
      },
      quality: {
        grade: quality?.grade || "Standard",
        moistureContent: quality?.moistureContent || quality?.moisture || 0,
        proteinContent: quality?.proteinContent || quality?.protein || 0
      },
      productionDate: productionDate ? new Date(productionDate) : new Date(),
      warehouse,
      notes,
      addedBy: req.user._id || req.user.id || "507f1f77bcf86cd799439011",
      status: "Completed"
    });

    await production.save();

    // REAL-TIME INVENTORY INTEGRATION
    console.log("Starting real-time inventory integration for production...");

    // 1. Deduct raw materials from inventory
    if (rawMaterials && rawMaterials.length > 0) {
      for (const rawMaterial of rawMaterials) {
        const inventoryItem = await Inventory.findById(rawMaterial.inventoryItem);
        if (inventoryItem) {
          // Check if sufficient stock
          if (inventoryItem.currentStock < rawMaterial.quantity) {
            return res.status(400).json({
              success: false,
              message: `Insufficient stock for ${inventoryItem.name}. Available: ${inventoryItem.currentStock}, Required: ${rawMaterial.quantity}`
            });
          }

          // Create stock out movement for raw material
          const stockOut = new Stock({
            inventoryItem: rawMaterial.inventoryItem,
            movementType: 'out',
            quantity: rawMaterial.quantity,
            reason: `Production - ${batchNumber}`,
            referenceNumber: `PROD-${batchNumber}`,
            warehouse: inventoryItem.warehouse,
            createdBy: req.user._id || req.user.id
          });

          await stockOut.save();
          console.log(`Deducted ${rawMaterial.quantity} units of ${inventoryItem.name} for production`);
        }
      }
    }

    // 2. Add finished product to inventory
    // Check if finished product already exists in warehouse
    let finishedProduct = await Inventory.findOne({
      name: productName,
      warehouse: warehouse,
      category: productType === "Finished Goods" ? "Finished Products" : "Raw Materials"
    });

    if (finishedProduct) {
      // Add stock to existing inventory item
      const stockIn = new Stock({
        inventoryItem: finishedProduct._id,
        movementType: 'in',
        quantity: quantity.value,
        reason: `Production - ${batchNumber}`,
        referenceNumber: `PROD-${batchNumber}`,
        warehouse: warehouse,
        createdBy: req.user._id || req.user.id
      });

      await stockIn.save();
      console.log(`Added ${quantity.value} units of ${productName} to existing inventory`);
    } else {
      // Create new inventory item for finished product
      const newInventoryItem = new Inventory({
        name: productName,
        category: productType === "Finished Goods" ? "Finished Products" : "Raw Materials",
        subcategory: productName,
        description: `Produced on ${new Date().toLocaleDateString()}`,
        unit: quantity.unit,
        currentStock: 0, // Will be updated by stock movement
        minimumStock: 10, // Default minimum stock
        warehouse: warehouse,
        cost: {
          purchasePrice: totalCost / quantity.value, // Cost per unit
          currency: "PKR"
        },
        status: "Active"
      });

      await newInventoryItem.save();

      // Add stock to new inventory item
      const stockIn = new Stock({
        inventoryItem: newInventoryItem._id,
        movementType: 'in',
        quantity: quantity.value,
        reason: `Production - ${batchNumber}`,
        referenceNumber: `PROD-${batchNumber}`,
        warehouse: warehouse,
        createdBy: req.user._id || req.user.id
      });

      await stockIn.save();
      console.log(`Created new inventory item and added ${quantity.value} units of ${productName}`);
    }

    // 3. Create notification for production completion
    const notification = new Notification({
      title: "Production Completed",
      message: `Production batch ${batchNumber} for ${productName} has been completed and added to inventory`,
      type: "production",
      priority: "medium",
      user: req.user._id || req.user.id,
      data: {
        productionId: production._id,
        batchNumber: batchNumber,
        productName: productName,
        quantity: quantity.value
      }
    });

    await notification.save();

    // Populate the response
    await production.populate('warehouse', 'name location');
    await production.populate('addedBy', 'firstName lastName');

    res.status(201).json({
      success: true,
      message: "Production record created successfully with real-time inventory integration",
      data: production
    });

  } catch (error) {
    console.error("Create production error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while creating production record",
      error: error.message
    });
  }
};

// Get all production records
export const getAllProductions = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search,
      productName,
      status,
      warehouse,
      startDate,
      endDate,
      quality
    } = req.query;

    // Build filter object
    const filter = {};
    
    if (search) {
      filter.$or = [
        { batchNumber: { $regex: search, $options: 'i' } },
        { productName: { $regex: search, $options: 'i' } },
        { productType: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (productName) filter.productName = productName;
    if (status) filter.status = status;
    if (warehouse) filter.warehouse = warehouse;
    if (quality) filter.quality = quality;
    
    if (startDate || endDate) {
      filter.productionDate = {};
      if (startDate) filter.productionDate.$gte = new Date(startDate);
      if (endDate) filter.productionDate.$lte = new Date(endDate);
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Get total count for pagination
    const total = await Production.countDocuments(filter);
    
    // Get production records with pagination
    const productions = await Production.find(filter)
      .populate('warehouse', 'name location')
      .populate('addedBy', 'firstName lastName')
      .sort({ productionDate: -1, createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Calculate pagination info
    const totalPages = Math.ceil(total / parseInt(limit));
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    res.json({
      success: true,
      data: productions,
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
    console.error("Get productions error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching production records",
      error: error.message
    });
  }
};

// Get single production record
export const getProductionById = async (req, res) => {
  try {
    const production = await Production.findById(req.params.id)
      .populate("warehouse", "name location")
      .populate("addedBy", "firstName lastName")
      .populate("process.operator", "firstName lastName")
      .populate("quality.approvedBy", "firstName lastName");

    if (!production) {
      return res.status(404).json({
        success: false,
        message: "Production record not found"
      });
    }

    res.json({
      success: true,
      data: production
    });

  } catch (error) {
    console.error("Get production error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching production record",
      error: error.message
    });
  }
};

// Update production record
export const updateProduction = async (req, res) => {
  try {
    // Check if production record exists
    const production = await Production.findById(req.params.id);
    if (!production) {
      return res.status(404).json({
        success: false,
        message: "Production record not found"
      });
    }

    // Check if batch number is being changed and if it already exists
    if (req.body.batchNumber && req.body.batchNumber !== production.batchNumber) {
      const existingBatch = await Production.findOne({ 
        batchNumber: req.body.batchNumber,
        _id: { $ne: req.params.id }
      });
      if (existingBatch) {
        return res.status(400).json({
          success: false,
          message: "Batch number already exists"
        });
      }
    }

    // Update production record
    const updatedProduction = await Production.findByIdAndUpdate(
      req.params.id,
      { ...req.body, updatedAt: new Date() },
      { new: true, runValidators: true }
    ).populate("warehouse", "name location")
     .populate("addedBy", "firstName lastName");

    res.json({
      success: true,
      message: "Production record updated successfully",
      data: updatedProduction
    });

  } catch (error) {
    console.error("Update production error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while updating production record",
      error: error.message
    });
  }
};

// Delete production record
export const deleteProduction = async (req, res) => {
  try {
    const production = await Production.findById(req.params.id);
    if (!production) {
      return res.status(404).json({
        success: false,
        message: "Production record not found"
      });
    }

    await Production.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: "Production record deleted successfully"
    });

  } catch (error) {
    console.error("Delete production error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while deleting production record",
      error: error.message
    });
  }
};

// Get daily production summary
export const getDailyProduction = async (req, res) => {
  try {
    const date = new Date(req.params.date);
    if (isNaN(date.getTime())) {
      return res.status(400).json({
        success: false,
        message: "Invalid date format"
      });
    }

    const dailyProductions = await Production.getDailyProduction(date);

    // Calculate daily totals
    const dailySummary = {
      date: req.params.date,
      totalBatches: dailyProductions.length,
      totalQuantity: dailyProductions.reduce((sum, prod) => sum + prod.quantity.value, 0),
      totalCost: dailyProductions.reduce((sum, prod) => sum + prod.productionCost.totalCost, 0),
      totalWastage: dailyProductions.reduce((sum, prod) => sum + prod.wastage.quantity, 0),
      products: dailyProductions.map(prod => ({
        batchNumber: prod.batchNumber,
        productName: prod.productName,
        quantity: prod.quantity.value,
        unit: prod.quantity.unit,
        cost: prod.productionCost.totalCost,
        wastage: prod.wastage.quantity
      }))
    };

    res.json({
      success: true,
      data: dailySummary
    });

  } catch (error) {
    console.error("Get daily production error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching daily production summary",
      error: error.message
    });
  }
};
