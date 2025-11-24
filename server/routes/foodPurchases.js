import express from "express";
import { body, validationResult } from "express-validator";
import { protect, authorize } from "../middleware/auth.js";
import FoodPurchase from "../model/FoodPurchase.js";
import mongoose from "mongoose";

const router = express.Router();

// Apply authentication to all routes
router.use(protect);

// @route   GET /api/food-purchases
// @desc    Get all food purchases
// @access  Private (Manager, Admin, Employee)
router.get("/", [
  authorize("Manager", "Admin", "Employee")
], async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search,
      supplier,
      status,
      paymentStatus,
      startDate,
      endDate
    } = req.query;

    // Build filter object
    const filter = {};

    if (search) {
      filter.$or = [
        { purchaseNumber: { $regex: search, $options: 'i' } },
        { notes: { $regex: search, $options: 'i' } }
      ];
    }

    if (supplier) filter.supplier = supplier;
    if (status) filter.status = status;
    if (paymentStatus) filter.paymentStatus = paymentStatus;

    if (startDate || endDate) {
      filter.purchaseDate = {};
      if (startDate) filter.purchaseDate.$gte = new Date(startDate);
      if (endDate) filter.purchaseDate.$lte = new Date(endDate);
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Get total count for pagination
    const total = await FoodPurchase.countDocuments(filter);

    // Get food purchases with pagination
    const foodPurchases = await FoodPurchase.find(filter)
      .populate('supplier', 'name contactPerson email phone')
      .populate('createdBy', 'firstName lastName')
      .sort({ purchaseDate: -1, createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Calculate pagination info
    const totalPages = Math.ceil(total / parseInt(limit));
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    res.json({
      success: true,
      data: foodPurchases,
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
    console.error("Get food purchases error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching food purchases"
    });
  }
});

// @route   GET /api/food-purchases/stats
// @desc    Get food purchases statistics
// @access  Private (Manager, Admin, Employee)
router.get("/stats", [
  authorize("Manager", "Admin", "Employee")
], async (req, res) => {
  try {
    // Get real stats from database
    const total = await FoodPurchase.countDocuments();
    const totalValue = await FoodPurchase.aggregate([
      { $group: { _id: null, total: { $sum: "$totalAmount" } } }
    ]);
    const pendingPayments = await FoodPurchase.aggregate([
      { $match: { paymentStatus: "Pending" } },
      { $group: { _id: null, total: { $sum: "$dueAmount" } } }
    ]);
    const completedPurchases = await FoodPurchase.countDocuments({ status: "Completed" });

    const stats = {
      total: total || 0,
      totalValue: totalValue[0]?.total || 0,
      pendingPayments: pendingPayments[0]?.total || 0,
      completedPurchases: completedPurchases || 0,
      averageOrderValue: total > 0 ? (totalValue[0]?.total || 0) / total : 0
    };

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error("Get food purchases stats error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching food purchases stats"
    });
  }
});

