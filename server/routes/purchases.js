import express from "express";
import { body, validationResult } from "express-validator";
import mongoose from "mongoose";
import Purchase from "../model/Purchase.js";
import Warehouse from "../model/warehouse.js";
import { protect, authorize } from "../middleware/auth.js";
import { 
  createPurchase, 
  getAllPurchases, 
  getPurchaseById, 
  updatePurchase, 
  deletePurchase, 
  getPurchaseSummary 
} from "../controller/purchaseController.js";

const router = express.Router();

// Helper function to convert units to a standard unit (50kg bags)
const convertToStandardUnit = (quantity, unit, purchaseType) => {
  // For packaging materials and maintenance supplies, use 1:1 conversion
  if (purchaseType === 'Other') {
    return quantity; // No conversion needed for these types
  }
  
  // For raw materials and finished products, convert to 50kg bags
  const conversionRates = {
    'tons': 20,           // 1 ton = 20 x 50kg bags
    'quintals': 2,        // 1 quintal = 2 x 50kg bags  
    '50kg bags': 1,       // 1 x 50kg bag = 1 x 50kg bag
    '25kg bags': 0.5,     // 1 x 25kg bag = 0.5 x 50kg bag
    '10kg bags': 0.2,     // 1 x 10kg bag = 0.2 x 50kg bag
    '5kg bags': 0.1,      // 1 x 5kg bag = 0.1 x 50kg bag
    '100kg sacks': 2,     // 1 x 100kg sack = 2 x 50kg bags
    '50kg sacks': 1,      // 1 x 50kg sack = 1 x 50kg bag
    '25kg sacks': 0.5,     // 1 x 25kg sack = 0.5 x 50kg bag
    // For packaging and maintenance supplies, use 1:1 conversion
    'bags': 1, 'pieces': 1, 'rolls': 1, 'sheets': 1, 'boxes': 1, 'packets': 1, 'bundles': 1,
    'units': 1, 'sets': 1, 'kits': 1, 'pairs': 1, 'meters': 1, 'liters': 1
  };
  
  const rate = conversionRates[unit] || 1;
  return quantity * rate;
};

// Helper function to calculate total quantity from purchase data (converted to standard units)
const calculateTotalQuantity = (purchaseData) => {
  let totalQuantity = 0;
  
  if (purchaseData.purchaseType === "Bags" || purchaseData.purchaseType === "Other") {
    if (purchaseData.bags) {
      totalQuantity += convertToStandardUnit(purchaseData.bags.ata?.quantity || 0, purchaseData.bags.ata?.unit || '50kg bags', purchaseData.purchaseType);
      totalQuantity += convertToStandardUnit(purchaseData.bags.maida?.quantity || 0, purchaseData.bags.maida?.unit || '50kg bags', purchaseData.purchaseType);
      totalQuantity += convertToStandardUnit(purchaseData.bags.suji?.quantity || 0, purchaseData.bags.suji?.unit || '50kg bags', purchaseData.purchaseType);
      totalQuantity += convertToStandardUnit(purchaseData.bags.fine?.quantity || 0, purchaseData.bags.fine?.unit || '50kg bags', purchaseData.purchaseType);
    }
  }
  
  if (purchaseData.purchaseType === "Food" || purchaseData.purchaseType === "Other") {
    if (purchaseData.food && purchaseData.food.wheat) {
      totalQuantity += convertToStandardUnit(purchaseData.food.wheat.quantity || 0, purchaseData.food.wheat.unit || 'tons', purchaseData.purchaseType);
    }
  }
  
  return totalQuantity;
};

// Apply authentication to all routes
// router.use(protect); // Temporarily disabled for testing

