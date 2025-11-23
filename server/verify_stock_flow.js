import mongoose from "mongoose";
import dotenv from "dotenv";
import fs from "fs";
import User from "./model/user.js";
import Warehouse from "./model/wareHouse.js";
import Product from "./model/Product.js";
import Supplier from "./model/Supplier.js";
import CustomerNew from "./model/CustomerNew.js";
import Inventory from "./model/inventory.js";
import Stock from "./model/stock.js";
import GatePass from "./model/GatePass.js";
import Notification from "./model/Notification.js";
import BagPurchase from "./model/BagPurchase.js";
import Production from "./model/Production.js";
import Sale from "./model/Sale.js";
import { createProduction } from "./controller/productionController.js";
import { createSale } from "./controller/salesController.js";
import { createBagPurchase } from "./controller/bagPurchaseController.js";

dotenv.config();

// Mock Request and Response
const mockReq = (body, user) => ({
    body,
    user: user || { _id: "507f1f77bcf86cd799439011", firstName: "Test", lastName: "User", role: "Admin" },
    params: {}
});

const mockRes = () => {
    const res = {};
    res.statusCode = 200;
    res.data = null;
    res.status = (code) => {
        res.statusCode = code;
        return res;
    };
    res.json = (data) => {
        res.data = data;
        return res;
    };
    return res;
};

