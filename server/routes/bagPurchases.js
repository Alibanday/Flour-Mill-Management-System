import express from "express";
import { body, validationResult } from "express-validator";
import { protect, authorize } from "../middleware/auth.js";
import BagPurchase from "../model/BagPurchase.js";
import mongoose from "mongoose";

const router = express.Router();

// Apply authentication to all routes
router.use(protect);

// @route   GET /api/bag-purchases
// @desc    Get all bag purchases
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
    const total = await BagPurchase.countDocuments(filter);
    
    // Get bag purchases with pagination
    const bagPurchases = await BagPurchase.find(filter)
      .populate('supplier', 'name contactPerson email phone')
      .populate('warehouse', 'name location')
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
      data: bagPurchases,
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
    console.error("Get bag purchases error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching bag purchases"
    });
  }
});

// @route   GET /api/bag-purchases/stats
// @desc    Get bag purchases statistics
// @access  Private (Manager, Admin, Employee)
router.get("/stats", [
  authorize("Manager", "Admin", "Employee")
], async (req, res) => {
  try {
    // Get real stats from database
    const total = await BagPurchase.countDocuments();
    const totalValue = await BagPurchase.aggregate([
      { $group: { _id: null, total: { $sum: "$totalAmount" } } }
    ]);
    const pendingPayments = await BagPurchase.aggregate([
      { $match: { paymentStatus: "Pending" } },
      { $group: { _id: null, total: { $sum: "$dueAmount" } } }
    ]);
    const completedPurchases = await BagPurchase.countDocuments({ status: "Completed" });
    
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
    console.error("Get bag purchases stats error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching bag purchases stats"
    });
  }
});