// @route   POST /api/purchases/create
// @desc    Create new purchase record (FR 23-24)
// @access  Private (Manager, Admin)
router.post("/create", [
  // authorize("Manager", "Admin"), // Temporarily disabled for testing
  body("purchaseNumber").trim().notEmpty().withMessage("Purchase number is required"),
  body("purchaseType").isIn(["Bags", "Food", "Other"]).withMessage("Invalid purchase type"),
  body("supplier.name").trim().notEmpty().withMessage("Supplier name is required"),
  body("warehouse").isMongoId().withMessage("Valid warehouse ID is required"),
  body("paymentMethod").isIn(["Cash", "Bank Transfer", "Cheque", "Credit"]).withMessage("Invalid payment method")
], async (req, res) => {
  try {
    // Debug: Log the incoming request data
    console.log('📥 Purchase request received (create):', {
      body: req.body,
      warehouse: req.body.warehouse,
      supplier: req.body.supplier,
      purchaseType: req.body.purchaseType
    });

    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('❌ Validation errors (create):', errors.array());
      console.log('❌ Request body:', JSON.stringify(req.body, null, 2));
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: errors.array(),
        receivedData: req.body
      });
    }

    // Check if purchase number already exists
    const existingPurchase = await Purchase.findOne({ purchaseNumber: req.body.purchaseNumber });
    if (existingPurchase) {
      return res.status(400).json({
        success: false,
        message: "Purchase number already exists"
      });
    }

    // Validate warehouse ID format first
    if (!req.body.warehouse || !mongoose.Types.ObjectId.isValid(req.body.warehouse)) {
      // Try to get the first available warehouse as fallback
      const firstWarehouse = await Warehouse.findOne({ status: 'Active' });
      if (firstWarehouse) {
        console.log('⚠️ No valid warehouse provided (create), using fallback:', firstWarehouse._id);
        req.body.warehouse = firstWarehouse._id.toString();
      } else {
        return res.status(400).json({ 
          success: false, 
          message: "Valid warehouse ID is required and no warehouses available" 
        });
      }
    }

    // Verify warehouse exists and check capacity
    const warehouse = await Warehouse.findById(req.body.warehouse);
    if (!warehouse) {
      return res.status(404).json({
        success: false,
        message: "Warehouse not found"
      });
    }

    // Check warehouse capacity for real-time validation
    const totalQuantity = calculateTotalQuantity(req.body);
    console.log('📦 Capacity check:', {
      totalQuantity,
      warehouseCapacity: warehouse.capacity,
      currentUsage: warehouse.capacity?.currentUsage,
      totalCapacity: warehouse.capacity?.totalCapacity,
      purchaseType: req.body.purchaseType,
      bags: req.body.bags,
      food: req.body.food
    });
    
    if (warehouse.capacity && warehouse.capacity.totalCapacity) {
      const availableCapacity = Math.max(0, warehouse.capacity.totalCapacity - warehouse.capacity.currentUsage);
      console.log('📦 Available capacity:', availableCapacity, 'Required (converted to 50kg bags):', totalQuantity);
      
      if (totalQuantity > availableCapacity) {
        console.log('❌ Capacity exceeded:', {
          available: availableCapacity,
          required: totalQuantity,
          current: warehouse.capacity.currentUsage,
          total: warehouse.capacity.totalCapacity,
          unit: warehouse.capacity.unit
        });
        return res.status(400).json({
          success: false,
          message: `Insufficient warehouse capacity. Available: ${availableCapacity} ${warehouse.capacity.unit}, Required: ${totalQuantity} ${warehouse.capacity.unit} (converted to standard units)`,
          warehouseCapacity: {
            total: warehouse.capacity.totalCapacity,
            current: warehouse.capacity.currentUsage,
            available: availableCapacity,
            required: totalQuantity,
            unit: warehouse.capacity.unit
          }
        });
      }
    }

    // Process bags data if purchase type is Bags
    if (req.body.purchaseType === "Bags" || req.body.purchaseType === "Other") {
      if (req.body.bags) {
        // Calculate total prices for bags
        if (req.body.bags.ata && req.body.bags.ata.quantity > 0) {
          req.body.bags.ata.totalPrice = req.body.bags.ata.quantity * req.body.bags.ata.unitPrice;
        }
        if (req.body.bags.maida && req.body.bags.maida.quantity > 0) {
          req.body.bags.maida.totalPrice = req.body.bags.maida.quantity * req.body.bags.maida.unitPrice;
        }
        if (req.body.bags.suji && req.body.bags.suji.quantity > 0) {
          req.body.bags.suji.totalPrice = req.body.bags.suji.quantity * req.body.bags.suji.unitPrice;
        }
        if (req.body.bags.fine && req.body.bags.fine.quantity > 0) {
          req.body.bags.fine.totalPrice = req.body.bags.fine.quantity * req.body.bags.fine.unitPrice;
        }
      }
    }

    // Process food data if purchase type is Food
    if (req.body.purchaseType === "Food" || req.body.purchaseType === "Other") {
      if (req.body.food && req.body.food.wheat && req.body.food.wheat.quantity > 0) {
        req.body.food.wheat.totalPrice = req.body.food.wheat.quantity * req.body.food.wheat.unitPrice;
      }
    }

    // Normalize nested structures to satisfy schema and pre-save
    const safeBags = {
      ata: { quantity: 0, unit: '50kg bags', unitPrice: 0, totalPrice: 0 },
      maida: { quantity: 0, unit: '50kg bags', unitPrice: 0, totalPrice: 0 },
      suji: { quantity: 0, unit: '50kg bags', unitPrice: 0, totalPrice: 0 },
      fine: { quantity: 0, unit: '50kg bags', unitPrice: 0, totalPrice: 0 }
    };
    if (req.body.bags) {
      safeBags.ata = { ...safeBags.ata, ...(req.body.bags.ata || {}) };
      safeBags.maida = { ...safeBags.maida, ...(req.body.bags.maida || {}) };
      safeBags.suji = { ...safeBags.suji, ...(req.body.bags.suji || {}) };
      safeBags.fine = { ...safeBags.fine, ...(req.body.bags.fine || {}) };
    }

    const safeFood = {
      wheat: { quantity: 0, unit: 'kg', unitPrice: 0, totalPrice: 0, source: 'Government', quality: 'Standard' }
    };
    if (req.body.food) {
      safeFood.wheat = { ...safeFood.wheat, ...(req.body.food.wheat || {}) };
    }

    // Calculate subtotal before creating purchase
    let calculatedSubtotal = 0;
    Object.values(safeBags).forEach(bag => {
      calculatedSubtotal += bag.totalPrice || 0;
    });
    if (safeFood.wheat) {
      calculatedSubtotal += safeFood.wheat.totalPrice || 0;
    }

    // Ensure supplier type is valid
    const validSupplierTypes = ['Government', 'Private', 'Wholesaler', 'Manufacturer'];
    const supplierType = validSupplierTypes.includes(req.body.supplier?.type) 
      ? req.body.supplier.type 
      : 'Private';

    const purchaseData = {
      ...req.body,
      warehouse: new mongoose.Types.ObjectId(req.body.warehouse),
      supplier: {
        ...req.body.supplier,
        type: supplierType
      },
      tax: typeof req.body.tax === 'number' ? req.body.tax : parseFloat(req.body.tax) || 0,
      shippingCost: typeof req.body.shippingCost === 'number' ? req.body.shippingCost : parseFloat(req.body.shippingCost) || 0,
      bags: safeBags,
      food: safeFood,
      subtotal: calculatedSubtotal,
      totalAmount: calculatedSubtotal + (typeof req.body.tax === 'number' ? req.body.tax : parseFloat(req.body.tax) || 0) + (typeof req.body.shippingCost === 'number' ? req.body.shippingCost : parseFloat(req.body.shippingCost) || 0),
      createdBy: (req.user && (req.user._id || req.user.id)) || 
        (req.body.createdBy ? new mongoose.Types.ObjectId(req.body.createdBy) : new mongoose.Types.ObjectId('507f1f77bcf86cd799439011'))
    };

    console.log('📤 Creating purchase with data:', JSON.stringify(purchaseData, null, 2));
    
    const purchase = new Purchase(purchaseData);
    
    // Validate the document before saving
    const validationError = purchase.validateSync();
    if (validationError) {
      console.error('❌ Purchase validation error:', validationError);
      console.error('❌ Validation error details:', JSON.stringify(validationError.errors, null, 2));
      console.error('❌ Purchase data being validated:', JSON.stringify(purchaseData, null, 2));
      return res.status(400).json({
        success: false,
        message: "Purchase validation failed",
        errors: validationError.errors,
        details: Object.keys(validationError.errors).map(key => ({
          field: key,
          message: validationError.errors[key].message,
          value: validationError.errors[key].value
        }))
      });
    }
    
    await purchase.save();
    console.log('✅ Purchase saved successfully:', purchase._id);

    // Update warehouse capacity after successful purchase
    if (warehouse.capacity && warehouse.capacity.totalCapacity) {
      const newUsage = warehouse.capacity.currentUsage + totalQuantity;
      
      // Prevent capacity overflow
      if (newUsage > warehouse.capacity.totalCapacity) {
        console.log('⚠️ Warning: Purchase would exceed warehouse capacity, capping at total capacity');
        warehouse.capacity.currentUsage = warehouse.capacity.totalCapacity;
      } else {
        warehouse.capacity.currentUsage = newUsage;
      }
      
      await warehouse.save();
      console.log('✅ Warehouse capacity updated:', {
        warehouse: warehouse.name,
        newUsage: warehouse.capacity.currentUsage,
        totalCapacity: warehouse.capacity.totalCapacity,
        percentage: Math.round((warehouse.capacity.currentUsage / warehouse.capacity.totalCapacity) * 100)
      });
    }

    res.status(201).json({
      success: true,
      message: "Purchase record created successfully",
      data: purchase
    });

  } catch (error) {
    console.error("Create purchase error:", error);
    console.error("Error details:", {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    res.status(500).json({
        success: false,
        message: "Server error",
        error: error.message,
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
  }
});

// @route   POST /api/purchases
// @desc    Create new purchase record (alias to /create for frontend compatibility)
// @access  Private (Manager, Admin)
router.post("/", [
  // authorize("Manager", "Admin"), // Temporarily disabled for testing
  body("purchaseNumber").trim().notEmpty().withMessage("Purchase number is required"),
  body("purchaseType").isIn(["Bags", "Food", "Other"]).withMessage("Invalid purchase type"),
  body("supplier.name").trim().notEmpty().withMessage("Supplier name is required"),
  body("warehouse").isMongoId().withMessage("Valid warehouse ID is required"),
  body("paymentMethod").isIn(["Cash", "Bank Transfer", "Cheque", "Credit"]).withMessage("Invalid payment method")
], async (req, res) => {
  try {
    // Debug: Log the incoming request data
    console.log('📥 Purchase request received:', {
      body: req.body,
      warehouse: req.body.warehouse,
      supplier: req.body.supplier,
      purchaseType: req.body.purchaseType
    });

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('❌ Validation errors:', errors.array());
      console.log('❌ Request body:', JSON.stringify(req.body, null, 2));
      return res.status(400).json({ 
        success: false, 
        message: "Validation failed",
        errors: errors.array(),
        receivedData: req.body
      });
    }

    const existingPurchase = await Purchase.findOne({ purchaseNumber: req.body.purchaseNumber });
    if (existingPurchase) {
      return res.status(400).json({ success: false, message: "Purchase number already exists" });
    }

    // Validate warehouse ID format first
    if (!req.body.warehouse || !mongoose.Types.ObjectId.isValid(req.body.warehouse)) {
      // Try to get the first available warehouse as fallback
      const firstWarehouse = await Warehouse.findOne({ status: 'Active' });
      if (firstWarehouse) {
        console.log('⚠️ No valid warehouse provided, using fallback:', firstWarehouse._id);
        req.body.warehouse = firstWarehouse._id.toString();
      } else {
        return res.status(400).json({ 
          success: false, 
          message: "Valid warehouse ID is required and no warehouses available" 
        });
      }
    }

    const warehouse = await Warehouse.findById(req.body.warehouse);
    if (!warehouse) {
      return res.status(404).json({ success: false, message: "Warehouse not found" });
    }

    // Check warehouse capacity for real-time validation
    const totalQuantity = calculateTotalQuantity(req.body);
    console.log('📦 Capacity check:', {
      totalQuantity,
      warehouseCapacity: warehouse.capacity,
      currentUsage: warehouse.capacity?.currentUsage,
      totalCapacity: warehouse.capacity?.totalCapacity,
      purchaseType: req.body.purchaseType,
      bags: req.body.bags,
      food: req.body.food
    });
    
    if (warehouse.capacity && warehouse.capacity.totalCapacity) {
      const availableCapacity = Math.max(0, warehouse.capacity.totalCapacity - warehouse.capacity.currentUsage);
      console.log('📦 Available capacity:', availableCapacity, 'Required (converted to 50kg bags):', totalQuantity);
      
      if (totalQuantity > availableCapacity) {
        console.log('❌ Capacity exceeded:', {
          available: availableCapacity,
          required: totalQuantity,
          current: warehouse.capacity.currentUsage,
          total: warehouse.capacity.totalCapacity,
          unit: warehouse.capacity.unit
        });
        return res.status(400).json({
          success: false,
          message: `Insufficient warehouse capacity. Available: ${availableCapacity} ${warehouse.capacity.unit}, Required: ${totalQuantity} ${warehouse.capacity.unit} (converted to standard units)`,
          warehouseCapacity: {
            total: warehouse.capacity.totalCapacity,
            current: warehouse.capacity.currentUsage,
            available: availableCapacity,
            required: totalQuantity,
            unit: warehouse.capacity.unit
          }
        });
      }
    }

    // Normalize nested structures
    const aliasSafeBags = {
      ata: { quantity: 0, unit: '50kg bags', unitPrice: 0, totalPrice: 0 },
      maida: { quantity: 0, unit: '50kg bags', unitPrice: 0, totalPrice: 0 },
      suji: { quantity: 0, unit: '50kg bags', unitPrice: 0, totalPrice: 0 },
      fine: { quantity: 0, unit: '50kg bags', unitPrice: 0, totalPrice: 0 }
    };
    if (req.body.bags) {
      aliasSafeBags.ata = { ...aliasSafeBags.ata, ...(req.body.bags.ata || {}) };
      aliasSafeBags.maida = { ...aliasSafeBags.maida, ...(req.body.bags.maida || {}) };
      aliasSafeBags.suji = { ...aliasSafeBags.suji, ...(req.body.bags.suji || {}) };
      aliasSafeBags.fine = { ...aliasSafeBags.fine, ...(req.body.bags.fine || {}) };
      // Calculate totals if quantities provided
      Object.keys(aliasSafeBags).forEach(k => {
        const b = aliasSafeBags[k];
        b.totalPrice = (parseFloat(b.quantity) || 0) * (parseFloat(b.unitPrice) || 0);
      });
    }

    const aliasSafeFood = {
      wheat: { quantity: 0, unit: 'kg', unitPrice: 0, totalPrice: 0, source: 'Government', quality: 'Standard' }
    };
    if (req.body.food && req.body.food.wheat) {
      const w = { ...aliasSafeFood.wheat, ...req.body.food.wheat };
      w.totalPrice = (parseFloat(w.quantity) || 0) * (parseFloat(w.unitPrice) || 0);
      aliasSafeFood.wheat = w;
    }

    // Calculate subtotal before creating purchase
    let calculatedSubtotal = 0;
    Object.values(aliasSafeBags).forEach(bag => {
      calculatedSubtotal += bag.totalPrice || 0;
    });
    if (aliasSafeFood.wheat) {
      calculatedSubtotal += aliasSafeFood.wheat.totalPrice || 0;
    }

    // Ensure supplier type is valid
    const validSupplierTypes = ['Government', 'Private', 'Wholesaler', 'Manufacturer'];
    const supplierType = validSupplierTypes.includes(req.body.supplier?.type) 
      ? req.body.supplier.type 
      : 'Private';

    const aliasPurchaseData = {
      ...req.body,
      warehouse: new mongoose.Types.ObjectId(req.body.warehouse),
      supplier: {
        ...req.body.supplier,
        type: supplierType
      },
      tax: typeof req.body.tax === 'number' ? req.body.tax : parseFloat(req.body.tax) || 0,
      shippingCost: typeof req.body.shippingCost === 'number' ? req.body.shippingCost : parseFloat(req.body.shippingCost) || 0,
      bags: aliasSafeBags,
      food: aliasSafeFood,
      subtotal: calculatedSubtotal,
      totalAmount: calculatedSubtotal + (typeof req.body.tax === 'number' ? req.body.tax : parseFloat(req.body.tax) || 0) + (typeof req.body.shippingCost === 'number' ? req.body.shippingCost : parseFloat(req.body.shippingCost) || 0),
      createdBy: (req.user && (req.user._id || req.user.id)) || 
        (req.body.createdBy ? new mongoose.Types.ObjectId(req.body.createdBy) : new mongoose.Types.ObjectId('507f1f77bcf86cd799439011'))
    };
    console.log('📤 Creating purchase with data:', JSON.stringify(aliasPurchaseData, null, 2));
    
    const purchase = new Purchase(aliasPurchaseData);
    
    // Validate the document before saving
    const validationError = purchase.validateSync();
    if (validationError) {
      console.error('❌ Purchase validation error:', validationError);
      console.error('❌ Validation error details:', JSON.stringify(validationError.errors, null, 2));
      console.error('❌ Purchase data being validated:', JSON.stringify(aliasPurchaseData, null, 2));
      return res.status(400).json({
        success: false,
        message: "Purchase validation failed",
        errors: validationError.errors,
        details: Object.keys(validationError.errors).map(key => ({
          field: key,
          message: validationError.errors[key].message,
          value: validationError.errors[key].value
        }))
      });
    }
    
    await purchase.save();
    console.log('✅ Purchase saved successfully:', purchase._id);

    // Update warehouse capacity after successful purchase
    if (warehouse.capacity && warehouse.capacity.totalCapacity) {
      const newUsage = warehouse.capacity.currentUsage + totalQuantity;
      
      // Prevent capacity overflow
      if (newUsage > warehouse.capacity.totalCapacity) {
        console.log('⚠️ Warning: Purchase would exceed warehouse capacity, capping at total capacity');
        warehouse.capacity.currentUsage = warehouse.capacity.totalCapacity;
      } else {
        warehouse.capacity.currentUsage = newUsage;
      }
      
      await warehouse.save();
      console.log('✅ Warehouse capacity updated:', {
        warehouse: warehouse.name,
        newUsage: warehouse.capacity.currentUsage,
        totalCapacity: warehouse.capacity.totalCapacity,
        percentage: Math.round((warehouse.capacity.currentUsage / warehouse.capacity.totalCapacity) * 100)
      });
    }

    res.status(201).json({ success: true, message: "Purchase record created successfully", data: purchase });
  } catch (error) {
    console.error("Create purchase (alias) error:", error);
    console.error("Error details:", {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    res.status(500).json({ 
      success: false, 
      message: "Server error", 
      error: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// @route   GET /api/purchases/warehouse-capacity/:warehouseId
// @desc    Get warehouse capacity information
// @access  Public (for testing)
router.get("/warehouse-capacity/:warehouseId", async (req, res) => {
  try {
    console.log('📦 Warehouse capacity request:', req.params.warehouseId);
    
    const warehouse = await Warehouse.findById(req.params.warehouseId);
    if (!warehouse) {
      console.log('❌ Warehouse not found:', req.params.warehouseId);
      return res.status(404).json({
        success: false,
        message: "Warehouse not found"
      });
    }

    console.log('✅ Warehouse found:', warehouse.name);

    // Set default capacity if not set
    if (!warehouse.capacity) {
      warehouse.capacity = {
        totalCapacity: 1000,
        currentUsage: 0,
        unit: '50kg bags'
      };
      await warehouse.save();
      console.log('📦 Set default capacity for warehouse:', warehouse.name);
    }

    // Fix corrupted capacity data (currentUsage > totalCapacity)
    if (warehouse.capacity.currentUsage > warehouse.capacity.totalCapacity) {
      console.log('⚠️ Fixing corrupted capacity data:', {
        current: warehouse.capacity.currentUsage,
        total: warehouse.capacity.totalCapacity
      });
      warehouse.capacity.currentUsage = warehouse.capacity.totalCapacity;
      await warehouse.save();
      console.log('✅ Fixed corrupted capacity data');
    }

    const capacityInfo = {
      warehouseId: warehouse._id,
      warehouseName: warehouse.name,
      totalCapacity: warehouse.capacity?.totalCapacity || 1000,
      currentUsage: warehouse.capacity?.currentUsage || 0,
      availableCapacity: warehouse.capacity ? 
        Math.max(0, warehouse.capacity.totalCapacity - warehouse.capacity.currentUsage) : 1000,
      unit: warehouse.capacity?.unit || '50kg bags',
      capacityPercentage: warehouse.capacity ? 
        Math.round((warehouse.capacity.currentUsage / warehouse.capacity.totalCapacity) * 100) : 0,
      status: warehouse.capacity ? 
        (warehouse.capacity.currentUsage >= warehouse.capacity.totalCapacity ? 'Full' :
         warehouse.capacity.currentUsage >= warehouse.capacity.totalCapacity * 0.9 ? 'Near Full' :
         warehouse.capacity.currentUsage >= warehouse.capacity.totalCapacity * 0.75 ? 'High Usage' : 'Available') : 'Available'
    };

    console.log('📦 Capacity info:', capacityInfo);

    res.json({
      success: true,
      data: capacityInfo
    });
  } catch (error) {
    console.error("Get warehouse capacity error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching warehouse capacity",
      error: error.message
    });
  }
});

// @route   POST /api/purchases/reset-warehouse-capacity/:warehouseId
// @desc    Reset warehouse capacity to fix corrupted data
// @access  Public (for testing)
router.post("/reset-warehouse-capacity/:warehouseId", async (req, res) => {
  try {
    console.log('🔄 Resetting warehouse capacity:', req.params.warehouseId);
    
    const warehouse = await Warehouse.findById(req.params.warehouseId);
    if (!warehouse) {
      return res.status(404).json({
        success: false,
        message: "Warehouse not found"
      });
    }

    // Reset capacity to safe values
    warehouse.capacity = {
      totalCapacity: 1000,
      currentUsage: 0,
      unit: '50kg bags'
    };
    
    await warehouse.save();
    console.log('✅ Warehouse capacity reset:', warehouse.name);

    res.json({
      success: true,
      message: "Warehouse capacity reset successfully",
      data: {
        warehouseId: warehouse._id,
        warehouseName: warehouse.name,
        totalCapacity: warehouse.capacity.totalCapacity,
        currentUsage: warehouse.capacity.currentUsage,
        unit: warehouse.capacity.unit
      }
    });
  } catch (error) {
    console.error("Reset warehouse capacity error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while resetting warehouse capacity",
      error: error.message
    });
  }
});

// @route   GET /api/purchases
// @desc    Get all purchases with filtering and pagination - Base route
// @access  Private (Manager, Admin, Employee)
router.get("/", async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search,
      purchaseType,
      status,
      paymentStatus,
      warehouse,
      startDate,
      endDate
    } = req.query;

    // Build filter object
    const filter = {};

    if (search) {
      filter.$or = [
        { purchaseNumber: { $regex: search, $options: "i" } },
        { "supplier.name": { $regex: search, $options: "i" } },
        { notes: { $regex: search, $options: "i" } }
      ];
    }

    if (purchaseType && purchaseType !== "all") {
      filter.purchaseType = purchaseType;
    }

    if (status && status !== "all") {
      filter.status = status;
    }

    if (paymentStatus && paymentStatus !== "all") {
      filter.paymentStatus = paymentStatus;
    }

    if (warehouse && warehouse !== "all") {
      filter.warehouse = warehouse;
    }

    if (startDate && endDate) {
      filter.purchaseDate = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Get purchases with pagination
    const purchases = await Purchase.find(filter)
      .populate("warehouse", "name location")
      .populate("createdBy", "firstName lastName")
      .sort({ purchaseDate: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Get total count for pagination
    const total = await Purchase.countDocuments(filter);

    res.json({
      success: true,
      data: purchases,
      pagination: {
        current: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });

  } catch (error) {
    console.error("Get purchases error:", error);
    res.status(500).json({
        success: false,
        message: "Server error",
        error: error.message
      });
  }
});

// @route   GET /api/purchases/all
// @desc    Get all purchases with filtering and pagination - All route
// @access  Private (Manager, Admin, Employee)
router.get("/all", [
  authorize("Manager", "Admin", "Employee")
], async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search,
      purchaseType,
      status,
      paymentStatus,
      warehouse,
      startDate,
      endDate
    } = req.query;

    // Build filter object
    const filter = {};

    if (search) {
      filter.$or = [
        { purchaseNumber: { $regex: search, $options: "i" } },
        { "supplier.name": { $regex: search, $options: "i" } },
        { notes: { $regex: search, $options: "i" } }
      ];
    }

    if (purchaseType && purchaseType !== "all") {
      filter.purchaseType = purchaseType;
    }

    if (status && status !== "all") {
      filter.status = status;
    }

    if (paymentStatus && paymentStatus !== "all") {
      filter.paymentStatus = paymentStatus;
    }

    if (warehouse && warehouse !== "all") {
      filter.warehouse = warehouse;
    }

    if (startDate && endDate) {
      filter.purchaseDate = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Get purchases with pagination
    const purchases = await Purchase.find(filter)
      .populate("warehouse", "name location")
      .populate("createdBy", "firstName lastName")
      .sort({ purchaseDate: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Get total count for pagination
    const total = await Purchase.countDocuments(filter);

    res.json({
      success: true,
      data: purchases,
      pagination: {
        current: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });

  } catch (error) {
    console.error("Get purchases error:", error);
    res.status(500).json({
        success: false,
        message: "Server error",
        error: error.message
      });
  }
});

// @route   GET /api/purchases/:id
// @desc    Get single purchase record
// @access  Private (Manager, Admin, Employee)
router.get("/:id", [
  authorize("Manager", "Admin", "Employee")
], async (req, res) => {
  try {
    const purchase = await Purchase.findById(req.params.id)
      .populate("warehouse", "name location")
      .populate("createdBy", "firstName lastName");

    if (!purchase) {
      return res.status(404).json({
        success: false,
        message: "Purchase record not found"
      });
    }

    res.json({
      success: true,
      data: purchase
    });

  } catch (error) {
    console.error("Get purchase error:", error);
    res.status(500).json({
        success: false,
        message: "Server error",
        error: error.message
      });
  }
});

// @route   PUT /api/purchases/:id
// @desc    Update purchase record
// @access  Private (Manager, Admin)
router.put("/:id", [
  // authorize("Manager", "Admin"), // Temporarily disabled for testing
  body("purchaseNumber").optional().trim().notEmpty().withMessage("Purchase number cannot be empty"),
  body("supplier.name").optional().trim().notEmpty().withMessage("Supplier name cannot be empty")
], async (req, res) => {
  try {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    // Check if purchase exists
    const purchase = await Purchase.findById(req.params.id);
    if (!purchase) {
      return res.status(404).json({
        success: false,
        message: "Purchase record not found"
      });
    }

    // Handle status-only updates
    if (req.body.status && Object.keys(req.body).length === 1) {
      console.log('🔄 Status-only update:', req.params.id, 'to', req.body.status);
      
      const validStatuses = ['Pending', 'Received', 'In Transit', 'Delivered', 'Completed'];
      if (!validStatuses.includes(req.body.status)) {
        return res.status(400).json({
          success: false,
          message: "Invalid status. Must be one of: " + validStatuses.join(', ')
        });
      }

      const updatedPurchase = await Purchase.findByIdAndUpdate(
        req.params.id,
        { status: req.body.status },
        { new: true }
      ).populate('warehouse', 'name location')
       .populate('createdBy', 'firstName lastName');

      console.log('✅ Purchase status updated:', updatedPurchase._id, 'to', req.body.status);

      return res.json({
        success: true,
        message: "Purchase status updated successfully",
        data: updatedPurchase
      });
    }

    // Check if purchase number is being changed and if it already exists
    if (req.body.purchaseNumber && req.body.purchaseNumber !== purchase.purchaseNumber) {
      const existingPurchase = await Purchase.findOne({
        purchaseNumber: req.body.purchaseNumber,
        _id: { $ne: req.params.id }
      });
      if (existingPurchase) {
        return res.status(400).json({
          success: false,
          message: "Purchase number already exists"
        });
      }
    }

    // Update purchase record
    const updatedPurchase = await Purchase.findByIdAndUpdate(
      req.params.id,
      { ...req.body, updatedAt: new Date() },
      { new: true, runValidators: true }
    ).populate("warehouse", "name location")
     .populate("createdBy", "firstName lastName");

    res.json({
      success: true,
      message: "Purchase record updated successfully",
      data: updatedPurchase
    });

  } catch (error) {
    console.error("Update purchase error:", error);
    res.status(500).json({
        success: false,
        message: "Server error",
        error: error.message
      });
  }
});

// @route   PATCH /api/purchases/:id/receive
// @desc    Mark purchase as received
// @access  Private (Manager, Admin)
router.patch("/:id/receive", [
  authorize("Manager", "Admin")
], async (req, res) => {
  try {
    // Check if purchase exists
    const purchase = await Purchase.findById(req.params.id);
    if (!purchase) {
      return res.status(404).json({
        success: false,
        message: "Purchase record not found"
      });
    }

    // Mark as received
    await purchase.markAsReceived();

    res.json({
      success: true,
      message: "Purchase marked as received successfully",
      data: purchase
    });

  } catch (error) {
    console.error("Mark received error:", error);
    res.status(500).json({
        success: false,
        message: "Server error",
        error: error.message
      });
  }
});

// @route   PATCH /api/purchases/:id/payment
// @desc    Update payment information
// @access  Private (Manager, Admin)
router.patch("/:id/payment", [
  authorize("Manager", "Admin"),
  body("amount").isNumeric().withMessage("Payment amount must be a number"),
  body("paymentMethod").optional().isIn(["Cash", "Bank Transfer", "Cheque", "Credit"]).withMessage("Invalid payment method")
], async (req, res) => {
  try {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    // Check if purchase exists
    const purchase = await Purchase.findById(req.params.id);
    if (!purchase) {
      return res.status(404).json({
        success: false,
        message: "Purchase record not found"
      });
    }

    // Update payment
    if (req.body.paymentMethod) {
      purchase.paymentMethod = req.body.paymentMethod;
    }

    await purchase.updatePayment(req.body.amount);

    res.json({
      success: true,
      message: "Payment updated successfully",
      data: purchase
    });

  } catch (error) {
    console.error("Update payment error:", error);
    res.status(500).json({
        success: false,
        message: "Server error",
        error: error.message
      });
  }
});

// @route   GET /api/purchases/daily/:date
// @desc    Get daily purchase summary
// @access  Private (Manager, Admin, Employee)
router.get("/daily/:date", [
  authorize("Manager", "Admin", "Employee")
], async (req, res) => {
  try {
    const date = new Date(req.params.date);
    if (isNaN(date.getTime())) {
      return res.status(400).json({
        success: false,
        message: "Invalid date format"
      });
    }

    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const dailyPurchases = await Purchase.find({
      purchaseDate: {
        $gte: startOfDay,
        $lte: endOfDay
      }
    });

    // Calculate daily summary
    const dailySummary = {
      date: req.params.date,
      totalPurchases: dailyPurchases.length,
      totalAmount: dailyPurchases.reduce((sum, purchase) => sum + purchase.totalAmount, 0),
      purchaseTypes: dailyPurchases.reduce((acc, purchase) => {
        acc[purchase.purchaseType] = (acc[purchase.purchaseType] || 0) + 1;
        return acc;
      }, {}),
      purchases: dailyPurchases.map(purchase => ({
        purchaseNumber: purchase.purchaseNumber,
        purchaseType: purchase.purchaseType,
        supplierName: purchase.supplier.name,
        totalAmount: purchase.totalAmount,
        paymentStatus: purchase.paymentStatus,
        status: purchase.status
      }))
    };

    res.json({
      success: true,
      data: dailySummary
    });

  } catch (error) {
    console.error("Get daily purchases error:", error);
    res.status(500).json({
        success: false,
        message: "Server error",
        error: error.message
      });
  }
});

// @route   GET /api/purchases/bags/inventory
// @desc    Get bags inventory summary (FR 23)
// @access  Private (Manager, Admin, Employee)
router.get("/bags/inventory", [
  authorize("Manager", "Admin", "Employee")
], async (req, res) => {
  try {
    const bagsInventory = await Purchase.getBagsInventory();

    res.json({
      success: true,
      data: bagsInventory[0] || {
        totalAta: 0,
        totalMaida: 0,
        totalSuji: 0,
        totalFine: 0
      }
    });

  } catch (error) {
    console.error("Get bags inventory error:", error);
    res.status(500).json({
        success: false,
        message: "Server error",
        error: error.message
      });
  }
});

// @route   GET /api/purchases/overdue
// @desc    Get overdue payments
// @access  Private (Manager, Admin)
router.get("/overdue", [
  authorize("Manager", "Admin")
], async (req, res) => {
  try {
    const overduePurchases = await Purchase.getOverduePayments();

    res.json({
      success: true,
      data: overduePurchases
    });

  } catch (error) {
    console.error("Get overdue purchases error:", error);
    res.status(500).json({
        success: false,
        message: "Server error",
        error: error.message
      });
  }
});

// @route   DELETE /api/purchases/:id
// @desc    Delete purchase record (Admin only)
// @access  Private (Admin only)
router.delete("/:id", [
  authorize("Admin")
], async (req, res) => {
  try {
    const purchase = await Purchase.findById(req.params.id);
    if (!purchase) {
      return res.status(404).json({
        success: false,
        message: "Purchase record not found"
      });
    }

    await Purchase.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: "Purchase record deleted successfully"
    });

  } catch (error) {
    console.error("Delete purchase error:", error);
    res.status(500).json({
        success: false,
        message: "Server error",
        error: error.message
      });
  }
});


export default router;
