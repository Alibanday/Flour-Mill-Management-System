import Production from "../model/Production.js";
import Inventory from "../model/inventory.js";
import Stock from "../model/stock.js";
import Warehouse from "../model/warehouse.js";
import Notification from "../model/Notification.js";
import Product from "../model/Product.js";

// Create production with real-time inventory integration
export const createProduction = async (req, res) => {
  try {
    console.log("Production creation - User ID:", req.user._id || req.user.id);
    console.log("Production creation - Data:", JSON.stringify(req.body, null, 2));

    const {
      sourceWarehouse,
      warehouse, // Form sends this as "warehouse"
      wheatQuantity,
      outputProducts,
      destinationWarehouse,
      wastage,
      productionDate,
      notes
    } = req.body;

    // Resolve warehouse IDs - check multiple possible field names
    // Form sends "warehouse" for source, so prioritize that
    const resolvedSourceWarehouse = warehouse || sourceWarehouse || req.body.sourceWarehouse || req.body.sourceWarehouseId;
    const resolvedDestinationWarehouse = destinationWarehouse || req.body.destinationWarehouse || req.body.destinationWarehouseId;

    console.log("🔍 Resolved warehouses:", {
      sourceWarehouse: resolvedSourceWarehouse,
      destinationWarehouse: resolvedDestinationWarehouse,
      originalBody: {
        warehouse: req.body.warehouse,
        sourceWarehouse: req.body.sourceWarehouse,
        destinationWarehouse: req.body.destinationWarehouse
      }
    });
    const parsedWheatQuantity = parseFloat(wheatQuantity ?? req.body.wheatQuantity ?? 0);
    const normalizedOutputProducts = Array.isArray(outputProducts) ? outputProducts : [];

    const sanitizeNumber = (value) => {
      const parsed = parseFloat(value);
      return Number.isFinite(parsed) ? parsed : 0;
    };

    const getInventoryStock = (inventoryDoc) => {
      if (!inventoryDoc) return 0;
      if (typeof inventoryDoc.currentStock === "number") return inventoryDoc.currentStock;
      if (typeof inventoryDoc.weight === "number") return inventoryDoc.weight;
      return 0;
    };

    // Validate required fields
    if (!resolvedSourceWarehouse || !resolvedDestinationWarehouse) {
      return res.status(400).json({
        success: false,
        message: "Source warehouse and destination warehouse are required"
      });
    }

    if (!parsedWheatQuantity || parsedWheatQuantity <= 0) {
      return res.status(400).json({
        success: false,
        message: "Valid wheat quantity is required"
      });
    }

    const cleanedOutputProducts = normalizedOutputProducts
      .map(product => ({
        productId: product?.productId || null,
        productName: product?.productName?.trim(),
        weight: sanitizeNumber(product?.weight),
        quantity: sanitizeNumber(product?.quantity),
        unit: product?.unit || "bags"
      }))
      .filter(product => (product.productId || product.productName) && product.weight > 0 && product.quantity > 0);

    if (!cleanedOutputProducts.length) {
      return res.status(400).json({
        success: false,
        message: "At least one valid output product is required"
      });
    }

    // Verify warehouses exist
    const sourceWarehouseExists = await Warehouse.findById(resolvedSourceWarehouse);
    const destWarehouseExists = await Warehouse.findById(resolvedDestinationWarehouse);

    if (!sourceWarehouseExists || !destWarehouseExists) {
      return res.status(400).json({
        success: false,
        message: "One or both warehouses not found"
      });
    }

    // Ensure there is enough wheat in the source warehouse
    // Get ALL inventory items for this warehouse - same logic as warehouse detail page
    const mongoose = (await import("mongoose")).default;
    let warehouseIdForQuery = resolvedSourceWarehouse;

    // Ensure warehouse ID is a valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(warehouseIdForQuery)) {
      return res.status(400).json({
        success: false,
        message: "Invalid warehouse ID format"
      });
    }

    // Convert to ObjectId if it's a string (for consistent comparison)
    if (typeof warehouseIdForQuery === 'string') {
      warehouseIdForQuery = new mongoose.Types.ObjectId(warehouseIdForQuery);
    }

    console.log(`🔍 Looking for wheat inventory in warehouse: ${warehouseIdForQuery} (type: ${typeof warehouseIdForQuery})`);
    console.log(`🔍 Also trying original resolvedSourceWarehouse: ${resolvedSourceWarehouse}`);

    // Try multiple query formats to handle both ObjectId and string warehouse IDs
    // First try with the converted ObjectId
    let allInventoryItems = await Inventory.find({
      warehouse: warehouseIdForQuery
    })
      .populate("product", "name code category subcategory unit");

    // If no items found, try with the original value (might be string)
    if (allInventoryItems.length === 0 && resolvedSourceWarehouse !== warehouseIdForQuery.toString()) {
      console.log(`⚠️ No items found with ObjectId, trying with original value...`);
      allInventoryItems = await Inventory.find({
        warehouse: resolvedSourceWarehouse
      })
        .populate("product", "name code category subcategory unit");
    }

    // If still no items, try with string conversion
    if (allInventoryItems.length === 0) {
      console.log(`⚠️ No items found, trying with string conversion...`);
      allInventoryItems = await Inventory.find({
        warehouse: warehouseIdForQuery.toString()
      })
        .populate("product", "name code category subcategory unit");
    }

    console.log(`📦 Found ${allInventoryItems.length} total inventory items in warehouse`);

    // If no inventory items found at all, the warehouse might be wrong or empty
    if (allInventoryItems.length === 0) {
      console.log(`⚠️ No inventory items found in warehouse ${warehouseIdForQuery}. Checking if warehouse exists...`);
      const Warehouse = (await import("../model/warehouse.js")).default;
      const warehouseCheck = await Warehouse.findById(warehouseIdForQuery);
      if (!warehouseCheck) {
        return res.status(400).json({
          success: false,
          message: `Warehouse with ID ${warehouseIdForQuery} not found`
        });
      }
      console.log(`✅ Warehouse exists: ${warehouseCheck.name}, but has no inventory items`);
      return res.status(400).json({
        success: false,
        message: "No inventory items found in the selected source warehouse. Please add stock first."
      });
    }

    // Filter for wheat items - use flexible detection to catch all wheat variations
    const wheatItems = allInventoryItems.filter(item => {
      // Get all possible fields
      const productName = item.name || item.product?.name || '';
      const category = item.category || item.product?.category || '';
      const subcategory = item.subcategory || item.product?.subcategory || '';

      // Normalize all fields
      const normalizedName = productName.toLowerCase();
      const normalizedCategory = category?.toLowerCase() || '';
      const normalizedSubcategory = subcategory?.toLowerCase() || '';

      // Check for wheat in multiple ways (very flexible)
      // Food purchases create items with category "Wheat Grain" or subcategory with wheat
      const isWheat =
        normalizedCategory.includes('wheat') ||
        normalizedName.includes('wheat') ||
        normalizedSubcategory.includes('wheat') ||
        normalizedCategory.includes('wheat grain') ||
        normalizedSubcategory.includes('wheat grain') ||
        (normalizedCategory.includes('raw') && (normalizedName.includes('grain') || normalizedSubcategory.includes('grain'))) ||
        normalizedName === 'wheat' ||
        normalizedSubcategory === 'wheat grain' ||
        normalizedSubcategory === 'wheat' ||
        // Also check if it's a raw material with grain in name/subcategory
        (normalizedCategory === 'raw materials' && (normalizedName.includes('grain') || normalizedSubcategory.includes('grain')));

      if (isWheat) {
        const stock = item.currentStock !== undefined ? item.currentStock : (item.weight || 0);
        console.log(`🌾 Found wheat item: ${productName}, category: ${category}, subcategory: ${subcategory}, stock: ${stock} kg`);
      }

      return isWheat;
    });

    // If no wheat items found with strict detection, try even more lenient approach
    // Check if any items have "Raw Materials" category and might be wheat
    if (wheatItems.length === 0) {
      console.log(`⚠️ No wheat items found with standard detection. Trying lenient detection...`);
      const lenientWheatItems = allInventoryItems.filter(item => {
        const category = (item.category || item.product?.category || '').toLowerCase();
        const subcategory = (item.subcategory || item.product?.subcategory || '').toLowerCase();
        const name = (item.name || item.product?.name || '').toLowerCase();

        // Very lenient: Raw Materials category with grain-related terms
        const isPossibleWheat =
          (category === 'raw materials' || category.includes('raw')) &&
          (subcategory.includes('grain') || name.includes('grain') || subcategory.includes('wheat') || name.includes('wheat'));

        if (isPossibleWheat) {
          const stock = item.currentStock !== undefined ? item.currentStock : (item.weight || 0);
          console.log(`🌾 Found possible wheat item (lenient): ${item.name || item.product?.name}, category: ${item.category || item.product?.category}, subcategory: ${item.subcategory || item.product?.subcategory}, stock: ${stock} kg`);
        }

        return isPossibleWheat;
      });

      if (lenientWheatItems.length > 0) {
        wheatItems.push(...lenientWheatItems);
        console.log(`✅ Added ${lenientWheatItems.length} wheat items via lenient detection`);
      }
    }

    console.log(`🌾 Found ${wheatItems.length} wheat inventory items`);

    if (wheatItems.length === 0) {
      // Last resort: Try to find ANY item with stock > 0 that might be wheat
      const itemsWithStock = allInventoryItems.filter(item => {
        const stock = item.currentStock !== undefined ? item.currentStock : (item.weight || 0);
        return stock > 0;
      });

      // Prepare debug info
      const debugInfo = {
        warehouseId: warehouseIdForQuery.toString(),
        totalInventoryItems: allInventoryItems.length,
        itemsWithStock: itemsWithStock.length,
        availableItems: allInventoryItems.map(item => ({
          _id: item._id?.toString(),
          name: item.name || item.product?.name || 'N/A',
          category: item.category || item.product?.category || 'N/A',
          subcategory: item.subcategory || item.product?.subcategory || 'N/A',
          stock: item.currentStock !== undefined ? item.currentStock : (item.weight || 0),
          productId: item.product?._id?.toString() || item.product?.toString() || 'N/A',
          normalizedName: (item.name || item.product?.name || '').toLowerCase(),
          normalizedCategory: (item.category || item.product?.category || '').toLowerCase(),
          normalizedSubcategory: (item.subcategory || item.product?.subcategory || '').toLowerCase()
        }))
      };

      console.log(`❌ DEBUG INFO:`, JSON.stringify(debugInfo, null, 2));
      console.log(`⚠️ No wheat items found. Available inventory items in warehouse:`);
      allInventoryItems.forEach(item => {
        const productName = item.name || item.product?.name || 'Unnamed';
        const category = item.category || item.product?.category || 'N/A';
        const subcategory = item.subcategory || item.product?.subcategory || 'N/A';
        const stock = item.currentStock !== undefined ? item.currentStock : (item.weight || 0);
        console.log(`  - Name: "${productName}", Category: "${category}", Subcategory: "${subcategory}", Stock: ${stock} kg`);
      });

      // TEMPORARY WORKAROUND: If there are items with stock, check if any might be wheat
      // Try to find items that could be wheat based on stock and category
      if (itemsWithStock.length > 0) {
        console.log(`⚠️ WARNING: No wheat items found with standard detection. Checking all items with stock...`);

        // Check all items with stock - if any have "Raw Materials" category or grain-related terms, use them
        const possibleWheatItems = itemsWithStock.filter(item => {
          const category = (item.category || item.product?.category || '').toLowerCase();
          const name = (item.name || item.product?.name || '').toLowerCase();
          const subcategory = (item.subcategory || item.product?.subcategory || '').toLowerCase();

          // Very lenient: accept if it's raw materials or has grain/wheat in any field
          const mightBeWheat =
            category.includes('raw') ||
            category.includes('wheat') ||
            name.includes('wheat') ||
            name.includes('grain') ||
            subcategory.includes('wheat') ||
            subcategory.includes('grain');

          if (mightBeWheat) {
            const stock = getInventoryStock(item);
            console.log(`🌾 Found possible wheat item: ${item.name || item.product?.name}, category: ${item.category || item.product?.category}, stock: ${stock} kg`);
          }

          return mightBeWheat;
        });

        if (possibleWheatItems.length > 0) {
          console.log(`✅ Using ${possibleWheatItems.length} possible wheat items`);
          wheatItems.push(...possibleWheatItems);
        } else {
          // Last resort: if no wheat-like items, but there are items with stock, 
          // assume the first one might be wheat (very lenient fallback)
          console.log(`⚠️ No wheat-like items found. Using all items with stock as potential wheat (very lenient fallback)`);
          wheatItems.push(...itemsWithStock);
        }
      } else {
        return res.status(400).json({
          success: false,
          message: "Wheat inventory not found in the selected source warehouse. Please add wheat stock first.",
          debug: debugInfo
        });
      }
    }

    // Sum up all wheat stock from all wheat inventory items (same as warehouse detail page)
    const availableWheat = wheatItems.reduce((total, item) => {
      const stock = getInventoryStock(item);
      return total + stock;
    }, 0);

    if (availableWheat < parsedWheatQuantity) {
      return res.status(400).json({
        success: false,
        message: `Insufficient wheat stock. Available: ${availableWheat} kg, Requested: ${parsedWheatQuantity} kg`
      });
    }

    // Create production record - batch number will be auto-generated
    const calculatedWastage = sanitizeNumber(
      wastage?.quantity ??
      (parsedWheatQuantity - cleanedOutputProducts.reduce((sum, product) => sum + (product.weight * product.quantity), 0))
    );

    const production = new Production({
      sourceWarehouse: resolvedSourceWarehouse,
      warehouse: resolvedDestinationWarehouse,
      wheatQuantity: parsedWheatQuantity,
      outputProducts: cleanedOutputProducts.map(product => ({
        ...product
      })),
      destinationWarehouse: resolvedDestinationWarehouse,
      wastage: {
        quantity: Math.max(0, calculatedWastage),
        reason: wastage?.reason || 'Processing Loss',
        unit: 'kg',
        cost: sanitizeNumber(wastage?.cost)
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

    // 1. Deduct wheat from source warehouse via stock movement
    // Split deduction across multiple inventory items if necessary
    let remainingWheatNeeded = parsedWheatQuantity;

    // Sort wheat items by stock (descending) to use largest piles first
    // This helps reduce the number of small fragmented stock entries
    const sortedWheatItems = [...wheatItems].sort((a, b) => {
      const stockA = getInventoryStock(a);
      const stockB = getInventoryStock(b);
      return stockB - stockA;
    });

    console.log(`Starting wheat deduction. Needed: ${remainingWheatNeeded}kg. Available items: ${sortedWheatItems.length}`);

    for (const item of sortedWheatItems) {
      if (remainingWheatNeeded <= 0) break;

      const currentStock = getInventoryStock(item);
      if (currentStock <= 0) continue;

      // Calculate how much to take from this item
      // Take up to the current stock amount, or just what's needed
      const deductAmount = Math.min(currentStock, remainingWheatNeeded);

      if (deductAmount > 0) {
        const wheatStockOut = new Stock({
          inventoryItem: item._id,
          movementType: 'out',
          quantity: deductAmount,
          reason: `Production - ${production.batchNumber}`,
          referenceNumber: `PROD-${production.batchNumber}`,
          warehouse: resolvedSourceWarehouse,
          createdBy: req.user._id || req.user.id
        });

        await wheatStockOut.save();

        remainingWheatNeeded -= deductAmount;
        console.log(`✅ Deducted ${deductAmount} kg of wheat from inventory item ${item._id} (Remaining needed: ${remainingWheatNeeded}kg)`);
      }
    }

    // If we still need wheat after checking all items, it means there was a discrepancy
    // between the initial check and the actual deduction (race condition or calculation error)
    if (remainingWheatNeeded > 0.01) { // Use small epsilon for float comparison
      console.warn(`⚠️ Could not deduct full wheat amount. Short by ${remainingWheatNeeded}kg. This might result in negative stock for the last item.`);

      // Force deduct the remainder from the largest item (or the first one) to ensure accounting balances
      // The Stock middleware might warn or error depending on configuration, but we need to record the usage
      const fallbackItem = sortedWheatItems[0];
      if (fallbackItem) {
        const finalStockOut = new Stock({
          inventoryItem: fallbackItem._id,
          movementType: 'out',
          quantity: remainingWheatNeeded,
          reason: `Production - ${production.batchNumber} (Remainder)`,
          referenceNumber: `PROD-${production.batchNumber}`,
          warehouse: resolvedSourceWarehouse,
          createdBy: req.user._id || req.user.id
        });
        await finalStockOut.save();
        console.log(`✅ Force deducted remaining ${remainingWheatNeeded} kg from item ${fallbackItem._id}`);
      }
    }

    // 2. Add output products to destination warehouse
    for (const outputProduct of cleanedOutputProducts) {
      let productCatalogEntry = null;

      // First try to find by productId if provided
      if (outputProduct.productId) {
        productCatalogEntry = await Product.findById(outputProduct.productId);
      }

      // If not found by ID, try by name
      if (!productCatalogEntry && outputProduct.productName) {
        const productNameRegex = new RegExp(`^${outputProduct.productName}$`, "i");
        productCatalogEntry = await Product.findOne({ name: productNameRegex });
      }

      // If still not found, create new product
      if (!productCatalogEntry) {
        productCatalogEntry = new Product({
          name: outputProduct.productName,
          category: "Finished Goods",
          subcategory: "Bags",
          description: `Produced via batch ${production.batchNumber}`,
          unit: outputProduct.unit || "bags",
          weight: outputProduct.weight,
          price: 0,
          purchasePrice: 0,
          minimumStock: 0,
          status: "Active"
        });
        await productCatalogEntry.save();
        console.log(`📦 Added ${outputProduct.productName} to product catalog`);
      }

      let productInventory = await Inventory.findOne({
        product: productCatalogEntry._id,
        warehouse: resolvedDestinationWarehouse
      });

      if (!productInventory) {
        productInventory = new Inventory({
          product: productCatalogEntry._id,
          warehouse: resolvedDestinationWarehouse,
          currentStock: 0,
          minimumStock: productCatalogEntry.minimumStock || 0,
          status: "Active",
          name: productCatalogEntry.name,
          code: productCatalogEntry.code,
          category: productCatalogEntry.category,
          subcategory: productCatalogEntry.subcategory
        });
      }

      const existingStock = getInventoryStock(productInventory);
      const newStockLevel = existingStock + outputProduct.quantity;

      productInventory.currentStock = newStockLevel;
      productInventory.status = newStockLevel === 0
        ? "Out of Stock"
        : (productInventory.minimumStock && newStockLevel <= productInventory.minimumStock ? "Low Stock" : "Active");
      productInventory.lastUpdated = new Date();

      await productInventory.save();

      const productStockIn = new Stock({
        inventoryItem: productInventory._id,
        movementType: 'in',
        quantity: outputProduct.quantity,
        reason: `Production - ${production.batchNumber}`,
        referenceNumber: `PROD-${production.batchNumber}`,
        warehouse: resolvedDestinationWarehouse,
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
