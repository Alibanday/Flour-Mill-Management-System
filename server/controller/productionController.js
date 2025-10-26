import Production from "../model/Production.js";
import Inventory from "../model/inventory.js";
import Stock from "../model/stock.js";
import Warehouse from "../model/warehouse.js";
import Notification from "../model/Notification.js";

// Create production with real-time inventory integration
export const createProduction = async (req, res) => {
  try {
    console.log("Production creation - User ID:", req.user._id || req.user.id);
    console.log("Production creation - Data:", JSON.stringify(req.body, null, 2));

    const {
      sourceWarehouse,
      wheatQuantity,
      outputProducts,
      destinationWarehouse,
      wastage,
      productionDate,
      notes
    } = req.body;

    // Validate required fields
    if (!sourceWarehouse || !destinationWarehouse) {
      return res.status(400).json({
        success: false,
        message: "Source warehouse and destination warehouse are required"
      });
    }

    if (!wheatQuantity || wheatQuantity <= 0) {
      return res.status(400).json({
        success: false,
        message: "Valid wheat quantity is required"
      });
    }

    if (!outputProducts || outputProducts.length === 0) {
      return res.status(400).json({
        success: false,
        message: "At least one output product is required"
      });
    }

    // Verify warehouses exist
    const sourceWarehouseExists = await Warehouse.findById(sourceWarehouse);
    const destWarehouseExists = await Warehouse.findById(destinationWarehouse);
    
    if (!sourceWarehouseExists || !destWarehouseExists) {
      return res.status(400).json({
        success: false,
        message: "One or both warehouses not found"
      });
    }

    // Check if there's sufficient wheat stock in source warehouse
    // TODO: This should query Stock movements to get actual wheat stock
    // For now, we'll skip this check
    console.log("⚠️  Wheat stock validation skipped - TODO: implement Stock movements query");
    
    // Create production record - batch number will be auto-generated
    const production = new Production({
      sourceWarehouse,
      wheatQuantity: parseFloat(wheatQuantity),
      outputProducts: outputProducts.map(product => ({
        productName: product.productName,
        weight: parseFloat(product.weight),
        quantity: parseFloat(product.quantity),
        unit: product.unit || 'bags'
      })),
      destinationWarehouse,
      wastage: {
        quantity: parseFloat(wastage?.quantity || 0),
        reason: wastage?.reason || 'Processing Loss',
        unit: 'kg',
        cost: 0
      },
      productionDate: productionDate ? new Date(productionDate) : new Date(),
      notes: notes || '',
      addedBy: req.user._id || req.user.id || "507f1f77bcf86cd799439011",
      status: "Completed"
    });

    await production.save();
    console.log("✅ Production record saved with batch number:", production.batchNumber);

    // REAL-TIME INVENTORY INTEGRATION
    console.log("Starting real-time inventory integration for production...");

    // 1. Deduct wheat from source warehouse
    // Find wheat inventory item
    const wheatItem = await Inventory.findOne({
      subcategory: 'Wheat',
      category: 'Raw Materials'
    });

    if (wheatItem) {
      // Create stock out movement for wheat
      const wheatStockOut = new Stock({
        inventoryItem: wheatItem._id,
        movementType: 'out',
        quantity: parseFloat(wheatQuantity),
        reason: `Production - ${production.batchNumber}`,
        referenceNumber: `PROD-${production.batchNumber}`,
        warehouse: sourceWarehouse,
        createdBy: req.user._id || req.user.id
      });

      await wheatStockOut.save();
      console.log(`✅ Deducted ${wheatQuantity} kg of wheat from source warehouse`);
    } else {
      console.warn("⚠️  Wheat inventory item not found, skipping wheat deduction");
    }

    // 2. Add output products to destination warehouse
    for (const outputProduct of outputProducts) {
      // Find or create the product in inventory
      let product = await Inventory.findOne({
        name: outputProduct.productName,
        subcategory: 'Bags'
      });

      if (!product) {
        // Create new product if it doesn't exist
        product = new Inventory({
          name: outputProduct.productName,
          category: 'Finished Goods',
          subcategory: 'Bags',
          weight: parseFloat(outputProduct.weight),
          price: 0, // Will be updated later
          status: 'Active'
        });
        await product.save();
        console.log(`📦 Created new inventory item: ${outputProduct.productName}`);
      }

      // Add stock to destination warehouse
      const productStockIn = new Stock({
        inventoryItem: product._id,
        movementType: 'in',
        quantity: parseFloat(outputProduct.quantity),
        reason: `Production - ${production.batchNumber}`,
        referenceNumber: `PROD-${production.batchNumber}`,
        warehouse: destinationWarehouse,
        createdBy: req.user._id || req.user.id
      });

      await productStockIn.save();
      console.log(`✅ Added ${outputProduct.quantity} units of ${outputProduct.productName} to destination warehouse`);
    }

    // 3. Create notification for production completion
    const notification = new Notification({
      title: "Production Completed",
      message: `Production batch ${production.batchNumber} has been completed`,
      type: "production",
      priority: "medium",
      user: req.user._id || req.user.id,
      data: {
        productionId: production._id,
        batchNumber: production.batchNumber,
        wheatQuantity: wheatQuantity,
        outputProducts: outputProducts.length
      }
    });

    await notification.save();
    console.log("✅ Notification created");

    // Populate the response
    await production.populate('sourceWarehouse', 'name location');
    await production.populate('destinationWarehouse', 'name location');
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