async function runVerification() {
    try {
        console.log("🚀 Starting Stock Flow Verification...");

        // Connect directly to LOCAL MongoDB to avoid DNS/Network issues
        const MONGO_URL = 'mongodb://localhost:27017/flourmill_test_flow';
        console.log(`🔗 Connecting to: ${MONGO_URL}`);

        await mongoose.connect(MONGO_URL, {
            serverSelectionTimeoutMS: 5000, // Fast fail
            socketTimeoutMS: 45000,
        });
        console.log("✅ Connected to MongoDB");

        // DROP DATABASE to ensure clean slate
        console.log("🗑️ Dropping test database...");
        await mongoose.connection.db.dropDatabase();
        console.log("✅ Database dropped.");

        // 1. Setup Test Data
        console.log("\n📝 Setting up test data...");

        const warehouse = new Warehouse({
            name: "Test Warehouse",
            location: "Test Location",
            capacity: { totalCapacity: 10000, currentUsage: 0 },
            status: "Active"
        });
        await warehouse.save();
        console.log(`✅ Created Warehouse: ${warehouse._id}`);

        const timestamp = Date.now().toString().slice(-8);
        const random = Math.floor(Math.random() * 100);

        // Wheat Product
        const wheatCode = `W-${timestamp}-${random}`;
        const wheatProduct = new Product({
            name: "Test Wheat",
            code: wheatCode,
            category: "Raw Materials",
            subcategory: "Wheat Grain",
            unit: "kg",
            weight: 1,
            minimumStock: 10,
            weightVariants: [
                { weight: 100, unit: "kg", isActive: true, price: 10000 },
                { weight: 50, unit: "kg", isActive: true, price: 5000 }
            ]
        });
        await wheatProduct.save();
        console.log(`✅ Created Wheat Product: ${wheatProduct._id} (Code: ${wheatCode})`);

        // Flour Product
        const flourCode = `F-${timestamp}-${random}`;
        const flourProduct = new Product({
            name: "Test Flour",
            code: flourCode,
            category: "Finished Goods",
            subcategory: "Flour",
            unit: "bags",
            weight: 20,
            minimumStock: 10
        });
        await flourProduct.save();
        console.log(`✅ Created Flour Product: ${flourProduct._id} (Code: ${flourCode})`);

        // 2. Test Bag Purchase (Add Stock)
        console.log("\n🧪 Test 1: Bag Purchase (Add Stock)");
        console.log("Registered models:", mongoose.modelNames());
        fs.writeFileSync('models.log', JSON.stringify(mongoose.modelNames(), null, 2));

        // Purchase 100 bags of 50kg Wheat = 5000kg
        const purchaseReq = mockReq({
            supplier: new mongoose.Types.ObjectId(), // Random supplier ID
            warehouse: warehouse._id,
            bags: {
                "Test Wheat": {
                    quantity: 100,
                    unit: "50kg bags",
                    unitPrice: 5000,
                    totalPrice: 500000
                }
            },
            paymentStatus: "Paid",
            paidAmount: 500000,
            status: "Received"
        });
        const purchaseRes = mockRes();

        await createBagPurchase(purchaseReq, purchaseRes);

        if (purchaseRes.statusCode === 201) {
            console.log("✅ Bag Purchase created successfully.");

            // Verify Inventory
            const wheatInventory = await Inventory.findOne({
                product: wheatProduct._id,
                warehouse: warehouse._id
            });

            if (wheatInventory) {
                console.log(`   Wheat Inventory Stock: ${wheatInventory.currentStock}`);
                if (wheatInventory.currentStock === 5000) { // 100 * 50 = 5000
                    console.log("✅ Bag Purchase: Stock addition correct (5000kg).");
                } else {
                    console.error(`❌ Bag Purchase: Stock addition incorrect. Expected 5000, got ${wheatInventory.currentStock}`);
                }
            } else {
                console.error("❌ Bag Purchase: Inventory record not found.");
            }
        } else {
            console.error("❌ Bag Purchase creation failed:", purchaseRes.data);
            fs.writeFileSync('failure_bag.json', JSON.stringify({ step: "BagPurchase", error: purchaseRes.data }, null, 2));
        }

        // 3. Test Production (Source -> Destination)
        console.log("\n🧪 Test 2: Production (Source -> Destination)");

        // Produce 200 bags of Flour (20kg each) = 4000kg output
        // Use 4200kg Wheat (200kg wastage)
        const prodReq = mockReq({
            sourceWarehouse: warehouse._id,
            destinationWarehouse: warehouse._id,
            wheatQuantity: 4200,
            outputProducts: [{
                productId: flourProduct._id,
                productName: "Test Flour",
                quantity: 200,
                weight: 20,
                unit: "bags"
            }],
            wastage: { quantity: 200, reason: "Processing Loss" }
        });
        const prodRes = mockRes();

        await createProduction(prodReq, prodRes);

        if (prodRes.statusCode === 201) {
            console.log("✅ Production created successfully.");

            // Verify Wheat Deduction
            const wheatInventoryAfter = await Inventory.findOne({
                product: wheatProduct._id,
                warehouse: warehouse._id
            });

            // Expected: 5000 - 4200 = 800
            console.log(`   Wheat Inventory After Production: ${wheatInventoryAfter.currentStock}`);
            if (wheatInventoryAfter.currentStock === 800) {
                console.log("✅ Production: Wheat deduction correct.");
            } else {
                console.error(`❌ Production: Wheat deduction incorrect. Expected 800, got ${wheatInventoryAfter.currentStock}`);
            }

            // Verify Flour Addition
            const flourInventory = await Inventory.findOne({
                product: flourProduct._id,
                warehouse: warehouse._id
            });

            if (flourInventory) {
                console.log(`   Flour Inventory Stock: ${flourInventory.currentStock}`);
                if (flourInventory.currentStock === 200) {
                    console.log("✅ Production: Flour addition correct.");
                } else {
                    console.error(`❌ Production: Flour addition incorrect. Expected 200, got ${flourInventory.currentStock}`);
                }
            } else {
                console.error("❌ Production: Flour inventory not found.");
            }

        } else {
            console.error("❌ Production creation failed:", prodRes.data);
            fs.writeFileSync('failure_prod.json', JSON.stringify({ step: "Production", error: prodRes.data }, null, 2));
        }

        // 4. Test Sale (Reduce Stock)
        console.log("\n🧪 Test 3: Sale (Reduce Stock)");

        // Sell 50 bags of Flour
        const saleReq = mockReq({
            customer: { name: "Test Customer" },
            warehouse: warehouse._id,
            items: [{
                product: flourProduct._id, // Using Product ID as expected by updated controller
                quantity: 50,
                unitPrice: 1000,
                unit: "bags"
            }],
            paymentMethod: "Cash",
            paidAmount: 50000
        });
        const saleRes = mockRes();

        try {
            await createSale(saleReq, saleRes);
        } catch (saleError) {
            console.error("❌ Sale creation threw error:", saleError);
            fs.writeFileSync('failure_sale.json', JSON.stringify({
                step: "Sale",
                error: saleError.message,
                stack: saleError.stack
            }, null, 2));
        }

        if (saleRes.statusCode === 201) {
            console.log("✅ Sale created successfully.");

            // Verify Flour Deduction
            const flourInventoryAfter = await Inventory.findOne({
                product: flourProduct._id,
                warehouse: warehouse._id
            });

            // Expected: 200 - 50 = 150
            console.log(`   Flour Inventory After Sale: ${flourInventoryAfter.currentStock}`);
            if (flourInventoryAfter.currentStock === 150) {
                console.log("✅ Sale: Stock deduction correct.");
            } else {
                console.error(`❌ Sale: Stock deduction incorrect. Expected 150, got ${flourInventoryAfter.currentStock}`);
            }
        } else {
            console.error("❌ Sale creation failed:", saleRes.data);
            fs.writeFileSync('failure_sale.json', JSON.stringify({ step: "Sale", error: saleRes.data }, null, 2));
        }

        console.log("\n🎉 Verification Complete!");
        process.exit(0);

    } catch (error) {
        const errorLog = `Verification Failed: ${error.message}\n` +
            (error.errors ? JSON.stringify(error.errors, null, 2) : '') +
            (error.stack ? `\nStack: ${error.stack}` : '');

        console.error(errorLog);
        fs.writeFileSync('verification_flow_error.log', errorLog);
        process.exit(1);
    }
}

runVerification();