// @route   POST /api/bag-purchases
// @desc    Create new bag purchase
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
    console.log('📥 Bag purchase request received:', {
      body: req.body,
      productType: req.body.productType,
      quantity: req.body.quantity,
      unit: req.body.unit,
      supplier: req.body.supplier
    });

    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('❌ Bag purchase validation errors:', errors.array());
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: errors.array()
      });
    }

    // Map flat structure to nested structure expected by model
    const { productType, quantity, unitPrice, totalPrice, supplier, purchaseDate, status, paymentStatus, notes, unit, warehouse } = req.body;

    // Sanitize incoming status fields to match schema enums
    const allowedStatus = ["Pending", "Received", "Cancelled", "Completed"];
    const allowedPaymentStatus = ["Pending", "Partial", "Paid"];
    const safeStatus = allowedStatus.includes(status) ? status : "Pending";
    const safePaymentStatus = allowedPaymentStatus.includes(paymentStatus) ? paymentStatus : "Pending";
    
    // Validate warehouse
    if (!warehouse || !mongoose.Types.ObjectId.isValid(warehouse)) {
      // Try to get the first available warehouse as fallback
      const Warehouse = (await import("../model/wareHouse.js")).default;
      const firstWarehouse = await Warehouse.findOne({ status: 'Active' });
      if (firstWarehouse) {
        console.log('⚠️ No valid warehouse provided (bag purchase), using fallback:', firstWarehouse._id);
        var warehouseId = firstWarehouse._id;
      } else {
        return res.status(400).json({ 
          success: false, 
          message: "Valid warehouse ID is required" 
        });
      }
    } else {
      var warehouseId = new mongoose.Types.ObjectId(warehouse);
    }
    
    // Create the bags object with the specific product type as Map
    const bags = new Map();
    
    // Normalize product type to uppercase (for compatibility)
    const normalizedProductType = productType.toUpperCase();
    
    // Set the values for the specific product type (use normalized type)
    bags.set(normalizedProductType, {
      quantity: parseFloat(quantity) || 0,
      unit: unit || "50kg bags", // Use provided unit or default
      unitPrice: parseFloat(unitPrice) || 0,
      totalPrice: parseFloat(totalPrice) || 0
    });

    // Generate purchase number manually if needed
    let purchaseNumber;
    try {
      const count = await BagPurchase.countDocuments();
      const year = new Date().getFullYear();
      const month = String(new Date().getMonth() + 1).padStart(2, '0');
      const day = String(new Date().getDate()).padStart(2, '0');
      purchaseNumber = `BP-${year}${month}${day}-${String(count + 1).padStart(4, '0')}`;
    } catch (error) {
      // Fallback to timestamp-based number if database query fails
      purchaseNumber = `BP-${Date.now()}`;
    }

    // Create bag purchase document
    const bagPurchaseData = {
      purchaseNumber: purchaseNumber, // Explicitly set purchase number
      supplier: mongoose.isValidObjectId(supplier) ? new mongoose.Types.ObjectId(supplier) : new mongoose.Types.ObjectId("507f1f77bcf86cd799439011"),
      bags,
      purchaseDate: purchaseDate ? new Date(purchaseDate) : new Date(),
      status: safeStatus,
      paymentStatus: safePaymentStatus,
      notes: notes || "",
      warehouse: warehouseId,
      createdBy: new mongoose.Types.ObjectId(req.user._id || req.user.id || "507f1f77bcf86cd799439011")
    };

    const newPurchase = new BagPurchase(bagPurchaseData);
    await newPurchase.save();

    // Add stock movements for bags purchased
    try {
      const Product = (await import("../model/Product.js")).default;
      const Inventory = (await import("../model/inventory.js")).default;
      const Stock = (await import("../model/stock.js")).default;
      
      const warehouseId = newPurchase.warehouse;
      
      // Process each bag type in the purchase
      if (bags && typeof bags === 'object') {
        let bagEntries = [];
        
        // Handle Map structure
        if (bags instanceof Map) {
          bagEntries = Array.from(bags.entries());
        } 
        // Handle object structure
        else {
          bagEntries = Object.entries(bags);
        }
        
        for (const [productType, bagData] of bagEntries) {
          if (bagData && bagData.quantity > 0) {
            // Step 1: Find or create Product in catalog
            const productName = `${productType} Bags`;
            let product = await Product.findOne({
              name: { $regex: new RegExp(`^${productName}$`, 'i') },
              category: 'Packaging Materials',
              subcategory: 'Bags'
            });
            
            if (!product) {
              product = new Product({
                name: productName,
                category: 'Packaging Materials',
                subcategory: 'Bags',
                description: `${productType} bags`,
                unit: bagData.unit || '50kg bags',
                price: 0, // Will be set from sales
                purchasePrice: bagData.unitPrice || 0,
                minimumStock: 10,
                status: 'Active'
              });
              await product.save();
              console.log(`✅ Created product in catalog: ${productName}`);
            }
            
            // Step 2: Find or create Inventory (Product + Warehouse)
            let inventoryItem = await Inventory.findOne({
              product: product._id,
              warehouse: warehouseId
            });
            
            if (!inventoryItem) {
              inventoryItem = new Inventory({
                product: product._id,
                warehouse: warehouseId,
                currentStock: 0, // Will be updated by stock movement
                minimumStock: product.minimumStock || 10,
                status: 'Active',
                // Legacy fields for backward compatibility
                name: product.name,
                code: product.code,
                category: product.category,
                subcategory: product.subcategory
              });
              await inventoryItem.save();
              console.log(`✅ Created inventory record for ${productName} in warehouse`);
            }
            
            // Step 3: Create stock in movement
            const stockIn = new Stock({
              inventoryItem: inventoryItem._id,
              movementType: 'in',
              quantity: bagData.quantity,
              reason: `Bag Purchase - ${newPurchase.purchaseNumber}`,
              referenceNumber: newPurchase.purchaseNumber,
              warehouse: warehouseId,
              createdBy: req.user._id || req.user.id || new mongoose.Types.ObjectId("507f1f77bcf86cd799439011")
            });
            
            await stockIn.save();
            console.log(`✅ Added ${bagData.quantity} ${bagData.unit} of ${productType} to warehouse`);
          }
        }
      }
    } catch (stockError) {
      console.error("⚠️ Error adding stock to warehouse:", stockError);
      // Don't fail the request if stock addition fails
    }

    // Populate the response
    await newPurchase.populate('supplier', 'name contactPerson email phone');
    await newPurchase.populate('warehouse', 'name location');
    await newPurchase.populate('createdBy', 'firstName lastName');

    res.status(201).json({
      success: true,
      message: "Bag purchase created successfully",
      data: newPurchase
    });
  } catch (error) {
    console.error("Create bag purchase error:", error);
    console.error("Error details:", error.message);
    console.error("Error stack:", error.stack);
    res.status(500).json({
      success: false,
      message: "Server error while creating bag purchase",
      error: error.message
    });
  }
});