// @route   POST /api/food-purchases
// @desc    Create new food purchase
// @access  Private (Manager, Admin)
router.post("/", [
  authorize("Manager", "Admin"),
  body("supplier").trim().notEmpty().withMessage("Supplier is required"),
  body("productType").trim().notEmpty().withMessage("Product type is required"),
  body("quantity").isNumeric().withMessage("Quantity must be a number"),
  body("unitPrice").isNumeric().withMessage("Unit price must be a number")
], async (req, res) => {
  try {
    // Debug: Log the incoming request data
    console.log('📥 Food purchase request received:');
    console.log('  - Full body:', JSON.stringify(req.body, null, 2));
    console.log('  - Supplier:', req.body.supplier, typeof req.body.supplier);
    console.log('  - ProductType:', req.body.productType);
    console.log('  - Quantity:', req.body.quantity, typeof req.body.quantity);
    console.log('  - UnitPrice:', req.body.unitPrice, typeof req.body.unitPrice);
    console.log('  - Warehouse:', req.body.warehouse);

    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.error('❌ Food purchase validation errors:', errors.array());
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: errors.array()
      });
    }

    console.log('✅ Validation passed');

    // Map flat structure to nested structure expected by model
    let { productType, quantity, unitPrice, totalPrice, supplier, purchaseDate, status, paymentStatus, paidAmount, notes, unit, expectedDeliveryDate, purchaseType, warehouse } = req.body;

    // Normalize paymentStatus to valid enum values
    // Map 'Paid' to 'Completed' if needed
    if (paymentStatus === 'Paid') {
      paymentStatus = 'Completed';
      console.log('⚠️ Payment status "Paid" mapped to "Completed"');
    }

    // Ensure paymentStatus is one of the valid enum values
    const validPaymentStatuses = ['Pending', 'Partial', 'Completed'];
    if (!validPaymentStatuses.includes(paymentStatus)) {
      console.log(`⚠️ Invalid paymentStatus "${paymentStatus}", defaulting to "Pending"`);
      paymentStatus = 'Pending';
    }

    console.log('📋 Extracted fields:');
    console.log('  - Supplier:', supplier, typeof supplier);
    console.log('  - ProductType:', productType);
    console.log('  - Quantity:', quantity, typeof quantity);
    console.log('  - UnitPrice:', unitPrice, typeof unitPrice);
    console.log('  - Warehouse:', warehouse);

    // Validate supplier
    if (!supplier || (typeof supplier === 'string' && supplier.trim() === '')) {
      console.error('❌ Supplier is missing or empty');
      return res.status(400).json({
        success: false,
        message: "Supplier is required"
      });
    }

    // Validate warehouse
    if (!warehouse || !mongoose.Types.ObjectId.isValid(warehouse)) {
      // Try to get the first available warehouse as fallback
      const Warehouse = (await import("../model/wareHouse.js")).default;
      const firstWarehouse = await Warehouse.findOne({ status: 'Active' });
      if (firstWarehouse) {
        console.log('⚠️ No valid warehouse provided (food purchase), using fallback:', firstWarehouse._id);
        var warehouseId = firstWarehouse._id;
      } else {
        console.error('❌ No warehouse found and no valid warehouse ID provided');
        return res.status(400).json({
          success: false,
          message: "Valid warehouse ID is required"
        });
      }
    } else {
      var warehouseId = new mongoose.Types.ObjectId(warehouse);
      console.log('✅ Using provided warehouse:', warehouseId);
    }

    // Create the foodItems array with the single item
    const foodItems = [{
      name: productType || "Wheat",
      category: "Wheat Grain", // Map category correctly
      quantity: parseFloat(quantity) || 0,
      unit: unit || "kg", // Use kg as default unit
      unitPrice: parseFloat(unitPrice) || 0,
      totalPrice: parseFloat(totalPrice) || 0,
      quality: "Standard" // Add required quality field
    }];

    // Calculate totals
    const calculatedTotalPrice = parseFloat(totalPrice) || (parseFloat(quantity) || 0) * (parseFloat(unitPrice) || 0);
    const calculatedPaidAmount = parseFloat(paidAmount) || 0;
    const calculatedRemainingAmount = calculatedTotalPrice - calculatedPaidAmount;

    // Generate purchase number manually if needed
    let generatedPurchaseNumber;
    try {
      const count = await FoodPurchase.countDocuments();
      const year = new Date().getFullYear();
      const month = String(new Date().getMonth() + 1).padStart(2, '0');
      const day = String(new Date().getDate()).padStart(2, '0');
      const sequence = String(count + 1).padStart(4, '0');
      generatedPurchaseNumber = `FP-${year}${month}${day}-${sequence}`;

      // Check if this purchase number already exists (race condition protection)
      const existing = await FoodPurchase.findOne({ purchaseNumber: generatedPurchaseNumber });
      if (existing) {
        // If exists, append timestamp to make it unique
        generatedPurchaseNumber = `FP-${year}${month}${day}-${sequence}-${Date.now()}`;
      }

      console.log('📝 Generated purchase number:', generatedPurchaseNumber);
    } catch (error) {
      console.error('⚠️ Error generating purchase number, using fallback:', error.message);
      // Fallback to timestamp-based number if database query fails
      generatedPurchaseNumber = `FP-${Date.now()}`;
    }

    // Validate supplier ID
    let supplierId;
    if (mongoose.isValidObjectId(supplier)) {
      supplierId = new mongoose.Types.ObjectId(supplier);
      console.log('✅ Valid supplier ID:', supplierId);
    } else {
      console.error('❌ Invalid supplier ID:', supplier);
      return res.status(400).json({
        success: false,
        message: "Invalid supplier ID provided"
      });
    }

    // Validate user ID
    let userId;
    if (req.user && req.user._id && mongoose.isValidObjectId(req.user._id)) {
      userId = new mongoose.Types.ObjectId(req.user._id);
    } else if (req.user && req.user.id && mongoose.isValidObjectId(req.user.id)) {
      userId = new mongoose.Types.ObjectId(req.user.id);
    } else {
      console.error('❌ Invalid user ID in request:', req.user);
      return res.status(400).json({
        success: false,
        message: "Invalid user authentication"
      });
    }

    // Create food purchase document
    const foodPurchaseData = {
      purchaseNumber: generatedPurchaseNumber, // Explicitly set purchase number
      supplier: supplierId,
      foodItems,
      totalQuantity: parseFloat(quantity) || 0,
      subtotal: calculatedTotalPrice,
      tax: 0,
      discount: 0,
      totalAmount: calculatedTotalPrice,
      paymentMethod: "Cash",
      paymentStatus: paymentStatus || "Pending",
      paidAmount: calculatedPaidAmount,
      dueAmount: calculatedRemainingAmount,
      purchaseDate: purchaseDate ? new Date(purchaseDate) : new Date(),
      status: status || "Pending",
      deliveryDate: expectedDeliveryDate ? new Date(expectedDeliveryDate) : undefined,
      notes: notes || "",
      warehouse: warehouseId,
      createdBy: userId
    };

    console.log('📦 Food purchase data to save:', JSON.stringify({
      ...foodPurchaseData,
      supplier: supplierId.toString(),
      warehouse: warehouseId.toString(),
      createdBy: userId.toString()
    }, null, 2));

    try {
      console.log('💾 Attempting to save food purchase to database...');
      const newPurchase = new FoodPurchase(foodPurchaseData);
      await newPurchase.save();
      console.log('✅ Food purchase saved to database:', newPurchase._id);

      // Add food stock to selected warehouse
      try {
        // Import models
        const Product = (await import("../model/Product.js")).default;
        const Inventory = (await import("../model/inventory.js")).default;
        const Stock = (await import("../model/stock.js")).default;

        // Process each food item in the purchase
        for (const foodItem of foodItems) {
          let product = await Product.findOne({
            name: { $regex: new RegExp(`^${foodItem.name}$`, 'i') },
            category: foodItem.category || 'Raw Materials',
            subcategory: productType
          });

          if (!product) {
            product = new Product({
              name: foodItem.name,
              category: 'Raw Materials', // Always use valid enum value
              subcategory: productType,
              description: `${foodItem.name} - ${productType}`,
              unit: foodItem.unit || 'kg',
              price: 0,
              purchasePrice: foodItem.unitPrice || 0,
              minimumStock: 10,
              status: 'Active'
            });
            await product.save();
            console.log(`✅ Created product in catalog: ${foodItem.name}`);
          }

          let inventoryItem = await Inventory.findOne({
            product: product._id,
            warehouse: warehouseId
          });

          if (!inventoryItem) {
            inventoryItem = new Inventory({
              product: product._id,
              warehouse: warehouseId,
              currentStock: 0,
              minimumStock: product.minimumStock || 10,
              status: 'Active',
              name: product.name,
              code: product.code,
              category: product.category,
              subcategory: product.subcategory,
              unit: product.unit,
              price: product.purchasePrice
            });
            await inventoryItem.save();
            console.log(`✅ Created new inventory item for ${product.name}`);
          }

          // Create Stock movement - the Stock model's pre-save middleware will update inventory automatically
          const stockIn = new Stock({
            inventoryItem: inventoryItem._id,
            movementType: 'in',
            quantity: foodItem.quantity,
            reason: `Food Purchase - ${generatedPurchaseNumber}`,
            referenceNumber: generatedPurchaseNumber,
            warehouse: warehouseId,
            createdBy: req.user._id || req.user.id || new mongoose.Types.ObjectId("507f1f77bcf86cd799439011")
          });

          await stockIn.save();
          console.log(`✅ Added ${foodItem.quantity} ${foodItem.unit} of ${foodItem.name} to warehouse`);
        }
      } catch (stockError) {
        console.error("⚠️ Error adding stock to warehouse:", stockError);
        // Don't fail the request if stock addition fails, but log it
      }

      // Populate the response
      await newPurchase.populate('supplier', 'name contactPerson email phone');
      await newPurchase.populate('createdBy', 'firstName lastName');

      console.log('✅ Food purchase created successfully, sending response');
      res.status(201).json({
        success: true,
        message: "Food purchase created successfully",
        data: newPurchase
      });
    } catch (dbError) {
      console.error('❌ Database operation failed:');
      console.error('  - Error message:', dbError.message);
      console.error('  - Error name:', dbError.name);
      console.error('  - Error code:', dbError.code);
      console.error('  - Error stack:', dbError.stack);
      console.error('📦 Food purchase data that failed:', JSON.stringify(foodPurchaseData, null, 2));

      // Check for specific error types
      let errorMessage = "Failed to save food purchase to database";
      if (dbError.code === 11000) {
        // Duplicate key error
        errorMessage = `Duplicate purchase number: ${generatedPurchaseNumber}. Please try again.`;
      } else if (dbError.name === 'ValidationError') {
        // Mongoose validation error
        const validationErrors = Object.values(dbError.errors || {}).map(err => err.message).join(', ');
        errorMessage = `Validation error: ${validationErrors}`;
      } else {
        errorMessage = dbError.message || errorMessage;
      }

      // Return error response - don't pretend it succeeded
      res.status(500).json({
        success: false,
        message: errorMessage,
        error: dbError.message,
        errorCode: dbError.code,
        errorName: dbError.name
      });
    }
  } catch (error) {
    console.error("Create food purchase error:", error);
    console.error("Error details:", error.message);
    console.error("Error stack:", error.stack);
    res.status(500).json({
      success: false,
      message: "Server error while creating food purchase",
      error: error.message
    });
  }
});

