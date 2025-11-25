import BagPurchase from "../model/BagPurchase.js";
import mongoose from "mongoose";
import Product from "../model/Product.js";
import Inventory from "../model/inventory.js";
import Stock from "../model/stock.js";
import Warehouse from "../model/wareHouse.js";
import Supplier from "../model/Supplier.js";

/**
 * Controller to create a new bag purchase and update inventory/stock accordingly.
 */
export const createBagPurchase = async (req, res) => {
    try {
        const {
            bags,
            supplier,
            purchaseDate,
            status,
            paymentStatus,
            notes,
            warehouse,
            paidAmount
        } = req.body;

        // Validate warehouse
        let warehouseId;
        if (!warehouse || !mongoose.Types.ObjectId.isValid(warehouse)) {
            const fallback = await Warehouse.findOne({ status: "Active" });
            if (!fallback) {
                return res.status(400).json({ success: false, message: "Valid warehouse ID is required" });
            }
            console.log("⚠️ Using fallback warehouse", fallback._id);
            warehouseId = fallback._id;
        } else {
            warehouseId = new mongoose.Types.ObjectId(warehouse);
        }

        // Validate bags
        if (!bags || typeof bags !== "object" || Object.keys(bags).length === 0) {
            return res.status(400).json({ success: false, message: "At least one product is required" });
        }

        // Build a Map of productName -> bagData
        const bagsMap = new Map();
        Object.entries(bags).forEach(([productName, bagData]) => {
            if (bagData && bagData.quantity > 0) {
                bagsMap.set(productName, {
                    quantity: parseFloat(bagData.quantity) || 0,
                    unit: bagData.unit || "50kg bags",
                    unitPrice: parseFloat(bagData.unitPrice) || 0,
                    totalPrice: parseFloat(bagData.totalPrice) || 0
                });
            }
        });

        if (bagsMap.size === 0) {
            return res.status(400).json({ success: false, message: "At least one product with quantity > 0 is required" });
        }

        // Generate purchase number
        let purchaseNumber;
        try {
            const count = await BagPurchase.countDocuments();
            const now = new Date();
            const year = now.getFullYear();
            const month = String(now.getMonth() + 1).padStart(2, "0");
            const day = String(now.getDate()).padStart(2, "0");
            purchaseNumber = `BP-${year}${month}${day}-${String(count + 1).padStart(4, "0")}`;
        } catch (e) {
            purchaseNumber = `BP-${Date.now()}`;
        }

        // Create BagPurchase document
        const bagPurchaseData = {
            purchaseNumber,
            supplier: mongoose.isValidObjectId(supplier)
                ? new mongoose.Types.ObjectId(supplier)
                : new mongoose.Types.ObjectId("507f1f77bcf86cd799439011"),
            bags: bagsMap,
            purchaseDate: purchaseDate ? new Date(purchaseDate) : new Date(),
            status: ["Pending", "Received", "Cancelled", "Completed"].includes(status) ? status : "Pending",
            paymentStatus: ["Pending", "Partial", "Paid"].includes(paymentStatus) ? paymentStatus : "Pending",
            paidAmount: parseFloat(paidAmount) || 0,
            notes: notes || "",
            warehouse: warehouseId,
            createdBy: new mongoose.Types.ObjectId(req.user?._id || req.user?.id || "507f1f77bcf86cd799439011")
        };

        const newPurchase = new BagPurchase(bagPurchaseData);
        await newPurchase.save();

        // Process each bag entry
        const stockErrors = [];
        for (const [productName, bagData] of Object.entries(bags)) {
            try {
                const weight = parseFloat(bagData.unit?.match(/(\d+)kg/)?.[1] || 0);

                // Find product (optional for bags, but good for linking)
                let product = await Product.findOne({ name: { $regex: new RegExp(`^${productName}$`, "i") } });
                if (!product) {
                    product = await Product.findOne({ name: { $regex: new RegExp(productName, "i") } });
                }

                if (product) {
                    console.log(`✅ Found matching product in catalog: ${product.name}`);
                } else {
                    console.log(`ℹ️ Product "${productName}" not found in catalog. Will create standalone inventory.`);
                }

                // Validate weight variant if product exists
                if (product && weight && Array.isArray(product.weightVariants) && product.weightVariants.length) {
                    const variant = product.weightVariants.find(v => v.weight === weight && v.isActive !== false);
                    if (!variant) {
                        console.warn(`⚠️ Weight category ${weight}kg not found for product ${product.name}. Available variants: ${product.weightVariants.map(v => v.weight + 'kg').join(', ')}`);
                    } else {
                        console.log(`✅ Found matching weight variant: ${weight}kg for ${product.name}`);
                    }
                }

                // Find or create Inventory
                // Try to find by product ID first if available, otherwise by name
                let inventoryQuery = { warehouse: warehouseId };
                if (product) {
                    inventoryQuery.product = product._id;
                } else {
                    inventoryQuery.name = productName;
                    inventoryQuery.product = null; // Explicitly look for items without product link
                }

                let inventoryItem = await Inventory.findOne(inventoryQuery);

                if (!inventoryItem) {
                    // Double check by name if we looked by product ID and failed, or vice versa
                    // This helps prevent duplicates if data is inconsistent
                    if (product) {
                        const existingByName = await Inventory.findOne({ warehouse: warehouseId, name: productName });
                        if (existingByName) inventoryItem = existingByName;
                    }
                }

                if (!inventoryItem) {
                    inventoryItem = new Inventory({
                        product: product ? product._id : undefined,
                        warehouse: warehouseId,
                        currentStock: 0,
                        minimumStock: product?.minimumStock || 10,
                        status: "Active",
                        name: product ? product.name : productName,
                        code: product?.code || `BAG-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
                        category: "Packaging", // Force category for bags
                        subcategory: product?.subcategory || "Bags",
                        weight: weight || product?.weight || 0,
                        price: product?.price || parseFloat(bagData.unitPrice) || 0
                    });
                    await inventoryItem.save();
                    console.log(`✅ Created new inventory for ${inventoryItem.name}`);
                }

                // For bags, track by quantity (count), not by weight capacity
                const stockQuantity = parseFloat(bagData.quantity) || 0;

                // Create Stock movement
                console.log(`📝 Creating Stock movement for ${stockQuantity} ${bagData.unit}...`);
                const stockIn = new Stock({
                    inventoryItem: inventoryItem._id,
                    movementType: "in",
                    quantity: stockQuantity,
                    reason: `Bag Purchase - ${newPurchase.purchaseNumber}`,
                    referenceNumber: newPurchase.purchaseNumber,
                    warehouse: warehouseId,
                    createdBy: req.user?._id || req.user?.id || new mongoose.Types.ObjectId("507f1f77bcf86cd799439011")
                });

                console.log(`📝 Stock movement data:`, {
                    inventoryItem: stockIn.inventoryItem.toString(),
                    movementType: stockIn.movementType,
                    quantity: stockIn.quantity,
                    warehouse: stockIn.warehouse.toString(),
                    reason: stockIn.reason
                });

                await stockIn.save();
                console.log(`✅ Stock movement saved successfully (ID: ${stockIn._id})`);

                // Update inventory current stock explicitly as failsafe
                inventoryItem.currentStock = (inventoryItem.currentStock || 0) + stockQuantity;
                await inventoryItem.save();

                // Verify the inventory was updated
                const updatedInventory = await Inventory.findById(inventoryItem._id);
                console.log(`✅ Inventory currentStock after stock movement: ${updatedInventory.currentStock}`);
                console.log(`✅ Added ${stockQuantity} ${bagData.unit} of ${inventoryItem.name} to warehouse`);
            } catch (innerErr) {
                console.error(`❌ Error processing ${productName}:`, innerErr);
                console.error(`❌ Error stack:`, innerErr.stack);
                console.error(`❌ Error details:`, JSON.stringify(innerErr, null, 2));
                stockErrors.push(`Error processing ${productName}: ${innerErr.message}`);
            }
        }

        // Populate references
        await newPurchase.populate("supplier", "name contactPerson email phone");
        await newPurchase.populate("warehouse", "name location");
        await newPurchase.populate("createdBy", "firstName lastName");

        return res.status(201).json({
            success: true,
            message: stockErrors.length > 0 ? "Bag purchase created but with stock errors" : "Bag purchase created successfully",
            data: newPurchase,
            ...(stockErrors.length > 0 && { stockErrors })
        });
    } catch (err) {
        console.error("Create bag purchase error:", err);
        return res.status(500).json({ success: false, message: "Server error while creating bag purchase", error: err.message });
    }
};