// @route   PUT /api/bag-purchases/:id
// @desc    Update bag purchase
// @access  Private (Manager, Admin)
router.put("/:id", [
  authorize("Manager", "Admin"),
  body("purchaseNumber").optional().trim().notEmpty().withMessage("Purchase number cannot be empty"),
  body("supplier").optional().trim().notEmpty().withMessage("Supplier cannot be empty"),
  body("productType").optional().isIn(["ATA", "MAIDA", "SUJI", "FINE"]).withMessage("Invalid product type"),
  body("quantity").optional().isNumeric().withMessage("Quantity must be a number"),
  body("unitPrice").optional().isNumeric().withMessage("Unit price must be a number")
], async (req, res) => {
  try {
    console.log('📥 Bag purchase update request received:', {
      id: req.params.id,
      body: req.body
    });

    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: errors.array()
      });
    }

    // Find the existing purchase
    const existingPurchase = await BagPurchase.findById(req.params.id);
    
    if (!existingPurchase) {
      return res.status(404).json({
        success: false,
        message: "Bag purchase not found"
      });
    }

    // Map flat structure to nested structure expected by model
    const { productType, quantity, unitPrice, totalPrice, supplier, purchaseDate, status, paymentStatus, paidAmount, notes, unit, warehouse } = req.body;

    // Sanitize incoming status fields to match schema enums
    const allowedStatus = ["Pending", "Received", "Cancelled", "Completed"];
    const allowedPaymentStatus = ["Pending", "Partial", "Paid"];

    // Update bags Map if productType, quantity, and unitPrice are provided
    if (productType && quantity !== undefined && unitPrice !== undefined) {
      const bags = existingPurchase.bags instanceof Map 
        ? new Map(existingPurchase.bags) 
        : new Map();
      
      // Normalize product type to uppercase
      const normalizedProductType = productType.toUpperCase();
      
      // Update or set the bag data for this product type
      const calculatedTotalPrice = parseFloat(totalPrice) || (parseFloat(quantity) * parseFloat(unitPrice));
      bags.set(normalizedProductType, {
        quantity: parseFloat(quantity) || 0,
        unit: unit || "50kg bags",
        unitPrice: parseFloat(unitPrice) || 0,
        totalPrice: calculatedTotalPrice
      });
      
      existingPurchase.bags = bags;
    }

    // Update other fields if provided
    if (supplier) {
      existingPurchase.supplier = new mongoose.Types.ObjectId(supplier);
    }

    if (purchaseDate) {
      existingPurchase.purchaseDate = new Date(purchaseDate);
    }

    // Update status if provided and valid
    if (status !== undefined) {
      if (allowedStatus.includes(status)) {
        existingPurchase.status = status;
        // Set receivedDate if status is "Received" and not already set
        if (status === "Received" && !existingPurchase.receivedDate) {
          existingPurchase.receivedDate = new Date();
        }
      } else {
        console.warn(`⚠️ Invalid status provided: ${status}. Allowed values: ${allowedStatus.join(', ')}`);
      }
    }

    // Update payment status if provided and valid
    if (paymentStatus !== undefined) {
      if (allowedPaymentStatus.includes(paymentStatus)) {
        existingPurchase.paymentStatus = paymentStatus;
        console.log(`✅ Payment status updated to: ${paymentStatus}`);
      } else {
        console.warn(`⚠️ Invalid payment status provided: ${paymentStatus}. Allowed values: ${allowedPaymentStatus.join(', ')}`);
      }
    }

    // Update paid amount if provided
    if (paidAmount !== undefined) {
      existingPurchase.paidAmount = parseFloat(paidAmount) || 0;
      // Recalculate due amount (will be recalculated in pre-save middleware, but set it here for immediate use)
      // Note: totalAmount will be recalculated in pre-save middleware based on bags
      const currentTotal = existingPurchase.totalAmount || 0;
      existingPurchase.dueAmount = Math.max(0, currentTotal - existingPurchase.paidAmount);
      
      // Auto-update payment status based on paid amount ONLY if paymentStatus was not explicitly set
      if (paymentStatus === undefined) {
        if (existingPurchase.dueAmount <= 0 && existingPurchase.paidAmount > 0) {
          existingPurchase.paymentStatus = "Paid";
          console.log('✅ Auto-updated payment status to "Paid" based on paid amount');
        } else if (existingPurchase.paidAmount > 0 && existingPurchase.dueAmount > 0) {
          existingPurchase.paymentStatus = "Partial";
          console.log('✅ Auto-updated payment status to "Partial" based on paid amount');
        } else if (existingPurchase.paidAmount === 0) {
          existingPurchase.paymentStatus = "Pending";
          console.log('✅ Auto-updated payment status to "Pending" based on paid amount');
        }
      }
    }

    if (warehouse) {
      existingPurchase.warehouse = new mongoose.Types.ObjectId(warehouse);
    }

    if (notes !== undefined) {
      existingPurchase.notes = notes;
    }

    // Update updatedBy field
    existingPurchase.updatedBy = req.user._id;

    // Save the updated purchase (this will trigger pre-save middleware to recalculate totals)
    const updatedPurchase = await existingPurchase.save();

    // Populate references
    await updatedPurchase.populate('supplier', 'name contact supplierCode');
    await updatedPurchase.populate('warehouse', 'name location');
    await updatedPurchase.populate('createdBy', 'firstName lastName');
    await updatedPurchase.populate('updatedBy', 'firstName lastName');

    console.log('✅ Bag purchase updated successfully:', {
      id: updatedPurchase._id,
      purchaseNumber: updatedPurchase.purchaseNumber,
      status: updatedPurchase.status,
      paymentStatus: updatedPurchase.paymentStatus,
      paidAmount: updatedPurchase.paidAmount
    });

    res.json({
      success: true,
      message: "Bag purchase updated successfully",
      data: updatedPurchase
    });
  } catch (error) {
    console.error("❌ Update bag purchase error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while updating bag purchase",
      error: error.message
    });
  }
});

// @route   DELETE /api/bag-purchases/:id
// @desc    Delete bag purchase
// @access  Private (Admin only)
router.delete("/:id", [
  authorize("Admin")
], async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await BagPurchase.findByIdAndDelete(id);
    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: "Bag purchase not found"
      });
    }
    res.json({
      success: true,
      message: "Bag purchase deleted successfully",
      data: { _id: id }
    });
  } catch (error) {
    console.error("Delete bag purchase error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while deleting bag purchase"
    });
  }
});

export default router; 