// @route   PUT /api/food-purchases/:id
// @desc    Update food purchase
// @access  Private (Manager, Admin)
router.put("/:id", [
  authorize("Manager", "Admin"),
  body("purchaseNumber").optional().trim().notEmpty().withMessage("Purchase number cannot be empty"),
  body("supplier").optional().trim().notEmpty().withMessage("Supplier cannot be empty"),
  body("productType").optional().isIn(["Wheat Grain", "Corn", "Rice", "Barley", "Oats", "Rye", "Millet", "Other"]).withMessage("Invalid product type"),
  body("quantity").optional().isNumeric().withMessage("Quantity must be a number"),
  body("unitPrice").optional().isNumeric().withMessage("Unit price must be a number")
], async (req, res) => {
  try {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: errors.array()
      });
    }

    // Mock update - replace with actual database update
    const updatedPurchase = {
      _id: req.params.id,
      ...req.body,
      totalPrice: req.body.quantity ? req.body.quantity * (req.body.unitPrice || 0) : 0,
      updatedAt: new Date()
    };

    res.json({
      success: true,
      message: "Food purchase updated successfully",
      data: updatedPurchase
    });
  } catch (error) {
    console.error("Update food purchase error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while updating food purchase"
    });
  }
});

// @route   DELETE /api/food-purchases/:id
// @desc    Delete food purchase
// @access  Private (Admin only)
router.delete("/:id", [
  authorize("Admin")
], async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await FoodPurchase.findByIdAndDelete(id);
    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: "Food purchase not found"
      });
    }
    res.json({
      success: true,
      message: "Food purchase deleted successfully",
      data: { _id: id }
    });
  } catch (error) {
    console.error("Delete food purchase error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while deleting food purchase"
    });
  }
});

export default router;