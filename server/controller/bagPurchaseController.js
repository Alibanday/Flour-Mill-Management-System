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

                // Find product
                let product = await Product.findOne({ name: { $regex: new RegExp(`^${productName}$`, "i") } });
                if (!product) {
                    product = await Product.findOne({ name: { $regex: new RegExp(productName, "i") } });
                }
                if (!product) {
                    const msg = `Product not found in catalog: ${productName}`;
                    console.error(msg);
                    stockErrors.push(msg);
                    continue;
                }

                // Validate weight variant
                if (weight && Array.isArray(product.weightVariants) && product.weightVariants.length) {
                    const variant = product.weightVariants.find(v => v.weight === weight && v.isActive !== false);
                    if (!variant) {
                        const msg = `Weight category ${weight}kg not found for product ${product.name}`;
                        console.error(msg);
                        stockErrors.push(msg);
                        continue;
                    }
                }

                // Find or create Inventory
                let inventoryItem = await Inventory.findOne({ product: product._id, warehouse: warehouseId });
                if (!inventoryItem) {
                    inventoryItem = new Inventory({
                        product: product._id,
                        warehouse: warehouseId,
                        currentStock: 0,
                        minimumStock: product.minimumStock || 10,
                        status: "Active",
                        name: product.name,
                        code: product.code,
                        category: product.category,
                        subcategory: product.subcategory,
                        weight: weight || product.weight || 0,
                        price: product.price || 0
                    });
                    await inventoryItem.save();
                    console.log(`✅ Created inventory for ${product.name}`);
                }

                // For bags, track by quantity (count), not by weight capacity
                // The 'weight' here refers to bag capacity (e.g., 50kg bag), not the weight of the bags themselves
                const stockQuantity = bagData.quantity; // Track bags by count

                // Create Stock movement
                const stockIn = new Stock({
                    inventoryItem: inventoryItem._id,
                    movementType: "in",
                    quantity: stockQuantity,
                    reason: `Bag Purchase - ${newPurchase.purchaseNumber}`,
                    referenceNumber: newPurchase.purchaseNumber,
                    warehouse: warehouseId,
                    createdBy: req.user?._id || req.user?.id || new mongoose.Types.ObjectId("507f1f77bcf86cd799439011")
                });
                await stockIn.save();

                console.log(`✅ Added ${bagData.quantity} ${bagData.unit} of ${product.name} to warehouse`);
            } catch (innerErr) {
                console.error(`❌ Error processing ${productName}:`, innerErr);
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
